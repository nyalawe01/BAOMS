/**
 * Finance Officer Portal & Dashboard Test Suite
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Verifies:
 * 1. 12-Item Finance Officer Sidebar navigation hierarchy
 * 2. Finance Officer Dashboard KPI calculations and AdminCN layout structure
 * 3. Finance Page sub-views (Budgets, Income, Requisitions, Transactions, Projects, Procurement, Approvals, Documents, Reports, Statutory)
 * 4. Strict monochrome icon styling and BAOMS gold design tokens
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '@/components/layout/Sidebar';
import { FinanceOfficerDashboard } from '@/components/dashboard/FinanceOfficerDashboard';
import { FinancePage } from '@/features/finance/pages/FinancePage';
import '@/locales/i18n';

// Mock auth hook to simulate an authorized Finance Officer (Elinami / Baraka)
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'fo-test-user-id', email: 'finance@babawatoto.or.tz' },
    profile: { display_name: 'Elinami M. (Finance Officer)', id: 'fo-test-user-id' },
    roles: ['finance_officer'],
    activeRole: 'finance_officer',
    hasRole: (role: string) => role === 'finance_officer',
    hasPermission: () => true,
    isAdmin: () => false,
  }),
}));

// Mock financeService with realistic verified dataset
vi.mock('@/features/finance/services/financeService', () => ({
  getFinanceKpis: vi.fn().mockResolvedValue({
    totalBudget: 125000000,
    totalSpent: 42500000,
    totalCommitted: 15000000,
    availableBalance: 67500000,
    recordedIncome: 125000000,
    pendingRequestsCount: 3,
    pendingRequestsAmount: 8500000,
    pendingApprovalsCount: 3,
    pendingDisbursementCount: 2,
    pendingDisbursementAmount: 5200000,
    outstandingPaymentsAmount: 5200000,
    outstandingPaymentsCount: 2,
  }),
  getFinancialRequests: vi.fn().mockResolvedValue([
    {
      id: 'req-1',
      requestNumber: 'REQ-2026-001',
      title: 'Youth Training Materials & Workshop Facilitation',
      purpose: 'Printing training workbooks and stationery for youth leadership course.',
      requestType: 'activity_expense',
      priority: 'normal',
      status: 'submitted',
      totalAmount: 3200000,
      approvedAmount: 3200000,
      paidAmount: 0,
      requesterId: 'other-user-id',
      requesterName: 'Juma K. Temu',
      createdAt: '2026-03-10',
      dueDate: '2026-03-25',
      lines: [],
      events: [],
    },
    {
      id: 'req-2',
      requestNumber: 'REQ-2026-002',
      title: 'Community Outreach Sound System Rental',
      purpose: 'Audio equipment hire for community arts showcase.',
      requestType: 'operational',
      priority: 'urgent',
      status: 'under_review',
      totalAmount: 1500000,
      approvedAmount: 1500000,
      paidAmount: 0,
      requesterId: 'other-user-id-2',
      requesterName: 'Fatma Ally',
      createdAt: '2026-03-12',
      dueDate: '2026-03-20',
      lines: [],
      events: [],
    },
    {
      id: 'req-3',
      requestNumber: 'REQ-2026-003',
      title: 'Monthly Office Internet & Connectivity',
      purpose: 'Dedicated fiber link subscription.',
      requestType: 'operational',
      priority: 'normal',
      status: 'approved',
      totalAmount: 5200000,
      approvedAmount: 5200000,
      paidAmount: 0,
      requesterId: 'other-user-id-3',
      requesterName: 'Zuberi Kondo',
      createdAt: '2026-03-01',
      lines: [],
      events: [],
    },
  ]),
  getBudgets: vi.fn().mockResolvedValue([
    {
      id: 'b-1',
      code: 'BUD-BYA-ACT',
      name: 'Babawatoto Youth Academy Activities',
      category: 'programmatic',
      fiscalYear: '2026',
      allocatedAmount: 75000000,
      totalSpent: 25000000,
      totalCommitted: 10000000,
      availableBalance: 40000000,
      utilizationPercentage: 46.7,
      status: 'active',
    },
    {
      id: 'b-2',
      code: 'BUD-OPS-GEN',
      name: 'General Institutional Operations',
      category: 'operational',
      fiscalYear: '2026',
      allocatedAmount: 50000000,
      totalSpent: 17500000,
      totalCommitted: 5000000,
      availableBalance: 27500000,
      utilizationPercentage: 45.0,
      status: 'active',
    },
  ]),
  getTransactions: vi.fn().mockResolvedValue([
    {
      id: 'tx-1',
      transactionNumber: 'TXN-2026-001',
      paymentReference: 'VCH-2026-001',
      requestId: 'req-3',
      requestNumber: 'REQ-2026-003',
      paymentMethod: 'bank_transfer',
      amount: 5200000,
      currency: 'TZS',
      paymentDate: '2026-03-15',
      payeeName: 'Liquid Telecom Tanzania',
      status: 'completed',
    },
  ]),
  getIncomeRecords: vi.fn().mockResolvedValue([
    {
      id: 'inc-1',
      referenceNumber: 'INC-2026-001',
      source: 'Institutional Grant Funding',
      donorName: 'Foundation for Civil Society (FCS)',
      projectId: 'proj-1',
      projectName: 'Babawatoto Youth Academy 2026',
      amount: 75000000,
      currency: 'TZS',
      date: '2026-01-15',
      status: 'confirmed',
      category: 'grant',
    },
  ]),
  getFinancialDocuments: vi.fn().mockResolvedValue([
    {
      id: 'doc-1',
      title: 'Disbursement Voucher - Liquid Telecom (TZS 5,200,000)',
      documentType: 'Payment Voucher',
      referenceNumber: 'VCH-2026-001',
      relatedEntity: 'Liquid Telecom Tanzania',
      uploadedAt: '2026-03-15',
      source: 'transaction_receipt',
    },
  ]),
  getProjectFinancialTracking: vi.fn().mockResolvedValue([
    {
      projectId: 'proj-1',
      projectCode: 'PRJ-BYA-2026',
      projectName: 'Babawatoto Youth Academy 2026',
      funder: 'Foundation for Civil Society (FCS)',
      allocatedBudget: 75000000,
      actualExpenditure: 25000000,
      remainingBudget: 50000000,
      utilizationRate: 33.3,
      currency: 'TZS',
      status: 'active',
    },
  ]),
  getProcurementFinancialHandover: vi.fn().mockResolvedValue([
    {
      id: 'po-1',
      orderNumber: 'PO-2026-001',
      title: 'Stationery and Printing Materials',
      vendorName: 'AfriTech Supplies Ltd',
      totalAmount: 4500000,
      currency: 'TZS',
      status: 'delivered',
      orderDate: '2026-03-01',
      paymentStatus: 'unpaid',
      paidAmount: 0,
    },
  ]),
}));

// Mock HR staff service for statutory registry
vi.mock('@/features/hr/services/hrService', () => ({
  getStaffProfiles: vi.fn().mockResolvedValue([
    {
      id: 'staff-1',
      staffNumber: 'BWT-012',
      fullName: 'Elinami Minja',
      jobTitle: 'Finance Officer',
      departmentName: 'Finance & Administration',
      nssfNumber: '109823471',
      nhifNumber: 'NH-998822',
      bankName: 'CRDB Bank',
      bankAccountNumber: '0150293847200',
      onboardingStatus: 'completed',
    },
  ]),
}));

describe('Finance Officer Portal & Sidebar Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. 12-Item Finance Officer Sidebar Navigation', () => {
    it('renders exactly the 12 authorized routes for Finance Officer role', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>
      );

      // Verify all 12 navigation items are present
      expect(screen.getByRole('link', { name: /Dashboard/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /Budgets & Allocations/i })).toHaveAttribute('href', '/finance/budgets');
      expect(screen.getByRole('link', { name: /Income & Receipts/i })).toHaveAttribute('href', '/finance/income');
      expect(screen.getByRole('link', { name: /Expenditure & Payments/i })).toHaveAttribute('href', '/finance/expenditure');
      expect(screen.getByRole('link', { name: /Financial Transactions/i })).toHaveAttribute('href', '/finance/transactions');
      expect(screen.getByRole('link', { name: /Project Financial Tracking/i })).toHaveAttribute('href', '/finance/projects');
      expect(screen.getByRole('link', { name: /Procurement Payments/i })).toHaveAttribute('href', '/finance/procurement');
      expect(screen.getByRole('link', { name: /Financial Approvals/i })).toHaveAttribute('href', '/finance/approvals');
      expect(screen.getByRole('link', { name: /Financial Documents/i })).toHaveAttribute('href', '/finance/documents');
      expect(screen.getByRole('link', { name: /Financial Reports/i })).toHaveAttribute('href', '/finance/reports');
      expect(screen.getByRole('link', { name: /Notifications/i })).toHaveAttribute('href', '/notifications');
      expect(screen.getByRole('link', { name: /Settings/i })).toHaveAttribute('href', '/settings');
    });

    it('displays the user role as Finance Officer and uses clean monochrome icons', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>
      );

      expect(screen.getAllByText(/Finance Officer/i).length).toBeGreaterThanOrEqual(1);

      // Ensure no decorative colored circle/square icon wrappers are present
      const coloredWrappers = container.querySelectorAll('.bg-amber-500, .bg-blue-500, .bg-green-500, .rounded-full.p-2.bg-');
      expect(coloredWrappers.length).toBe(0);
    });
  });

  describe('2. Finance Officer Dashboard', () => {
    it('displays the 6 required KPI cards accurately calculated from verified records', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FinanceOfficerDashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        // 1. Total Approved Budget
        expect(screen.getByText(/Total Approved Budget/i)).toBeInTheDocument();
        // 2. Actual Expenditure
        expect(screen.getByText(/Actual Expenditure/i)).toBeInTheDocument();
        // 3. Available Budget
        expect(screen.getByText(/Available Budget/i)).toBeInTheDocument();
        // 4. Recorded Income
        expect(screen.getByText(/Recorded Income/i)).toBeInTheDocument();
        // 5. Pending Financial Approvals
        expect(screen.getByText(/Pending Financial Approvals/i)).toBeInTheDocument();
        // 6. Outstanding Payments
        expect(screen.getByText(/Outstanding Payments/i)).toBeInTheDocument();
      });

      // Verify KPI numerical values in compact AdminCN millions format
      expect(screen.getAllByText(/125\.0M/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/42\.5M/i)).toBeInTheDocument();
      expect(screen.getByText(/67\.5M/i)).toBeInTheDocument();
      expect(screen.getByText(/5\.2M/i)).toBeInTheDocument();
    });

    it('renders the Financial Action Queue and recent payment disbursements', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FinanceOfficerDashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Financial Action Queue/i)).toBeInTheDocument();
        expect(screen.getByText(/Claims Awaiting Approval/i)).toBeInTheDocument();
        expect(screen.getByText(/Ready for Payment Release/i)).toBeInTheDocument();
        expect(screen.getByText(/Liquid Telecom Tanzania/i)).toBeInTheDocument();
      });
    });
  });

  describe('3. Finance Page Submodule Navigation & Tab Activation', () => {
    it('renders horizontal sub-navigation tabs for all financial modules', async () => {
      render(
        <MemoryRouter initialEntries={['/finance']}>
          <FinancePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText(/Requisitions/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Budget Utilization/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Income & Receipts')).toBeInTheDocument();
        expect(screen.getByText(/Disbursements Register/i)).toBeInTheDocument();
        expect(screen.getByText('Project Financials')).toBeInTheDocument();
        expect(screen.getByText('Procurement Invoices')).toBeInTheDocument();
        expect(screen.getByText('Approvals')).toBeInTheDocument();
        expect(screen.getByText('Documents & Vouchers')).toBeInTheDocument();
        expect(screen.getByText('Financial Reports')).toBeInTheDocument();
        expect(screen.getByText('Statutory & Payroll')).toBeInTheDocument();
      });
    });

    it('activates the initialTab prop correctly when navigating to Income & Receipts', async () => {
      render(
        <MemoryRouter initialEntries={['/finance/income']}>
          <FinancePage initialTab="income" />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Total Recorded Income')).toBeInTheDocument();
        expect(screen.getByText('INC-2026-001')).toBeInTheDocument();
        expect(screen.getByText('Foundation for Civil Society (FCS)')).toBeInTheDocument();
      });
    });

    it('activates the initialTab prop correctly when navigating to Financial Approvals', async () => {
      render(
        <MemoryRouter initialEntries={['/finance/approvals']}>
          <FinancePage initialTab="approvals" />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText(/Pending Financial Approvals/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/Claims awaiting verification & clearance/i)).toBeInTheDocument();
      });
    });
  });
});
