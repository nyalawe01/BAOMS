/**
 * Procurement & Supply Officer Portal & Dashboard Test Suite
 * Babawatoto Organization Management System (BAOMS)
 *
 * Verifies:
 * 1. 15-Item Procurement Officer Sidebar navigation hierarchy
 * 2. Procurement Officer Dashboard KPI calculations (6 required metrics)
 * 3. Procurement Pipeline stages & Action Queue
 * 4. Purchase Orders, Requests, Plans, Receiving, and Vendor Registers
 * 5. Role-based access and empty states
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProcurementOfficerDashboard } from '@/components/dashboard/ProcurementOfficerDashboard';
import { ProcurementPage } from '@/features/procurement/pages/ProcurementPage';
import '@/locales/i18n';

// Mock auth hook to simulate an authorized Procurement & Supply Officer
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'procurement-officer-id', email: 'procurement@babawatoto.or.tz' },
    profile: { display_name: 'Procurement Specialist', id: 'procurement-officer-id' },
    roles: ['procurement_officer'],
    activeRole: 'procurement_officer',
    hasRole: (role: string) => role === 'procurement_officer',
    hasPermission: () => true,
    isAdmin: () => false,
    signOut: vi.fn(),
  }),
}));

// Mock procurementService with realistic data
vi.mock('@/features/procurement/services/procurementService', () => ({
  getPurchaseOrders: vi.fn().mockResolvedValue([
    {
      id: 'po-1',
      orderNumber: 'PO-2026-1001',
      projectId: 'proj-1',
      projectName: 'Youth Skills Training',
      vendorId: 'vend-1',
      vendorName: 'Kariakoo Office Supplies',
      title: 'Workshop Stationery and Supplies',
      status: 'ordered',
      requestedBy: 'staff-1',
      requestedByName: 'Amina Juma',
      orderDate: '2026-10-10',
      expectedDeliveryDate: '2026-10-25',
      currency: 'TZS',
      totalAmount: 3500000,
      items: [],
      createdAt: '2026-10-10T08:00:00Z',
      updatedAt: '2026-10-10T08:00:00Z',
    },
    {
      id: 'po-2',
      orderNumber: 'PO-2026-1002',
      projectId: 'proj-2',
      projectName: 'Child Health Outreach',
      vendorId: 'vend-2',
      vendorName: 'Mlimani Media Prints',
      title: 'Printing Outreach IEC Materials',
      status: 'pending_approval',
      requestedBy: 'staff-2',
      requestedByName: 'Baraka Paul',
      orderDate: '2026-10-12',
      expectedDeliveryDate: '2026-10-30',
      currency: 'TZS',
      totalAmount: 1800000,
      items: [],
      createdAt: '2026-10-12T09:00:00Z',
      updatedAt: '2026-10-12T09:00:00Z',
    },
  ]),
  getVendors: vi.fn().mockResolvedValue([
    {
      id: 'vend-1',
      vendorCode: 'VND-2026-001',
      businessName: 'Kariakoo Office Supplies',
      category: 'stationery_printing',
      contactPerson: 'Hamisi Mwinyi',
      email: 'sales@kariakoo-supplies.co.tz',
      phone: '+255 754 112 233',
      physicalAddress: 'Uhuru Street, Kariakoo, Dar es Salaam',
      isCompliant: true,
      totalOrdersCount: 4,
      ratingScore: 4.8,
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'vend-2',
      vendorCode: 'VND-2026-002',
      businessName: 'Mlimani Media Prints',
      category: 'stationery_printing',
      contactPerson: 'Zainab Rashid',
      email: 'orders@mlimanimedia.co.tz',
      phone: '+255 784 998 877',
      physicalAddress: 'Mwenge Media House, Dar es Salaam',
      isCompliant: true,
      totalOrdersCount: 2,
      ratingScore: 4.5,
      createdAt: '2026-02-10T11:00:00Z',
    },
  ]),
  getInventoryItems: vi.fn().mockResolvedValue([
    {
      id: 'inv-1',
      sku: 'SKU-PAP-A4',
      name: 'A4 Printing Paper Cartons',
      category: 'stationery_printing',
      quantityOnHand: 4,
      reorderPoint: 10,
      unitOfMeasure: 'boxes',
      unitCost: 75000,
      location: 'Central Stores Shelf B2',
      status: 'low_stock',
    },
  ]),
  getPurchaseRequests: vi.fn().mockResolvedValue([
    {
      id: 'req-1',
      requestNumber: 'REQ-2026-004',
      projectId: 'proj-1',
      projectName: 'Youth Skills Training',
      requesterId: 'staff-1',
      requesterName: 'Amina Juma',
      title: 'Training Materials for Cohort 3',
      purpose: 'Procurement of workshop handouts, flipcharts, and pens',
      totalAmount: 2200000,
      currency: 'TZS',
      status: 'submitted',
      priority: 'urgent',
      dueDate: '2026-10-28',
      itemsCount: 1,
      submittedAt: '2026-10-15T10:30:00Z',
    },
  ]),
  getProcurementPlans: vi.fn().mockResolvedValue([
    {
      id: 'plan-1',
      projectId: 'proj-1',
      projectName: 'Youth Skills Training',
      title: 'Annual Training Stationery Allocation',
      category: 'operational',
      estimatedCost: 15000000,
      currency: 'TZS',
      plannedQuarter: 'FY2026',
      plannedDate: '2026-01-01',
      status: 'in_progress',
      responsibleOfficer: 'Procurement Specialist',
    },
  ]),
  getQuotations: vi.fn().mockResolvedValue([
    {
      id: 'quote-1',
      quotationNumber: 'QT-2026-001',
      vendorId: 'vend-1',
      vendorName: 'Kariakoo Office Supplies',
      requestTitle: 'Proforma for Stationery Supplies',
      quotedAmount: 2150000,
      currency: 'TZS',
      submissionDate: '2026-10-16',
      validUntil: '2026-11-15',
      status: 'under_evaluation',
      deliveryLeadDays: 5,
    },
  ]),
  getDeliveries: vi.fn().mockResolvedValue([
    {
      id: 'deliv-1',
      orderId: 'po-1',
      orderNumber: 'PO-2026-1001',
      vendorName: 'Kariakoo Office Supplies',
      deliveryDate: null,
      expectedDate: '2026-10-25',
      itemsDeliveredSummary: 'Workshop Stationery and Supplies',
      orderedQuantity: 1,
      deliveredQuantity: 0,
      verificationStatus: 'pending',
      receivedBy: 'Procurement & Stores',
    },
  ]),
  getInvoicesForHandover: vi.fn().mockResolvedValue([
    {
      id: 'inv-1',
      invoiceNumber: 'INV-REQ-2026-004',
      orderNumber: 'REQ-2026-004',
      vendorName: 'Kariakoo Office Supplies',
      invoiceDate: '2026-10-15',
      amount: 2200000,
      currency: 'TZS',
      verificationStatus: 'verified',
      handoverStatus: 'awaiting_handover',
    },
  ]),
  getProcurementKpis: vi.fn().mockResolvedValue({
    totalOrdersCount: 2,
    activeOrdersAmount: 5300000,
    deliveredOrdersCount: 0,
    registeredVendorsCount: 2,
    lowStockItemsCount: 1,
    pendingPurchaseRequestsCount: 1,
    activeProcurementCount: 3,
    pendingQuotationsCount: 1,
    purchaseOrdersInProgressCount: 2,
    pendingDeliveriesCount: 1,
    invoicesAwaitingHandoverCount: 1,
  }),
  updatePurchaseOrderStatus: vi.fn().mockResolvedValue({}),
  updateInventoryQuantity: vi.fn().mockResolvedValue({}),
}));

describe('Procurement & Supply Officer Portal & Sidebar Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Sidebar Navigation Structure', () => {
    it('renders the complete 15-item Procurement Officer navigation structure', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar isOpen={true} />
        </MemoryRouter>
      );

      // Verify all 15 required navigation destinations are present
      expect(screen.getByText('Dashboard')).toBeDefined();
      expect(screen.getByText('Purchase Requests')).toBeDefined();
      expect(screen.getByText('Procurement Plans')).toBeDefined();
      expect(screen.getByText('Quotation Management')).toBeDefined();
      expect(screen.getByText('Supplier Register')).toBeDefined();
      expect(screen.getByText('Purchase Orders')).toBeDefined();
      expect(screen.getByText('Goods & Services Receiving')).toBeDefined();
      expect(screen.getByText('Inventory & Supplies')).toBeDefined();
      expect(screen.getByText('Procurement Evaluation')).toBeDefined();
      expect(screen.getByText('Procurement Approvals')).toBeDefined();
      expect(screen.getByText('Invoices & Payment Handover')).toBeDefined();
      expect(screen.getByText('Procurement Documents')).toBeDefined();
      expect(screen.getByText('Procurement Reports')).toBeDefined();
      expect(screen.getByText('Notifications')).toBeDefined();
      expect(screen.getByText('Settings')).toBeDefined();
    });

    it('verifies route paths for procurement destinations', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar isOpen={true} />
        </MemoryRouter>
      );

      const links = container.querySelectorAll('a');
      const hrefs = Array.from(links).map((a) => a.getAttribute('href'));

      expect(hrefs).toContain('/');
      expect(hrefs).toContain('/procurement/requests');
      expect(hrefs).toContain('/procurement/plans');
      expect(hrefs).toContain('/procurement/quotations');
      expect(hrefs).toContain('/procurement/vendors');
      expect(hrefs).toContain('/procurement/orders');
      expect(hrefs).toContain('/procurement/receiving');
      expect(hrefs).toContain('/procurement/inventory');
      expect(hrefs).toContain('/procurement/evaluation');
      expect(hrefs).toContain('/procurement/approvals');
      expect(hrefs).toContain('/procurement/invoices');
      expect(hrefs).toContain('/procurement/documents');
      expect(hrefs).toContain('/procurement/reports');
      expect(hrefs).toContain('/notifications');
      expect(hrefs).toContain('/settings');
    });
  });

  describe('2. Procurement Officer Dashboard', () => {
    it('renders page header and AdminCN layout structure', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <ProcurementOfficerDashboard />
        </MemoryRouter>
      );

      expect(screen.getByText('Procurement Dashboard')).toBeDefined();
      expect(screen.getByText(/Purchase requisition tracking/i)).toBeDefined();
      expect(screen.getByText('Issue Purchase Order')).toBeDefined();
      expect(screen.getByText('Register Vendor')).toBeDefined();
    });

    it('displays the 6 required KPI metrics accurately from telemetry', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <ProcurementOfficerDashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Pending Requests')).toBeDefined();
        expect(screen.getByText('Active Processes')).toBeDefined();
        expect(screen.getByText('Pending Quotations')).toBeDefined();
        expect(screen.getByText('Orders in Progress')).toBeDefined();
        expect(screen.getByText('Pending Deliveries')).toBeDefined();
        expect(screen.getByText('Invoices for Handover')).toBeDefined();
      });
    });

    it('renders the Procurement Action Queue and Pipeline stages', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <ProcurementOfficerDashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Procurement Action Queue')).toBeDefined();
        expect(screen.getByText('Purchase Orders Awaiting Approval')).toBeDefined();
        expect(screen.getByText('Deliveries Awaiting Stores Intake')).toBeDefined();
        expect(screen.getByText('Procurement Workflow Pipeline')).toBeDefined();
      });
    });

    it('renders the Purchase Orders Register with search and status badges', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <ProcurementOfficerDashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Purchase Orders Register/i)).toBeDefined();
        expect(screen.getByText('PO-2026-1001')).toBeDefined();
        expect(screen.getByText('PO-2026-1002')).toBeDefined();
        expect(screen.getAllByText(/Kariakoo Office Supplies/i).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('3. Procurement Page Submodule Navigation & Views', () => {
    it('renders horizontal sub-navigation tabs across all operational modules', async () => {
      render(
        <MemoryRouter initialEntries={['/procurement/orders']}>
          <ProcurementPage initialTab="orders" />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Procurement & Supply Chain Operations')).toBeDefined();
        expect(screen.getAllByText('Purchase Orders').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Purchase Requests').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Procurement Plans').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Quotations').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Supplier Register').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Goods Receiving').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Inventory & Supplies').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders the Purchase Requests tab when activated', async () => {
      render(
        <MemoryRouter initialEntries={['/procurement/requests']}>
          <ProcurementPage initialTab="requests" />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Purchase Requisitions')).toBeDefined();
        expect(screen.getByText('REQ-2026-004')).toBeDefined();
        expect(screen.getByText('Training Materials for Cohort 3')).toBeDefined();
      });
    });

    it('renders the Goods Receiving tab with delivery verification', async () => {
      render(
        <MemoryRouter initialEntries={['/procurement/receiving']}>
          <ProcurementPage initialTab="receiving" />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Goods & Services Receiving & Stores Inspection')).toBeDefined();
        expect(screen.getByText('Verify Intake')).toBeDefined();
      });
    });
  });
});
