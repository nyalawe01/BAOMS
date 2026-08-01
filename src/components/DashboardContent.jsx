import React, { lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import OverviewDashboard from '../views/OverviewDashboard';
import { BaselineRequestFormView } from '../views/RoleSpecificViews/BaselineRequestFormView';
import { UserBaselineProfileView } from '../views/RoleSpecificViews/UserBaselineProfileView';
import { ApprovalInboxView } from '../views/ApprovalInboxView';
import { DirectoryView } from '../views/DirectoryView';

// Each router below is its own chunk, only downloaded by users whose role
// actually needs it - previously every role's full view bundle loaded
// upfront regardless of who was signed in.
const HrRouter = lazy(() => import('./routers/HrRouter'));
const PMRouter = lazy(() => import('./routers/PMRouter'));
const FinanceRouter = lazy(() => import('./routers/FinanceRouter'));
const AdminRouter = lazy(() => import('./routers/AdminRouter'));
const MERouter = lazy(() => import('./routers/MERouter'));
const OtherRolesRouter = lazy(() => import('./routers/OtherRolesRouter'));

const LoadingFallback = () => (
  <div className="p-8 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
);

export default function DashboardContent({ activeTab, setActiveTab }) {
  const { role } = useAuth();

  const renderView = () => {
    // Shared, lightweight tabs every role uses - kept eager, no need to split.
    switch (activeTab) {
      case 'profile': return <UserBaselineProfileView />;
      case 'request': return <BaselineRequestFormView />;
      case 'overview': return <OverviewDashboard />;
      case 'approvals': return <ApprovalInboxView />;
      case 'directory': return <DirectoryView />;
      default: break;
    }

    if (activeTab.startsWith('hr_') || activeTab === 'hr_panel') {
      return <HrRouter activeTab={activeTab} setActiveTab={setActiveTab} role={role} />;
    }
    if (activeTab.startsWith('pm_') || activeTab === 'pm_panel') {
      return <PMRouter activeTab={activeTab} role={role} />;
    }
    if (activeTab.startsWith('fin_') || activeTab === 'finance_panel') {
      return <FinanceRouter activeTab={activeTab} role={role} />;
    }
    if (activeTab.startsWith('admin_') || activeTab === 'admin_panel') {
      return <AdminRouter activeTab={activeTab} role={role} />;
    }
    if (activeTab.startsWith('me_')) {
      return <MERouter activeTab={activeTab} role={role} />;
    }
    if (
      activeTab === 'director_panel' || activeTab === 'procurement_panel' ||
      activeTab === 'dept_head_panel' || activeTab === 'program_panel' ||
      activeTab === 'comms_panel' || activeTab === 'field_panel' ||
      activeTab === 'volunteer_panel'
    ) {
      return <OtherRolesRouter activeTab={activeTab} role={role} />;
    }

    return <div className="p-8 text-slate-500 font-semibold">View not found.</div>;
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
      <Suspense fallback={<LoadingFallback />}>
        {renderView()}
      </Suspense>
    </main>
  );
}
