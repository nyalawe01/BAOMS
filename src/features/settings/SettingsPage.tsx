import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  Bell,
  Check,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { updatePassword } = useAuth();

  const [notificationsEmail, setNotificationsEmail] = useState(true);
  const [notificationsApprovals, setNotificationsApprovals] = useState(true);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      Swal.fire({
        title: 'Password Too Short',
        text: 'New password must be at least 6 characters.',
        icon: 'warning',
        confirmButtonColor: '#005A36',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: 'Passwords Do Not Match',
        text: 'Please confirm the new password correctly.',
        icon: 'warning',
        confirmButtonColor: '#005A36',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await updatePassword(newPassword);
      if (res.error) {
        throw new Error(res.error);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Swal.fire({
        title: 'Password Changed Successfully',
        text: 'Your credentials have been securely updated.',
        icon: 'success',
        confirmButtonColor: '#005A36',
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Password Update Failed',
        text: err.message || 'Could not update password.',
        icon: 'error',
        confirmButtonColor: '#005A36',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl font-sans">
      <PageHeader
        title={t('settings.title', 'System Settings & Preferences')}
        subtitle={t(
          'settings.subtitle',
          'Configure workspace behavior, notification channels, and account security controls.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('nav.settings', 'Settings') },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security & Password Rotation */}
        <form onSubmit={handleChangePassword} className="bg-white border border-surface-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-bold text-charcoal-900 border-b border-surface-border pb-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-forest-700" />
            Account Security & Password Rotation
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-600 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-600 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-600 bg-white"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-surface-border flex justify-end">
            <Button type="submit" variant="primary" size="sm" disabled={isChangingPassword}>
              <Check className="h-4 w-4 mr-1.5" />
              {isChangingPassword ? 'Updating Password...' : 'Update Password'}
            </Button>
          </div>
        </form>

        {/* Notification Preferences */}
        <div className="bg-white border border-surface-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-bold text-charcoal-900 border-b border-surface-border pb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-forest-700" />
            Notifications & Telemetry
          </h3>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEmail}
                onChange={(e) => setNotificationsEmail(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-charcoal-900 focus:ring-slate-400"
              />
              <div>
                <span className="text-xs font-semibold text-charcoal-900 block">
                  Email Digest Notifications
                </span>
                <span className="text-[11px] text-charcoal-muted block">
                  Receive email digests on urgent requisitions and audit alerts.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsApprovals}
                onChange={(e) => setNotificationsApprovals(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-charcoal-900 focus:ring-slate-400"
              />
              <div>
                <span className="text-xs font-semibold text-charcoal-900 block">
                  Approval Queue Reminders
                </span>
                <span className="text-[11px] text-charcoal-muted block">
                  Instant in-app alerts when pending documents require sign-off.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
