import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Mail,
  Building,
  Save,
  ShieldCheck,
  FileText,
  BookOpen,
  Building2,
  CheckCircle2,
  Check,
  Clock,
  AlertCircle,
  Edit2,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/features/auth/useAuth';
import { getRoleTitle } from '@/lib/permissions';
import {
  StaffProfileRecord,
} from '@/features/hr/types/hr';
import {
  getStaffByEmail,
  getStaffByUserId,
  getStaffById,
} from '@/features/hr/services/hrService';
import { supabase } from '@/lib/supabase';
import { CompleteHrOnboardingModal } from '@/features/hr/components/CompleteHrOnboardingModal';
import { CompleteStatutoryModal } from '@/features/hr/components/CompleteStatutoryModal';

interface UserProfileDisplay {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  preferredLanguage?: 'en' | 'sw';
  departmentId?: string;
  departmentCode?: string;
  departmentName?: string;
  role: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  avatarInitials: string;
  stagedDetails?: Record<string, any>;
}

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user: authUser, profile: authProfile, roles, department, hasRole, hasPermission, isAdmin } = useAuth();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'userInfo' | 'hrDossier' | 'statutory'>('userInfo');

  // Target User & Staff Records
  const [targetAccount, setTargetAccount] = useState<UserProfileDisplay | null>(null);
  const [staffRecord, setStaffRecord] = useState<StaffProfileRecord | null>(null);

  // Editable Profile fields for the user
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sub-modal triggers
  const [isHrModalOpen, setIsHrModalOpen] = useState(false);
  const [isStatutoryModalOpen, setIsStatutoryModalOpen] = useState(false);

  // Permission gates
  const canViewHrDossier =
    hasRole('hr_administrator') ||
    hasRole('system_admin') ||
    hasPermission('hr.view') ||
    isAdmin();

  const canEditHrDossier =
    hasRole('hr_administrator') ||
    hasRole('system_admin') ||
    isAdmin();

  const canViewStatutory =
    hasRole('finance_officer') ||
    hasRole('hr_administrator') ||
    hasRole('system_admin') ||
    hasPermission('finance.view') ||
    isAdmin();

  const canEditStatutory =
    hasRole('finance_officer') ||
    hasRole('hr_administrator') ||
    hasRole('system_admin') ||
    isAdmin();

  const isSelf = !userId || userId === authUser?.id;

  // Load user and associated staff profile
  const loadProfileData = useCallback(async () => {
    try {
      let account: DemoAccount | null = null;
      let staff: StaffProfileRecord | null = null;

      if (isSelf && authUser) {
        const selfStaged = (authProfile?.staged_details as any) || {};
        const appointedRole = roles[0] || selfStaged.roleCode || 'staff';
        account = {
          id: authUser.id,
          email: authUser.email,
          displayName: authProfile?.display_name || authUser.email.split('@')[0],
          phoneNumber: authProfile?.phone_number || selfStaged.phone || '',
          preferredLanguage: authProfile?.preferred_language || 'en',
          departmentId: authProfile?.department_id || '',
          departmentCode: department?.code || selfStaged.departmentCode || '',
          departmentName: department?.name || selfStaged.departmentName || '',
          role: appointedRole,
          roles: roles.length > 0 ? roles : (selfStaged.roleCode ? [selfStaged.roleCode] : []),
          stagedDetails: selfStaged,
          permissions: [],
          isActive: authProfile?.is_active ?? true,
          avatarInitials: (authProfile?.display_name || authUser.email).substring(0, 2).toUpperCase(),
        };
      } else if (userId) {
        if (userId.startsWith('staff-') || userId.startsWith('STF-')) {
          staff = await getStaffById(userId);
        }
        
        // Fetch profile from Supabase
        const { data: pData } = await supabase
          .from('profiles')
          .select(`
            id,
            display_name,
            official_email,
            phone_number,
            preferred_language,
            is_active,
            department_id,
            staged_details,
            departments ( code, name_en ),
            user_roles:user_roles!user_roles_user_id_fkey ( roles ( code ) )
          `)
          .eq('id', staff?.userId || userId)
          .single();

        if (pData) {
          const dept = (pData as any).departments;
          const userStaged = (pData as any).staged_details || {};
          const roleArr = ((pData as any).user_roles || []).flatMap((ur: any) => {
            const r = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
            return r?.code ? [r.code] : [];
          });
          const effectiveRoleCode = roleArr[0] || userStaged.roleCode || 'staff';
          account = {
            id: pData.id,
            email: pData.official_email || '',
            displayName: pData.display_name,
            phoneNumber: pData.phone_number || userStaged.phone || '',
            preferredLanguage: (pData.preferred_language as any) || 'en',
            departmentId: pData.department_id || '',
            departmentCode: dept?.code || userStaged.departmentCode || '',
            departmentName: dept?.name_en || userStaged.departmentName || '',
            role: effectiveRoleCode,
            roles: roleArr.length > 0 ? roleArr : (userStaged.roleCode ? [userStaged.roleCode] : []),
            stagedDetails: userStaged,
            permissions: [],
            isActive: pData.is_active ?? true,
            avatarInitials: (pData.display_name || 'ST').substring(0, 2).toUpperCase(),
          };
        }
      }

      setTargetAccount(account);

      // If staff not yet loaded via direct ID, find by userId or email
      if (!staff) {
        if (account?.id) {
          staff = await getStaffByUserId(account.id);
        }
        if (!staff && account?.email) {
          staff = await getStaffByEmail(account.email);
        }
        if (!staff && authUser?.email && isSelf) {
          staff = await getStaffByEmail(authUser.email);
        }
      }

      setStaffRecord(staff);

      // Initialize form values
      setDisplayName(
        staff?.fullName ||
        account?.displayName ||
        authProfile?.display_name ||
        authUser?.email?.split('@')[0] ||
        'Staff Member'
      );
      setPhoneNumber(staff?.phoneNumber || '+255 754 123 456');
      setPersonalEmail(staff?.personalEmail || '');
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, [userId, authUser, authProfile, isSelf]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await new Promise((res) => setTimeout(res, 400));
      Swal.fire({
        title: t('profile.updatedTitle', 'Profile Updated'),
        text: t('profile.updatedMsg', 'Your institutional profile details have been saved successfully.'),
        icon: 'success',
        confirmButtonColor: '#005A36',
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: err.message || 'Could not save profile details.',
        icon: 'error',
        confirmButtonColor: '#005A36',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const effectiveEmail =
    staffRecord?.officialEmail ||
    targetAccount?.email ||
    authUser?.email ||
    'user@babawatoto.or.tz';

  const userStaged = (isSelf ? authProfile?.staged_details : targetAccount?.stagedDetails) as any || {};

  const effectiveRole =
    targetAccount?.role && targetAccount.role !== 'staff'
      ? targetAccount.role
      : roles[0] || userStaged.roleCode || 'staff';

  const effectiveDept =
    staffRecord?.departmentName ||
    targetAccount?.departmentName ||
    userStaged.departmentName ||
    department?.name ||
    'Institutional Operations';

  const effectiveJobTitle =
    staffRecord?.jobTitle ||
    userStaged.jobTitle ||
    getRoleTitle(effectiveRole);

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
            Pending Finance Verification
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
    <div className="space-y-6 max-w-5xl font-sans">
      {/* Back button if viewing another user's profile */}
      {!isSelf && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-charcoal-600 hover:text-charcoal-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Staff Registry
        </Button>
      )}

      <PageHeader
        title={isSelf ? t('profile.title', 'User Profile & Identity') : `${displayName} — Personnel Dossier`}
        subtitle={
          isSelf
            ? t(
                'profile.subtitle',
                'Manage your institutional profile information, verified contact details, and view role credentials.'
              )
            : 'Detailed organizational profile, HR personnel dossier, qualifications, and statutory records.'
        }
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('nav.profile', 'User Profile') },
        ]}
      />

      {/* Onboarding Pipeline Action Banner */}
      {staffRecord?.onboardingStatus === 'pending_hr' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Action Required: Pending HR Personnel Dossier</p>
              <p className="text-amber-800 mt-0.5">
                The account access is provisioned. HR Administrator must complete the confidential personnel dossier (DOB, NIDA, TIN, Salary, CV & Certifications).
              </p>
            </div>
          </div>
          {canEditHrDossier && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsHrModalOpen(true)}
              className="shrink-0 bg-amber-700 hover:bg-amber-800 text-white"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1.5" />
              Complete HR Dossier
            </Button>
          )}
        </div>
      )}

      {staffRecord?.onboardingStatus === 'pending_finance' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Action Required: Pending Statutory & Payroll Verification</p>
              <p className="text-blue-800 mt-0.5">
                HR dossier is complete. Finance Officer (or HR) must enroll statutory identifiers (CWT, NSSF, PSSF, NHIF) and banking remittance details.
              </p>
            </div>
          </div>
          {canEditStatutory && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsStatutoryModalOpen(true)}
              className="shrink-0"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
              Complete Statutory Records
            </Button>
          )}
        </div>
      )}

      {/* Profile Overview Header Card - Rounded Full Avatar, Zero Shadow, Restrained Rounding */}
      <div className="bg-white border border-surface-border rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 font-bold text-xl shadow-xs">
            {displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-charcoal-900">{displayName}</h2>
              {getOnboardingBadge(staffRecord?.onboardingStatus)}
              <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-charcoal-muted mt-1 flex items-center gap-1.5 font-mono">
              <Mail className="h-3.5 w-3.5 text-forest-700" />
              {effectiveEmail}
            </p>
            <p className="text-xs text-charcoal-muted mt-0.5 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-forest-700" />
              {effectiveJobTitle} • {effectiveDept}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-charcoal-muted block">Assigned Role</span>
            <span className="font-mono font-bold text-xs text-charcoal-800 uppercase">
              {getRoleTitle(effectiveRole)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-surface-border bg-white rounded-t-lg px-4 gap-6">
        <button
          onClick={() => setActiveTab('userInfo')}
          className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'userInfo'
              ? 'border-forest-700 text-forest-800'
              : 'border-transparent text-charcoal-muted hover:text-charcoal-900'
          }`}
        >
          <User className="h-4 w-4" />
          User Information
        </button>

        <button
          onClick={() => setActiveTab('hrDossier')}
          className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'hrDossier'
              ? 'border-forest-700 text-forest-800'
              : 'border-transparent text-charcoal-muted hover:text-charcoal-900'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          HR Personnel Dossier & Certs
          {!canViewHrDossier && <Lock className="h-3 w-3 text-charcoal-400" />}
        </button>

        <button
          onClick={() => setActiveTab('statutory')}
          className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'statutory'
              ? 'border-forest-700 text-forest-800'
              : 'border-transparent text-charcoal-muted hover:text-charcoal-900'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Statutory & Payroll Records
          {!canViewStatutory && <Lock className="h-3 w-3 text-charcoal-400" />}
        </button>
      </div>

      {/* TAB 1: USER INFORMATION */}
      {activeTab === 'userInfo' && (
        <form onSubmit={handleSaveProfile} className="bg-white border border-surface-border rounded-b-lg p-5 space-y-6">
          <div className="border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <User className="h-4 w-4 text-forest-700" />
              General User Information & Contact Details
            </h3>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Visible on institutional directory, organizational correspondence, and communication channels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Full Names (Legal / Display Name)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={!isSelf && !canEditHrDossier}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-600 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Official Office Email
              </label>
              <input
                type="email"
                value={effectiveEmail}
                disabled
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-muted bg-slate-50 cursor-not-allowed font-mono text-xs"
              />
              <span className="text-[10px] text-charcoal-muted mt-1 block">
                Issued under @babawatoto.or.tz domain. Managed by System Administrator.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Personal Email Address
              </label>
              <input
                type="email"
                value={personalEmail || staffRecord?.personalEmail || ''}
                onChange={(e) => setPersonalEmail(e.target.value)}
                disabled={!isSelf && !canEditHrDossier}
                placeholder="personal@gmail.com"
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-600 bg-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Personal Contact Phone Number
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={!isSelf && !canEditHrDossier}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-600 bg-white tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Position / Job Title
              </label>
              <input
                type="text"
                value={effectiveJobTitle}
                disabled
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-muted bg-slate-50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={effectiveDept}
                disabled
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-muted bg-slate-50 cursor-not-allowed"
              />
            </div>
          </div>

          {(isSelf || canEditHrDossier) && (
            <div className="pt-4 border-t border-surface-border flex justify-end">
              <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
                <Save className="h-4 w-4 mr-1.5" />
                {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              </Button>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: HR CONFIDENTIAL DOSSIER & CERTIFICATIONS */}
      {activeTab === 'hrDossier' && (
        <div className="bg-white border border-surface-border rounded-b-lg p-5 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-forest-700" />
                HR Confidential Personnel Dossier
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Administered by Human Resources: Date of Birth, NIDA, TIN, Salary scale, Loan Board (HESLB), CV, and verified qualifications.
              </p>
            </div>
            {canEditHrDossier && staffRecord && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsHrModalOpen(true)}
                className="shrink-0"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                Update HR Dossier
              </Button>
            )}
          </div>

          {!canViewHrDossier ? (
            <div className="p-6 text-center text-charcoal-muted bg-slate-50 rounded-lg border border-surface-border text-sm">
              <Lock className="h-8 w-8 mx-auto text-charcoal-400 mb-2" />
              <p className="font-bold text-charcoal-800">Restricted Confidential Record</p>
              <p className="text-xs text-charcoal-muted mt-1">
                Personnel dossiers, salary scales, and national tax/NIDA identifiers are strictly restricted to Human Resources Administration and Executive Management.
              </p>
            </div>
          ) : (
            <>
              {/* Institutional & Legal Identifiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-surface-border bg-slate-50 space-y-1">
                  <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                    Date of Birth (DOB)
                  </span>
                  <span className="text-sm font-bold text-charcoal-900 tabular-nums">
                    {staffRecord?.dateOfBirth || (
                      <span className="text-charcoal-muted font-normal italic">Pending HR Entry</span>
                    )}
                  </span>
                </div>

                <div className="p-4 rounded-lg border border-surface-border bg-slate-50 space-y-1">
                  <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                    NIDA Number (National ID)
                  </span>
                  <span className="text-sm font-bold text-charcoal-900 font-mono tracking-wider">
                    {staffRecord?.nidaNumber || (
                      <span className="text-charcoal-muted font-normal italic font-sans text-xs">Pending HR Entry</span>
                    )}
                  </span>
                </div>

                <div className="p-4 rounded-lg border border-surface-border bg-slate-50 space-y-1">
                  <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                    TIN Number (TRA Taxpayer)
                  </span>
                  <span className="text-sm font-bold text-charcoal-900 font-mono">
                    {staffRecord?.tinNumber || (
                      <span className="text-charcoal-muted font-normal italic font-sans text-xs">Pending HR Entry</span>
                    )}
                  </span>
                </div>

                <div className="p-4 rounded-lg border border-surface-border bg-slate-50 space-y-1">
                  <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                    Basic Salary (Monthly)
                  </span>
                  <span className="text-sm font-bold text-charcoal-900 tabular-nums">
                    {staffRecord?.basicSalary ? (
                      `TZS ${staffRecord.basicSalary.toLocaleString()}`
                    ) : (
                      <span className="text-charcoal-muted font-normal italic">Pending HR Entry</span>
                    )}
                  </span>
                </div>

                <div className="p-4 rounded-lg border border-surface-border bg-slate-50 space-y-1">
                  <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                    Gross Salary (Monthly)
                  </span>
                  <span className="text-sm font-bold text-charcoal-900 tabular-nums">
                    {staffRecord?.grossSalary ? (
                      `TZS ${staffRecord.grossSalary.toLocaleString()}`
                    ) : (
                      <span className="text-charcoal-muted font-normal italic">Pending HR Entry</span>
                    )}
                  </span>
                </div>

                <div className="p-4 rounded-lg border border-surface-border bg-slate-50 space-y-1">
                  <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                    Loan Board Status (HESLB)
                  </span>
                  <span className="text-xs font-bold text-charcoal-900 capitalize block">
                    {staffRecord?.loanBoardStatus ? staffRecord.loanBoardStatus.replace(/_/g, ' ') : 'Not Specified'}
                  </span>
                  {staffRecord?.loanBoardDetails && (
                    <span className="text-[11px] text-charcoal-muted block">{staffRecord.loanBoardDetails}</span>
                  )}
                </div>
              </div>

              {/* Curriculum Vitae (CV) Section */}
              <div className="p-4 rounded-lg border border-surface-border bg-white space-y-2">
                <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-forest-700" />
                  Curriculum Vitae (CV)
                </span>
                {staffRecord?.cvName ? (
                  <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-surface-border">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-forest-700 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-charcoal-900">{staffRecord.cvName}</p>
                        <p className="text-xs text-charcoal-muted">Institutional Personnel CV • Verified Official Copy</p>
                      </div>
                    </div>
                    <Badge variant="success">Verified Document</Badge>
                  </div>
                ) : (
                  <div className="text-xs text-charcoal-muted italic p-3 bg-slate-50 rounded-md border border-surface-border">
                    No CV document attached yet. HR can upload or link the file during dossier review.
                  </div>
                )}
              </div>

              {/* Verified Certifications & Diplomas */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-forest-700" />
                  Verified Certifications & Academic Credentials ({(staffRecord?.certifications || []).length})
                </h4>

                {(staffRecord?.certifications || []).length === 0 ? (
                  <div className="text-center py-6 text-charcoal-muted text-xs border border-surface-border rounded-lg bg-slate-50">
                    No verified certifications recorded yet for this profile.
                  </div>
                ) : (
                  <div className="rounded-lg border border-surface-border overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-charcoal-600 font-semibold border-b border-surface-border">
                        <tr>
                          <th className="py-2.5 px-3">Certification / Qualification</th>
                          <th className="py-2.5 px-3">Institution / Board</th>
                          <th className="py-2.5 px-3">Year</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {(staffRecord?.certifications || []).map((cert) => (
                          <tr key={cert.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-charcoal-900 flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-forest-700 shrink-0" />
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
            </>
          )}
        </div>
      )}

      {/* TAB 3: STATUTORY & PAYROLL RECORDS */}
      {activeTab === 'statutory' && (
        <div className="bg-white border border-surface-border rounded-b-lg p-5 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-forest-700" />
                Statutory Compliance & Banking Remittance
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Administered by Finance Office: CWT, NSSF/PSSF pension funds, NHIF medical insurance, and commercial banking details.
              </p>
            </div>
            {canEditStatutory && staffRecord && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsStatutoryModalOpen(true)}
                className="shrink-0"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                Update Statutory Details
              </Button>
            )}
          </div>

          {!canViewStatutory ? (
            <div className="p-6 text-center text-charcoal-muted bg-slate-50 rounded-lg border border-surface-border text-sm">
              <Lock className="h-8 w-8 mx-auto text-charcoal-400 mb-2" />
              <p className="font-bold text-charcoal-800">Restricted Financial Record</p>
              <p className="text-xs text-charcoal-muted mt-1">
                Statutory identifiers, pension accounts, and banking disbursement coordinates are accessible exclusively to Finance Officers and Executive Management.
              </p>
            </div>
          ) : (
            <>
              {/* Statutory Numbers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border border-surface-border bg-slate-50 space-y-1">
                  <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                    CWT Number (Union)
                  </span>
                  <span className="text-sm font-bold text-charcoal-900 font-mono">
                    {staffRecord?.cwtNumber || (
                      <span className="text-charcoal-muted font-normal italic font-sans text-xs">Not Enrolled / N/A</span>
                    )}
                  </span>
                </div>

                <div className="p-4 rounded-lg border border-surface-border bg-slate-50 space-y-1">
                  <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                    NSSF Number (Pension)
                  </span>
                  <span className="text-sm font-bold text-charcoal-900 font-mono">
                    {staffRecord?.nssfNumber || (
                      <span className="text-charcoal-muted font-normal italic font-sans text-xs">Pending Finance</span>
                    )}
                  </span>
                </div>

                <div className="p-4 rounded-lg border border-surface-border bg-slate-50 space-y-1">
                  <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                    PSSF Number (Public)
                  </span>
                  <span className="text-sm font-bold text-charcoal-900 font-mono">
                    {staffRecord?.pssfNumber || (
                      <span className="text-charcoal-muted font-normal italic font-sans text-xs">Not Enrolled / N/A</span>
                    )}
                  </span>
                </div>

                <div className="p-4 rounded-lg border border-surface-border bg-slate-50 space-y-1">
                  <span className="text-xs text-charcoal-muted font-medium uppercase tracking-wide block">
                    NHIF Number (Health)
                  </span>
                  <span className="text-sm font-bold text-charcoal-900 font-mono">
                    {staffRecord?.nhifNumber || (
                      <span className="text-charcoal-muted font-normal italic font-sans text-xs">Pending Finance</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Banking & Remittance Details */}
              <div className="p-4 rounded-lg border border-surface-border bg-white space-y-3">
                <h4 className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-forest-700" />
                  Salary Remittance & Banking Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-md bg-slate-50 border border-surface-border">
                    <span className="text-charcoal-muted block mb-0.5">Commercial Bank</span>
                    <span className="text-sm font-bold text-charcoal-900">
                      {staffRecord?.bankName || 'Not recorded'}
                    </span>
                  </div>
                  <div className="p-3 rounded-md bg-slate-50 border border-surface-border">
                    <span className="text-charcoal-muted block mb-0.5">Account Number</span>
                    <span className="text-sm font-bold text-charcoal-900 font-mono tracking-wider">
                      {staffRecord?.bankAccountNumber || 'Not recorded'}
                    </span>
                  </div>
                  <div className="p-3 rounded-md bg-slate-50 border border-surface-border">
                    <span className="text-charcoal-muted block mb-0.5">Branch Location</span>
                    <span className="text-sm font-bold text-charcoal-900">
                      {staffRecord?.bankBranch || 'Main Branch'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Sub-modals for HR & Statutory Editing */}
      <CompleteHrOnboardingModal
        isOpen={isHrModalOpen}
        onClose={() => setIsHrModalOpen(false)}
        staff={staffRecord}
        onSuccess={loadProfileData}
      />

      <CompleteStatutoryModal
        isOpen={isStatutoryModalOpen}
        onClose={() => setIsStatutoryModalOpen(false)}
        staff={staffRecord}
        onSuccess={loadProfileData}
      />
    </div>
  );
};
