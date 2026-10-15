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
import { DEMO_ACCOUNTS, DemoAccount } from '@/features/auth/demoAccounts';
import { getPersistentItem, setPersistentItem } from '@/lib/storageSync';
import { createStaffFromUserCreation } from '@/features/hr/services/hrService';
import { createNotification } from '@/services/notificationsService';

const USER_STORAGE_KEY = 'baoms_staff_users';

export const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [staffList, setStaffList] = useState<DemoAccount[]>(() =>
    getPersistentItem(USER_STORAGE_KEY, () => DEMO_ACCOUNTS)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<DemoAccount | null>(null);

  // Form states for Invite
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePersonalEmail, setInvitePersonalEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('+255 754 ');
  const [inviteDept, setInviteDept] = useState('PRJ');
  const [inviteRole, setInviteRole] = useState<RoleCode>(ROLES.PROJECT_COORDINATOR);

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

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const deptNames: Record<string, string> = {
      EXEC: 'Executive Office',
      FIN: 'Finance & Operations',
      PRJ: 'Projects & Programs',
      HR: 'Human Resources & Administration',
      ADMIN: 'IT & System Administration',
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

    // 1. Create and grant system access
    const newStaff: DemoAccount = {
      id: `staff-${Date.now()}`,
      email: inviteEmail.trim().toLowerCase(),
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
      avatarInitials: inviteName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
    };

    const updated = [newStaff, ...staffList];
    setStaffList(updated);
    setPersistentItem(USER_STORAGE_KEY, updated);

    // 2. Automatically initialize linked HR Staff profile in Step 2: Pending HR
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

    // 3. Automatically dispatch notification to HR Administrator
    createNotification({
      title: 'Staff Onboarding Pending (HR)',
      message: `New staff member ${newStaff.displayName} access created. Please complete HR personnel record (DOB, NIDA, TIN, CV, Certifications, Salary).`,
      type: 'hr',
      targetRole: 'hr_administrator',
      link: '/hr',
      metadata: {
        staffId: createdHrStaff.id,
        action: 'complete_hr',
      },
    });

    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInvitePersonalEmail('');
    setInvitePhone('+255 754 ');

    showToast({
      title: 'Staff Access Granted',
      message: `System account provisioned for ${newStaff.email}. Automated onboarding notification forwarded to HR.`,
      variant: 'success',
    });
  };

  const handleSaveRole = () => {
    if (!selectedStaff) return;
    const updated = staffList.map((s) =>
      s.id === selectedStaff.id
        ? { ...s, role: editRoleValue, roles: [editRoleValue] }
        : s
    );
    setStaffList(updated);
    setPersistentItem(USER_STORAGE_KEY, updated);
    setIsEditRoleModalOpen(false);
    showToast({
      title: 'Role Updated',
      message: `${selectedStaff.displayName} was reassigned to ${editRoleValue}.`,
      variant: 'success',
    });
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('users.managementTitle', 'Staff User Management')}
        subtitle={t('users.managementSubtitle', 'Provision staff accounts, manage organizational role assignments, and govern account lifecycles under PostgreSQL Row-Level Security.')}
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
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            <span>{t('users.inviteButton', 'Provision Staff Member')}</span>
          </Button>
        }
      />

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
            <FilterControls
              options={filterOptions}
              activeFilter={statusFilter}
              onSelectFilter={setStatusFilter}
            />
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
            Profiles linked directly to Supabase Auth identities. Roles are server-enforced through PostgreSQL RLS.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
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
                    onClick: () => {
                      navigate(`/profile/${staff.id}`);
                    },
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
                ];

                return (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 font-semibold text-xs">
                          {staff.avatarInitials}
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-semibold text-xs text-charcoal block">
                            {staff.displayName}
                          </span>
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
                      <span className="font-mono text-xs font-semibold text-charcoal-900">
                        {staff.role}
                      </span>
                    </TableCell>

                    <TableCell>
                      <StatusIndicator
                        status={staff.isActive ? 'active' : 'deactivated'}
                        label={staff.isActive ? 'Active' : 'Deactivated'}
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu
                        menuWidth="w-48"
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
        onClose={() => setIsInviteModalOpen(false)}
        title="Provision New Staff Account"
        description="Create an authorized organizational identity. An invitation notification will be dispatched."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleInviteSubmit}>
              Dispatch Invitation
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

          <Input
            type="email"
            label="Official Organization Email"
            placeholder="grace@babawatoto.org"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            helperText="Official system login & communication email (@babawatoto.org)"
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
            ]}
          />
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={isEditRoleModalOpen}
        onClose={() => setIsEditRoleModalOpen(false)}
        title="Modify Role Assignment"
        description={
          selectedStaff
            ? `Update authoritative role permissions for ${selectedStaff.displayName}.`
            : 'Update role assignment.'
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsEditRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveRole}>
              Save Assignment
            </Button>
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
        title={
          selectedStaff?.isActive
            ? 'Confirm Account Deactivation'
            : 'Confirm Account Reactivation'
        }
        message={
          selectedStaff?.isActive
            ? `Are you sure you wish to deactivate ${selectedStaff.displayName}'s account? The user will immediately be barred from signing in and accessing organizational documents.`
            : `Reactivate ${selectedStaff?.displayName}'s account to restore authorized staff access?`
        }
        confirmText={selectedStaff?.isActive ? 'Deactivate Account' : 'Reactivate Account'}
        variant={selectedStaff?.isActive ? 'danger' : 'primary'}
      />
    </div>
  );
};
