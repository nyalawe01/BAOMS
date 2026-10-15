/**
 * BAOMS Domain and System Types
 * Babawatoto Organization Management System
 */

export type UserRole =
  | 'system_admin'
  | 'executive_director'
  | 'finance_officer'
  | 'project_manager'
  | 'project_coordinator'
  | 'hr_administrator';

export type SupportedLanguage = 'en' | 'sw';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  language: SupportedLanguage;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StatusVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export type WorkflowState =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'archived';

export interface NavItem {
  id: string;
  labelKey: string;
  href: string;
  iconName: string;
  roles?: UserRole[];
  badge?: string;
}
