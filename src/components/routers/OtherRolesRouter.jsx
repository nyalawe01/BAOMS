import React from 'react';
import { ExecutiveDirectorView } from '../../views/RoleSpecificViews/ExecutiveDirectorView';
import { ProcurementView } from '../../views/RoleSpecificViews/ProcurementView';
import { DepartmentHeadView } from '../../views/RoleSpecificViews/DepartmentHeadView';
import { ProgramOfficerView } from '../../views/RoleSpecificViews/ProgramOfficerView';
import { CommunicationsView } from '../../views/RoleSpecificViews/CommunicationsView';
import { FieldOfficerView } from '../../views/RoleSpecificViews/FieldOfficerView';
import { VolunteerLoggerView } from '../../views/RoleSpecificViews/VolunteerLoggerView';

const Denied = () => <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;

export default function OtherRolesRouter({ activeTab, role }) {
  switch (activeTab) {
    case 'director_panel':
      return role === 'Executive Director' ? <ExecutiveDirectorView /> : <Denied />;
    case 'procurement_panel':
      return role === 'Procurement & Logistics Officer' ? <ProcurementView /> : <Denied />;
    case 'dept_head_panel':
      return role === 'Department Head' ? <DepartmentHeadView /> : <Denied />;
    case 'program_panel':
      return role === 'Program Officer' ? <ProgramOfficerView /> : <Denied />;
    case 'comms_panel':
      return role === 'Communications Officer' ? <CommunicationsView /> : <Denied />;
    case 'field_panel':
      return role === 'Field Officer' ? <FieldOfficerView /> : <Denied />;
    case 'volunteer_panel':
      return (role === 'Volunteer' || role === 'Intern') ? <VolunteerLoggerView /> : <Denied />;
    default:
      return <div className="p-8 text-slate-500 font-semibold">View not found.</div>;
  }
}
