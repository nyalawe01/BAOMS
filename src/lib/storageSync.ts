/**
 * BAOMS Persistent Storage Synchronization Utility
 * Babawatoto Organization Management System
 * 
 * Provides robust localStorage synchronization for offline and demo environments,
 * ensuring newly submitted forms, records, and mutations persist across page refreshes
 * and browser restarts, while providing a clean reset mechanism for automated testing.
 */

const CURRENT_STORAGE_CLEAN_VERSION = 'baoms_storage_clean_v1';

if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const isCleaned = localStorage.getItem(CURRENT_STORAGE_CLEAN_VERSION);
    if (!isCleaned) {
      // Purge all old mock domain records while preserving user credentials & session
      const keysToClear = [
        'baoms_hr_staff',
        'baoms_hr_leave_requests',
        'baoms_hr_leave_balances',
        'baoms_hr_checklists',
        'baoms_hr_staff_documents',
        'baoms_finance_budgets',
        'baoms_finance_requests',
        'baoms_finance_transactions',
        'baoms_documents',
        'baoms_projects',
        'baoms_project_activities',
        'baoms_project_tasks',
        'baoms_project_reports',
        'baoms_project_budgets',
        'baoms_correspondence',
        'baoms_meetings',
        'baoms_meeting_attendees',
        'baoms_meeting_decisions',
        'baoms_meeting_actions',
        'baoms_procurement_vendors',
        'baoms_procurement_pos',
        'baoms_procurement_inventory',
        'baoms_notifications',
        'baoms_audit_logs',
        'baoms_staff_registration_draft',
        'baoms_project_registration_draft',
      ];
      keysToClear.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(CURRENT_STORAGE_CLEAN_VERSION, 'true');
    }
  } catch (e) {
    console.warn('[storageSync] Automatic cleanup check failed:', e);
  }
}

export function getPersistentItem<T>(key: string, defaultFactory: () => T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultFactory();
  }

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.warn(`[storageSync] Failed reading key "${key}" from localStorage:`, err);
  }

  const defaultValue = defaultFactory();
  try {
    localStorage.setItem(key, JSON.stringify(defaultValue));
  } catch (err) {
    console.warn(`[storageSync] Failed writing default for key "${key}":`, err);
  }
  return defaultValue;
}

export function setPersistentItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[storageSync] Failed saving key "${key}" to localStorage:`, err);
  }
}

export function removePersistentItem(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[storageSync] Failed removing key "${key}":`, err);
  }
}

/**
 * Resets all domain persistence keys back to empty or factory states.
 */
export function clearAllDomainStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const domainKeys = [
    'baoms_hr_staff',
    'baoms_hr_leave_requests',
    'baoms_hr_leave_balances',
    'baoms_hr_checklists',
    'baoms_hr_staff_documents',
    'baoms_finance_budgets',
    'baoms_finance_requests',
    'baoms_finance_transactions',
    'baoms_documents',
    'baoms_document_categories',
    'baoms_projects',
    'baoms_project_activities',
    'baoms_project_tasks',
    'baoms_project_reports',
    'baoms_correspondence',
    'baoms_meetings',
    'baoms_meeting_attendees',
    'baoms_meeting_decisions',
    'baoms_meeting_actions',
    'baoms_staff_users',
    'baoms_audit_logs',
  ];

  domainKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
}
