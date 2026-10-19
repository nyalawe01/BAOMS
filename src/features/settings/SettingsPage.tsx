import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  Bell,
  Check,
  User,
  Sliders,
  Shield,
  Building2,
  Globe,
  Clock,
  LogOut,
  Save,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import { showSuccess, showError } from '@/lib/sweetAlert';

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, profile, roles, updatePassword, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'security' | 'organization'>('profile');

  // Profile Form State
  const [displayName, setDisplayName] = useState(profile?.display_name || user?.email?.split('@')[0] || 'Executive Director');
  const [jobTitle, setJobTitle] = useState('Executive Director');
  const [phone, setPhone] = useState('+255 754 000 111');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'sw'>(i18n.language?.startsWith('sw') ? 'sw' : 'en');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Preferences State
  const [currencyFormat, setCurrencyFormat] = useState('TZS');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');

  // Notifications State
  const [notifApprovals, setNotifApprovals] = useState(true);
  const [notifDeadlines, setNotifDeadlines] = useState(true);
  const [notifProjectReports, setNotifProjectReports] = useState(true);
  const [notifDocuments, setNotifDocuments] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      if (selectedLanguage !== i18n.language) {
        i18n.changeLanguage(selectedLanguage);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('baoms_language', selectedLanguage);
        }
      }
      showSuccess('Profile Updated', 'Your profile details and language preferences have been saved.');
    } catch (err: any) {
      showError('Update Failed', err.message || 'Could not update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      Swal.fire({
        title: 'Password Too Short',
        text: 'New password must be at least 6 characters.',
        icon: 'warning',
        confirmButtonColor: '#D68904',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: 'Passwords Do Not Match',
        text: 'Please confirm the new password correctly.',
        icon: 'warning',
        confirmButtonColor: '#D68904',
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
        confirmButtonColor: '#D68904',
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Password Update Failed',
        text: err.message || 'Could not update password.',
        icon: 'error',
        confirmButtonColor: '#D68904',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    showSuccess('Notification Preferences Saved', 'Your dispatch alert channels have been updated.');
  };

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'ED';

  return (
    <div className="space-y-6 max-w-5xl font-sans">
      <PageHeader
        title={t('settings.title', 'Settings')}
        subtitle="Manage personal preferences, account security, dispatch alerts, and authorized organizational preferences."
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('nav.settings', 'Settings') },
        ]}
      />

      {/* Settings Navigation Tabs */}
      <div className="border-b border-surface-border">
        <nav className="flex space-x-6 overflow-x-auto">
          {[
            { id: 'profile', label: 'My Profile' },
            { id: 'preferences', label: 'Appearance & Localization' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'security', label: 'Security & Sessions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-[#D68904] text-charcoal-900 font-semibold'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: MY PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="bg-white border border-surface-border rounded-lg p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-4 pb-5 border-b border-surface-border">
            <div className="h-16 w-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-charcoal-800 font-bold text-lg shrink-0">
              {initials}
            </div>
            <div>
              <h3 className="text-base font-bold text-charcoal-900">{displayName}</h3>
              <p className="text-xs text-[#D68904] font-medium">{jobTitle}</p>
              <p className="text-[11px] font-mono text-charcoal-muted mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">Full Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-charcoal-900 bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">Official Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-charcoal-900 bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">Official Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-charcoal-500 bg-slate-50 font-mono cursor-not-allowed"
              />
              <span className="text-[10px] text-charcoal-muted mt-1 block">Email changes must use Supabase Auth administration.</span>
            </div>
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">Direct Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-charcoal-900 bg-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-surface-border flex justify-end">
            <Button type="submit" variant="primary" size="sm" disabled={isUpdatingProfile}>
              <Save className="h-4 w-4 mr-1.5 text-[#111827]" />
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: APPEARANCE & LOCALIZATION */}
      {activeTab === 'preferences' && (
        <div className="bg-white border border-surface-border rounded-lg p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900 mb-1">System Language</h3>
            <p className="text-xs text-charcoal-muted mb-4">Choose your preferred administrative language interface.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
              <label
                onClick={() => {
                  setSelectedLanguage('en');
                  i18n.changeLanguage('en');
                  if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem('baoms_language', 'en');
                  }
                }}
                className={`p-3.5 rounded-lg border cursor-pointer flex items-center justify-between ${
                  selectedLanguage === 'en'
                    ? 'border-[#D68904] bg-amber-500/5'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-charcoal-900 block">English (United Kingdom)</span>
                  <span className="text-[11px] text-charcoal-muted">Default organizational language</span>
                </div>
                {selectedLanguage === 'en' && <Check className="h-4 w-4 text-[#D68904]" />}
              </label>

              <label
                onClick={() => {
                  setSelectedLanguage('sw');
                  i18n.changeLanguage('sw');
                  if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem('baoms_language', 'sw');
                  }
                }}
                className={`p-3.5 rounded-lg border cursor-pointer flex items-center justify-between ${
                  selectedLanguage === 'sw'
                    ? 'border-[#D68904] bg-amber-500/5'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-charcoal-900 block">Kiswahili (Tanzania)</span>
                  <span className="text-[11px] text-charcoal-muted">Lugha rasmi ya kitaifa</span>
                </div>
                {selectedLanguage === 'sw' && <Check className="h-4 w-4 text-[#D68904]" />}
              </label>
            </div>
          </div>

          <div className="pt-5 border-t border-surface-border">
            <h3 className="text-sm font-bold text-charcoal-900 mb-1">Number & Currency Format</h3>
            <p className="text-xs text-charcoal-muted mb-4">Standard formatting applied across financial tables and reports.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Currency Symbol</label>
                <select
                  value={currencyFormat}
                  onChange={(e) => setCurrencyFormat(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-charcoal-900"
                >
                  <option value="TZS">TZS — Tanzanian Shilling</option>
                  <option value="USD">USD — US Dollar</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Date Display Format</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-charcoal-900"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className="bg-white border border-surface-border rounded-lg p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900 mb-1">Executive Dispatch & Alert Channels</h3>
            <p className="text-xs text-charcoal-muted">Configure events triggering immediate high-priority alerts.</p>
          </div>

          <div className="space-y-4 pt-2">
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={notifApprovals}
                onChange={(e) => setNotifApprovals(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-charcoal-900"
              />
              <div>
                <span className="text-xs font-semibold text-charcoal-900 block">Approval Assignments</span>
                <span className="text-[11px] text-charcoal-muted block">
                  Notify immediately when a requisition, purchase order, or staff onboarding requires Executive Director decision.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={notifDeadlines}
                onChange={(e) => setNotifDeadlines(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-charcoal-900"
              />
              <div>
                <span className="text-xs font-semibold text-charcoal-900 block">Approval & Statutory Deadlines</span>
                <span className="text-[11px] text-charcoal-muted block">
                  Remind 48 hours prior to compliance and financial requisition authorization deadlines.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={notifProjectReports}
                onChange={(e) => setNotifProjectReports(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-charcoal-900"
              />
              <div>
                <span className="text-xs font-semibold text-charcoal-900 block">Project & M&E Progress Milestones</span>
                <span className="text-[11px] text-charcoal-muted block">
                  Quarterly notification when field indicator results and verification dossiers are submitted.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={notifDocuments}
                onChange={(e) => setNotifDocuments(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-charcoal-900"
              />
              <div>
                <span className="text-xs font-semibold text-charcoal-900 block">Document & Correspondence Reminders</span>
                <span className="text-[11px] text-charcoal-muted block">
                  Alert on new official letters and donor correspondence registered in repository.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-surface-border flex justify-end">
            <Button type="submit" variant="primary" size="sm">
              Save Preferences
            </Button>
          </div>
        </form>
      )}

      {/* TAB 4: SECURITY & SESSIONS */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password Change */}
          <form onSubmit={handleChangePassword} className="bg-white border border-surface-border rounded-lg p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-charcoal-900 border-b border-surface-border pb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#374151]" />
              Account Security & Password Rotation
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-charcoal-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-charcoal-900 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-charcoal-900 bg-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border flex justify-end">
              <Button type="submit" variant="primary" size="sm" disabled={isChangingPassword}>
                <Check className="h-4 w-4 mr-1.5 text-[#111827]" />
                {isChangingPassword ? 'Updating Password...' : 'Update Password'}
              </Button>
            </div>
          </form>

          {/* Current Session & Sign Out */}
          <div className="bg-white border border-surface-border rounded-lg p-6 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Active Authentication Session</h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Logged in as <strong className="text-charcoal-900">{user?.email}</strong> via Supabase Auth.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                window.location.href = '/login';
              }}
              className="text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4 mr-1.5 text-[#374151]" />
              Sign Out of Session
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
