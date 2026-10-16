import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { WaitingForApprovalDashboard } from '@/features/dashboard/WaitingForApprovalDashboard';
import { UserOnboardingReviewModal } from '@/features/users/components/UserOnboardingReviewModal';
import { ExecutiveApprovalModal } from '@/features/users/components/ExecutiveApprovalModal';
import { ToastProvider } from '@/lib/ToastContext';
import { AuthProvider } from '@/features/auth/AuthContext';
import '@/locales/i18n';

describe('User Self-Registration & Dual Approval Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Self-Registration Portal (/register)', () => {
    it('renders the self-registration form with official domain enforcement', () => {
      render(
        <BrowserRouter>
          <ToastProvider>
            <RegisterPage />
          </ToastProvider>
        </BrowserRouter>
      );

      expect(screen.getAllByText(/Staff Self-Registration/i).length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/Full Legal Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Official Organization Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
      expect(screen.getAllByText(/@babawatoto.or.tz/i).length).toBeGreaterThan(0);
    });

    it('rejects unauthorized email domains and displays an error message', async () => {
      render(
        <BrowserRouter>
          <ToastProvider>
            <RegisterPage />
          </ToastProvider>
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Official Organization Email/i);
      fireEvent.change(emailInput, { target: { value: 'john.doe@gmail.com' } });

      await waitFor(() => {
        expect(
          screen.getByText(/Official organization email required.*@babawatoto.or.tz/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('2. Waiting for Approval Dashboard', () => {
    it('renders the dark dashboard and approval pipeline for pending users', () => {
      // Mock pending user in localStorage
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000005');

      render(
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <WaitingForApprovalDashboard />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      );

      expect(screen.getAllByText(/Waiting for Approval/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Organizational Approval Pipeline/i)).toBeInTheDocument();
      expect(screen.getByText(/HR Department Review/i)).toBeInTheDocument();
      expect(screen.getByText(/Executive Authorization/i)).toBeInTheDocument();
      expect(screen.getByText(/Check Approval Status/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign Out of Portal/i)).toBeInTheDocument();
    });
  });

  describe('3. HR Stepper Onboarding Modal', () => {
    it('renders the 4-step onboarding stepper with personal, professional, and scope configuration', async () => {
      const mockCandidate = {
        id: 'user-cand-123',
        email: 'newstaff@babawatoto.or.tz',
        displayName: 'Elisha Nyalawe',
        phoneNumber: '+255 754 999 888',
        approvalStatus: 'pending_hr' as const,
      };

      render(
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <UserOnboardingReviewModal
                isOpen={true}
                onClose={() => {}}
                user={mockCandidate}
                onSuccess={() => {}}
              />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      );

      // Step 1: Personal info
      expect(screen.getByText(/Staff Personnel Review & Role Onboarding/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Elisha Nyalawe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('newstaff@babawatoto.or.tz')).toBeInTheDocument();

      // Navigate to Step 2: Professional & Role
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
      await waitFor(() => {
        expect(screen.getByText(/Assigned Organizational Role|System Role Authorization/i)).toBeInTheDocument();
      });

      // Navigate to Step 3: Allowed Scopes
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
      await waitFor(() => {
        expect(screen.getByText(/Allowed Documentation Categories/i)).toBeInTheDocument();
        expect(screen.getByText(/Assigned Projects & Field Programs/i)).toBeInTheDocument();
      });

      // Navigate to Step 4: Summary & Submit
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
      await waitFor(() => {
        expect(screen.getByText(/Approve & Forward to Executive Director/i)).toBeInTheDocument();
      });
    });
  });

  describe('4. Executive Director Authorization Modal', () => {
    it('renders candidate dossier and authorization actions for Executive Director', () => {
      const mockCandidate = {
        id: 'user-cand-456',
        email: 'coordinator@babawatoto.or.tz',
        displayName: 'Zuberi J. Kondo',
        phoneNumber: '+255 754 555 444',
        approvalStatus: 'pending_ed' as const,
        stagedDetails: {
          fullName: 'Zuberi J. Kondo',
          departmentName: 'Projects & Programs',
          roleCode: 'project_coordinator',
          jobTitle: 'Field Coordinator',
          allowedProjectIds: ['PRJ-BYA-2026'],
        },
      };

      render(
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <ExecutiveApprovalModal
                isOpen={true}
                onClose={() => {}}
                user={mockCandidate}
                onSuccess={() => {}}
              />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      );

      expect(screen.getByText(/Executive Director Authorization/i)).toBeInTheDocument();
      expect(screen.getByText(/Executive Clearance Gate/i)).toBeInTheDocument();
      expect(screen.getByText('Zuberi J. Kondo')).toBeInTheDocument();
      expect(screen.getByText('coordinator@babawatoto.or.tz')).toBeInTheDocument();
      expect(screen.getByText(/PROJECT COORDINATOR/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Authorize & Activate Access/i })).toBeInTheDocument();
    });
  });
});
