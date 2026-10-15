import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Briefcase,
  BookOpen,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Save,
  RotateCcw,
  AlertCircle,
  Plus,
  Trash2,
  FileText,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Stepper, StepItem } from '@/components/ui/Stepper';
import {
  StaffProfileRecord,
  EmploymentStatus,
  ContractType,
  LoanBoardStatus,
  StaffCertification,
  CreateStaffProfilePayload,
} from '../types/hr';
import { getStaffProfiles, createStaffProfile } from '../services/hrService';
import { addNotification } from '@/services/notificationsService';

const DRAFT_STORAGE_KEY = 'baoms_staff_registration_draft';

interface StaffDraftState {
  step: number;
  savedAt: string;
  personal: {
    fullName: string;
    dateOfBirth: string;
    phoneNumber: string;
    personalEmail: string;
    officialEmail: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  };
  employment: {
    staffNumber: string;
    jobTitle: string;
    departmentId: string;
    supervisorId: string;
    employmentStatus: EmploymentStatus;
    contractType: ContractType;
    startDate: string;
    endDate: string;
    notes: string;
  };
  academic: {
    highestEducation: string;
    cvName: string;
    cvUrl: string;
    certifications: StaffCertification[];
  };
  statutory: {
    nidaNumber: string;
    tinNumber: string;
    loanBoardStatus: LoanBoardStatus;
    loanBoardDetails: string;
    cwtNumber: string;
    nssfNumber: string;
    pssfNumber: string;
    nhifNumber: string;
    bankName: string;
    bankAccountNumber: string;
    bankBranch: string;
    basicSalary: string;
    grossSalary: string;
  };
  systemAccess: {
    grantAccess: boolean;
    systemRole: string;
  };
}

const INITIAL_DRAFT: StaffDraftState = {
  step: 0,
  savedAt: '',
  personal: {
    fullName: '',
    dateOfBirth: '1992-05-14',
    phoneNumber: '',
    personalEmail: '',
    officialEmail: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  },
  employment: {
    staffNumber: '',
    jobTitle: '',
    departmentId: 'dept-prj',
    supervisorId: '',
    employmentStatus: 'active',
    contractType: 'fixed_term',
    startDate: new Date().toISOString().split('T')[0] ?? '',
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '',
    notes: '',
  },
  academic: {
    highestEducation: "Bachelor's Degree",
    cvName: '',
    cvUrl: '',
    certifications: [
      {
        id: 'cert-init-1',
        name: 'Bachelor of Arts in Community Development',
        institution: 'University of Dar es Salaam (UDSM)',
        year: 2017,
        verified: true,
      },
    ],
  },
  statutory: {
    nidaNumber: '',
    tinNumber: '',
    loanBoardStatus: 'not_applicable',
    loanBoardDetails: '',
    cwtNumber: '',
    nssfNumber: '',
    pssfNumber: '',
    nhifNumber: '',
    bankName: 'CRDB Bank Plc',
    bankAccountNumber: '',
    bankBranch: 'Kariakoo Branch',
    basicSalary: '1850000',
    grossSalary: '2200000',
  },
  systemAccess: {
    grantAccess: false,
    systemRole: 'project_officer',
  },
};

