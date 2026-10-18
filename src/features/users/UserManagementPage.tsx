import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserPlus,
  User,
  Shield,
  UserX,
  UserCheck,
  Edit2,
  Mail,
  Building,
  Trash2,
  RefreshCw,
  WifiOff,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { Pagination } from '@/components/ui/Pagination';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterControls } from '@/components/ui/FilterControls';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { useToast } from '@/lib/ToastContext';
import { ROLES, RoleCode } from '@/lib/permissions';
import { createStaffFromUserCreation } from '@/features/hr/services/hrService';
import { createNotification } from '@/services/notificationsService';
import { supabase, isSupabaseConfigured, supabaseUrl } from '@/lib/supabase';
import { useAuth } from '@/features/auth/useAuth';
import { UserOnboardingReviewModal, PendingUserCandidate } from './components/UserOnboardingReviewModal';
import { ExecutiveApprovalModal } from './components/ExecutiveApprovalModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StaffUser {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  departmentCode: string;
  departmentName: string;
  roleCode: RoleCode;
  isActive: boolean;
  approvalStatus: 'pending_hr' | 'pending_ed' | 'approved' | 'rejected';
  stagedDetails?: Record<string, any>;
  avatarInitials: string;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLOWED_EMAIL_DOMAIN = '@babawatoto.or.tz';

const DEPT_NAMES: Record<string, string> = {
  EXEC: 'Executive Office',
  FIN: 'Finance & Operations',
  PRJ: 'Projects & Programs',
  ME: 'Monitoring & Evaluation',
  PROC: 'Procurement & Logistics',
  HR: 'Human Resources & Administration',
  ADMIN: 'IT & System Administration',
};

const ROLE_TITLES: Record<string, string> = {
  [ROLES.EXECUTIVE_DIRECTOR]: 'Executive Director',
  [ROLES.PROCUREMENT_OFFICER]: 'Procurement and Supply Officer',
  [ROLES.FINANCE_OFFICER]: 'Finance Officer',
  [ROLES.ME_OFFICER]: 'Monitoring and Evaluation (M&E) Officer',
  [ROLES.PROJECT_MANAGER]: 'Project Manager',
  [ROLES.PROJECT_COORDINATOR]: 'Project Coordinator',
  [ROLES.HR_ADMINISTRATOR]: 'HR Administrator',
  [ROLES.SYSTEM_ADMIN]: 'System Administrator',
};

// ---------------------------------------------------------------------------
// Supabase data helpers
// ---------------------------------------------------------------------------

/**
 * Fetch all staff profiles from Supabase joining departments and user_roles.
 */
async function fetchStaffFromSupabase(): Promise<StaffUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      official_email,
      phone_number,
      is_active,
      approval_status,
      staged_details,
      created_at,
      departments ( code, name_en ),
      user_roles:user_roles!user_roles_user_id_fkey ( roles ( code ) )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => {
    const dept = row.departments;
    const roleArr = (row.user_roles || []).flatMap((ur: any) => {
      const r = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
      return r?.code ? [r.code as RoleCode] : [];
    });
    const roleCode: RoleCode = roleArr[0] || ROLES.PROJECT_COORDINATOR;
    const name: string = row.display_name || '';
    const email: string = row.official_email || '';
    const approvalStatus = row.approval_status || (roleArr.length > 0 ? 'approved' : 'pending_hr');

    return {
      id: row.id,
      email,
      displayName: name,
      phoneNumber: row.phone_number || '',
      departmentCode: dept?.code || 'PRJ',
      departmentName: dept?.name_en || 'Projects & Programs',
      roleCode,
      isActive: row.is_active ?? true,
      approvalStatus,
      stagedDetails: row.staged_details || {},
      avatarInitials: name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
      createdAt: row.created_at,
    };
  });
}

/**
 * Fetch staff + their emails via the admin API (requires service role key — use edge fn for email).
 * Since we can't expose the service role in the browser, we fetch emails from the invite list
 * stored alongside profiles in a lightweight way: we look up auth user emails only for rows
 * the current user created. For the full list we rely on display_name + profile id.
 *
 * Note: emails for all auth.users are NOT readable by anon clients — this is by design.
 * Admins who need the email list should use the Supabase dashboard or the admin API.
 */
