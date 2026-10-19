/**
 * Finance & Budget Management Page
 * Babawatoto Organization Management System (BAOMS)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Briefcase,
  Scale,
  CheckSquare,
  FileSpreadsheet,
  LineChart,
  Printer,
  Download,
  AlertCircle,
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
  IncomeRecord,
  FinancialDocumentItem,
} from '../types/finance';
import {
  getFinancialRequests,
  getBudgets,
  getTransactions,
  getFinanceKpis,
  createFinancialRequest,
  reviewFinancialRequest,
  recordPayment,
  getIncomeRecords,
  getFinancialDocuments,
} from '../services/financeService';
import { CreateFinancialRequestPage } from './CreateFinancialRequestPage';
import { FinancialRequestDetailModal } from '../components/FinancialRequestDetailModal';
import { ReviewFinancialRequestModal } from '../components/ReviewFinancialRequestModal';
import { RecordPaymentPage } from './RecordPaymentPage';
import { ProjectFinancialTrackingView } from '../components/ProjectFinancialTrackingView';
import { ProcurementPaymentsView } from '../components/ProcurementPaymentsView';
import { FinancialApprovalsView } from '../components/FinancialApprovalsView';

export type FinanceTab =
  | 'requests'
  | 'budgets'
  | 'income'
  | 'transactions'
  | 'projects'
  | 'procurement'
  | 'approvals'
  | 'documents'
  | 'reports'
  | 'statutory';

export interface FinancePageProps {
  initialTab?: FinanceTab;
}

export const FinancePage: React.FC<FinancePageProps> = ({ initialTab = 'requests' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, roles, hasPermission, hasRole, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<FinanceTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: FinanceTab) => {
    setActiveTab(tab);
    const routeMap: Record<FinanceTab, string> = {
      requests: '/finance/expenditure',
      budgets: '/finance/budgets',
      income: '/finance/income',
      transactions: '/finance/transactions',
      projects: '/finance/projects',
      procurement: '/finance/procurement',
      approvals: '/finance/approvals',
      documents: '/finance/documents',
      reports: '/finance/reports',
      statutory: '/finance/statutory',
    };
    if (routeMap[tab]) {
      navigate(routeMap[tab]);
    }
  };

  const [requests, setRequests] = useState<FinancialRequestRecord[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [documents, setDocuments] = useState<FinancialDocumentItem[]>([]);
  const [staffList, setStaffList] = useState<StaffProfileRecord[]>([]);
  const [statutoryStaff, setStatutoryStaff] = useState<StaffProfileRecord | null>(null);
  const [isStatutoryModalOpen, setIsStatutoryModalOpen] = useState(false);
  const [statutorySearch, setStatutorySearch] = useState('');
  const [statutoryFilter, setStatutoryFilter] = useState<'all' | 'pending_finance' | 'completed'>('all');
  const [incomeSearch, setIncomeSearch] = useState('');
  const [incomeFilter, setIncomeFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [docSearch, setDocSearch] = useState('');
  const [docFilter, setDocFilter] = useState<'all' | 'Payment Voucher' | 'Receipt / Invoice' | 'supporting_doc'>('all');
  const [reportsPeriod, setReportsPeriod] = useState<'all' | 'FY2026' | 'Q1'>('FY2026');

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
      const [reqsData, budgetsData, txnsData, kpisData, staffData, incomeData, docsData] = await Promise.all([
        getFinancialRequests({ search: searchQuery, status: statusFilter }),
        getBudgets(),
        getTransactions(),
        getFinanceKpis(),
        getStaffProfiles(),
        getIncomeRecords(),
        getFinancialDocuments(),
      ]);

      setRequests(reqsData);
      setBudgets(budgetsData);
      setTransactions(txnsData);
      setKpis(kpisData);
      setStaffList(staffData);
      setIncomeRecords(incomeData);
      setDocuments(docsData);
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
        <Card className="p-4 bg-white min-w-0 shadow-xs border-slate-200">
          <div className="flex items-center justify-between gap-2 text-charcoal-muted min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider truncate">
              {t('finance.kpi.totalBudget', 'Authorized Budget')}
            </span>
            <Wallet className="h-4 w-4 shrink-0 text-[#374151]" />
          </div>
          <div className="mt-2 text-[26px] sm:text-[32px] font-bold text-charcoal-900 leading-[1.2] font-mono tabular-nums truncate">
            {kpis.totalBudget.toLocaleString()} <span className="text-xs font-normal text-charcoal-muted">TZS</span>
          </div>
          <div className="text-2xs text-charcoal-muted mt-1 truncate">
            Across {budgets.length} active budget lines
          </div>
        </Card>

        {/* Total Spent */}
        <Card className="p-4 bg-white min-w-0 shadow-xs border-slate-200">
          <div className="flex items-center justify-between gap-2 text-charcoal-muted min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider truncate">
              {t('finance.kpi.totalSpent', 'Actual Disbursed')}
            </span>
            <CreditCard className="h-4 w-4 shrink-0 text-[#374151]" />
          </div>
          <div className="mt-2 text-[26px] sm:text-[32px] font-bold text-charcoal-900 leading-[1.2] font-mono tabular-nums truncate">
            {kpis.totalSpent.toLocaleString()} <span className="text-xs font-normal text-charcoal-muted">TZS</span>
          </div>
          <div className="text-2xs text-charcoal-muted mt-1 truncate">
            {transactions.length} completed disbursement transactions
          </div>
        </Card>

        {/* Committed Amount */}
        <Card className="p-4 bg-white min-w-0 shadow-xs border-slate-200">
          <div className="flex items-center justify-between gap-2 text-charcoal-muted min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider truncate">
              {t('finance.kpi.totalCommitted', 'Approved Commitments')}
            </span>
            <CheckCircle className="h-4 w-4 shrink-0 text-[#374151]" />
          </div>
          <div className="mt-2 text-[26px] sm:text-[32px] font-bold text-charcoal-900 leading-[1.2] font-mono tabular-nums truncate">
            {kpis.totalCommitted.toLocaleString()} <span className="text-xs font-normal text-charcoal-muted">TZS</span>
          </div>
          <div className="text-2xs text-charcoal-muted mt-1 truncate">
            Pending disbursement release
          </div>
        </Card>

        {/* Available Balance */}
        <Card className="p-4 bg-white min-w-0 shadow-xs border-slate-200">
          <div className="flex items-center justify-between gap-2 text-charcoal-muted min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider truncate">
              {t('finance.kpi.availableBalance', 'Available Balance')}
            </span>
            <TrendingUp className="h-4 w-4 shrink-0 text-[#374151]" />
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
      <div className="border-b border-surface-border overflow-x-auto no-scrollbar">
        <nav className="flex space-x-6 min-w-max pb-0.5">
          <button
            onClick={() => handleTabChange('requests')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-[#D68904] text-charcoal-900'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <FileText className="h-4 w-4 text-[#374151]" />
            <span>{t('finance.tabs.requests', 'Requisitions')}</span>
            <span className="rounded-full bg-slate-100 text-charcoal-800 text-xs px-2 py-0.5 font-bold">
              {requests.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('budgets')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'budgets'
                ? 'border-[#D68904] text-charcoal-900'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Wallet className="h-4 w-4 text-[#374151]" />
            <span>{t('finance.tabs.budgets', 'Budget Utilization')}</span>
            <span className="rounded-full bg-slate-100 text-charcoal-muted text-xs px-2 py-0.5 font-bold">
              {budgets.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('income')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'income'
                ? 'border-[#D68904] text-charcoal-900'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <TrendingUp className="h-4 w-4 text-[#374151]" />
            <span>Income & Receipts</span>
            <span className="rounded-full bg-slate-100 text-charcoal-muted text-xs px-2 py-0.5 font-bold">
              {incomeRecords.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('transactions')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'transactions'
                ? 'border-[#D68904] text-charcoal-900'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <CreditCard className="h-4 w-4 text-[#374151]" />
            <span>{t('finance.tabs.transactions', 'Disbursements Register')}</span>
            <span className="rounded-full bg-slate-100 text-charcoal-muted text-xs px-2 py-0.5 font-bold">
              {transactions.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('projects')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'projects'
                ? 'border-[#D68904] text-charcoal-900'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Briefcase className="h-4 w-4 text-[#374151]" />
            <span>Project Financials</span>
          </button>

          <button
            onClick={() => handleTabChange('procurement')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'procurement'
                ? 'border-[#D68904] text-charcoal-900'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Scale className="h-4 w-4 text-[#374151]" />
            <span>Procurement Invoices</span>
          </button>

          <button
            onClick={() => handleTabChange('approvals')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'border-[#D68904] text-charcoal-900'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <CheckSquare className="h-4 w-4 text-[#374151]" />
            <span>Approvals</span>
            {requests.filter((r) => r.status === 'submitted' || r.status === 'under_review').length > 0 && (
              <span className="rounded-full bg-amber-100 text-amber-800 text-xs px-2 py-0.5 font-bold">
                {requests.filter((r) => r.status === 'submitted' || r.status === 'under_review').length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('documents')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'border-[#D68904] text-charcoal-900'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 text-[#374151]" />
            <span>Documents & Vouchers</span>
            <span className="rounded-full bg-slate-100 text-charcoal-muted text-xs px-2 py-0.5 font-bold">
              {documents.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('reports')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'border-[#D68904] text-charcoal-900'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <LineChart className="h-4 w-4 text-[#374151]" />
            <span>Financial Reports</span>
          </button>

          <button
            onClick={() => handleTabChange('statutory')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'statutory'
                ? 'border-[#D68904] text-charcoal-900'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-[#374151]" />
            <span>Statutory & Payroll</span>
            {staffList.filter((s) => s.onboardingStatus === 'pending_finance').length > 0 ? (
              <span className="rounded-full bg-amber-100 text-amber-800 text-xs px-2 py-0.5 font-bold">
                {staffList.filter((s) => s.onboardingStatus === 'pending_finance').length}
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

      {/* TAB: Income & Receipts Register */}
      {activeTab === 'income' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-white border-slate-200 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                Total Recorded Income
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-charcoal-900 tabular-nums">
                {incomeRecords.reduce((sum, r) => sum + r.amount, 0).toLocaleString()} <span className="text-xs font-normal text-charcoal-muted">TZS</span>
              </div>
              <div className="text-2xs text-charcoal-muted mt-0.5">Across all authorized revenue streams</div>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                Confirmed Receipts
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-emerald-800 tabular-nums">
                {incomeRecords.filter((r) => r.status === 'confirmed').reduce((sum, r) => sum + r.amount, 0).toLocaleString()} <span className="text-xs font-normal text-charcoal-muted">TZS</span>
              </div>
              <div className="text-2xs text-charcoal-muted mt-0.5">Cleared & recognized allocations</div>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                Funding Allocations
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-charcoal-900">
                {incomeRecords.length}
              </div>
              <div className="text-2xs text-charcoal-muted mt-0.5">Institutional grants & donor allocations</div>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 text-charcoal-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={incomeSearch}
                onChange={(e) => setIncomeSearch(e.target.value)}
                placeholder="Search income, donor, reference..."
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-charcoal-muted shrink-0" />
              <Select
                value={incomeFilter}
                onChange={(e) => setIncomeFilter(e.target.value as any)}
                className="text-xs"
              >
                <option value="all">All Receipt Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending Reconciliation</option>
              </Select>
            </div>
          </div>

          {/* Income Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted/50 border-b border-surface-border text-charcoal-muted">
                  <tr>
                    <th className="py-3 px-4">Reference #</th>
                    <th className="py-3 px-4">Funding Stream</th>
                    <th className="py-3 px-4">Partner / Donor</th>
                    <th className="py-3 px-4">Allocated Project</th>
                    <th className="py-3 px-4">Recognition Date</th>
                    <th className="py-3 px-4 text-right">Amount (TZS)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-charcoal">
                  {incomeRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-charcoal-muted">
                        No income or receipt allocations recorded.
                      </td>
                    </tr>
                  ) : (
                    incomeRecords
                      .filter((r) => {
                        const matchSearch =
                          !incomeSearch.trim() ||
                          r.referenceNumber.toLowerCase().includes(incomeSearch.toLowerCase()) ||
                          r.donorName.toLowerCase().includes(incomeSearch.toLowerCase()) ||
                          (r.projectName && r.projectName.toLowerCase().includes(incomeSearch.toLowerCase())) ||
                          r.source.toLowerCase().includes(incomeSearch.toLowerCase());
                        const matchFilter = incomeFilter === 'all' || r.status === incomeFilter;
                        return matchSearch && matchFilter;
                      })
                      .map((inc) => (
                        <tr key={inc.id} className="hover:bg-surface-muted/20">
                          <td className="py-3 px-4 font-mono font-bold text-forest-800">
                            {inc.referenceNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-charcoal">{inc.source}</div>
                            <div className="text-2xs text-charcoal-muted capitalize">{inc.category}</div>
                          </td>
                          <td className="py-3 px-4 font-medium text-charcoal">
                            {inc.donorName}
                          </td>
                          <td className="py-3 px-4 text-charcoal-muted">
                            {inc.projectName}
                          </td>
                          <td className="py-3 px-4 text-charcoal-muted tabular-nums">
                            {inc.date}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-charcoal-900 tabular-nums">
                            {inc.amount.toLocaleString()} {inc.currency}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold ${
                                inc.status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {inc.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
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

      {/* TAB: Project Financial Tracking */}
      {activeTab === 'projects' && (
        <ProjectFinancialTrackingView />
      )}

      {/* TAB: Procurement Payments Handover */}
      {activeTab === 'procurement' && (
        <ProcurementPaymentsView />
      )}

      {/* TAB: Financial Approvals */}
      {activeTab === 'approvals' && (
        <FinancialApprovalsView
          requests={requests}
          onSelectRequest={(req) => {
            setSelectedRequest(req);
            setIsDetailOpen(true);
          }}
          onOpenReviewModal={(req) => {
            setSelectedRequest(req);
            setIsReviewOpen(true);
          }}
        />
      )}

      {/* TAB: Financial Documents & Vouchers */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-white border-slate-200 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                Total Financial Documents
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-charcoal-900">
                {documents.length}
              </div>
              <div className="text-2xs text-charcoal-muted mt-0.5">Vouchers, invoices, & attached evidence</div>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                Payment Vouchers
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-charcoal-900">
                {documents.filter((d) => d.source === 'transaction_receipt').length}
              </div>
              <div className="text-2xs text-charcoal-muted mt-0.5">Disbursement payment receipts</div>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                Requisition Invoices
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-charcoal-900">
                {documents.filter((d) => d.source === 'requisition_attachment').length}
              </div>
              <div className="text-2xs text-charcoal-muted mt-0.5">Audited claim documentation</div>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 text-charcoal-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Search document title, reference, payee..."
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-charcoal-muted shrink-0" />
              <Select
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value as any)}
                className="text-xs"
              >
                <option value="all">All Document Types</option>
                <option value="Payment Voucher">Payment Vouchers</option>
                <option value="Receipt / Invoice">Receipts & Invoices</option>
              </Select>
            </div>
          </div>

          {/* Document Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted/50 border-b border-surface-border text-charcoal-muted">
                  <tr>
                    <th className="py-3 px-4">Reference #</th>
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Related Entity</th>
                    <th className="py-3 px-4">Date Logged</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-charcoal">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-charcoal-muted">
                        No financial documents found in repository.
                      </td>
                    </tr>
                  ) : (
                    documents
                      .filter((d) => {
                        const matchSearch =
                          !docSearch.trim() ||
                          d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
                          d.referenceNumber.toLowerCase().includes(docSearch.toLowerCase()) ||
                          d.relatedEntity.toLowerCase().includes(docSearch.toLowerCase());
                        const matchFilter = docFilter === 'all' || d.documentType === docFilter;
                        return matchSearch && matchFilter;
                      })
                      .map((doc) => (
                        <tr key={doc.id} className="hover:bg-surface-muted/20">
                          <td className="py-3 px-4 font-mono font-bold text-forest-800">
                            {doc.referenceNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-charcoal">{doc.title}</div>
                            {doc.fileSize && (
                              <div className="text-2xs text-charcoal-muted">{doc.fileSize}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium bg-slate-100 text-slate-800">
                              {doc.documentType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-charcoal">
                            {doc.relatedEntity}
                          </td>
                          <td className="py-3 px-4 text-charcoal-muted tabular-nums">
                            {doc.uploadedAt ? doc.uploadedAt.slice(0, 10) : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-2xs text-charcoal-muted capitalize">
                              {doc.source.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => showSuccess('Document verified in secure audit repository.')}
                              className="h-7 px-2 text-xs"
                              title="Verify Record"
                            >
                              <Eye className="h-3.5 w-3.5 text-[#374151]" />
                            </Button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB: Financial Reports & Analytics */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">
                Executive Financial Accountability & Performance Report
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Consolidated financial summary, budget utilization analysis, and fund absorption rates across BAOMS operations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs"
              >
                <Printer className="h-3.5 w-3.5 text-[#374151]" />
                <span>Print Report</span>
              </Button>
            </div>
          </div>

          {/* Key Accountability Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border-slate-200 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                Authorized Budget
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-charcoal-900 tabular-nums">
                {kpis.totalBudget.toLocaleString()} <span className="text-xs font-normal text-charcoal-muted">TZS</span>
              </div>
              <div className="text-2xs text-charcoal-muted mt-0.5">Total approved funding envelope</div>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                Actual Expenditure
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-charcoal-900 tabular-nums">
                {kpis.totalSpent.toLocaleString()} <span className="text-xs font-normal text-charcoal-muted">TZS</span>
              </div>
              <div className="text-2xs text-charcoal-muted mt-0.5">Total disbursed funds</div>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                Approved Commitments
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-amber-800 tabular-nums">
                {kpis.totalCommitted.toLocaleString()} <span className="text-xs font-normal text-charcoal-muted">TZS</span>
              </div>
              <div className="text-2xs text-charcoal-muted mt-0.5">Pending disbursement release</div>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                Budget Absorption Rate
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-emerald-800 tabular-nums">
                {kpis.totalBudget > 0
                  ? ((kpis.totalSpent / kpis.totalBudget) * 100).toFixed(1)
                  : '0.0'}%
              </div>
              <div className="text-2xs text-charcoal-muted mt-0.5">Disbursement execution index</div>
            </Card>
          </div>

          {/* Visual Breakdown */}
          {requests.length > 0 && (
            <AnalyticsVisualizer
              title="Expenditure Breakdown by Requisition Category"
              description="Real-time multi-dimensional financial visualization (Bar, Line, Distribution, Table)"
              data={financialAnalyticsData}
              valuePrefix="TZS "
              defaultMode="bar"
              availableModes={['bar', 'line', 'pie', 'table']}
              height={260}
            />
          )}

          {/* Budget Line Ledger Table */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 bg-surface-muted/30 border-b border-surface-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-800">
                Operational & Project Budget Line Ledger
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted/50 border-b border-surface-border text-charcoal-muted">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Budget Line</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Allocated (TZS)</th>
                    <th className="py-3 px-4 text-right">Committed (TZS)</th>
                    <th className="py-3 px-4 text-right">Disbursed (TZS)</th>
                    <th className="py-3 px-4 text-right">Remaining (TZS)</th>
                    <th className="py-3 px-4 text-right">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-charcoal">
                  {budgets.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-muted/20">
                      <td className="py-3 px-4 font-mono font-bold text-forest-800">{b.code}</td>
                      <td className="py-3 px-4 font-semibold text-charcoal">{b.name}</td>
                      <td className="py-3 px-4 capitalize text-charcoal-muted">{b.category}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">{b.allocatedAmount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700">{b.totalCommitted.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-forest-700">{b.totalSpent.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-800">{b.availableBalance.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            b.utilizationPercentage >= 80
                              ? 'text-crimson-600'
                              : b.utilizationPercentage >= 60
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }
                        >
                          {b.utilizationPercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB: Staff Statutory & Payroll Registry */}
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

      {/* Full-Page Steppers */}
      {isCreateOpen && (
        <CreateFinancialRequestPage
          onSuccess={async () => {
            setIsCreateOpen(false);
            await loadData();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      )}

      {isPaymentOpen && (
        <RecordPaymentPage
          initialRequest={selectedRequest}
          onSuccess={async () => {
            setIsPaymentOpen(false);
            await loadData();
          }}
          onCancel={() => setIsPaymentOpen(false)}
        />
      )}

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
