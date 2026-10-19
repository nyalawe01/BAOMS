/**
 * BAOMS Staff Account Types
 * Babawatoto Organization Management System
 * 
 * Strict Database-Driven Architecture:
 * Mock and demo account presets have been removed. All user accounts, roles,
 * and permissions are loaded exclusively from Supabase PostgreSQL.
 */

import { RoleCode, PermissionCode } from '@/lib/permissions';

export interface DemoAccount {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  preferredLanguage: 'en' | 'sw';
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  role: RoleCode;
  roles: RoleCode[];
  permissions: PermissionCode[];
  isActive: boolean;
  avatarInitials: string;
  isMfaEnrolled?: boolean;
}

// Emptied: No mock accounts are permitted. Real accounts originate from Supabase.
export const DEMO_ACCOUNTS: DemoAccount[] = [];