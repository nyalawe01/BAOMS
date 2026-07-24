import React from 'react';
import { useAuth } from '../context/AuthContext';
import OverviewDashboard from '../views/OverviewDashboard';
import { 
  SystemAdminView, ExecutiveDirectorView, HrOfficerView, ProjectManagerView, 
  ProcurementView, DepartmentHeadView, ProgramOfficerView, 
  CommunicationsView, FieldOfficerView, VolunteerLoggerView, BaselineRequestFormView,
  UserBaselineProfileView 
} from '../views/RoleSpecificViews';

// HR Specific Views
import {
  HrHomeView, HrStaffView, HrAddStaffView, HrRequestsView, HrProjectsView,
  HrDepartmentsView, HrPayrollsView, HrLeaveView, HrReportsView, HrDocumentsView,
  HrSettingsView
} from '../views/HrOfficerViews';

// PM Specific Views
import {
  PMDashboardView, PMProjectsView, PMTeamMembersView,
  PMBudgetFinanceView, PMResourcesView, PMDocumentsView, PMReportsView,
  PMMEView, PMNotificationsView, PMSettingsView
} from '../views/ProjectManagerViews';

// Finance Specific Views
import {
  FinanceDashboardView, FinanceTransactionsView, FinanceIncomeView,
  FinanceExpensesView, FinanceAccountsView, FinanceProjectsView,
  FinanceBudgetsView, FinancePayrollView, FinanceInvoicesView,
  FinanceReportsView, FinanceApprovalsView, FinanceSettingsView
} from '../views/FinanceOfficerViews';

// Admin Specific Views
import {
  AdminDashboardView, AdminOrganizationView, AdminProjectsView,
  AdminFinanceView, AdminHRView, AdminBeneficiariesView,
  AdminMEView, AdminEventsView, AdminInventoryView,
  AdminCommsView, AdminDocumentsView, AdminReportsView,
  AdminSettingsView, AdminLogsView
} from '../views/AdminViews';

// M&E Specific Views
import {
  MEDashboardView, MEProjectsView, MEIndicatorsView,
  METargetsView, MEBeneficiariesView, MECollectionView,
  MESurveysView, MEVisitsView, MEReportsView,
  MEQualityView, MEMapsView, MEAnalyticsView,
  MEDocumentsView, MESettingsView
} from '../views/MEViews';

