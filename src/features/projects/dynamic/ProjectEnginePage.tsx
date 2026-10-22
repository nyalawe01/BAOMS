import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ClipboardList, Plus, RefreshCw, ShieldCheck, Target, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/features/auth/useAuth';
import { getProjectById } from '../services/projectService';
import { calculateIndicator, validateIndicatorDefinition } from './calculations';
import {
  createCollectionAssignment,
  createOrganizationTemplate,
  approveOrganizationTemplate,
  applyOrganizationTemplate,
  createDynamicForm,
  createDynamicFormVersion,
  createDynamicIndicator,
  createDynamicSubmission,
  getProjectEngineData,
  getOrganizationProjectTemplates,
  publishDynamicForm,
  reviewDynamicSubmission,
  updateDynamicSubmission,
  updateDynamicFormDraftVersion,
  type ProjectEngineData,
} from './service';
import type { DynamicFormSchema, IndicatorCalculation } from './types';
import type { OrganizationProjectTemplate } from './types';
import { validateFormAnswers, validateFormSchema } from './validation';
import { ProjectEngineVisualizer } from './ProjectEngineVisualizer';

const EMPTY_DATA: ProjectEngineData = { indicators: [], forms: [], versions: [], assignments: [], submissions: [] };
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#D68904] focus:outline-none focus:ring-2 focus:ring-[#D68904]/20 transition-colors shadow-none leading-normal';
const labelClass = 'mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700';

type BuilderField = DynamicFormSchema['fields'][number] & { optionsText: string };

