import React from 'react';
import {
  PMDashboardView, PMProjectsView, PMTeamMembersView,
  PMBudgetFinanceView, PMResourcesView, PMDocumentsView, PMReportsView,
  PMMEView, PMNotificationsView, PMSettingsView
} from '../../views/ProjectManagerViews';
import { ProjectManagerView } from '../../views/RoleSpecificViews/ProjectManagerView';

const Denied = () => <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;

export default function PMRouter({ activeTab, role }) {
  if (role !== 'Project Manager') return <Denied />;

  switch (activeTab) {
    case 'pm_dashboard': return <PMDashboardView />;
    case 'pm_projects': return <PMProjectsView />;
    case 'pm_team': return <PMTeamMembersView />;
    case 'pm_budget': return <PMBudgetFinanceView />;
    case 'pm_resources': return <PMResourcesView />;
    case 'pm_documents': return <PMDocumentsView />;
    case 'pm_reports': return <PMReportsView />;
    case 'pm_me': return <PMMEView />;
    case 'pm_notifications': return <PMNotificationsView />;
    case 'pm_settings': return <PMSettingsView />;
    case 'pm_panel': return <ProjectManagerView />;
    default: return <div className="p-8 text-slate-500 font-semibold">View not found.</div>;
  }
}
