/**
 * BAOMS: Institutional Notification Engine
 * Babawatoto Organization Management System
 */

import { getPersistentItem, setPersistentItem } from '@/lib/storageSync';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  type: 'hr' | 'finance' | 'document' | 'project';
  read: boolean;
  targetRole?: 'hr_administrator' | 'finance_officer' | 'system_admin' | 'all';
  link?: string;
  metadata?: {
    staffId?: string;
    action?: string;
    requisitionId?: string;
  };
}

const NOTIFICATIONS_STORAGE_KEY = 'baoms_notifications';
const EVENT_NAME = 'baoms_notifications_updated';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

let cachedNotifications: NotificationItem[] = getPersistentItem(
  NOTIFICATIONS_STORAGE_KEY,
  () => [...INITIAL_NOTIFICATIONS]
);

function broadcast() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: cachedNotifications }));
  }
}

export function getNotifications(): NotificationItem[] {
  return [...cachedNotifications];
}

export function createNotification(
  params: Omit<NotificationItem, 'id' | 'time' | 'timestamp' | 'read'>
): NotificationItem {
  const newNotif: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: params.title,
    message: params.message,
    time: 'Just now',
    timestamp: Date.now(),
    type: params.type,
    read: false,
    targetRole: params.targetRole || 'all',
    link: params.link,
    metadata: params.metadata,
  };

  cachedNotifications = [newNotif, ...cachedNotifications];
  setPersistentItem(NOTIFICATIONS_STORAGE_KEY, cachedNotifications);
  broadcast();
  return newNotif;
}

export const addNotification = createNotification;

export function markAsRead(id: string): void {
  cachedNotifications = cachedNotifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  setPersistentItem(NOTIFICATIONS_STORAGE_KEY, cachedNotifications);
  broadcast();
}

export function markAllAsRead(): void {
  cachedNotifications = cachedNotifications.map((n) => ({ ...n, read: true }));
  setPersistentItem(NOTIFICATIONS_STORAGE_KEY, cachedNotifications);
  broadcast();
}

export function subscribeToNotifications(
  listener: (items: NotificationItem[]) => void
): () => void {
  const handler = () => listener([...cachedNotifications]);
  if (typeof window !== 'undefined') {
    window.addEventListener(EVENT_NAME, handler);
  }
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(EVENT_NAME, handler);
    }
  };
}
