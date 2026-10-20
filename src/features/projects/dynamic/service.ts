import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  CollectionAssignment,
  DynamicForm,
  DynamicFormSchema,
  DynamicFormVersion,
  DynamicIndicator,
  IndicatorCalculation,
  DynamicSubmission,
  OrganizationProjectTemplate,
} from './types';
import { validateFormSchema } from './validation';

function requireDatabase(): void {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured. Project engine data was not saved.');
}

function throwDbError(error: { message: string } | null, action: string): void {
  if (error) throw new Error(`${action}: ${error.message}`);
}

function mapIndicator(row: any): DynamicIndicator {
  return {
    id: row.id, projectId: row.project_id, code: row.code, name: row.name,
    description: row.description || '', unit: row.unit, baseline: row.baseline == null ? null : Number(row.baseline),
    target: row.target == null ? null : Number(row.target), calculationType: row.calculation_type,
    sourceFieldKey: row.source_field_key, aggregation: row.aggregation, configVersion: Number(row.config_version), status: row.status, createdAt: row.created_at,
  };
}

function mapForm(row: any): DynamicForm {
  return {
    id: row.id, projectId: row.project_id, name: row.name, status: row.status,
    currentVersionId: row.current_version_id, currentVersionNumber: Number(row.current_version_number || 0), createdAt: row.created_at,
  };
}

function mapVersion(row: any): DynamicFormVersion {
  return {
    id: row.id, formId: row.form_id, versionNumber: row.version_number,
    schema: row.form_schema, status: row.status, publishedAt: row.published_at, createdAt: row.created_at,
  };
}

function mapAssignment(row: any): CollectionAssignment {
  return {
    id: row.id, projectId: row.project_id, formId: row.form_id, formVersionId: row.form_version_id,
    assigneeId: row.assignee_id, periodKey: row.period_key, dueDate: row.due_date,
    status: row.status, createdAt: row.created_at,
  };
}

function mapSubmission(row: any): DynamicSubmission {
  return {
    id: row.id, projectId: row.project_id, formId: row.form_id, formVersionId: row.form_version_id,
    assignmentId: row.assignment_id, collectedOn: row.collected_on, values: row.answers || {}, status: row.status,
    indicatorVersions: row.indicator_versions || {},
    submittedBy: row.submitted_by, submittedAt: row.submitted_at, verifiedBy: row.verified_by,
    verifiedAt: row.verified_at, createdAt: row.created_at,
  };
}

export interface ProjectEngineData {
  indicators: DynamicIndicator[];
  forms: DynamicForm[];
  versions: DynamicFormVersion[];
  assignments: CollectionAssignment[];
  submissions: DynamicSubmission[];
}

export async function getOrganizationProjectTemplates(): Promise<OrganizationProjectTemplate[]> {
  requireDatabase();
  const [templates, versions] = await Promise.all([
    supabase.from('project_templates').select('*').order('created_at', { ascending: false }),
    supabase.from('project_template_versions').select('*').order('version_number', { ascending: false }),
  ]);
  throwDbError(templates.error, 'Could not load organization templates');
  throwDbError(versions.error, 'Could not load template versions');
  return (templates.data || []).map((template: any) => ({
    id: template.id, code: template.code, name: template.name, description: template.description || '', status: template.status,
    versions: (versions.data || []).filter((version: any) => version.template_id === template.id).map((version: any) => ({
      id: version.id, versionNumber: version.version_number, status: version.status, config: version.config,
    })),
  }));
}

