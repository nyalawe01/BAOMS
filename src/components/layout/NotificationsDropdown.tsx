import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, FileText, Wallet, Calendar, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/useAuth';
import {
  NotificationItem,
  getNotifications,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
} from '@/services/notificationsService';

export const NotificationsDropdown: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getNotifications());

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((updated) => {
      setNotifications(updated);
    });
    return unsubscribe;
  }, []);

  const visibleNotifications = notifications.filter((n) => {
    if (n.type === 'hr') return hasPermission('hr.view') || isAdmin();
    if (n.type === 'finance') return hasPermission('finance.view') || isAdmin();
    if (n.type === 'document') return hasPermission('documents.view') || isAdmin();
    if (n.type === 'project') return hasPermission('projects.view') || isAdmin();
    return true;
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = visibleNotifications.filter((n) => !n.read).length;
  const hasAlertOrEmergency = visibleNotifications.some(
    (n) => !n.read && (n.title?.toLowerCase().includes('alert') || n.title?.toLowerCase().includes('urgent'))
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.link) {
      setIsOpen(false);
      navigate(item.link);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'hr':
        return <UserCheck className="h-4 w-4 text-[#D68904]" />;
      case 'finance':
        return <Wallet className="h-4 w-4 text-emerald-700" />;
      case 'document':
        return <FileText className="h-4 w-4 text-slate-700" />;
      case 'project':
        return <Calendar className="h-4 w-4 text-slate-700" />;
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex justify-center items-center size-11 text-sm font-semibold rounded-lg bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="shrink-0 size-5" />
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute top-0 inset-e-0 inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-1/2 text-white',
              hasAlertOrEmergency ? 'bg-red-500' : 'bg-black'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-surface-border bg-white z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-3 bg-surface-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                {t('notifications.title', 'Notifications')}
              </span>
              {unreadCount > 0 && (
                <span
                  className={cn(
                    'inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium text-white',
                    hasAlertOrEmergency ? 'bg-red-500' : 'bg-black'
                  )}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-[#D68904] hover:text-[#b86e03] flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                <span>{t('notifications.markAllRead', 'Mark all read')}</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
            {visibleNotifications.length > 0 ? (
              visibleNotifications.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3 p-3.5 transition-colors hover:bg-surface-hover cursor-pointer',
                    !item.read && 'bg-amber-50/40'
                  )}
                  onClick={() => handleNotificationClick(item)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white border border-surface-border">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs font-semibold text-charcoal truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-charcoal-light flex items-center gap-0.5 shrink-0">
                        <Clock className="h-2.5 w-2.5" />
                        {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-muted leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                  </div>
                  {!item.read && (
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#D68904] shrink-0" />
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-charcoal-muted">
                No notifications at this time.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
