/**
 * BAOMS Phase 8: Finance & Approval Workflows Automated Test Suite
 * Babawatoto Organization Management System
 * 
 * Verifies financial requisitions, multi-tier approval state machine,
 * segregation of duties (requester cannot self-approve), payment disbursements,
 * overpayment safeguards, duplicate reference prevention, budget reconciliation,
 * and bilingual UI controls.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '@/App';
import '@/locales/i18n';
import i18n from '@/locales/i18n';
import {
  getBudgets,
  getBudgetById,
  createFinancialRequest,
  reviewFinancialRequest,
  recordPayment,
  getFinanceKpis,
  resetMockFinanceState,
} from '@/features/finance/services/financeService';

describe('BAOMS Phase 8: Finance & Approval Workflows Module', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    resetMockFinanceState();
    await i18n.changeLanguage('en');
    window.history.pushState({}, 'Test', '/login');
  });

  describe('1. Budget Tracking & Utilization Reconciliation', () => {
    it('fetches seeded organizational and project budgets with computed utilization metrics', async () => {
      const budgets = await getBudgets();
      expect(budgets.length).toBeGreaterThanOrEqual(4);

      const byaBudget = budgets.find((b) => b.code === 'BUD-BYA-ACT');
      expect(byaBudget).toBeDefined();
      expect(byaBudget?.allocatedAmount).toBe(35000000);
      expect(byaBudget?.totalSpent).toBe(2000000); // Initial seeded payment for REQ-2026-001
      expect(byaBudget?.totalCommitted).toBe(1200000); // 3,200,000 approved - 2,000,000 paid
      expect(byaBudget?.availableBalance).toBe(31800000);
    });

    it('accurately calculates system-wide finance KPIs', async () => {
      const kpis = await getFinanceKpis();
      expect(kpis.totalBudget).toBeGreaterThanOrEqual(120000000);
      expect(kpis.totalSpent).toBeGreaterThanOrEqual(4100000); // 2,000,000 + 2,100,000
      expect(kpis.availableBalance).toBe(
        kpis.totalBudget - (kpis.totalSpent + kpis.totalCommitted)
      );
      expect(kpis.pendingRequestsCount).toBeGreaterThanOrEqual(2); // REQ-2026-002 and REQ-2026-003
    });
  });

  describe('2. Financial Requisition Creation', () => {
    it('creates a new financial requisition with itemized lines and initializes audit trail', async () => {
      const newReq = await createFinancialRequest(
        {
          requestType: 'activity_expense',
          budgetId: 'c0000000-0000-0000-0000-000000000002',
          title: 'Youth Community Drama Outing Transportation',
          purpose: 'Hiring mini-buses for 35 drama students visiting Bagamoyo cultural center.',
          priority: 'normal',
          lines: [
            {
              description: 'Bus Hire (2 Coaster buses)',
              quantity: 2,
              unitCost: 350000,
              budgetCategory: 'Transport',
            },
            {
              description: 'Snacks & Bottled Water for 35 students',
              quantity: 35,
              unitCost: 6000,
              budgetCategory: 'Meals',
            },
          ],
        },
        {
          id: '00000000-0000-0000-0000-000000000005',
          name: 'Juma K. Temu',
          role: 'project_coordinator',
        }
      );

      expect(newReq.id).toBeDefined();
      expect(newReq.requestNumber).toMatch(/^REQ-2026-/);
      expect(newReq.status).toBe('submitted');
      expect(newReq.totalAmount).toBe(2 * 350000 + 35 * 6000); // 700000 + 210000 = 910000
      expect(newReq.lines.length).toBe(2);
      expect(newReq.events.length).toBe(1);
      expect(newReq.events[0]?.action).toBe('submitted');
      expect(newReq.events[0]?.actorName).toBe('Juma K. Temu');
    });

    it('rejects requisition submission when line items are missing', async () => {
      await expect(
        createFinancialRequest(
          {
            requestType: 'operational',
            title: 'Empty Requisition',
            purpose: 'No lines provided',
            lines: [],
          },
          { id: 'admin-01', name: 'Admin' }
        )
      ).rejects.toThrow('At least one itemized line is required');
    });
  });

  describe('3. Separation of Duties & Multi-Tier Approvals', () => {
    it('STRICT CONTROL: prohibits requesters from approving their own financial requests', async () => {
      // REQ-2026-002 was submitted by Juma K. Temu (00000000-0000-0000-0000-000000000005)
      await expect(
        reviewFinancialRequest(
          'd0000000-0000-0000-0000-000000000002',
          {
            action: 'approved',
            comments: 'Self approving my own fuel voucher.',
          },
          {
            id: '00000000-0000-0000-0000-000000000005', // Same ID as requester
            name: 'Juma K. Temu',
            role: 'project_coordinator',
          }
        )
      ).rejects.toThrow(/Segregation of duties violation/);
    });

    it('requires mandatory comments when returning or rejecting a requisition', async () => {
      await expect(
        reviewFinancialRequest(
          'd0000000-0000-0000-0000-000000000002',
          {
            action: 'returned',
            comments: '   ', // Blank comments
          },
          {
            id: '00000000-0000-0000-0000-000000000003',
            name: 'Baraka Said',
            role: 'finance_officer',
          }
        )
      ).rejects.toThrow(/Comments are mandatory/);
    });

    it('executes two-tier approval workflow (Finance Officer verification -> Executive Director approval)', async () => {
      // REQ-2026-002 is submitted
      // Tier 1: Finance Officer verification
      const verified = await reviewFinancialRequest(
        'd0000000-0000-0000-0000-000000000002',
        {
          action: 'reviewed',
          comments: 'Fuel rates verified against current Puma station pump prices.',
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          name: 'Baraka Said',
          role: 'finance_officer',
        }
      );
      expect(verified.status).toBe('under_review');
      expect(verified.events.length).toBe(2);

      // Tier 2: Executive Director authorization
      const approved = await reviewFinancialRequest(
        'd0000000-0000-0000-0000-000000000002',
        {
          action: 'approved',
          comments: 'Expenditure approved. Disburse fuel card vouchers.',
          approvedAmount: 850000,
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          name: 'Elisha N. Mwakipesile',
          role: 'executive_director',
        }
      );

      expect(approved.status).toBe('approved');
      expect(approved.approvedAmount).toBe(850000);
      expect(approved.approvedByName).toBe('Elisha N. Mwakipesile');
      expect(approved.events.length).toBe(3);

      // Verify budget commitment increases
      const csoBudget = await getBudgetById('c0000000-0000-0000-0000-000000000003');
      expect(csoBudget?.totalCommitted).toBe(850000);
    });
  });

  describe('4. Payment Disbursements & Safeguards', () => {
    it('disallows recording payments for unapproved or returned requests', async () => {
      // REQ-2026-005 is in 'returned' status
      await expect(
        recordPayment(
          'd0000000-0000-0000-0000-000000000005',
          {
            paymentMethod: 'bank_transfer',
            paymentReference: 'VOUCHER-TEST-99',
            amount: 500000,
            paymentDate: '2026-04-12',
            payeeName: 'Sound Vendor',
          },
          {
            id: '00000000-0000-0000-0000-000000000003',
            name: 'Baraka Said',
            role: 'finance_officer',
          }
        )
      ).rejects.toThrow(/Payments can only be recorded for approved requests/);
    });

    it('enforces overpayment safeguard: payment cannot exceed outstanding approved balance', async () => {
      // REQ-2026-001 has approved 3,200,000, paid 2,000,000. Remaining balance = 1,200,000
      await expect(
        recordPayment(
          'd0000000-0000-0000-0000-000000000001',
          {
            paymentMethod: 'bank_transfer',
            paymentReference: 'OVERPAY-TEST',
            amount: 1500000, // Exceeds 1,200,000 balance!
            paymentDate: '2026-04-12',
            payeeName: 'Bagamoyo Hall Trust',
          },
          {
            id: '00000000-0000-0000-0000-000000000003',
            name: 'Baraka Said',
            role: 'finance_officer',
          }
        )
      ).rejects.toThrow(/exceeds the outstanding approved balance/);
    });

    it('prevents duplicate payment reference numbers across transactions', async () => {
      // TXN-2026-001 already uses reference 'CRDB-FT26105001'
      await expect(
        recordPayment(
          'd0000000-0000-0000-0000-000000000001',
          {
            paymentMethod: 'bank_transfer',
            paymentReference: 'CRDB-FT26105001', // Duplicate!
            amount: 500000,
            paymentDate: '2026-04-12',
            payeeName: 'Bagamoyo Hall Trust',
          },
          {
            id: '00000000-0000-0000-0000-000000000003',
            name: 'Baraka Said',
            role: 'finance_officer',
          }
        )
      ).rejects.toThrow(/Duplicate payment reference/);
    });

    it('records final disbursement, updates status to paid in full, and reconciles budget', async () => {
      // Remaining on REQ-2026-001 is 1,200,000
      const { request: updatedReq, transaction: newTxn } = await recordPayment(
        'd0000000-0000-0000-0000-000000000001',
        {
          paymentMethod: 'mobile_money',
          paymentReference: 'MPESA-TXN-2026-888',
          amount: 1200000,
          paymentDate: '2026-04-12',
          payeeName: 'Bagamoyo Community Heritage Hall Trust',
          payeeContact: '+255 754 000 111',
          notes: 'Final settlement payment for hall hire.',
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          name: 'Baraka Said',
          role: 'finance_officer',
        }
      );

      expect(updatedReq.status).toBe('paid');
      expect(updatedReq.paidAmount).toBe(3200000);
      expect(newTxn.paymentReference).toBe('MPESA-TXN-2026-888');

      // Budget check: committed should now be 0, spent should be 3,200,000
      const byaBudget = await getBudgetById('c0000000-0000-0000-0000-000000000002');
      expect(byaBudget?.totalCommitted).toBe(0);
      expect(byaBudget?.totalSpent).toBe(3200000);
      expect(byaBudget?.availableBalance).toBe(35000000 - 3200000);
    });
  });

  describe('5. UI Integration & Bilingual Navigation', () => {
    it('renders the Finance page with KPI stat cards, requisitions table, and tabs', async () => {
      // Set logged in user as Finance Officer (Baraka Said)
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000003');

      window.history.pushState({}, 'Finance', '/finance');
      render(<App />);

      await waitFor(
        () => {
          expect(
            screen.getAllByText(/Finance & Budget Management|Usimamizi wa Fedha na Bajeti/i).length
          ).toBeGreaterThan(0);
          expect(
            screen.getAllByText(/Authorized Budget|Bajeti Iliyoidhinishwa/i).length
          ).toBeGreaterThan(0);
          expect(
            screen.getAllByText(/Actual Disbursed|Kiasi Kilicholipwa/i).length
          ).toBeGreaterThan(0);
          expect(screen.getAllByText(/REQ-2026-001/).length).toBeGreaterThan(0);
        },
        { timeout: 8000 }
      );
    });

    it('switches application language to Kiswahili and reflects localized finance terminology', async () => {
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000003');

      await i18n.changeLanguage('sw');
      window.history.pushState({}, 'Finance SW', '/finance');
      render(<App />);

      await waitFor(
        () => {
          expect(
            screen.getAllByText(/Usimamizi wa Fedha na Bajeti/i).length
          ).toBeGreaterThan(0);
          expect(
            screen.getAllByText(/Bajeti Iliyoidhinishwa/i).length
          ).toBeGreaterThan(0);
          expect(
            screen.getAllByText(/Kiasi Kilicholipwa/i).length
          ).toBeGreaterThan(0);
        },
        { timeout: 8000 }
      );

      // Switch back to English for other tests
      await i18n.changeLanguage('en');
    });
  });
});
