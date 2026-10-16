import React, { useState } from 'react';
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
import { DemoAccount } from '@/features/auth/demoAccounts';
import { getPersistentItem, setPersistentItem } from '@/lib/storageSync';
import { createStaffFromUserCreation } from '@/features/hr/services/hrService';
import { createNotification } from '@/services/notificationsService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const USER_STORAGE_KEY = 'baoms_staff_users';
const ALLOWED_EMAIL_DOMAIN = '@babawatoto.or.tz';

export const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();

  // Start with an empty list — no mock data seeded.
  const [staffList, setStaffList] = useState<DemoAccount[]>(() =>
    getPersistentItem(USER_STORAGE_KEY, () => [])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<DemoAccount | null>(null);

  // Form states for Invite
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePersonalEmail, setInvitePersonalEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('+255 754 ');
  const [inviteDept, setInviteDept] = useState('PRJ');
  const [inviteRole, setInviteRole] = useState<RoleCode>(ROLES.PROJECT_COORDINATOR);
  const [invitePassword, setInvitePassword] = useState('');
  const [emailDomainError, setEmailDomainError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for Edit Role
  const [editRoleValue, setEditRoleValue] = useState<RoleCode>(ROLES.PROJECT_COORDINATOR);

  // Filter options
  const filterOptions = [
    { id: 'all', label: 'All Staff', count: staffList.length },
    { id: 'active', label: 'Active', count: staffList.filter((s) => s.isActive).length },
    { id: 'deactivated', label: 'Deactivated', count: staffList.filter((s) => !s.isActive).length },
  ];

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? staff.isActive
        : !staff.isActive;

    return matchesSearch && matchesStatus;
  });

  const validateEmailDomain = (email: string): boolean => {
    return email.trim().toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
  };

  const handleEmailChange = (value: string) => {
    setInviteEmail(value);
    if (value && !validateEmailDomain(value)) {
      setEmailDomainError(`Only ${ALLOWED_EMAIL_DOMAIN} email addresses are permitted.`);
    } else {
      setEmailDomainError('');
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    if (!validateEmailDomain(inviteEmail)) {
      setEmailDomainError(`Only ${ALLOWED_EMAIL_DOMAIN} email addresses are permitted.`);
      return;
    }

    if (isSupabaseConfigured && (!invitePassword || invitePassword.length < 8)) {
      showToast({
        title: 'Password Required',
        message: 'Please set a temporary password (minimum 8 characters) for the new staff account.',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    const deptNames: Record<string, string> = {
      EXEC: 'Executive Office',
      FIN: 'Finance & Operations',
      PRJ: 'Projects & Programs',
      HR: 'Human Resources & Administration',
      ADMIN: 'IT & System Administration',
      PROC: 'Procurement & Logistics',
    };
    const deptName = deptNames[inviteDept] || 'Projects & Programs';

    const roleTitles: Record<string, string> = {
      [ROLES.PROJECT_COORDINATOR]: 'Project Coordinator',
      [ROLES.PROJECT_MANAGER]: 'Project Manager',
      [ROLES.FINANCE_OFFICER]: 'Finance Officer',
      [ROLES.HR_ADMINISTRATOR]: 'HR Administrator',
      [ROLES.EXECUTIVE_DIRECTOR]: 'Executive Director',
      [ROLES.SYSTEM_ADMIN]: 'System Administrator',
      [ROLES.PROCUREMENT_OFFICER]: 'Procurement Officer',
    };
    const roleTitle = roleTitles[inviteRole] || 'Staff Member';
    const cleanEmail = inviteEmail.trim().toLowerCase();

    let userId = `staff-${Date.now()}`;

    if (isSupabaseConfigured) {
      try {
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password: invitePassword,
          email_confirm: true,
          user_metadata: {
            display_name: inviteName.trim(),
            role: inviteRole,
            department_code: inviteDept,
          },
        });

        if (authErr) {
          showToast({ title: 'Supabase Auth Error', message: authErr.message, variant: 'error' });
          setIsSubmitting(false);
          return;
        }

        userId = authData.user.id;
      } catch (err: unknown) {
        showToast({
          title: 'Error Creating User',
          message: err instanceof Error ? err.message : 'Failed to create Supabase auth user.',
          variant: 'error',
        });
        setIsSubmitting(false);
        return;
      }
    }

    const newStaff: DemoAccount = {
      id: userId,
      email: cleanEmail,
      displayName: inviteName.trim(),
      phoneNumber: invitePhone.trim() || '+255 754 000 000',
      preferredLanguage: 'sw',
      departmentId: `dept-${inviteDept.toLowerCase()}`,
      departmentCode: inviteDept,
      departmentName: deptName,
      role: inviteRole,
      roles: [inviteRole],
      permissions: [],
      isActive: true,
      avatarInitials: inviteName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
    };

    const updated = [newStaff, ...staffList];
    setStaffList(updated);
    setPersistentItem(USER_STORAGE_KEY, updated);

    const createdHrStaff = await createStaffFromUserCreation({
      userId: newStaff.id,
      fullName: newStaff.displayName,
      personalEmail: invitePersonalEmail.trim() || null,
      officialEmail: newStaff.email,
      phoneNumber: newStaff.phoneNumber,
      departmentCode: inviteDept,
      departmentName: deptName,
      jobTitle: roleTitle,
    });

    createNotification({
      title: 'Staff Onboarding Pending (HR)',
      message: `New staff member ${newStaff.displayName} access created. Please complete HR personnel record (DOB, NIDA, TIN, CV, Certifications, Salary).`,
      type: 'hr',
      targetRole: 'hr_administrator',
      link: '/hr',
      metadata: { staffId: createdHrStaff.id, action: 'complete_hr' },
    });

    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInvitePersonalEmail('');
    setInvitePhone('+255 754 ');
    setInvitePassword('');
    setEmailDomainError('');
    setIsSubmitting(false);

    showToast({
      title: isSupabaseConfigured ? 'User Created in Supabase' : 'Staff Access Provisioned',
      message: isSupabaseConfigured
        ? `Auth account created for ${cleanEmail}. HR onboarding notification dispatched.`
        : `Local account provisioned for ${cleanEmail}. Automated onboarding notification forwarded to HR.`,
      variant: 'success',
    });
  };

  const handleSaveRole = () => {
    if (!selectedStaff) return;
    const updated = staffList.map((s) =>
      s.id === selectedStaff.id ? { ...s, role: editRoleValue, roles: [editRoleValue] } : s
    );
    setStaffList(updated);
    setPersistentItem(USER_STORAGE_KEY, updated);
    setIsEditRoleModalOpen(false);
    showToast({ title: 'Role Updated', message: `${selectedStaff.displayName} was reassigned to ${editRoleValue}.`, variant: 'success' });
  };

  const handleToggleActive = () => {
    if (!selectedStaff) return;
    const newStatus = !selectedStaff.isActive;
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

  const handleDeleteUser = () => {
    if (!selectedStaff) return;
    const updated = staffList.filter((s) => s.id !== selectedStaff.id);
    setStaffList(updated);
    setPersistentItem(USER_STORAGE_KEY, updated);
    setIsDeleteDialogOpen(false);
    showToast({
      title: 'User Removed',
      message: `${selectedStaff.displayName} has been permanently removed from the system directory.`,
      variant: 'warning',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('users.managementTitle', 'Staff User Management')}
        subtitle={t('users.managementSubtitle', 'Provision staff accounts, manage organizational role assignments, and govern account lifecycles. Only @babawatoto.or.tz email addresses are authorized.')}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('nav.userManagement', 'User Management') },
        ]}
        badge={
          <Badge variant="info" withDot>
            System Administrator
          </Badge>
        }
        actions={
          <Button variant="primary" size="sm" onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            <span>{t('users.inviteButton', 'Provision Staff Member')}</span>
          </Button>
        }
      />

      {/* Domain Policy Notice */}
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <Mail className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
        <span>
          <strong>Email Domain Policy:</strong> Only{' '}
          <code className="font-mono bg-amber-100 px-1 rounded">@babawatoto.or.tz</code> email
          addresses are authorized for staff accounts. All other domains will be rejected.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="max-w-sm w-full">
              <SearchInput
                placeholder={t('users.searchPlaceholder', 'Search staff by name, email, or role...')}
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
            {isSupabaseConfigured
              ? 'Users provisioned directly in Supabase Auth. Roles are server-enforced through PostgreSQL RLS.'
              : 'Offline mode — users saved locally. Connect Supabase to sync with the live database.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredStaff.length === 0 ? (
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
                  <TableHead>Assigned Role</TableHead>
                  <TableHead>Account Status</TableHead>
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
                          setEditRoleValue(staff.role);
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
                        label: 'Delete User',
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
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 font-semibold text-xs">
                              {staff.avatarInitials}
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-semibold text-xs text-charcoal block">{staff.displayName}</span>
                              <span className="text-[11px] text-charcoal-muted flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {staff.email}
                              </span>
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
                          <span className="font-mono text-xs font-semibold text-charcoal-900">{staff.role}</span>
                        </TableCell>
                        <TableCell>
                          <StatusIndicator
                            status={staff.isActive ? 'active' : 'deactivated'}
                            label={staff.isActive ? 'Active' : 'Deactivated'}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu
                            menuWidth="w-52"
                            trigger={
                              <Button variant="ghost" size="sm" isIconOnly aria-label="Staff options">
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            }
                            items={actionItems}
                          />
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

      {/* Invite / Provision Staff Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => { setIsInviteModalOpen(false); setEmailDomainError(''); }}
        title="Provision New Staff Account"
        description={`Create an authorized organizational identity. Only @babawatoto.or.tz email addresses are accepted.${isSupabaseConfigured ? ' This will create a real account in Supabase Auth.' : ''}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setIsInviteModalOpen(false); setEmailDomainError(''); }}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleInviteSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Account'}
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

          {isSupabaseConfigured && (
            <Input
              type="password"
              label="Temporary Password"
              placeholder="Min. 8 characters"
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              required
              helperText="Staff will be prompted to change this on first login."
            />
          )}

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
              { value: ROLES.PROJECT_COORDINATOR, label: 'Project Coordinator' },
              { value: ROLES.PROJECT_MANAGER, label: 'Project Manager' },
              { value: ROLES.FINANCE_OFFICER, label: 'Finance Officer' },
              { value: ROLES.HR_ADMINISTRATOR, label: 'HR Administrator' },
              { value: ROLES.EXECUTIVE_DIRECTOR, label: 'Executive Director' },
              { value: ROLES.SYSTEM_ADMIN, label: 'System Administrator' },
              { value: ROLES.PROCUREMENT_OFFICER, label: 'Procurement Officer' },
            ]}
          />
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={isEditRoleModalOpen}
        onClose={() => setIsEditRoleModalOpen(false)}
        title="Modify Role Assignment"
        description={selectedStaff ? `Update authoritative role permissions for ${selectedStaff.displayName}.` : 'Update role assignment.'}
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
              { value: ROLES.PROJECT_COORDINATOR, label: 'Project Coordinator' },
              { value: ROLES.PROJECT_MANAGER, label: 'Project Manager' },
              { value: ROLES.FINANCE_OFFICER, label: 'Finance Officer' },
              { value: ROLES.HR_ADMINISTRATOR, label: 'HR Administrator' },
              { value: ROLES.EXECUTIVE_DIRECTOR, label: 'Executive Director' },
              { value: ROLES.SYSTEM_ADMIN, label: 'System Administrator' },
            ]}
            helperText="Server-enforced via public.user_roles Row-Level Security."
          />
        </div>
      </Modal>

      {/* Deactivate / Reactivate Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeactivateDialogOpen}
        onClose={() => setIsDeactivateDialogOpen(false)}
        onConfirm={handleToggleActive}
        title={selectedStaff?.isActive ? 'Confirm Account Deactivation' : 'Confirm Account Reactivation'}
        message={
          selectedStaff?.isActive
            ? `Are you sure you wish to deactivate ${selectedStaff.displayName}'s account? The user will immediately be barred from signing in.`
            : `Reactivate ${selectedStaff?.displayName}'s account to restore authorized staff access?`
        }
        confirmText={selectedStaff?.isActive ? 'Deactivate Account' : 'Reactivate Account'}
        variant={selectedStaff?.isActive ? 'danger' : 'primary'}
      />

      {/* Delete User Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteUser}
        title="Permanently Delete User"
        message={`Are you sure you want to permanently delete ${selectedStaff?.displayName} (${selectedStaff?.email})? This cannot be undone. If Supabase is configured, you must also remove the user from Supabase Auth manually.`}
        confirmText="Delete User"
        variant="danger"
      />
    </div>
  );
};
