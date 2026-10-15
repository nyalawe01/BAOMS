/**
 * BAOMS Phase 9: Human Resources Automated Test Suite
 * Babawatoto Organization Management System
 * 
 * Verifies staff roster administration, non-login personnel handling,
 * leave balances and quota validation, strict self-approval prevention,
 * supervisor decision workflows, contract expiry reminders,
 * onboarding checklists, and bilingual UI navigation.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '@/App';
import i18n from '@/locales/i18n';
import {
  getStaffProfiles,
  getStaffProfileById,
  createStaffProfile,
  updateStaffProfile,
  getContractExpiryReminders,
  getLeaveTypes,
  getLeaveBalances,
  getLeaveRequests,
  createLeaveRequest,
  submitDraftLeaveRequest,
  reviewLeaveRequest,
  getStaffChecklist,
  toggleChecklistItem,
  setMockHrDataForTesting,
} from '@/features/hr/services/hrService';
import {
  TEST_STAFF_FIXTURES,
  TEST_LEAVE_BALANCES_FIXTURES,
  TEST_LEAVE_REQUESTS_FIXTURES,
  TEST_CHECKLISTS_FIXTURES,
} from './fixtures/hrFixtures';

describe('BAOMS Phase 9: Human Resources Module', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    setMockHrDataForTesting(
      TEST_STAFF_FIXTURES,
      TEST_LEAVE_BALANCES_FIXTURES,
      TEST_LEAVE_REQUESTS_FIXTURES,
      TEST_CHECKLISTS_FIXTURES
    );
    await i18n.changeLanguage('en');
    window.history.pushState({}, 'Test', '/login');
  });

  describe('1. Staff Roster & Non-Login Personnel Administration', () => {
    it('fetches initial seeded staff records including leadership and field staff', async () => {
      const staffList = await getStaffProfiles();
      expect(staffList.length).toBeGreaterThanOrEqual(9);

      const ed = staffList.find((s) => s.staffNumber === 'STF-2024-001');
      expect(ed).toBeDefined();
      expect(ed?.fullName).toBe('Elisha N. Mwakipesile');
      expect(ed?.contractType).toBe('permanent');
      expect(ed?.daysToContractExpiry).toBeNull();
    });

    it('verifies that staff members do not necessarily require a system login account', async () => {
      const staffList = await getStaffProfiles();

      // Non-login field staff seeded: Rehema, Daudi, Joyce
      const fieldStaff = staffList.filter((s) => s.userId === null);
      expect(fieldStaff.length).toBeGreaterThanOrEqual(3);

      const rehema = fieldStaff.find((s) => s.staffNumber === 'STF-2025-007');
      expect(rehema).toBeDefined();
      expect(rehema?.fullName).toBe('Rehema S. Msuya');
      expect(rehema?.userId).toBeNull();
      expect(rehema?.jobTitle).toBe('Community Outreach Facilitator');
    });

    it('creates a new staff member, auto-generates staff number, and initializes leave balances & onboarding checklist', async () => {
      const newStaff = await createStaffProfile({
        fullName: 'Khadija Said Mwinyi',
        jobTitle: 'Assistant Health Facilitator',
        departmentId: 'dept-prj',
        employmentStatus: 'probation',
        contractType: 'fixed_term',
        startDate: '2026-10-01',
        endDate: '2027-03-31',
        phoneNumber: '+255 754 000 777',
        email: 'khadija.mwinyi@babawatoto.org',
        emergencyContactName: 'Said Mwinyi',
        emergencyContactPhone: '+255 754 000 888',
      });

      expect(newStaff.id).toBeDefined();
      expect(newStaff.staffNumber).toMatch(/^STF-\d{4}-\d{3}$/);
      expect(newStaff.fullName).toBe('Khadija Said Mwinyi');
      expect(newStaff.employmentStatus).toBe('probation');

      // Check initialized leave balances for 2026
      const balances = await getLeaveBalances(newStaff.id, new Date().getFullYear());
      expect(balances.length).toBe(3); // Annual, Sick, Compassionate
      const annualBal = balances.find((b) => b.leaveTypeCode === 'ANNUAL');
      expect(annualBal?.allocatedDays).toBe(28);
      expect(annualBal?.remainingDays).toBe(28);

      // Check initialized onboarding checklist
      const checklist = await getStaffChecklist(newStaff.id, 'onboarding');
      expect(checklist.length).toBeGreaterThanOrEqual(5);
      expect(checklist.some((c) => c.itemKey === 'child_protection_policy')).toBe(true);
    });

    it('updates staff record details', async () => {
      const updated = await updateStaffProfile('20000000-0000-0000-0000-000000000005', {
        jobTitle: 'Lead Project Coordinator & Training Director',
      });

      expect(updated.jobTitle).toBe('Lead Project Coordinator & Training Director');
      const retrieved = await getStaffProfileById('20000000-0000-0000-0000-000000000005');
      expect(retrieved?.jobTitle).toBe('Lead Project Coordinator & Training Director');
    });
  });

  describe('2. Leave Balances, Types & Application Submissions', () => {
    it('retrieves statutory leave categories', async () => {
      const types = await getLeaveTypes();
      expect(types.length).toBeGreaterThanOrEqual(6);
      expect(types.some((t) => t.code === 'ANNUAL')).toBe(true);
      expect(types.some((t) => t.code === 'MATERNITY')).toBe(true);
      expect(types.some((t) => t.code === 'SICK')).toBe(true);
    });

    it('creates a valid leave application within balance and places days into pending', async () => {
      // Rehema Msuya has 28 days Annual
      const req = await createLeaveRequest({
        staffId: '20000000-0000-0000-0000-000000000007',
        leaveTypeId: '10000000-0000-0000-0000-000000000001', // Annual
        startDate: '2026-10-20',
        endDate: '2026-10-23', // 4 days
        reason: 'Rest and personal development.',
        handoverStaffId: '20000000-0000-0000-0000-000000000005', // Juma Temu
      });

      expect(req.id).toBeDefined();
      expect(req.daysRequested).toBe(4);
      expect(req.status).toBe('pending');
      expect(req.requestNumber).toMatch(/^LV-2026-\d{3}$/);

      // Verify pendingDays in balance
      const balances = await getLeaveBalances('20000000-0000-0000-0000-000000000007', 2026);
      const annual = balances.find((b) => b.leaveTypeCode === 'ANNUAL');
      expect(annual?.pendingDays).toBe(4);
    });

    it('rejects leave application exceeding available remaining quota', async () => {
      // Rehema Msuya has only 2 days compassionate leave remaining in seed data
      await expect(
        createLeaveRequest({
          staffId: '20000000-0000-0000-0000-000000000007',
          leaveTypeId: '10000000-0000-0000-0000-000000000005', // Compassionate
          startDate: '2026-11-01',
          endDate: '2026-11-05', // 5 days requested, only 2 remain!
          reason: 'Extended bereavement.',
        })
      ).rejects.toThrow(/Insufficient leave balance/);
    });
  });

  describe('3. Separation of Duties: Self-Approval Prevention & Supervisor Decisions', () => {
    it('strictly forbids a staff member or manager from approving their own leave request', async () => {
      // Create a pending leave request for Mariam M. Juma (Project Manager)
      const req = await createLeaveRequest({
        staffId: '20000000-0000-0000-0000-000000000004', // Mariam Juma
        leaveTypeId: '10000000-0000-0000-0000-000000000001',
        startDate: '2026-12-01',
        endDate: '2026-12-05',
        reason: 'Year end leave.',
      });

      // Attempt self-approval by Mariam Juma herself (userId: 00000000-0000-0000-0000-000000000004)
      await expect(
        reviewLeaveRequest(
          {
            requestId: req.id,
            decision: 'approved',
          },
          {
            id: '00000000-0000-0000-0000-000000000004', // Mariam Juma
            displayName: 'Mariam M. Juma',
            roles: ['project_manager'],
          }
        )
      ).rejects.toThrow(/Staff members are strictly prohibited from approving their own leave requests/);
    });

    it('allows an authorized independent supervisor or HR administrator to approve the leave request', async () => {
      // Create leave request for Juma Temu
      const req = await createLeaveRequest({
        staffId: '20000000-0000-0000-0000-000000000005',
        leaveTypeId: '10000000-0000-0000-0000-000000000001',
        startDate: '2026-12-10',
        endDate: '2026-12-12', // 3 days
        reason: 'Rest after field delivery.',
      });

      // Review by supervisor Mariam Juma (userId: 00000000-0000-0000-0000-000000000004)
      const approved = await reviewLeaveRequest(
        {
          requestId: req.id,
          decision: 'approved',
          decisionNotes: 'Handover plans verified. Approved.',
        },
        {
          id: '00000000-0000-0000-0000-000000000004', // Mariam Juma
          displayName: 'Mariam M. Juma',
          roles: ['project_manager'],
        }
      );

      expect(approved.status).toBe('approved');
      expect(approved.decisionByName).toBe('Mariam M. Juma');

      // Check balance update: usedDays incremented, remaining decremented
      const balances = await getLeaveBalances('20000000-0000-0000-0000-000000000005', 2026);
      const annual = balances.find((b) => b.leaveTypeCode === 'ANNUAL');
      expect(annual?.usedDays).toBe(8); // 5 initial + 3 new
      expect(annual?.remainingDays).toBe(20);
    });

    it('requires a mandatory explanation note when rejecting a leave request', async () => {
      const req = await createLeaveRequest({
        staffId: '20000000-0000-0000-0000-000000000005',
        leaveTypeId: '10000000-0000-0000-0000-000000000001',
        startDate: '2026-12-20',
        endDate: '2026-12-22',
        reason: 'Holiday leave.',
      });

      // Rejection without decisionNotes should fail
      await expect(
        reviewLeaveRequest(
          {
            requestId: req.id,
            decision: 'rejected',
            decisionNotes: '   ',
          },
          {
            id: '00000000-0000-0000-0000-000000000006', // Amina Kimaro (HR)
            displayName: 'Amina L. Kimaro',
            roles: ['hr_administrator'],
          }
        )
      ).rejects.toThrow(/decision explanation is mandatory when rejecting/);

      // Rejection with valid note succeeds
      const rejected = await reviewLeaveRequest(
        {
          requestId: req.id,
          decision: 'rejected',
          decisionNotes: 'Critical donor mission during these dates; please reschedule.',
        },
        {
          id: '00000000-0000-0000-0000-000000000006',
          displayName: 'Amina L. Kimaro',
          roles: ['hr_administrator'],
        }
      );
      expect(rejected.status).toBe('rejected');
    });

    it('supports saving leave requests as draft and submitting them subsequently', async () => {
      const draft = await createLeaveRequest({
        staffId: '20000000-0000-0000-0000-000000000001',
        leaveTypeId: '10000000-0000-0000-0000-000000000001',
        startDate: '2026-11-01',
        endDate: '2026-11-05',
        reason: 'Personal retreat draft.',
        status: 'draft',
      });

      expect(draft.status).toBe('draft');

      // Draft should not lock pending days
      const balancesBefore = await getLeaveBalances('20000000-0000-0000-0000-000000000001', 2026);
      const annualBefore = balancesBefore.find((b) => b.leaveTypeCode === 'ANNUAL');
      const pendingBefore = annualBefore?.pendingDays ?? 0;

      // Submit draft
      const submitted = await submitDraftLeaveRequest(draft.id);
      expect(submitted.status).toBe('pending');

      // Balance pending days should now increment
      const balancesAfter = await getLeaveBalances('20000000-0000-0000-0000-000000000001', 2026);
      const annualAfter = balancesAfter.find((b) => b.leaveTypeCode === 'ANNUAL');
      expect(annualAfter?.pendingDays).toBe(pendingBefore + 5);
    });

    it('strictly prevents overlapping active or pending leave requests for the same employee', async () => {
      // Create first active request
      await createLeaveRequest({
        staffId: '20000000-0000-0000-0000-000000000002',
        leaveTypeId: '10000000-0000-0000-0000-000000000001',
        startDate: '2026-09-10',
        endDate: '2026-09-15',
        reason: 'First session.',
      });

      // Attempt to create second request overlapping with 2026-09-10 -> 2026-09-15
      await expect(
        createLeaveRequest({
          staffId: '20000000-0000-0000-0000-000000000002',
          leaveTypeId: '10000000-0000-0000-0000-000000000001',
          startDate: '2026-09-12',
          endDate: '2026-09-18',
          reason: 'Overlapping session.',
        })
      ).rejects.toThrow(/already overlaps with the selected date range/);
    });
  });

  describe('4. Contract Expiry Reminders & Checklists', () => {
    it('detects contracts expiring within 60 days and sorts by urgency', async () => {
      const expiring = await getContractExpiryReminders(60);
      expect(expiring.length).toBeGreaterThanOrEqual(2);

      // Rehema Msuya expires in 22 days -> should be first or among earliest
      const urgent = expiring.find((s) => s.staffNumber === 'STF-2025-007');
      expect(urgent).toBeDefined();
      expect(urgent?.daysToContractExpiry).toBeLessThanOrEqual(30);

      // Mariam Juma expires in 45 days -> should be present
      const warning = expiring.find((s) => s.staffNumber === 'STF-2024-004');
      expect(warning).toBeDefined();
      expect(warning?.daysToContractExpiry).toBeLessThanOrEqual(60);
    });

    it('toggles onboarding checklist items for newly hired personnel', async () => {
      const items = await getStaffChecklist('20000000-0000-0000-0000-000000000009', 'onboarding');
      const equipmentItem = items.find((i) => i.itemKey === 'equipment_assignment');
      expect(equipmentItem).toBeDefined();
      expect(equipmentItem?.isCompleted).toBe(false);

      const updated = await toggleChecklistItem(
        equipmentItem!.id,
        true,
        { id: '00000000-0000-0000-0000-000000000006', displayName: 'Amina L. Kimaro' },
        'Laptop and field ID badge handed over.'
      );

      expect(updated.isCompleted).toBe(true);
      expect(updated.completedByName).toBe('Amina L. Kimaro');
    });
  });

  describe('5. Role-Based Scoped Visibility', () => {
    it('allows HR Administrator to see all personnel and leave requests', async () => {
      const hrUser = { id: '00000000-0000-0000-0000-000000000006', roles: ['hr_administrator'] };
      const staffList = await getStaffProfiles(undefined, hrUser);
      expect(staffList.length).toBeGreaterThanOrEqual(9);

      const requests = await getLeaveRequests(undefined, hrUser);
      expect(requests.length).toBeGreaterThanOrEqual(3);
    });

    it('scopes Manager visibility to themselves and their supervisees', async () => {
      // Mariam Juma supervises Juma Temu and Daudi Matiko
      const managerUser = { id: '00000000-0000-0000-0000-000000000004', roles: ['project_manager'] };
      const staffList = await getStaffProfiles(undefined, managerUser);

      // Must include Mariam Juma and her supervisees (Juma Temu, Daudi Matiko)
      expect(staffList.some((s) => s.fullName === 'Mariam M. Juma')).toBe(true);
      expect(staffList.some((s) => s.fullName === 'Juma K. Temu')).toBe(true);
    });

    it('scopes regular staff visibility to strictly their own record', async () => {
      // Juma Temu (Project Coordinator)
      const coordUser = { id: '00000000-0000-0000-0000-000000000005', roles: ['project_coordinator'] };
      const staffList = await getStaffProfiles(undefined, coordUser);

      // Juma supervises Rehema Msuya
      expect(staffList.some((s) => s.fullName === 'Juma K. Temu')).toBe(true);
      // But does NOT see Executive Director Elisha Mwakipesile
      expect(staffList.some((s) => s.fullName === 'Elisha N. Mwakipesile')).toBe(false);
    });
  });

  describe('6. UI Integration & Bilingual Navigation', () => {
    it('redirects unauthenticated requests to /hr back to /login', async () => {
      window.history.pushState({}, 'HR', '/hr');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /sign in|ingia/i })).toBeDefined();
        },
        { timeout: 8000 }
      );
    });

    it(
      'permits authorized staff to access /hr and renders roster cards and KPI metrics',
      async () => {
        // Sign in as HR Administrator (Amina Kimaro)
        localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000006');

        window.history.pushState({}, 'HR Roster', '/hr');
        render(<App />);

        await waitFor(
          () => {
            expect(
              screen.getAllByText(/Human Resources & Personnel|Rasilimali Watu na Watumishi/i).length
            ).toBeGreaterThan(0);
            expect(
              screen.getAllByText(/Total Personnel|Jumla ya Watumishi/i).length
            ).toBeGreaterThan(0);
            expect(
              screen.getAllByText(/Active Contracts|Mikataba Inayofanya Kazi/i).length
            ).toBeGreaterThan(0);
            expect(screen.getAllByText(/Elisha N. Mwakipesile/).length).toBeGreaterThan(0);
          },
          { timeout: 8000 }
        );
      },
      15000
    );

    it(
      'switches application language to Kiswahili and reflects localized HR terminology',
      async () => {
        localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000006');

        await i18n.changeLanguage('sw');
        window.history.pushState({}, 'HR SW', '/hr');
        render(<App />);

        await waitFor(
          () => {
            expect(
              screen.getAllByText(/Rasilimali Watu na Watumishi/i).length
            ).toBeGreaterThan(0);
            expect(
              screen.getAllByText(/Jumla ya Watumishi/i).length
            ).toBeGreaterThan(0);
            expect(
              screen.getAllByText(/Mikataba Inayofanya Kazi/i).length
            ).toBeGreaterThan(0);
          },
          { timeout: 8000 }
        );

        // Reset back to English
        await i18n.changeLanguage('en');
      },
      15000
    );
  });
});