export default function DashboardContent({ activeTab, setActiveTab }) {
  const { role } = useAuth();

  const renderView = () => {
    switch (activeTab) {
      // HR Officer specialized tabs
      case 'hr_home':
        if (role !== 'HR Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <HrHomeView />;
      case 'hr_staff':
        if (role !== 'HR Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <HrStaffView setActiveTab={setActiveTab} />;
      case 'hr_add_staff':
        if (role !== 'HR Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <HrAddStaffView />;
      case 'hr_requests':
        if (role !== 'HR Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <HrRequestsView />;
      case 'hr_projects':
        if (role !== 'HR Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <HrProjectsView />;
      case 'hr_departments':
        if (role !== 'HR Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <HrDepartmentsView />;
      case 'hr_payrolls':
        if (role !== 'HR Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <HrPayrollsView />;
      case 'hr_leave':
        if (role !== 'HR Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <HrLeaveView />;
      case 'hr_reports':
        if (role !== 'HR Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <HrReportsView />;
      case 'hr_documents':
        if (role !== 'HR Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <HrDocumentsView />;
      case 'hr_settings':
        if (role !== 'HR Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <HrSettingsView />;

      // Baseline and standard tabs
      case 'profile':
        return <UserBaselineProfileView />;
      case 'request':
        return <BaselineRequestFormView />;
      case 'overview':
        return <OverviewDashboard />;
      case 'admin_panel':
        if (role !== 'System Administrator') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <SystemAdminView />;
      case 'director_panel':
        if (role !== 'Executive Director') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <ExecutiveDirectorView />;
      case 'hr_panel':
        if (role !== 'HR Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <HrOfficerView />;
      case 'pm_panel':
        if (role !== 'Project Manager') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <ProjectManagerView />;
      case 'finance_panel':
        if (role !== 'Finance Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <FinanceOfficerView />;
      case 'procurement_panel':
        if (role !== 'Procurement & Logistics Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <ProcurementView />;
      case 'dept_head_panel':
        if (role !== 'Department Head') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <DepartmentHeadView />;
      case 'program_panel':
        if (role !== 'Program Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <ProgramOfficerView />;
      case 'comms_panel':
        if (role !== 'Communications Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <CommunicationsView />;
      case 'field_panel':
        if (role !== 'Field Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <FieldOfficerView />;
      case 'volunteer_panel':
        if (role !== 'Volunteer' && role !== 'Intern') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <VolunteerLoggerView />;

      // Project Manager dashboard sections
      case 'pm_dashboard':
        if (role !== 'Project Manager') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <PMDashboardView />;
      case 'pm_projects':
        if (role !== 'Project Manager') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <PMProjectsView />;
      case 'pm_team':
        if (role !== 'Project Manager') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <PMTeamMembersView />;
      case 'pm_budget':
        if (role !== 'Project Manager') return <div className="p-8 text-slate-550 font-medium">Access Denied.</div>;
        return <PMBudgetFinanceView />;
      case 'pm_resources':
        if (role !== 'Project Manager') return <div className="p-8 text-slate-550 font-medium">Access Denied.</div>;
        return <PMResourcesView />;
      case 'pm_documents':
        if (role !== 'Project Manager') return <div className="p-8 text-slate-550 font-medium">Access Denied.</div>;
        return <PMDocumentsView />;
      case 'pm_reports':
        if (role !== 'Project Manager') return <div className="p-8 text-slate-550 font-medium">Access Denied.</div>;
        return <PMReportsView />;
      case 'pm_me':
        if (role !== 'Project Manager') return <div className="p-8 text-slate-550 font-medium">Access Denied.</div>;
        return <PMMEView />;
      case 'pm_notifications':
        if (role !== 'Project Manager') return <div className="p-8 text-slate-550 font-medium">Access Denied.</div>;
        return <PMNotificationsView />;
      case 'pm_settings':
        if (role !== 'Project Manager') return <div className="p-8 text-slate-550 font-medium">Access Denied.</div>;
        return <PMSettingsView />;

      // Finance Officer dashboard sections
      case 'fin_dashboard':
        if (role !== 'Finance Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <FinanceDashboardView />;
      case 'fin_transactions':
        if (role !== 'Finance Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <FinanceTransactionsView />;
      case 'fin_income':
        if (role !== 'Finance Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <FinanceIncomeView />;
      case 'fin_expenses':
        if (role !== 'Finance Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <FinanceExpensesView />;
      case 'fin_accounts':
        if (role !== 'Finance Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <FinanceAccountsView />;
      case 'fin_projects':
        if (role !== 'Finance Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <FinanceProjectsView />;
      case 'fin_budgets':
        if (role !== 'Finance Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <FinanceBudgetsView />;
      case 'fin_payroll':
        if (role !== 'Finance Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <FinancePayrollView />;
      case 'fin_invoices':
        if (role !== 'Finance Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <FinanceInvoicesView />;
      case 'fin_reports':
        if (role !== 'Finance Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <FinanceReportsView />;
      case 'fin_approvals':
        if (role !== 'Finance Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <FinanceApprovalsView />;
      case 'fin_settings':
        if (role !== 'Finance Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <FinanceSettingsView />;

      // Admin dashboard sections
      case 'admin_dashboard':
        if (role !== 'System Administrator' && role !== 'Administrator') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <AdminDashboardView />;
      case 'admin_organization':
        if (role !== 'System Administrator' && role !== 'Administrator') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <AdminOrganizationView />;
      case 'admin_projects':
        if (role !== 'System Administrator' && role !== 'Administrator') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <AdminProjectsView />;
      case 'admin_finance':
        if (role !== 'System Administrator' && role !== 'Administrator') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <AdminFinanceView />;
      case 'admin_hr':
        if (role !== 'System Administrator' && role !== 'Administrator') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <AdminHRView />;
      case 'admin_beneficiaries':
        if (role !== 'System Administrator' && role !== 'Administrator') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <AdminBeneficiariesView />;
      case 'admin_me':
        if (role !== 'System Administrator' && role !== 'Administrator') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <AdminMEView />;
      case 'admin_events':
        if (role !== 'System Administrator' && role !== 'Administrator') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <AdminEventsView />;
      case 'admin_inventory':
        if (role !== 'System Administrator' && role !== 'Administrator') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <AdminInventoryView />;
      case 'admin_comms':
        if (role !== 'System Administrator' && role !== 'Administrator') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <AdminCommsView />;
      case 'admin_documents':
        if (role !== 'System Administrator' && role !== 'Administrator') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <AdminDocumentsView />;
      case 'admin_reports':
        if (role !== 'System Administrator' && role !== 'Administrator') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <AdminReportsView />;
      case 'admin_settings':
        if (role !== 'System Administrator' && role !== 'Administrator') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <AdminSettingsView />;
      case 'admin_logs':
        if (role !== 'System Administrator' && role !== 'Administrator') return <div className="p-8 text-slate-550 font-medium">Access Denied.</div>;
        return <AdminLogsView />;

      // M&E Officer dashboard sections
      case 'me_dashboard':
        if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;
        return <MEDashboardView />;
      case 'me_projects':
        if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <MEProjectsView />;
      case 'me_indicators':
        if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <MEIndicatorsView />;
      case 'me_targets':
        if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <METargetsView />;
      case 'me_beneficiaries':
        if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <MEBeneficiariesView />;
      case 'me_collection':
        if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <MECollectionView />;
      case 'me_surveys':
        if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <MESurveysView />;
      case 'me_visits':
        if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <MEVisitsView />;
      case 'me_reports':
        if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <MEReportsView />;
      case 'me_quality':
        if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <MEQualityView />;
      case 'me_maps':
        if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <MEMapsView />;
      case 'me_analytics':
        if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <MEAnalyticsView />;
      case 'me_documents':
        if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <MEDocumentsView />;
      case 'me_settings':
        if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <div className="p-8 text-slate-505 font-medium">Access Denied.</div>;
        return <MESettingsView />;

      default:
        return <div className="p-8 text-slate-500 font-semibold">View not found.</div>;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
      {renderView()}
    </main>
  );
}
