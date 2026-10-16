import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { SignInPage } from '@/features/auth/pages/SignInPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { PasswordResetPage } from '@/features/auth/pages/PasswordResetPage';
import { AccountDeactivatedPage } from '@/features/auth/pages/AccountDeactivatedPage';
import { AccessDeniedPage } from '@/features/auth/pages/AccessDeniedPage';
import { UserManagementPage } from '@/features/users/UserManagementPage';
import { DocumentsPage } from '@/features/documents/pages/DocumentsPage';
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage';
import { ProjectWorkspacePage } from '@/features/projects/pages/ProjectWorkspacePage';
import { RegisterProjectPage } from '@/features/projects/pages/RegisterProjectPage';
import { FinancePage } from '@/features/finance/pages/FinancePage';
import { ProcurementPage } from '@/features/procurement/pages/ProcurementPage';
import { HrPage } from '@/features/hr/pages/HrPage';
import { RegisterStaffPage } from '@/features/hr/pages/RegisterStaffPage';
import { CorrespondencePage } from '@/features/correspondence/pages/CorrespondencePage';
import { ReportsPage } from '@/features/reporting/pages/ReportsPage';
import { AuditLogsPage } from '@/features/audit/pages/AuditLogsPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { SampleDashboard } from '@/components/dashboard/SampleDashboard';
import { DesignSystemPreview } from '@/components/preview/DesignSystemPreview';
import { FoundationDashboard } from '@/components/FoundationDashboard';
const AuthenticatedShellLayout: React.FC = () => {
  return (
    <ProtectedRoute>
      <AppShell>
        <Outlet />
      </AppShell>
    </ProtectedRoute>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Standalone Authentication & Lifecycle Routes */}
      <Route path="/login" element={<SignInPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<PasswordResetPage />} />
      <Route path="/account-deactivated" element={<AccountDeactivatedPage />} />

      {/* Authenticated Application Shell Routes */}
      <Route element={<AuthenticatedShellLayout />}>
        <Route path="/" element={<SampleDashboard />} />
        <Route
          path="/design-system"
          element={
            <ProtectedRoute requiredRoles={['system_admin', 'executive_director']}>
              <DesignSystemPreview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/foundation"
          element={
            <ProtectedRoute requiredRoles={['system_admin', 'executive_director']}>
              <FoundationDashboard />
            </ProtectedRoute>
          }
        />

        {/* Administrator User Management with Server-authoritative Guard */}
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredPermissions={['users.view']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />

        <Route path="/access-denied" element={<AccessDeniedPage />} />

        {/* Documents & Records Management Module */}
        <Route
          path="/documents"
          element={
            <ProtectedRoute requiredPermissions={['documents.view']}>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        {/* Projects & Programs Management Module */}
        <Route
          path="/projects"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <RegisterProjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <ProjectWorkspacePage />
            </ProtectedRoute>
          }
        />
        {/* Finance & Budget Management Module */}
        <Route
          path="/finance"
          element={
            <ProtectedRoute requiredPermissions={['finance.view']}>
              <FinancePage />
            </ProtectedRoute>
          }
        />
        {/* Procurement & Supply Chain Module */}
        <Route
          path="/procurement"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <ProcurementPage />
            </ProtectedRoute>
          }
        />
        {/* Human Resources & Staff Administration Module */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute requiredPermissions={['hr.view']}>
              <HrPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/staff/new"
          element={
            <ProtectedRoute requiredPermissions={['hr.view']}>
              <RegisterStaffPage />
            </ProtectedRoute>
          }
        />
        {/* Correspondence & Meetings Module */}
        <Route
          path="/correspondence"
          element={
            <ProtectedRoute requiredPermissions={['correspondence.view']}>
              <CorrespondencePage />
            </ProtectedRoute>
          }
        />
        {/* Reports & Analytics Engine */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredPermissions={['reports.view']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute requiredPermissions={['audit.view']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
