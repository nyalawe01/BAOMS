import React from 'react';
import {
  HrHomeView, HrStaffView, HrAddStaffView, HrRequestsView, HrProjectsView,
  HrDepartmentsView, HrPayrollsView, HrLeaveView, HrReportsView, HrDocumentsView,
  HrSettingsView
} from '../../views/HrOfficerViews';
import { HrOfficerView } from '../../views/RoleSpecificViews/HrOfficerView';

const Denied = () => <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;

export default function HrRouter({ activeTab, setActiveTab, role }) {
  if (role !== 'HR Officer') return <Denied />;

  switch (activeTab) {
    case 'hr_home': return <HrHomeView />;
    case 'hr_staff': return <HrStaffView setActiveTab={setActiveTab} />;
    case 'hr_add_staff': return <HrAddStaffView />;
    case 'hr_requests': return <HrRequestsView />;
    case 'hr_projects': return <HrProjectsView />;
    case 'hr_departments': return <HrDepartmentsView />;
    case 'hr_payrolls': return <HrPayrollsView />;
    case 'hr_leave': return <HrLeaveView />;
    case 'hr_reports': return <HrReportsView />;
    case 'hr_documents': return <HrDocumentsView />;
    case 'hr_settings': return <HrSettingsView />;
    case 'hr_panel': return <HrOfficerView />;
    default: return <div className="p-8 text-slate-500 font-semibold">View not found.</div>;
  }
}
