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
  Package,
  ShieldCheck,
  UserCheck,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/ui/KPICard';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { AnalyticsVisualizer, AnalyticsDataPoint } from '@/components/ui/AnalyticsVisualizer';
import { getProjects } from '@/features/projects/services/projectService';
import { ProjectRecord } from '@/features/projects/types/project';
import {
  getRequisitions,
  getBudgets,
  getFinanceKpis,
  getTransactions,
  reviewFinancialRequest,
} from '@/features/finance/services/financeService';
import {
  FinancialRequestRecord,
  BudgetRecord,
  PaymentTransaction,
  FinanceKpis,
} from '@/features/finance/types/finance';
import {
  getPurchaseOrders,
  getVendors,
  getInventoryItems,
  getProcurementKpis,
} from '@/features/procurement/services/procurementService';
import {
  PurchaseOrderRecord,
  VendorRecord,
  InventoryItemRecord,
  ProcurementKpis,
} from '@/features/procurement/types/procurement';
import {
  getStaffProfiles,
  getLeaveRequests,
  getContractExpiryReminders,
} from '@/features/hr/services/hrService';
import {
  StaffProfileRecord,
  LeaveRequestRecord,
} from '@/features/hr/types/hr';
import { getAuditLogs } from '@/features/audit/services/auditService';
import { AuditLogRecord } from '@/features/audit/types/audit';
import { useAuth } from '@/features/auth/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ExecutiveApprovalModal } from '@/features/users/components/ExecutiveApprovalModal';
import { PendingUserCandidate } from '@/features/users/components/UserOnboardingReviewModal';
import Swal from 'sweetalert2';
import { showSuccess, showError } from '@/lib/sweetAlert';

export type ExecutiveTab = 'overview' | 'projects' | 'finance' | 'procurement' | 'hr' | 'approvals';

