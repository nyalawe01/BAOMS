import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  StaffProfileRecord,
  LeaveRequestRecord,
} from '../types/hr';
import {
  getStaffProfiles,
  getLeaveRequests,
  getContractExpiryReminders,
  submitDraftLeaveRequest,
} from '../services/hrService';
import { useAuth } from '@/features/auth/useAuth';
import { confirmAction, showSuccess, showError } from '@/lib/sweetAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { StaffDetailModal } from '../components/StaffDetailModal';
import { CreateStaffModal } from '../components/CreateStaffModal';
import { CompleteHrOnboardingModal } from '../components/CompleteHrOnboardingModal';
import { CompleteStatutoryModal } from '../components/CompleteStatutoryModal';
import { CreateLeaveRequestModal } from '../components/CreateLeaveRequestModal';
import { ReviewLeaveModal } from '../components/ReviewLeaveModal';
import { ContractExpiryAlertsBanner } from '../components/ContractExpiryAlertsBanner';
import {
  Users,
  Calendar,
  AlertTriangle,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  ClipboardList,
  Download,
  X,
} from 'lucide-react';

interface HrPageProps {
  defaultTab?: 'staff' | 'leave' | 'contracts' | 'checklists';
}

export const HrPage: React.FC<HrPageProps> = ({ defaultTab = 'staff' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, roles, hasPermission, isAdmin } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'staff' | 'leave' | 'contracts' | 'checklists'>(defaultTab);
  const [staffList, setStaffList] = useState<StaffProfileRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>([]);
  const [expiringStaff, setExpiringStaff] = useState<StaffProfileRecord[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedContract, setSelectedContract] = useState('all');
  const [selectedOnboardingStatus, setSelectedOnboardingStatus] = useState('all');
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [selectedStaffForModal, setSelectedStaffForModal] = useState<StaffProfileRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [isCreateLeaveOpen, setIsCreateLeaveOpen] = useState(false);
  const [isHrModalOpen, setIsHrModalOpen] = useState(false);
  const [isStatutoryModalOpen, setIsStatutoryModalOpen] = useState(false);
  const [staffForOnboarding, setStaffForOnboarding] = useState<StaffProfileRecord | null>(null);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<LeaveRequestRecord | null>(null);
  const [isReviewLeaveOpen, setIsReviewLeaveOpen] = useState(false);

  const canManageStaff =
    hasPermission('hr.manage') ||
    roles.includes('hr_administrator') ||
    roles.includes('system_admin') ||
    isAdmin();

  const canApproveLeave =
    hasPermission('leave.approve') ||
    roles.includes('executive_director') ||
    roles.includes('hr_administrator') ||
    roles.includes('project_manager') ||
    roles.includes('system_admin') ||
    isAdmin();

  const [loading, setLoading] = useState(true);

  const loadData = React.useCallback(async () => {
    try {
      const currentUserContext = user ? { id: user.id, roles } : undefined;
      const [allStaff, requests, expiring] = await Promise.all([
        getStaffProfiles(undefined, currentUserContext),
        getLeaveRequests(undefined, currentUserContext),
        getContractExpiryReminders(60),
      ]);
      setStaffList(allStaff);
      setLeaveRequests(requests);
      setExpiringStaff(expiring);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, roles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered staff
  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.staffNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.email && staff.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = selectedDept === 'all' || staff.departmentId === selectedDept;
    const matchesStatus = selectedStatus === 'all' || staff.employmentStatus === selectedStatus;
    const matchesContract = selectedContract === 'all' || staff.contractType === selectedContract;
    const matchesOnboarding =
      selectedOnboardingStatus === 'all' ||
      (selectedOnboardingStatus === 'completed' && (!staff.onboardingStatus || staff.onboardingStatus === 'completed')) ||
      staff.onboardingStatus === selectedOnboardingStatus;

    return matchesSearch && matchesDept && matchesStatus && matchesContract && matchesOnboarding;
  });

  // Filtered leave requests
  const filteredRequests = leaveRequests.filter((req) => {
    return selectedLeaveStatus === 'all' || req.status === selectedLeaveStatus;
  });

  const pendingRequestsCount = leaveRequests.filter((r) => r.status === 'pending').length;

  const handleSubmitDraft = async (requestId: string) => {
    const confirmed = await confirmAction({
      title: t('hr.confirmSubmitLeave', 'Submit Leave Request'),
      text: t('hr.confirmSubmitLeaveDesc', 'Are you sure you want to submit this leave request for supervisory review?'),
      confirmButtonText: t('hr.submitForReview', 'Submit for Review'),
    });
    if (!confirmed) return;

    try {
      await submitDraftLeaveRequest(requestId, user ? { id: user.id } : undefined);
      await loadData();
      await showSuccess(t('hr.leaveSubmittedSuccess', 'Leave request submitted successfully.'));
    } catch (err: unknown) {
      await showError(t('common.error', 'Error'), (err as Error).message || 'Failed to submit draft leave request.');
    }
  };

  const exportStaffCsv = () => {
    const headers = ['Staff Number', 'Full Name', 'Job Title', 'Department', 'Contract Type', 'Status', 'Start Date', 'Email', 'Phone'];
    const rows = filteredStaff.map(s => [
      s.staffNumber || '',
      `"${s.fullName.replace(/"/g, '""')}"`,
      `"${(s.jobTitle || '').replace(/"/g, '""')}"`,
      `"${(s.departmentName || s.departmentId || '').replace(/"/g, '""')}"`,
      s.contractType || '',
      s.employmentStatus || '',
      s.startDate || '',
      s.email || '',
      s.phone || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BAOMS_Staff_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <SkeletonDashboard kpiCount={4} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('hr.title', 'Human Resources & Personnel')}
        subtitle={t(
          'hr.subtitle',
          'Manage organizational staff roster, personnel documents, leave workflows, and contract expirations.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('nav.hr', 'Human Resources') },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={exportStaffCsv}
              className="text-xs"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export Roster (CSV)
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsCreateLeaveOpen(true)}
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              {t('hr.applyForLeave', 'Apply for Leave')}
            </Button>
            {canManageStaff && (
              <Button
                variant="primary"
                onClick={() => navigate('/hr/staff/new')}
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                {t('hr.registerStaff', 'Register Staff')}
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Metric Stat Cards (Unboxed monochrome icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="min-w-0 bg-white border border-surface-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider truncate block">
                {t('hr.totalPersonnel', 'Total Personnel')}
              </span>
              <div className="text-[32px] font-bold text-charcoal-900 leading-[1.2] font-mono tabular-nums truncate">{staffList.length}</div>
              <span className="text-xs text-charcoal-muted truncate block">
                {staffList.filter((s) => !s.userId).length} {t('hr.fieldStaffWithoutLogin', 'field / non-login')}
              </span>
            </div>
            <Users className="h-5 w-5 shrink-0 text-[#374151]" />
          </CardContent>
        </Card>

        <Card className="min-w-0 bg-white border border-surface-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider truncate block">
                {t('hr.activeContracts', 'Active Contracts')}
              </span>
              <div className="text-[32px] font-bold text-charcoal-900 leading-[1.2] font-mono tabular-nums truncate">
                {staffList.filter((s) => s.employmentStatus === 'active').length}
              </div>
              <span className="text-xs text-charcoal-muted truncate block">
                {staffList.filter((s) => s.employmentStatus === 'probation').length} {t('hr.onProbation', 'on probation')}
              </span>
            </div>
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#374151]" />
          </CardContent>
        </Card>

        <Card className="min-w-0 bg-white border border-surface-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider truncate block">
                {t('hr.pendingLeave', 'Pending Leave Requests')}
              </span>
              <div className="text-[32px] font-bold text-charcoal-900 leading-[1.2] font-mono tabular-nums truncate">{pendingRequestsCount}</div>
              <span className="text-xs text-charcoal-muted truncate block">
                {leaveRequests.filter((r) => r.status === 'approved').length} {t('hr.approvedThisYear', 'approved')}
              </span>
            </div>
            <Calendar className="h-5 w-5 shrink-0 text-[#374151]" />
          </CardContent>
        </Card>

        <Card className="min-w-0 bg-white border border-surface-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider truncate block">
                {t('hr.expiringContracts', 'Expiring (< 60 Days)')}
              </span>
              <div className={`text-[32px] font-bold leading-[1.2] font-mono tabular-nums truncate ${expiringStaff.length > 0 ? 'text-rose-700' : 'text-charcoal-900'}`}>
                {expiringStaff.length}
              </div>
              <span className="text-xs text-charcoal-muted truncate block">
                {expiringStaff.filter((s) => s.daysToContractExpiry !== null && s.daysToContractExpiry <= 30).length}{' '}
                {t('hr.criticalExpiring', 'require urgent action')}
              </span>
            </div>
            <Clock className="h-5 w-5 shrink-0 text-[#374151]" />
          </CardContent>
        </Card>
      </div>

      {/* Contract Expiry Reminders Banner */}
      <ContractExpiryAlertsBanner
        expiringStaff={expiringStaff}
        onSelectStaff={(s) => {
          setSelectedStaffForModal(s);
          setIsDetailModalOpen(true);
        }}
      />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
        <button
          onClick={() => setActiveTab('staff')}
          className={`py-2 px-3.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'bg-white dark:bg-slate-900 text-charcoal-900 dark:text-white shadow-xs'
              : 'text-charcoal-muted hover:text-charcoal-800'
          }`}
        >
          <Users className="h-4 w-4" />
          {t('hr.tabStaffDirectory', 'Staff Roster')} ({filteredStaff.length})
        </button>

        <button
          onClick={() => setActiveTab('leave')}
          className={`py-2 px-3.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'leave'
              ? 'bg-white dark:bg-slate-900 text-charcoal-900 dark:text-white shadow-xs'
              : 'text-charcoal-muted hover:text-charcoal-800'
          }`}
        >
          <Calendar className="h-4 w-4" />
          {t('hr.tabLeaveManagement', 'Leave Management')} ({leaveRequests.length})
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`py-2 px-3.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'contracts'
              ? 'bg-white dark:bg-slate-900 text-charcoal-900 dark:text-white shadow-xs'
              : 'text-charcoal-muted hover:text-charcoal-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          {t('hr.tabContractReminders', 'Contract Reminders')} ({expiringStaff.length})
        </button>

        <button
          onClick={() => setActiveTab('checklists')}
          className={`py-2 px-3.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'checklists'
              ? 'bg-white dark:bg-slate-900 text-charcoal-900 dark:text-white shadow-xs'
              : 'text-charcoal-muted hover:text-charcoal-800'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          {t('hr.tabChecklistsOverview', 'Onboarding & Checklists')}
        </button>
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('hr.searchPlaceholder', 'Search staff by name, number, or title...')}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-[#D68904]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-[#D68904]"
              >
                <option value="all">{t('common.allDepartments', 'All Departments')}</option>
                <option value="dept-prj">Projects & Programs</option>
                <option value="dept-fin">Finance & Operations</option>
                <option value="dept-hr">Human Resources</option>
                <option value="dept-exec">Executive Office</option>
                <option value="dept-admin">IT & Administration</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-[#D68904]"
              >
                <option value="all">{t('common.allStatuses', 'All Statuses')}</option>
                <option value="active">Active</option>
                <option value="probation">Probation</option>
                <option value="on_leave">On Leave</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={selectedContract}
                onChange={(e) => setSelectedContract(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-[#D68904]"
              >
                <option value="all">{t('hr.allContracts', 'All Contract Types')}</option>
                <option value="fixed_term">Fixed Term</option>
                <option value="permanent">Permanent</option>
                <option value="consultant">Consultant</option>
                <option value="volunteer">Volunteer</option>
              </select>

              <select
                value={selectedOnboardingStatus}
                onChange={(e) => setSelectedOnboardingStatus(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-[#D68904]"
              >
                <option value="all">All Onboarding Stages</option>
                <option value="pending_hr">Pending HR Dossier</option>
                <option value="pending_finance">Pending Finance / Statutory</option>
                <option value="completed">Fully Onboarded</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-surface-border bg-surface-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">{t('hr.staffMember', 'Personnel')}</th>
                  <th className="py-3 px-4">{t('hr.jobTitle', 'Role & Department')}</th>
                  <th className="py-3 px-4">{t('hr.contractType', 'Contract & Validity')}</th>
                  <th className="py-3 px-4">Onboarding Stage</th>
                  <th className="py-3 px-4">{t('hr.statusCol', 'Status')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-charcoal-muted">
                      <Users className="h-8 w-8 mx-auto text-charcoal-300 mb-2" />
                      {t('hr.noStaffFound', 'No personnel matching the current filter criteria.')}
                    </td>
                  </tr>
                ) : (
                  filteredStaff
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((staff) => (
                    <tr
                      key={staff.id}
                      onClick={() => {
                        setSelectedStaffForModal(staff);
                        setIsDetailModalOpen(true);
                      }}
                      className="hover:bg-surface-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-white text-slate-500 font-bold flex items-center justify-center text-xs border border-slate-200 shrink-0">
                            {staff.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-charcoal-900">{staff.fullName}</div>
                            <div className="text-xs text-charcoal-muted flex items-center gap-1.5">
                              <span>{staff.staffNumber}</span>
                              {!staff.userId && (
                                <span className="text-[10px] bg-surface-muted text-charcoal-500 px-1 rounded">
                                  {t('hr.fieldOnly', 'Field')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-charcoal-900">{staff.jobTitle}</div>
                        <div className="text-xs text-charcoal-muted">{staff.departmentName}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-charcoal-800">
                          {t(`hr.contract.${staff.contractType}`, staff.contractType)}
                        </div>
                        <div className="text-xs">
                          {staff.daysToContractExpiry !== null ? (
                            <span
                              className={`font-semibold ${
                                staff.daysToContractExpiry <= 30
                                  ? 'text-rose-600'
                                  : staff.daysToContractExpiry <= 60
                                  ? 'text-amber-600'
                                  : 'text-charcoal-500'
                              }`}
                            >
                              {staff.daysToContractExpiry <= 0
                                ? t('hr.expired', 'Expired')
                                : `${staff.daysToContractExpiry}d remaining`}
                            </span>
                          ) : (
                            <span className="text-emerald-700">{t('hr.permanent', 'Permanent')}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {staff.onboardingStatus === 'pending_hr' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            Pending HR
                          </span>
                        )}
                        {staff.onboardingStatus === 'pending_finance' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                            <Clock className="h-3.5 w-3.5 text-blue-600" />
                            Pending Finance
                          </span>
                        )}
                        {(!staff.onboardingStatus || staff.onboardingStatus === 'completed') && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Completed
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <StatusIndicator
                          status={staff.employmentStatus}
                          label={t(`hr.status.${staff.employmentStatus}`, staff.employmentStatus)}
                        />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {staff.onboardingStatus === 'pending_hr' && canManageStaff && (
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-amber-700 hover:bg-amber-800 text-white"
                              onClick={() => {
                                setStaffForOnboarding(staff);
                                setIsHrModalOpen(true);
                              }}
                            >
                              Fill Dossier
                            </Button>
                          )}
                          {staff.onboardingStatus === 'pending_finance' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setStaffForOnboarding(staff);
                                setIsStatutoryModalOpen(true);
                              }}
                            >
                              Statutory
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedStaffForModal(staff);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            {t('common.details', 'View')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredStaff.length > pageSize && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredStaff.length / pageSize)}
              totalItems={filteredStaff.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {/* TAB 2: LEAVE MANAGEMENT */}
      {activeTab === 'leave' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-charcoal-500 uppercase">
                {t('common.filterStatus', 'Status')}:
              </span>
              <div className="flex gap-1.5">
                {['all', 'draft', 'pending', 'approved', 'rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedLeaveStatus(st)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      selectedLeaveStatus === st
                        ? 'bg-charcoal-900 text-white'
                        : 'bg-surface-card border border-surface-border text-charcoal-700 hover:bg-surface-muted'
                    }`}
                  >
                    {t(`hr.leaveStatus.${st}`, st.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            <Button size="sm" variant="outline" onClick={() => setIsCreateLeaveOpen(true)}>
              <Calendar className="h-4 w-4 mr-1.5" />
              {t('hr.applyForLeave', 'New Application')}
            </Button>
          </div>

          <div className="rounded-lg border border-surface-border bg-surface-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">{t('hr.requestNumber', 'Request Ref')}</th>
                  <th className="py-3 px-4">{t('hr.applicant', 'Applicant')}</th>
                  <th className="py-3 px-4">{t('hr.leaveType', 'Leave Category')}</th>
                  <th className="py-3 px-4">{t('hr.periodDuration', 'Date Period & Days')}</th>
                  <th className="py-3 px-4">{t('hr.handoverColleague', 'Handover')}</th>
                  <th className="py-3 px-4">{t('hr.statusCol', 'Decision Status')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-charcoal-muted">
                      <Calendar className="h-8 w-8 mx-auto text-charcoal-300 mb-2" />
                      {t('hr.noLeaveRequests', 'No leave applications recorded.')}
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-charcoal-900">{req.requestNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal-900">{req.staffName}</div>
                        <div className="text-xs text-charcoal-muted">{req.staffDepartment}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-charcoal-800">{req.leaveTypeName}</td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-charcoal-800">
                          {req.startDate} &rarr; {req.endDate}
                        </div>
                        <div className="text-xs font-bold text-charcoal-900">
                          {req.daysRequested} {t('hr.days', 'days')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-charcoal-700">
                        {req.handoverStaffName || <span className="text-charcoal-muted italic">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <StatusIndicator status={req.status} label={req.status.toUpperCase()} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {req.status === 'draft' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSubmitDraft(req.id)}
                          >
                            {t('hr.submitAction', 'Submit')}
                          </Button>
                        ) : req.status === 'pending' && canApproveLeave ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedRequestForReview(req);
                              setIsReviewLeaveOpen(true);
                            }}
                          >
                            {t('hr.reviewAction', 'Review')}
                          </Button>
                        ) : (
                          <span className="text-xs text-charcoal-muted">
                            {req.decisionByName ? `By ${req.decisionByName}` : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONTRACT EXPIRY REMINDERS */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-surface-border bg-surface-muted/20">
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
              {t('hr.contractExpiryGovernance', 'Contract Expiry & Compliance Monitoring')}
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              {t(
                'hr.contractExpiryDesc',
                'Per Tanzanian labor regulations and BAOMS administrative policy, contract renewals or exit clearances must be initiated at least 30 to 60 days before contract maturity.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expiringStaff.map((staff) => {
              const isUrgent = staff.daysToContractExpiry !== null && staff.daysToContractExpiry <= 30;
              return (
                <div
                  key={staff.id}
                  className={`p-4 rounded-xl border bg-surface-card space-y-3 ${
                    isUrgent ? 'border-rose-300 ring-1 ring-rose-200' : 'border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-charcoal-900">{staff.fullName}</h4>
                      <p className="text-xs text-charcoal-muted">
                        {staff.jobTitle} • {staff.departmentName}
                      </p>
                    </div>
                    <Badge variant={isUrgent ? 'danger' : 'warning'} withDot>
                      {staff.daysToContractExpiry !== null && staff.daysToContractExpiry <= 0
                        ? t('hr.expired', 'Expired')
                        : `${staff.daysToContractExpiry}d remaining`}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-surface-border">
                    <span className="text-charcoal-muted">
                      {t('hr.contractExpiryDate', 'Maturity Date')}: <strong className="text-charcoal-900">{staff.endDate}</strong>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedStaffForModal(staff);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      {t('hr.viewRecord', 'Review Record')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ONBOARDING & CHECKLISTS OVERVIEW */}
      {activeTab === 'checklists' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-surface-border bg-surface-muted/20">
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2 mb-1">
              <ClipboardList className="h-4 w-4 text-[#374151]" />
              {t('hr.checklistsGovernance', 'Personnel Onboarding & Offboarding Lifecycle')}
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              {t(
                'hr.checklistsDesc',
                'Ensures all statutory requirements, child safeguarding policies, equipment allocations, and exit clearance tasks are systematically completed.'
              )}
            </p>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">{t('hr.staffMember', 'Staff Member')}</th>
                  <th className="py-3 px-4">{t('hr.jobTitle', 'Role')}</th>
                  <th className="py-3 px-4">{t('hr.employmentStatus', 'Status')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-charcoal-900">{staff.fullName}</td>
                    <td className="py-3 px-4 text-charcoal-700">{staff.jobTitle}</td>
                    <td className="py-3 px-4">
                      <StatusIndicator
                        status={staff.employmentStatus}
                        label={t(`hr.status.${staff.employmentStatus}`, staff.employmentStatus)}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStaffForModal(staff);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        {t('hr.openChecklist', 'Open Checklist')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <StaffDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedStaffForModal(null);
        }}
        staff={selectedStaffForModal}
        onStaffUpdated={loadData}
      />

      <CreateStaffModal
        isOpen={isCreateStaffOpen}
        onClose={() => setIsCreateStaffOpen(false)}
        existingStaff={staffList}
        onStaffCreated={() => loadData()}
      />

      <CreateLeaveRequestModal
        isOpen={isCreateLeaveOpen}
        onClose={() => setIsCreateLeaveOpen(false)}
        staffList={staffList}
        onRequestCreated={() => loadData()}
      />

      <ReviewLeaveModal
        isOpen={isReviewLeaveOpen}
        onClose={() => {
          setIsReviewLeaveOpen(false);
          setSelectedRequestForReview(null);
        }}
        request={selectedRequestForReview}
        staffList={staffList}
        onReviewCompleted={() => loadData()}
      />

      <CompleteHrOnboardingModal
        isOpen={isHrModalOpen}
        onClose={() => {
          setIsHrModalOpen(false);
          setStaffForOnboarding(null);
        }}
        staff={staffForOnboarding}
        onSuccess={loadData}
      />

      <CompleteStatutoryModal
        isOpen={isStatutoryModalOpen}
        onClose={() => {
          setIsStatutoryModalOpen(false);
          setStaffForOnboarding(null);
        }}
        staff={staffForOnboarding}
        onSuccess={loadData}
      />
    </div>
  );
};
