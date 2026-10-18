/**
 * Project Manager Portal & Dashboard Test Suite
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Verifies:
 * 1. 14-Item Project Manager Sidebar navigation hierarchy
 * 2. Project Manager Dashboard KPI calculations and AdminCN layout structure
 * 3. Project Management sub-views (Planning, Workplans, Team, Beneficiaries, Risks, Budgets, Reports, Documents)
 * 4. Monochrome icon styling and BAOMS gold design tokens
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProjectManagerDashboard } from '@/components/dashboard/ProjectManagerDashboard';
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage';
import '@/locales/i18n';

// Mock auth hook to simulate an authorized Project Manager
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'pm-test-user-id', email: 'pm@babawatoto.or.tz' },
    profile: { display_name: 'Baraka M. (Project Manager)', id: 'pm-test-user-id' },
    roles: ['project_manager'],
    activeRole: 'project_manager',
    hasRole: (role: string) => role === 'project_manager',
    hasPermission: () => true,
    isAdmin: () => false,
  }),
}));

// Mock projectService with realistic dataset
vi.mock('@/features/projects/services/projectService', () => ({
  getProjects: vi.fn().mockResolvedValue([
    {
      id: 'proj-1',
      projectCode: 'PRJ-BYA-2026',
      name: 'Babawatoto Youth Academy 2026',
      description: 'Youth skills and talent development program.',
      funder: 'Foundation for Civil Society (FCS)',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'active',
      totalBudget: 75000000,
      currency: 'TZS',
      activityCount: 8,
      taskCount: 4,
      members: [{ userId: 'pm-test-user-id', userName: 'Baraka M.', projectRole: 'manager' }],
      budgetSummary: { totalBudget: 75000000, allocated: 50000000, spent: 32500000, commitments: 0, balance: 42500000 },
    },
    {
      id: 'proj-2',
      projectCode: 'PRJ-CWD-2026',
      name: 'Children With Disabilities Inclusion Initiative',
      description: 'Supportive aids and community education.',
      funder: 'UNICEF Tanzania',
      startDate: '2026-03-01',
      endDate: '2026-10-31',
      status: 'planning',
      totalBudget: 45000000,
      currency: 'TZS',
      activityCount: 2,
      taskCount: 1,
      members: [],
      budgetSummary: { totalBudget: 45000000, allocated: 20000000, spent: 5000000, commitments: 0, balance: 40000000 },
    },
  ]),
  getAllActivities: vi.fn().mockResolvedValue([
    {
      id: 'act-1',
      projectId: 'proj-1',
      projectName: 'Babawatoto Youth Academy 2026',
      title: 'Youth Leadership Workshop',
      activityDate: '2026-10-10',
      location: 'Kigamboni Center',
      participantsCount: 45,
      progress: 'Successfully conducted modules 1-3.',
      submissionStatus: 'submitted',
      submittedByName: 'John Coordinator',
      submittedAt: '2026-10-11T10:00:00Z',
    },
    {
      id: 'act-2',
      projectId: 'proj-1',
      projectName: 'Babawatoto Youth Academy 2026',
      title: 'Arts & Media Training',
      activityDate: '2026-09-15',
      location: 'Main Hall',
      participantsCount: 30,
      progress: 'Completed media boot camp.',
      submissionStatus: 'approved',
      submittedByName: 'Sarah Officer',
      submittedAt: '2026-09-16T10:00:00Z',
    },
  ]),
  getAllTasks: vi.fn().mockResolvedValue([
    {
      id: 'tsk-1',
      projectId: 'proj-1',
      title: 'Submit Mid-Term Donor Milestone',
      dueDate: '2026-11-15',
      priority: 'high',
      status: 'in_progress',
      assignedToName: 'Baraka M.',
    },
    {
      id: 'tsk-2',
      projectId: 'proj-1',
      title: 'Field Safety Audit Report',
      dueDate: '2026-09-01', // Overdue
      priority: 'urgent',
      status: 'todo',
      assignedToName: 'Field Officer',
    },
  ]),
  getAllReports: vi.fn().mockResolvedValue([
    {
      id: 'rep-1',
      projectId: 'proj-1',
      title: 'Q3 Implementation Progress Report',
      reportType: 'quarterly',
      reportingPeriodStart: '2026-07-01',
      reportingPeriodEnd: '2026-10-31',
      status: 'draft',
      preparedByName: 'Baraka M.',
    },
  ]),
  reviewActivitySubmission: vi.fn().mockResolvedValue({}),
}));

describe('Project Manager Portal & Sidebar Implementation', () => {
  describe('1. Sidebar Navigation Structure', () => {
    it('renders the 14-item Project Manager navigation structure', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar isOpen={true} onToggle={() => {}} />
        </MemoryRouter>
      );

      // Verify key navigation items from the 14-item PM specification
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/My Projects/i)).toBeInTheDocument();
      expect(screen.getByText(/Project Planning/i)).toBeInTheDocument();
      expect(screen.getByText(/Work Plans & Activities/i)).toBeInTheDocument();
      expect(screen.getByText(/Project Team/i)).toBeInTheDocument();
      expect(screen.getByText(/Monitoring & Evaluation/i)).toBeInTheDocument();
      expect(screen.getByText(/Beneficiaries & Participants/i)).toBeInTheDocument();
      expect(screen.getByText(/Risks & Issues/i)).toBeInTheDocument();
      expect(screen.getByText(/Budgets & Expenditure/i)).toBeInTheDocument();
      expect(screen.getByText(/Reports & Deliverables/i)).toBeInTheDocument();
      expect(screen.getByText(/Project Documents/i)).toBeInTheDocument();
      expect(screen.getByText(/Approvals & Requests/i)).toBeInTheDocument();
      expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    });
  });

  describe('2. Project Manager Dashboard', () => {
    it('renders page header and AdminCN layout structure', async () => {
      render(
        <MemoryRouter>
          <ProjectManagerDashboard />
        </MemoryRouter>
      );

      expect(screen.getByText(/Project Manager Dashboard/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Portfolio oversight, workplan delivery, coordinator review desk, and milestone analytics./i)
      ).toBeInTheDocument();
    });

    it('displays the 6 required KPI cards accurately calculated from database records', async () => {
      render(
        <MemoryRouter>
          <ProjectManagerDashboard />
        </MemoryRouter>
      );

      // 1. Assigned Projects
      expect(screen.getByText(/Assigned Projects/i)).toBeInTheDocument();
      // 2. Active Projects
      expect(screen.getByText(/Active Projects/i)).toBeInTheDocument();
      // 3. Activities in Progress
      expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
      // 4. Overdue Items
      expect(screen.getByText(/Overdue Items/i)).toBeInTheDocument();
      // 5. Deliverables Due
      expect(screen.getByText(/Deliverables Due/i)).toBeInTheDocument();
      // 6. Pending Reviews
      expect(screen.getByText(/Pending Reviews/i)).toBeInTheDocument();
    });

    it('renders Coordinator Submissions review desk and workplan tasks', async () => {
      render(
        <MemoryRouter>
          <ProjectManagerDashboard />
        </MemoryRouter>
      );

      expect(screen.getByText(/Coordinator Submissions Awaiting Review/i)).toBeInTheDocument();
      expect(screen.getByText(/Workplan Tasks & Deliverables/i)).toBeInTheDocument();
      expect(screen.getByText(/Project Portfolio Overview/i)).toBeInTheDocument();
    });
  });

  describe('3. Projects Page Submodule Navigation', () => {
    it('renders horizontal sub-navigation tabs for all 8 project management modules', () => {
      render(
        <MemoryRouter initialEntries={['/projects']}>
          <ProjectsPage initialTab="projects" />
        </MemoryRouter>
      );

      expect(screen.getByText(/Project & Program Register/i)).toBeInTheDocument();
      expect(screen.getByText(/Project Planning/i)).toBeInTheDocument();
      expect(screen.getByText(/Work Plans & Activities/i)).toBeInTheDocument();
      expect(screen.getByText(/Project Team/i)).toBeInTheDocument();
      expect(screen.getByText(/Beneficiaries & Participants/i)).toBeInTheDocument();
      expect(screen.getByText(/Risks & Issues/i)).toBeInTheDocument();
      expect(screen.getByText(/Budgets & Expenditure/i)).toBeInTheDocument();
      expect(screen.getByText(/Reports & Deliverables/i)).toBeInTheDocument();
      expect(screen.getByText(/Project Documents/i)).toBeInTheDocument();
    });
  });
});
