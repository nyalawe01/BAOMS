import React from 'react';
import {
  AdminDashboardView, AdminOrganizationView, AdminProjectsView,
  AdminFinanceView, AdminHRView, AdminBeneficiariesView,
  AdminMEView, AdminEventsView, AdminInventoryView,
  AdminCommsView, AdminDocumentsView, AdminReportsView,
  AdminSettingsView, AdminLogsView
} from '../../views/AdminViews';
import { SystemAdminView } from '../../views/RoleSpecificViews/SystemAdminView';

const Denied = () => <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;

export default function AdminRouter({ activeTab, role }) {
  if (role !== 'System Administrator' && role !== 'Administrator') return <Denied />;

  switch (activeTab) {
    case 'admin_dashboard': return <AdminDashboardView />;
    case 'admin_organization': return <AdminOrganizationView />;
    case 'admin_projects': return <AdminProjectsView />;
    case 'admin_finance': return <AdminFinanceView />;
    case 'admin_hr': return <AdminHRView />;
    case 'admin_beneficiaries': return <AdminBeneficiariesView />;
    case 'admin_me': return <AdminMEView />;
    case 'admin_events': return <AdminEventsView />;
    case 'admin_inventory': return <AdminInventoryView />;
    case 'admin_comms': return <AdminCommsView />;
    case 'admin_documents': return <AdminDocumentsView />;
    case 'admin_reports': return <AdminReportsView />;
    case 'admin_settings': return <AdminSettingsView />;
    case 'admin_logs': return <AdminLogsView />;
    case 'admin_panel': return <SystemAdminView />;
    default: return <div className="p-8 text-slate-500 font-semibold">View not found.</div>;
  }
}
