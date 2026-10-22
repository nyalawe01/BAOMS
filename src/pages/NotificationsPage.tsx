import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  Check,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationItem,
} from '@/services/notificationsService';

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');

  const loadNotifs = () => {
    setNotifications(getNotifications());
  };

  useEffect(() => {
    loadNotifs();
    const handleUpdate = () => loadNotifs();
    window.addEventListener('baoms_notifications_updated', handleUpdate);
    return () => window.removeEventListener('baoms_notifications_updated', handleUpdate);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifs = notifications.filter((n) => {
    if (filterType === 'unread') return !n.read;
    if (filterType !== 'all') return n.type === filterType;
    return true;
  });

  const handleMarkAll = () => {
    markAllNotificationsAsRead();
    loadNotifs();
  };

  const handleClickItem = (n: NotificationItem) => {
    markNotificationAsRead(n.id);
    loadNotifs();
    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Notifications & Action Alerts"
        subtitle="Operational tasks, urgent workforce deadlines, pending supervisory reviews, and administrative reminders."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Notifications' },
        ]}
        actions={
          unreadCount > 0 ? (
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleMarkAll}>
                <Check className="h-4 w-4 mr-1.5" />
                Mark All as Read ({unreadCount})
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        {[
          { id: 'all', label: `All Alerts (${notifications.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'hr', label: 'Human Resources' },
          { id: 'finance', label: 'Finance & Vouchers' },
          { id: 'project', label: 'Projects & Programs' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`py-1.5 px-3 rounded-md flex items-center gap-2 transition-colors ${
              filterType === tab.id
                ? 'bg-slate-200 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden divide-y divide-surface-border">
        {filteredNotifs.length === 0 ? (
          <div className="py-16 text-center text-charcoal-muted text-xs">
            <Bell className="h-8 w-8 mx-auto text-charcoal-300 mb-2" />
            No notifications matching this filter view.
          </div>
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClickItem(n)}
              className={`p-4 flex items-start justify-between gap-4 cursor-pointer transition-colors ${
                !n.read ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {n.type === 'hr' ? (
                    <Users className="h-4 w-4 text-charcoal-700" />
                  ) : n.type === 'finance' ? (
                    <Clock className="h-4 w-4 text-charcoal-700" />
                  ) : (
                    <FileText className="h-4 w-4 text-charcoal-700" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs ${!n.read ? 'font-bold text-charcoal-900' : 'font-medium text-charcoal-800'}`}>
                      {n.title}
                    </h4>
                    {!n.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-charcoal-600 mt-0.5 max-w-2xl">{n.message}</p>
                  <span className="text-[11px] font-mono text-charcoal-muted mt-1 block">{n.time}</span>
                </div>
              </div>

              {n.link && (
                <div className="flex items-center gap-1 text-xs text-charcoal-700 font-semibold shrink-0">
                  <span>View</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
