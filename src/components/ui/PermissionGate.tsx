import React from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { RoleCode } from '@/lib/permissions';

export interface PermissionGateProps {
  permission?: string | string[];
  role?: RoleCode | RoleCode[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  role,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasRole } = useAuth();

  let isAllowed = true;

  if (role) {
    const rolesToCheck = Array.isArray(role) ? role : [role];
    isAllowed = isAllowed && hasRole(rolesToCheck);
  }

  if (permission) {
    const permsToCheck = Array.isArray(permission) ? permission : [permission];
    isAllowed = isAllowed && permsToCheck.every((p) => hasPermission(p));
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
