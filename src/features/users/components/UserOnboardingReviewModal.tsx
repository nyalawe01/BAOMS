import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Briefcase,
  Shield,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  FolderKanban,
  Check,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ROLES, RoleCode } from '@/lib/permissions';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { createNotification } from '@/services/notificationsService';
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from '@/lib/ToastContext';

export interface PendingUserCandidate {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  approvalStatus: 'pending_hr' | 'pending_ed' | 'approved' | 'rejected';
  createdAt?: string;
  stagedDetails?: Record<string, any>;
}

interface UserOnboardingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: PendingUserCandidate | null;
  onSuccess: () => void;
}

const DEPARTMENTS = [
  { id: 'dept-prj', code: 'PRJ', name: 'Projects & Programs' },
  { id: 'dept-fin', code: 'FIN', name: 'Finance & Operations' },
  { id: 'dept-me', code: 'ME', name: 'Monitoring & Evaluation' },
  { id: 'dept-proc', code: 'PROC', name: 'Procurement & Logistics' },
  { id: 'dept-hr', code: 'HR', name: 'Human Resources & Administration' },
  { id: 'dept-admin', code: 'ADMIN', name: 'IT & System Administration' },
  { id: 'dept-exec', code: 'EXEC', name: 'Executive Office' },
];

const ROLES_LIST: { code: RoleCode; label: string; description: string }[] = [
  { code: ROLES.EXECUTIVE_DIRECTOR, label: 'Executive Director', description: 'Organization-wide oversight, approvals & governance' },
  { code: ROLES.PROCUREMENT_OFFICER, label: 'Procurement and Supply Officer', description: 'Purchase orders, supplier registry, inventory & quotes' },
  { code: ROLES.FINANCE_OFFICER, label: 'Finance Officer', description: 'Accounting, ledgers, vouchers, budgets & financial reports' },
  { code: ROLES.ME_OFFICER, label: 'Monitoring and Evaluation (M&E) Officer', description: 'Indicators, targets, data verification, donor reporting & impact' },
  { code: ROLES.PROJECT_MANAGER, label: 'Project Manager', description: 'Assigned project delivery, work plans, task assignments & budgets' },
  { code: ROLES.PROJECT_COORDINATOR, label: 'Project Coordinator', description: 'Field activity delivery, attendance, photo evidence & field reports' },
  { code: ROLES.HR_ADMINISTRATOR, label: 'Human Resources (HR) Administrator', description: 'Staff dossiers, onboarding vetting, statutory compliance & leave records' },
  { code: ROLES.SYSTEM_ADMIN, label: 'System Administrator', description: 'Full system maintenance & technical telemetry' },
];

const AVAILABLE_DOCUMENT_SCOPES = [
  { id: 'projects', label: 'Project Reports & Field Records' },
  { id: 'finance', label: 'Financial Statements & Invoices' },
  { id: 'hr', label: 'HR Personnel Dossiers & Policies' },
  { id: 'governance', label: 'Board Resolutions & Executive Letters' },
  { id: 'procurement', label: 'Procurement Quotes & Vendor Files' },
];

const AVAILABLE_PROJECTS = [
  { id: 'PRJ-BYA-2026', name: 'Babawatoto Youth Academy (BYA)' },
  { id: 'PRJ-CCS-2026', name: 'Community Child Safeguarding Forum' },
  { id: 'PRJ-YDO-2026', name: 'Yombo Dovya Community Center' },
  { id: 'PRJ-KIG-2026', name: 'Kigamboni Early Childhood Development' },
  { id: 'PRJ-M&E-2026', name: 'Institutional Monitoring & Evaluation' },
];

