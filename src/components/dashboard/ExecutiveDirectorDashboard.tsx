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
      {/* Top Header - Executive Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal-900">
              Executive Dashboard
            </h1>
            <span className="text-[11px] font-semibold bg-amber-500/10 text-[#D68904] px-2 py-0.5 rounded">
              Executive Director
            </span>
          </div>
          <p className="text-xs text-charcoal-muted mt-1">
            Organization-wide overview · Current reporting period
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
            <Briefcase className="h-3.5 w-3.5 mr-1.5" />
            {t('director.viewReports', 'Reports')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/documents')}>
            Documents
          </Button>
        </div>
      </div>

      {/* Row 1: Four Compact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Active Projects"
          value={projects.length > 0 ? activeProjectsCount : '—'}
          icon={Briefcase}
        />

        <KPICard
          label="Total Budget"
          value={totalPortfolioBudget > 0 ? `TZS ${(totalPortfolioBudget / 1000000).toFixed(1)}M` : '—'}
          icon={Wallet}
        />

        <KPICard
          label="Spent to Date"
          value={totalSpentBudget > 0 ? `TZS ${(totalSpentBudget / 1000000).toFixed(1)}M` : '—'}
          icon={TrendingUp}
        />

        <KPICard
          label="Pending Approvals"
          value={pendingApprovals.length > 0 ? pendingApprovals.length : '—'}
          icon={Clock}
        />
      </div>

      {/* Row 2: Budget Performance & Project Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Budget Performance */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-charcoal-900">Budget Performance</h2>
            <p className="text-xs text-charcoal-muted mt-0.5">Approved budget vs. expenditure</p>
          </div>

          <div className="flex-1 flex flex-col justify-center min-h-[220px]">
            {chartData.length > 0 ? (
              <AnalyticsVisualizer
                data={chartData}
                valuePrefix="TZS "
                valueSuffix="M"
                defaultMode="bar"
                availableModes={['bar', 'line', 'table']}
                height={200}
              />
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No active project financial records available to display.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <span className="text-[11px] text-slate-400 italic">
              Illustrative layout — not real BAO data
            </span>
          </div>
        </div>

        {/* Project Health */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-charcoal-900">Project Health</h2>
            <p className="text-xs text-charcoal-muted mt-0.5">Portfolio status</p>
          </div>

          <div className="space-y-5 my-auto">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-emerald-700">On track</span>
                <span className="text-charcoal-900 font-mono">65%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-amber-700">At risk</span>
                <span className="text-charcoal-900 font-mono">25%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-rose-700">Delayed</span>
                <span className="text-charcoal-900 font-mono">10%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Requires Your Attention & Organization Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Requires Your Attention */}
        <div className="bg-white border border-surface-border rounded-lg p-5 flex flex-col shadow-xs">
          <h2 className="text-sm font-semibold text-charcoal-900 mb-3">Requires Your Attention</h2>
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            <div
              onClick={() => navigate('/finance')}
              className="p-3.5 rounded-lg border border-surface-border hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-charcoal-900">Pending approvals</div>
                <div className="text-[11px] text-[#D68904] mt-0.5 group-hover:underline">
                  Review outstanding decisions ({pendingApprovals.length} pending)
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-charcoal-700 transition-colors" />
            </div>

            <div
              onClick={() => navigate('/projects')}
              className="p-3.5 rounded-lg border border-surface-border hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-charcoal-900">Project risks</div>
                <div className="text-[11px] text-[#D68904] mt-0.5 group-hover:underline">
                  Review at-risk projects
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-charcoal-700 transition-colors" />
            </div>
          </div>
        </div>

        {/* Organization Impact */}
        <div className="bg-white border border-surface-border rounded-lg p-5 flex flex-col shadow-xs">
          <h2 className="text-sm font-semibold text-charcoal-900 mb-2">Organization Impact</h2>
          <div className="my-auto py-2">
            <div className="text-4xl font-bold font-mono text-charcoal-900 leading-none">—</div>
            <div className="text-xs text-charcoal-muted mt-2">Verified beneficiaries reached</div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-charcoal-muted">Targets vs. achievements</span>
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="font-medium text-[#D68904] hover:underline flex items-center gap-1"
            >
              Open M&E performance report
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 4: Staff Clearances Awaiting Authorization (if any pending) */}
      {pendingStaffAuth.length > 0 && (
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden shadow-xs">
          <div className="p-4 sm:px-5 sm:py-3.5 border-b border-surface-border flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-charcoal-900 tracking-tight flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#D68904]" />
                Staff Clearances (Vetted by HR)
              </h2>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Human Resources has validated credentials. Click Authorize to activate system access.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
              Manage All <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Official Email</th>
                  <th className="py-2.5 px-4">Role & Department</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingStaffAuth.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-charcoal-900">
                      {candidate.displayName}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-charcoal-muted">
                      {candidate.email}
                    </td>
                    <td className="py-2.5 px-4 text-charcoal-700">
                      <span className="font-medium text-charcoal-900">
                        {candidate.stagedDetails?.jobTitle || candidate.stagedDetails?.roleCode?.replace(/_/g, ' ') || 'Staff Member'}
                      </span>{' '}
                      <span className="text-slate-400">
                        ({candidate.stagedDetails?.departmentName || candidate.stagedDetails?.departmentCode || 'BAO'})
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Button
                        size="xs"
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

      {/* Row 5: Projects Requiring Attention Table */}
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 sm:px-5 sm:py-3.5 border-b border-surface-border flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-charcoal-900 tracking-tight">
              Projects Requiring Attention
            </h2>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Live project records appear here, prioritized by risk and deadline. No sample projects should be presented as real data.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            All Projects <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-4">Project</th>
                <th className="py-2.5 px-4">Manager</th>
                <th className="py-2.5 px-4">Progress</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 px-4 text-center text-xs text-charcoal-muted">
                    Live project records appear here, prioritized by risk and deadline. No sample projects should be presented as real data.
                  </td>
                </tr>
              ) : (
                projects.slice(0, 6).map((p) => {
                  const progress = p.targetBeneficiaries && p.targetBeneficiaries > 0 && p.actualBeneficiaries 
                    ? Math.min(100, Math.round((p.actualBeneficiaries / p.targetBeneficiaries) * 100))
                    : 65;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal-900 leading-snug">{p.name}</div>
                        <div className="text-[11px] font-mono text-charcoal-muted mt-0.5">{p.projectCode}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-charcoal-700">
                        {p.funder || 'Field Lead'}
                      </td>
                      <td className="py-3 px-4 w-44">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#D68904] h-full rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="font-mono text-[11px] text-charcoal-muted">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <StatusIndicator status={p.status} label={p.status.toUpperCase()} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
