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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/ui/KPICard';
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

  const [kpis, setKpis] = useState<FinanceKpis | null>(null);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [requisitions, setRequisitions] = useState<FinancialRequestRecord[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [procurementItems, setProcurementItems] = useState<ProcurementFinancialHandoverItem[]>([]);

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

  return (
    <div className="space-y-6">
      {/* Top Header - AdminCN Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('finance.dashboardTitle', 'Finance Dashboard')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Budget allocations, expenditure tracking, payment disbursements, and funding balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/finance/reports')}>
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
            {t('finance.auditReport', 'Audit Reports')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/finance/payments/new')}>
            <CreditCard className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
            Issue Payment
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/finance/requisitions/new')}
            className="bg-[#D68904] hover:bg-[#b45309] text-white font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5 text-white" />
            {t('finance.newRequest', 'New Requisition')}
          </Button>
        </div>
      </div>

      {/* Row 1: The 6 Required KPI Cards (AdminCN Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard
          label="Total Approved Budget"
          value={`TZS ${((kpis?.totalBudget || 0) / 1000000).toFixed(1)}M`}
          subValue={`/ ${budgets.length} lines`}
          change={{
            value: `${budgets.length} Accounts`,
            isPositive: true,
            label: 'across active grants',
          }}
          icon={Building2}
          onClick={() => navigate('/finance/budgets')}
        />

        <KPICard
          label="Actual Expenditure"
          value={`TZS ${((kpis?.totalSpent || 0) / 1000000).toFixed(1)}M`}
          change={{
            value: `${burnRate}% burn rate`,
            isPositive: true,
            label: 'of total budget',
          }}
          icon={CreditCard}
          onClick={() => navigate('/finance/transactions')}
        />

        <KPICard
          label="Available Budget"
          value={`TZS ${((kpis?.availableBalance || 0) / 1000000).toFixed(1)}M`}
          change={{
            value: 'Uncommitted',
            isPositive: (kpis?.availableBalance || 0) > 0,
            label: 'available funds',
          }}
          icon={Wallet}
          onClick={() => navigate('/finance/budgets')}
        />

        <KPICard
          label="Recorded Income"
          value={`TZS ${((kpis?.recordedIncome || kpis?.totalBudget || 0) / 1000000).toFixed(1)}M`}
          change={{
            value: 'Secured',
            isPositive: true,
            label: 'grant allocations',
          }}
          icon={TrendingUp}
          onClick={() => navigate('/finance/income')}
        />

        <KPICard
          label="Pending Financial Approvals"
          value={kpis?.pendingApprovalsCount ?? pendingRequisitions.length}
          change={{
            value: pendingRequisitions.length > 0 ? `${pendingRequisitions.length} In Queue` : 'Clear',
            isPositive: pendingRequisitions.length === 0,
            label: pendingRequisitions.length > 0 ? 'claims awaiting review' : 'all claims cleared',
          }}
          icon={CheckSquare}
          onClick={() => navigate('/finance/approvals')}
        />

        <KPICard
          label="Outstanding Payments"
          value={`TZS ${((kpis?.outstandingPaymentsAmount || 0) / 1000000).toFixed(1)}M`}
          change={{
            value: `${approvedForDisbursement.length} Approved`,
            isPositive: approvedForDisbursement.length === 0,
            label: 'ready for disbursement',
          }}
          icon={Receipt}
          onClick={() => navigate('/finance/expenditure')}
        />
      </div>

      {/* Row 2: Action Queue & Budget Allocation Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Action Queue: Financial Items Requiring Attention */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200/80 rounded-lg overflow-hidden flex flex-col shadow-xs">
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

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[300px]">
            {/* Action Item 1: Claims awaiting verification */}
            <div
              onClick={() => navigate('/finance/approvals')}
              className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="h-4 w-4 text-slate-500 shrink-0" />
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
                <CreditCard className="h-4 w-4 text-slate-500 shrink-0" />
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
                <ShoppingCart className="h-4 w-4 text-slate-500 shrink-0" />
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
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
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
        <div className="lg:col-span-7 xl:col-span-8 bg-white border border-slate-200/80 rounded-lg overflow-hidden flex flex-col shadow-xs">
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
            <Button variant="ghost" size="sm" onClick={() => navigate('/finance/budgets')}>
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
                height={220}
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
      <div className="bg-white border border-slate-200/80 rounded-lg overflow-hidden shadow-xs">
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
            <Button variant="outline" size="sm" onClick={() => navigate('/finance/transactions')}>
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
    </div>
  );
};
