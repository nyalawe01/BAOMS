import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { SystemAdminDashboard } from './SystemAdminDashboard';
import { ExecutiveDirectorDashboard } from './ExecutiveDirectorDashboard';
import { FinanceOfficerDashboard } from './FinanceOfficerDashboard';
import { ProjectManagerDashboard } from './ProjectManagerDashboard';
import { ProjectCoordinatorDashboard } from './ProjectCoordinatorDashboard';
import { HrAdministratorDashboard } from './HrAdministratorDashboard';
import { ProcurementOfficerDashboard } from './ProcurementOfficerDashboard';
import { MonitoringEvaluationDashboard } from './MonitoringEvaluationDashboard';

export const SampleDashboard: React.FC = () => {
  const { roles, hasRole, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  // Allow URL query parameter (?view=pm or ?view=project_manager)
  const requestedView = searchParams.get('view') || searchParams.get('role');
  if (requestedView === 'project_manager' || requestedView === 'pm') {
    return <ProjectManagerDashboard />;
  }
  if (requestedView === 'executive_director' || requestedView === 'ed') {
    return <ExecutiveDirectorDashboard />;
  }
  if (requestedView === 'finance_officer' || requestedView === 'finance') {
    return <FinanceOfficerDashboard />;
  }
  if (requestedView === 'system_admin' || requestedView === 'admin') {
    return <SystemAdminDashboard />;
  }
  if (requestedView === 'project_coordinator' || requestedView === 'coordinator') {
    return <ProjectCoordinatorDashboard />;
  }
  if (requestedView === 'me_officer' || requestedView === 'me') {
    return <MonitoringEvaluationDashboard />;
  }
  if (requestedView === 'hr_administrator' || requestedView === 'hr') {
    return <HrAdministratorDashboard />;
  }
  if (requestedView === 'procurement_officer' || requestedView === 'procurement') {
    return <ProcurementOfficerDashboard />;
  }

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

  if (activeRole === 'me_officer' || hasRole('me_officer')) {
    return <MonitoringEvaluationDashboard />;
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