export async function createOrganizationTemplate(projectId: string, name: string, userId: string): Promise<void> {
  requireDatabase();
  const data = await getProjectEngineData(projectId);
  const publishedForms = data.forms.flatMap((form) => {
    const version = form.currentVersionId ? data.versions.find((item) => item.id === form.currentVersionId) : undefined;
    return form.status === 'published' && version ? [{ name: form.name, schema: version.schema }] : [];
  });
  if (!data.indicators.length && !publishedForms.length) throw new Error('Add at least one indicator or publish a form before creating a template.');
  const code = `ORG-${Date.now().toString(36).toUpperCase()}`;
  const config = {
    indicators: data.indicators.filter((indicator) => indicator.status === 'active').map((indicator) => ({
      code: indicator.code, name: indicator.name, description: indicator.description, unit: indicator.unit,
      baseline: indicator.baseline, target: indicator.target, calculationType: indicator.calculationType,
      sourceFieldKey: indicator.sourceFieldKey, aggregation: indicator.aggregation,
    })),
    forms: publishedForms,
  };
  const { data: template, error } = await supabase.from('project_templates')
    .insert({ code, name: name.trim(), description: `Created from project configuration ${projectId}.`, status: 'draft', created_by: userId })
    .select('id').single();
  throwDbError(error, 'Could not create template draft');
  if (!template) throw new Error('Could not create template draft.');
  const { error: versionError } = await supabase.from('project_template_versions')
    .insert({ template_id: template.id, version_number: 1, config, status: 'draft', created_by: userId, change_summary: 'Initial template version' });
  if (versionError) {
    await supabase.from('project_templates').delete().eq('id', template.id);
    throwDbError(versionError, 'Could not save template version');
  }
}

export async function approveOrganizationTemplate(templateId: string, versionId: string): Promise<void> {
  requireDatabase();
  const { error } = await supabase.rpc('approve_project_template', { p_template_id: templateId, p_version_id: versionId });
  throwDbError(error, 'Could not approve organization template');
}

export async function applyOrganizationTemplate(projectId: string, versionId: string): Promise<void> {
  requireDatabase();
  const { error } = await supabase.rpc('apply_project_template', { p_project_id: projectId, p_template_version_id: versionId });
  throwDbError(error, 'Could not apply organization template');
}

export async function initializeProjectEngine(projectId: string): Promise<void> {
  requireDatabase();
  const { error } = await supabase.from('project_config_versions').insert({
    project_id: projectId, version_number: 1, config: { indicators: [], forms: [] },
    change_summary: 'Initial blank project configuration',
  });
  throwDbError(error, 'Could not initialize project configuration');
}

export async function getProjectEngineData(projectId: string): Promise<ProjectEngineData> {
  requireDatabase();
  const [indicatorResult, formResult, versionResult, assignmentResult, submissionResult] = await Promise.all([
    supabase.from('project_indicators').select('*').eq('project_id', projectId).order('created_at'),
    supabase.from('project_forms').select('*, current_version:project_form_versions!project_forms_current_version_fk(version_number)').eq('project_id', projectId).order('created_at'),
    supabase.from('project_form_versions').select('*').order('version_number', { ascending: false }),
    supabase.from('project_collection_assignments').select('*').eq('project_id', projectId).order('due_date'),
    supabase.from('project_submissions').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
  ]);
  throwDbError(indicatorResult.error, 'Could not load indicators');
  throwDbError(formResult.error, 'Could not load forms');
  throwDbError(versionResult.error, 'Could not load form versions');
  throwDbError(assignmentResult.error, 'Could not load collection assignments');
  throwDbError(submissionResult.error, 'Could not load submissions');
  return {
    indicators: (indicatorResult.data || []).map(mapIndicator),
    forms: (formResult.data || []).map((row: any) => ({ ...mapForm(row), currentVersionNumber: row.current_version?.version_number || 0 })),
    versions: (versionResult.data || []).map(mapVersion),
    assignments: (assignmentResult.data || []).map(mapAssignment),
    submissions: (submissionResult.data || []).map(mapSubmission),
  };
}

export async function createDynamicIndicator(input: Omit<DynamicIndicator, 'id' | 'createdAt' | 'status' | 'configVersion'>, userId: string): Promise<void> {
  requireDatabase();
  const { error } = await supabase.from('project_indicators').insert({
    project_id: input.projectId, code: input.code.trim().toUpperCase(), name: input.name.trim(),
    description: input.description.trim() || null, unit: input.unit.trim() || 'count', baseline: input.baseline,
    target: input.target, calculation_type: input.calculationType, source_field_key: input.sourceFieldKey.trim(),
    aggregation: input.aggregation, created_by: userId,
  });
  throwDbError(error, 'Could not create indicator');
}

