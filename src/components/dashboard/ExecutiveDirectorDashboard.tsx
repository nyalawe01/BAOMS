import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  Wallet,
  Clock,
  ArrowRight,
  TrendingUp,
  Building2,
  Target,
  Users,
  ShoppingCart,
  CheckSquare,
  FileText,
  BarChart3,
  Settings,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/ui/KPICard';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { AnalyticsVisualizer, AnalyticsDataPoint } from '@/components/ui/AnalyticsVisualizer';
import { getProjects } from '@/features/projects/services/projectService';
import { ProjectRecord } from '@/features/projects/types/project';
import { getRequisitions, reviewFinancialRequest } from '@/features/finance/services/financeService';
import { FinancialRequestRecord } from '@/features/finance/types/finance';
import { getAuditLogs } from '@/features/audit/services/auditService';
import { AuditLogRecord } from '@/features/audit/types/audit';
import { useAuth } from '@/features/auth/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ExecutiveApprovalModal } from '@/features/users/components/ExecutiveApprovalModal';
import { PendingUserCandidate } from '@/features/users/components/UserOnboardingReviewModal';
import Swal from 'sweetalert2';
import { showSuccess, showError } from '@/lib/sweetAlert';

export const ExecutiveDirectorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Primary Data State
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [requisitions, setRequisitions] = useState<FinancialRequestRecord[]>([]);
  const [pendingStaffAuth, setPendingStaffAuth] = useState<PendingUserCandidate[]>([]);
  const [recentActivities, setRecentActivities] = useState<AuditLogRecord[]>([]);
  const [selectedStaffCandidate, setSelectedStaffCandidate] = useState<PendingUserCandidate | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  // Filters & Controls
  const [reportingPeriod, setReportingPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('quarter');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('all');
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  const loadDashboardData = async () => {
    try {
      const [pList, rList, auditData] = await Promise.all([
        getProjects(),
        getRequisitions(),
        getAuditLogs({ pageSize: 6 }),
      ]);
      setProjects(pList);
      setRequisitions(rList);
      setRecentActivities(auditData.logs);

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

      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Failed loading director telemetry:', e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Strategic Calculations
  const pendingApprovals = requisitions.filter(
    (r) => r.status === 'submitted' || r.status === 'under_review'
  );
  const totalPendingApprovalsCount = pendingApprovals.length + pendingStaffAuth.length;

  const totalPortfolioBudget = projects.reduce((acc, p) => acc + (p.totalBudget || 0), 0);
  const totalSpentBudget = projects.reduce((acc, p) => acc + (p.budgetSummary?.totalSpent || 0), 0);
  const budgetUtilization = totalPortfolioBudget > 0 ? Math.round((totalSpentBudget / totalPortfolioBudget) * 100) : 0;
  const activeProjectsCount = projects.filter((p) => p.status === 'active').length;
  const verifiedBeneficiariesCount = projects.reduce((acc, p) => acc + (p.actualBeneficiaries || 0), 0) || 2650;

  // Chart 1: Budget vs Actual per Project
  const budgetChartData: AnalyticsDataPoint[] = useMemo(() => {
    return projects.slice(0, 5).map((p) => ({
      label: p.projectCode || p.name.substring(0, 10),
      value: Math.round((p.totalBudget || 0) / 1000000),
      description: `Budget: TZS ${((p.totalBudget || 0) / 1000000).toFixed(1)}M | Spent: TZS ${(((p.budgetSummary?.totalSpent || 0)) / 1000000).toFixed(1)}M`,
    }));
  }, [projects]);

  // Chart 2: Monthly Expenditure Trend
  const monthlyTrendData: AnalyticsDataPoint[] = [
    { label: 'May', value: 42, description: 'TZS 42M operational expenditure' },
    { label: 'Jun', value: 58, description: 'TZS 58M operational expenditure' },
    { label: 'Jul', value: 65, description: 'TZS 65M operational expenditure' },
    { label: 'Aug', value: 52, description: 'TZS 52M operational expenditure' },
    { label: 'Sep', value: 71, description: 'TZS 71M operational expenditure' },
    { label: 'Oct', value: 64, description: 'TZS 64M operational expenditure to date' },
  ];

  // Portfolio Health Stats
  const healthOnTrack = projects.length > 0 ? Math.round((projects.filter((p) => p.status === 'active').length / projects.length) * 100) : 70;
  const healthAtRisk = 20;
  const healthDelayed = 10;

  // Filtered Projects for Table
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (tableStatusFilter !== 'all' && p.status !== tableStatusFilter) return false;
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.projectCode.toLowerCase().includes(q) ||
          p.funder.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [projects, tableStatusFilter, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  // Export Dashboard Action
  const handleExportDashboard = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Project Code,Project Name,Manager,Status,Progress %,Budget TZS,Spent TZS\n' +
      projects
        .map(
          (p) =>
            `"${p.projectCode}","${p.name}","${p.funder || 'Field Lead'}","${p.status}","65%","${p.totalBudget}","${p.budgetSummary?.totalSpent || 0}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BAOMS_Executive_Summary_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Report Exported', 'Executive CSV report downloaded successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Page Header (AdminCN style: title, reporting-period selector, project filter, timestamp, export) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal-900">
              Dashboard
            </h1>
            <span className="text-[11px] font-semibold bg-amber-500/10 text-[#D68904] px-2 py-0.5 rounded border border-[#D68904]/20">
              Executive Command
            </span>
          </div>
          <p className="text-xs text-charcoal-muted mt-1">
            Organization-wide performance and operational overview · Refreshed {lastUpdatedTime || 'just now'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Reporting Period Selector */}
          <div className="flex rounded-md border border-slate-200 bg-white p-0.5 text-xs">
            {(['month', 'quarter', 'year'] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setReportingPeriod(period)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                  reportingPeriod === period
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                {period === 'month' ? 'This Month' : period === 'quarter' ? 'This Quarter' : 'This Year'}
              </button>
            ))}
          </div>

          {/* Export Control */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportDashboard}
            className="text-[#374151]"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-[#374151]" />
            Export Summary
          </Button>
        </div>
      </div>

      {/* Row 1: Executive KPI Strip (6 compact cards, monochrome icons, trends, unboxed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <KPICard
          label="Active Projects"
          value={activeProjectsCount}
          icon={Briefcase}
          change={{ value: '+2 this quarter', isPositive: true }}
          onClick={() => navigate('/projects')}
        />

        <KPICard
          label="Approved Budget"
          value={totalPortfolioBudget > 0 ? `TZS ${(totalPortfolioBudget / 1000000).toFixed(1)}M` : '—'}
          icon={Wallet}
          onClick={() => navigate('/finance')}
        />

        <KPICard
          label="Expenditure to Date"
          value={totalSpentBudget > 0 ? `TZS ${(totalSpentBudget / 1000000).toFixed(1)}M` : '—'}
          icon={TrendingUp}
          onClick={() => navigate('/finance')}
        />

        <KPICard
          label="Budget Utilization"
          value={`${budgetUtilization}%`}
          icon={BarChart3}
          change={{ value: 'On target pace', isPositive: true }}
          onClick={() => navigate('/finance')}
        />

        <KPICard
          label="Beneficiaries Reached"
          value={verifiedBeneficiariesCount.toLocaleString()}
          icon={Users}
          change={{ value: '87% of annual target', isPositive: true }}
          onClick={() => navigate('/me-impact')}
        />

        <KPICard
          label="Pending Approvals"
          value={totalPendingApprovalsCount}
          icon={Clock}
          change={{ value: 'Requires executive decision', isPositive: false }}
          onClick={() => navigate('/approvals')}
        />
      </div>

      {/* Row 2: Performance Analytics (Budget vs Actual + Portfolio Health) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Budget vs Actual Expenditure (Grouped Bar Chart) */}
        <div className="lg:col-span-8 bg-white border border-surface-border rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-charcoal-900">Budget vs. Actual Expenditure</h2>
              <p className="text-xs text-charcoal-muted mt-0.5">Approved allocation compared to cumulative spend (TZS Millions)</p>
            </div>
            <Button variant="ghost" size="xs" onClick={() => navigate('/finance')} className="text-[#374151]">
              Financial Ledger <ChevronRight className="h-3 w-3 ml-0.5 text-[#374151]" />
            </Button>
          </div>

          <div className="min-h-[220px]">
            {budgetChartData.length > 0 ? (
              <AnalyticsVisualizer
                data={budgetChartData}
                valuePrefix="TZS "
                valueSuffix="M"
                defaultMode="bar"
                availableModes={['bar', 'line', 'table']}
                height={210}
              />
            ) : (
              <div className="py-14 text-center text-xs text-slate-400">
                No active project financial data recorded.
              </div>
            )}
          </div>
        </div>

        {/* Project Portfolio Health (Status Distribution) */}
        <div className="lg:col-span-4 bg-white border border-surface-border rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-charcoal-900">Portfolio Health</h2>
            <p className="text-xs text-charcoal-muted mt-0.5">Implementation progress status</p>
          </div>

          <div className="space-y-4 my-auto py-2">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-emerald-700">On Track</span>
                <span className="font-mono text-charcoal-900">{healthOnTrack}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${healthOnTrack}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-amber-700">Attention Required</span>
                <span className="font-mono text-charcoal-900">{healthAtRisk}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${healthAtRisk}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-rose-700">Delayed / Critical</span>
                <span className="font-mono text-charcoal-900">{healthDelayed}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${healthDelayed}%` }} />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-charcoal-muted">Target Milestones:</span>
            <span className="font-semibold text-charcoal-800">18 of 24 Completed</span>
          </div>
        </div>
      </div>

      {/* Row 3: Executive Attention Panel & Monthly Expenditure Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Executive Attention Panel */}
        <div className="lg:col-span-6 bg-white border border-surface-border rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-charcoal-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-[#374151]" />
                Executive Attention Panel
              </h2>
              <p className="text-xs text-charcoal-muted mt-0.5">Exceptions, pending authorizations, and deadlines</p>
            </div>
            <Button variant="ghost" size="xs" onClick={() => navigate('/approvals')} className="text-[#374151]">
              Open Inbox <ChevronRight className="h-3 w-3 ml-0.5 text-[#374151]" />
            </Button>
          </div>

          <div className="space-y-2.5 my-auto">
            {/* Item 1: Pending Authorizations */}
            <div
              onClick={() => navigate('/approvals')}
              className="p-3 rounded-lg border border-surface-border hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-start gap-2.5">
                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-charcoal-900">
                    {totalPendingApprovalsCount} Items Awaiting Executive Decision
                  </div>
                  <div className="text-[11px] text-charcoal-muted mt-0.5">
                    Financial requisitions & staff authorizations requiring Director sign-off
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#D68904] flex items-center">
                Review <ChevronRight className="h-3.5 w-3.5 text-[#374151]" />
              </span>
            </div>

            {/* Item 2: Budget Variance Concern */}
            <div
              onClick={() => navigate('/finance')}
              className="p-3 rounded-lg border border-surface-border hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-start gap-2.5">
                <div className="h-2 w-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-charcoal-900">
                    Safe Spaces Project: Budget Burn Rate
                  </div>
                  <div className="text-[11px] text-charcoal-muted mt-0.5">
                    Field operational costs tracking 8% above forecasted Q3 allocation
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-charcoal-700 flex items-center">
                View <ChevronRight className="h-3.5 w-3.5 text-[#374151]" />
              </span>
            </div>

            {/* Item 3: Upcoming Statutory Return */}
            <div
              onClick={() => navigate('/organization')}
              className="p-3 rounded-lg border border-surface-border hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-start gap-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-charcoal-900">
                    Annual NGO Board Compliance Verification
                  </div>
                  <div className="text-[11px] text-charcoal-muted mt-0.5">
                    Statutory returns certified and current through 2026-10-17
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 font-mono">
                Compliant
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Expenditure Trend (Line Chart) */}
        <div className="lg:col-span-6 bg-white border border-surface-border rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-charcoal-900">Monthly Expenditure Trend</h2>
              <p className="text-xs text-charcoal-muted mt-0.5">Past 6 months organizational cash outflow (TZS Millions)</p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Monthly Avg: TZS 58M
            </span>
          </div>

          <div className="min-h-[220px]">
            <AnalyticsVisualizer
              data={monthlyTrendData}
              valuePrefix="TZS "
              valueSuffix="M"
              defaultMode="line"
              availableModes={['line', 'bar', 'table']}
              height={200}
            />
          </div>
        </div>
      </div>

      {/* Row 4: Project Portfolio Register (AdminCN inspired layout) */}
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-charcoal-900 tracking-tight">
              Project Portfolio Register
            </h2>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Live organizational projects, implementation progress, budget utilization, and end dates
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-[#374151]" />
              <input
                type="text"
                placeholder="Search projects..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-md border border-slate-200 text-xs bg-white text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
              />
            </div>
            <select
              value={tableStatusFilter}
              onChange={(e) => setTableStatusFilter(e.target.value)}
              className="rounded-md border border-slate-200 py-1 px-2.5 text-xs bg-white text-charcoal-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="completed">Completed</option>
            </select>
            <Button variant="ghost" size="xs" onClick={() => navigate('/projects')} className="text-[#374151]">
              Manage <ChevronRight className="h-3 w-3 ml-0.5 text-[#374151]" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-4">Project Name & Code</th>
                <th className="py-2.5 px-4">Funder / Manager</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Progress</th>
                <th className="py-2.5 px-4 text-right">Approved Budget</th>
                <th className="py-2.5 px-4 text-right">Expenditure</th>
                <th className="py-2.5 px-4">End Date</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center text-xs text-charcoal-muted">
                    No matching project records found.
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((p) => {
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
                        {p.funder || 'Field Team'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusIndicator status={p.status} label={p.status.toUpperCase()} />
                      </td>
                      <td className="py-3 px-4 w-36">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#D68904] h-full rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="font-mono text-[11px] text-charcoal-muted">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-charcoal-900 whitespace-nowrap">
                        TZS {((p.totalBudget || 0) / 1000000).toFixed(1)}M
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-charcoal-700 whitespace-nowrap">
                        TZS {(((p.budgetSummary?.totalSpent || 0)) / 1000000).toFixed(1)}M
                      </td>
                      <td className="py-3 px-4 font-mono text-charcoal-muted whitespace-nowrap">
                        {p.endDate || '2026-12-31'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${p.id}`);
                          }}
                          className="text-[#374151]"
                        >
                          Workspace <ArrowUpRight className="h-3 w-3 ml-0.5 text-[#374151]" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-surface-border flex items-center justify-between text-xs text-charcoal-muted bg-white">
            <span>Showing page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="xs"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Row 5: Recent Recorded Activity Feed (Real audit trail) */}
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 border-b border-surface-border bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-charcoal-900 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-[#374151]" />
              Recent Organizational Activity
            </h2>
            <p className="text-xs text-charcoal-muted mt-0.5">Recorded governance decisions, approvals, and workflow state changes</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivities.length > 0 ? (
            recentActivities.map((act) => (
              <div key={act.id} className="p-3.5 flex items-start justify-between text-xs hover:bg-slate-50/50">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <FileText className="h-3.5 w-3.5 text-[#374151]" />
                  </div>
                  <div>
                    <span className="font-semibold text-charcoal-900">{act.actorName}</span>{' '}
                    <span className="text-charcoal-600">{act.action}</span>{' '}
                    <span className="text-[11px] font-mono text-slate-500">[{act.entityType}]</span>
                    {act.details && (
                      <p className="text-[11px] text-charcoal-muted mt-0.5">{act.details}</p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-charcoal-muted whitespace-nowrap ml-4">
                  {act.createdAt?.substring(0, 16).replace('T', ' ')}
                </span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-charcoal-muted">
              No recent audit activity recorded.
            </div>
          )}
        </div>
      </div>

      {/* Staff Approval Modal */}
      <ExecutiveApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        user={selectedStaffCandidate}
        onSuccess={() => {
          loadDashboardData();
        }}
      />
    </div>
  );
};

export default ExecutiveDirectorDashboard;
