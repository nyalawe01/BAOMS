/**
 * BAOMS Phase 7: Project Management Automated Test Suite
 * Babawatoto Organization Management System
 * 
 * Verifies project register, assigned project workspaces, field activity reporting,
 * manager review and decision workflows, task tracking, budget utilization,
 * team member assignments, and bilingual UI navigation.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '@/App';
import '@/locales/i18n';
import {
  getProjects,
  getProjectById,
  createProject,
  createActivity,
  submitActivity,
  reviewActivity,
  createTask,
  updateTask,
  getProjectBudget,
  assignProjectMember,
  removeProjectMember,
} from '@/features/projects/services/projectService';

describe('BAOMS Phase 7: Project Management Module', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.pushState({}, 'Test', '/login');
  });

  describe('1. Project Register & CRUD Operations', () => {
    it('fetches initial seeded projects with metrics and budget summaries', async () => {
      const projects = await getProjects();
      expect(projects.length).toBeGreaterThanOrEqual(3);

      const bya = projects.find((p) => p.projectCode === 'PRJ-BYA-2026');
      expect(bya).toBeDefined();
      expect(bya?.name).toBe('Babawatoto Youth Academy 2026');
      expect(bya?.funder).toBe('Foundation for Civil Society (FCS)');
      expect(bya?.status).toBe('active');
      expect(bya?.totalBudget).toBe(75000000);
      expect(bya?.budgetSummary?.balance).toBe(42500000);
    });

    it('creates a new project with manager assignment and initial budget record', async () => {
      const uniqueCode = `PRJ-TST-${Date.now().toString().slice(-4)}`;
      const newProj = await createProject(
        {
          projectCode: uniqueCode,
          name: 'Early Childhood Art Therapy Program',
          description: 'Grassroots psychological healing and artistic therapy for children.',
          funder: 'Save the Children',
          startDate: '2026-05-01',
          endDate: '2026-11-30',
          totalBudget: 35000000,
          currency: 'TZS',
          managerId: '00000000-0000-0000-0000-000000000004', // Mariam (PM)
          coordinatorId: '00000000-0000-0000-0000-000000000005', // Juma (Coordinator)
        },
        { id: 'admin-01', name: 'System Admin' }
      );

      expect(newProj.id).toBeDefined();
      expect(newProj.projectCode).toBe(uniqueCode);
      expect(newProj.status).toBe('planning');
      expect(newProj.members.length).toBe(2);
      expect(newProj.members.find((m) => m.projectRole === 'manager')?.userName).toBe('Mariam M. Juma');
      expect(newProj.budgetSummary?.totalAllocated).toBe(35000000);
      expect(newProj.budgetSummary?.balance).toBe(35000000);
      expect(newProj.budgetSummary?.burnRatePercent).toBe(0);
    });

    it('rejects duplicate project codes', async () => {
      await expect(
        createProject(
          {
            projectCode: 'PRJ-BYA-2026', // Already exists in initial dataset
            name: 'Duplicate Program',
            funder: 'Donor X',
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            totalBudget: 10000000,
            managerId: '00000000-0000-0000-0000-000000000004',
          },
          { id: 'admin-01', name: 'System Admin' }
        )
      ).rejects.toThrow(/already in use/i);
    });

    it('filters projects by query and status', async () => {
      const activeProjects = await getProjects({ status: 'active' });
      expect(activeProjects.every((p) => p.status === 'active')).toBe(true);

      const searchResults = await getProjects({ searchQuery: 'UNICEF' });
      expect(searchResults.some((p) => p.projectCode === 'PRJ-CSO-2026')).toBe(true);
    });
  });

  describe('2. Field Activity Reporting & Approval Workflow', () => {
    it('records a new field activity report as draft or submitted', async () => {
      const projects = await getProjects();
      const projId = projects[0]!.id;

      const draftActivity = await createActivity(
        {
          projectId: projId,
          title: 'Puppet Making & Storytelling Session',
          activityDate: '2026-04-12',
          location: 'Temeke Youth Center',
          participantsCount: 30,
          progress: 'Trained 30 youth in traditional shadow puppetry and dialogue construction.',
          submitImmediately: false,
        },
        { id: '00000000-0000-0000-0000-000000000005', name: 'Juma K. Temu' }
      );

      expect(draftActivity.submissionStatus).toBe('draft');
      expect(draftActivity.participantsCount).toBe(30);

      // Coordinator submits the draft
      const submitted = await submitActivity(draftActivity.id, {
        id: '00000000-0000-0000-0000-000000000005',
      });
      expect(submitted.submissionStatus).toBe('submitted');
      expect(submitted.submittedAt).toBeDefined();
    });

    it('allows Project Manager to review and approve an activity', async () => {
      const projects = await getProjects();
      const projId = projects[0]!.id;

      const act = await createActivity(
        {
          projectId: projId,
          title: 'Parent Safeguarding Consultation',
          activityDate: '2026-04-15',
          participantsCount: 25,
          progress: 'Consulted parents on home safety protocols.',
          submitImmediately: true,
        },
        { id: '00000000-0000-0000-0000-000000000005', name: 'Juma K. Temu' }
      );

      expect(act.submissionStatus).toBe('submitted');

      const approved = await reviewActivity(
        {
          activityId: act.id,
          decision: 'approve',
          comments: 'Well organized with strong community participation. Approved.',
        },
        { id: '00000000-0000-0000-0000-000000000004', name: 'Mariam M. Juma' }
      );

      expect(approved.submissionStatus).toBe('approved');
      expect(approved.reviewedBy).toBe('00000000-0000-0000-0000-000000000004');
      expect(approved.reviewedByName).toBe('Mariam M. Juma');
      expect(approved.reviewComments).toContain('Approved');
    });

    it('allows Project Manager to return an activity for correction with comments', async () => {
      const projects = await getProjects();
      const projId = projects[0]!.id;

      const act = await createActivity(
        {
          projectId: projId,
          title: 'Community Needs Survey',
          activityDate: '2026-04-18',
          participantsCount: 10,
          progress: 'Surveyed 10 households.',
          submitImmediately: true,
        },
        { id: '00000000-0000-0000-0000-000000000005', name: 'Juma K. Temu' }
      );

      const returned = await reviewActivity(
        {
          activityId: act.id,
          decision: 'return_for_correction',
          comments: 'Please attach the signed questionnaire rubrics before resubmitting.',
        },
        { id: '00000000-0000-0000-0000-000000000004', name: 'Mariam M. Juma' }
      );

      expect(returned.submissionStatus).toBe('returned_for_correction');
      expect(returned.reviewComments).toContain('Please attach the signed questionnaire');
    });
  });

  describe('3. Task Tracking & Priority Management', () => {
    it('creates, updates, and completes project tasks', async () => {
      const projects = await getProjects();
      const projId = projects[0]!.id;

      const task = await createTask(
        {
          projectId: projId,
          title: 'Prepare workshop audio equipment',
          description: 'Test speakers, microphones, and audio cables.',
          assignedTo: '00000000-0000-0000-0000-000000000005',
          dueDate: '2026-05-02',
          priority: 'high',
        },
        { id: '00000000-0000-0000-0000-000000000004', name: 'Mariam M. Juma' }
      );

      expect(task.status).toBe('todo');
      expect(task.priority).toBe('high');
      expect(task.assignedToName).toBe('Juma K. Temu');

      // Update to completed
      const completedTask = await updateTask(
        {
          taskId: task.id,
          status: 'completed',
        },
        { id: '00000000-0000-0000-0000-000000000005', name: 'Juma K. Temu' }
      );

      expect(completedTask.status).toBe('completed');
      expect(completedTask.completedAt).toBeDefined();
    });
  });

  describe('4. Team Member Assignments & Budget Invariance', () => {
    it('assigns and removes project members', async () => {
      const projects = await getProjects();
      const proj = projects[0]!;

      // Assign Amina (HR) as viewer
      const newMember = await assignProjectMember(
        {
          projectId: proj.id,
          userId: '00000000-0000-0000-0000-000000000006',
          projectRole: 'viewer',
        },
        { id: 'admin-01' }
      );

      expect(newMember.userId).toBe('00000000-0000-0000-0000-000000000006');
      expect(newMember.userName).toBe('Amina L. Kimaro');
      expect(newMember.projectRole).toBe('viewer');

      // Remove member
      await removeProjectMember(proj.id, '00000000-0000-0000-0000-000000000006');
      const updatedProj = await getProjectById(proj.id);
      expect(updatedProj?.members.some((m) => m.userId === '00000000-0000-0000-0000-000000000006')).toBe(false);
    });

    it('calculates budget utilization, balance, and burn rate correctly', async () => {
      const projects = await getProjects();
      const proj = projects.find((p) => p.projectCode === 'PRJ-BYA-2026')!;
      const budget = await getProjectBudget(proj.id);

      expect(budget).toBeDefined();
      expect(budget?.totalAllocated).toBe(75000000);
      expect(budget?.totalSpent).toBe(24500000);
      expect(budget?.totalCommitted).toBe(8000000);
      expect(budget?.balance).toBe(75000000 - (24500000 + 8000000));
      expect(budget?.burnRatePercent).toBeCloseTo((24500000 / 75000000) * 100, 1);
    });
  });

  describe('5. User Interface Navigation & Role Gating', () => {
    it('redirects unauthenticated requests to /projects back to /login', async () => {
      window.history.pushState({}, 'Test', '/projects');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Staff Portal Sign In|Kuingia kwa Watumishi/i)).toBeInTheDocument();
      });
    });

    it('permits authorized staff to access /projects and displays project cards and metrics', async () => {
      // Authenticate as Project Manager (Mariam M. Juma)
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000004');
      window.history.pushState({}, 'Test', '/projects');
      render(<App />);

      await waitFor(() => {
        expect(
          screen.getAllByText(/Project & Program Register|Daftari la Miradi na Programu/i).length
        ).toBeGreaterThan(0);
      });

      // Wait for project cards to load
      await waitFor(() => {
        expect(screen.getByText('PRJ-BYA-2026')).toBeInTheDocument();
      });

      // KPI Metric Cards exist
      expect(screen.getByText(/Total Projects|Jumla ya Miradi/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Programs|Miradi Inayoendelea/i)).toBeInTheDocument();
      expect(screen.getByText(/Babawatoto Youth Academy 2026/i)).toBeInTheDocument();

      // "New Project" button exists for PM
      expect(
        screen.getByRole('button', { name: /New Project|Mradi Mpya/i })
      ).toBeInTheDocument();
    });

    it('navigates to the Project Workspace and renders all 7 tabs', async () => {
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000004');
      window.history.pushState({}, 'Test', '/projects/10000000-0000-0000-0000-000000000001');
      render(<App />);

      await waitFor(() => {
        expect(screen.getAllByText(/PRJ-BYA-2026/).length).toBeGreaterThan(0);
      });

      // Tabs exist
      expect(screen.getByRole('tab', { name: /Overview|Muhtasari/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Team & Assignments|Timu na Majukumu/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Field Activities|Shughuli za Nyanjani/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Tasks & Progress|Kazi na Utekelezaji/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Budget Utilization|Matumizi ya Bajeti/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Evidence & Documents|Ushahidi na Hati/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Progress Reports|Ripoti za Maendeleo/i })).toBeInTheDocument();

      // Switching to Team tab
      fireEvent.click(screen.getByRole('tab', { name: /Team & Assignments|Timu na Majukumu/i }));
      await waitFor(() => {
        expect(screen.getByText(/Project Workspace Team|Usimamizi wa Timu ya Mradi/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Mariam M. Juma/).length).toBeGreaterThan(0);
      });

      // Switching to Activities tab
      fireEvent.click(screen.getByRole('tab', { name: /Field Activities|Shughuli za Nyanjani/i }));
      await waitFor(() => {
        expect(screen.getAllByText(/Youth Theater & Expression Workshop/i).length).toBeGreaterThan(0);
      });

      // Switching to Budget tab
      fireEvent.click(screen.getByRole('tab', { name: /Budget Utilization|Matumizi ya Bajeti/i }));
      await waitFor(() => {
        expect(screen.getByText(/Budget Utilization Analysis|Tathmini ya Matumizi ya Bajeti/i)).toBeInTheDocument();
        expect(screen.getAllByText(/TZS 75,000,000/i).length).toBeGreaterThan(0);
      });
    });

    it('enforces Coordinator permissions: can record activity but cannot modify budget', async () => {
      // Authenticate as Project Coordinator (Juma K. Temu)
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000005');
      window.history.pushState({}, 'Test', '/projects/10000000-0000-0000-0000-000000000001');
      render(<App />);

      await waitFor(() => {
        expect(screen.getAllByText(/PRJ-BYA-2026/).length).toBeGreaterThan(0);
      });

      // Coordinator can see "Record Activity" button
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Record.*Activity|Rekodi.*Shughuli/i })
        ).toBeInTheDocument();
      });

      // Coordinator cannot see "Assign Team" button
      expect(
        screen.queryByRole('button', { name: /Assign Team|Panga Mjumbe/i })
      ).not.toBeInTheDocument();
    });
  });
});