export async function createDynamicForm(projectId: string, name: string, userId: string, schema: DynamicFormSchema): Promise<string> {
  requireDatabase();
  const schemaErrors = validateFormSchema(schema);
  if (!name.trim() || schemaErrors.length) throw new Error(schemaErrors.join(' ') || 'Form name is required.');
  const { data: form, error: formError } = await supabase.from('project_forms')
    .insert({ project_id: projectId, name: name.trim(), created_by: userId })
    .select('id').single();
  throwDbError(formError, 'Could not create form');
  if (!form) throw new Error('Could not create form.');
  const { data: version, error: versionError } = await supabase.from('project_form_versions')
    .insert({ form_id: form.id, version_number: 1, form_schema: schema, status: 'draft', created_by: userId })
    .select('id').single();
  if (versionError || !version) {
    await supabase.from('project_forms').delete().eq('id', form.id);
    throwDbError(versionError, 'Could not create form draft');
    throw new Error('Could not create form draft.');
  }
  return version.id;
}

export async function updateDynamicFormDraftVersion(versionId: string, schema: DynamicFormSchema): Promise<void> {
  requireDatabase();
  const schemaErrors = validateFormSchema(schema);
  if (schemaErrors.length) throw new Error(schemaErrors.join(' '));
  const { error } = await supabase.from('project_form_versions').update({ form_schema: schema })
    .eq('id', versionId).eq('status', 'draft');
  throwDbError(error, 'Could not update draft form');
}

export async function createDynamicFormVersion(formId: string, userId: string, changeSummary: string): Promise<{ versionId: string; schema: DynamicFormSchema }> {
  requireDatabase();
  const { data: form, error: formError } = await supabase.from('project_forms').select('id, current_version_id, status').eq('id', formId).single();
  throwDbError(formError, 'Could not load form version');
  if (!form || form.status !== 'published' || !form.current_version_id) throw new Error('Only a published form can be versioned.');
  const { data: current, error: currentError } = await supabase.from('project_form_versions').select('form_schema, version_number').eq('id', form.current_version_id).single();
  throwDbError(currentError, 'Could not load the published form definition');
  if (!current) throw new Error('Published form definition is missing.');
  const { data: version, error } = await supabase.from('project_form_versions').insert({
    form_id: formId, version_number: Number(current.version_number) + 1, form_schema: current.form_schema,
    status: 'draft', created_by: userId, change_summary: changeSummary,
  }).select('id').single();
  throwDbError(error, 'Could not create a new form version');
  if (!version) throw new Error('Could not create a new form version.');
  return { versionId: version.id, schema: current.form_schema as DynamicFormSchema };
}

export async function publishDynamicForm(formId: string, versionId: string): Promise<void> {
  requireDatabase();
  const { error } = await supabase.rpc('publish_project_form_version', { p_form_id: formId, p_version_id: versionId });
  throwDbError(error, 'Could not publish form');
}

export async function createCollectionAssignment(input: Omit<CollectionAssignment, 'id' | 'createdAt' | 'status'>, userId: string): Promise<void> {
  requireDatabase();
  const { error } = await supabase.from('project_collection_assignments').insert({
    project_id: input.projectId, form_id: input.formId, form_version_id: input.formVersionId,
    assignee_id: input.assigneeId, period_key: input.periodKey.trim(), due_date: input.dueDate, created_by: userId,
  });
  throwDbError(error, 'Could not assign collection form');
}

export async function createDynamicSubmission(input: {
  projectId: string; formId: string; formVersionId: string; assignmentId?: string | null;
  collectedOn: string; answers: Record<string, unknown>; userId: string; submit: boolean;
}): Promise<void> {
  requireDatabase();
  const { error } = await supabase.from('project_submissions').insert({
    project_id: input.projectId, form_id: input.formId, form_version_id: input.formVersionId,
    assignment_id: input.assignmentId || null, client_submission_id: crypto.randomUUID(), collected_on: input.collectedOn,
    answers: input.answers, status: input.submit ? 'pending' : 'draft', submitted_by: input.userId,
  });
  throwDbError(error, 'Could not save submission');
}