export const ProjectEnginePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, roles, hasPermission } = useAuth();
  const [projectName, setProjectName] = useState('Project');
  const [projectCode, setProjectCode] = useState('');
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [data, setData] = useState<ProjectEngineData>(EMPTY_DATA);
  const [templates, setTemplates] = useState<OrganizationProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const [indicatorDraft, setIndicatorDraft] = useState({ code: '', name: '', unit: 'count', target: '', sourceKey: '', calculation: 'sum' as IndicatorCalculation });
  const [formName, setFormName] = useState('');
  const [builderFields, setBuilderFields] = useState<BuilderField[]>([{ key: 'participants', label: 'Participants', type: 'integer', required: true, optionsText: '' }]);
  const [editingDraft, setEditingDraft] = useState<{ formId: string; versionId: string } | null>(null);
  const [assignFormId, setAssignFormId] = useState('');
  const [assignMemberId, setAssignMemberId] = useState('');
  const [assignPeriod, setAssignPeriod] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateVersionToApply, setTemplateVersionToApply] = useState('');
  const [indicatorStartDate, setIndicatorStartDate] = useState('');
  const [indicatorEndDate, setIndicatorEndDate] = useState('');
  const [collectFormId, setCollectFormId] = useState('');
  const [collectAssignmentId, setCollectAssignmentId] = useState('');
  const [collectVersionOverride, setCollectVersionOverride] = useState('');
  const [collectedOn, setCollectedOn] = useState(new Date().toISOString().slice(0, 10));
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);

  const canManage = hasPermission('projects.manage') || hasPermission('me.manage') || roles.includes('system_admin');
  const canVerify = hasPermission('me.validate') || roles.includes('system_admin') || roles.includes('executive_director');
  const canManageTemplates = hasPermission('me.manage') || roles.includes('system_admin') || roles.includes('executive_director');
  const canApproveTemplates = roles.includes('system_admin') || roles.includes('executive_director');

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [project, engine, organizationTemplates] = await Promise.all([
        getProjectById(id, user ? { id: user.id, role: roles[0] } : undefined),
        getProjectEngineData(id),
        getOrganizationProjectTemplates(),
      ]);
      if (!project) throw new Error('Project not found or you do not have access.');
      setProjectName(project.name);
      setProjectCode(project.projectCode);
      setMembers(project.members.map((member) => ({ id: member.userId, name: member.userName })));
      setData(engine);
      setTemplates(organizationTemplates);
      setAssignFormId((current) => current || engine.forms.find((form) => form.status === 'published')?.id || '');
      setCollectFormId((current) => current || engine.forms.find((form) => form.status === 'published')?.id || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id, roles, user]);

  useEffect(() => { void reload(); }, [reload]);

  const versionsById = useMemo(() => new Map(data.versions.map((version) => [version.id, version])), [data.versions]);
  const formsById = useMemo(() => new Map(data.forms.map((form) => [form.id, form])), [data.forms]);
  const selectedCollectForm = data.forms.find((form) => form.id === collectFormId);
  const myAssignments = data.assignments.filter((assignment) => assignment.assigneeId === user?.id && assignment.status === 'open');
  const selectedAssignment = myAssignments.find((assignment) => assignment.id === collectAssignmentId);
  const selectedVersionId = selectedAssignment?.formVersionId || collectVersionOverride || selectedCollectForm?.currentVersionId;
  const selectedVersion = selectedVersionId ? versionsById.get(selectedVersionId) : undefined;
  const pendingSubmissions = data.submissions.filter((submission) => submission.status === 'pending');

  const indicatorResults = useMemo(() => data.indicators.map((indicator) => {
      const observations = data.submissions.filter((submission) => submission.status === 'verified'
        && submission.indicatorVersions?.[indicator.id] === indicator.configVersion
        && (!indicatorStartDate || submission.collectedOn >= indicatorStartDate)
        && (!indicatorEndDate || submission.collectedOn <= indicatorEndDate))
      .flatMap((submission) => {
        const version = versionsById.get(submission.formVersionId);
        if (!version?.schema.fields.some((field) => field.key === indicator.sourceFieldKey)) return [];
        return [{
          value: submission.values[indicator.sourceFieldKey] as number | string | null,
          observedAt: submission.collectedOn,
          verifiedAt: submission.verifiedAt || submission.createdAt,
          recordId: submission.id,
          status: submission.status,
        }];
      });
    return { indicator, result: calculateIndicator({ type: indicator.calculationType, target: indicator.target, aggregation: indicator.aggregation }, observations) };
  }), [data.indicators, data.submissions, indicatorEndDate, indicatorStartDate, versionsById]);

  const runAction = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setError('');
    setMessage('');
    try { await action(); setMessage(success); await reload(); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); }
  };

  const addBuilderField = () => setBuilderFields((fields) => [...fields, { key: `field_${fields.length + 1}`, label: '', type: 'text', required: false, optionsText: '' }]);
  const removeBuilderField = (indexToRemove: number) => setBuilderFields((fields) => fields.filter((_, i) => i !== indexToRemove));
  const updateBuilderField = (index: number, key: keyof BuilderField, value: string | boolean | number | undefined) => setBuilderFields((fields) => fields.map((field, i) => i === index ? { ...field, [key]: value } as BuilderField : field));

  const saveNewIndicator = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !user) return;
    const target = indicatorDraft.target.trim() ? Number(indicatorDraft.target) : null;
    const aggregation = indicatorDraft.calculation === 'average' ? 'average' : indicatorDraft.calculation === 'latest_value_or_milestone_state' ? 'latest' : 'sum';
    const definition = { type: indicatorDraft.calculation, target, aggregation } as const;
    const validation = validateIndicatorDefinition(definition);
    if (validation.length) { setError(validation.join(' ')); return; }
    if (!indicatorDraft.code.trim() || !indicatorDraft.name.trim() || !indicatorDraft.sourceKey.trim()) { setError('Code, name, and source field key are required.'); return; }
    await runAction(() => createDynamicIndicator({
      projectId: id, code: indicatorDraft.code, name: indicatorDraft.name, description: '', unit: indicatorDraft.unit,
      baseline: null, target, calculationType: indicatorDraft.calculation, sourceFieldKey: indicatorDraft.sourceKey,
      aggregation,
    }, user.id), 'Indicator added.');
    setIndicatorDraft({ code: '', name: '', unit: 'count', target: '', sourceKey: '', calculation: 'sum' });
  };

  const makeForm = async () => {
    if (!id || !user) return;
    const fields = builderFields.map(({ optionsText, ...field }) => ({
              ...field, key: field.key.trim(), label: field.label.trim(),
              ...(field.min === undefined ? {} : { min: Number(field.min) }),
              ...(field.max === undefined ? {} : { max: Number(field.max) }),
      ...(field.type === 'select' || field.type === 'multiselect' ? { options: optionsText.split(',').map((option) => option.trim()).filter(Boolean) } : {}),
    }));
    if (!formName.trim() || fields.some((field) => !field.key || !field.label) || new Set(fields.map((field) => field.key)).size !== fields.length) {
      setError('Enter a form name and unique keys and labels for every field.'); return;
    }
    const schema: DynamicFormSchema = { title: formName.trim(), fields };
    const schemaErrors = validateFormSchema(schema);
    if (schemaErrors.length) { setError(schemaErrors.join(' ')); return; }
    await runAction(async () => {
      if (editingDraft) await updateDynamicFormDraftVersion(editingDraft.versionId, schema);
      else await createDynamicForm(id, formName, user.id, schema);
    }, editingDraft ? 'Draft form updated.' : 'Draft form created. Publish it when its structure is ready.');
    setFormName('');
    setEditingDraft(null);
    setBuilderFields([{ key: 'participants', label: 'Participants', type: 'integer', required: true, optionsText: '' }]);
  };

  const editDraft = (formId: string, versionId: string) => {
    const version = versionsById.get(versionId);
    const form = formsById.get(formId);
    if (!version || !form) return;
    setEditingDraft({ formId, versionId });
    setFormName(form.name);
    setBuilderFields(version.schema.fields.map((field) => ({ ...field, optionsText: field.options?.join(', ') || '' })));
  };

  const startNewVersion = (formId: string, formNameValue: string) => {
    if (!user) return;
    void runAction(async () => {
      const { versionId, schema } = await createDynamicFormVersion(formId, user.id, 'New structural or content version');
      setEditingDraft({ formId, versionId });
      setFormName(formNameValue);
      setBuilderFields(schema.fields.map((field) => ({ ...field, optionsText: field.options?.join(', ') || '' })));
    }, 'New draft version created. Published versions remain unchanged.');
  };

  const makeAssignment = async () => {
    if (!id || !user) return;
    const form = data.forms.find((item) => item.id === assignFormId);
    if (!form?.currentVersionId || !assignMemberId || !assignPeriod.trim()) { setError('Select a published form, assignee, and collection period.'); return; }
    await runAction(() => createCollectionAssignment({
      projectId: id, formId: form.id, formVersionId: form.currentVersionId as string,
      assigneeId: assignMemberId, periodKey: assignPeriod, dueDate: assignDueDate || null,
    }, user.id), 'Collection assignment created.');
    setAssignPeriod('');
  };

  const makeTemplate = async () => {
    if (!id || !user || !templateName.trim()) { setError('Enter a name for the organization template.'); return; }
    await runAction(() => createOrganizationTemplate(id, templateName, user.id), 'Template draft created. An Executive Director must approve it before project managers can use it.');
    setTemplateName('');
  };

  const useTemplate = async () => {
    if (!id || !templateVersionToApply) { setError('Choose an approved template version.'); return; }
    if (data.indicators.length || data.forms.length) { setError('Templates can only be applied to projects without existing dynamic configuration.'); return; }
    await runAction(() => applyOrganizationTemplate(id, templateVersionToApply), 'Approved template applied to this project.');
  };

  const saveSubmission = async (submit: boolean) => {
    if (!id || !user || !selectedCollectForm || !selectedVersion) return;
    if (submit) {
      const answerErrors = validateFormAnswers(selectedVersion.schema, answers);
      if (answerErrors.length) { setError(answerErrors.join(' ')); return; }
    }
    await runAction(() => editingSubmissionId
      ? updateDynamicSubmission({ submissionId: editingSubmissionId, userId: user.id, answers, collectedOn, submit })
      : createDynamicSubmission({
        projectId: id, formId: selectedCollectForm.id, formVersionId: selectedVersion.id,
        assignmentId: collectAssignmentId || null, collectedOn, answers, userId: user.id, submit,
      }), submit ? 'Submission sent for verification.' : 'Draft saved.');
    setAnswers({});
    setEditingSubmissionId(null);
    setCollectVersionOverride('');
  };

  const resumeSubmission = (submission: (typeof data.submissions)[number]) => {
    const form = data.forms.find((item) => item.id === submission.formId);
    if (!form) return;
    setEditingSubmissionId(submission.id);
    setCollectFormId(form.id);
    setCollectAssignmentId(submission.assignmentId || '');
    setCollectVersionOverride(submission.formVersionId);
    setCollectedOn(submission.collectedOn);
    setAnswers(submission.values);
  };

  const review = (submission: (typeof data.submissions)[number], decision: 'verified' | 'returned' | 'rejected') => {
    const promptText = decision === 'verified' ? 'Verification note (optional):' : 'Reason for return or rejection:';
    const comments = window.prompt(promptText, '');
    if (comments === null) return;
    if (decision !== 'verified' && !comments.trim()) { setError('A reason is required for returned or rejected submissions.'); return; }
    void runAction(() => reviewDynamicSubmission(submission, decision, comments), `Submission ${decision}.`);
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading project engine…</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Dynamic Project Engine" subtitle={`${projectName} • ${projectCode}`} breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: projectCode, href: `/projects/${id}` }, { label: 'Project Engine' }]} actions={<Button variant="outline" size="sm" onClick={() => void reload()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>} />
      {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
      {message && <div role="status" className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 className="h-4 w-4" />{message}</div>}

      <Card className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>Online collection only.</strong> Form drafts and submissions are stored in Supabase. Offline collection and local synchronization are not enabled.
      </Card>

      {/* Auto-Generated M&E Analytics & KPI Progress Cards */}
      <ProjectEngineVisualizer
        indicators={indicatorResults}
        submissions={data.submissions}
        projectName={projectName}
        projectCode={projectCode}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4 border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2"><Target className="h-5 w-5 text-forest-700" /><h2 className="font-semibold">Indicators</h2></div>
          {canManage && <form onSubmit={saveNewIndicator} className="grid gap-3 sm:grid-cols-2">
            <label><span className={labelClass}>Code</span><input className={inputClass} value={indicatorDraft.code} onChange={(e) => setIndicatorDraft({ ...indicatorDraft, code: e.target.value })} required /></label>
            <label><span className={labelClass}>Name</span><input className={inputClass} value={indicatorDraft.name} onChange={(e) => setIndicatorDraft({ ...indicatorDraft, name: e.target.value })} required /></label>
            <label><span className={labelClass}>Source field key</span><input className={inputClass} placeholder="e.g. participants" value={indicatorDraft.sourceKey} onChange={(e) => setIndicatorDraft({ ...indicatorDraft, sourceKey: e.target.value })} required /></label>
            <label><span className={labelClass}>Unit</span><input className={inputClass} value={indicatorDraft.unit} onChange={(e) => setIndicatorDraft({ ...indicatorDraft, unit: e.target.value })} required /></label>
            <label><span className={labelClass}>Calculation</span><select className={inputClass} value={indicatorDraft.calculation} onChange={(e) => setIndicatorDraft({ ...indicatorDraft, calculation: e.target.value as IndicatorCalculation })}><option value="sum">Sum / cumulative count</option><option value="percentage_of_target">Percentage of target</option><option value="average">Average / mean</option><option value="latest_value_or_milestone_state">Latest value / milestone state</option></select></label>
            <label><span className={labelClass}>Target (required for percentage)</span><input type="number" min="0" step="any" className={inputClass} value={indicatorDraft.target} onChange={(e) => setIndicatorDraft({ ...indicatorDraft, target: e.target.value })} /></label>
            <div className="sm:col-span-2"><Button type="submit" disabled={busy}><Plus className="mr-2 h-4 w-4" />Add indicator</Button></div>
          </form>}
          <div className="grid gap-3 sm:grid-cols-2">
            <label><span className={labelClass}>Collection date from</span><input type="date" className={inputClass} value={indicatorStartDate} onChange={(e) => setIndicatorStartDate(e.target.value)} /></label>
            <label><span className={labelClass}>Collection date through</span><input type="date" className={inputClass} value={indicatorEndDate} onChange={(e) => setIndicatorEndDate(e.target.value)} /></label>
          </div>
          <div className="space-y-3">
            {indicatorResults.length === 0 && <p className="text-sm text-slate-500">No indicators configured yet.</p>}
            {indicatorResults.map(({ indicator, result }) => <div key={indicator.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{indicator.name}</p><p className="text-xs text-slate-500">{indicator.code} · {indicator.calculationType.replaceAll('_', ' ')} · source: {indicator.sourceFieldKey}</p></div><Badge variant={indicator.status === 'active' ? 'success' : 'default'}>{indicator.status}</Badge></div>
              <p className="mt-2 text-sm">Result: <strong>{result.value == null ? '—' : typeof result.value === 'number' ? `${result.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${indicator.calculationType === 'percentage_of_target' ? '%' : ` ${indicator.unit}`}` : result.value}</strong>{indicator.target != null && <span className="text-slate-500"> / target {indicator.target.toLocaleString()} {indicator.unit}</span>}</p>
              <p className="text-xs text-slate-500">Definition v{indicator.configVersion} · {result.observationCount} verified observations · {result.excludedCount} excluded/missing · last verified {result.lastVerifiedAt ? new Date(result.lastVerifiedAt).toLocaleDateString() : '—'}</p>
            </div>)}
          </div>
        </Card>

        <Card className="space-y-6 border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Collection forms builder</h2>
                <p className="text-xs text-slate-500">Configure reporting forms and custom data collection fields</p>
              </div>
            </div>
            {editingDraft && <Badge variant="warning">Editing draft version</Badge>}
          </div>

          {canManage && <div className="space-y-5 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 sm:p-6">
            <div>
              <label className="block">
                <span className={labelClass}>New form name *</span>
                <input
                  className={inputClass}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Monthly youth activity report"
                />
              </label>
              <p className="mt-1 text-xs text-slate-500">Provide an identifiable title for field staff and enumerators.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Form Questions & Fields</h3>
                <span className="text-xs font-medium text-slate-500">{builderFields.length} {builderFields.length === 1 ? 'question' : 'questions'}</span>
              </div>

              <div className="space-y-4">
                {builderFields.map((field, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-forest-50 text-xs font-semibold text-forest-700">{index + 1}</span>
                        Field #{index + 1} Configuration
                      </span>
                      {builderFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => removeBuilderField(index)}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete field
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block">
                          <span className={labelClass}>Question / Field Label *</span>
                          <input
                            className={inputClass}
                            aria-label={`Field ${index + 1} label`}
                            placeholder="e.g. Participants"
                            value={field.label}
                            onChange={(e) => updateBuilderField(index, 'label', e.target.value)}
                          />
                        </label>
                        <p className="mt-1 text-[11px] text-slate-500">Prompt displayed on the collection instrument.</p>
                      </div>

                      <div>
                        <label className="block">
                          <span className={labelClass}>Field Key (technical identifier) *</span>
                          <input
                            className={inputClass}
                            aria-label={`Field ${index + 1} key`}
                            placeholder="e.g. participants"
                            value={field.key}
                            onChange={(e) => updateBuilderField(index, 'key', e.target.value)}
                          />
                        </label>
                        <p className="mt-1 text-[11px] text-slate-500">Used as source key for indicators and analytics.</p>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block">
                          <span className={labelClass}>Input Data Type *</span>
                          <select
                            className={inputClass}
                            aria-label={`Field ${index + 1} type`}
                            value={field.type}
                            onChange={(e) => updateBuilderField(index, 'type', e.target.value)}
                          >
                            <option value="text">Short text (single line answer)</option>
                            <option value="textarea">Long text / narrative (multiline paragraph)</option>
                            <option value="integer">Whole number (count, participants, attendance)</option>
                            <option value="decimal">Decimal number (monetary, percentage, rate)</option>
                            <option value="date">Date selector</option>
                            <option value="boolean">Yes / No boolean choice</option>
                            <option value="select">Single choice dropdown menu</option>
                            <option value="multiselect">Multiple choice select</option>
                          </select>
                        </label>
                      </div>

                      {(field.type === 'select' || field.type === 'multiselect') && (
                        <div className="sm:col-span-2">
                          <label className="block">
                            <span className={labelClass}>Dropdown options (comma separated) *</span>
                            <input
                              className={inputClass}
                              aria-label={`Field ${index + 1} options`}
                              placeholder="e.g. Option 1, Option 2, Option 3"
                              value={field.optionsText}
                              onChange={(e) => updateBuilderField(index, 'optionsText', e.target.value)}
                            />
                          </label>
                          <p className="mt-1 text-xs text-slate-500">Comma-separated list of values the user can choose from.</p>
                        </div>
                      )}

                      {(field.type === 'integer' || field.type === 'decimal') && (
                        <>
                          <div>
                            <label className="block">
                              <span className={labelClass}>Minimum (optional)</span>
                              <input
                                className={inputClass}
                                aria-label={`Field ${index + 1} minimum`}
                                type="number"
                                step={field.type === 'decimal' ? 'any' : '1'}
                                placeholder="e.g. 0"
                                value={field.min ?? ''}
                                onChange={(e) => updateBuilderField(index, 'min', e.target.value === '' ? undefined : Number(e.target.value))}
                              />
                            </label>
                          </div>
                          <div>
                            <label className="block">
                              <span className={labelClass}>Maximum (optional)</span>
                              <input
                                className={inputClass}
                                aria-label={`Field ${index + 1} maximum`}
                                type="number"
                                step={field.type === 'decimal' ? 'any' : '1'}
                                placeholder="e.g. 1000"
                                value={field.max ?? ''}
                                onChange={(e) => updateBuilderField(index, 'max', e.target.value === '' ? undefined : Number(e.target.value))}
                              />
                            </label>
                          </div>
                        </>
                      )}

                      <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-[#D68904] focus:ring-[#D68904]"
                            checked={field.required}
                            onChange={(e) => updateBuilderField(index, 'required', e.target.checked)}
                          />
                          <span className="text-sm font-medium text-slate-700">Required (mandatory answer)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full py-3.5 border-dashed border-slate-300 hover:border-[#D68904] hover:bg-[#D68904]/5 font-medium"
                onClick={addBuilderField}
              >
                <Plus className="mr-2 h-4 w-4 text-[#D68904]" />
                Add another field
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200">
              <Button disabled={busy} onClick={() => void makeForm()}>
                {editingDraft ? 'Update draft form' : 'Save draft form'}
              </Button>
              {editingDraft && (
                <Button variant="outline" onClick={() => { setEditingDraft(null); setFormName(''); }}>
                  Cancel edit
                </Button>
              )}
            </div>
          </div>}

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Existing Forms</h3>
            {data.forms.map((form) => {
              const version = form.currentVersionId ? versionsById.get(form.currentVersionId) : undefined;
              const draftVersion = data.versions.find((item) => item.formId === form.id && item.status === 'draft');
              return (
                <div key={form.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50/50">
                  <div>
                    <p className="font-semibold text-slate-900">{form.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Status: <span className="font-medium text-slate-700 capitalize">{form.status}</span> · Version {version?.versionNumber || draftVersion?.versionNumber || '—'} · {version?.schema.fields.length || draftVersion?.schema.fields.length || 0} fields</p>
                  </div>
                  {canManage && (
                    <div className="flex flex-wrap gap-2">
                      {draftVersion && (
                        <>
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => editDraft(form.id, draftVersion.id)}>
                            Edit draft
                          </Button>
                          <Button size="sm" disabled={busy} onClick={() => void runAction(() => publishDynamicForm(form.id, draftVersion.id), 'Form version published. Historical records remain pinned to their original version.')}>
                            Publish draft
                          </Button>
                        </>
                      )}
                      {form.status === 'published' && !draftVersion && (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => startNewVersion(form.id, form.name)}>
                          New version
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {data.forms.length === 0 && <p className="text-sm text-slate-500 py-3">No forms configured yet.</p>}
          </div>
        </Card>
      </div>

      <Card className="space-y-4 border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Organization templates</h2>
        {!data.indicators.length && !data.forms.length && <div className="flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-3">
          <label className="min-w-64 flex-1"><span className={labelClass}>Start from an approved template</span><select className={inputClass} value={templateVersionToApply} onChange={(e) => setTemplateVersionToApply(e.target.value)}><option value="">Build this project from scratch</option>{templates.filter((template) => template.status === 'active').flatMap((template) => template.versions.filter((version) => version.status === 'published').map((version) => <option key={version.id} value={version.id}>{template.name} · v{version.versionNumber}</option>))}</select></label>
          <Button disabled={busy || !templateVersionToApply} onClick={() => void useTemplate()}>Apply template</Button>
        </div>}
        {canManageTemplates && <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 p-3">
          <label className="min-w-64 flex-1"><span className={labelClass}>Save this project setup as an organization template</span><input className={inputClass} value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Youth community forum project" /></label>
          <Button variant="outline" disabled={busy} onClick={() => void makeTemplate()}>Create template draft</Button>
        </div>}
        <div className="space-y-2">{templates.map((template) => template.versions.map((version) => <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3">
          <div><p className="font-medium">{template.name} <span className="text-xs font-normal text-slate-500">v{version.versionNumber}</span></p><p className="text-xs text-slate-500">{template.code} · template {template.status} · version {version.status}</p></div>
          {canApproveTemplates && template.status === 'draft' && version.status === 'draft' && <Button size="sm" disabled={busy} onClick={() => void runAction(() => approveOrganizationTemplate(template.id, version.id), 'Organization template approved and published.')}>Approve template</Button>}
        </div>))}{templates.length === 0 && <p className="text-sm text-slate-500">No organization templates are available.</p>}</div>
      </Card>

      {canManage && <Card className="space-y-3 border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Assign data collection</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <label><span className={labelClass}>Published form</span><select className={inputClass} value={assignFormId} onChange={(e) => setAssignFormId(e.target.value)}><option value="">Select form</option>{data.forms.filter((form) => form.status === 'published').map((form) => <option key={form.id} value={form.id}>{form.name}</option>)}</select></label>
          <label><span className={labelClass}>Assignee</span><select className={inputClass} value={assignMemberId} onChange={(e) => setAssignMemberId(e.target.value)}><option value="">Select member</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
          <label><span className={labelClass}>Reporting period key</span><input className={inputClass} placeholder="2026-Q4" value={assignPeriod} onChange={(e) => setAssignPeriod(e.target.value)} /></label>
          <label><span className={labelClass}>Due date</span><input type="date" className={inputClass} value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)} /></label>
        </div>
        <Button disabled={busy} onClick={() => void makeAssignment()}>Create assignment</Button>
      </Card>}

      <Card className="space-y-6 border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Submit a collection</h2>
            <p className="text-xs text-slate-500">Record field observations and submission reports against approved forms</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className={labelClass}>Published, assigned, or saved form</span>
            <select
              className={inputClass}
              value={collectFormId}
              onChange={(e) => {
                setCollectFormId(e.target.value);
                setCollectAssignmentId('');
                setCollectVersionOverride('');
                setEditingSubmissionId(null);
                setAnswers({});
              }}
            >
              <option value="">Select form</option>
              {data.forms
                .filter((form) => form.status === 'published' || myAssignments.some((assignment) => assignment.formId === form.id) || data.submissions.some((submission) => submission.formId === form.id && submission.submittedBy === user?.id && ['draft', 'returned'].includes(submission.status)))
                .map((form) => <option key={form.id} value={form.id}>{form.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Assigned period (if assigned)</span>
            <select
              className={inputClass}
              value={collectAssignmentId}
              onChange={(e) => setCollectAssignmentId(e.target.value)}
            >
              <option value="">Unassigned collection</option>
              {myAssignments
                .filter((assignment) => assignment.formId === collectFormId)
                .map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.periodKey}{assignment.dueDate ? ` · due ${assignment.dueDate}` : ''}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Collection date</span>
            <input
              type="date"
              className={inputClass}
              value={collectedOn}
              onChange={(e) => setCollectedOn(e.target.value)}
            />
          </label>
        </div>

        {selectedVersion && (
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
            <div className="border-b border-slate-200/80 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">{selectedVersion.schema.title || 'Collection Form'}</h3>
              <p className="text-xs text-slate-500">Version {selectedVersion.versionNumber} · Please fill in all required answers carefully.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {selectedVersion.schema.fields.map((field) => (
                <div
                  key={field.key}
                  className={cn(
                    'rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-colors hover:border-slate-300',
                    field.type === 'textarea' ? 'md:col-span-2' : ''
                  )}
                >
                  <label className="block">
                    <span className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700">
                      <span>{field.label}{field.required ? ' *' : ''}</span>
                      <span className="text-[11px] font-normal normal-case text-slate-400">key: {field.key}</span>
                    </span>

                    {field.type === 'textarea' ? (
                      <textarea
                        className="w-full min-h-[160px] rounded-xl border border-slate-300 bg-white p-4 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-[#D68904] focus:outline-none focus:ring-2 focus:ring-[#D68904]/20 transition-colors shadow-none"
                        rows={6}
                        placeholder={`Enter detailed response for ${field.label}...`}
                        value={String(answers[field.key] ?? '')}
                        onChange={(e) => setAnswers({ ...answers, [field.key]: e.target.value })}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        className={inputClass}
                        value={String(answers[field.key] ?? '')}
                        onChange={(e) => setAnswers({ ...answers, [field.key]: e.target.value || undefined })}
                      >
                        <option value="">Select an option</option>
                        {(field.options || []).map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : field.type === 'multiselect' ? (
                      <div className="space-y-1.5">
                        <select
                          multiple
                          className="w-full min-h-[120px] rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-[#D68904] focus:outline-none focus:ring-2 focus:ring-[#D68904]/20 transition-colors shadow-none"
                          value={Array.isArray(answers[field.key]) ? (answers[field.key] as string[]) : []}
                          onChange={(e) =>
                            setAnswers({
                              ...answers,
                              [field.key]: Array.from(e.target.selectedOptions, (option) => option.value),
                            })
                          }
                        >
                          {(field.options || []).map((option) => (
                            <option key={option} value={option} className="py-1">{option}</option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-400">Hold Ctrl (or Cmd on Mac) to select multiple choices.</p>
                      </div>
                    ) : field.type === 'boolean' ? (
                      <select
                        className={inputClass}
                        value={answers[field.key] === undefined ? '' : String(answers[field.key])}
                        onChange={(e) => setAnswers({ ...answers, [field.key]: e.target.value === '' ? undefined : e.target.value === 'true' })}
                      >
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        className={inputClass}
                        type={field.type === 'integer' || field.type === 'decimal' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        step={field.type === 'decimal' ? 'any' : undefined}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        value={String(answers[field.key] ?? '')}
                        onChange={(e) =>
                          setAnswers({
                            ...answers,
                            [field.key]:
                              e.target.value === ''
                                ? undefined
                                : field.type === 'integer' || field.type === 'decimal'
                                ? Number(e.target.value)
                                : e.target.value,
                          })
                        }
                      />
                    )}
                  </label>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
              <Button disabled={busy} variant="outline" onClick={() => void saveSubmission(false)}>
                {editingSubmissionId ? 'Update draft' : 'Save draft'}
              </Button>
              <Button disabled={busy} onClick={() => void saveSubmission(true)}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                {editingSubmissionId ? 'Resubmit for verification' : 'Submit for verification'}
              </Button>
              {editingSubmissionId && (
                <Button variant="ghost" onClick={() => { setEditingSubmissionId(null); setAnswers({}); }}>
                  Cancel edit
                </Button>
              )}
            </div>
          </div>
        )}
        {!selectedVersion && (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600">Choose a form above to load questions</p>
            <p className="text-xs text-slate-400">Select an approved published form or an assigned reporting period to submit data.</p>
          </div>
        )}
      </Card>

      <Card className="space-y-3 border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Submission verification</h2><Badge variant="warning">{pendingSubmissions.length} pending</Badge></div>
        {!canVerify && <p className="text-sm text-slate-500">Your account can submit assigned data. An authorized M&E verifier or administrator reviews official submissions.</p>}
        {canVerify && pendingSubmissions.map((submission) => {
          const form = formsById.get(submission.formId);
          const version = versionsById.get(submission.formVersionId);
          return <div key={submission.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
            <div><p className="font-medium">{form?.name || 'Collection'} · {submission.collectedOn}</p><p className="text-xs text-slate-500">{version?.schema.title || 'Form'} v{version?.versionNumber} · submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : ''}</p><p className="mt-1 text-xs text-slate-600">{Object.entries(submission.values).map(([key, value]) => `${key}: ${String(value)}`).join(' · ')}</p></div>
            {submission.submittedBy !== user?.id ? <div className="flex gap-2"><Button size="sm" onClick={() => review(submission, 'verified')}>Verify</Button><Button size="sm" variant="outline" onClick={() => review(submission, 'returned')}>Return</Button></div> : <span className="text-xs text-amber-700">You submitted this record and cannot verify it.</span>}
          </div>;
        })}
        {canVerify && pendingSubmissions.length === 0 && <p className="text-sm text-slate-500">No submissions are waiting for verification.</p>}
        {data.submissions.filter((item) => item.status === 'returned').length > 0 && <p className="text-xs text-slate-500">Returned records remain in history and are excluded from indicator results until resubmitted and verified.</p>}
      </Card>

      <Card className="space-y-3 border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Your drafts and returned collections</h2>
        {data.submissions.filter((submission) => submission.submittedBy === user?.id && ['draft', 'returned'].includes(submission.status)).map((submission) => <div key={submission.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
          <div><p className="font-medium">{formsById.get(submission.formId)?.name || 'Collection'} · {submission.collectedOn}</p><p className="text-xs text-slate-500">{submission.status}{submission.status === 'returned' ? ' · correct the record and resubmit' : ''}</p></div>
          <Button size="sm" variant="outline" onClick={() => resumeSubmission(submission)}>Continue</Button>
        </div>)}
        {data.submissions.filter((submission) => submission.submittedBy === user?.id && ['draft', 'returned'].includes(submission.status)).length === 0 && <p className="text-sm text-slate-500">You have no drafts or returned records to continue.</p>}
      </Card>
    </div>
  );
};
