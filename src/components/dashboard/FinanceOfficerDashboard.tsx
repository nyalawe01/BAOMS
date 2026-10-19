import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  Receipt,
  ArrowRight,
  Plus,
  FileSpreadsheet,
  CreditCard,
  Building2,
  Search,
  ExternalLink,
  TrendingUp,
  CheckSquare,
  Clock,
  ChevronRight,
  ShoppingCart,
  AlertTriangle,
  Eye,
  CheckCircle2,
  X,
  FileText,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { AnalyticsVisualizer, AnalyticsDataPoint } from '@/components/ui/AnalyticsVisualizer';
import {
  getBudgets,
  getFinancialRequests,
  getTransactions,
  getFinanceKpis,
  getProcurementFinancialHandover,
  ProcurementFinancialHandoverItem,
} from '@/features/finance/services/financeService';
import {
  BudgetRecord,
  FinancialRequestRecord,
  PaymentTransaction,
  FinanceKpis,
} from '@/features/finance/types/finance';

export const FinanceOfficerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<FinanceKpis | null>(null);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [requisitions, setRequisitions] = useState<FinancialRequestRecord[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [procurementItems, setProcurementItems] = useState<ProcurementFinancialHandoverItem[]>([]);

  // Preview Drawer/Modal State
  const [previewType, setPreviewType] = useState<
    'budget' | 'expenditure' | 'available' | 'income' | 'approvals' | 'disbursements' | null
  >(null);

  // Table search and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const loadData = async () => {
    try {
      const [kpiData, bList, rList, tList, pList] = await Promise.all([
        getFinanceKpis(),
        getBudgets(),
        getFinancialRequests(),
        getTransactions(),
        getProcurementFinancialHandover(),
      ]);
      setKpis(kpiData);
      setBudgets(bList);
      setRequisitions(rList);
      setTransactions(tList);
      setProcurementItems(pList);
    } catch (e) {
      console.error('Failed loading finance telemetry:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingRequisitions = requisitions.filter(
    (r) => r.status === 'submitted' || r.status === 'under_review'
  );
  const approvedForDisbursement = requisitions.filter(
    (r) => r.status === 'approved' || r.status === 'partially_paid'
  );
  const unpaidProcurement = procurementItems.filter((p) => p.paymentStatus !== 'paid');

  const pendingRequisitionsAmount = useMemo(() => {
    return pendingRequisitions.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  }, [pendingRequisitions]);

  const approvedDisbursementAmount = useMemo(() => {
    return approvedForDisbursement.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  }, [approvedForDisbursement]);

  // Budget vs Actual chart points from real budgets
  const chartData: AnalyticsDataPoint[] = useMemo(() => {
    return budgets.slice(0, 6).map((b) => ({
      label: b.code || b.name.substring(0, 10),
      value: Math.round(b.allocatedAmount / 1000000),
      description: `${b.name} (TZS ${(b.allocatedAmount / 1000000).toFixed(1)}M)`,
    }));
  }, [budgets]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.payeeName.toLowerCase().includes(q) ||
        (t.transactionNumber && t.transactionNumber.toLowerCase().includes(q)) ||
        (t.paymentReference && t.paymentReference.toLowerCase().includes(q))
    );
  }, [transactions, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const burnRate = kpis && kpis.totalBudget > 0
    ? ((kpis.totalSpent / kpis.totalBudget) * 100).toFixed(1)
    : '0';

  const uncommittedPercentage = kpis && kpis.totalBudget > 0
    ? Math.max(0, Math.min(100, Math.round(((kpis.availableBalance || 0) / kpis.totalBudget) * 100)))
    : 100;

  if (isLoading) {
    return <SkeletonDashboard kpiCount={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header - AdminCN Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('finance.dashboardTitle', 'Finance & Accounting Operations')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time ledger overview, grant budget allocations, expenditure tracking, and disbursement verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/finance/reports')} className="text-xs text-slate-700">
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
            {t('finance.auditReport', 'Audit Reports')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/finance/payments/new')} className="text-xs text-slate-700">
            <CreditCard className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
            Issue Payment
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/finance/requisitions/new')}
            className="bg-[#D68904] hover:bg-[#b45309] text-white font-semibold text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5 text-white" />
            {t('finance.newRequest', 'New Requisition')}
          </Button>
        </div>
      </div>

      {/* Row 1: Expansive, Non-Compacted Financial Cards with Rich Preview & Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Total Approved Budget */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Total Approved Budget
                  </span>
                  <span className="text-[11px] text-slate-400">Ledger Accounts</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewType('budget')}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                title="Quick preview budget lines"
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Preview</span>
              </button>
            </div>

            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                TZS {(kpis?.totalBudget || 0).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span className="font-semibold text-slate-800">{budgets.length}</span> active grant allocation lines
              </div>
            </div>

            {/* Sub-metric preview */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Major Grant Line</span>
              <span className="font-medium text-slate-800 truncate max-w-[150px]">
                {budgets[0]?.name || 'Standard Operational'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-2">
            <button
              type="button"
              onClick={() => navigate('/finance/budgets')}
              className="text-xs font-semibold text-[#D68904] hover:text-[#b45309] flex items-center gap-1 transition-colors"
            >
              <span>Manage Budgets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Actual Disbursed Expenditure */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Actual Disbursed
                  </span>
                  <span className="text-[11px] text-slate-400">Total Disbursements</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewType('expenditure')}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                title="Quick preview expenditure vouchers"
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Preview</span>
              </button>
            </div>

            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                TZS {(kpis?.totalSpent || 0).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span className="font-semibold text-slate-800">{transactions.length}</span> completed disbursement transactions
              </div>
            </div>

            {/* Burn rate progress bar */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500">Burn Rate</span>
                <span className="font-semibold text-slate-800 font-mono">{burnRate}% of budget</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, Number(burnRate)))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2">
            <button
              type="button"
              onClick={() => navigate('/finance/transactions')}
              className="text-xs font-semibold text-[#D68904] hover:text-[#b45309] flex items-center gap-1 transition-colors"
            >
              <span>View Disbursements</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Available Uncommitted Balance */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Available Balance
                  </span>
                  <span className="text-[11px] text-slate-400">Unencumbered Funds</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewType('available')}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                title="Quick preview available funds"
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Preview</span>
              </button>
            </div>

            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                TZS {(kpis?.availableBalance || 0).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                Uncommitted organizational funds
              </div>
            </div>

            {/* Available balance ratio bar */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500">Unencumbered Ratio</span>
                <span className="font-semibold text-blue-700 font-mono">{uncommittedPercentage}% safe</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${uncommittedPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2">
            <button
              type="button"
              onClick={() => navigate('/finance/budgets')}
              className="text-xs font-semibold text-[#D68904] hover:text-[#b45309] flex items-center gap-1 transition-colors"
            >
              <span>Ledger Allocations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 4: Recorded Income & Receipts */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Recorded Income
                  </span>
                  <span className="text-[11px] text-slate-400">Grant Tranches</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewType('income')}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                title="Quick preview grant income"
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Preview</span>
              </button>
            </div>

            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                TZS {(kpis?.recordedIncome || kpis?.totalBudget || 0).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                Secured funding & institutional grants
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Fund Verification</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed Tranches
              </span>
            </div>
          </div>

          <div className="mt-4 pt-2">
            <button
              type="button"
              onClick={() => navigate('/finance/income')}
              className="text-xs font-semibold text-[#D68904] hover:text-[#b45309] flex items-center gap-1 transition-colors"
            >
              <span>Income & Receipts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 5: Pending Financial Approvals */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Pending Approvals
                  </span>
                  <span className="text-[11px] text-slate-400">Claims in Queue</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewType('approvals')}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                title="Quick preview pending claims"
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Preview</span>
              </button>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {pendingRequisitions.length}
              </div>
              {pendingRequisitions.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Requires Review
                </span>
              )}
            </div>

            <div className="text-xs text-slate-500 mt-1">
              Total volume: <span className="font-semibold text-slate-800 font-mono">TZS {pendingRequisitionsAmount.toLocaleString()}</span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Urgency Level</span>
              <span className={`font-semibold ${pendingRequisitions.length > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                {pendingRequisitions.length > 0 ? `${pendingRequisitions.length} pending clearance` : 'Queue Cleared'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-2">
            <button
              type="button"
              onClick={() => navigate('/finance/approvals')}
              className="text-xs font-semibold text-[#D68904] hover:text-[#b45309] flex items-center gap-1 transition-colors"
            >
              <span>Review Claims</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 6: Disbursement Release Queue */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Disbursement Release
                  </span>
                  <span className="text-[11px] text-slate-400">Ready for Payment</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewType('disbursements')}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                title="Quick preview approved vouchers"
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Preview</span>
              </button>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {approvedForDisbursement.length}
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                Approved
              </span>
            </div>

            <div className="text-xs text-slate-500 mt-1">
              Ready for release: <span className="font-semibold text-slate-800 font-mono">TZS {approvedDisbursementAmount.toLocaleString()}</span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Procurement Handover</span>
              <span className="font-semibold text-slate-700 font-mono">{unpaidProcurement.length} POs</span>
            </div>
          </div>

          <div className="mt-4 pt-2">
            <button
              type="button"
              onClick={() => navigate('/finance/payments/new')}
              className="text-xs font-semibold text-[#D68904] hover:text-[#b45309] flex items-center gap-1 transition-colors"
            >
              <span>Execute Payment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Action Queue & Budget Allocation Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Action Queue: Financial Items Requiring Attention */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200/80 rounded-xl overflow-hidden flex flex-col shadow-xs">
          <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#374151]" />
                Financial Action Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Items requiring verification, clearance, or disbursement
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[340px]">
            {/* Action Item 1: Claims awaiting verification */}
            <div
              onClick={() => navigate('/finance/approvals')}
              className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Claims Awaiting Approval
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {pendingRequisitions.length} requisitions in verification queue
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>

            {/* Action Item 2: Outstanding disbursements */}
            <div
              onClick={() => navigate('/finance/payments/new')}
              className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Ready for Payment Release
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {approvedForDisbursement.length} approved expense vouchers
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>

            {/* Action Item 3: Procurement invoices handover */}
            <div
              onClick={() => navigate('/finance/procurement')}
              className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Procurement Payment Handover
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {unpaidProcurement.length} supplier orders awaiting settlement
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>

            {/* Action Item 4: Project Financial Reviews */}
            <div
              onClick={() => navigate('/finance/projects')}
              className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Project Budget Tracking
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Track project grant utilization and burn rate
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Budget Allocation Breakdown Chart */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white border border-slate-200/80 rounded-xl overflow-hidden flex flex-col shadow-xs">
          <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#D68904]" />
                Budget Allocation Breakdown by Account (Millions TZS)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Operational allocation comparison across primary budget lines
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/finance/budgets')} className="text-xs text-slate-700">
              Ledger <ArrowRight className="h-3 w-3 ml-0.5" />
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
                No budget account lines configured in ledger.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Recent Payment Disbursements Table (AdminCN Style) */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-[#374151]" />
              Recent Payment Disbursements & Vouchers
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cleared banking transfers and mobile money disbursements
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search payees / vouchers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/finance/transactions')} className="text-xs text-slate-700">
              All Transactions <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-2.5 px-4">Voucher Reference</th>
                <th className="py-2.5 px-4">Payee & Purpose</th>
                <th className="py-2.5 px-4 text-right">Disbursed Amount</th>
                <th className="py-2.5 px-4 text-right">Payment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No payment transactions recorded yet.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-xs text-slate-800 whitespace-nowrap">
                      {t.transactionNumber || t.paymentReference}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{t.payeeName}</div>
                      <div className="text-[11px] text-slate-500">{t.paymentMethod.replace(/_/g, ' ').toUpperCase()}</div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {t.currency} {t.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-600 whitespace-nowrap">
                      {t.paymentDate}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/80 bg-white text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredTransactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-semibold text-slate-800">{Math.min(currentPage * pageSize, filteredTransactions.length)}</span> of{' '}
            <span className="font-semibold text-slate-800">{filteredTransactions.length}</span> entries
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

      {/* QUICK PREVIEW MODAL */}
      <Modal
        isOpen={previewType !== null}
        onClose={() => setPreviewType(null)}
        title={
          <div className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Eye className="w-5 h-5 text-[#D68904]" />
            <span>
              {previewType === 'budget' && 'Approved Budget Lines Preview'}
              {previewType === 'expenditure' && 'Expenditure & Disbursement Vouchers'}
              {previewType === 'available' && 'Available Balance Allocation'}
              {previewType === 'income' && 'Recorded Grant Receipts Preview'}
              {previewType === 'approvals' && 'Pending Financial Requisitions Preview'}
              {previewType === 'disbursements' && 'Approved Vouchers Awaiting Disbursement'}
            </span>
          </div>
        }
        size="lg"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {previewType === 'budget' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Detailed view of current operational ledger budget accounts and their utilization:
              </p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {budgets.map((b) => (
                  <div key={b.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{b.name}</div>
                      <div className="text-[11px] text-slate-500">Code: {b.code} | Year: {b.fiscalYear}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900">TZS {b.allocatedAmount.toLocaleString()}</div>
                      <div className="text-[11px] text-emerald-700">Spent: TZS {b.spentAmount.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewType === 'approvals' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                The following requisitions are currently awaiting finance clearance or approval:
              </p>
              {pendingRequisitions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                  No claims currently awaiting approval.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {pendingRequisitions.map((r) => (
                    <div key={r.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{r.title}</div>
                        <div className="text-[11px] text-slate-500">
                          Ref: {r.requestNumber} | By: {r.requesterName} | Date: {r.createdAt?.slice(0, 10)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900">TZS {r.totalAmount.toLocaleString()}</div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                          {r.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {previewType === 'disbursements' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Approved expenditure vouchers verified and waiting for payment disbursement:
              </p>
              {approvedForDisbursement.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                  All approved vouchers have already been disbursed.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {approvedForDisbursement.map((r) => (
                    <div key={r.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{r.title}</div>
                        <div className="text-[11px] text-slate-500">
                          Ref: {r.requestNumber} | Payee: {r.requesterName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900">TZS {r.totalAmount.toLocaleString()}</div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                          READY TO PAY
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(previewType === 'expenditure' || previewType === 'available' || previewType === 'income') && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Summary of ledger transactions and grant disbursements:
              </p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {transactions.slice(0, 8).map((t) => (
                  <div key={t.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{t.payeeName}</div>
                      <div className="text-[11px] text-slate-500">Voucher: {t.transactionNumber} | {t.paymentDate}</div>
                    </div>
                    <div className="text-right font-mono font-bold text-slate-900">
                      TZS {t.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewType(null)} className="text-xs">
            Close Preview
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const target =
                previewType === 'approvals'
                  ? '/finance/approvals'
                  : previewType === 'disbursements'
                  ? '/finance/payments/new'
                  : previewType === 'income'
                  ? '/finance/income'
                  : previewType === 'expenditure'
                  ? '/finance/transactions'
                  : '/finance/budgets';
              setPreviewType(null);
              navigate(target);
            }}
            className="bg-[#D68904] hover:bg-[#b45309] text-white text-xs font-semibold"
          >
            Open Full Portal
          </Button>
        </div>
      </Modal>
    </div>
  );
};
