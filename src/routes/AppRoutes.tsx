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
import { UploadDocumentPage } from '@/features/documents/pages/UploadDocumentPage';
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage';
import { ProjectWorkspacePage } from '@/features/projects/pages/ProjectWorkspacePage';
import { ProjectEnginePage } from '@/features/projects/dynamic/ProjectEnginePage';
import { RegisterProjectPage } from '@/features/projects/pages/RegisterProjectPage';
import { FinancePage } from '@/features/finance/pages/FinancePage';
import { CreateFinancialRequestPage } from '@/features/finance/pages/CreateFinancialRequestPage';
import { RecordPaymentPage } from '@/features/finance/pages/RecordPaymentPage';
import { ProcurementPage } from '@/features/procurement/pages/ProcurementPage';
import { IssuePurchaseOrderPage } from '@/features/procurement/pages/IssuePurchaseOrderPage';
import { RegisterVendorPage } from '@/features/procurement/pages/RegisterVendorPage';
import { HrPage } from '@/features/hr/pages/HrPage';
import { RegisterStaffPage } from '@/features/hr/pages/RegisterStaffPage';
import { HrDepartmentsPage } from '@/features/hr/pages/HrDepartmentsPage';
import { HrOnboardingPage } from '@/features/hr/pages/HrOnboardingPage';
import { HrLeavePage } from '@/features/hr/pages/HrLeavePage';
import { HrContractsPage } from '@/features/hr/pages/HrContractsPage';
import { HrPerformancePage } from '@/features/hr/pages/HrPerformancePage';
import { HrDocumentsPage } from '@/features/hr/pages/HrDocumentsPage';
import { HrApprovalsPage } from '@/features/hr/pages/HrApprovalsPage';
import { HrReportsPage } from '@/features/hr/pages/HrReportsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { CorrespondencePage } from '@/features/correspondence/pages/CorrespondencePage';
import { ReportsPage } from '@/features/reporting/pages/ReportsPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { OrganizationPage } from '@/features/organization/pages/OrganizationPage';
import { MonitoringEvaluationPage } from '@/features/me/pages/MonitoringEvaluationPage';
import { ApprovalsPage } from '@/features/approvals/pages/ApprovalsPage';
import { SampleDashboard } from '@/components/dashboard/SampleDashboard';
import { ProjectManagerDashboard } from '@/components/dashboard/ProjectManagerDashboard';
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
        <Route path="/dashboard" element={<SampleDashboard />} />
        <Route path="/dashboard/pm" element={<ProjectManagerDashboard />} />
        <Route path="/dashboard/project-manager" element={<ProjectManagerDashboard />} />
        <Route
          path="/design-system"
          element={
            <ProtectedRoute requiredRoles={['system_admin']}>
              <DesignSystemPreview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/foundation"
          element={
            <ProtectedRoute requiredRoles={['system_admin']}>
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

        {/* Organization Governance Module */}
        <Route
          path="/organization"
          element={
            <ProtectedRoute requiredPermissions={['departments.view']}>
              <OrganizationPage />
            </ProtectedRoute>
          }
        />

        {/* Centralized Executive Approvals Inbox */}
        <Route
          path="/approvals"
          element={
            <ProtectedRoute>
              <ApprovalsPage />
            </ProtectedRoute>
          }
        />

        {/* M&E & Impact Module */}
        <Route
          path="/me-impact"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <MonitoringEvaluationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/me"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <MonitoringEvaluationPage />
            </ProtectedRoute>
          }
        />

        {/* Documents & Records Management Module */}
        <Route
          path="/documents"
          element={
            <ProtectedRoute requiredPermissions={['documents.view']}>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/upload"
          element={
            <ProtectedRoute requiredPermissions={['documents.upload']}>
              <UploadDocumentPage />
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
            <ProtectedRoute requiredPermissions={['projects.create']}>
              <RegisterProjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/planning"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <ProjectsPage initialTab="planning" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/activities"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <ProjectsPage initialTab="activities" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/tasks"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <ProjectsPage initialTab="tasks" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/field-updates"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <ProjectsPage initialTab="field-updates" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/team"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <ProjectsPage initialTab="team" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/beneficiaries"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <ProjectsPage initialTab="beneficiaries" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/risks"
          element={<Navigate to="/projects" replace />}
        />
        <Route
          path="/projects/budgets"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <ProjectsPage initialTab="budgets" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/reports"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <ProjectsPage initialTab="reports" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/documents"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <ProjectsPage initialTab="documents" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/engine"
          element={
            <ProtectedRoute requiredPermissions={['projects.view']}>
              <ProjectEnginePage />
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
        <Route
          path="/finance/budgets"
          element={
            <ProtectedRoute requiredPermissions={['finance.view']}>
              <FinancePage initialTab="budgets" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/income"
          element={
            <ProtectedRoute requiredPermissions={['finance.view']}>
              <FinancePage initialTab="income" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/expenditure"
          element={
            <ProtectedRoute requiredPermissions={['finance.view']}>
              <FinancePage initialTab="requests" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/transactions"
          element={
            <ProtectedRoute requiredPermissions={['finance.view']}>
              <FinancePage initialTab="transactions" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/projects"
          element={
            <ProtectedRoute requiredPermissions={['finance.view']}>
              <FinancePage initialTab="projects" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/procurement"
          element={
            <ProtectedRoute requiredPermissions={['finance.view']}>
              <FinancePage initialTab="procurement" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/approvals"
          element={
            <ProtectedRoute requiredPermissions={['finance.view']}>
              <FinancePage initialTab="approvals" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/documents"
          element={
            <ProtectedRoute requiredPermissions={['finance.view']}>
              <FinancePage initialTab="documents" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/reports"
          element={
            <ProtectedRoute requiredPermissions={['finance.view']}>
              <FinancePage initialTab="reports" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/statutory"
          element={
            <ProtectedRoute requiredPermissions={['finance.view']}>
              <FinancePage initialTab="statutory" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/requisitions/new"
          element={
            <ProtectedRoute requiredPermissions={['finance.view']}>
              <CreateFinancialRequestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/payments/new"
          element={
            <ProtectedRoute requiredPermissions={['finance.view']}>
              <RecordPaymentPage />
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
        <Route
          path="/procurement/requests"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <ProcurementPage initialTab="requests" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/plans"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <ProcurementPage initialTab="plans" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/quotations"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <ProcurementPage initialTab="quotations" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/vendors"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <ProcurementPage initialTab="vendors" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/orders"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <ProcurementPage initialTab="orders" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/receiving"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <ProcurementPage initialTab="receiving" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/inventory"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <ProcurementPage initialTab="inventory" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/evaluation"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <ProcurementPage initialTab="evaluation" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/approvals"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <ProcurementPage initialTab="approvals" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/invoices"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <ProcurementPage initialTab="invoices" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/documents"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <ProcurementPage initialTab="documents" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/reports"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <ProcurementPage initialTab="reports" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/orders/new"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <IssuePurchaseOrderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement/vendors/new"
          element={
            <ProtectedRoute requiredPermissions={['procurement.view']}>
              <RegisterVendorPage />
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
        <Route
          path="/hr/departments"
          element={
            <ProtectedRoute requiredPermissions={['hr.view']}>
              <HrDepartmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/onboarding"
          element={
            <ProtectedRoute requiredPermissions={['hr.view']}>
              <HrOnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/leave"
          element={
            <ProtectedRoute requiredPermissions={['hr.view']}>
              <HrLeavePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/contracts"
          element={
            <ProtectedRoute requiredPermissions={['hr.view']}>
              <HrContractsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/performance"
          element={
            <ProtectedRoute requiredPermissions={['hr.view']}>
              <HrPerformancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/documents"
          element={
            <ProtectedRoute requiredPermissions={['hr.view']}>
              <HrDocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/approvals"
          element={
            <ProtectedRoute requiredPermissions={['hr.view']}>
              <HrApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/reports"
          element={
            <ProtectedRoute requiredPermissions={['hr.view']}>
              <HrReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
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
        <Route path="/audit-logs" element={<Navigate to="/" replace />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
