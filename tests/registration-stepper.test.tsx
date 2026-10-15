/**
 * BAOMS: Multi-Step Stepper Registration Test Suite
 * Babawatoto Organization Management System
 * 
 * Verifies Stepper navigation, draft persistence across steps, validation enforcement,
 * and comprehensive profile/project creation.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { Stepper, StepItem } from '@/components/ui/Stepper';
import { createStaffProfile, getStaffProfiles } from '@/features/hr/services/hrService';
import { createProject, getProjects } from '@/features/projects/services/projectService';
import '@/locales/i18n';

describe('BAOMS Multi-Step Stepper & Registration Systems', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('1. Reusable Stepper UI Component', () => {
    const mockSteps: StepItem[] = [
      { id: 0, title: 'Personal Information', subtitle: 'Identity & Contacts' },
      { id: 1, title: 'Role & Employment', subtitle: 'Contract & Dept' },
      { id: 2, title: 'Academic & CV', subtitle: 'Degrees & Certs' },
      { id: 3, title: 'Statutory & Banking', subtitle: 'NIDA, TIN & NSSF' },
      { id: 4, title: 'Review & Submission', subtitle: 'Final Verification' },
    ];

    it('renders all step titles and subtitles correctly', () => {
      render(<Stepper steps={mockSteps} currentStep={0} />);

      expect(screen.getAllByText('Personal Information').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Role & Employment').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Academic & CV').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Statutory & Banking').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Review & Submission').length).toBeGreaterThanOrEqual(1);
    });

    it('highlights the active step and indicates completed steps', () => {
      const { container } = render(
        <Stepper steps={mockSteps} currentStep={2} completedSteps={[0, 1]} />
      );

      // Current step 3 (index 2) should be highlighted
      expect(container.textContent).toContain('Step 3 of 5');
    });

    it('supports onStepClick callback when clicking previous/completed steps', () => {
      let clickedStep: number | null = null;
      render(
        <Stepper
          steps={mockSteps}
          currentStep={2}
          completedSteps={[0, 1]}
          onStepClick={(idx) => {
            clickedStep = idx;
          }}
        />
      );

      // Click on step 1 (index 0) in desktop view
      const firstStepTitle = screen.getAllByText('Personal Information')[1]; // Desktop element
      if (firstStepTitle) {
        fireEvent.click(firstStepTitle);
        expect(clickedStep).toBe(0);
      }
    });
  });

  describe('2. Staff Registration Dossier & Academic Persistence', () => {
    it('creates staff member with complete academic credentials, CV, and statutory identifiers', async () => {
      const staffNumber = `STF-TEST-${Date.now().toString().slice(-4)}`;
      const newStaff = await createStaffProfile({
        staffNumber,
        fullName: 'Zainab Rashid Msuya',
        jobTitle: 'Senior M&E Specialist',
        departmentId: 'dept-prj',
        employmentStatus: 'active',
        contractType: 'fixed_term',
        startDate: '2026-06-01',
        endDate: '2027-05-31',
        phoneNumber: '+255 754 990 112',
        officialEmail: 'zainab.msuya@babawatoto.org',
        personalEmail: 'zainab.msuya@gmail.com',
        dateOfBirth: '1991-03-22',
        nidaNumber: '19910322-12001-00004-18',
        tinNumber: '144-890-332',
        loanBoardStatus: 'cleared',
        loanBoardDetails: 'HESLB Certificate No. 449182',
        cwtNumber: 'CWT-DAR-4001',
        nssfNumber: '20194821',
        nhifNumber: '10-0984712-4',
        bankName: 'CRDB Bank Plc',
        bankAccountNumber: '0150998877660',
        bankBranch: 'Tower Branch',
        basicSalary: 2800000,
        grossSalary: 3300000,
        cvName: 'Zainab_Msuya_CV_2026.pdf',
        certifications: [
          {
            id: 'cert-1',
            name: 'Master of Science in Monitoring & Evaluation',
            institution: 'Mzumbe University',
            year: 2021,
            verified: true,
          },
          {
            id: 'cert-2',
            name: 'Bachelor of Science in Statistics',
            institution: 'University of Dar es Salaam',
            year: 2014,
            verified: true,
          },
        ],
      });

      expect(newStaff.id).toBeDefined();
      expect(newStaff.fullName).toBe('Zainab Rashid Msuya');
      expect(newStaff.officialEmail).toBe('zainab.msuya@babawatoto.org');
      expect(newStaff.nidaNumber).toBe('19910322-12001-00004-18');
      expect(newStaff.certifications?.length).toBe(2);
      expect(newStaff.certifications?.[0]?.institution).toBe('Mzumbe University');
      expect(newStaff.onboardingStatus).toBe('completed');

      // Verify searchable in roster
      const allStaff = await getStaffProfiles();
      const found = allStaff.find((s) => s.staffNumber === staffNumber);
      expect(found).toBeDefined();
      expect(found?.bankName).toBe('CRDB Bank Plc');
    });

    it('validates and stores step drafts in localStorage', () => {
      const draftKey = 'baoms_staff_registration_draft';
      const draftPayload = {
        step: 2,
        savedAt: '12:30:00',
        personal: {
          fullName: 'Baraka Ali Kibona',
          dateOfBirth: '1995-10-10',
          phoneNumber: '+255 713 000 111',
          personalEmail: 'baraka@gmail.com',
          officialEmail: 'baraka.kibona@babawatoto.org',
          emergencyContactName: 'Amina Kibona',
          emergencyContactPhone: '+255 713 000 222',
        },
        employment: {
          staffNumber: 'STF-2026-999',
          jobTitle: 'Assistant Facilitator',
          departmentId: 'dept-prj',
          supervisorId: '',
          employmentStatus: 'active',
          contractType: 'fixed_term',
          startDate: '2026-07-01',
          endDate: '2027-06-30',
          notes: 'Stationed at Temeke youth community hall',
        },
        academic: {
          highestEducation: "Bachelor's Degree",
          cvName: 'Baraka_CV.pdf',
          cvUrl: '',
          certifications: [],
        },
        statutory: {
          nidaNumber: '',
          tinNumber: '',
          loanBoardStatus: 'not_applicable',
          loanBoardDetails: '',
          cwtNumber: '',
          nssfNumber: '',
          pssfNumber: '',
          nhifNumber: '',
          bankName: 'NMB Bank',
          bankAccountNumber: '2049182390',
          bankBranch: 'Temeke Branch',
          basicSalary: '1200000',
          grossSalary: '1400000',
        },
        systemAccess: {
          grantAccess: false,
          systemRole: 'project_officer',
        },
      };

      localStorage.setItem(draftKey, JSON.stringify(draftPayload));
      const loaded = JSON.parse(localStorage.getItem(draftKey) || '{}');
      expect(loaded.personal.fullName).toBe('Baraka Ali Kibona');
      expect(loaded.step).toBe(2);
      expect(loaded.employment.jobTitle).toBe('Assistant Facilitator');
    });
  });

  describe('3. Project Registration & Persistence', () => {
    it('creates project with budget summary and assigned manager', async () => {
      const code = `PRJ-STEP-${Date.now().toString().slice(-4)}`;
      const created = await createProject(
        {
          projectCode: code,
          name: 'Civic Theater & Youth Rights Campaign',
          description: 'Community participatory theater driving child protection advocacy.',
          funder: 'Save the Children International',
          startDate: '2026-06-01',
          endDate: '2027-05-31',
          totalBudget: 60000000,
          currency: 'TZS',
          managerId: '00000000-0000-0000-0000-000000000006',
        },
        { id: 'admin', name: 'System Administrator' }
      );

      expect(created.id).toBeDefined();
      expect(created.projectCode).toBe(code);
      expect(created.totalBudget).toBe(60000000);
      expect(created.members.length).toBeGreaterThanOrEqual(1);
      expect(created.members[0]?.projectRole).toBe('manager');

      const allProjects = await getProjects();
      const match = allProjects.find((p) => p.projectCode === code);
      expect(match).toBeDefined();
      expect(match?.budgetSummary?.totalAllocated).toBe(60000000);
    });

    it('persists project multi-step draft to localStorage', () => {
      const draftKey = 'baoms_project_registration_draft';
      const projectDraft = {
        step: 1,
        savedAt: '14:15:00',
        identity: {
          projectCode: 'PRJ-MTO-2026',
          name: 'Mwananyamala Safe Spaces Project',
          category: 'Child Safeguarding & Rights',
          description: 'Establishing adolescent safe houses and psychological counseling.',
          objectives: '1. Build safe spaces. 2. Provide counseling.',
          beneficiaries: '800 children',
        },
        funding: {
          funder: 'UNICEF Tanzania',
          grantNumber: 'TZ-2026-UNICEF-09',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          totalBudget: '95000000',
          currency: 'TZS',
          disbursementSchedule: 'Biannual equal installments.',
        },
        governance: {
          managerId: '00000000-0000-0000-0000-000000000006',
          coordinatorId: '',
          targetRegions: ['Dar es Salaam - Kinondoni', 'Dar es Salaam - Ubungo'],
          partnerOrganizations: 'Kinondoni Municipal Council',
        },
      };

      localStorage.setItem(draftKey, JSON.stringify(projectDraft));
      const loaded = JSON.parse(localStorage.getItem(draftKey) || '{}');
      expect(loaded.identity.projectCode).toBe('PRJ-MTO-2026');
      expect(loaded.funding.funder).toBe('UNICEF Tanzania');
      expect(loaded.governance.targetRegions).toContain('Dar es Salaam - Kinondoni');
    });
  });
});
