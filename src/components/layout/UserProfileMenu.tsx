import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useToast } from '@/lib/ToastContext';
import { useAuth } from '@/features/auth/useAuth';

export const UserProfileMenu: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, profile, roles, department, signOut } = useAuth();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Staff Member';
  const roleDisplay = roles.length > 0 ? roles[0] : 'Authorized User';
  const departmentDisplay = department?.code || '';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'ST';

  const menuItems: DropdownMenuItem[] = [
    {
      id: 'profile',
      label: t('nav.profile', 'User Profile'),
      icon: User,
      onClick: () => {
        showToast({
          title: displayName,
          message: `Department: ${department?.name || 'Assigned Department'} • Role: ${roleDisplay}`,
          variant: 'info',
        });
      },
    },
    {
      id: 'settings',
      label: t('nav.settings', 'System Settings'),
      icon: Settings,
      onClick: () => {
        showToast({
          title: 'System Settings',
          message: 'System settings are accessible to System Administrators under /users and /foundation.',
          variant: 'info',
        });
      },
    },
    {
      id: 'signout',
      label: t('nav.signOut', 'Sign Out'),
      icon: LogOut,
      dividerAbove: true,
      isDestructive: true,
      onClick: () => {
        setShowSignOutDialog(true);
      },
    },
  ];

  const handleConfirmSignOut = async () => {
    setShowSignOutDialog(false);
    await signOut();
    navigate('/login');
    showToast({
      title: 'Signed Out',
      message: 'Your active session has been securely closed.',
      variant: 'info',
    });
  };

  return (
    <>
      <DropdownMenu
        menuWidth="w-60"
        trigger={
          <button
            type="button"
            aria-label="Open user menu"
            className="flex items-center gap-2.5 rounded-md p-1.5 hover:bg-surface-muted transition-colors text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 font-semibold text-xs shrink-0">
              {initials}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-charcoal leading-none truncate max-w-[140px]">
                {displayName}
              </span>
              <span className="text-[10px] text-[#D68904] font-medium mt-0.5 truncate max-w-[140px]">
                {roleDisplay} {departmentDisplay ? `(${departmentDisplay})` : ''}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-charcoal-light hidden sm:block" />
          </button>
        }
        items={menuItems}
      />

      <ConfirmationDialog
        isOpen={showSignOutDialog}
        onClose={() => setShowSignOutDialog(false)}
        onConfirm={handleConfirmSignOut}
        title={t('auth.signOutTitle', 'Sign Out Confirmation')}
        message={t(
          'auth.signOutConfirm',
          'Are you sure you want to end your current session? Any unsaved edits will be discarded.'
        )}
        confirmText={t('nav.signOut', 'Sign Out')}
        cancelText={t('common.cancel', 'Cancel')}
        variant="danger"
      />
    </>
  );
};
