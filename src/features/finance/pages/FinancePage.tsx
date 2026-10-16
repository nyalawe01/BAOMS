/**
 * Finance & Budget Management Page
 * Babawatoto Organization Management System (BAOMS)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  CheckCircle,
  FileText,
  CreditCard,
  TrendingUp,
  Eye,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { AnalyticsVisualizer, AnalyticsDataPoint } from '@/components/ui/AnalyticsVisualizer';
import { useAuth } from '@/features/auth/useAuth';
import { showSuccess, showError } from '@/lib/sweetAlert';
import { StaffProfileRecord } from '@/features/hr/types/hr';
import { getStaffProfiles } from '@/features/hr/services/hrService';
import { CompleteStatutoryModal } from '@/features/hr/components/CompleteStatutoryModal';
import {
  FinancialRequestRecord,
  BudgetRecord,
  PaymentTransaction,
  FinanceKpis,
  FinancialRequestStatus,
  CreateFinancialRequestPayload,
  ReviewDecisionPayload,
  RecordPaymentPayload,
} from '../types/finance';
import {
  getFinancialRequests,
  getBudgets,
  getTransactions,
  getFinanceKpis,
  createFinancialRequest,
  reviewFinancialRequest,
  recordPayment,
} from '../services/financeService';
import { CreateFinancialRequestModal } from '../components/CreateFinancialRequestModal';
import { FinancialRequestDetailModal } from '../components/FinancialRequestDetailModal';
import { ReviewFinancialRequestModal } from '../components/ReviewFinancialRequestModal';
import { RecordPaymentModal } from '../components/RecordPaymentModal';

export const FinancePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile, roles, hasPermission, hasRole, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'requests' | 'budgets' | 'transactions' | 'statutory'>('requests');
  const [requests, setRequests] = useState<FinancialRequestRecord[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [staffList, setStaffList] = useState<StaffProfileRecord[]>([]);
  const [statutoryStaff, setStatutoryStaff] = useState<StaffProfileRecord | null>(null);
  const [isStatutoryModalOpen, setIsStatutoryModalOpen] = useState(false);
  const [statutorySearch, setStatutorySearch] = useState('');
  const [statutoryFilter, setStatutoryFilter] = useState<'all' | 'pending_finance' | 'completed'>('all');
  const [kpis, setKpis] = useState<FinanceKpis>({
    totalBudget: 0,
    totalSpent: 0,
    totalCommitted: 0,
    availableBalance: 0,
    pendingRequestsCount: 0,
    pendingRequestsAmount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FinancialRequestStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FinancialRequestRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqsData, budgetsData, txnsData, kpisData, staffData] = await Promise.all([
        getFinancialRequests({ search: searchQuery, status: statusFilter }),
        getBudgets(),
        getTransactions(),
        getFinanceKpis(),
        getStaffProfiles(),
      ]);

      setRequests(reqsData);
      setBudgets(budgetsData);
      setTransactions(txnsData);
      setKpis(kpisData);
      setStaffList(staffData);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Expenditure allocation by request type
  const financialAnalyticsData: AnalyticsDataPoint[] = useMemo(() => {
    const categories: Record<string, number> = {};
    requests.forEach((r) => {
      const typeStr = r.requestType || 'Other';
      const key = typeStr.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      categories[key] = (categories[key] || 0) + (r.approvedAmount ?? r.totalAmount);
    });
    return Object.entries(categories).map(([label, value]) => ({
      label,
      value,
      description: `Total allocation across ${requests.filter((r) => (r.requestType || 'Other').toLowerCase() === label.toLowerCase().replace(' ', '_')).length} requisitions`,
    }));
  }, [requests]);

  const handleCreateSubmit = async (payload: CreateFinancialRequestPayload) => {
    if (!user) return;
    try {
      await createFinancialRequest(payload, {
        id: user.id,
        name: profile?.display_name || user.email,
        role: roles[0] || 'staff',
      });
      await loadData();
      await showSuccess(t('finance.requestCreated', 'Financial request created successfully.'));
    } catch (err: unknown) {
      await showError(t('common.error', 'Error'), (err as Error).message || 'Failed to create financial request.');
    }
  };

  const handleReviewSubmit = async (decision: ReviewDecisionPayload) => {
    if (!user || !selectedRequest) return;
    try {
      const updated = await reviewFinancialRequest(selectedRequest.id, decision, {
        id: user.id,
        name: profile?.display_name || user.email,
        role: roles[0] || 'reviewer',
      });
      setSelectedRequest(updated);
      await loadData();
      await showSuccess(t('finance.decisionRecorded', 'Approval decision recorded successfully.'));
    } catch (err: unknown) {
      await showError(t('common.error', 'Error'), (err as Error).message || 'Failed to record decision.');
    }
  };

  const handlePaymentSubmit = async (payload: RecordPaymentPayload) => {
    if (!user || !selectedRequest) return;
    try {
      const { request: updated } = await recordPayment(selectedRequest.id, payload, {
        id: user.id,
        name: profile?.display_name || user.email,
        role: roles[0] || 'finance_officer',
      });
      setSelectedRequest(updated);
      await loadData();
      await showSuccess(t('finance.paymentRecorded', 'Payment recorded successfully.'));
    } catch (err: unknown) {
      await showError(t('common.error', 'Error'), (err as Error).message || 'Failed to record payment.');
    }
  };

  const canRequest = hasPermission('finance.request') || isAdmin();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <StatusIndicator status="paid" label={t('finance.status.paid', 'Paid in Full')} />;
      case 'partially_paid':
        return <StatusIndicator status="partially_paid" label={t('finance.status.partially_paid', 'Partially Paid')} />;
      case 'approved':
        return <StatusIndicator status="approved" label={t('finance.status.approved', 'Approved')} />;
      case 'under_review':
        return <StatusIndicator status="under_review" label={t('finance.status.under_review', 'Under Review')} />;
      case 'submitted':
        return <StatusIndicator status="submitted" label={t('finance.status.submitted', 'Submitted')} />;
      case 'returned':
        return <StatusIndicator status="returned" label={t('finance.status.returned', 'Returned for Correction')} />;
      case 'rejected':
        return <StatusIndicator status="rejected" label={t('finance.status.rejected', 'Rejected')} />;
      default:
        return <StatusIndicator status={status} label={status} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title={t('finance.title', 'Finance & Budget Management')}
        subtitle="Organizational requisitions, multi-tier approvals, budget reconciliation, and payment disbursements."
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('nav.finance', 'Finance & Budgets') },
        ]}
        actions={
          canRequest && (
            <Button
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>{t('finance.newRequest', 'New Requisition')}</span>
            </Button>
          )
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <Card className="p-4 bg-white min-w-0">
          <div className="flex items-center justify-between gap-2 text-charcoal-muted min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider truncate">
              {t('finance.kpi.totalBudget', 'Authorized Budget')}
            </span>
            <Wallet className="h-4 w-4 shrink-0 text-forest-700" />
          </div>
          <div className="mt-2 text-[26px] sm:text-[32px] font-bold text-charcoal leading-[1.2] font-mono tabular-nums truncate">
            {kpis.totalBudget.toLocaleString()} <span className="text-xs font-normal text-charcoal-muted">TZS</span>
          </div>
          <div className="text-2xs text-charcoal-muted mt-1 truncate">
            Across {budgets.length} active budget lines
          </div>
        </Card>

        {/* Total Spent */}
        <Card className="p-4 bg-white min-w-0">
          <div className="flex items-center justify-between gap-2 text-charcoal-muted min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider truncate">
              {t('finance.kpi.totalSpent', 'Actual Disbursed')}
            </span>
            <CreditCard className="h-4 w-4 shrink-0 text-forest-700" />
          </div>
          <div className="mt-2 text-[26px] sm:text-[32px] font-bold text-forest-800 leading-[1.2] font-mono tabular-nums truncate">
            {kpis.totalSpent.toLocaleString()} <span className="text-xs font-normal text-charcoal-muted">TZS</span>
          </div>
          <div className="text-2xs text-charcoal-muted mt-1 truncate">
            {transactions.length} completed disbursement transactions
          </div>
        </Card>

        {/* Committed Amount */}
        <Card className="p-4 bg-white min-w-0">
          <div className="flex items-center justify-between gap-2 text-charcoal-muted min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider truncate">
              {t('finance.kpi.totalCommitted', 'Approved Commitments')}
            </span>
            <CheckCircle className="h-4 w-4 shrink-0 text-[#F2A507]" />
          </div>
          <div className="mt-2 text-[26px] sm:text-[32px] font-bold text-charcoal-900 leading-[1.2] font-mono tabular-nums truncate">
            {kpis.totalCommitted.toLocaleString()} <span className="text-xs font-normal text-charcoal-muted">TZS</span>
          </div>
          <div className="text-2xs text-charcoal-muted mt-1 truncate">
            Pending disbursement release
          </div>
        </Card>

        {/* Available Balance */}
        <Card className="p-4 bg-white min-w-0">
          <div className="flex items-center justify-between gap-2 text-charcoal-muted min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider truncate">
              {t('finance.kpi.availableBalance', 'Available Balance')}
            </span>
            <TrendingUp className="h-4 w-4 shrink-0 text-emerald-600" />
          </div>
          <div className="mt-2 text-[26px] sm:text-[32px] font-bold text-emerald-800 leading-[1.2] font-mono tabular-nums truncate">
            {kpis.availableBalance.toLocaleString()} <span className="text-xs font-normal text-charcoal-muted">TZS</span>
          </div>
          <div className="text-2xs text-charcoal-muted mt-1 truncate">
            Unencumbered organizational funds
          </div>
        </Card>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-surface-border">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-forest-700 text-forest-800'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>{t('finance.tabs.requests', 'Requisitions')}</span>
            <span className="rounded-full bg-forest-50 text-forest-800 text-xs px-2 py-0.5 font-bold">
              {requests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('budgets')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'budgets'
                ? 'border-forest-700 text-forest-800'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Wallet className="h-4 w-4" />
            <span>{t('finance.tabs.budgets', 'Budget Utilization')}</span>
            <span className="rounded-full bg-surface-muted text-charcoal-muted text-xs px-2 py-0.5 font-bold">
              {budgets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'transactions'
                ? 'border-forest-700 text-forest-800'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>{t('finance.tabs.transactions', 'Disbursements Register')}</span>
            <span className="rounded-full bg-surface-muted text-charcoal-muted text-xs px-2 py-0.5 font-bold">
              {transactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('statutory')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'statutory'
                ? 'border-forest-700 text-forest-800'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Staff Statutory & Payroll Registry</span>
            {staffList.filter((s) => s.onboardingStatus === 'pending_finance').length > 0 ? (
              <span className="rounded-full bg-amber-100 text-amber-800 text-xs px-2 py-0.5 font-bold">
                {staffList.filter((s) => s.onboardingStatus === 'pending_finance').length} pending
              </span>
            ) : (
              <span className="rounded-full bg-surface-muted text-charcoal-muted text-xs px-2 py-0.5 font-bold">
                {staffList.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* TAB 1: Financial Requests Register */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Requisitions Allocation Analytics Engine */}
          {requests.length > 0 && (
            <AnalyticsVisualizer
              title="Financial Requisitions & Expenditure by Category"
              description="Interactive analytical distribution of requested funds across expense categories (Bar, Line, Distribution, Table)"
              data={financialAnalyticsData}
              valuePrefix="TZS "
              defaultMode="bar"
              availableModes={['bar', 'line', 'pie', 'table']}
              height={250}
              showSummaryCards={true}
              summaryMetrics={[
                {
                  label: 'Total Requisitions',
                  value: requests.length,
                  helper: `${requests.filter((r) => r.status === 'paid' || r.status === 'partially_paid').length} funded`,
                },
                {
                  label: 'Pending Approvals',
                  value: kpis.pendingRequestsCount,
                  helper: `TZS ${(kpis.pendingRequestsAmount / 1000).toFixed(0)}k in review`,
                },
                {
                  label: 'Total Spent',
                  value: `TZS ${(kpis.totalSpent / 1000000).toFixed(1)}M`,
                  helper: 'Disbursed to date',
                },
                {
                  label: 'Available Reserves',
                  value: `TZS ${(kpis.availableBalance / 1000000).toFixed(1)}M`,
                  helper: 'Unallocated funding',
                },
              ]}
            />
          )}

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 text-charcoal-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('finance.searchPlaceholder', 'Search requisitions, reference, payee...')}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-charcoal-muted shrink-0" />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FinancialRequestStatus | 'all')}
                className="text-xs"
              >
                <option value="all">{t('finance.allStatuses', 'All Workflow Statuses')}</option>
                <option value="submitted">{t('finance.status.submitted', 'Submitted (Tier 1 Pending)')}</option>
                <option value="under_review">{t('finance.status.under_review', 'Under Review (Tier 2 Pending)')}</option>
                <option value="approved">{t('finance.status.approved', 'Approved (Awaiting Disbursement)')}</option>
                <option value="partially_paid">{t('finance.status.partially_paid', 'Partially Paid')}</option>
                <option value="paid">{t('finance.status.paid', 'Paid in Full')}</option>
                <option value="returned">{t('finance.status.returned', 'Returned for Correction')}</option>
                <option value="rejected">{t('finance.status.rejected', 'Rejected')}</option>
              </Select>
            </div>
          </div>

          {/* Requests Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted/50 border-b border-surface-border text-charcoal-muted">
                  <tr>
                    <th className="py-3 px-4">{t('finance.reqNumber', 'Requisition #')}</th>
                    <th className="py-3 px-4">{t('finance.details', 'Details')}</th>
                    <th className="py-3 px-4">{t('finance.budgetLine', 'Budget Line')}</th>
                    <th className="py-3 px-4 text-right">{t('finance.amount', 'Amount (TZS)')}</th>
                    <th className="py-3 px-4 text-left w-[150px]">{t('common.status', 'Status')}</th>
                    <th className="py-3 px-4 text-right">{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-charcoal">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-charcoal-muted">
                        {t('common.loading', 'Loading...')}
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-charcoal-muted">
                        {t('finance.noRequestsFound', 'No financial requisitions match the current criteria.')}
                      </td>
                    </tr>
                  ) : (
                    requests
                      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                      .map((req) => {
                      const effectiveAmount = req.approvedAmount ?? req.totalAmount;
                      const isSelf = user?.id === req.requesterId;
                      const canReviewItem =
                        !isSelf &&
                        (req.status === 'submitted' || req.status === 'under_review') &&
                        (hasPermission('finance.approve') || hasRole('finance_officer') || isAdmin());
                      const canDisburseItem =
                        !isSelf &&
                        (req.status === 'approved' || req.status === 'partially_paid') &&
                        (hasPermission('finance.disburse') || isAdmin());

                      return (
                        <tr key={req.id} className="hover:bg-surface-muted/20">
                          <td className="py-3 px-4 font-bold text-forest-800">
                            {req.requestNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-charcoal">{req.title}</div>
                            <div className="text-2xs text-charcoal-muted flex items-center gap-2 mt-0.5">
                              <span>By: {req.requesterName}</span>
                              {req.dueDate && <span>• Due: {req.dueDate}</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-charcoal-muted truncate max-w-[160px]">
                            {req.budgetName || 'Organizational Core'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="font-bold text-charcoal">
                              {effectiveAmount.toLocaleString()}
                            </div>
                            {req.paidAmount > 0 && (
                              <div className="text-2xs text-forest-700">
                                Paid: {req.paidAmount.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-left w-[150px]">
                            {getStatusBadge(req.status)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setIsDetailOpen(true);
                                }}
                                className="h-7 px-2 text-xs"
                                title={t('common.view', 'View Details')}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>

                              {canReviewItem && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setSelectedRequest(req);
                                    setIsReviewOpen(true);
                                  }}
                                  className="h-7 px-2 text-xs"
                                >
                                  {t('finance.review', 'Review')}
                                </Button>
                              )}

                              {canDisburseItem && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => {
                                    setSelectedRequest(req);
                                    setIsPaymentOpen(true);
                                  }}
                                  className="h-7 px-2 text-xs"
                                >
                                  {t('finance.disburse', 'Pay')}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {requests.length > pageSize && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(requests.length / pageSize)}
                totalItems={requests.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: Budget Utilization */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((budget) => {
              const util = budget.utilizationPercentage;
              const isHigh = util >= 80;
              const isWarning = util >= 70 && util < 80;

              return (
                <Card key={budget.id} className="p-5 bg-white space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-2xs font-bold text-forest-700 tracking-wider uppercase">
                        {budget.code}
                      </span>
                      <h3 className="text-sm font-bold text-charcoal mt-0.5">{budget.name}</h3>
                      <p className="text-2xs text-charcoal-muted mt-0.5">
                        {budget.category} • FY {budget.fiscalYear}
                      </p>
                    </div>
                    <StatusIndicator status={budget.status} label={budget.status.toUpperCase()} />
                  </div>

                  {/* Utilization Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-charcoal-muted font-medium">
                        {t('finance.utilizationRate', 'Budget Utilization')}:
                      </span>
                      <span
                        className={`font-bold ${
                          isHigh
                            ? 'text-crimson-600'
                            : isWarning
                            ? 'text-amber-600'
                            : 'text-forest-700'
                        }`}
                      >
                        {util}%
                      </span>
                    </div>

                    <div className="h-2.5 w-full bg-surface-muted rounded-full overflow-hidden flex">
                      {/* Disbursed portion */}
                      <div
                        className="bg-forest-700 h-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (budget.totalSpent / (budget.allocatedAmount || 1)) * 100
                          )}%`,
                        }}
                        title={`Spent: ${budget.totalSpent.toLocaleString()}`}
                      />
                      {/* Committed portion */}
                      <div
                        className="bg-[#F2A507] h-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (budget.totalCommitted / (budget.allocatedAmount || 1)) * 100
                          )}%`,
                        }}
                        title={`Committed: ${budget.totalCommitted.toLocaleString()}`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-2xs text-charcoal-muted mt-1.5">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-forest-700 inline-block" />
                        Spent: {budget.totalSpent.toLocaleString()} TZS
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-[#F2A507] inline-block" />
                        Committed: {budget.totalCommitted.toLocaleString()} TZS
                      </span>
                    </div>
                  </div>

                  {/* Summary Breakdown Metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-surface-border text-xs">
                    <div>
                      <span className="text-charcoal-muted block">{t('finance.allocatedAmount', 'Allocated')}:</span>
                      <span className="font-bold text-charcoal">
                        {budget.allocatedAmount.toLocaleString()} TZS
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-charcoal-muted block">{t('finance.availableRemaining', 'Remaining')}:</span>
                      <span className="font-bold text-emerald-700">
                        {budget.availableBalance.toLocaleString()} TZS
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Disbursements Register */}
      {activeTab === 'transactions' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted/50 border-b border-surface-border text-charcoal-muted">
                <tr>
                  <th className="py-3 px-4">{t('finance.voucherRef', 'Voucher / Reference')}</th>
                  <th className="py-3 px-4">{t('finance.reqNumber', 'Requisition #')}</th>
                  <th className="py-3 px-4">{t('finance.paymentMethod', 'Channel')}</th>
                  <th className="py-3 px-4">{t('finance.disbursementDate', 'Payment Date')}</th>
                  <th className="py-3 px-4">{t('finance.payee', 'Beneficiary / Payee')}</th>
                  <th className="py-3 px-4 text-right">{t('finance.amount', 'Disbursed (TZS)')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-charcoal">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-charcoal-muted">
                      {t('finance.noTransactionsRecorded', 'No disbursement transactions recorded yet.')}
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-surface-muted/20">
                      <td className="py-3 px-4 font-bold text-forest-800">
                        {txn.paymentReference}
                      </td>
                      <td className="py-3 px-4 font-semibold text-charcoal">
                        {txn.requestNumber || '—'}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        {txn.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-charcoal-muted">
                        {txn.paymentDate}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal">{txn.payeeName}</div>
                        {txn.bankName && (
                          <div className="text-2xs text-charcoal-muted">
                            {txn.bankName} • {txn.bankAccountNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-forest-800">
                        {txn.amount.toLocaleString()} {txn.currency}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: Staff Statutory & Payroll Registry */}
      {activeTab === 'statutory' && (
        <Card className="p-6 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-forest-700" />
                Staff Statutory & Social Protection Registry
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Finance & Payroll administration: CWT union membership, NSSF/PSSF pension funds, NHIF health coverage, HESLB loan board status, and bank disbursement routing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-charcoal-700">
                {staffList.filter((s) => s.onboardingStatus === 'completed').length} / {staffList.length} Staff Enrolled
              </span>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted" />
              <input
                type="text"
                value={statutorySearch}
                onChange={(e) => setStatutorySearch(e.target.value)}
                placeholder="Search staff by name, staff ID, bank, or NSSF number..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-surface-border bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statutoryFilter}
                onChange={(e) => setStatutoryFilter(e.target.value as any)}
                className="px-3 py-2 text-sm rounded-lg border border-surface-border bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="all">All Compliance Statuses</option>
                <option value="pending_finance">Pending Finance Enrollment</option>
                <option value="completed">Fully Enrolled</option>
              </select>
            </div>
          </div>

          {/* Statutory Registry Table */}
          <div className="rounded-lg border border-surface-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-charcoal-600 font-semibold border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">CWT Number</th>
                  <th className="py-3 px-4">Social Security (NSSF / PSSF)</th>
                  <th className="py-3 px-4">NHIF Number</th>
                  <th className="py-3 px-4">Bank Disbursement</th>
                  <th className="py-3 px-4">HESLB Loan</th>
                  <th className="py-3 px-4">Onboarding Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {staffList
                  .filter((staff) => {
                    const matchesSearch =
                      staff.fullName.toLowerCase().includes(statutorySearch.toLowerCase()) ||
                      staff.staffNumber.toLowerCase().includes(statutorySearch.toLowerCase()) ||
                      (staff.nssfNumber && staff.nssfNumber.toLowerCase().includes(statutorySearch.toLowerCase())) ||
                      (staff.bankName && staff.bankName.toLowerCase().includes(statutorySearch.toLowerCase()));

                    const matchesFilter =
                      statutoryFilter === 'all' ||
                      (statutoryFilter === 'completed' && (!staff.onboardingStatus || staff.onboardingStatus === 'completed')) ||
                      staff.onboardingStatus === statutoryFilter;

                    return matchesSearch && matchesFilter;
                  })
                  .map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-white text-slate-500 font-bold flex items-center justify-center text-xs border border-slate-200 shrink-0">
                            {staff.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-charcoal-900">{staff.fullName}</div>
                            <div className="text-[11px] text-charcoal-muted tabular-nums">{staff.staffNumber}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-charcoal-800">{staff.jobTitle}</div>
                        <div className="text-[11px] text-charcoal-muted">{staff.departmentName}</div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {staff.cwtNumber || <span className="text-charcoal-muted font-sans italic text-[11px]">N/A</span>}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-charcoal-900">
                          {staff.nssfNumber ? `NSSF: ${staff.nssfNumber}` : staff.pssfNumber ? `PSSF: ${staff.pssfNumber}` : (
                            <span className="text-amber-700 italic font-sans text-[11px]">Pending Entry</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {staff.nhifNumber || <span className="text-amber-700 font-sans italic text-[11px]">Pending Entry</span>}
                      </td>

                      <td className="py-3 px-4">
                        {staff.bankName ? (
                          <div>
                            <div className="font-semibold text-charcoal-900">{staff.bankName}</div>
                            <div className="text-[11px] font-mono text-charcoal-muted">{staff.bankAccountNumber}</div>
                          </div>
                        ) : (
                          <span className="text-amber-700 italic text-[11px]">Pending Banking</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="capitalize text-[11px] font-medium text-charcoal-800">
                          {staff.loanBoardStatus ? staff.loanBoardStatus.replace(/_/g, ' ') : 'N/A'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {staff.onboardingStatus === 'pending_finance' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
                            <Clock className="h-3.5 w-3.5 text-blue-600" />
                            Pending Finance
                          </span>
                        ) : staff.onboardingStatus === 'pending_hr' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            Pending HR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Enrolled
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant={staff.onboardingStatus === 'pending_finance' ? 'primary' : 'outline'}
                          onClick={() => {
                            setStatutoryStaff(staff);
                            setIsStatutoryModalOpen(true);
                          }}
                        >
                          <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                          {staff.onboardingStatus === 'pending_finance' ? 'Enroll Staff' : 'Update'}
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      <CreateFinancialRequestModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <FinancialRequestDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        request={selectedRequest}
        onOpenReviewModal={() => {
          setIsDetailOpen(false);
          setIsReviewOpen(true);
        }}
        onOpenPaymentModal={() => {
          setIsDetailOpen(false);
          setIsPaymentOpen(true);
        }}
      />

      <ReviewFinancialRequestModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        request={selectedRequest}
        onSubmitDecision={handleReviewSubmit}
      />

      <RecordPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        request={selectedRequest}
        onSubmitPayment={handlePaymentSubmit}
      />

      <CompleteStatutoryModal
        isOpen={isStatutoryModalOpen}
        onClose={() => {
          setIsStatutoryModalOpen(false);
          setStatutoryStaff(null);
        }}
        staff={statutoryStaff}
        onSuccess={loadData}
      />
    </div>
  );
};