async function updateStaffStatusInSupabase(userId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId);
  if (error) throw error;
}

async function updateStaffRoleInSupabase(
  userId: string,
  newRoleCode: RoleCode,
  adminId: string
): Promise<void> {
  // 1. Resolve the new role_id
  const { data: roleRow, error: roleLookupErr } = await supabase
    .from('roles')
    .select('id')
    .eq('code', newRoleCode)
    .single();
  if (roleLookupErr || !roleRow) throw new Error(`Role '${newRoleCode}' not found in database.`);

  // 2. Delete existing role assignments for this user
  const { error: deleteErr } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);
  if (deleteErr) throw deleteErr;

  // 3. Insert the new role
  const { error: insertErr } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role_id: roleRow.id, assigned_by: adminId });
  if (insertErr) throw insertErr;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user: currentUser, hasRole, isAdmin } = useAuth();
  // HR Administrator and System Admin can both review (HR vetting step) and authorize (final approval)
  const canHRReview = hasRole('hr_administrator') || hasRole('system_admin') || isAdmin();
  const canEDAuthorize =
    hasRole('executive_director') ||
    hasRole('hr_administrator') ||
    hasRole('system_admin') ||
    isAdmin();

  // Online/offline connectivity state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Staff list & loading
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  // Search / filter / pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);

  // Approval workflow modal states
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isExecutiveModalOpen, setIsExecutiveModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<PendingUserCandidate | null>(null);

  // Invite form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePersonalEmail, setInvitePersonalEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('+255 754 ');
  const [inviteDept, setInviteDept] = useState('PRJ');
  const [inviteRole, setInviteRole] = useState<RoleCode>(ROLES.PROJECT_COORDINATOR);
  const [invitePassword, setInvitePassword] = useState('');
  const [emailDomainError, setEmailDomainError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit role form
  const [editRoleValue, setEditRoleValue] = useState<RoleCode>(ROLES.PROJECT_COORDINATOR);

  // ─── Network connectivity listener ────────────────────────────────────────
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ─── Load staff (Supabase when online, localStorage when offline) ─────────
  const loadStaff = useCallback(async () => {
    setIsFetching(true);
    if (isSupabaseConfigured) {
      try {
        const remoteStaff = await fetchStaffFromSupabase();
        setStaffList(remoteStaff);
      } catch (err: any) {
        console.warn('[UserManagementPage] Supabase fetch failed:', err);
        setStaffList([]);
        showToast({
          title: 'Database Error',
          message: err?.message || 'Could not load staff users from database.',
          variant: 'error',
        });
      }
    } else {
      setStaffList([]);
    }
    setIsFetching(false);
  }, [showToast]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  // ─── Filtered & paginated list ────────────────────────────────────────────
  const pendingCandidates = staffList.filter(
    (s) => s.approvalStatus === 'pending_hr' || s.approvalStatus === 'pending_ed'
  );

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.roleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.departmentName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? staff.isActive && staff.approvalStatus === 'approved'
        : statusFilter === 'pending'
        ? staff.approvalStatus === 'pending_hr' || staff.approvalStatus === 'pending_ed'
        : !staff.isActive;

    return matchesSearch && matchesStatus;
  });

  const filterOptions = [
    { id: 'all', label: 'All Staff', count: staffList.length },
    { id: 'active', label: 'Active', count: staffList.filter((s) => s.isActive && s.approvalStatus === 'approved').length },
    { id: 'pending', label: 'Pending Approvals', count: pendingCandidates.length },
    { id: 'deactivated', label: 'Deactivated', count: staffList.filter((s) => !s.isActive).length },
  ];

  // ─── Email validation ─────────────────────────────────────────────────────
  const validateEmailDomain = (email: string): boolean =>
    email.trim().toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);

  const handleEmailChange = (value: string) => {
    setInviteEmail(value);
    if (value && !validateEmailDomain(value)) {
      setEmailDomainError(`Only ${ALLOWED_EMAIL_DOMAIN} email addresses are permitted.`);
    } else {
      setEmailDomainError('');
    }
  };

  // ─── Create Staff User ────────────────────────────────────────────────────
  /**
   * WHY WE USE AN EDGE FUNCTION:
   * The Supabase anon/publishable key (VITE_SUPABASE_ANON_KEY) cannot call
   * supabase.auth.admin.* — that requires the SERVICE ROLE key which must
   * NEVER be placed in the browser. Instead, we call our Edge Function
   * `create-staff-user` which holds the service role key on the server.
   * The edge function verifies the caller is a system_admin, then creates
   * the auth user + profile + role assignment in one secure transaction.
   */
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    if (!validateEmailDomain(inviteEmail)) {
      setEmailDomainError(`Only ${ALLOWED_EMAIL_DOMAIN} email addresses are permitted.`);
      return;
    }

    if (!invitePassword || invitePassword.length < 8) {
      showToast({
        title: 'Password Required',
        message: 'Please set a temporary password (minimum 8 characters) for the new staff account.',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    const cleanEmail = inviteEmail.trim().toLowerCase();
    const deptName = DEPT_NAMES[inviteDept] || 'Projects & Programs';
    const roleTitle = ROLE_TITLES[inviteRole] || 'Staff Member';

    if (isSupabaseConfigured && isOnline) {
      // ── ONLINE: use Edge Function for secure user creation ──
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          showToast({ title: 'Session Expired', message: 'Please sign in again.', variant: 'error' });
          setIsSubmitting(false);
          return;
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/create-staff-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: cleanEmail,
            password: invitePassword,
            displayName: inviteName.trim(),
            phoneNumber: invitePhone.trim() || null,
            departmentCode: inviteDept,
            roleCode: inviteRole,
            personalEmail: invitePersonalEmail.trim() || null,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          showToast({
            title: 'User Creation Failed',
            message: result.error || 'An unknown error occurred.',
            variant: 'error',
          });
          setIsSubmitting(false);
          return;
        }

        // Optimistically prepend new user to local list
        const newStaff: StaffUser = {
          id: result.user.id,
          email: cleanEmail,
          displayName: inviteName.trim(),
          phoneNumber: invitePhone.trim() || '',
          departmentCode: inviteDept,
          departmentName: deptName,
          roleCode: inviteRole,
          isActive: true,
          avatarInitials: inviteName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
        };

        const updated = [newStaff, ...staffList];
        setStaffList(updated);
        setPersistentItem(USER_STORAGE_KEY, updated);

        // HR record + notification
        const createdHrStaff = await createStaffFromUserCreation({
          userId: result.user.id,
          fullName: inviteName.trim(),
          personalEmail: invitePersonalEmail.trim() || null,
          officialEmail: cleanEmail,
          phoneNumber: invitePhone.trim() || '+255 754 000 000',
          departmentCode: inviteDept,
          departmentName: deptName,
          jobTitle: roleTitle,
        });

        createNotification({
          title: 'Staff Onboarding Pending (HR)',
          message: `New staff member ${inviteName.trim()} access created. Please complete HR personnel record.`,
          type: 'hr',
          targetRole: 'hr_administrator',
          link: '/hr',
          metadata: { staffId: createdHrStaff.id, action: 'complete_hr' },
        });

        showToast({
          title: '✅ Staff Account Created in Supabase',
          message: `${cleanEmail} can now log in with the provided password. HR onboarding notification dispatched.`,
          variant: 'success',
        });
      } catch (err: unknown) {
        showToast({
          title: 'Network Error',
          message: err instanceof Error ? err.message : 'Failed to reach server.',
          variant: 'error',
        });
        setIsSubmitting(false);
        return;
      }
    } else {
      // ── OFFLINE: store locally, will need to sync when back online ──
      const localId = `local-${Date.now()}`;
      const newStaff: StaffUser = {
        id: localId,
        email: cleanEmail,
        displayName: inviteName.trim(),
        phoneNumber: invitePhone.trim() || '+255 754 000 000',
        departmentCode: inviteDept,
        departmentName: deptName,
        roleCode: inviteRole,
        isActive: true,
        avatarInitials: inviteName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
      };

      const updated = [newStaff, ...staffList];
      setStaffList(updated);
      setPersistentItem(USER_STORAGE_KEY, updated);

      showToast({
        title: '📦 Saved Offline',
        message: `${cleanEmail} saved locally. This account will be synced to Supabase when internet is restored.`,
        variant: 'warning',
      });
    }

    // Reset form
    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInvitePersonalEmail('');
    setInvitePhone('+255 754 ');
    setInvitePassword('');
    setEmailDomainError('');
    setIsSubmitting(false);
  };

  // ─── Save Role Change ─────────────────────────────────────────────────────
  const handleSaveRole = async () => {
    if (!selectedStaff) return;

    if (isSupabaseConfigured && isOnline && currentUser) {
      try {
        await updateStaffRoleInSupabase(selectedStaff.id, editRoleValue, currentUser.id);
      } catch (err) {
        showToast({
          title: 'Role Update Failed',
          message: err instanceof Error ? err.message : 'Could not update role in database.',
          variant: 'error',
        });
        return;
      }
    }

    const updated = staffList.map((s) =>
      s.id === selectedStaff.id ? { ...s, roleCode: editRoleValue } : s
    );
    setStaffList(updated);
    setPersistentItem(USER_STORAGE_KEY, updated);
    setIsEditRoleModalOpen(false);
    showToast({
      title: 'Role Updated',
      message: `${selectedStaff.displayName} reassigned to ${ROLE_TITLES[editRoleValue] || editRoleValue}.`,
      variant: 'success',
    });
  };

  // ─── Toggle Active Status ─────────────────────────────────────────────────
  const handleToggleActive = async () => {
    if (!selectedStaff) return;
    const newStatus = !selectedStaff.isActive;

    if (isSupabaseConfigured && isOnline) {
      try {
        await updateStaffStatusInSupabase(selectedStaff.id, newStatus);
      } catch (err) {
        showToast({
          title: 'Status Update Failed',
          message: err instanceof Error ? err.message : 'Could not update status in database.',
          variant: 'error',
        });
        return;
      }
    }

    const updated = staffList.map((s) =>
      s.id === selectedStaff.id ? { ...s, isActive: newStatus } : s
    );
    setStaffList(updated);
    setPersistentItem(USER_STORAGE_KEY, updated);
    setIsDeactivateDialogOpen(false);
    showToast({
      title: newStatus ? 'Account Activated' : 'Account Deactivated',
      message: `${selectedStaff.displayName} is now ${newStatus ? 'active' : 'deactivated'}.`,
      variant: newStatus ? 'success' : 'warning',
    });
  };

  // ─── Delete User (soft only in DB via is_active; hard delete offline) ─────
  const handleDeleteUser = async () => {
    if (!selectedStaff) return;

    if (isSupabaseConfigured && isOnline) {
      // We soft-delete (deactivate) in Supabase — hard deletes require service role via dashboard
      try {
        await updateStaffStatusInSupabase(selectedStaff.id, false);
      } catch (err) {
        showToast({
          title: 'Delete Failed',
          message: err instanceof Error ? err.message : 'Could not deactivate user in database.',
          variant: 'error',
        });
        return;
      }
      showToast({
        title: 'User Deactivated in Database',
        message: `${selectedStaff.displayName} has been deactivated. To fully delete the auth account, use the Supabase dashboard → Authentication → Users.`,
        variant: 'warning',
      });
    } else {
      showToast({
        title: 'User Removed Locally',
        message: `${selectedStaff.displayName} removed from local list.`,
        variant: 'warning',
      });
    }

    const updated = staffList.filter((s) => s.id !== selectedStaff.id);
    setStaffList(updated);
    setPersistentItem(USER_STORAGE_KEY, updated);
    setIsDeleteDialogOpen(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('users.managementTitle', 'Staff User Management')}
        subtitle={t(
          'users.managementSubtitle',
          'Provision staff accounts, manage role assignments, and govern account lifecycles. Only @babawatoto.or.tz email addresses are authorized.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('nav.userManagement', 'User Management') },
        ]}
        badge={
          <Badge variant="info" withDot>
            {hasRole('hr_administrator') ? 'HR Personnel Command' : isAdmin() ? 'System Administrator' : 'Access Governance'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const regUrl = `${window.location.origin}/register`;
                navigator.clipboard.writeText(regUrl);
                showToast({
                  title: 'Registration Link Copied',
                  message: `${regUrl} copied to clipboard. Share with incoming staff.`,
                  variant: 'success',
                });
              }}
              title="Copy staff self-registration portal link"
              className="text-xs flex items-center gap-1.5 border-slate-300"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Self-Registration Link</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              onClick={loadStaff}
              disabled={isFetching}
              title="Refresh user list from database"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1.5" />
              <span>{t('users.inviteButton', 'Provision Staff Member')}</span>
            </Button>
          </div>
        }
      />

      {/* Online / Offline Banner */}
      {!isOnline && (
        <div className="flex items-center gap-2.5 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-800">
          <WifiOff className="h-4 w-4 shrink-0 text-orange-600" />
          <span>
            <strong>Offline Mode:</strong> No internet connection detected. Showing cached staff list.
            Changes will be saved locally and can be synced when connectivity is restored.
          </span>
        </div>
      )}



      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="max-w-sm w-full">
              <SearchInput
                placeholder={t('users.searchPlaceholder', 'Search staff by name, email, role, or department...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                showShortcut={false}
                size="sm"
              />
            </div>
            <FilterControls options={filterOptions} activeFilter={statusFilter} onSelectFilter={setStatusFilter} />
          </div>
        </CardContent>
      </Card>

      {/* Staff Roster Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('users.rosterTitle', 'Authorized Staff Directory')}</CardTitle>
            <Badge variant="info">{filteredStaff.length} Records</Badge>
          </div>
          <CardDescription>
            {isSupabaseConfigured && isOnline
              ? 'Live data from Supabase. Roles enforced through PostgreSQL Row-Level Security (RLS).'
              : isSupabaseConfigured && !isOnline
              ? 'Offline — showing locally cached data. Reconnect to sync with Supabase.'
              : 'Offline mode — Supabase not configured. Users saved locally.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <RefreshCw className="h-8 w-8 text-slate-300 mb-3 animate-spin" />
              <p className="text-sm text-slate-500">Loading staff from database...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No staff accounts yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Use the <strong>Provision Staff Member</strong> button above to add your first user.{' '}
                Only <code>@babawatoto.or.tz</code> emails are accepted.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((staff) => {
                    const actionItems: DropdownMenuItem[] = [
                      {
                        id: 'view-profile',
                        label: 'View Profile & Dossier',
                        icon: User,
                        onClick: () => navigate(`/profile/${staff.id}`),
                      },
                      {
                        id: 'edit-role',
                        label: 'Assign Role',
                        icon: Shield,
                        onClick: () => {
                          setSelectedStaff(staff);
                          setEditRoleValue(staff.roleCode);
                          setIsEditRoleModalOpen(true);
                        },
                      },
                      {
                        id: 'toggle-status',
                        label: staff.isActive ? 'Deactivate Account' : 'Reactivate Account',
                        icon: staff.isActive ? UserX : UserCheck,
                        dividerAbove: true,
                        isDestructive: staff.isActive,
                        onClick: () => {
                          setSelectedStaff(staff);
                          setIsDeactivateDialogOpen(true);
                        },
                      },
                      {
                        id: 'delete-user',
                        label: 'Remove User',
                        icon: Trash2,
                        isDestructive: true,
                        onClick: () => {
                          setSelectedStaff(staff);
                          setIsDeleteDialogOpen(true);
                        },
                      },
                    ];

                    return (
                      <TableRow key={staff.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-semibold text-xs">
                              {staff.avatarInitials}
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-semibold text-xs text-charcoal block">{staff.displayName}</span>
                              {staff.email ? (
                                <span className="text-[11px] text-charcoal-muted flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {staff.email}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">ID: {staff.id.substring(0, 8)}…</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-charcoal-muted">
                            <Building className="h-3.5 w-3.5 text-charcoal-light" />
                            <span>{staff.departmentName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-charcoal-900">
                            {ROLE_TITLES[staff.roleCode] || staff.roleCode}
                          </span>
                        </TableCell>
                        <TableCell>
                          {staff.approvalStatus === 'pending_hr' ? (
                            <StatusIndicator
                              status="pending_review"
                              label="Pending Review"
                            />
                          ) : staff.approvalStatus === 'pending_ed' ? (
                            <StatusIndicator
                              status="pending_ed"
                              label="Pending ED Approval"
                            />
                          ) : staff.approvalStatus === 'rejected' ? (
                            <StatusIndicator
                              status="rejected"
                              label="Rejected"
                            />
                          ) : (
                            <StatusIndicator
                              status={staff.isActive ? 'active' : 'deactivated'}
                              label={staff.isActive ? 'Active' : 'Deactivated'}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {staff.approvalStatus === 'pending_hr' && canHRReview && (
                              <Button
                                size="xs"
                                variant="primary"
                                onClick={() => {
                                  setSelectedCandidate(staff);
                                  setIsOnboardingModalOpen(true);
                                }}
                                className="bg-charcoal-900 hover:bg-black text-white text-[11px] py-1 px-2.5 h-auto flex items-center gap-1 shrink-0"
                              >
                                <span>Review & Onboard</span>
                              </Button>
                            )}

                            {staff.approvalStatus === 'pending_ed' && canEDAuthorize && (
                              <Button
                                size="xs"
                                variant="primary"
                                onClick={() => {
                                  setSelectedCandidate(staff);
                                  setIsExecutiveModalOpen(true);
                                }}
                                className="bg-charcoal-900 hover:bg-black text-white text-[11px] py-1 px-2.5 h-auto flex items-center gap-1 shrink-0"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>Authorize</span>
                              </Button>
                            )}

                            <DropdownMenu
                              menuWidth="w-52"
                              trigger={
                                <Button variant="ghost" size="sm" isIconOnly aria-label="Staff options">
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              }
                              items={actionItems}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}

          {filteredStaff.length > pageSize && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredStaff.length / pageSize)}
              totalItems={filteredStaff.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Invite / Provision Staff Modal ── */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => { setIsInviteModalOpen(false); setEmailDomainError(''); }}
        title="Provision New Staff Account"
        description={
          isSupabaseConfigured && isOnline
            ? 'This creates a real Supabase Auth account. The staff member can log in immediately with the provided password.'
            : 'Offline mode — account will be saved locally and synced to Supabase when internet is restored.'
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setIsInviteModalOpen(false); setEmailDomainError(''); }}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleInviteSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <Input
            label="Full Staff Name"
            placeholder="e.g. Grace M. Mlay"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            required
          />

          <div>
            <Input
              type="email"
              label="Official Organization Email"
              placeholder={`grace${ALLOWED_EMAIL_DOMAIN}`}
              value={inviteEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
              helperText={emailDomainError || `Must be a valid ${ALLOWED_EMAIL_DOMAIN} address`}
            />
            {emailDomainError && (
              <p className="mt-1 text-xs text-red-600 font-medium">{emailDomainError}</p>
            )}
          </div>

          {/* Password is always required — needed for the user to login */}
          <Input
            type="password"
            label="Temporary Password"
            placeholder="Min. 8 characters"
            value={invitePassword}
            onChange={(e) => setInvitePassword(e.target.value)}
            required
            helperText={
              isSupabaseConfigured && isOnline
                ? 'Staff will use this password to log in. They can change it in their profile settings.'
                : 'Will be stored locally and applied when synced to Supabase.'
            }
          />

          <Input
            type="email"
            label="Personal Email Address (Optional)"
            placeholder="grace.mlay@gmail.com"
            value={invitePersonalEmail}
            onChange={(e) => setInvitePersonalEmail(e.target.value)}
            helperText="Staff personal correspondence & recovery email"
          />

          <Input
            type="text"
            label="Contact Phone Number"
            placeholder="+255 754 123 456"
            value={invitePhone}
            onChange={(e) => setInvitePhone(e.target.value)}
          />

          <Select
            label="Department Assignment"
            value={inviteDept}
            onChange={(e) => setInviteDept(e.target.value)}
            options={[
              { value: 'EXEC', label: 'Executive Office' },
              { value: 'FIN', label: 'Finance & Operations' },
              { value: 'PRJ', label: 'Projects & Programs' },
              { value: 'HR', label: 'Human Resources' },
              { value: 'ADMIN', label: 'IT & System Administration' },
              { value: 'PROC', label: 'Procurement & Logistics' },
            ]}
          />

          <Select
            label="Primary Role Assignment"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as RoleCode)}
            options={[
              { value: ROLES.EXECUTIVE_DIRECTOR, label: 'Executive Director' },
              { value: ROLES.PROCUREMENT_OFFICER, label: 'Procurement and Supply Officer' },
              { value: ROLES.FINANCE_OFFICER, label: 'Finance Officer' },
              { value: ROLES.ME_OFFICER, label: 'Monitoring and Evaluation (M&E) Officer' },
              { value: ROLES.PROJECT_MANAGER, label: 'Project Manager' },
              { value: ROLES.PROJECT_COORDINATOR, label: 'Project Coordinator' },
              { value: ROLES.HR_ADMINISTRATOR, label: 'HR Administrator' },
              { value: ROLES.SYSTEM_ADMIN, label: 'System Administrator' },
            ]}
            helperText="Determines which dashboard and features the staff member can access."
          />
        </form>
      </Modal>

      {/* ── Edit Role Modal ── */}
      <Modal
        isOpen={isEditRoleModalOpen}
        onClose={() => setIsEditRoleModalOpen(false)}
        title="Modify Role Assignment"
        description={selectedStaff ? `Update role permissions for ${selectedStaff.displayName}.` : 'Update role assignment.'}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsEditRoleModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSaveRole}>Save Assignment</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Assigned Organizational Role"
            value={editRoleValue}
            onChange={(e) => setEditRoleValue(e.target.value as RoleCode)}
            options={[
              { value: ROLES.EXECUTIVE_DIRECTOR, label: 'Executive Director' },
              { value: ROLES.PROCUREMENT_OFFICER, label: 'Procurement and Supply Officer' },
              { value: ROLES.FINANCE_OFFICER, label: 'Finance Officer' },
              { value: ROLES.ME_OFFICER, label: 'Monitoring and Evaluation (M&E) Officer' },
              { value: ROLES.PROJECT_MANAGER, label: 'Project Manager' },
              { value: ROLES.PROJECT_COORDINATOR, label: 'Project Coordinator' },
              { value: ROLES.HR_ADMINISTRATOR, label: 'HR Administrator' },
              { value: ROLES.SYSTEM_ADMIN, label: 'System Administrator' },
            ]}
            helperText={
              isSupabaseConfigured && isOnline
                ? 'Will be updated in Supabase user_roles table immediately.'
                : 'Saved locally. Sync required when back online.'
            }
          />
        </div>
      </Modal>

      {/* ── Deactivate / Reactivate Confirmation ── */}
      <ConfirmationDialog
        isOpen={isDeactivateDialogOpen}
        onClose={() => setIsDeactivateDialogOpen(false)}
        onConfirm={handleToggleActive}
        title={selectedStaff?.isActive ? 'Confirm Account Deactivation' : 'Confirm Account Reactivation'}
        message={
          selectedStaff?.isActive
            ? `Deactivate ${selectedStaff.displayName}'s account? They will be immediately barred from signing in.`
            : `Reactivate ${selectedStaff?.displayName}'s account to restore staff access?`
        }
        confirmText={selectedStaff?.isActive ? 'Deactivate Account' : 'Reactivate Account'}
        variant={selectedStaff?.isActive ? 'danger' : 'primary'}
      />

      {/* ── Delete User Confirmation ── */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteUser}
        title="Remove User"
        message={
          isSupabaseConfigured && isOnline
            ? `${selectedStaff?.displayName} will be deactivated in the database. To permanently delete the auth account, use the Supabase Dashboard → Authentication → Users.`
            : `Remove ${selectedStaff?.displayName} from the local list?`
        }
        confirmText="Remove User"
        variant="danger"
      />

      {/* ── HR User Onboarding Review Modal (Stepper) ── */}
      <UserOnboardingReviewModal
        isOpen={isOnboardingModalOpen}
        onClose={() => {
          setIsOnboardingModalOpen(false);
          setSelectedCandidate(null);
        }}
        user={selectedCandidate}
        onSuccess={loadStaff}
      />

      {/* ── Executive Director Authorization Modal ── */}
      <ExecutiveApprovalModal
        isOpen={isExecutiveModalOpen}
        onClose={() => {
          setIsExecutiveModalOpen(false);
          setSelectedCandidate(null);
        }}
        user={selectedCandidate}
        onSuccess={loadStaff}
      />
    </div>
  );
};
