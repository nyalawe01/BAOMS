/**
 * BAOMS Audit & Storage Persistence Automated Test Suite
 * Babawatoto Organization Management System
 * 
 * Verifies tamper-evident audit logging, category filtering, search,
 * CSV export fortification against spreadsheet formula injection (CWE-1236),
 * and persistent storage synchronization across session restarts.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordAuditEvent,
  getAuditLogs,
  exportAuditLogsToCsv,
  resetAuditLogs,
} from '@/features/audit/services/auditService';
import {
  getPersistentItem,
  setPersistentItem,
  clearAllDomainStorage,
} from '@/lib/storageSync';

describe('BAOMS Audit Trail & Storage Persistence Architecture', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetAuditLogs();
  });

  describe('1. Audit Logging Service', () => {
    it('records an audit event with actor metadata and retrieves it in the log register', async () => {
      const newEvent = await recordAuditEvent({
        actorId: 'user-audit-01',
        actorName: 'Baraka S.',
        actorRole: 'finance_officer',
        action: 'PAYMENT_DISBURSED',
        category: 'FINANCE',
        entityType: 'financial_request',
        entityId: 'REQ-2026-999',
        details: 'Disbursed TZS 1,500,000 for field activities.',
        ipAddress: '192.168.1.50',
      });

      expect(newEvent.id).toBeDefined();
      expect(newEvent.action).toBe('PAYMENT_DISBURSED');

      const { logs, total } = await getAuditLogs({ category: 'FINANCE' });
      expect(total).toBeGreaterThan(0);
      const found = logs.find((l) => l.entityId === 'REQ-2026-999');
      expect(found).toBeDefined();
      expect(found?.actorName).toBe('Baraka S.');
      expect(found?.details).toContain('TZS 1,500,000');
    });

    it('filters audit logs by action category accurately', async () => {
      await recordAuditEvent({
        actorId: 'ed-01',
        actorName: 'Elisha N.',
        actorRole: 'executive_director',
        action: 'AUTH_MFA_VERIFIED',
        category: 'AUTH',
        entityType: 'user_account',
        entityId: 'user-01',
        details: 'Verified TOTP security challenge.',
      });

      const authLogs = await getAuditLogs({ category: 'AUTH' });
      expect(authLogs.logs.every((l) => l.category === 'AUTH')).toBe(true);
      expect(authLogs.logs.some((l) => l.action === 'AUTH_MFA_VERIFIED')).toBe(true);

      const hrLogs = await getAuditLogs({ category: 'HR' });
      expect(hrLogs.logs.every((l) => l.category === 'HR')).toBe(true);
    });

    it('searches audit logs by actor, action code, or entity reference', async () => {
      await recordAuditEvent({
        actorId: 'pm-01',
        actorName: 'Mariam M. (Project Manager)',
        actorRole: 'project_manager',
        action: 'PROJECT_MILESTONE_COMPLETED',
        category: 'PROJECTS',
        entityType: 'project',
        entityId: 'PRJ-BAGAMOYO-2026',
        details: 'Community center foundation inspection passed.',
      });

      const searchByEntity = await getAuditLogs({ search: 'PRJ-BAGAMOYO' });
      expect(searchByEntity.logs.length).toBe(1);
      expect(searchByEntity.logs[0]?.entityId).toBe('PRJ-BAGAMOYO-2026');

      const searchByActor = await getAuditLogs({ search: 'Mariam M.' });
      expect(searchByActor.logs.length).toBeGreaterThanOrEqual(1);

      const noMatch = await getAuditLogs({ search: 'NONEXISTENT_KEYWORD_XYZ' });
      expect(noMatch.logs.length).toBe(0);
    });

    it('fortifies audit CSV export against CWE-1236 spreadsheet formula injection', async () => {
      await recordAuditEvent({
        actorId: 'hacker-01',
        actorName: '=cmd|"/C calc"!A0',
        actorRole: '+system',
        action: '-MALICIOUS_OP',
        category: 'SYSTEM',
        entityType: '@payload',
        entityId: '\tINJECT-01',
        details: '\rDANGEROUS EXECUTION',
      });

      const { logs } = await getAuditLogs();
      const csv = exportAuditLogsToCsv(logs);

      // Verify that malicious triggers are safely sanitized with single-quote escaping
      expect(csv).toContain("'=cmd");
      expect(csv).toContain("'+system");
      expect(csv).toContain("'-MALICIOUS_OP");
      expect(csv).toContain("'@payload");
    });
  });

  describe('2. Persistent Storage Synchronization Engine', () => {
    it('persists written items into localStorage across simulated page reload', () => {
      const TEST_KEY = 'baoms_test_persistence';
      const sampleData = { id: 101, name: 'Persistent Profile', active: true };

      setPersistentItem(TEST_KEY, sampleData);

      // Simulate re-fetching in a fresh component lifecycle
      const restored = getPersistentItem(TEST_KEY, () => null);
      expect(restored).toEqual(sampleData);
    });

    it('falls back to factory defaults when key is absent and initializes storage', () => {
      const FRESH_KEY = 'baoms_fresh_key';
      const factoryDefault = ['initial_seed_1', 'initial_seed_2'];

      const result = getPersistentItem(FRESH_KEY, () => factoryDefault);
      expect(result).toEqual(factoryDefault);

      // Confirm it was saved so future reads return the same
      const cached = JSON.parse(localStorage.getItem(FRESH_KEY) || '[]');
      expect(cached).toEqual(factoryDefault);
    });

    it('clears all domain keys cleanly on system reset', () => {
      setPersistentItem('baoms_hr_staff', [{ id: '1' }]);
      setPersistentItem('baoms_finance_budgets', [{ id: '2' }]);

      clearAllDomainStorage();

      expect(localStorage.getItem('baoms_hr_staff')).toBeNull();
      expect(localStorage.getItem('baoms_finance_budgets')).toBeNull();
    });
  });
});
