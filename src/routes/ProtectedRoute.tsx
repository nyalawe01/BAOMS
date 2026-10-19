import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { RoleCode } from '@/lib/permissions';
import { AccessDeniedPage } from '@/features/auth/pages/AccessDeniedPage';
import { WaitingForApprovalDashboard } from '@/features/dashboard/WaitingForApprovalDashboard';

interface ProtectedRouteProps {
  requiredRoles?: RoleCode[];
  requiredPermissions?: string[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRoles,
  requiredPermissions,
  children,
}) => {
  const location = useLocation();
  const { isAuthenticated, isDeactivated, isPendingApproval, isLoading, hasRole, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 max-w-xs text-center p-6">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center">
              <img src="/logo.png" alt="BAOMS" className="w-8 h-8 object-contain" />
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-slate-300 animate-ping opacity-25" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-800">BAOMS Enterprise</div>
            <div className="text-xs text-slate-500">Verifying secure organization session...</div>
          </div>
          <div className="w-32 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-slate-400 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Account marked inactive -> Redirect to deactivated page
  if (isDeactivated) {
    return <Navigate to="/account-deactivated" replace />;
  }

  // Account awaiting HR or Executive Director approval -> Show Waiting for Approval Dashboard
  if (isPendingApproval) {
    return <WaitingForApprovalDashboard />;
  }

  // Role requirement check: silent redirect instead of showing Access Denied
  if (requiredRoles && requiredRoles.length > 0) {
    const isAuthorized = hasRole(requiredRoles);
    if (!isAuthorized) {
      return <Navigate to="/" replace />;
    }
  }

  // Permission requirement check: silent redirect instead of showing Access Denied
  if (requiredPermissions && requiredPermissions.length > 0) {
    const isAuthorized = requiredPermissions.every((perm) => hasPermission(perm));
    if (!isAuthorized) {
      return <Navigate to="/" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};
