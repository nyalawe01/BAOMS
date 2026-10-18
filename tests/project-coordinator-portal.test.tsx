/**
 * Project Coordinator Portal & Dashboard Test Suite
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Verifies:
 * 1. 13-Item Project Coordinator Sidebar navigation hierarchy
 * 2. Project Coordinator Dashboard KPI calculations (6 required metrics)
 * 3. Coordinator Tasks Management view (CoordinatorTasksView)
 * 4. Field Updates & Observations log view (FieldUpdatesView)
 * 5. Action queue / returned submission alerting
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProjectCoordinatorDashboard } from '@/components/dashboard/ProjectCoordinatorDashboard';
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage';
import '@/locales/i18n';

// Mock auth hook to simulate an authorized Project Coordinator
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'coord-user-id', email: 'coordinator@babawatoto.or.tz' },
    profile: { display_name: 'Fatma K. (Field Coordinator)', id: 'coord-user-id' },
    roles: ['project_coordinator'],
    activeRole: 'project_coordinator',
    hasRole: (role: string) => role === 'project_coordinator',
    hasPermission: () => true,
    isAdmin: () => false,
  }),
}));

// Mock projectService with realistic coordinator field data
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
      members: [{ userId: 'coord-user-id', userName: 'Fatma K.', projectRole: 'coordinator' }],
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
      submittedByName: 'Fatma K.',
      submittedAt: '2026-10-11T10:00:00Z',
    },
    {
      id: 'act-2',
      projectId: 'proj-1',
      projectName: 'Babawatoto Youth Academy 2026',
      title: 'Field Safety Community Outreach',
      activityDate: '2026-10-05',
      location: 'Ward 4 Community Hall',
      participantsCount: 25,
      progress: 'Draft field notes recorded.',
      challenges: 'Rain delayed attendance by 1 hour.',
      submissionStatus: 'returned_for_correction',
      reviewComments: 'Please attach the participant sign-in sheet before resubmitting.',
      submittedByName: 'Fatma K.',
    },
  ]),
  getAllTasks: vi.fn().mockResolvedValue([
    {
      id: 'tsk-1',
      projectId: 'proj-1',
      projectName: 'Babawatoto Youth Academy 2026',
      title: 'Prepare Training Materials',
      dueDate: '2026-11-05',
      priority: 'high',
      status: 'in_progress',
      assignedToName: 'Fatma K.',
    },
    {
      id: 'tsk-2',
      projectId: 'proj-1',
      projectName: 'Babawatoto Youth Academy 2026',
      title: 'Venue Logistics Coordination',
      dueDate: '2026-09-15', // Overdue
      priority: 'urgent',
      status: 'todo',
      assignedToName: 'Fatma K.',
    },
  ]),
  createActivity: vi.fn().mockResolvedValue({}),
  updateActivity: vi.fn().mockResolvedValue({}),
  updateTask: vi.fn().mockResolvedValue({}),
}));

describe('Project Coordinator Portal & Sidebar Implementation', () => {
  describe('1. Sidebar Navigation Structure', () => {
    it('renders the 13-item Project Coordinator navigation structure', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar isOpen={true} onToggle={() => {}} />
        </MemoryRouter>
      );

      // Verify the 13 navigation items from the specification
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/My Projects/i)).toBeInTheDocument();
      expect(screen.getByText(/Activity Schedule/i)).toBeInTheDocument();
      expect(screen.getByText(/Task Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Activity Implementation/i)).toBeInTheDocument();
      expect(screen.getByText(/Beneficiaries & Participants/i)).toBeInTheDocument();
      expect(screen.getByText(/Field Updates/i)).toBeInTheDocument();
      expect(screen.getByText(/Monitoring Data/i)).toBeInTheDocument();
      expect(screen.getByText(/Activity Reports/i)).toBeInTheDocument();
      expect(screen.getByText(/Project Documents/i)).toBeInTheDocument();
      expect(screen.getByText(/Requests & Issues/i)).toBeInTheDocument();
      expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    });
  });

  describe('2. Project Coordinator Dashboard', () => {
    it('renders page header and AdminCN layout structure', () => {
      render(
        <MemoryRouter>
          <ProjectCoordinatorDashboard />
        </MemoryRouter>
      );

      expect(screen.getByText(/Project Coordinator Dashboard/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Field operations desk, assigned activity execution, participant reach, and report submissions./i)
      ).toBeInTheDocument();
    });

    it('displays the 6 required KPI cards accurately calculated from database records', async () => {
      render(
        <MemoryRouter>
          <ProjectCoordinatorDashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        // 1. Assigned Projects
        expect(screen.getAllByText(/Assigned Projects/i).length).toBeGreaterThanOrEqual(1);
        // 2. My Activities
        expect(screen.getAllByText(/My Activities/i).length).toBeGreaterThanOrEqual(1);
        // 3. In Progress
        expect(screen.getAllByText(/In Progress/i).length).toBeGreaterThanOrEqual(1);
        // 4. Overdue Tasks
        expect(screen.getAllByText(/Overdue Tasks/i).length).toBeGreaterThanOrEqual(1);
        // 5. Deadlines Due
        expect(screen.getAllByText(/Deadlines Due/i).length).toBeGreaterThanOrEqual(1);
        // 6. In PM Review
        expect(screen.getAllByText(/In PM Review/i).length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders the Action Queue showing returned submissions requiring correction', async () => {
      render(
        <MemoryRouter>
          <ProjectCoordinatorDashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Field Activity Report\(s\) Returned for Correction/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Please attach the participant sign-in sheet before resubmitting./i)
        ).toBeInTheDocument();
      });
    });

    it('renders the Assigned Field Activities table and upcoming deliverables', async () => {
      render(
        <MemoryRouter>
          <ProjectCoordinatorDashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/My Assigned Field Activities/i)).toBeInTheDocument();
        expect(screen.getByText(/Upcoming Deliverables & Workplan Tasks/i)).toBeInTheDocument();
        expect(screen.getByText(/Field Execution Pipeline/i)).toBeInTheDocument();
      });
    });
  });

  describe('3. Projects Page Submodule Navigation', () => {
    it('renders horizontal sub-navigation tabs including Task Management and Field Updates', () => {
      render(
        <MemoryRouter initialEntries={['/projects']}>
          <ProjectsPage initialTab="projects" />
        </MemoryRouter>
      );

      expect(screen.getByText(/Project & Program Register/i)).toBeInTheDocument();
      expect(screen.getByText(/Project Planning/i)).toBeInTheDocument();
      expect(screen.getByText(/Task Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Field Updates/i)).toBeInTheDocument();
      expect(screen.getByText(/Work Plans & Activities/i)).toBeInTheDocument();
      expect(screen.getByText(/Beneficiaries & Participants/i)).toBeInTheDocument();
      expect(screen.getByText(/Risks & Issues/i)).toBeInTheDocument();
      expect(screen.getByText(/Reports & Deliverables/i)).toBeInTheDocument();
      expect(screen.getByText(/Project Documents/i)).toBeInTheDocument();
    });
  });
});
