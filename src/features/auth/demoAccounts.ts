/**
 * BAOMS Demo & Development Accounts
 * Babawatoto Organization Management System
 * 
 * Pre-configured organizational staff accounts representing the initial 6 roles
 * and negative security test cases (deactivated user). Used for testing,
 * local development, and demonstration before live Supabase credentials are provided.
 */

import { ROLES, ROLE_PERMISSIONS, RoleCode, PermissionCode } from '@/lib/permissions';

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

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@babawatoto.or.tz',
    displayName: 'Amani Bakari',
    phoneNumber: '+255 754 111 001',
    preferredLanguage: 'en',
    departmentId: 'dept-admin',
    departmentCode: 'ADMIN',
    departmentName: 'IT & System Administration',
    role: ROLES.SYSTEM_ADMIN,
    roles: [ROLES.SYSTEM_ADMIN],
    permissions: ROLE_PERMISSIONS[ROLES.SYSTEM_ADMIN],
    isActive: true,
    avatarInitials: 'AB',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'director@babawatoto.org',
    displayName: 'Elisha N. Mwakipesile',
    phoneNumber: '+255 754 222 002',
    preferredLanguage: 'sw',
    departmentId: 'dept-exec',
    departmentCode: 'EXEC',
    departmentName: 'Executive Office',
    role: ROLES.EXECUTIVE_DIRECTOR,
    roles: [ROLES.EXECUTIVE_DIRECTOR],
    permissions: ROLE_PERMISSIONS[ROLES.EXECUTIVE_DIRECTOR],
    isActive: true,
    avatarInitials: 'EM',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'finance@babawatoto.org',
    displayName: 'Baraka Said',
    phoneNumber: '+255 754 333 003',
    preferredLanguage: 'en',
    departmentId: 'dept-fin',
    departmentCode: 'FIN',
    departmentName: 'Finance & Operations',
    role: ROLES.FINANCE_OFFICER,
    roles: [ROLES.FINANCE_OFFICER],
    permissions: ROLE_PERMISSIONS[ROLES.FINANCE_OFFICER],
    isActive: true,
    avatarInitials: 'BS',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'pm@babawatoto.org',
    displayName: 'Mariam M. Juma',
    phoneNumber: '+255 754 444 004',
    preferredLanguage: 'sw',
    departmentId: 'dept-prj',
    departmentCode: 'PRJ',
    departmentName: 'Projects & Programs',
    role: ROLES.PROJECT_MANAGER,
    roles: [ROLES.PROJECT_MANAGER],
    permissions: ROLE_PERMISSIONS[ROLES.PROJECT_MANAGER],
    isActive: true,
    avatarInitials: 'MJ',
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    email: 'coordinator@babawatoto.org',
    displayName: 'Juma K. Temu',
    phoneNumber: '+255 754 555 005',
    preferredLanguage: 'sw',
    departmentId: 'dept-prj',
    departmentCode: 'PRJ',
    departmentName: 'Projects & Programs',
    role: ROLES.PROJECT_COORDINATOR,
    roles: [ROLES.PROJECT_COORDINATOR],
    permissions: ROLE_PERMISSIONS[ROLES.PROJECT_COORDINATOR],
    isActive: true,
    avatarInitials: 'JT',
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    email: 'hr@babawatoto.org',
    displayName: 'Amina L. Kimaro',
    phoneNumber: '+255 754 666 006',
    preferredLanguage: 'en',
    departmentId: 'dept-hr',
    departmentCode: 'HR',
    departmentName: 'Human Resources & Administration',
    role: ROLES.HR_ADMINISTRATOR,
    roles: [ROLES.HR_ADMINISTRATOR],
    permissions: ROLE_PERMISSIONS[ROLES.HR_ADMINISTRATOR],
    isActive: true,
    avatarInitials: 'AK',
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    email: 'deactivated@babawatoto.org',
    displayName: 'Hussein M. Mwamba (Former Staff)',
    phoneNumber: '+255 754 777 007',
    preferredLanguage: 'en',
    departmentId: 'dept-prj',
    departmentCode: 'PRJ',
    departmentName: 'Projects & Programs',
    role: ROLES.PROJECT_COORDINATOR,
    roles: [ROLES.PROJECT_COORDINATOR],
    permissions: ROLE_PERMISSIONS[ROLES.PROJECT_COORDINATOR],
    isActive: false, // Testing negative deactivation flow
    avatarInitials: 'HM',
  },
  {
    id: '00000000-0000-0000-0000-000000000008',
    email: 'secadmin@babawatoto.org',
    displayName: 'Amani Bakari (MFA Enrolled)',
    phoneNumber: '+255 754 111 008',
    preferredLanguage: 'en',
    departmentId: 'dept-admin',
    departmentCode: 'ADMIN',
    departmentName: 'IT & System Administration',
    role: ROLES.SYSTEM_ADMIN,
    roles: [ROLES.SYSTEM_ADMIN],
    permissions: ROLE_PERMISSIONS[ROLES.SYSTEM_ADMIN],
    isActive: true,
    avatarInitials: 'AB',
    isMfaEnrolled: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000009',
    email: 'procurement@babawatoto.org',
    displayName: 'Bakari H. Mhando',
    phoneNumber: '+255 754 888 009',
    preferredLanguage: 'en',
    departmentId: 'dept-proc',
    departmentCode: 'PROC',
    departmentName: 'Procurement & Logistics',
    role: ROLES.PROCUREMENT_OFFICER,
    roles: [ROLES.PROCUREMENT_OFFICER],
    permissions: ROLE_PERMISSIONS[ROLES.PROCUREMENT_OFFICER],
    isActive: true,
    avatarInitials: 'BM',
  },
];
