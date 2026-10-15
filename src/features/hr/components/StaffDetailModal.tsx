import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StaffProfileRecord,
  StaffDocumentRecord,
  LeaveBalanceRecord,
  StaffChecklistRecord,
} from '../types/hr';
import {
  getStaffById,
  getStaffDocuments,
  getLeaveBalances,
  getStaffChecklist,
  toggleChecklistItem,
} from '../services/hrService';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CompleteHrOnboardingModal } from './CompleteHrOnboardingModal';
import { CompleteStatutoryModal } from './CompleteStatutoryModal';
import {
  X,
  User,
  Briefcase,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Square,
  ShieldCheck,
  BookOpen,
  Building2,
  Edit2,
  Clock,
} from 'lucide-react';

interface StaffDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffProfileRecord | null;
  onStaffUpdated?: () => void;
}

export const StaffDetailModal: React.FC<StaffDetailModalProps> = ({
  isOpen,
  onClose,
  staff,
  onStaffUpdated,
}) => {
  const { t } = useTranslation();
  const { user, profile, hasRole, hasPermission, isAdmin } = useAuth();
  const [currentStaff, setCurrentStaff] = useState<StaffProfileRecord | null>(staff);
  const [activeTab, setActiveTab] = useState<'overview' | 'dossier' | 'statutory' | 'leave' | 'documents' | 'checklists'>('overview');
  const [documents, setDocuments] = useState<StaffDocumentRecord[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceRecord[]>([]);
  const [checklist, setChecklist] = useState<StaffChecklistRecord[]>([]);
  const [checklistType, setChecklistType] = useState<'onboarding' | 'offboarding'>('onboarding');

  // Sub-modal triggers
  const [isHrModalOpen, setIsHrModalOpen] = useState(false);
  const [isStatutoryModalOpen, setIsStatutoryModalOpen] = useState(false);

  // Role permissions
  const isHrOrAdmin =
    hasRole('hr_administrator') ||
    hasRole('system_admin') ||
    hasPermission('hr.view') ||
    isAdmin();

  const isFinanceOrAdmin =
    hasRole('finance_officer') ||
    hasRole('hr_administrator') ||
    hasRole('system_admin') ||
    hasPermission('finance.view') ||
    isAdmin();

  useEffect(() => {
    setCurrentStaff(staff);
  }, [staff]);

  useEffect(() => {
    if (!isOpen || !currentStaff) return;

    const loadDetails = async (staffId: string) => {
      try {
        const [docs, balances, chk] = await Promise.all([
          getStaffDocuments(staffId),
          getLeaveBalances(staffId),
          getStaffChecklist(staffId, checklistType),
        ]);
        setDocuments(docs);
        setLeaveBalances(balances);
        setChecklist(chk);
      } catch (err) {
        console.error(err);
      }
    };

    loadDetails(currentStaff.id);
  }, [isOpen, currentStaff?.id, checklistType]);

  const refreshStaffData = async () => {
    if (!currentStaff) return;
    try {
      const refreshed = await getStaffById(currentStaff.id);
      if (refreshed) {
        setCurrentStaff(refreshed);
      }
      onStaffUpdated?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleChecklist = async (item: StaffChecklistRecord) => {
    try {
      await toggleChecklistItem(
        item.id,
        !item.isCompleted,
        { id: user?.id || 'sys-admin', displayName: profile?.display_name || 'HR Administrator' }
      );
      if (currentStaff) {
        const updated = await getStaffChecklist(currentStaff.id, checklistType);
        setChecklist(updated);
        onStaffUpdated?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen || !currentStaff) return null;

  const initials = currentStaff.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'probation':
        return 'warning';
      case 'on_leave':
        return 'info';
      case 'suspended':
      case 'terminated':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getOnboardingBadge = (status?: string) => {
    switch (status) {
      case 'pending_hr':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            Pending HR Dossier
          </span>
        );
      case 'pending_finance':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            Pending Finance / Statutory
          </span>
        );
      case 'completed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Fully Onboarded
          </span>
        );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs font-sans">
        <div className="relative w-full max-w-4xl bg-surface-card rounded-lg border border-surface-border flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header - Flat, Zero Shadow */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white text-slate-500 font-bold flex items-center justify-center text-lg border border-slate-200 shrink-0">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-charcoal-900">{currentStaff.fullName}</h2>
                  <Badge variant={getStatusVariant(currentStaff.employmentStatus)} withDot>
                    {t(`hr.status.${currentStaff.employmentStatus}`, currentStaff.employmentStatus)}
                  </Badge>
                  <Badge variant="info">
                    {t(`hr.contract.${currentStaff.contractType}`, currentStaff.contractType)}
                  </Badge>
                  {getOnboardingBadge(currentStaff.onboardingStatus)}
                </div>
                <p className="text-xs text-charcoal-muted mt-0.5 tabular-nums">
                  {currentStaff.staffNumber} • {currentStaff.jobTitle} • {currentStaff.departmentName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-charcoal-muted hover:text-charcoal-800 hover:bg-surface-muted rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Onboarding Pipeline Action Banners */}
          {currentStaff.onboardingStatus === 'pending_hr' && (
            <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <strong>HR Action Required:</strong> User account created. HR personnel dossier (DOB, NIDA, TIN, Salary, CV & Certifications) is pending completion.
                </span>
              </div>
              {isHrOrAdmin && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsHrModalOpen(true)}
                  className="shrink-0 self-start sm:self-auto bg-amber-700 hover:bg-amber-800 text-white"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  Complete HR Dossier
                </Button>
              )}
            </div>
          )}

          {currentStaff.onboardingStatus === 'pending_finance' && (
            <div className="px-6 py-2.5 bg-blue-50 border-b border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium text-blue-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Finance Action Required:</strong> HR dossier recorded. Statutory enrollments (CWT, NSSF, PSSF, NHIF, Bank) require verification.
                </span>
              </div>
              {isFinanceOrAdmin && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsStatutoryModalOpen(true)}
                  className="shrink-0 self-start sm:self-auto"
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  Complete Statutory Records
                </Button>
              )}
            </div>
          )}

          {/* Contract Expiry Warning Banner */}
          {currentStaff.daysToContractExpiry !== null && currentStaff.daysToContractExpiry <= 60 && (
            <div
              className={`px-6 py-2 flex items-center gap-3 text-xs font-medium border-b ${
                currentStaff.daysToContractExpiry <= 30
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                {currentStaff.daysToContractExpiry <= 0
                  ? t('hr.contractExpiredMsg', 'Notice: Contract expired on {{date}}.', { date: currentStaff.endDate })
                  : t('hr.contractExpiringMsg', 'Contract Renewal Reminder: Contract expires in {{days}} days ({{date}}).', {
                      days: currentStaff.daysToContractExpiry,
                      date: currentStaff.endDate,
                    })}
              </span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center px-6 border-b border-surface-border bg-surface-card gap-4 sm:gap-6 overflow-x-auto text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'border-forest-600 text-forest-700 font-bold'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal-800'
              }`}
            >
              Overview & Profile
            </button>
            <button
              onClick={() => setActiveTab('dossier')}
              className={`py-3 font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'dossier'
                  ? 'border-forest-600 text-forest-700 font-bold'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal-800'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              HR Dossier & Certs
            </button>
            <button
              onClick={() => setActiveTab('statutory')}
              className={`py-3 font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'statutory'
                  ? 'border-forest-600 text-forest-700 font-bold'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal-800'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Statutory & Payroll
            </button>
            <button
              onClick={() => setActiveTab('leave')}
              className={`py-3 font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'leave'
                  ? 'border-forest-600 text-forest-700 font-bold'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal-800'
              }`}
            >
              {t('hr.tabLeaveBalances', 'Leave Balances')} ({leaveBalances.length})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'documents'
                  ? 'border-forest-600 text-forest-700 font-bold'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal-800'
              }`}
            >
              {t('hr.tabDocuments', 'Documents')} ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab('checklists')}
              className={`py-3 font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'checklists'
                  ? 'border-forest-600 text-forest-700 font-bold'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal-800'
              }`}
            >
              Checklists
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* TAB 1: OVERVIEW & GENERAL PROFILE */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Official Contact & Identity Card */}
                <div className="rounded-lg border border-surface-border bg-surface-muted/20 p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4 text-forest-600" />
                    Identity & Organization Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b border-surface-border/50">
                      <span className="text-charcoal-muted">Full Legal Names</span>
                      <span className="font-semibold text-charcoal-900">{currentStaff.fullName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-surface-border/50">
                      <span className="text-charcoal-muted">Staff Number</span>
                      <span className="font-semibold text-charcoal-900 tabular-nums">{currentStaff.staffNumber}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-surface-border/50">
                      <span className="text-charcoal-muted">Position / Job Title</span>
                      <span className="font-medium text-charcoal-900">{currentStaff.jobTitle}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-surface-border/50">
                      <span className="text-charcoal-muted">Department</span>
                      <span className="font-medium text-charcoal-900">{currentStaff.departmentName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-surface-border/50">
                      <span className="text-charcoal-muted">Direct Supervisor</span>
                      <span className="font-medium text-charcoal-900">{currentStaff.supervisorName || 'Executive Director'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-charcoal-muted">BAOMS System Access</span>
                      <span className="font-medium">
                        {currentStaff.userId ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active Authenticated User
                          </span>
                        ) : (
                          <span className="text-charcoal-muted italic">Field Staff (No Direct Access)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contract & Validity Details */}
                <div className="rounded-lg border border-surface-border bg-surface-muted/20 p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-forest-600" />
                    Contract & Validity
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b border-surface-border/50">
                      <span className="text-charcoal-muted">Contract Type</span>
                      <span className="font-semibold text-charcoal-900">
                        {t(`hr.contract.${currentStaff.contractType}`, currentStaff.contractType)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-surface-border/50">
                      <span className="text-charcoal-muted">Contract Start Date</span>
                      <span className="font-medium text-charcoal-900 tabular-nums">{currentStaff.startDate}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-surface-border/50">
                      <span className="text-charcoal-muted">Contract End Date</span>
                      <span className="font-medium text-charcoal-900 tabular-nums">
                        {currentStaff.endDate || 'Permanent / Open-Ended'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-charcoal-muted">Contract Status</span>
                      <span className="font-medium">
                        {currentStaff.daysToContractExpiry !== null ? (
                          <span
                            className={`font-semibold tabular-nums ${
                              currentStaff.daysToContractExpiry <= 30
                                ? 'text-rose-600'
                                : currentStaff.daysToContractExpiry <= 60
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {currentStaff.daysToContractExpiry} days remaining
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">Permanent Service</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verified Contact Details */}
                <div className="rounded-lg border border-surface-border bg-surface-muted/20 p-4 space-y-3 md:col-span-2">
                  <h3 className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider flex items-center gap-2">
                    <Phone className="h-4 w-4 text-forest-600" />
                    Verified Contact Channels
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-charcoal-800">
                        <Mail className="h-4 w-4 text-forest-600 shrink-0" />
                        <div>
                          <span className="text-xs text-charcoal-muted block">Official Office Email</span>
                          <span className="font-medium font-mono text-xs">{currentStaff.officialEmail || currentStaff.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-charcoal-800">
                        <Mail className="h-4 w-4 text-charcoal-muted shrink-0" />
                        <div>
                          <span className="text-xs text-charcoal-muted block">Personal Email</span>
                          <span className="font-medium font-mono text-xs">{currentStaff.personalEmail || currentStaff.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-charcoal-800">
                        <Phone className="h-4 w-4 text-forest-600 shrink-0" />
                        <div>
                          <span className="text-xs text-charcoal-muted block">Personal Phone Number</span>
                          <span className="font-medium tabular-nums">{currentStaff.phoneNumber || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 bg-surface-card p-3 rounded-md border border-surface-border">
                      <span className="text-xs text-charcoal-muted font-medium uppercase">
                        Emergency Contact / Next of Kin:
                      </span>
                      <p className="font-semibold text-charcoal-900">{currentStaff.emergencyContactName || 'None Listed'}</p>
                      <p className="text-xs text-charcoal-600 tabular-nums">{currentStaff.emergencyContactPhone || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HR DOSSIER & CERTIFICATIONS */}
            {activeTab === 'dossier' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-forest-600" />
                      HR Confidential Personnel Dossier
                    </h3>
                    <p className="text-xs text-charcoal-muted">
                      Official birth records, NIDA, TIN, Higher Education Loan Board status, salary scale, CV, and verified qualifications.
                    </p>
                  </div>
                  {isHrOrAdmin && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setIsHrModalOpen(true)}
                      className="shrink-0"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Update HR Dossier
                    </Button>
                  )}
                </div>

                {/* Identity & Legal Identifiers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/20 space-y-1">
                    <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                      Date of Birth (DOB)
                    </span>
                    <span className="text-sm font-bold text-charcoal-900 tabular-nums">
                      {currentStaff.dateOfBirth || <span className="text-charcoal-muted font-normal italic">Pending HR Entry</span>}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/20 space-y-1">
                    <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                      NIDA Number (National ID)
                    </span>
                    <span className="text-sm font-bold text-charcoal-900 font-mono tracking-wider">
                      {currentStaff.nidaNumber || <span className="text-charcoal-muted font-normal italic font-sans">Pending HR Entry</span>}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/20 space-y-1">
                    <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                      TIN Number (TRA Taxpayer)
                    </span>
                    <span className="text-sm font-bold text-charcoal-900 font-mono">
                      {currentStaff.tinNumber || <span className="text-charcoal-muted font-normal italic font-sans">Pending HR Entry</span>}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/20 space-y-1">
                    <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                      Basic Salary (TZS / Month)
                    </span>
                    <span className="text-sm font-bold text-charcoal-900 tabular-nums">
                      {currentStaff.basicSalary
                        ? `TZS ${currentStaff.basicSalary.toLocaleString()}`
                        : <span className="text-charcoal-muted font-normal italic">Not Disclosed / Pending</span>}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/20 space-y-1">
                    <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                      Gross Salary (TZS / Month)
                    </span>
                    <span className="text-sm font-bold text-charcoal-900 tabular-nums">
                      {currentStaff.grossSalary
                        ? `TZS ${currentStaff.grossSalary.toLocaleString()}`
                        : <span className="text-charcoal-muted font-normal italic">Not Disclosed / Pending</span>}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/20 space-y-1">
                    <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                      HESLB Loan Board Status
                    </span>
                    <span className="text-xs font-bold text-charcoal-900 capitalize block">
                      {currentStaff.loanBoardStatus
                        ? currentStaff.loanBoardStatus.replace(/_/g, ' ')
                        : 'Not Specified'}
                    </span>
                    {currentStaff.loanBoardDetails && (
                      <span className="text-[11px] text-charcoal-muted block">{currentStaff.loanBoardDetails}</span>
                    )}
                  </div>
                </div>

                {/* Curriculum Vitae (CV) Section */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-card space-y-2">
                  <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-forest-600" />
                    Curriculum Vitae (CV)
                  </span>
                  {currentStaff.cvName ? (
                    <div className="flex items-center justify-between p-3 rounded-md bg-surface-muted/30 border border-surface-border">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-forest-700 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-charcoal-900">{currentStaff.cvName}</p>
                          <p className="text-xs text-charcoal-muted">Institutional Personnel CV • Verified Official Copy</p>
                        </div>
                      </div>
                      <Badge variant="success">Verified File</Badge>
                    </div>
                  ) : (
                    <div className="text-xs text-charcoal-muted italic p-3 bg-surface-muted/20 rounded-md border border-surface-border">
                      No CV file uploaded for this staff member yet. HR may attach a document during dossier review.
                    </div>
                  )}
                </div>

                {/* Professional Certifications & Diplomas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-forest-600" />
                      Professional Certifications & Diplomas ({(currentStaff.certifications || []).length})
                    </h4>
                  </div>

                  {(currentStaff.certifications || []).length === 0 ? (
                    <div className="text-center py-6 text-charcoal-muted text-xs border border-surface-border rounded-lg bg-surface-muted/10">
                      No verified certifications or educational credentials recorded.
                    </div>
                  ) : (
                    <div className="rounded-lg border border-surface-border overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-muted/60 text-charcoal-600 font-semibold border-b border-surface-border">
                          <tr>
                            <th className="py-2.5 px-3">Certification / Qualification</th>
                            <th className="py-2.5 px-3">Institution / Board</th>
                            <th className="py-2.5 px-3">Year</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {currentStaff.certifications!.map((cert) => (
                            <tr key={cert.id} className="hover:bg-surface-muted/20">
                              <td className="py-2.5 px-3 font-semibold text-charcoal-900 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-forest-600 shrink-0" />
                                {cert.name}
                              </td>
                              <td className="py-2.5 px-3 text-charcoal-700">{cert.institution}</td>
                              <td className="py-2.5 px-3 tabular-nums text-charcoal-600">{cert.year}</td>
                              <td className="py-2.5 px-3 text-right">
                                {cert.verified ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Verified
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-amber-700">Pending Check</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: STATUTORY & SOCIAL PROTECTION / PAYROLL */}
            {activeTab === 'statutory' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-forest-600" />
                      Statutory Compliance, Social Protection & Banking
                    </h3>
                    <p className="text-xs text-charcoal-muted">
                      Administered jointly with Finance Office: CWT, NSSF/PSSF pension funds, NHIF health insurance, and banking disbursement.
                    </p>
                  </div>
                  {isFinanceOrAdmin && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setIsStatutoryModalOpen(true)}
                      className="shrink-0"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Update Statutory Details
                    </Button>
                  )}
                </div>

                {/* Statutory Funds Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/20 space-y-1">
                    <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                      CWT Number (Union)
                    </span>
                    <span className="text-sm font-bold text-charcoal-900 font-mono">
                      {currentStaff.cwtNumber || <span className="text-charcoal-muted font-normal italic font-sans text-xs">Not Enrolled / N/A</span>}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/20 space-y-1">
                    <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                      NSSF Number (Pension)
                    </span>
                    <span className="text-sm font-bold text-charcoal-900 font-mono">
                      {currentStaff.nssfNumber || <span className="text-charcoal-muted font-normal italic font-sans text-xs">Pending Finance</span>}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/20 space-y-1">
                    <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                      PSSF Number (Public)
                    </span>
                    <span className="text-sm font-bold text-charcoal-900 font-mono">
                      {currentStaff.pssfNumber || <span className="text-charcoal-muted font-normal italic font-sans text-xs">Not Enrolled / N/A</span>}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/20 space-y-1">
                    <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                      NHIF Number (Health)
                    </span>
                    <span className="text-sm font-bold text-charcoal-900 font-mono">
                      {currentStaff.nhifNumber || <span className="text-charcoal-muted font-normal italic font-sans text-xs">Pending Finance</span>}
                    </span>
                  </div>
                </div>

                {/* Banking & Remittance Details */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-card space-y-3">
                  <h4 className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-forest-600" />
                    Salary Remittance & Banking Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 rounded-md bg-surface-muted/30 border border-surface-border">
                      <span className="text-charcoal-muted block mb-0.5">Commercial Bank</span>
                      <span className="text-sm font-bold text-charcoal-900">{currentStaff.bankName || 'Not recorded'}</span>
                    </div>
                    <div className="p-3 rounded-md bg-surface-muted/30 border border-surface-border">
                      <span className="text-charcoal-muted block mb-0.5">Account Number</span>
                      <span className="text-sm font-bold text-charcoal-900 font-mono tracking-wider">
                        {currentStaff.bankAccountNumber || 'Not recorded'}
                      </span>
                    </div>
                    <div className="p-3 rounded-md bg-surface-muted/30 border border-surface-border">
                      <span className="text-charcoal-muted block mb-0.5">Branch Location</span>
                      <span className="text-sm font-bold text-charcoal-900">{currentStaff.bankBranch || 'Main Branch'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: LEAVE BALANCES */}
            {activeTab === 'leave' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {leaveBalances.map((bal) => (
                    <div
                      key={bal.id}
                      className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-charcoal-700 uppercase">{bal.leaveTypeName}</span>
                        <span className="text-xs font-bold text-forest-700 tabular-nums">
                          {bal.year}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-2xl font-extrabold text-charcoal-900 tabular-nums">{bal.remainingDays}</span>
                        <span className="text-xs text-charcoal-muted tabular-nums">
                          {t('hr.ofDaysAllocated', 'of {{total}} days', { total: bal.allocatedDays })}
                        </span>
                      </div>
                      <div className="w-full bg-surface-border rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-forest-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (bal.usedDays / bal.allocatedDays) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-charcoal-muted pt-1 tabular-nums">
                        <span>{t('hr.used', 'Used')}: {bal.usedDays}d</span>
                        <span>{t('hr.pending', 'Pending')}: {bal.pendingDays}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: PERSONNEL DOCUMENTS */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                {documents.length === 0 ? (
                  <div className="text-center py-10 text-charcoal-muted text-sm border border-surface-border rounded-lg bg-surface-muted/10">
                    <FileText className="h-8 w-8 mx-auto text-charcoal-300 mb-2" />
                    {t('hr.noDocuments', 'No personnel documents uploaded for this staff member yet.')}
                  </div>
                ) : (
                  <div className="rounded-lg border border-surface-border overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                        <tr>
                          <th className="py-2.5 px-4">{t('hr.documentTitle', 'Document Name')}</th>
                          <th className="py-2.5 px-4">{t('hr.documentType', 'Category')}</th>
                          <th className="py-2.5 px-4">{t('hr.verifiedBy', 'Verified By')}</th>
                          <th className="py-2.5 px-4 text-right">{t('common.actions', 'Action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {documents.map((doc) => (
                          <tr key={doc.id} className="hover:bg-surface-muted/30">
                            <td className="py-3 px-4 font-medium text-charcoal-900 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-forest-600 shrink-0" />
                              <div>
                                <div>{doc.documentTitle}</div>
                                <div className="text-xs text-charcoal-muted tabular-nums">{doc.documentNumber}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="default">{doc.documentType}</Badge>
                            </td>
                            <td className="py-3 px-4 text-xs text-charcoal-600">
                              {doc.verifiedByName || t('common.pending', 'Pending verification')}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button size="sm" variant="ghost">
                                {t('common.view', 'View')}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: ONBOARDING & CHECKLISTS */}
            {activeTab === 'checklists' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChecklistType('onboarding')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        checklistType === 'onboarding'
                          ? 'bg-forest-700 text-white'
                          : 'bg-surface-muted text-charcoal-700 hover:bg-surface-border'
                      }`}
                    >
                      {t('hr.onboardingChecklist', 'Onboarding Checklist')}
                    </button>
                    <button
                      onClick={() => setChecklistType('offboarding')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        checklistType === 'offboarding'
                          ? 'bg-forest-700 text-white'
                          : 'bg-surface-muted text-charcoal-700 hover:bg-surface-border'
                      }`}
                    >
                      {t('hr.offboardingChecklist', 'Offboarding Checklist')}
                    </button>
                  </div>
                  <span className="text-xs text-charcoal-muted tabular-nums">
                    {checklist.filter((i) => i.isCompleted).length} of {checklist.length} {t('hr.tasksCompleted', 'completed')}
                  </span>
                </div>

                <div className="space-y-2">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(item)}
                      className="p-3 rounded-lg border border-surface-border bg-surface-card hover:bg-surface-muted/20 flex items-start gap-3 cursor-pointer transition-colors"
                    >
                      <button type="button" className="mt-0.5 text-forest-700 focus:outline-hidden">
                        {item.isCompleted ? (
                          <CheckSquare className="h-5 w-5 text-forest-700" />
                        ) : (
                          <Square className="h-5 w-5 text-charcoal-400" />
                        )}
                      </button>
                      <div className="flex-1 text-sm">
                        <p className={`font-medium ${item.isCompleted ? 'line-through text-charcoal-muted' : 'text-charcoal-900'}`}>
                          {item.titleEn}
                        </p>
                        <p className="text-xs text-charcoal-muted">{item.titleSw}</p>
                        {item.isCompleted && item.completedByName && (
                          <p className="text-xs text-emerald-700 mt-1">
                            ✓ {t('hr.completedBy', 'Completed by')} {item.completedByName} on {new Date(item.completedAt!).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end px-6 py-4 border-t border-surface-border bg-surface-muted/20">
            <Button variant="outline" size="sm" onClick={onClose}>
              {t('common.close', 'Close')}
            </Button>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <CompleteHrOnboardingModal
        isOpen={isHrModalOpen}
        onClose={() => setIsHrModalOpen(false)}
        staff={currentStaff}
        onSuccess={refreshStaffData}
      />

      <CompleteStatutoryModal
        isOpen={isStatutoryModalOpen}
        onClose={() => setIsStatutoryModalOpen(false)}
        staff={currentStaff}
        onSuccess={refreshStaffData}
      />
    </>
  );
};
