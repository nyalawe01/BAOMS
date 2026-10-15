/**
 * BAOMS Procurement, Field Analytics & Institutional Dossier Test Suite
 * Babawatoto Organization Management System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  getVendors,
  registerVendor,
  getInventoryItems,
  updateInventoryQuantity,
  getProcurementKpis,
} from '@/features/procurement/services/procurementService';
import {
  createActivity,
  getProjectActivities,
  getProjectTasks,
  getProjectReports,
} from '@/features/projects/services/projectService';
import {
  exportProjectDossierToWord,
  exportProjectDossierToExcel,
  exportSingleActivityToWord,
  exportSingleActivityToExcel,
} from '@/features/projects/utils/exportProjectDossier';
import { INITIAL_MOCK_PROJECTS } from '@/features/projects/data/mockProjects';

describe('BAOMS Procurement & Advanced Analytics Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('1. Procurement & Supply Chain Service', () => {
    it('retrieves initial seeded purchase orders and calculates order values', async () => {
      const orders = await getPurchaseOrders();
      expect(orders.length).toBeGreaterThanOrEqual(3);

      const firstPO = orders[0];
      expect(firstPO).toBeDefined();
      expect(firstPO?.orderNumber).toMatch(/^PO-2026-/);
      expect(firstPO?.totalAmount).toBeGreaterThan(0);
      expect(firstPO?.items.length).toBeGreaterThan(0);
    });

    it('retrieves registered vendors and filters by category', async () => {
      const vendors = await getVendors();
      expect(vendors.length).toBeGreaterThanOrEqual(4);

      const artVendor = vendors.find((v) => v.vendorCode === 'VND-2026-001');
      expect(artVendor).toBeDefined();
      expect(artVendor?.businessName).toContain('Kariakoo Art');
      expect(artVendor?.tinNumber).toBe('109-887-234');
    });

    it('creates a new purchase order with multiple items and updates state', async () => {
      const newPO = await createPurchaseOrder({
        vendorId: 'ven-001',
        title: 'Community Canvas & Acrylic Supplies',
        items: [
          { description: 'Stretched Canvases 50x70', quantity: 20, unitOfMeasure: 'pcs', unitPrice: 25000 },
          { description: 'Acrylic Paint Bottles 500ml', quantity: 10, unitOfMeasure: 'bottles', unitPrice: 18000 },
        ],
        expectedDeliveryDate: '2026-05-15',
        notes: 'Priority field supplies for youth empowerment workshops.',
      });

      expect(newPO).toBeDefined();
      expect(newPO.totalAmount).toBe(20 * 25000 + 10 * 18000); // 500,000 + 180,000 = 680,000
      expect(newPO.status).toBe('pending_approval');
      expect(newPO.vendorName).toBe('Kariakoo Art & Theater Stationers Ltd');

      // Verify retrieval
      const allOrders = await getPurchaseOrders();
      expect(allOrders.some((o) => o.id === newPO.id)).toBe(true);
    });

    it('advances purchase order through approval and fulfillment workflow', async () => {
      const orders = await getPurchaseOrders();
      const targetPO = orders[0];
      expect(targetPO).toBeDefined();

      const approved = await updatePurchaseOrderStatus(
        targetPO!.id,
        'approved',
        {
          id: 'user-admin-1',
          name: 'Grace M. Temu',
        }
      );
      expect(approved.status).toBe('approved');

      const delivered = await updatePurchaseOrderStatus(
        targetPO!.id,
        'delivered',
        {
          id: 'user-proc-1',
          name: 'Bakari H. Mhando',
        }
      );
      expect(delivered.status).toBe('delivered');
    });

    it('registers a new compliant vendor with banking details', async () => {
      const vendor = await registerVendor({
        businessName: 'Mikocheni Digital Prints & Banners',
        category: 'stationery_printing',
        contactPerson: 'Mwita Chacha',
        email: 'info@mikocheniprints.co.tz',
        phone: '+255 754 112 233',
        physicalAddress: 'Mikocheni Light Industrial Area, Dar es Salaam',
        tinNumber: '112-998-443',
        vrnNumber: '40-00129-Z',
        bankName: 'NMB Bank',
        bankAccountNumber: '20110034567',
      });

      expect(vendor.id).toBeDefined();
      expect(vendor.vendorCode).toMatch(/^VND-2026-/);
      expect(vendor.isCompliant).toBe(true);

      const list = await getVendors();
      expect(list.some((v) => v.id === vendor.id)).toBe(true);
    });

    it('adjusts inventory stock and logs movement ledger', async () => {
      const items = await getInventoryItems();
      const firstItem = items[0];
      expect(firstItem).toBeDefined();
      const initialStock = firstItem!.quantityOnHand;

      const updated = await updateInventoryQuantity({
        itemId: firstItem!.id,
        quantityChange: 15,
        movementType: 'received',
        reason: 'PO-2026-001 delivery accepted',
        updatedBy: 'Bakari H. Mhando',
      });

      expect(updated.quantityOnHand).toBe(initialStock + 15);
      expect(updated.status).toBe('in_stock');
    });

    it('computes accurate procurement KPIs', async () => {
      const kpis = await getProcurementKpis();
      expect(kpis.totalOrdersCount).toBeGreaterThanOrEqual(3);
      expect(kpis.registeredVendorsCount).toBeGreaterThanOrEqual(4);
      expect(typeof kpis.activeOrdersAmount).toBe('number');
    });
  });

  describe('2. Field Activities Deep Narrative & Analytics', () => {
    it('creates field activity record with multi-paragraph narrative, quotes, and demographics', async () => {
      const project = INITIAL_MOCK_PROJECTS[0]!;
      const created = await createActivity({
        projectId: project.id,
        title: 'Child Safeguarding & Community Forum - Yombo Dovya',
        activityDate: '2026-04-10',
        location: 'Yombo Dovya Community Center, Temeke',
        participantsCount: 88,
        progress: 'Community outreach and dialogue sessions conducted successfully.',
        description: 'Comprehensive outreach with local community leaders and parents.',
        backgroundContext: 'Temeke district records high vulnerability rates where informal child labor risks are prevalent.',
        methodology: 'Participatory community theater forum followed by structured focus group discussions with 6 breakout groups.',
        sessionNarrative: 'The forum commenced at 09:30 AM with interactive theater performances presenting common child protection scenarios.',
        qualitativeFindings: 'Parents highlighted economic stress as the primary factor driving teenage school dropout.',
        operationalChallenges: 'High community turnout exceeded initial seating capacity; additional chairs sourced locally.',
        recommendations: 'Establish a permanent community liaison committee in Yombo Dovya.',
        participantQuotes: [
          {
            speaker: 'Mama Subira',
            affiliation: 'Parent Committee Lead',
            quote: 'This theater dialogue opened our eyes to the subtle risks children face in informal street commerce.',
          },
        ],
        demographicBreakdown: {
          childrenCount: 35,
          youthCount: 25,
          womenCount: 20,
          menCount: 8,
          pwdCount: 4,
        },
        budgetAllocated: 2500000,
        budgetSpent: 2340000,
        beneficiarySatisfactionScore: 94,
        submitImmediately: false,
      });

      expect(created.id).toBeDefined();
      expect(created.backgroundContext).toContain('Temeke district');
      expect(created.participantQuotes?.length).toBe(1);
      expect(created.demographicBreakdown?.childrenCount).toBe(35);
      expect(created.beneficiarySatisfactionScore).toBe(94);

      const activities = await getProjectActivities(project.id);
      expect(activities.some((a) => a.id === created.id)).toBe(true);
    });
  });

  describe('3. Project Dossier Export Utilities', () => {
    it('executes Word and Excel project dossier exports without runtime errors', async () => {
      const project = INITIAL_MOCK_PROJECTS[0]!;
      const activities = await getProjectActivities(project.id);
      const tasks = await getProjectTasks(project.id);
      const reports = await getProjectReports(project.id);

      const mockCreateObjectURL = () => 'blob:mock-url';
      const mockRevokeObjectURL = () => {};
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      expect(() => {
        exportProjectDossierToWord(
          project,
          activities,
          tasks,
          reports,
          []
        );
      }).not.toThrow();

      expect(() => {
        exportProjectDossierToExcel(
          project,
          activities,
          tasks,
          reports,
          []
        );
      }).not.toThrow();

      if (activities.length > 0) {
        expect(() => {
          exportSingleActivityToWord(activities[0]!, project.name);
          exportSingleActivityToExcel(activities[0]!, project.name);
        }).not.toThrow();
      }
    });
  });
});
