import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  DollarSign,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Save,
  RotateCcw,
  AlertCircle,
  MapPin,
  ShieldCheck,
  Check,
  FileStack,
  Sparkles,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Stepper, StepItem } from '@/components/ui/Stepper';
import { DocumentUploadSection, UploadedDocument } from '@/components/ui/DocumentUploadSection';
import { CreateProjectInput } from '../types/project';
import { createProject, saveProjectResultsFramework } from '../services/projectService';
import { fetchActiveStaffMembers, StaffMemberOption } from '@/services/staffService';
import { addNotification } from '@/services/notificationsService';
import { useAuth } from '@/features/auth/useAuth';
import { applyOrganizationTemplate, getOrganizationProjectTemplates, initializeProjectEngine } from '../dynamic/service';
import type { OrganizationProjectTemplate } from '../dynamic/types';
import {
  ProjectBlueprintBuilderStep,
  ProjectBlueprintState,
} from '../components/ProjectBlueprintBuilderStep';
import {
  ProjectResultsFrameworkBuilder,
  DraftOutcomeItem,
} from '../components/ProjectResultsFrameworkBuilder';
import { ORGANIZATIONAL_TEMPLATES } from '../dynamic/templates';
import { initializeProjectBlueprint } from '../dynamic/service';

const DRAFT_STORAGE_KEY = 'baoms_project_registration_draft';

const AVAILABLE_DISTRICTS = [
  'Dar es Salaam - Kigamboni',
  'Dar es Salaam - Ilala',
  'Dar es Salaam - Temeke',
  'Dar es Salaam - Kinondoni',
  'Dar es Salaam - Ubungo',
  'Coast Region - Bagamoyo',
  'Coast Region - Kibaha',
  'Morogoro - Kilosa',
];

interface ProjectDraftState {
  step: number;
  savedAt: string;
  templateVersionId?: string;
  identity: {
    projectCode: string;
    name: string;
    category: string;
    description: string;
    objectives: string;
    beneficiaries: string;
  };
  funding: {
    funder: string;
    grantNumber: string;
    startDate: string;
    endDate: string;
    totalBudget: string;
    currency: string;
    disbursementSchedule: string;
  };
  governance: {
    managerId: string;
    coordinatorId: string;
    targetRegions: string[];
    partnerOrganizations: string;
  };
  resultsFramework: DraftOutcomeItem[];
  blueprint: ProjectBlueprintState;
}

const INITIAL_PROJECT_DRAFT: ProjectDraftState = {
  step: 0,
  savedAt: '',
  templateVersionId: '',
  identity: {
    projectCode: '',
    name: '',
    category: 'Youth Empowerment & Education',
    description: '',
    objectives: '',
    beneficiaries: '1,500 Vulnerable Children and Youth',
  },
  funding: {
    funder: '',
    grantNumber: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    totalBudget: '75000000',
    currency: 'TZS',
    disbursementSchedule: 'Quarterly tranches based on approved milestone verification.',
  },
  governance: {
    managerId: '',
    coordinatorId: '',
    targetRegions: ['Dar es Salaam - Kigamboni', 'Dar es Salaam - Temeke'],
    partnerOrganizations: 'Local Ward Development Committees, CBO Coalition',
  },
  resultsFramework: [
    {
      id: 'out-1',
      code: 'OUT-1',
      title: 'Community Empowerment & Youth Competency Development',
      description: 'Strengthen community livelihoods, vocational skills, and child protection capacities.',
      targetIndicator: 'Number of youth successfully completing vocational readiness program',
      outputs: [
        {
          id: 'outp-1.1',
          code: 'OUTP-1.1',
          title: 'Direct Practical Skills and Entrepreneurship Training Cohorts',
          description: 'Delivery of structured hands-on modules in target municipal wards.',
          targetQuantity: 150,
          targetUnit: 'youth participants',
          activities: [
            {
              id: 'act-1.1.1',
              code: 'ACT-1.1.1',
              title: 'Community Stakeholder Mobilization & Candidate Onboarding',
              description: 'Ward-level introductory briefing and enrollment of eligible youth participants.',
              activityDate: new Date().toISOString().slice(0, 10),
              wardLocation: 'Dar es Salaam - Kigamboni',
              targetParticipants: 60,
              budgetEstimated: 2500000,
              assignedStaffId: '',
              procurementRequired: true,
            },
            {
              id: 'act-1.1.2',
              code: 'ACT-1.1.2',
              title: '5-Day Intensive Practical Skills & Financial Literacy Training',
              description: 'Hands-on training sessions in entrepreneurship, small business management, and life skills.',
              activityDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              wardLocation: 'Dar es Salaam - Temeke',
              targetParticipants: 50,
              budgetEstimated: 4800000,
              assignedStaffId: '',
              procurementRequired: true,
            },
          ],
        },
      ],
    },
  ],
  blueprint: {
    templateId: ORGANIZATIONAL_TEMPLATES[0].id,
    collectionCadence: 'monthly',
    assignedRole: 'coordinator',
    indicators: ORGANIZATIONAL_TEMPLATES[0].indicators.map((ind) => ({
      code: ind.code,
      name: ind.name,
      description: ind.description,
      unit: ind.unit,
      target: String(ind.defaultTarget),
      baseline: '0',
      calculationType: ind.calculationType,
      sourceFieldKey: ind.sourceFieldKey,
    })),
    formName: ORGANIZATIONAL_TEMPLATES[0].form.name,
    formFields: ORGANIZATIONAL_TEMPLATES[0].form.fields.map((f) => ({
      key: f.key,
      label: f.label,
      type: f.type,
      required: f.required,
      helpText: f.helpText,
    })),
    checklists: [...ORGANIZATIONAL_TEMPLATES[0].checklists],
  },
};