export async function updateDynamicSubmission(input: {
  submissionId: string; userId: string; answers: Record<string, unknown>; collectedOn: string; submit: boolean;
}): Promise<void> {
  requireDatabase();
  const { data, error } = await supabase.from('project_submissions').update({
    answers: input.answers, collected_on: input.collectedOn, status: input.submit ? 'pending' : 'draft', review_comments: null,
  }).eq('id', input.submissionId).eq('submitted_by', input.userId).in('status', ['draft', 'returned']).select('id').maybeSingle();
  throwDbError(error, 'Could not update submission');
  if (!data) throw new Error('This draft or returned submission is no longer editable. Refresh the project data.');
}

export async function reviewDynamicSubmission(submission: DynamicSubmission, decision: 'verified' | 'returned' | 'rejected', comments: string): Promise<void> {
  requireDatabase();
  const { data, error } = await supabase.from('project_submissions').update({ status: decision, review_comments: comments.trim() || null })
    .eq('id', submission.id).eq('status', 'pending').select('id').maybeSingle();
  throwDbError(error, 'Could not record review decision');
  if (!data) throw new Error('This submission was already reviewed. Refresh the queue and try again.');
}

export interface ProjectBlueprintInitializationInput {
  projectId: string;
  userId: string;
  indicators: Array<{
    code: string;
    name: string;
    description?: string;
    unit: string;
    target?: number | null;
    baseline?: number | null;
    calculationType: IndicatorCalculation;
    sourceFieldKey: string;
    aggregation: 'sum' | 'average' | 'latest';
  }>;
  forms: Array<{
    name: string;
    fields: import('./types').DynamicFormField[];
    publishImmediately?: boolean;
  }>;
}

export async function initializeProjectBlueprint(
  input: ProjectBlueprintInitializationInput
): Promise<{ indicatorsCreated: number; formsCreated: number }> {
  requireDatabase();
  let indicatorsCreated = 0;
  let formsCreated = 0;

  for (const ind of input.indicators) {
    if (!ind.code.trim() || !ind.name.trim() || !ind.sourceFieldKey.trim()) {
      throw new Error(`Indicator ${ind.code || '(unnamed)'} is missing its code, name, or source field.`);
    }
    await createDynamicIndicator(
      {
        projectId: input.projectId,
        code: ind.code,
        name: ind.name,
        description: ind.description || '',
        unit: ind.unit || 'count',
        baseline: ind.baseline ?? null,
        target: ind.target ?? null,
        calculationType: ind.calculationType,
        sourceFieldKey: ind.sourceFieldKey,
        aggregation: ind.aggregation,
      },
      input.userId
    );
    indicatorsCreated++;
  }

  for (const formItem of input.forms) {
    if (!formItem.name.trim() || !formItem.fields.length) {
      throw new Error('Each initial collection form must have a name and at least one field.');
    }
    const versionId = await createDynamicForm(
      input.projectId,
      formItem.name,
      input.userId,
      {
        title: formItem.name,
        fields: formItem.fields,
      }
    );
    if (formItem.publishImmediately !== false) {
      const { data: vData, error } = await supabase
        .from('project_form_versions')
        .select('form_id')
        .eq('id', versionId)
        .maybeSingle();
      throwDbError(error, 'Could not load the newly created form');
      if (!vData?.form_id) throw new Error('The newly created form version is missing.');
      await publishDynamicForm(vData.form_id, versionId);
    }
    formsCreated++;
  }

  if (indicatorsCreated || formsCreated) {
    const { error } = await supabase.from('project_config_versions').insert({
      project_id: input.projectId,
      version_number: 2,
      config: {
        indicators: input.indicators.map((indicator) => ({ ...indicator })),
        forms: input.forms.map((form) => ({
          name: form.name,
          schema: { title: form.name, fields: form.fields },
        })),
      },
      change_summary: 'Initial project blueprint from project registration',
      created_by: input.userId,
    });
    throwDbError(error, 'Could not save the initial project configuration snapshot');
  }

  return { indicatorsCreated, formsCreated };
}


