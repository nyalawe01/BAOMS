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
  Building,
  Search,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/ui/KPICard';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { AnalyticsVisualizer, AnalyticsDataPoint } from '@/components/ui/AnalyticsVisualizer';
import {
  getBudgets,
  getRequisitions,
  getTransactions,
  getFinanceKpis,
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

  // Table search and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const loadData = async () => {
    try {
      const [kpiData, bList, rList, tList] = await Promise.all([
        getFinanceKpis(),
        getBudgets(),
        getRequisitions(),
        getTransactions(),
      ]);
      setKpis(kpiData);
      setBudgets(bList);
      setRequisitions(rList);
      setTransactions(tList);
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

  return (
    <div className="space-y-6">
      {/* Top Header - AdminCN Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('finance.console', 'Finance & Operations')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Budget utilization ledger, requisition verification queue, payment disbursements, and funding balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
            {t('finance.auditReport', 'Audit Reports')}
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/finance')}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t('finance.newRequest', 'New Requisition')}
          </Button>
        </div>
      </div>

      {/* Row 1: Four Compact KPI Cards (AdminCN Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Approved Budget"
          value={`TZS ${((kpis?.totalBudget || 0) / 1000000).toFixed(1)}M`}
          subValue={`/ ${budgets.length} lines`}
          change={{
            value: `${budgets.length} Accounts`,
            isPositive: true,
            label: 'across active grants',
          }}
          icon={Building}
        />

        <KPICard
          label="Disbursed Expenditures"
          value={`TZS ${((kpis?.totalSpent || 0) / 1000000).toFixed(1)}M`}
          change={{
            value: kpis ? `${((kpis.totalSpent / (kpis.totalBudget || 1)) * 100).toFixed(1)}% burn rate` : '0%',
            isPositive: true,
            label: 'of total budget',
          }}
          icon={Wallet}
        />

        <KPICard
          label="Requisitions in Queue"
          value={pendingRequisitions.length}
          change={{
            value: pendingRequisitions.length > 0 ? `${pendingRequisitions.length} Pending` : 'Clear',
            isPositive: pendingRequisitions.length === 0,
            label: pendingRequisitions.length > 0 ? 'awaiting verification' : 'all claims cleared',
          }}
          icon={Receipt}
        />

        <KPICard
          label="Remaining Liquidity"
          value={`TZS ${((kpis?.availableBalance || 0) / 1000000).toFixed(1)}M`}
          change={{
            value: 'Available',
            isPositive: (kpis?.availableBalance || 0) > 0,
            label: 'uncommitted balances',
          }}
          icon={CreditCard}
        />
      </div>

      {/* Row 2: Budget-versus-Actual Chart + Requisitions Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
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
            <Button variant="ghost" size="sm" onClick={() => navigate('/finance')}>
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

        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200/80 rounded-lg overflow-hidden flex flex-col shadow-xs">
          <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-slate-700" />
                Requisitions Verification Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff expense claims awaiting processing
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/finance')}>
              All <ArrowRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[300px]">
            {pendingRequisitions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                All financial requests have been processed and verified.
              </div>
            ) : (
              pendingRequisitions.slice(0, 5).map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  onClick={() => navigate('/finance')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        {req.title}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {req.requestNumber} • {req.requesterName}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-slate-900">
                        {req.currency} {req.totalAmount.toLocaleString()}
                      </div>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 uppercase">
                        {req.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Recent Payment Disbursements Table (AdminCN Style) */}
      <div className="bg-white border border-slate-200/80 rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-emerald-600" />
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
            <Button variant="outline" size="sm" onClick={() => navigate('/finance')}>
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