export const RegisterProjectPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [activeStaff, setActiveStaff] = useState<StaffMemberOption[]>([]);
  const [approvedTemplates, setApprovedTemplates] = useState<OrganizationProjectTemplate[]>([]);

  useEffect(() => {
    fetchActiveStaffMembers().then((staff) => {
      setActiveStaff(staff);
      const defaultManager = staff.find((a) => a.role === 'project_manager')?.id || staff[0]?.id || '';
      const defaultCoordinator = staff.find((a) => a.role === 'project_coordinator')?.id || staff[1]?.id || '';
      setFormData((prev) => ({
        ...prev,
        governance: {
          ...prev.governance,
          managerId: prev.governance.managerId || defaultManager,
          coordinatorId: prev.governance.coordinatorId || defaultCoordinator,
        },
      }));
    });
  }, []);

  useEffect(() => {
    getOrganizationProjectTemplates()
      .then((templates) => setApprovedTemplates(templates.filter((template) => template.status === 'active')))
      .catch(() => setApprovedTemplates([]));
  }, []);

  const [formData, setFormData] = useState<ProjectDraftState>({
    ...INITIAL_PROJECT_DRAFT,
    governance: {
      ...INITIAL_PROJECT_DRAFT.governance,
      managerId: '',
      coordinatorId: '',
    },
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [hasDraftRestored, setHasDraftRestored] = useState(false);
  const [saveTimestamp, setSaveTimestamp] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore draft if available
  useEffect(() => {
    const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (rawDraft) {
      try {
        const parsed = JSON.parse(rawDraft) as ProjectDraftState;
        if (parsed && (parsed.identity?.name || parsed.identity?.projectCode)) {
          setFormData({
            ...INITIAL_PROJECT_DRAFT,
            ...parsed,
            blueprint: parsed.blueprint || INITIAL_PROJECT_DRAFT.blueprint,
            resultsFramework: parsed.resultsFramework || INITIAL_PROJECT_DRAFT.resultsFramework,
          });
          setHasDraftRestored(true);
          setSaveTimestamp(parsed.savedAt);
          const standardSectors = [
            'Youth Empowerment & Education',
            'Early Childhood Development (ECD)',
            'Community Arts, Theater & Culture',
            'Child Safeguarding & Rights',
            'Civic Engagement & Social Action',
          ];
          if (parsed.identity?.category && !standardSectors.includes(parsed.identity.category)) {
            setIsCustomCategory(true);
          }
          const pastCompleted: number[] = [];
          for (let i = 0; i < parsed.step; i++) pastCompleted.push(i);
          setCompletedSteps(pastCompleted);
        }
      } catch (e) {
        console.error('Failed to parse project draft:', e);
      }
    }
  }, []);

  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  const steps: StepItem[] = [
    {
      id: 0,
      title: t('projects.stepper.identity', 'Project Identity & Scope'),
      subtitle: t('projects.stepper.identitySub', 'Code, Name & Objectives'),
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      id: 1,
      title: t('projects.stepper.funding', 'Funding & Timeline'),
      subtitle: t('projects.stepper.fundingSub', 'Funder, Grant & Budget'),
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      id: 2,
      title: t('projects.stepper.governance', 'Governance & Regions'),
      subtitle: t('projects.stepper.governanceSub', 'Manager, Team & Districts'),
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 3,
      title: 'Results Framework',
      subtitle: 'Outcomes, Outputs & Activities',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 4,
      title: 'M&E Blueprint & Forms',
      subtitle: 'Dynamic Metrics, Registers & KPIs',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 5,
      title: t('projects.stepper.documents', 'Supporting Documents'),
      subtitle: t('projects.stepper.documentsSub', 'Charters, MoUs & Grants'),
      icon: <FileStack className="w-4 h-4" />,
    },
    {
      id: 6,
      title: t('projects.stepper.review', 'Review & Approval'),
      subtitle: t('projects.stepper.reviewSub', 'Final Verification'),
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ];

  const persistDraft = (data: ProjectDraftState, stepIndex: number) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const updatedDraft: ProjectDraftState = {
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
    setFormData({
      ...INITIAL_PROJECT_DRAFT,
      governance: {
        ...INITIAL_PROJECT_DRAFT.governance,
        managerId: defaultManager,
        coordinatorId: defaultCoordinator,
      },
    });
    setCompletedSteps([]);
    setHasDraftRestored(false);
    setSaveTimestamp(null);
    setValidationError(null);
  };

  const validateCurrentStep = (step: number): boolean => {
    setValidationError(null);

    if (step === 0) {
      if (!formData.identity.projectCode.trim()) {
        setValidationError(t('projects.errors.codeRequired', 'Project Code is required.'));
        return false;
      }
      if (!formData.identity.name.trim()) {
        setValidationError(t('projects.errors.nameRequired', 'Project Name is required.'));
        return false;
      }
      return true;
    }

    if (step === 1) {
      if (!formData.funding.funder.trim()) {
        setValidationError(t('projects.errors.funderRequired', 'Funder / Grant Donor is required.'));
        return false;
      }
      if (!formData.funding.startDate) {
        setValidationError(t('projects.errors.startDateRequired', 'Start date is required.'));
        return false;
      }
      if (!formData.funding.endDate) {
        setValidationError(t('projects.errors.endDateRequired', 'End date is required.'));
        return false;
      }
      if (new Date(formData.funding.endDate) < new Date(formData.funding.startDate)) {
        setValidationError(t('projects.errors.invalidDates', 'End date must be on or after start date.'));
        return false;
      }
      const bNum = parseFloat(formData.funding.totalBudget);
      if (isNaN(bNum) || bNum <= 0) {
        setValidationError(t('projects.errors.invalidBudget', 'Please specify a valid total budget amount.'));
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.governance.managerId) {
        setValidationError(t('projects.errors.managerRequired', 'Project Manager assignment is required.'));
        return false;
      }
      if (formData.governance.targetRegions.length === 0) {
        setValidationError(t('projects.errors.regionsRequired', 'Please select at least one implementation district.'));
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!formData.resultsFramework || formData.resultsFramework.length === 0) {
        setValidationError('At least one Strategic Outcome is required in the Results Framework.');
        return false;
      }
      for (const outcome of formData.resultsFramework) {
        if (!outcome.code.trim() || !outcome.title.trim()) {
          setValidationError('All Outcomes must have a valid Code and Title.');
          return false;
        }
        for (const output of outcome.outputs) {
          if (!output.code.trim() || !output.title.trim()) {
            setValidationError('All Outputs must have a valid Code and Title.');
            return false;
          }
          for (const act of output.activities) {
            if (!act.code.trim() || !act.title.trim()) {
              setValidationError('All Activities must have an Activity Code and Title.');
              return false;
            }
          }
        }
      }
      return true;
    }

    if (step === 4) {
      if (
        formData.blueprint.indicators.some(
          (ind) => !ind.code.trim() || !ind.name.trim() || !ind.sourceFieldKey.trim()
        )
      ) {
        setValidationError('Every performance indicator must have a valid Code, Title, and Source Field Key.');
        return false;
      }
      if (
        formData.blueprint.formFields.some((f) => !f.key.trim() || !f.label.trim())
      ) {
        setValidationError('Every question in the collection form must have a Field Key and Label.');
        return false;
      }
      return true;
    }

    return true;
  };

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

  const toggleRegion = (district: string) => {
    const current = formData.governance.targetRegions;
    if (current.includes(district)) {
      setFormData({
        ...formData,
        governance: {
          ...formData.governance,
          targetRegions: current.filter((d) => d !== district),
        },
      });
    } else {
      setFormData({
        ...formData,
        governance: {
          ...formData.governance,
          targetRegions: [...current, district],
        },
      });
    }
  };

  const handleFinalizeProject = async () => {
    setIsSubmitting(true);
    setValidationError(null);

    try {
      const budgetNum = parseFloat(formData.funding.totalBudget);

      const input: CreateProjectInput = {
        projectCode: formData.identity.projectCode.trim().toUpperCase(),
        name: formData.identity.name.trim(),
        description:
          formData.identity.description.trim() ||
          formData.identity.objectives.trim() ||
          undefined,
        funder: formData.funding.funder.trim(),
        startDate: formData.funding.startDate,
        endDate: formData.funding.endDate,
        totalBudget: budgetNum,
        currency: formData.funding.currency,
        managerId: formData.governance.managerId,
        coordinatorId: formData.governance.coordinatorId || undefined,
      };

      const actor = {
        id: user?.id || 'admin',
        name: profile?.display_name || 'Admin',
      };

      const created = await createProject(input, actor);

      let templateApplyError: string | null = null;
      if (formData.templateVersionId) {
        try {
          // An approved database template is a complete starter configuration.
          // Do not also apply the wizard's local blueprint or it would duplicate forms and indicators.
          await applyOrganizationTemplate(created.id, formData.templateVersionId);
        } catch (templateError) {
          templateApplyError = templateError instanceof Error ? templateError.message : String(templateError);
        }
      } else {
        try {
          // Every project receives an immutable initial configuration snapshot,
          // including projects whose indicators/forms come from the wizard.
          await initializeProjectEngine(created.id);
          if (formData.blueprint && (formData.blueprint.indicators.length > 0 || formData.blueprint.formFields.length > 0)) {
            await initializeProjectBlueprint({
              projectId: created.id,
              userId: user?.id || 'admin',
              indicators: formData.blueprint.indicators.map((ind) => ({
                code: ind.code.trim().toUpperCase(),
                name: ind.name.trim(),
                description: ind.description.trim(),
                unit: ind.unit.trim() || 'count',
                target: ind.target ? parseFloat(ind.target) : null,
                baseline: ind.baseline ? parseFloat(ind.baseline) : null,
                calculationType: ind.calculationType,
                sourceFieldKey: ind.sourceFieldKey.trim(),
                aggregation:
                  ind.calculationType === 'average'
                    ? 'average'
                    : ind.calculationType === 'latest_value_or_milestone_state'
                    ? 'latest'
                    : 'sum',
              })),
              forms: formData.blueprint.formFields.length
                ? [{
                    name: formData.blueprint.formName.trim() || `${created.name} Activity Log`,
                    fields: formData.blueprint.formFields.map((f) => ({
                      key: f.key.trim(),
                      label: f.label.trim(),
                      type: f.type,
                      required: f.required,
                      helpText: f.helpText,
                    })),
                    publishImmediately: true,
                  }]
                : [],
            });
          }
        } catch (engineError) {
          templateApplyError = engineError instanceof Error ? engineError.message : String(engineError);
        }
      }

      // Persist Results Framework (Outcomes -> Outputs -> Activities)
      if (formData.resultsFramework && formData.resultsFramework.length > 0) {
        try {
          await saveProjectResultsFramework(created.id, formData.resultsFramework, user?.id);
        } catch (rfErr) {
          console.error('[RegisterProjectPage] Failed to save project results framework:', rfErr);
        }
      }

      // Organizational notification
      addNotification({
        title: `New Project Launched: ${created.name}`,
        message: `Project ${created.projectCode} was registered with total budget of ${created.currency} ${created.totalBudget.toLocaleString()}.`,
        type: 'project',
        targetRole: 'all',
        link: `/projects/${created.id}`,
      });

      if (templateApplyError) {
        addNotification({
          title: 'Project registered; dynamic setup needs attention',
          message: `Project ${created.projectCode} was created, but its dynamic configuration could not be initialized: ${templateApplyError}`,
          type: 'project',
          targetRole: 'project_manager',
          link: `/projects/${created.id}/engine`,
        });
      }

      // Clear draft
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      // Navigate to project workspace or list
      navigate(`/projects/${created.id}`);
    } catch (err: unknown) {
      setValidationError((err as Error).message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedManager = activeStaff.find((s) => s.id === formData.governance.managerId);
  const selectedCoordinator = activeStaff.find((s) => s.id === formData.governance.coordinatorId);

  const totalOutputs = (formData.resultsFramework || []).reduce(
    (sum, o) => sum + (o.outputs?.length || 0),
    0
  );
  const totalActivities = (formData.resultsFramework || []).reduce(
    (sum, o) => sum + (o.outputs || []).reduce((actSum, op) => actSum + (op.activities?.length || 0), 0),
    0
  );
  const totalActivityBudget = (formData.resultsFramework || []).reduce(
    (sum, o) =>
      sum +
      (o.outputs || []).reduce(
        (actSum, op) =>
          actSum + (op.activities || []).reduce((bSum, a) => bSum + (a.budgetEstimated || 0), 0),
        0
      ),
    0
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title={t('projects.registerPageTitle', 'Project Registration & Chartering')}
        subtitle={t(
          'projects.registerPageSubtitle',
          'Complete dedicated multi-step registration for new organization programs, grant agreements, and project teams.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('navigation.projects', 'Projects'), href: '/projects' },
          { label: t('projects.newProject', 'New Project') },
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
              onClick={() => navigate('/projects')}
            >
              {t('common.cancel', 'Exit to Projects')}
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
              <strong>Draft restored:</strong> You are continuing an existing project registration draft saved at{' '}
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
        {/* Step 1: Project Identity & Scope */}
        {formData.step === 0 && (
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-forest-700" />
                <CardTitle>{t('projects.step1Title', 'Step 1: Project Identity & Scope')}</CardTitle>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Define the project alphanumeric identifier, official program title, sector category, and core objectives.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Select
                label="Project setup template"
                value={formData.templateVersionId || ''}
                onChange={(e) => setFormData({ ...formData, templateVersionId: e.target.value })}
                options={[
                  { value: '', label: 'Build from scratch' },
                  ...approvedTemplates.flatMap((template) => template.versions
                    .filter((version) => version.status === 'published')
                    .map((version) => ({ value: version.id, label: `${template.name} · v${version.versionNumber}` }))),
                ]}
                helperText="Approved templates preconfigure indicators and published field forms. You can customize them in the project workspace."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={`${t('projects.fields.projectCode', 'Project Code')} *`}
                  placeholder="e.g. PRJ-BYA-2026"
                  value={formData.identity.projectCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      identity: { ...formData.identity, projectCode: e.target.value.toUpperCase() },
                    })
                  }
                  helperText="Unique alphanumeric project code"
                  required
                />

                <Select
                  label={t('projects.fields.category', 'Program Sector / Category')}
                  value={isCustomCategory ? 'other' : formData.identity.category}
                  onChange={(e) => {
                    if (e.target.value === 'other') {
                      setIsCustomCategory(true);
                      setFormData({
                        ...formData,
                        identity: { ...formData.identity, category: '' },
                      });
                    } else {
                      setIsCustomCategory(false);
                      setFormData({
                        ...formData,
                        identity: { ...formData.identity, category: e.target.value },
                      });
                    }
                  }}
                  options={[
                    { value: 'Youth Empowerment & Education', label: 'Youth Empowerment & Education' },
                    { value: 'Early Childhood Development (ECD)', label: 'Early Childhood Development (ECD)' },
                    { value: 'Community Arts, Theater & Culture', label: 'Community Arts, Theater & Culture' },
                    { value: 'Child Safeguarding & Rights', label: 'Child Safeguarding & Rights' },
                    { value: 'Civic Engagement & Social Action', label: 'Civic Engagement & Social Action' },
                    { value: 'other', label: 'Other (Sector not listed)...' },
                  ]}
                />

                {isCustomCategory && (
                  <Input
                    label="Specify Custom Sector / Category *"
                    placeholder="e.g. Environmental Conservation & Climate Action"
                    value={formData.identity.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identity: { ...formData.identity, category: e.target.value },
                      })
                    }
                    required
                  />
                )}

                <div className="md:col-span-2">
                  <Input
                    label={`${t('projects.fields.projectName', 'Official Project Name')} *`}
                    placeholder="e.g. Babawatoto Youth Academy 2026: Vocational & Cultural Literacy Initiative"
                    value={formData.identity.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identity: { ...formData.identity, name: e.target.value },
                      })
                    }
                    required
                  />
                </div>
              </div>

              <Textarea
                label={t('projects.fields.description', 'Project Description & Background')}
                placeholder="Detailed executive summary of the program, target communities, problem statement, and organizational mandate..."
                value={formData.identity.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    identity: { ...formData.identity, description: e.target.value },
                  })
                }
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                  label={t('projects.fields.objectives', 'Core Strategic Objectives & Key Milestones')}
                  placeholder="1. Train 500 youth in digital literacy.&#10;2. Establish 10 community arts hubs.&#10;3. Distribute education kits."
                  value={formData.identity.objectives}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      identity: { ...formData.identity, objectives: e.target.value },
                    })
                  }
                  rows={3}
                />

                <Input
                  label={t('projects.fields.beneficiaries', 'Target Beneficiaries & Estimated Reach')}
                  placeholder="e.g. 1,500 children and adolescent youth"
                  value={formData.identity.beneficiaries}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      identity: { ...formData.identity, beneficiaries: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </div>
        )}

        {/* Step 2: Strategic Funding & Timeline */}
        {formData.step === 1 && (
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-forest-700" />
                <CardTitle>{t('projects.step2Title', 'Step 2: Strategic Funding & Timeline')}</CardTitle>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Configure donor grant details, contractual timeline, total approved budget, and financial disbursement terms.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={`${t('projects.fields.funder', 'Grant Donor / Funding Partner')} *`}
                  placeholder="e.g. Foundation for Civil Society (FCS)"
                  value={formData.funding.funder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      funding: { ...formData.funding, funder: e.target.value },
                    })
                  }
                  required
                />

                <Input
                  label={t('projects.fields.grantNumber', 'Grant Agreement Reference Number')}
                  placeholder="e.g. FCS/TZ/2026/G-8812"
                  value={formData.funding.grantNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      funding: { ...formData.funding, grantNumber: e.target.value },
                    })
                  }
                />

                <Input
                  type="date"
                  label={`${t('projects.fields.startDate', 'Contract Agreement Start Date')} *`}
                  value={formData.funding.startDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      funding: { ...formData.funding, startDate: e.target.value },
                    })
                  }
                  required
                />

                <Input
                  type="date"
                  label={`${t('projects.fields.endDate', 'Contract Agreement End Date')} *`}
                  value={formData.funding.endDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      funding: { ...formData.funding, endDate: e.target.value },
                    })
                  }
                  required
                />

                <Input
                  type="number"
                  min="0"
                  step="1000"
                  label={`${t('projects.fields.totalBudget', 'Total Approved Project Budget')} *`}
                  placeholder="75000000"
                  value={formData.funding.totalBudget}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      funding: { ...formData.funding, totalBudget: e.target.value },
                    })
                  }
                  required
                />

                <Select
                  label={`${t('projects.fields.currency', 'Operating Currency')} *`}
                  value={formData.funding.currency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      funding: { ...formData.funding, currency: e.target.value },
                    })
                  }
                  options={[
                    { value: 'TZS', label: 'TZS (Tanzanian Shilling)' },
                    { value: 'USD', label: 'USD (United States Dollar)' },
                    { value: 'EUR', label: 'EUR (Euro)' },
                  ]}
                />
              </div>

              <Textarea
                label={t('projects.fields.disbursementSchedule', 'Disbursement Schedule & Milestone Tranches')}
                placeholder="e.g. 40% initial mobilization advance upon signing, 40% upon Midterm Progress Report approval, 20% upon Final Evaluation."
                value={formData.funding.disbursementSchedule}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    funding: { ...formData.funding, disbursementSchedule: e.target.value },
                  })
                }
                rows={2}
              />
            </CardContent>
          </div>
        )}

        {/* Step 3: Governance Team & Target Regions */}
        {formData.step === 2 && (
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-forest-700" />
                <CardTitle>{t('projects.step3Title', 'Step 3: Governance Team & Target Regions')}</CardTitle>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Assign institutional leads, field coordinators, partner organizations, and geographic implementation districts.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={`${t('projects.fields.projectManager', 'Assigned Project Manager')} *`}
                  value={formData.governance.managerId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      governance: { ...formData.governance, managerId: e.target.value },
                    })
                  }
                  options={activeStaff.map((s) => ({
                    value: s.id,
                    label: `${s.displayName} (${s.role.replace('_', ' ')})`,
                  }))}
                  required
                />

                <Select
                  label={t('projects.fields.projectCoordinator', 'Assigned Field Coordinator (Optional)')}
                  value={formData.governance.coordinatorId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      governance: { ...formData.governance, coordinatorId: e.target.value },
                    })
                  }
                  options={[
                    { value: '', label: '-- None / Direct Management --' },
                    ...activeStaff.map((s) => ({
                      value: s.id,
                      label: `${s.displayName} (${s.role.replace('_', ' ')})`,
                    })),
                  ]}
                />

                <div className="md:col-span-2">
                  <Input
                    label={t('projects.fields.partnerOrganizations', 'Partner Organizations & Stakeholders')}
                    placeholder="e.g. Kigamboni Community Center, Ward Social Welfare Office"
                    value={formData.governance.partnerOrganizations}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        governance: {
                          ...formData.governance,
                          partnerOrganizations: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              {/* District Selection Chips */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-surface-border pb-2">
                  <label className="text-xs font-semibold text-charcoal-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-forest-700" />
                    Target Implementation Districts *
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-charcoal-muted">
                      {formData.governance.targetRegions.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.governance.targetRegions.length === AVAILABLE_DISTRICTS.length) {
                          setFormData((prev) => ({
                            ...prev,
                            governance: { ...prev.governance, targetRegions: [] },
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            governance: { ...prev.governance, targetRegions: [...AVAILABLE_DISTRICTS] },
                          }));
                        }
                      }}
                      className="text-xs text-charcoal-700 hover:text-charcoal-900 font-semibold underline underline-offset-2 cursor-pointer"
                    >
                      {formData.governance.targetRegions.length === AVAILABLE_DISTRICTS.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {AVAILABLE_DISTRICTS.map((district) => {
                    const isSelected = formData.governance.targetRegions.includes(district);
                    return (
                      <button
                        type="button"
                        key={district}
                        onClick={() => toggleRegion(district)}
                        className={`px-3 py-2 text-xs rounded-lg border text-left flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-forest-50 border-forest-600 text-forest-900 font-semibold'
                            : 'bg-white border-surface-border text-charcoal-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{district}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-forest-700" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </div>
        )}

        {/* Step 4: Results Framework & Activities Hierarchy */}
        {formData.step === 3 && (
          <div className="p-6">
            <ProjectResultsFrameworkBuilder
              outcomes={formData.resultsFramework || []}
              onChange={(rf) => setFormData((prev) => ({ ...prev, resultsFramework: rf }))}
              staffList={activeStaff}
              currency={formData.funding.currency}
            />
          </div>
        )}

        {/* Step 5: Dynamic M&E Blueprint, Indicators & Form Builder */}
        {formData.step === 4 && (
          <div className="p-6">
            <ProjectBlueprintBuilderStep
              blueprint={formData.blueprint}
              onChange={(bp) => setFormData((prev) => ({ ...prev, blueprint: bp }))}
            />
          </div>
        )}

        {/* Step 6: Supporting Documents (Optional with custom rename) */}
        {formData.step === 5 && (
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileStack className="w-5 h-5 text-slate-700" />
                <CardTitle>{t('projects.step3DocsTitle', 'Step 6: Supporting Documentation & Charters')}</CardTitle>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Attach project charters, donor MoUs, concept proposals, and baseline reports. You can rename each document by custom name.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <DocumentUploadSection
                documents={documents}
                onChange={setDocuments}
                title="Upload Project Files"
                hint="PDF, PNG, JPG, or spreadsheets up to 25MB each. You can customize the name of each document before submission."
              />
            </CardContent>
          </div>
        )}

        {/* Step 7: Review, Budget Allocation & Final Approval */}
        {formData.step === 6 && (
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-forest-700" />
                <CardTitle>{t('projects.step4Title', 'Step 7: Review Project Charter & Finalize')}</CardTitle>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Verify all operational metrics, financial appropriations, and team assignments before creating the workspace.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Review summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Identity Box */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                    <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-forest-700" />
                      Project Identity
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
                      <span className="font-semibold text-charcoal-900">Code:</span>{' '}
                      <span className="font-mono bg-white px-1 py-0.5 rounded border border-surface-border">
                        {formData.identity.projectCode}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Name:</span> {formData.identity.name}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Category:</span> {formData.identity.category}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Target Reach:</span>{' '}
                      {formData.identity.beneficiaries}
                    </div>
                  </div>
                </div>

                {/* Funding Box */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                    <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-forest-700" />
                      Funding & Timeline
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
                      <span className="font-semibold text-charcoal-900">Funder / Donor:</span> {formData.funding.funder}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Grant Ref:</span>{' '}
                      {formData.funding.grantNumber || 'Pending'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Duration:</span>{' '}
                      {formData.funding.startDate} to {formData.funding.endDate}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Total Budget:</span>{' '}
                      <span className="font-bold text-emerald-800 font-mono">
                        {formData.funding.currency} {Number(formData.funding.totalBudget).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Governance Box */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                    <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-forest-700" />
                      Governance Team
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
                      <span className="font-semibold text-charcoal-900">Manager:</span>{' '}
                      {selectedManager?.displayName} ({selectedManager?.role.replace('_', ' ')})
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Coordinator:</span>{' '}
                      {selectedCoordinator?.displayName || 'Unassigned / Direct'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Partners:</span>{' '}
                      {formData.governance.partnerOrganizations || 'None'}
                    </div>
                  </div>
                </div>

                {/* Target Regions Box */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                    <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-forest-700" />
                      Implementation Geography
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
                    <div className="flex flex-wrap gap-1 pt-1">
                      {formData.governance.targetRegions.map((region) => (
                        <span
                          key={region}
                          className="bg-white border border-surface-border text-charcoal-800 px-2 py-0.5 rounded text-[11px] font-medium"
                        >
                          {region}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Results Framework Summary Box */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                    <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-forest-700" />
                      Results Framework &amp; Activities ({totalActivities} Activities planned)
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, step: 3 })}
                      className="text-xs text-forest-700 hover:underline font-semibold"
                    >
                      Edit Framework
                    </button>
                  </div>
                  <div className="text-xs space-y-2 text-charcoal-700 pt-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span><strong>Strategic Outcomes:</strong> {formData.resultsFramework?.length || 0}</span>
                      <span>•</span>
                      <span><strong>Deliverable Outputs:</strong> {totalOutputs}</span>
                      <span>•</span>
                      <span><strong>Activities:</strong> {totalActivities}</span>
                      <span>•</span>
                      <span><strong>Estimated Activity Budget:</strong> <span className="font-mono font-bold text-emerald-800">{formData.funding.currency} {totalActivityBudget.toLocaleString()}</span></span>
                    </div>
                  </div>
                </div>

                {/* Dynamic M&E Blueprint & Indicators Box */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                    <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-forest-700" />
                      Dynamic M&amp;E Blueprint ({formData.blueprint?.indicators.length || 0} Performance Indicators)
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, step: 4 })}
                      className="text-xs text-forest-700 hover:underline font-semibold"
                    >
                      Edit Blueprint
                    </button>
                  </div>
                  <div className="text-xs space-y-2 text-charcoal-700 pt-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span><strong>Collection Form:</strong> {formData.blueprint?.formName} ({formData.blueprint?.formFields.length || 0} questions)</span>
                      <span>•</span>
                      <span><strong>Checklists:</strong> {formData.blueprint?.checklists.length || 0} quality criteria</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                      {formData.blueprint?.indicators.map((ind, i) => (
                        <div key={i} className="p-2 rounded bg-white border border-surface-border flex items-center justify-between">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-forest-800 bg-forest-50 px-1 py-0.5 rounded mr-1.5">{ind.code}</span>
                            <span className="font-medium text-slate-800 text-[11px]">{ind.name}</span>
                          </div>
                          {ind.target && (
                            <span className="text-[11px] font-bold text-forest-700 whitespace-nowrap ml-2">
                              Goal: {ind.target} {ind.unit}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Supporting Documents Box */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                    <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileStack className="w-3.5 h-3.5 text-forest-700" />
                      Attached Project Documents ({documents.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, step: 5 })}
                      className="text-xs text-forest-700 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  {documents.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No supporting documents uploaded.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {documents.map((d) => (
                        <div key={d.id} className="p-2 rounded bg-white border border-surface-border flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-800">{d.customName}</span>
                            <span className="text-slate-400 ml-1.5">({d.file.name})</span>
                          </div>
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase font-mono">
                            {d.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ready for Finalization Notice */}
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm">Ready to Charter Project Workspace</div>
                  <div>
                    Clicking "Launch Project Workspace" will establish the project code{' '}
                    <span className="font-mono font-bold">{formData.identity.projectCode}</span> in the registry,
                    initialize the initial budget appropriation ledger of {formData.funding.currency}{' '}
                    {Number(formData.funding.totalBudget).toLocaleString()}, assign governance roles, and open the
                    dedicated project workspace.
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

            {formData.step < 6 ? (
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
                onClick={handleFinalizeProject}
                isLoading={isSubmitting}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 border-emerald-800"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('projects.launchProject', 'Launch Project Workspace')}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