export const RegisterStaffPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [existingStaff, setExistingStaff] = useState<StaffProfileRecord[]>([]);
  const [formData, setFormData] = useState<StaffDraftState>(INITIAL_DRAFT);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [hasDraftRestored, setHasDraftRestored] = useState(false);
  const [saveTimestamp, setSaveTimestamp] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New certification row form state
  const [newCertName, setNewCertName] = useState('');
  const [newCertInstitution, setNewCertInstitution] = useState('');
  const [newCertYear, setNewCertYear] = useState(new Date().getFullYear().toString());

  // Load existing staff for supervisor dropdown and check for draft
  useEffect(() => {
    async function loadInitial() {
      try {
        const staff = await getStaffProfiles();
        setExistingStaff(staff);
      } catch (err) {
        console.error('Failed to load staff profiles for supervisor selector:', err);
      }

      // Check saved draft
      const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (rawDraft) {
        try {
          const parsed = JSON.parse(rawDraft) as StaffDraftState;
          if (parsed && parsed.personal?.fullName) {
            setFormData(parsed);
            setHasDraftRestored(true);
            setSaveTimestamp(parsed.savedAt);
            const pastCompleted: number[] = [];
            for (let i = 0; i < parsed.step; i++) pastCompleted.push(i);
            setCompletedSteps(pastCompleted);
          }
        } catch (e) {
          console.error('Failed to parse staff draft:', e);
        }
      }
    }
    loadInitial();
  }, []);

  const steps: StepItem[] = [
    {
      id: 0,
      title: t('hr.stepper.personal', 'Personal Information'),
      subtitle: t('hr.stepper.personalSub', 'Identity & Contacts'),
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 1,
      title: t('hr.stepper.employment', 'Role & Employment'),
      subtitle: t('hr.stepper.employmentSub', 'Contract & Department'),
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      id: 2,
      title: t('hr.stepper.academic', 'Academic & CV'),
      subtitle: t('hr.stepper.academicSub', 'Degrees & Certifications'),
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 3,
      title: t('hr.stepper.statutory', 'Statutory & Banking'),
      subtitle: t('hr.stepper.statutorySub', 'NIDA, TIN, NSSF & Bank'),
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 4,
      title: t('hr.stepper.review', 'Review & Submission'),
      subtitle: t('hr.stepper.reviewSub', 'Final Verification'),
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ];

  // Helper to persist draft to localStorage
  const persistDraft = (data: StaffDraftState, stepIndex: number) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const updatedDraft: StaffDraftState = {
      ...data,
      step: stepIndex,
      savedAt: nowStr,
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedDraft));
    setSaveTimestamp(nowStr);
    return updatedDraft;
  };

  const handleManualSaveDraft = () => {
    persistDraft(formData, formData.step);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setFormData(INITIAL_DRAFT);
    setCompletedSteps([]);
    setHasDraftRestored(false);
    setSaveTimestamp(null);
    setValidationError(null);
  };

  // Step-by-step validations before advancing
  const validateCurrentStep = (step: number): boolean => {
    setValidationError(null);

    if (step === 0) {
      if (!formData.personal.fullName.trim()) {
        setValidationError(t('hr.errors.nameRequired', 'Full Name is required.'));
        return false;
      }
      if (!formData.personal.phoneNumber.trim()) {
        setValidationError(t('hr.errors.phoneRequired', 'Primary phone number is required.'));
        return false;
      }
      return true;
    }

    if (step === 1) {
      if (!formData.employment.jobTitle.trim()) {
        setValidationError(t('hr.errors.titleRequired', 'Job Title is required.'));
        return false;
      }
      if (!formData.employment.startDate) {
        setValidationError(t('hr.errors.startDateRequired', 'Contract start date is required.'));
        return false;
      }
      if (
        formData.employment.contractType !== 'permanent' &&
        !formData.employment.endDate
      ) {
        setValidationError(t('hr.errors.endDateRequired', 'End date is required for fixed-term contracts.'));
        return false;
      }
      if (
        formData.employment.endDate &&
        formData.employment.startDate &&
        formData.employment.endDate < formData.employment.startDate
      ) {
        setValidationError(t('hr.errors.dateSequence', 'Contract end date cannot precede start date.'));
        return false;
      }
      return true;
    }

    if (step === 2) {
      // Academic: certifications or education level
      if (!formData.academic.highestEducation) {
        setValidationError(t('hr.errors.educationRequired', 'Please select highest education level.'));
        return false;
      }
      return true;
    }

    if (step === 3) {
      // Statutory: basic salary validation
      const bSal = parseFloat(formData.statutory.basicSalary);
      if (isNaN(bSal) || bSal < 0) {
        setValidationError(t('hr.errors.invalidSalary', 'Please provide a valid basic salary figure.'));
        return false;
      }
      return true;
    }

    return true;
  };

  // Next step handler with mandatory save
  const handleSaveAndContinue = () => {
    if (!validateCurrentStep(formData.step)) {
      return;
    }

    const nextStep = formData.step + 1;
    const updatedDraft = persistDraft(formData, nextStep);
    setFormData(updatedDraft);

    if (!completedSteps.includes(formData.step)) {
      setCompletedSteps([...completedSteps, formData.step]);
    }
  };

  const handleStepBack = () => {
    if (formData.step > 0) {
      const prevStep = formData.step - 1;
      setFormData({ ...formData, step: prevStep });
      setValidationError(null);
    }
  };

  // Add certification row
  const handleAddCertification = () => {
    if (!newCertName.trim() || !newCertInstitution.trim()) {
      return;
    }
    const newCert: StaffCertification = {
      id: `cert-${Date.now()}`,
      name: newCertName.trim(),
      institution: newCertInstitution.trim(),
      year: parseInt(newCertYear, 10) || new Date().getFullYear(),
      verified: true,
    };
    const updatedCerts = [...formData.academic.certifications, newCert];
    setFormData({
      ...formData,
      academic: {
        ...formData.academic,
        certifications: updatedCerts,
      },
    });
    setNewCertName('');
    setNewCertInstitution('');
  };

  const handleRemoveCertification = (id: string) => {
    const updatedCerts = formData.academic.certifications.filter((c) => c.id !== id);
    setFormData({
      ...formData,
      academic: {
        ...formData.academic,
        certifications: updatedCerts,
      },
    });
  };

  // Final Form Submission
  const handleSubmitStaff = async () => {
    setIsSubmitting(true);
    setValidationError(null);

    try {
      const basicNum = parseFloat(formData.statutory.basicSalary) || 0;
      const grossNum = parseFloat(formData.statutory.grossSalary) || basicNum;

      const payload: CreateStaffProfilePayload = {
        fullName: formData.personal.fullName.trim(),
        staffNumber: formData.employment.staffNumber.trim() || undefined,
        jobTitle: formData.employment.jobTitle.trim(),
        departmentId: formData.employment.departmentId,
        employmentStatus: formData.employment.employmentStatus,
        contractType: formData.employment.contractType,
        startDate: formData.employment.startDate,
        endDate: formData.employment.contractType === 'permanent' ? null : formData.employment.endDate || null,
        supervisorId: formData.employment.supervisorId || null,
        phoneNumber: formData.personal.phoneNumber.trim() || null,
        personalEmail: formData.personal.personalEmail.trim() || null,
        officialEmail: formData.personal.officialEmail.trim() || null,
        emergencyContactName: formData.personal.emergencyContactName.trim() || null,
        emergencyContactPhone: formData.personal.emergencyContactPhone.trim() || null,
        notes: formData.employment.notes.trim() || null,
        dateOfBirth: formData.personal.dateOfBirth || null,
        nidaNumber: formData.statutory.nidaNumber.trim() || null,
        tinNumber: formData.statutory.tinNumber.trim() || null,
        loanBoardStatus: formData.statutory.loanBoardStatus,
        loanBoardDetails: formData.statutory.loanBoardDetails.trim() || null,
        basicSalary: basicNum,
        grossSalary: grossNum,
        cvName: formData.academic.cvName || `${formData.personal.fullName.replace(/\s+/g, '_')}_CV.pdf`,
        cvUrl: formData.academic.cvUrl || null,
        certifications: formData.academic.certifications,
        cwtNumber: formData.statutory.cwtNumber.trim() || null,
        nssfNumber: formData.statutory.nssfNumber.trim() || null,
        pssfNumber: formData.statutory.pssfNumber.trim() || null,
        nhifNumber: formData.statutory.nhifNumber.trim() || null,
        bankName: formData.statutory.bankName.trim() || null,
        bankAccountNumber: formData.statutory.bankAccountNumber.trim() || null,
        bankBranch: formData.statutory.bankBranch.trim() || null,
        onboardingStatus: 'completed',
        onboardingStep: 4,
      };

      const created = await createStaffProfile(payload);

      // Trigger automatic institutional notification
      addNotification({
        title: `Staff Member Onboarded: ${created.fullName}`,
        message: `${created.fullName} (${created.jobTitle}) was fully registered with complete HR dossier, academic certifications, and statutory records.`,
        type: 'hr',
        targetRole: 'all',
        link: `/profile/${created.id}`,
      });

      // Clear draft on successful completion
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      // Navigate to HR roster
      navigate('/hr');
    } catch (err: unknown) {
      setValidationError((err as Error).message || 'Failed to finalize staff registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title={t('hr.registerPageTitle', 'Staff Registration & Onboarding')}
        subtitle={t(
          'hr.registerPageSubtitle',
          'Complete dedicated multi-step registration for new personnel, academic qualifications, and statutory records.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('nav.hr', 'Human Resources'), href: '/hr' },
          { label: t('hr.newStaff', 'Register Staff') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {saveTimestamp && (
              <span className="text-xs text-charcoal-muted flex items-center gap-1 font-mono">
                <Check className="w-3.5 h-3.5 text-forest-700" />
                Saved {saveTimestamp}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSaveDraft}
              className="flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t('common.saveDraft', 'Save Draft')}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/hr')}
            >
              {t('common.cancel', 'Exit to Roster')}
            </Button>
          </div>
        }
      />

      {/* Draft Restored Banner */}
      {hasDraftRestored && (
        <div className="bg-forest-50 border border-forest-200 text-forest-900 rounded-lg p-3.5 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-forest-700 shrink-0" />
            <span>
              <strong>Draft restored:</strong> You are continuing an existing draft saved at{' '}
              <span className="font-mono">{saveTimestamp || 'earlier session'}</span>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHasDraftRestored(false)}
              className="text-xs h-7"
            >
              Dismiss
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDiscardDraft}
              className="text-xs h-7 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Discard Draft
            </Button>
          </div>
        </div>
      )}

      {/* Stepper Progression Navigation */}
      <Stepper
        steps={steps}
        currentStep={formData.step}
        completedSteps={completedSteps}
        onStepClick={(targetStep) => {
          if (targetStep < formData.step || completedSteps.includes(targetStep)) {
            setFormData({ ...formData, step: targetStep });
            setValidationError(null);
          }
        }}
      />

      {/* Validation Alert */}
      {validationError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Step Content Container */}
      <Card className="bg-white border border-surface-border">
        {/* Step 1: Personal Information */}
        {formData.step === 0 && (
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-forest-700" />
                <CardTitle>{t('hr.step1Title', 'Step 1: Personal Information & Contact Channels')}</CardTitle>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Collect baseline legal identity and personal contact channels for organizational records.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label={`${t('hr.fullName', 'Full Legal Name')} *`}
                    placeholder="e.g. Daudi Juma Matiko"
                    value={formData.personal.fullName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal: { ...formData.personal, fullName: e.target.value },
                      })
                    }
                    required
                  />
                </div>

                <Input
                  type="date"
                  label={t('hr.dob', 'Date of Birth (DOB)')}
                  value={formData.personal.dateOfBirth}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      personal: { ...formData.personal, dateOfBirth: e.target.value },
                    })
                  }
                />

                <Input
                  type="tel"
                  label={`${t('hr.phone', 'Primary Contact Phone')} *`}
                  placeholder="+255 754 123 456"
                  value={formData.personal.phoneNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      personal: { ...formData.personal, phoneNumber: e.target.value },
                    })
                  }
                  required
                />

                <Input
                  type="email"
                  label={t('hr.personalEmail', 'Personal Email Address')}
                  placeholder="daudi.matiko@gmail.com"
                  value={formData.personal.personalEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      personal: { ...formData.personal, personalEmail: e.target.value },
                    })
                  }
                />

                <Input
                  type="email"
                  label={t('hr.officialEmail', 'Official Office Email (@babawatoto.org)')}
                  placeholder="daudi.matiko@babawatoto.org"
                  value={formData.personal.officialEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      personal: { ...formData.personal, officialEmail: e.target.value },
                    })
                  }
                  helperText="Assigned Babawatoto organization domain address"
                />

                <Input
                  label={t('hr.emergencyContactName', 'Emergency Contact Person / Next of Kin')}
                  placeholder="e.g. Fatuma Matiko (Spouse / Guardian)"
                  value={formData.personal.emergencyContactName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      personal: {
                        ...formData.personal,
                        emergencyContactName: e.target.value,
                      },
                    })
                  }
                />

                <Input
                  type="tel"
                  label={t('hr.emergencyContactPhone', 'Emergency Contact Phone')}
                  placeholder="+255 784 987 654"
                  value={formData.personal.emergencyContactPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      personal: {
                        ...formData.personal,
                        emergencyContactPhone: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </div>
        )}

        {/* Step 2: Role & Employment */}
        {formData.step === 1 && (
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-forest-700" />
                <CardTitle>{t('hr.step2Title', 'Step 2: Institutional Role & Employment Contract')}</CardTitle>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Configure job title, department assignment, contract duration, and administrative supervision.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('hr.staffNumber', 'Staff ID / Number (Optional)')}
                  placeholder="Leave empty for auto-generated STF-2026-XXX"
                  value={formData.employment.staffNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employment: { ...formData.employment, staffNumber: e.target.value },
                    })
                  }
                />

                <Input
                  label={`${t('hr.jobTitle', 'Official Job Title')} *`}
                  placeholder="e.g. Community Outreach Officer"
                  value={formData.employment.jobTitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employment: { ...formData.employment, jobTitle: e.target.value },
                    })
                  }
                  required
                />

                <Select
                  label={`${t('hr.department', 'Department')} *`}
                  value={formData.employment.departmentId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employment: { ...formData.employment, departmentId: e.target.value },
                    })
                  }
                  options={[
                    { value: 'dept-prj', label: 'Projects & Programs (PRJ)' },
                    { value: 'dept-fin', label: 'Finance & Operations (FIN)' },
                    { value: 'dept-hr', label: 'Human Resources & Administration (HR)' },
                    { value: 'dept-exec', label: 'Executive Office (EXEC)' },
                    { value: 'dept-admin', label: 'IT & System Administration (ADMIN)' },
                  ]}
                />

                <Select
                  label={t('hr.supervisor', 'Direct Supervisor')}
                  value={formData.employment.supervisorId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employment: { ...formData.employment, supervisorId: e.target.value },
                    })
                  }
                  options={[
                    { value: '', label: '-- None / Top Executive --' },
                    ...existingStaff.map((s) => ({
                      value: s.id,
                      label: `${s.fullName} (${s.jobTitle})`,
                    })),
                  ]}
                />

                <Select
                  label={`${t('hr.employmentStatus', 'Employment Status')} *`}
                  value={formData.employment.employmentStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employment: {
                        ...formData.employment,
                        employmentStatus: e.target.value as EmploymentStatus,
                      },
                    })
                  }
                  options={[
                    { value: 'active', label: 'Active (Kazi Kamili)' },
                    { value: 'probation', label: 'Probation (Majaribio)' },
                    { value: 'on_leave', label: 'On Leave (Likizoni)' },
                    { value: 'suspended', label: 'Suspended (Simamishwa)' },
                  ]}
                />

                <Select
                  label={`${t('hr.contractType', 'Contract Type')} *`}
                  value={formData.employment.contractType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employment: {
                        ...formData.employment,
                        contractType: e.target.value as ContractType,
                      },
                    })
                  }
                  options={[
                    { value: 'fixed_term', label: 'Fixed Term (Mkataba wa Muda)' },
                    { value: 'permanent', label: 'Permanent (Kudumu)' },
                    { value: 'consultant', label: 'Consultant (Mshauri)' },
                    { value: 'volunteer', label: 'Volunteer (Mjitolea)' },
                    { value: 'intern', label: 'Intern (Mwanafunzi)' },
                  ]}
                />

                <Input
                  type="date"
                  label={`${t('hr.startDate', 'Contract Start Date')} *`}
                  value={formData.employment.startDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employment: { ...formData.employment, startDate: e.target.value },
                    })
                  }
                  required
                />

                {formData.employment.contractType !== 'permanent' && (
                  <Input
                    type="date"
                    label={`${t('hr.endDate', 'Contract End Date')} *`}
                    value={formData.employment.endDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employment: { ...formData.employment, endDate: e.target.value },
                      })
                    }
                    required
                  />
                )}
              </div>

              <Textarea
                label={t('hr.notes', 'Operational Notes & Field Post Details')}
                placeholder="Include workstation details, physical contract filing box reference, or special assignments..."
                value={formData.employment.notes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employment: { ...formData.employment, notes: e.target.value },
                  })
                }
                rows={2}
              />
            </CardContent>
          </div>
        )}

        {/* Step 3: Academic Qualifications & CV */}
        {formData.step === 2 && (
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-forest-700" />
                <CardTitle>{t('hr.step3Title', 'Step 3: Academic Qualifications, Certifications & CV')}</CardTitle>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Record higher education degrees, vocational certifications, and attached curriculum vitae.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={`${t('hr.highestEducation', 'Highest Education Level')} *`}
                  value={formData.academic.highestEducation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      academic: { ...formData.academic, highestEducation: e.target.value },
                    })
                  }
                  options={[
                    { value: "Master's Degree", label: "Master's Degree (Shahada ya Uzamili)" },
                    { value: "Postgraduate Diploma", label: 'Postgraduate Diploma' },
                    { value: "Bachelor's Degree", label: "Bachelor's Degree (Shahada ya Kwanza)" },
                    { value: 'Advanced Diploma', label: 'Advanced Diploma' },
                    { value: 'Ordinary Diploma', label: 'Ordinary Diploma (Stashahada)' },
                    { value: 'Certificate', label: 'Certificate (Astashahada)' },
                    { value: 'Secondary Education', label: 'Form IV / Form VI Secondary' },
                  ]}
                />

                <Input
                  label={t('hr.cvName', 'Curriculum Vitae Document Name')}
                  placeholder="e.g. Daudi_Matiko_CV_2026.pdf"
                  value={formData.academic.cvName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      academic: { ...formData.academic, cvName: e.target.value },
                    })
                  }
                  helperText="Attach digital CV file name stored in organizational repository"
                />
              </div>

              {/* Dynamic Certifications List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-surface-border pb-2">
                  <h3 className="text-sm font-semibold text-charcoal-900">
                    {t('hr.degreesAndCerts', 'Degrees & Professional Certifications')}
                  </h3>
                  <span className="text-xs text-charcoal-muted">
                    {formData.academic.certifications.length} recorded
                  </span>
                </div>

                {formData.academic.certifications.length === 0 ? (
                  <p className="text-xs text-charcoal-muted italic py-2">
                    No certifications added yet. Use the form below to append certified qualifications.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.academic.certifications.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-surface-border bg-surface-muted/20 text-sm"
                      >
                        <div className="flex items-start gap-2.5">
                          <FileText className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-charcoal-900">{cert.name}</div>
                            <div className="text-xs text-charcoal-muted">
                              {cert.institution} • Graduated {cert.year}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Verified
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCertification(cert.id)}
                            className="p-1 text-charcoal-muted hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Certification Mini-Form */}
                <div className="bg-slate-50 border border-dashed border-surface-border rounded-lg p-3.5 space-y-3">
                  <span className="text-xs font-semibold text-charcoal-700 block">
                    + Add New Degree or Certification
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      placeholder="Degree / Certificate Title"
                      value={newCertName}
                      onChange={(e) => setNewCertName(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-md border border-surface-border bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Awarding Institution (e.g. UDSM, IFM)"
                      value={newCertInstitution}
                      onChange={(e) => setNewCertInstitution(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-md border border-surface-border bg-white"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Year"
                        value={newCertYear}
                        onChange={(e) => setNewCertYear(e.target.value)}
                        className="w-24 px-3 py-1.5 text-xs rounded-md border border-surface-border bg-white"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={handleAddCertification}
                        className="text-xs h-7 px-3 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        )}

        {/* Step 4: Statutory Deductions & Banking */}
        {formData.step === 3 && (
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-forest-700" />
                <CardTitle>{t('hr.step4Title', 'Step 4: Statutory Deductions & Banking Details')}</CardTitle>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Tanzanian statutory identifiers (NIDA, TIN, NSSF/PSSF, NHIF), loan board deductions, and salary disbursement account.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('hr.nidaNumber', 'NIDA National ID Number')}
                  placeholder="e.g. 19920514-11103-00001-24"
                  value={formData.statutory.nidaNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      statutory: { ...formData.statutory, nidaNumber: e.target.value },
                    })
                  }
                  helperText="20-digit National Identification Authority number"
                />

                <Input
                  label={t('hr.tinNumber', 'TIN Number (TRA Tax ID)')}
                  placeholder="e.g. 134-589-204"
                  value={formData.statutory.tinNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      statutory: { ...formData.statutory, tinNumber: e.target.value },
                    })
                  }
                  helperText="Tanzania Revenue Authority 9-digit tax identifier"
                />

                <Select
                  label={t('hr.loanBoardStatus', 'HESLB Loan Board Status')}
                  value={formData.statutory.loanBoardStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      statutory: {
                        ...formData.statutory,
                        loanBoardStatus: e.target.value as LoanBoardStatus,
                      },
                    })
                  }
                  options={[
                    { value: 'not_applicable', label: 'Not Applicable (Hana Mkopo HESLB)' },
                    { value: 'deducting', label: 'Deducting (15% Makato ya Bodi)' },
                    { value: 'cleared', label: 'Cleared (Amemaliza Kulipa / Cheti)' },
                  ]}
                />

                <Input
                  label={t('hr.loanBoardDetails', 'HESLB Index / Reference Number')}
                  placeholder="e.g. S.0101/0045/2012"
                  value={formData.statutory.loanBoardDetails}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      statutory: { ...formData.statutory, loanBoardDetails: e.target.value },
                    })
                  }
                  disabled={formData.statutory.loanBoardStatus === 'not_applicable'}
                />

                <Input
                  label={t('hr.cwtNumber', 'CWT / Workers Union Number')}
                  placeholder="e.g. CWT-DAR-8841"
                  value={formData.statutory.cwtNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      statutory: { ...formData.statutory, cwtNumber: e.target.value },
                    })
                  }
                />

                <Input
                  label={t('hr.nssfNumber', 'NSSF Social Security Number')}
                  placeholder="e.g. 200491823"
                  value={formData.statutory.nssfNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      statutory: { ...formData.statutory, nssfNumber: e.target.value },
                    })
                  }
                />

                <Input
                  label={t('hr.pssfNumber', 'PSSF Pension Fund Number (if applicable)')}
                  placeholder="e.g. PSSF-990142"
                  value={formData.statutory.pssfNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      statutory: { ...formData.statutory, pssfNumber: e.target.value },
                    })
                  }
                />

                <Input
                  label={t('hr.nhifNumber', 'NHIF Health Insurance Card Number')}
                  placeholder="e.g. 10-0049281-9"
                  value={formData.statutory.nhifNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      statutory: { ...formData.statutory, nhifNumber: e.target.value },
                    })
                  }
                />
              </div>

              {/* Banking & Salary */}
              <div className="pt-4 border-t border-surface-border">
                <h4 className="text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-3">
                  Payroll & Salary Disbursement Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label={t('hr.bankName', 'Disbursement Bank Name')}
                    placeholder="e.g. CRDB Bank Plc"
                    value={formData.statutory.bankName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        statutory: { ...formData.statutory, bankName: e.target.value },
                      })
                    }
                  />

                  <Input
                    label={t('hr.bankAccount', 'Bank Account Number')}
                    placeholder="e.g. 0150293847200"
                    value={formData.statutory.bankAccountNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        statutory: { ...formData.statutory, bankAccountNumber: e.target.value },
                      })
                    }
                  />

                  <Input
                    label={t('hr.bankBranch', 'Branch Name')}
                    placeholder="e.g. Kariakoo / Tower Branch"
                    value={formData.statutory.bankBranch}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        statutory: { ...formData.statutory, bankBranch: e.target.value },
                      })
                    }
                  />

                  <Input
                    type="number"
                    min="0"
                    label={`${t('hr.basicSalary', 'Basic Monthly Salary (TZS)')} *`}
                    placeholder="1850000"
                    value={formData.statutory.basicSalary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        statutory: { ...formData.statutory, basicSalary: e.target.value },
                      })
                    }
                  />

                  <Input
                    type="number"
                    min="0"
                    label={t('hr.grossSalary', 'Gross Monthly Salary (TZS)')}
                    placeholder="2200000"
                    value={formData.statutory.grossSalary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        statutory: { ...formData.statutory, grossSalary: e.target.value },
                      })
                    }
                    helperText="Includes allowances before statutory deductions"
                  />
                </div>
              </div>
            </CardContent>
          </div>
        )}

        {/* Step 5: Review & Final Submission */}
        {formData.step === 4 && (
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-forest-700" />
                <CardTitle>{t('hr.step5Title', 'Step 5: Review Personnel Dossier & Finalize')}</CardTitle>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Verify all information across the 4 stages before committing to the institutional staff database.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Review summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Info Box */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                    <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-forest-700" />
                      Personal Information
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, step: 0 })}
                      className="text-xs text-forest-700 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-xs space-y-1 text-charcoal-700">
                    <div>
                      <span className="font-semibold text-charcoal-900">Name:</span> {formData.personal.fullName}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Phone:</span> {formData.personal.phoneNumber}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Official Email:</span>{' '}
                      {formData.personal.officialEmail || 'Not configured'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Personal Email:</span>{' '}
                      {formData.personal.personalEmail || 'None'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">DOB:</span>{' '}
                      {formData.personal.dateOfBirth || 'None'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Emergency Contact:</span>{' '}
                      {formData.personal.emergencyContactName} ({formData.personal.emergencyContactPhone})
                    </div>
                  </div>
                </div>

                {/* Role & Employment Box */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                    <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-forest-700" />
                      Role & Employment
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, step: 1 })}
                      className="text-xs text-forest-700 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-xs space-y-1 text-charcoal-700">
                    <div>
                      <span className="font-semibold text-charcoal-900">Title:</span> {formData.employment.jobTitle}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Department:</span>{' '}
                      {formData.employment.departmentId === 'dept-prj'
                        ? 'Projects & Programs'
                        : formData.employment.departmentId === 'dept-fin'
                        ? 'Finance & Operations'
                        : formData.employment.departmentId === 'dept-hr'
                        ? 'Human Resources'
                        : formData.employment.departmentId === 'dept-exec'
                        ? 'Executive Office'
                        : 'IT & System Admin'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Contract:</span>{' '}
                      {formData.employment.contractType.replace('_', ' ')} (
                      {formData.employment.employmentStatus})
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Start - End:</span>{' '}
                      {formData.employment.startDate} to {formData.employment.endDate || 'Permanent'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Supervisor:</span>{' '}
                      {existingStaff.find((s) => s.id === formData.employment.supervisorId)?.fullName ||
                        'None / Top Management'}
                    </div>
                  </div>
                </div>

                {/* Academic & CV Box */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                    <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-forest-700" />
                      Academic & Certifications
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, step: 2 })}
                      className="text-xs text-forest-700 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-xs space-y-1 text-charcoal-700">
                    <div>
                      <span className="font-semibold text-charcoal-900">Highest Level:</span>{' '}
                      {formData.academic.highestEducation}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">CV File:</span>{' '}
                      {formData.academic.cvName || 'Standard Profile CV Attached'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Certifications:</span>{' '}
                      {formData.academic.certifications.length} verified qualification(s) recorded
                    </div>
                  </div>
                </div>

                {/* Statutory & Banking Box */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                    <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-forest-700" />
                      Statutory & Banking
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, step: 3 })}
                      className="text-xs text-forest-700 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-xs space-y-1 text-charcoal-700">
                    <div>
                      <span className="font-semibold text-charcoal-900">NIDA:</span>{' '}
                      {formData.statutory.nidaNumber || 'Pending'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">TIN:</span>{' '}
                      {formData.statutory.tinNumber || 'Pending'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">NSSF / PSSF:</span>{' '}
                      {formData.statutory.nssfNumber || formData.statutory.pssfNumber || 'Pending'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Bank:</span>{' '}
                      {formData.statutory.bankName} - {formData.statutory.bankAccountNumber || 'No Account'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Basic Salary:</span> TZS{' '}
                      {Number(formData.statutory.basicSalary).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ready for Finalization Notice */}
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm">Ready to Register Personnel Record</div>
                  <div>
                    Clicking "Finalize & Register Staff Member" will save the profile into the live HR registry,
                    automatically initialize annual and sick leave balances, create the onboarding verification checklist,
                    and dispatch organizational notifications.
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="px-6 py-4 bg-surface-muted/30 border-t border-surface-border flex items-center justify-between">
          <div>
            {formData.step > 0 && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleStepBack}
                disabled={isSubmitting}
                className="flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('common.back', 'Previous Step')}</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleManualSaveDraft}
              disabled={isSubmitting}
              className="flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{t('common.saveDraft', 'Save Draft')}</span>
            </Button>

            {formData.step < 4 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSaveAndContinue}
                className="flex items-center gap-2"
              >
                <span>{t('common.saveAndContinue', 'Save & Continue')}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSubmitStaff}
                isLoading={isSubmitting}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 border-emerald-800"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('hr.finalizeRegistration', 'Finalize & Register Staff Member')}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
