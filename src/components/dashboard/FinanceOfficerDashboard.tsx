import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('finance.dashboardTitle', 'Financial Operations & Expenditure Control')}
        subtitle={t(
          'finance.dashboardSubtitle',
          'Budget utilization ledger, requisition verification queue, payment disbursements, and funding balances.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('finance.console', 'Finance & Accounts') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
              <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              {t('finance.auditReport', 'Financial Reports')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/finance')}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('finance.newRequest', 'Manage Requisitions')}
            </Button>
          </div>
        }
      />

      {/* Financial Health KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Total Approved Budget
            </span>
            <div className="text-[28px] font-bold text-charcoal-900 leading-tight font-mono tabular-nums">
              {((kpis?.totalBudget || 0) / 1000000).toFixed(1)}M
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              TZS across {budgets.length} budget lines
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
            <Building className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Actual Disbursed Spent
            </span>
            <div className="text-[28px] font-bold text-charcoal-900 leading-tight font-mono tabular-nums">
              {((kpis?.totalSpent || 0) / 1000000).toFixed(1)}M
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              {kpis ? ((kpis.totalSpent / (kpis.totalBudget || 1)) * 100).toFixed(1) : '0.0'}% burn rate to date
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Requisitions in Queue
            </span>
            <div className={`text-[28px] font-bold leading-tight font-mono tabular-nums ${pendingRequisitions.length > 0 ? 'text-amber-600' : 'text-charcoal-900'}`}>
              {pendingRequisitions.length}
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Awaiting review or payment voucher
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Remaining Liquidity
            </span>
            <div className="text-[28px] font-bold text-charcoal-900 leading-tight font-mono tabular-nums">
              {((kpis?.availableBalance || 0) / 1000000).toFixed(1)}M
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              TZS uncommitted funding balance
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Operational Queues: Requisitions & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requisitions Verification Queue */}
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-forest-700" />
                Financial Requisitions Review Queue
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Staff expense claims and vendor advance requests
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/finance')}>
              {t('common.viewAll', 'View All')}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-3">Req Number</th>
                  <th className="py-2.5 px-3">Title & Requester</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {pendingRequisitions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-charcoal-muted text-xs">
                      All financial requests have been processed and verified.
                    </td>
                  </tr>
                ) : (
                  pendingRequisitions.slice(0, 5).map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/finance')}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-xs text-charcoal-800 whitespace-nowrap">
                        {req.requestNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-charcoal-900 line-clamp-1">{req.title}</div>
                        <div className="text-xs text-charcoal-muted">{req.requesterName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-charcoal-900 whitespace-nowrap">
                        {req.currency} {req.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <StatusIndicator status={req.status} label={req.status.toUpperCase()} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payment Transactions Ledger */}
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-700" />
                Recent Payment Disbursements & Vouchers
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Cleared banking transfers and mobile money disbursements
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/finance')}>
              {t('common.viewAll', 'View All')}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-3">Voucher Ref</th>
                  <th className="py-2.5 px-3">Payee & Purpose</th>
                  <th className="py-2.5 px-3 text-right">Disbursed Amount</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {transactions.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-xs text-charcoal-800 whitespace-nowrap">
                      {t.transactionNumber || t.paymentReference}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-charcoal-900 line-clamp-1">{t.payeeName}</div>
                      <div className="text-xs text-charcoal-muted">{t.paymentMethod.replace('_', ' ').toUpperCase()}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-charcoal-900 whitespace-nowrap">
                      {t.currency} {t.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs text-charcoal-600 whitespace-nowrap">
                      {t.paymentDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Budget Line Allocation & Burn Rate Ledger */}
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <Building className="h-4 w-4 text-forest-700" />
              Organizational & Program Budgets Allocation Monitor
            </h3>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Live burn rates and ceiling tracking across strategic budget categories
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/finance')}>
            {t('common.viewAll', 'All Budgets')}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-4">Budget Line Item</th>
                <th className="py-2.5 px-4">Period</th>
                <th className="py-2.5 px-4 text-right">Allocated</th>
                <th className="py-2.5 px-4 text-right">Spent</th>
                <th className="py-2.5 px-4 text-right">Remaining Balance</th>
                <th className="py-2.5 px-4 text-right">Burn Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {budgets.slice(0, 5).map((b) => {
                const burnRate = b.allocatedAmount > 0 ? (b.totalSpent / b.allocatedAmount) * 100 : 0;
                return (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-charcoal-900">{b.name}</div>
                      <div className="text-xs font-mono text-charcoal-muted">{b.category.toUpperCase()}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-600 whitespace-nowrap">
                      FY {b.fiscalYear}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-xs text-charcoal-900 whitespace-nowrap">
                      {b.currency} {b.allocatedAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-charcoal-800 whitespace-nowrap">
                      {b.currency} {b.totalSpent.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-xs text-emerald-700 whitespace-nowrap">
                      {b.currency} {b.availableBalance.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`font-mono text-xs font-bold ${burnRate > 85 ? 'text-amber-700' : 'text-charcoal-800'}`}>
                          {burnRate.toFixed(1)}%
                        </span>
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${burnRate > 85 ? 'bg-amber-600' : 'bg-emerald-600'}`}
                            style={{ width: `${Math.min(100, burnRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