export const ExecutiveDirectorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ExecutiveTab>('overview');

  // Multi-department Data State
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [requisitions, setRequisitions] = useState<FinancialRequestRecord[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [financeKpis, setFinanceKpis] = useState<FinanceKpis | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemRecord[]>([]);
  const [procurementKpis, setProcurementKpis] = useState<ProcurementKpis | null>(null);

  const [staffList, setStaffList] = useState<StaffProfileRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>([]);
  const [contractReminders, setContractReminders] = useState<StaffProfileRecord[]>([]);

  const [pendingStaffAuth, setPendingStaffAuth] = useState<PendingUserCandidate[]>([]);
  const [recentActivities, setRecentActivities] = useState<AuditLogRecord[]>([]);
  const [selectedStaffCandidate, setSelectedStaffCandidate] = useState<PendingUserCandidate | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  // Filters & Controls
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  const loadDashboardData = async () => {
    try {
      const [
        pList,
        rList,
        bList,
        fKpis,
        tList,
        poList,
        vList,
        invList,
        pKpis,
        staffProfiles,
        leaveReqs,
        contracts,
        auditData,
      ] = await Promise.all([
        getProjects(),
        getRequisitions(),
        getBudgets(),
        getFinanceKpis(),
        getTransactions(),
        getPurchaseOrders(),
        getVendors(),
        getInventoryItems(),
        getProcurementKpis(),
        getStaffProfiles(),
        getLeaveRequests(),
        getContractExpiryReminders(),
        getAuditLogs({ pageSize: 6 }),
      ]);

      setProjects(pList);
      setRequisitions(rList);
      setBudgets(bList);
      setFinanceKpis(fKpis);
      setTransactions(tList);
      setPurchaseOrders(poList);
      setVendors(vList);
      setInventoryItems(invList);
      setProcurementKpis(pKpis);
      setStaffList(staffProfiles);
      setLeaveRequests(leaveReqs);
      setContractReminders(contracts);
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Strategic Calculations
  const pendingFinancialApprovals = requisitions.filter(
    (r) => r.status === 'submitted' || r.status === 'under_review'
  );
  const pendingLeaveApprovals = leaveRequests.filter((l) => l.status === 'pending');
  const totalPendingDecisionsCount =
    pendingFinancialApprovals.length + pendingStaffAuth.length + pendingLeaveApprovals.length;

  const totalPortfolioBudget = projects.reduce((acc, p) => acc + (p.totalBudget || 0), 0);
  const totalSpentBudget = projects.reduce((acc, p) => acc + (p.budgetSummary?.totalSpent || 0), 0);
  const budgetUtilization = totalPortfolioBudget > 0 ? Math.round((totalSpentBudget / totalPortfolioBudget) * 100) : 0;
  const activeProjectsCount = projects.filter((p) => p.status === 'active').length;
  const verifiedBeneficiariesCount = projects.reduce((acc, p) => acc + (p.actualBeneficiaries || 0), 0) || 2650;

  const totalActivePOAmount = purchaseOrders
    .filter((po) => po.status === 'ordered' || po.status === 'approved')
    .reduce((acc, po) => acc + po.totalAmount, 0);

  // Chart 1: Budget vs Actual per Project
  const budgetChartData: AnalyticsDataPoint[] = useMemo(() => {
    return projects.slice(0, 5).map((p) => ({
      label: p.projectCode || p.name.substring(0, 10),
      value: Math.round((p.totalBudget || 0) / 1000000),
      description: `Budget: TZS ${((p.totalBudget || 0) / 1000000).toFixed(1)}M | Spent: TZS ${(((p.budgetSummary?.totalSpent || 0)) / 1000000).toFixed(1)}M`,
    }));
  }, [projects]);

  // Executive Decision on Financial Request
  const handleReviewRequisition = async (reqId: string, decision: 'approved' | 'rejected') => {
    if (!user) return;
    const { value: notes } = await Swal.fire({
      title: `${decision === 'approved' ? 'Authorize' : 'Decline'} Requisition`,
      input: 'textarea',
      inputLabel: 'Executive Notes & Authorization Directive',
      inputPlaceholder: 'State reason or authorization remarks...',
      showCancelButton: true,
      confirmButtonText: decision === 'approved' ? 'Authorize' : 'Decline',
      confirmButtonColor: decision === 'approved' ? '#10B981' : '#EF4444',
    });

    if (notes === undefined) return;

    try {
      await reviewFinancialRequest(reqId, {
        decision,
        decisionNotes: notes || `Direct executive action by Director`,
        reviewerId: user.id,
      });
      await showSuccess('Action Completed', `Requisition has been marked as ${decision}.`);
      loadDashboardData();
    } catch (err) {
      await showError('Error', (err as Error).message || 'Failed to record decision.');
    }
  };

  // Export Dashboard Action
  const handleExportDashboard = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Project Code,Project Name,Donor,Status,Budget TZS,Spent TZS\n' +
      projects
        .map(
          (p) =>
            `"${p.projectCode}","${p.name}","${p.funder || 'N/A'}","${p.status}","${p.totalBudget}","${p.budgetSummary?.totalSpent || 0}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Executive_Director_Briefing_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <SkeletonDashboard kpiCount={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header - Executive Cockpit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Executive Director Command Center
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Institutional Oversight
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete high-level visibility across Projects, Finance, Procurement, and Workforce with executive sign-off authority.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastUpdatedTime && (
            <span className="text-2xs text-slate-400 font-mono hidden md:inline">
              Synced: {lastUpdatedTime}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleExportDashboard} className="text-xs text-slate-700">
            <Download className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
            Export Executive Brief
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('approvals')}
            className="bg-[#D68904] hover:bg-[#b45309] text-white font-semibold text-xs flex items-center gap-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-white" />
            <span>Decisions Hub</span>
            {totalPendingDecisionsCount > 0 && (
              <span className="ml-1 bg-white text-[#D68904] px-1.5 py-0.2 rounded-full font-bold text-[10px]">
                {totalPendingDecisionsCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Institutional View Filter Navigation */}
      <div className="border-b border-slate-200/80 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 text-xs font-medium rounded-t-md transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-[#D68904] text-slate-900 bg-slate-100/70 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-slate-600" />
            <span>Executive Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`px-3.5 py-2 text-xs font-medium rounded-t-md transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'projects'
                ? 'border-[#D68904] text-slate-900 bg-slate-100/70 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4 text-slate-600" />
            <span>Project Portfolios ({projects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`px-3.5 py-2 text-xs font-medium rounded-t-md transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'finance'
                ? 'border-[#D68904] text-slate-900 bg-slate-100/70 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Wallet className="w-4 h-4 text-slate-600" />
            <span>Financial Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('procurement')}
            className={`px-3.5 py-2 text-xs font-medium rounded-t-md transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'procurement'
                ? 'border-[#D68904] text-slate-900 bg-slate-100/70 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-slate-600" />
            <span>Procurement & Supply ({purchaseOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hr')}
            className={`px-3.5 py-2 text-xs font-medium rounded-t-md transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'hr'
                ? 'border-[#D68904] text-slate-900 bg-slate-100/70 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-slate-600" />
            <span>Workforce & Staff ({staffList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`px-3.5 py-2 text-xs font-medium rounded-t-md transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'approvals'
                ? 'border-[#D68904] text-slate-900 bg-slate-100/70 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-slate-600" />
            <span>Executive Decisions</span>
            {totalPendingDecisionsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#D68904] text-white">
                {totalPendingDecisionsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Strategic Metric Cards (Spacious 4-column Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Projects Portfolio */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
                  <Briefcase className="w-4 h-4 text-slate-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-2">
                  {activeProjectsCount} <span className="text-xs font-normal text-slate-400">/ {projects.length} total</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Budget: <span className="font-semibold text-slate-800">TZS {(totalPortfolioBudget / 1000000).toFixed(1)}M</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('projects')}
                className="mt-3 pt-2 border-t border-slate-100 text-xs font-medium text-[#D68904] flex items-center justify-between hover:underline"
              >
                <span>View All Projects</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2: Financial Burn Rate & Available */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">Organization Budget</span>
                  <Wallet className="w-4 h-4 text-slate-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-2">
                  TZS {((financeKpis?.totalBudget || totalPortfolioBudget) / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Utilization: <span className="font-semibold text-slate-800 font-mono">{budgetUtilization}%</span> | Bal: <span className="font-semibold text-emerald-700">TZS {((financeKpis?.availableBalance || 0) / 1000000).toFixed(1)}M</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('finance')}
                className="mt-3 pt-2 border-t border-slate-100 text-xs font-medium text-[#D68904] flex items-center justify-between hover:underline"
              >
                <span>View Financial Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Procurement & Supply Value */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">Procurement Value</span>
                  <ShoppingCart className="w-4 h-4 text-slate-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-2">
                  TZS {(totalActivePOAmount / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Orders: <span className="font-semibold text-slate-800">{purchaseOrders.length}</span> | Vendors: <span className="font-semibold text-slate-800">{vendors.length}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('procurement')}
                className="mt-3 pt-2 border-t border-slate-100 text-xs font-medium text-[#D68904] flex items-center justify-between hover:underline"
              >
                <span>View Procurement Orders</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 4: Human Resources & Staff Count */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">Institutional Staff</span>
                  <Users className="w-4 h-4 text-slate-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-2">
                  {staffList.length} <span className="text-xs font-normal text-slate-400">Personnel</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Contract Expiries: <span className="font-semibold text-amber-700">{contractReminders.length} soon</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('hr')}
                className="mt-3 pt-2 border-t border-slate-100 text-xs font-medium text-[#D68904] flex items-center justify-between hover:underline"
              >
                <span>View Staff Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Strategic Analytics & Executive Priority Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Project Budget vs Actual Expenditure Chart */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white border border-slate-200/80 rounded-xl overflow-hidden flex flex-col shadow-xs">
              <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-[#D68904]" />
                    Project Portfolio Allocations & Burn (Millions TZS)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Strategic funding distribution across primary donor grant projects
                  </p>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-center">
                {budgetChartData.length > 0 ? (
                  <AnalyticsVisualizer
                    data={budgetChartData}
                    valuePrefix="TZS "
                    valueSuffix="M"
                    defaultMode="bar"
                    availableModes={['bar', 'line', 'table']}
                    height={240}
                  />
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No active projects registered in portfolio.
                  </div>
                )}
              </div>
            </div>

            {/* Executive Action Queue (Items Requiring ED Authorization) */}
            <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200/80 rounded-xl overflow-hidden flex flex-col shadow-xs">
              <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#D68904]" />
                    Executive Decisions Required
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Items awaiting final Executive Director authorization
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[320px]">
                {/* Onboarding Candidate Sign-offs */}
                {pendingStaffAuth.map((candidate) => (
                  <div key={candidate.id} className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{candidate.displayName}</div>
                      <div className="text-[11px] text-slate-500">Staff Account Authorization</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStaffCandidate(candidate);
                        setIsApprovalModalOpen(true);
                      }}
                      className="text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                    >
                      Authorize
                    </Button>
                  </div>
                ))}

                {/* Financial Requisition Approvals */}
                {pendingFinancialApprovals.slice(0, 3).map((r) => (
                  <div key={r.id} className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{r.title}</div>
                      <div className="text-[11px] text-slate-500">
                        TZS {r.totalAmount.toLocaleString()} | Requested by {r.requesterName}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReviewRequisition(r.id, 'approved')}
                        className="text-xs text-emerald-700 hover:bg-emerald-50 h-7 px-2 font-medium"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReviewRequisition(r.id, 'rejected')}
                        className="text-xs text-red-700 hover:bg-red-50 h-7 px-2 font-medium"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Leave Requests */}
                {pendingLeaveApprovals.slice(0, 2).map((l) => (
                  <div key={l.id} className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{l.staffName}</div>
                      <div className="text-[11px] text-slate-500">
                        {l.leaveTypeName} ({l.daysRequested} days)
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/hr/approvals')}
                      className="text-xs h-7 px-2 text-slate-700"
                    >
                      Review
                    </Button>
                  </div>
                ))}

                {totalPendingDecisionsCount === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    All executive queues are fully cleared.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROJECTS PORTFOLIO */}
      {activeTab === 'projects' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Project Portfolio Directory</h2>
              <p className="text-xs text-slate-500">
                Institutional oversight of all ongoing, planning, and completed Baba Watoto community projects.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/projects')}
              className="text-xs text-slate-700 flex items-center gap-1"
            >
              <span>Projects Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Project Name & Funder</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Budget</th>
                  <th className="py-2.5 px-4 text-right">Beneficiaries</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.projectCode}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">Donor: {p.funder || 'Institutional'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusIndicator status={p.status} label={p.status.toUpperCase()} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      TZS {(p.totalBudget || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {(p.actualBeneficiaries || p.targetBeneficiaries || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#D68904] hover:text-[#b45309]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIAL LEDGER & BUDGETS */}
      {activeTab === 'finance' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Financial Ledger & Grant Budgets</h2>
              <p className="text-xs text-slate-500">
                High-level ledger accounts, expenditure velocity, and disbursement audit history.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/finance')}
              className="text-xs text-slate-700 flex items-center gap-1"
            >
              <span>Finance Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-4">Account Code</th>
                  <th className="py-2.5 px-4">Budget Line Name</th>
                  <th className="py-2.5 px-4 text-right">Allocated (TZS)</th>
                  <th className="py-2.5 px-4 text-right">Disbursed (TZS)</th>
                  <th className="py-2.5 px-4 text-right">Balance (TZS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {budgets.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{b.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{b.name}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {b.allocatedAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      {b.spentAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {(b.allocatedAmount - b.spentAmount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PROCUREMENT & SUPPLY CHAIN */}
      {activeTab === 'procurement' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Procurement & Supplier Register</h2>
              <p className="text-xs text-slate-500">
                Purchase orders, supplier partnerships, and inventory materials stored in central warehouses.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/procurement')}
              className="text-xs text-slate-700 flex items-center gap-1"
            >
              <span>Procurement Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-4">PO Number</th>
                  <th className="py-2.5 px-4">Vendor Partner</th>
                  <th className="py-2.5 px-4">Order Title</th>
                  <th className="py-2.5 px-4 text-right">Amount (TZS)</th>
                  <th className="py-2.5 px-4 text-right">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{po.orderNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{po.vendorName}</td>
                    <td className="py-3 px-4 text-slate-700">{po.title}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {po.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {po.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: HUMAN RESOURCES & WORKFORCE */}
      {activeTab === 'hr' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Workforce & Personnel Register</h2>
              <p className="text-xs text-slate-500">
                Institutional staff directory, contract tenures, and attendance/leave tracking.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hr')}
              className="text-xs text-slate-700 flex items-center gap-1"
            >
              <span>HR Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-4">Staff #</th>
                  <th className="py-2.5 px-4">Full Name & Position</th>
                  <th className="py-2.5 px-4">Official Email</th>
                  <th className="py-2.5 px-4">Employment Type</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{s.staffNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{s.fullName}</div>
                      <div className="text-[11px] text-slate-500">{s.jobTitle}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{s.officialEmail || s.email}</td>
                    <td className="py-3 px-4 text-slate-700 capitalize">{s.contractType?.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                        {s.employmentStatus.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: EXECUTIVE DECISIONS & APPROVALS HUB */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900">Executive Authorization Hub</h2>
            <p className="text-xs text-slate-500 mt-1">
              Final executive approvals for organizational spending, staff onboarding, and executive leave sign-offs.
            </p>

            <div className="mt-6 space-y-6">
              {/* Financial Requisitions */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Requisitions Requiring Final Approval ({pendingFinancialApprovals.length})
                </h3>
                {pendingFinancialApprovals.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed">
                    No financial claims currently pending approval.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {pendingFinancialApprovals.map((r) => (
                      <div key={r.id} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{r.title}</div>
                          <div className="text-slate-500 mt-0.5">
                            Requester: <span className="font-medium text-slate-700">{r.requesterName}</span> | Date: {r.createdAt?.slice(0, 10)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            TZS {r.totalAmount.toLocaleString()}
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleReviewRequisition(r.id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          >
                            Authorize
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewRequisition(r.id, 'rejected')}
                            className="text-xs text-red-700 border-red-200 hover:bg-red-50"
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Staff Onboarding Sign-offs */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  New Staff Accounts Requiring Executive Sign-Off ({pendingStaffAuth.length})
                </h3>
                {pendingStaffAuth.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed">
                    No staff profiles pending executive authorization.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {pendingStaffAuth.map((candidate) => (
                      <div key={candidate.id} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{candidate.displayName}</div>
                          <div className="text-slate-500 mt-0.5 font-mono">{candidate.email}</div>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedStaffCandidate(candidate);
                            setIsApprovalModalOpen(true);
                          }}
                          className="bg-[#D68904] hover:bg-[#b45309] text-white text-xs"
                        >
                          Review & Sign Off
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Executive Sign-off Modal */}
      {selectedStaffCandidate && (
        <ExecutiveApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => {
            setIsApprovalModalOpen(false);
            setSelectedStaffCandidate(null);
          }}
          user={selectedStaffCandidate}
          onSuccess={() => {
            setIsApprovalModalOpen(false);
            setSelectedStaffCandidate(null);
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
};