export const UserOnboardingReviewModal: React.FC<UserOnboardingReviewModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user: currentActor, hasRole, isAdmin } = useAuth();
  const { showToast } = useToast();

  const isExecutiveDirectorOnly =
    hasRole('executive_director') &&
    !hasRole('hr_administrator') &&
    !isAdmin();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Personal Information
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [personalEmail, setPersonalEmail] = useState('');
  const [phone, setPhone] = useState(user?.phoneNumber || '+255 754 000 000');
  const [nida, setNida] = useState('');
  const [dob, setDob] = useState('1994-06-15');
  const [gender, setGender] = useState('male');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('+255 754 ');

  // Step 2: Professional & Organizational
  const [selectedDeptCode, setSelectedDeptCode] = useState('PRJ');
  const [selectedRole, setSelectedRole] = useState<RoleCode>(ROLES.PROJECT_COORDINATOR);
  const [jobTitle, setJobTitle] = useState('Project Field Coordinator');
  const [employmentType, setEmploymentType] = useState('fixed_term');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [supervisor, setSupervisor] = useState('Executive Office / Head of Department');

  // Step 3: Allowed Scopes
  const [selectedDocScopes, setSelectedDocScopes] = useState<string[]>(['projects']);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(['PRJ-BYA-2026', 'PRJ-CCS-2026']);
  const [hrNotes, setHrNotes] = useState('Candidate credentials and official email verified. Forwarding for Executive Director final approval.');

  // Initialize data when user changes
  React.useEffect(() => {
    if (user) {
      setFullName(user.displayName);
      setPhone(user.phoneNumber || '+255 754 000 000');
      const staged = user.stagedDetails || {};
      if (staged.personalEmail) setPersonalEmail(staged.personalEmail);
      if (staged.departmentCode) setSelectedDeptCode(staged.departmentCode);
      if (staged.roleCode) setSelectedRole(staged.roleCode);
      if (staged.jobTitle) setJobTitle(staged.jobTitle);
      if (staged.allowedDocScopes) setSelectedDocScopes(staged.allowedDocScopes);
      if (staged.allowedProjectIds) setSelectedProjectIds(staged.allowedProjectIds);
      if (staged.hrNotes) setHrNotes(staged.hrNotes);
      setStep(1);
    }
  }, [user]);

  if (!isOpen || !user || isExecutiveDirectorOnly) return null;

  const toggleDocScope = (id: string) => {
    setSelectedDocScopes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim()) {
        showToast({ title: 'Validation Error', message: 'Full Name is required.', variant: 'error' });
        return;
      }
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Submit to Executive Director
  const handleSubmitToED = async () => {
    setIsSubmitting(true);
    const selectedDept = DEPARTMENTS.find((d) => d.code === selectedDeptCode) || DEPARTMENTS[0];

    const stagedPayload = {
      fullName: fullName.trim(),
      officialEmail: user.email,
      personalEmail: personalEmail.trim(),
      phone: phone.trim(),
      nida: nida.trim(),
      dob,
      gender,
      emergencyName: emergencyName.trim(),
      emergencyPhone: emergencyPhone.trim(),
      departmentCode: selectedDept.code,
      departmentName: selectedDept.name,
      roleCode: selectedRole,
      jobTitle: jobTitle.trim(),
      employmentType,
      startDate,
      supervisor: supervisor.trim(),
      allowedDocScopes: selectedDocScopes,
      allowedProjectIds: selectedProjectIds,
      hrNotes: hrNotes.trim(),
      hrReviewerId: currentActor?.id,
      hrReviewedAt: new Date().toISOString(),
    };

    try {
      if (isSupabaseConfigured) {
        // Look up department id
        const { data: deptRow } = await supabase
          .from('departments')
          .select('id')
          .eq('code', selectedDept.code)
          .maybeSingle();

        const deptId = deptRow?.id || null;

        // Call RPC hr_submit_user_dossier or update profiles directly
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: fullName.trim(),
            phone_number: phone.trim(),
            department_id: deptId,
            staged_details: stagedPayload,
            approval_status: 'pending_ed',
            hr_reviewed_by: currentActor?.id,
            hr_reviewed_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) {
          console.warn('RPC/Direct update notice:', error);
        }
      }

      // Create notification for Executive Director
      createNotification({
        title: 'Staff Approval Required (Executive Director)',
        message: `HR has completed dossier for ${fullName.trim()} (${selectedRole.replace(/_/g, ' ')} in ${selectedDept.name}). Please review and authorize access.`,
        type: 'hr',
        targetRole: 'all',
        link: '/users',
        metadata: {
          action: 'ed_authorize',
          userId: user.id,
          roleCode: selectedRole,
          departmentCode: selectedDept.code,
        },
      });

      showToast({
        title: '✅ Dossier Submitted to Executive Director',
        message: `${fullName.trim()} has been vetted. Request forwarded for final Executive Director authorization.`,
        variant: 'success',
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      showToast({
        title: 'Submission Error',
        message: err instanceof Error ? err.message : 'Failed to submit review.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Personnel Review & Role Onboarding"
      description="Human Resources administrative stepper for vetting newly registered staff credentials."
      size="xl"
    >
      <div className="space-y-6">
        {/* Stepper Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            {[
              { num: 1, label: '1. Personal Info' },
              { num: 2, label: '2. Professional & Role' },
              { num: 3, label: '3. Allowed Scopes' },
              { num: 4, label: '4. Summary & Submit' },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
                  step === s.num
                    ? 'bg-charcoal-900 text-white'
                    : step > s.num
                    ? 'bg-surface-muted text-charcoal-800 border border-surface-border'
                    : 'bg-surface-muted/50 text-charcoal-400'
                }`}
              >
                {step > s.num ? <Check className="w-3 h-3" /> : <span>{s.num}.</span>}
                <span className="hidden sm:inline">{s.label.split('. ')[1]}</span>
              </button>
            ))}
          </div>

          <Badge variant="default" className="text-xs">
            Status: Pending HR
          </Badge>
        </div>

        {/* STEP 1: Personal Information */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-surface-muted/50 border border-surface-border rounded p-3 text-xs text-charcoal-700 flex items-center gap-2">
              <User className="w-4 h-4 text-charcoal-500 shrink-0" />
              <span>
                Verify the candidate's legal identity against official records before assigning system privileges.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Organization Email (Verified)
                </label>
                <Input value={user.email} disabled className="bg-slate-100 text-slate-600 font-mono text-xs" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Personal Contact Email
                </label>
                <Input
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  placeholder="personal@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Phone Number
                </label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  National ID (NIDA)
                </label>
                <Input
                  value={nida}
                  onChange={(e) => setNida(e.target.value)}
                  placeholder="19940615-XXXXX-XXXXX-XX"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <Select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Contact Name & Phone
                </label>
                <Input
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Mary Mwita (+255 713 000 000)"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Professional & Organization */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Designate the candidate's primary department, official job title, and system role.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedDeptCode}
                  onChange={(e) => setSelectedDeptCode(e.target.value)}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.code} value={dept.code}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Job Title <span className="text-red-500">*</span>
                </label>
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  System Role Authorization <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as RoleCode)}
                >
                  {ROLES_LIST.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employment Type
                </label>
                <Select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                >
                  <option value="fixed_term">Fixed Term Contract</option>
                  <option value="permanent">Permanent Staff</option>
                  <option value="intern">Volunteer / Intern</option>
                  <option value="consultant">Specialist Consultant</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Appointment Start Date
                </label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Line Manager / Supervisor
                </label>
                <Input value={supervisor} onChange={(e) => setSupervisor(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Allowed Scopes & Projects */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D68904] shrink-0" />
              <span>
                Configure organizational documentation classifications and project workspaces this staff member is authorized to access.
              </span>
            </div>

            {/* Documentation Access */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Allowed Documentation Categories
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDocScopes.length === AVAILABLE_DOCUMENT_SCOPES.length) {
                      setSelectedDocScopes([]);
                    } else {
                      setSelectedDocScopes(AVAILABLE_DOCUMENT_SCOPES.map((s) => s.id));
                    }
                  }}
                  className="text-xs text-charcoal-700 hover:text-charcoal-900 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  {selectedDocScopes.length === AVAILABLE_DOCUMENT_SCOPES.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_DOCUMENT_SCOPES.map((scope) => {
                  const isChecked = selectedDocScopes.includes(scope.id);
                  return (
                    <label
                      key={scope.id}
                      onClick={() => toggleDocScope(scope.id)}
                      className="flex items-center gap-2.5 p-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs cursor-pointer text-charcoal-900 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-charcoal-900 focus:ring-slate-400"
                      />
                      <span>{scope.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Project Access */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Assigned Projects & Field Programs
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedProjectIds.length === AVAILABLE_PROJECTS.length) {
                      setSelectedProjectIds([]);
                    } else {
                      setSelectedProjectIds(AVAILABLE_PROJECTS.map((p) => p.id));
                    }
                  }}
                  className="text-xs text-charcoal-700 hover:text-charcoal-900 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  {selectedProjectIds.length === AVAILABLE_PROJECTS.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_PROJECTS.map((proj) => {
                  const isChecked = selectedProjectIds.includes(proj.id);
                  return (
                    <label
                      key={proj.id}
                      onClick={() => toggleProject(proj.id)}
                      className="flex items-center gap-2.5 p-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs cursor-pointer text-charcoal-900 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-charcoal-900 focus:ring-slate-400"
                      />
                      <span className="truncate">{proj.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* HR Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HR Vetting Notes for Executive Director
              </label>
              <textarea
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D68904]"
                placeholder="Include any remarks or conditions for Executive Director review..."
              />
            </div>
          </div>
        )}

        {/* STEP 4: Summary & Submit */}
        {step === 4 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-surface-muted/50 border border-surface-border rounded p-3 text-xs text-charcoal-800">
              <div className="flex items-center gap-2 font-bold text-sm mb-1 text-charcoal-900">
                <CheckCircle2 className="w-4 h-4 text-charcoal-600" />
                HR Dossier Ready for Executive Approval
              </div>
              <p className="text-charcoal-muted">
                Please verify all configured details below before forwarding this request to the Executive Director.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">Staff Name</span>
                <span className="font-bold text-slate-800">{fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Official Email</span>
                <span className="font-mono text-slate-800">{user.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Assigned Role</span>
                <Badge variant="info">{selectedRole.replace(/_/g, ' ').toUpperCase()}</Badge>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Department</span>
                <span className="font-semibold text-slate-800">
                  {DEPARTMENTS.find((d) => d.code === selectedDeptCode)?.name}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Job Title</span>
                <span className="text-slate-800">{jobTitle}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Assigned Projects</span>
                <span className="text-slate-800 font-medium">{selectedProjectIds.length} Project(s)</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 italic">
              Upon clicking "Approve & Submit to Executive Director", this account will advance to status{' '}
              <strong className="text-amber-700">pending_ed</strong> and dispatch an executive review notification.
            </div>
          </div>
        )}

        {/* Modal Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack} className="text-xs flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Step
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-xs">
              Cancel
            </Button>

            {step < 4 ? (
              <Button type="button" variant="primary" onClick={handleNext} className="text-xs flex items-center gap-1.5 bg-[#D68904] hover:bg-[#b86e03]">
                Next Step
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmitToED}
                disabled={isSubmitting}
                className="text-xs flex items-center gap-2 bg-[#D68904] hover:bg-[#b86e03] shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? 'Forwarding...' : 'Approve & Forward to Executive Director'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
