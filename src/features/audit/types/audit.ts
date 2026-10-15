/**
 * BAOMS Audit Log Domain Types
 * Babawatoto Organization Management System
 */

export type AuditActionCategory =
  | 'AUTH'
  | 'HR'
  | 'FINANCE'
  | 'DOCUMENTS'
  | 'PROJECTS'
  | 'CORRESPONDENCE'
  | 'SYSTEM';

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  category: AuditActionCategory;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogFilters {
  category?: AuditActionCategory | 'all';
  search?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}
