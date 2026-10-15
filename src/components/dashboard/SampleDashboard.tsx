import React from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { SystemAdminDashboard } from './SystemAdminDashboard';
import { ExecutiveDirectorDashboard } from './ExecutiveDirectorDashboard';
import { FinanceOfficerDashboard } from './FinanceOfficerDashboard';
import { ProjectManagerDashboard } from './ProjectManagerDashboard';
import { ProjectCoordinatorDashboard } from './ProjectCoordinatorDashboard';
import { HrAdministratorDashboard } from './HrAdministratorDashboard';
import { ProcurementOfficerDashboard } from './ProcurementOfficerDashboard';

export const SampleDashboard: React.FC = () => {
  const { roles, hasRole, isAdmin } = useAuth();

  // Primary role resolution with fallback logic
  const activeRole = roles[0] || 'project_coordinator';

  if (isAdmin() || activeRole === 'system_admin' || hasRole('system_admin')) {
    return <SystemAdminDashboard />;
  }

  if (activeRole === 'executive_director' || hasRole('executive_director')) {
    return <ExecutiveDirectorDashboard />;
  }

  if (activeRole === 'finance_officer' || hasRole('finance_officer')) {
    return <FinanceOfficerDashboard />;
  }

  if (activeRole === 'project_manager' || hasRole('project_manager')) {
    return <ProjectManagerDashboard />;
  }

  if (activeRole === 'project_coordinator' || hasRole('project_coordinator')) {
    return <ProjectCoordinatorDashboard />;
  }

  if (activeRole === 'hr_administrator' || hasRole('hr_administrator')) {
    return <HrAdministratorDashboard />;
  }

  if (activeRole === 'procurement_officer' || hasRole('procurement_officer')) {
    return <ProcurementOfficerDashboard />;
  }

  // Sensible default fallback for any custom authenticated role
  return <ExecutiveDirectorDashboard />;
};

export default SampleDashboard;
