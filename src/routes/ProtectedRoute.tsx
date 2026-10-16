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
      <div className="flex h-screen w-screen items-center justify-center bg-surface-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-700 border-t-transparent" />
          <span className="text-xs font-medium text-charcoal-muted">
            Verifying secure session...
          </span>
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
