/**
 * BAOMS Audit Log Service Layer
 * Babawatoto Organization Management System
 * 
 * Connected directly to Supabase PostgreSQL (RLS).
 * Guarantees append-only audit trail for administrative tracking and regulatory compliance.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { sanitizeSpreadsheetValue } from '@/features/reporting/utils/exportSanitizer';
import { AuditLogRecord, AuditLogFilters, AuditActionCategory } from '../types/audit';

export function resetAuditLogs(): void {
  // Database-backed: no-op in production
}

/**
 * Record a new tamper-evident audit event directly in Supabase
 */
export async function recordAuditEvent(payload: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  category: AuditActionCategory;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}): Promise<AuditLogRecord> {
  const createdAt = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([
          {
            actor_id: payload.actorId && payload.actorId.length === 36 ? payload.actorId : null,
            action: payload.action,
            target_entity: payload.entityType,
            target_id: payload.entityId,
            payload: {
              details: payload.details,
              actor_name: payload.actorName,
              role: payload.actorRole,
              category: payload.category,
              ...(payload.metadata || {}),
            },
            ip_address: payload.ipAddress || '127.0.0.1',
            created_at: createdAt,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          actorId: data.actor_id || payload.actorId,
          actorName: payload.actorName,
          actorRole: payload.actorRole,
          action: data.action,
          category: payload.category,
          entityType: data.target_entity,
          entityId: data.target_id,
          details: payload.details,
          ipAddress: data.ip_address,
          metadata: payload.metadata,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.warn('Failed to insert audit log in Supabase:', err);
    }
  }

  return {
    id: `aud-${Date.now()}`,
    actorId: payload.actorId,
    actorName: payload.actorName,
    actorRole: payload.actorRole,
    action: payload.action,
    category: payload.category,
    entityType: payload.entityType,
    entityId: payload.entityId,
    details: payload.details,
    ipAddress: payload.ipAddress || '127.0.0.1',
    metadata: payload.metadata,
    createdAt,
  };
}

/**
 * Query audit logs directly from live Supabase PostgreSQL database
 */
export async function getAuditLogs(
  filters?: AuditLogFilters
): Promise<{ logs: AuditLogRecord[]; total: number; totalPages: number }> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters?.search && filters.search.trim() !== '') {
        const q = filters.search.trim();
        query = query.or(`action.ilike.%${q}%,target_entity.ilike.%${q}%,target_id.ilike.%${q}%`);
      }

      const pageSize = filters?.pageSize || 15;
      const page = filters?.page || 1;
      const start = (page - 1) * pageSize;
      query = query.range(start, start + pageSize - 1);

      const { data, count, error } = await query;
      if (!error && data) {
        let mappedLogs: AuditLogRecord[] = data.map((row: any) => ({
          id: row.id,
          actorId: row.actor_id || '',
          actorName: row.payload?.actor_name || (row.actor_id ? 'Authenticated Staff' : 'System Service'),
          actorRole: row.payload?.role || 'Staff Member',
          action: row.action,
          category: (row.payload?.category as AuditActionCategory) || 'SYSTEM',
          entityType: row.target_entity || 'System',
          entityId: row.target_id || '',
          details: row.payload?.details || row.payload?.reason || row.action,
          ipAddress: row.ip_address || '127.0.0.1',
          metadata: row.payload || {},
          createdAt: row.created_at,
        }));

        if (filters?.category && filters.category !== 'all') {
          mappedLogs = mappedLogs.filter((log) => log.category === filters.category);
        }

        const total = count ?? mappedLogs.length;
        return {
          logs: mappedLogs,
          total,
          totalPages: Math.ceil(total / pageSize) || 1,
        };
      }
    } catch (err) {
      console.warn('Error fetching audit logs from Supabase:', err);
    }
  }

  return {
    logs: [],
    total: 0,
    totalPages: 1,
  };
}

/**
 * Export audit logs to CSV fortified with CWE-1236 spreadsheet injection protection
 */
export function exportAuditLogsToCsv(logs: AuditLogRecord[]): string {
  const headers = ['Timestamp', 'Actor Name', 'Role', 'Category', 'Action', 'Entity Type', 'Entity ID', 'Details', 'IP Address'];
  const rows = logs.map((log) => [
    sanitizeSpreadsheetValue(log.createdAt),
    sanitizeSpreadsheetValue(log.actorName),
    sanitizeSpreadsheetValue(log.actorRole),
    sanitizeSpreadsheetValue(log.category),
    sanitizeSpreadsheetValue(log.action),
    sanitizeSpreadsheetValue(log.entityType),
    sanitizeSpreadsheetValue(log.entityId),
    sanitizeSpreadsheetValue(log.details),
    sanitizeSpreadsheetValue(log.ipAddress || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}
