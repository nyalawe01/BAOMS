import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  Wallet,
  Clock,
  ArrowRight,
  Check,
  X,
  FileCheck,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/ui/KPICard';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { AnalyticsVisualizer, AnalyticsDataPoint } from '@/components/ui/AnalyticsVisualizer';
import { getProjects } from '@/features/projects/services/projectService';
import { ProjectRecord } from '@/features/projects/types/project';
import { getRequisitions, reviewFinancialRequest } from '@/features/finance/services/financeService';
import { FinancialRequestRecord } from '@/features/finance/types/finance';
import { useAuth } from '@/features/auth/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ExecutiveApprovalModal } from '@/features/users/components/ExecutiveApprovalModal';
import { PendingUserCandidate } from '@/features/users/components/UserOnboardingReviewModal';

export const ExecutiveDirectorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [requisitions, setRequisitions] = useState<FinancialRequestRecord[]>([]);
  const [pendingStaffAuth, setPendingStaffAuth] = useState<PendingUserCandidate[]>([]);
  const [selectedStaffCandidate, setSelectedStaffCandidate] = useState<PendingUserCandidate | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  // Table filtering and pagination state
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const loadData = async () => {
    try {
      const [pList, rList] = await Promise.all([
        getProjects(),
        getRequisitions(),
      ]);
      setProjects(pList);
      setRequisitions(rList);

      if (isSupabaseConfigured) {
        const { data: staffData } = await supabase
          .from('profiles')
          .select('id, display_name, official_email, phone_number, approval_status, staged_details, created_at')
          .eq('approval_status', 'pending_ed')
          .order('created_at', { ascending: false });

        setPendingStaffAuth(
          (staffData || []).map((row: any) => ({
            id: row.id,
            email: row.official_email || '',
            displayName: row.display_name || '',
            phoneNumber: row.phone_number || '',
            approvalStatus: row.approval_status,
            stagedDetails: row.staged_details || {},
            createdAt: row.created_at,
          }))
        );
      }
    } catch (e) {
      console.error('Failed loading director telemetry:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Strategic approvals: items requiring Director authorization
  const pendingApprovals = requisitions.filter(
    (r) => r.status === 'submitted' || r.status === 'under_review'
  );

  const totalPortfolioBudget = projects.reduce((acc, p) => acc + p.totalBudget, 0);
  const totalSpentBudget = projects.reduce((acc, p) => acc + (p.budgetSummary?.totalSpent || 0), 0);
  const activeProjectsCount = projects.filter((p) => p.status === 'active').length;

  const handleApprove = async (req: FinancialRequestRecord) => {
    if (req.requesterId === user?.id) {
      Swal.fire({
        title: 'Self-Approval Restricted',
        text: 'Executive Directors cannot authorize their own requests. A designated secondary signatory must review this requisition.',
        icon: 'warning',
        confirmButtonColor: '#D68904',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Approve Financial Requisition?',
      text: `Authorize disbursement of ${req.currency} ${req.totalAmount.toLocaleString()} for "${req.title}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Authorize Request',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await reviewFinancialRequest(
          req.id,
          {
            action: 'approved',
            comments: `Formally signed off by Executive Director (${user?.email || 'Executive Office'})`,
          },
          {
            id: user?.id || '',
            name: user?.name || user?.email || 'Executive Director',
            role: 'executive_director',
          }
        );
        await Swal.fire({
          title: 'Authorized!',
          text: `Requisition ${req.requestNumber} has been approved for disbursement.`,
          icon: 'success',
          confirmButtonColor: '#D68904',
        });
        loadData();
      } catch (err: any) {
        Swal.fire({
          title: 'Approval Failed',
          text: err.message || 'Could not record approval.',
          icon: 'error',
          confirmButtonColor: '#D68904',
        });
      }
    }
  };

  const handleReject = async (req: FinancialRequestRecord) => {
    const { value: comment } = await Swal.fire({
      title: 'Reject Requisition',
      input: 'textarea',
      inputLabel: 'Reason for Rejection / Return',
      inputPlaceholder: 'Enter executive remarks or required revisions...',
      inputValidator: (value) => {
        if (!value) return 'Please provide an explanatory remark for the audit trail.';
      },
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Reject Requisition',
    });

    if (comment) {
      try {
        await reviewFinancialRequest(
          req.id,
          {
            action: 'rejected',
            comments: comment,
          },
          {
            id: user?.id || '',
            name: user?.name || user?.email || 'Executive Director',
            role: 'executive_director',
          }
        );
        await Swal.fire({
          title: 'Rejected',
          text: `Requisition ${req.requestNumber} was rejected.`,
          icon: 'info',
          confirmButtonColor: '#D68904',
        });
        loadData();
      } catch (err: any) {
        Swal.fire({
          title: 'Operation Failed',
          text: err.message || 'Could not record rejection.',
          icon: 'error',
          confirmButtonColor: '#D68904',
        });
      }
    }
  };

  // Chart data: Budget allocation per project
  const chartData: AnalyticsDataPoint[] = useMemo(() => {
    return projects.slice(0, 6).map((p) => ({
      label: p.projectCode || p.name.substring(0, 12),
      value: Math.round(p.totalBudget / 1000000),
      description: `${p.name} (${p.currency} ${(p.totalBudget / 1000000).toFixed(1)}M)`,
    }));
  }, [projects]);

  // Filtered projects for table
  const filteredProjects = useMemo(() => {
    if (!tableSearch.trim()) return projects;
    const q = tableSearch.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.funder.toLowerCase().includes(q)
    );
  }, [projects, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Top Header - AdminCN Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('director.overview', 'Executive Overview')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Institutional portfolio oversight, strategic approval queue, and program health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            Fiscal Year 2026
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
            <Briefcase className="h-3.5 w-3.5 mr-1.5" />
            {t('director.viewReports', 'Reports')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/correspondence')}>
            {t('director.viewLetters', 'Correspondence')}
          </Button>
        </div>
      </div>

      {/* Row 1: Four Compact KPI Cards (AdminCN Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Active Projects"
          value={activeProjectsCount}
          subValue={`/ ${projects.length} Total`}
          change={{
            value: `${projects.length > 0 ? Math.round((activeProjectsCount / projects.length) * 100) : 0}% Active`,
            isPositive: true,
            label: 'in field execution',
          }}
          icon={Briefcase}
        />

        <KPICard
          label="Budget Portfolio"
          value={`TZS ${(totalPortfolioBudget / 1000000).toFixed(1)}M`}
          change={{
            value: totalSpentBudget > 0 ? `${((totalSpentBudget / totalPortfolioBudget) * 100).toFixed(1)}% spent` : 'Allocated',
            isPositive: true,
            label: 'donor grant pool',
          }}
          icon={Wallet}
        />

        <KPICard
          label="Pending Approvals"
          value={pendingApprovals.length}
          change={{
            value: pendingApprovals.length > 0 ? `${pendingApprovals.length} Queue` : 'Clear',
            isPositive: pendingApprovals.length === 0,
            label: pendingApprovals.length > 0 ? 'requisitions awaiting sign-off' : 'all items approved',
          }}
          icon={Clock}
        />

        <KPICard
          label="Staff Clearances"
          value={pendingStaffAuth.length}
          change={{
            value: pendingStaffAuth.length > 0 ? `${pendingStaffAuth.length} Vetted` : 'Clear',
            isPositive: pendingStaffAuth.length === 0,
            label: pendingStaffAuth.length > 0 ? 'awaiting ED clearance' : 'all staff cleared',
          }}
          icon={ShieldCheck}
        />
      </div>

      {/* Row 2: Analytics Panel (2/3 width) + Strategic Approvals Queue (1/3 width) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Project Performance Panel */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white border border-slate-200/80 rounded-lg overflow-hidden flex flex-col shadow-xs">
          <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#D68904]" />
                Approved Project Budget Allocations (Millions TZS)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Relative financial commitment per donor-funded program
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              Details <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-center">
            {chartData.length > 0 ? (
              <AnalyticsVisualizer
                data={chartData}
                valuePrefix="TZS "
                valueSuffix="M"
                defaultMode="bar"
                availableModes={['bar', 'line', 'table']}
                height={230}
              />
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No active project financial records available to display.
              </div>
            )}
          </div>
        </div>

        {/* Strategic Approvals Attention-Required Panel */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200/80 rounded-lg overflow-hidden flex flex-col shadow-xs">
          <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-slate-700" />
                Strategic Approvals Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Awaiting your executive sign-off
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/finance')}>
              All <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[320px]">
            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No requisitions currently awaiting executive authorization.
              </div>
            ) : (
              pendingApprovals.slice(0, 5).map((req) => (
                <div key={req.id} className="p-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        {req.title}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {req.requestNumber} • {req.requesterName}
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                        {req.currency} {req.totalAmount.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {req.requesterId === user?.id ? (
                        <span className="text-[10px] text-slate-400 italic">
                          Self-initiated
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(req)}
                            className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Approve"
                            aria-label="Approve"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(req)}
                            className="p-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                            title="Reject"
                            aria-label="Reject"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Staff Clearances Awaiting Authorization (AdminCN Card Panel) */}
      {pendingStaffAuth.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-lg overflow-hidden shadow-xs">
          <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#D68904]" />
                Staff Registrations Vetted by HR (Awaiting Executive Clearance)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Human Resources has validated credentials. Click Authorize to activate system access.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
              Manage All <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Official Email</th>
                  <th className="py-2.5 px-4">Staged Role & Dept</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingStaffAuth.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {candidate.displayName}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">
                      {candidate.email}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      <span className="font-medium text-slate-900">
                        {candidate.stagedDetails?.jobTitle || candidate.stagedDetails?.roleCode?.replace(/_/g, ' ') || 'Staff Member'}
                      </span>{' '}
                      <span className="text-slate-400">
                        ({candidate.stagedDetails?.departmentName || candidate.stagedDetails?.departmentCode || 'BAO'})
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setSelectedStaffCandidate(candidate);
                          setIsApprovalModalOpen(true);
                        }}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                        Authorize
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Row 4: Program Portfolio Table (AdminCN Data Table with Search & Pagination) */}
      <div className="bg-white border border-slate-200/80 rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Strategic Program Delivery & Budget Portfolio
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Current active donor contracts, implementation status, and allocated funds
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search programs..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
              All Projects <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-2.5 px-4">Project Code & Name</th>
                <th className="py-2.5 px-4">Funding Partner</th>
                <th className="py-2.5 px-4">Implementation Period</th>
                <th className="py-2.5 px-4 text-right">Total Budget</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No programs matched the current query.
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 leading-snug">{p.name}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">{p.projectCode}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {p.funder}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {p.startDate} — {p.endDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {p.currency} {p.totalBudget.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <StatusIndicator status={p.status} label={p.status.toUpperCase()} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Bar (AdminCN Style) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/80 bg-white text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredProjects.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-semibold text-slate-800">{Math.min(currentPage * pageSize, filteredProjects.length)}</span> of{' '}
            <span className="font-semibold text-slate-800">{filteredProjects.length}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
                  pg === currentPage
                    ? 'bg-[#D68904] text-white font-semibold'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ExecutiveApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        user={selectedStaffCandidate}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};
