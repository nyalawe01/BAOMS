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
import { supabase } from '@/lib/supabase';
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
    partnerOrganizations: string;
  };
  funding: {
    funder: string;
    grantNumber: string;
    startDate: string;
    endDate: string;
    totalBudget: string;
    currency: string;
    durationCadence: string;
  };
  governance: {
    managerId: string;
    coordinatorId: string;
    countries: string[];
    regions: string[];
    districts: string[];
    wards: string[];
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
    partnerOrganizations: 'Local Ward Development Committees, CBO Coalition',
  },
  funding: {
    funder: '',
    grantNumber: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    totalBudget: '75000000',
    currency: 'TZS',
    durationCadence: 'Annually',
  },
  governance: {
    managerId: '',
    coordinatorId: '',
    countries: ['Tanzania'],
    regions: ['Dar es Salaam'],
    districts: ['Kigamboni', 'Ilala'],
    wards: ['Somangila', 'Vijibweni'],
    targetRegions: ['Dar es Salaam - Kigamboni', 'Dar es Salaam - Ilala'],
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
              wardLocation: 'Kigamboni - Somangila',
              targetParticipants: 60,
              budgetEstimated: 0,
              assignedStaffId: '',
              procurementRequired: true,
            },
            {
              id: 'act-1.1.2',
              code: 'ACT-1.1.2',
              title: '5-Day Intensive Practical Skills & Financial Literacy Training',
              description: 'Hands-on training sessions in entrepreneurship, small business management, and life skills.',
              activityDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              wardLocation: 'Kigamboni - Vijibweni',
              targetParticipants: 50,
              budgetEstimated: 0,
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
    checklists: [],
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
            governance: {
              ...INITIAL_PROJECT_DRAFT.governance,
              ...(parsed.governance || {}),
              countries: parsed.governance?.countries || ['Tanzania'],
              regions: parsed.governance?.regions || ['Dar es Salaam'],
              districts: parsed.governance?.districts || ['Kigamboni'],
              wards: parsed.governance?.wards || ['Somangila'],
            },
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
      title: 'Identity & Reference Docs',
      subtitle: 'Code, Name, Partners & Attachments',
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      id: 1,
      title: 'Budget & Project Duration',
      subtitle: 'Total Budget, Cadence & Timeline',
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      id: 2,
      title: 'Governance & Locations',
      subtitle: 'Manager & Cascading Coverage',
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
      title: 'M&E Blueprint',
      subtitle: 'Indicators & Collection Forms',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 5,
      title: 'Review & Finalize',
      subtitle: 'Final Verification & Charter',
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
      if (!formData.governance.countries || formData.governance.countries.length === 0) {
        setValidationError('At least one Implementation Country is required.');
        return false;
      }
      if (!formData.governance.regions || formData.governance.regions.length === 0) {
        setValidationError('At least one Implementation Region is required.');
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

  const handleFinalizeProject = async () => {
    setIsSubmitting(true);
    setValidationError(null);

    try {
      const budgetNum = parseFloat(formData.funding.totalBudget);

      const input: CreateProjectInput = {
        projectCode: formData.identity.projectCode.trim().toUpperCase(),
        name: formData.identity.name.trim(),
        description: formData.identity.description.trim() || undefined,
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

      // Persist supporting & reference documents attached in Step 0 into entity_supporting_documents
      if (documents && documents.length > 0) {
        for (const doc of documents) {
          try {
            let storagePath: string | null = null;
            if (doc.file) {
              const fileExt = doc.file.name.split('.').pop() || 'bin';
              const filePath = `projects/${created.id}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
              const { data: uploadData } = await supabase.storage
                .from('documents')
                .upload(filePath, doc.file, { upsert: true });
              if (uploadData?.path) {
                storagePath = uploadData.path;
              }
            }
            await supabase.from('entity_supporting_documents').insert({
              entity_type: 'project',
              entity_id: created.id,
              custom_name: doc.customName || doc.file.name,
              original_name: doc.file.name,
              document_tag: doc.tag || 'other',
              notes: doc.notes || '',
              storage_path: storagePath,
              file_size: doc.file.size,
              mime_type: doc.file.type,
              uploaded_by: user?.id || null,
            });
          } catch (docErr) {
            console.warn('[RegisterProjectPage] Could not persist entity document:', docErr);
          }
        }
      }

      let templateApplyError: string | null = null;
      try {
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

      // Navigate directly to project workspace
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

  // Derived locations from Step 2 (by District then Ward)
  const derivedLocations = useMemo(() => {
    const locs: string[] = [];
    const districts = formData.governance.districts || [];
    const wards = formData.governance.wards || [];
    if (districts.length > 0 && wards.length > 0) {
      districts.forEach((d) => {
        wards.forEach((w) => {
          locs.push(`${d} - ${w}`);
        });
      });
    } else if (districts.length > 0) {
      districts.forEach((d) => locs.push(d));
    } else if (formData.governance.regions?.length > 0) {
      formData.governance.regions.forEach((r) => locs.push(r));
    }
    return locs.length > 0
      ? locs
      : ['Kigamboni - Somangila', 'Kigamboni - Vijibweni', 'Ilala - Kivukoni', 'Bagamoyo - Kaole'];
  }, [formData.governance.districts, formData.governance.wards, formData.governance.regions]);

  const COUNTRY_OPTIONS = ['Tanzania', 'Kenya', 'Uganda', 'Rwanda', 'Burundi'];
  const REGION_OPTIONS = [
    'Dar es Salaam',
    'Pwani / Coast Region',
    'Morogoro',
    'Arusha',
    'Dodoma',
    'Mwanza',
    'Kilimanjaro',
    'Tanga',
    'Zanzibar',
  ];
  const DISTRICT_OPTIONS = [
    'Kigamboni',
    'Ilala',
    'Temeke',
    'Kinondoni',
    'Ubungo',
    'Bagamoyo',
    'Kibaha',
    'Kisarawe',
    'Kilosa',
    'Morogoro Urban',
    'Arusha City',
    'Dodoma Urban',
  ];
  const WARD_OPTIONS = [
    'Somangila',
    'Vijibweni',
    'Kivukoni',
    'Kariakoo',
    'Upanga',
    'Mbagala',
    'Magomeni',
    'Ubungo Mjini',
    'Bagamoyo Mjini',
    'Kaole',
    'Dunda',
    'Msata',
    'Zinga',
  ];

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
        {/* Step 1: Project Identity & Reference Documents */}
        {formData.step === 0 && (
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-forest-700" />
                <CardTitle>Step 1: Project Identity, Partners &amp; Reference Documents</CardTitle>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Establish the project code, title, sector category, partner organizations, and attach all reference documents and specifications.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={`${t('projects.fields.projectCode', 'Project Code (ID)')} *`}
                  placeholder="e.g. PRJ-BYA-2026"
                  value={formData.identity.projectCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      identity: { ...formData.identity, projectCode: e.target.value.toUpperCase() },
                    })
                  }
                  helperText="Unique alphanumeric identifier for this project"
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
                    label={`${t('projects.fields.projectName', 'Project Name / Title')} *`}
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

                <div className="md:col-span-2">
                  <Textarea
                    label="Project Description &amp; Specifics"
                    placeholder="Detailed executive description of the project, problem statement, community background, and specific implementation targets..."
                    value={formData.identity.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identity: { ...formData.identity, description: e.target.value },
                      })
                    }
                    rows={4}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Partners / Sponsors / Key Stakeholders"
                    placeholder="e.g. Foundation for Civil Society, Bagamoyo Arts Council, Ward Development Committees"
                    value={formData.identity.partnerOrganizations}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identity: { ...formData.identity, partnerOrganizations: e.target.value },
                      })
                    }
                    helperText="List supporting partners, funding sponsors, or municipal institutions"
                  />
                </div>
              </div>

              {/* Supporting & Reference Documents Upload */}
              <div className="pt-4 border-t border-surface-border">
                <DocumentUploadSection
                  documents={documents}
                  onChange={setDocuments}
                  title="Attach Relevant &amp; Reference Project Documents"
                  hint="Attach full project proposal, concept notes, donor agreement, specifications, or reference files (PDF, Word, Excel, PNG, max 25MB)."
                />
              </div>
            </CardContent>
          </div>
        )}

        {/* Step 2: Budget & Project Duration */}
        {formData.step === 1 && (
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-forest-700" />
                <CardTitle>Step 2: Allocated Project Budget &amp; Duration</CardTitle>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Insert the total approved budget for the whole project, operating currency, project duration cadence, and contract agreement timeline.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  label="Allocated Budget for the Whole Project *"
                  placeholder="75000000"
                  value={formData.funding.totalBudget}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      funding: { ...formData.funding, totalBudget: e.target.value },
                    })
                  }
                  helperText="Total financial ceiling appropriated for this project charter"
                  required
                />

                <Select
                  label="Operating Currency *"
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

                <Select
                  label="Project Duration / Implementation Cadence *"
                  value={formData.funding.durationCadence}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      funding: { ...formData.funding, durationCadence: e.target.value },
                    })
                  }
                  options={[
                    { value: 'Quarterly', label: 'Quarterly (3-Month Cadence)' },
                    { value: 'Semi-Annually', label: 'Semi-Annually (6-Month Cadence)' },
                    { value: 'Annually', label: 'Annually (12-Month Cadence)' },
                    { value: 'Multi-Year', label: 'Multi-Year Long-term Program' },
                    { value: 'Single Phase', label: 'Single Phase / Short Project' },
                  ]}
                  helperText="Reporting frequency and lifecycle review cadence"
                />

                <Input
                  label="Grant Donor / Funding Partner *"
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
                  label="Grant Agreement Reference Number (Optional)"
                  placeholder="e.g. FCS/TZ/2026/G-8812"
                  value={formData.funding.grantNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      funding: { ...formData.funding, grantNumber: e.target.value },
                    })
                  }
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    label="Start Date *"
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
                    label="End Date *"
                    value={formData.funding.endDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        funding: { ...formData.funding, endDate: e.target.value },
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                <Briefcase className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block mb-0.5">Budget Allocation Policy:</strong>
                  During initial project creation, budget is defined only as a whole-project appropriation. Budgets and funding requests are established individually per activity after formal Executive Director approval of the project charter.
                </div>
              </div>
            </CardContent>
          </div>
        )}

        {/* Step 3: Governance Team & Cascading Locations */}
        {formData.step === 2 && (
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-forest-700" />
                <CardTitle>Step 3: Governance &amp; Implementation Locations</CardTitle>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Designate the Project Manager responsible for institutional control and approval hierarchy, and select cascading implementation locations.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Governance staffing policy alert */}
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sm text-emerald-950 block mb-1">Collaborative Staff Participation:</strong>
                  All project activities will be handled collectively by all staff members due to lean team capacity. No separate staff participant assignments are required; assigning the responsible Project Manager establishes the necessary hierarchy of control, approval gates, and operational oversight.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Assigned Responsible Project Manager *"
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
                  helperText="Lead responsible officer for project execution, approvals, and reporting"
                  required
                />

                <Select
                  label="Assigned Field Coordinator (Optional)"
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
                  helperText="Field monitoring and operational coordination lead"
                />
              </div>

              {/* Geographic Cascading Dropdowns */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-surface-border pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-forest-700" />
                    Target Implementation Geography (Multi-Select Dropdowns)
                  </h3>
                  <p className="text-[11px] text-charcoal-muted mt-0.5">
                    Select the geographic coverage. Country and Region are required; District and Ward are optional and derive activity location choices.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Country Dropdown (Required) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-charcoal-800">
                      Country * <span className="text-rose-600">(Must select at least one)</span>
                    </label>
                    <div className="p-3 rounded-lg border border-surface-border bg-slate-50/50 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {COUNTRY_OPTIONS.map((c) => {
                          const isSel = formData.governance.countries?.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                const current = formData.governance.countries || [];
                                const updated = isSel ? current.filter((x) => x !== c) : [...current, c];
                                setFormData((prev) => ({
                                  ...prev,
                                  governance: { ...prev.governance, countries: updated },
                                }));
                              }}
                              className={`px-2.5 py-1 text-xs rounded-md border font-medium flex items-center gap-1 transition-colors ${
                                isSel
                                  ? 'bg-forest-50 border-forest-600 text-forest-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>{c}</span>
                              {isSel && <Check className="w-3 h-3 text-forest-700" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Region Dropdown (Required) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-charcoal-800">
                      Region * <span className="text-rose-600">(Must select at least one)</span>
                    </label>
                    <div className="p-3 rounded-lg border border-surface-border bg-slate-50/50 space-y-2">
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {REGION_OPTIONS.map((r) => {
                          const isSel = formData.governance.regions?.includes(r);
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                const current = formData.governance.regions || [];
                                const updated = isSel ? current.filter((x) => x !== r) : [...current, r];
                                setFormData((prev) => ({
                                  ...prev,
                                  governance: { ...prev.governance, regions: updated },
                                }));
                              }}
                              className={`px-2.5 py-1 text-xs rounded-md border font-medium flex items-center gap-1 transition-colors ${
                                isSel
                                  ? 'bg-forest-50 border-forest-600 text-forest-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>{r}</span>
                              {isSel && <Check className="w-3 h-3 text-forest-700" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* District Dropdown (Optional) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-charcoal-800">
                      Districts (Optional multi-select)
                    </label>
                    <div className="p-3 rounded-lg border border-surface-border bg-slate-50/50 space-y-2">
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {DISTRICT_OPTIONS.map((d) => {
                          const isSel = formData.governance.districts?.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                const current = formData.governance.districts || [];
                                const updated = isSel ? current.filter((x) => x !== d) : [...current, d];
                                setFormData((prev) => ({
                                  ...prev,
                                  governance: { ...prev.governance, districts: updated },
                                }));
                              }}
                              className={`px-2.5 py-1 text-xs rounded-md border font-medium flex items-center gap-1 transition-colors ${
                                isSel
                                  ? 'bg-forest-50 border-forest-600 text-forest-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>{d}</span>
                              {isSel && <Check className="w-3 h-3 text-forest-700" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Ward Dropdown (Optional) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-charcoal-800">
                      Wards (Optional multi-select)
                    </label>
                    <div className="p-3 rounded-lg border border-surface-border bg-slate-50/50 space-y-2">
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {WARD_OPTIONS.map((w) => {
                          const isSel = formData.governance.wards?.includes(w);
                          return (
                            <button
                              key={w}
                              type="button"
                              onClick={() => {
                                const current = formData.governance.wards || [];
                                const updated = isSel ? current.filter((x) => x !== w) : [...current, w];
                                setFormData((prev) => ({
                                  ...prev,
                                  governance: { ...prev.governance, wards: updated },
                                }));
                              }}
                              className={`px-2.5 py-1 text-xs rounded-md border font-medium flex items-center gap-1 transition-colors ${
                                isSel
                                  ? 'bg-forest-50 border-forest-600 text-forest-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>{w}</span>
                              {isSel && <Check className="w-3 h-3 text-forest-700" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        )}

        {/* Step 4: Results Framework (Outcomes -> Outputs -> Activities) */}
        {formData.step === 3 && (
          <div className="p-6">
            <ProjectResultsFrameworkBuilder
              outcomes={formData.resultsFramework || []}
              onChange={(rf) => setFormData((prev) => ({ ...prev, resultsFramework: rf }))}
              staffList={activeStaff}
              currency={formData.funding.currency}
              availableLocations={derivedLocations}
            />
          </div>
        )}

        {/* Step 5: Dynamic M&E Blueprint & Field Forms */}
        {formData.step === 4 && (
          <div className="p-6">
            <ProjectBlueprintBuilderStep
              blueprint={formData.blueprint}
              onChange={(bp) => setFormData((prev) => ({ ...prev, blueprint: bp }))}
            />
          </div>
        )}

        {/* Step 6: Review Project Charter & Finalize */}
        {formData.step === 5 && (
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-forest-700" />
                <CardTitle>Step 6: Review Project Charter &amp; Launch</CardTitle>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Verify all operational metrics, governance leads, cascading implementation locations, results framework, and attached documents before registering this charter.
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
                      Project Identity &amp; Partners
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
                      <span className="font-mono bg-white px-1 py-0.5 rounded border border-surface-border font-bold">
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
                      <span className="font-semibold text-charcoal-900">Partners / Sponsors:</span>{' '}
                      {formData.identity.partnerOrganizations || 'None specified'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Attached Documents:</span>{' '}
                      {documents.length} files attached
                    </div>
                  </div>
                </div>

                {/* Funding Box */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                    <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-forest-700" />
                      Budget &amp; Timeline
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
                      <span className="font-semibold text-charcoal-900">Total Approved Budget:</span>{' '}
                      <span className="font-bold text-emerald-800 font-mono text-sm">
                        {formData.funding.currency} {Number(formData.funding.totalBudget).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Cadence:</span> {formData.funding.durationCadence}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Grant Donor:</span> {formData.funding.funder}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Duration:</span> {formData.funding.startDate} to {formData.funding.endDate}
                    </div>
                  </div>
                </div>

                {/* Governance Box */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                    <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-forest-700" />
                      Governance Leads
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
                      <span className="font-semibold text-charcoal-900">Project Manager:</span>{' '}
                      {selectedManager?.displayName} ({selectedManager?.role.replace('_', ' ')})
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Field Coordinator:</span>{' '}
                      {selectedCoordinator?.displayName || 'Direct PM Supervision'}
                    </div>
                    <div className="text-[11px] text-slate-500 italic mt-1">
                      All staff members participate collectively in activity implementation.
                    </div>
                  </div>
                </div>

                {/* Target Locations Box */}
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
                    <div>
                      <span className="font-semibold text-charcoal-900">Countries:</span>{' '}
                      {(formData.governance.countries || []).join(', ') || 'Tanzania'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Regions:</span>{' '}
                      {(formData.governance.regions || []).join(', ') || 'None selected'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Districts:</span>{' '}
                      {(formData.governance.districts || []).join(', ') || 'All districts'}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal-900">Wards:</span>{' '}
                      {(formData.governance.wards || []).join(', ') || 'All wards'}
                    </div>
                  </div>
                </div>

                {/* Results Framework Summary Box */}
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                    <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-forest-700" />
                      Results Framework Hierarchy ({totalActivities} Activities across {formData.resultsFramework?.length || 0} Outcomes)
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
                      <span><strong>Outcomes:</strong> {formData.resultsFramework?.length || 0}</span>
                      <span>•</span>
                      <span><strong>Outputs:</strong> {totalOutputs}</span>
                      <span>•</span>
                      <span><strong>Activities:</strong> {totalActivities}</span>
                      <span>•</span>
                      <span className="text-slate-500 italic">Activity budgets will be appropriated after project authorization</span>
                    </div>
                  </div>
                </div>

                {/* M&E Blueprint Summary Box */}
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
                  <div className="text-xs space-y-1 text-charcoal-700 pt-1">
                    <div>
                      <strong>Collection Form:</strong> {formData.blueprint?.formName} ({formData.blueprint?.formFields.length || 0} field questions)
                    </div>
                  </div>
                </div>
              </div>

              {/* Ready for Finalization Notice */}
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm">Ready to Charter Project Workspace</div>
                  <div>
                    Clicking "Launch Project Workspace" will establish the project code{' '}
                    <span className="font-mono font-bold">{formData.identity.projectCode}</span> in planning status,
                    record the total approved project budget of {formData.funding.currency}{' '}
                    {Number(formData.funding.totalBudget).toLocaleString()}, attach all reference documents, and submit
                    the charter to the Executive Director for formal activation sign-off.
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

            {formData.step < 5 ? (
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

