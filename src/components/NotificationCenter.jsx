import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Bell,
  CheckCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Megaphone,
  UserPlus,
  Info
} from 'lucide-react';

const MAX_VISIBLE = 20;

const TYPE_ICON = {
  expense_pending: Clock,
  expense_approved: CheckCircle2,
  expense_rejected: XCircle,
  request_pending: Clock,
  request_approved: CheckCircle2,
  request_rejected: XCircle,
  announcement: Megaphone,
  beneficiary_pending: UserPlus,
  general: Info
};

const TYPE_ICON_CLASS = {
  expense_pending: 'text-amber-500',
  expense_approved: 'text-emerald-500',
  expense_rejected: 'text-rose-500',
  request_pending: 'text-amber-500',
  request_approved: 'text-emerald-500',
  request_rejected: 'text-rose-500',
  announcement: 'text-indigo-500',
  beneficiary_pending: 'text-indigo-500',
  general: 'text-slate-400'
};

// Simple, dependency-free "time ago" formatting.
function formatTimeAgo(createdAt) {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export default function NotificationCenter({ onNavigate }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useProject();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const visibleNotifications = notifications.slice(0, MAX_VISIBLE);

  const handleSelect = (notification) => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
    if (notification.link) {
      onNavigate?.(notification.link);
    }
    setOpen(false);
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    markAllNotificationsRead();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative inline-flex justify-center items-center size-11 text-sm font-semibold rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-800 dark:text-white shadow-2xs hover:bg-gray-50 dark:hover:bg-neutral-700 focus:outline-hidden focus:bg-gray-50 dark:focus:bg-neutral-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        title="Notifications"
      >
        <Bell className="shrink-0 size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 inset-e-0 inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-1/2 bg-black text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Overlay Backdrop to close */}
          <div
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
          ></div>

          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-slate-200 z-30 animate-fadeIn overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider">Notifications</p>
                <p className="text-base font-semibold text-slate-700 mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <CheckCheck size={13} />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {visibleNotifications.length === 0 ? (
                <div className="px-4 py-10 flex flex-col items-center justify-center text-center gap-2">
                  <Bell size={22} className="text-slate-300" />
                  <p className="text-sm text-slate-400 font-medium">No notifications yet</p>
                </div>
              ) : (
                visibleNotifications.map((notification) => {
                  const Icon = TYPE_ICON[notification.type] || Info;
                  const iconClass = TYPE_ICON_CLASS[notification.type] || 'text-slate-400';
                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleSelect(notification)}
                      className={`w-full flex items-start gap-2.5 px-4 py-3 border-b border-slate-50 last:border-b-0 text-left transition-colors hover:bg-slate-50 ${
                        !notification.read ? 'bg-indigo-50/60' : 'bg-white'
                      }`}
                    >
                      <Icon size={15} className={`mt-0.5 shrink-0 ${iconClass}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm leading-snug ${!notification.read ? 'text-slate-800 font-semibold' : 'text-slate-600 font-medium'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5"></span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
