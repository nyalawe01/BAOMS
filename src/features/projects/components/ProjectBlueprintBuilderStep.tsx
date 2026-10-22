import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Target,
  ClipboardList,
  CheckSquare,
  Layers,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ORGANIZATIONAL_TEMPLATES,
  ProjectTemplateDefinition,
} from '../dynamic/templates';
import type { DynamicFieldType, IndicatorCalculation } from '../dynamic/types';

export interface ConfiguredIndicator {
  code: string;
  name: string;
  description: string;
  unit: string;
  target: string;
  baseline: string;
  calculationType: IndicatorCalculation;
  sourceFieldKey: string;
}

export interface ConfiguredFormField {
  key: string;
  label: string;
  type: DynamicFieldType;
  required: boolean;
  helpText?: string;
}

export interface ProjectBlueprintState {
  templateId: string;
  collectionCadence: 'per_activity' | 'weekly' | 'monthly' | 'quarterly';
  assignedRole: 'coordinator' | 'officer' | 'manager';
  indicators: ConfiguredIndicator[];
  formName: string;
  formFields: ConfiguredFormField[];
  checklists: string[];
}

interface ProjectBlueprintBuilderStepProps {
  blueprint: ProjectBlueprintState;
  onChange: (blueprint: ProjectBlueprintState) => void;
}

export const ProjectBlueprintBuilderStep: React.FC<ProjectBlueprintBuilderStepProps> = ({
  blueprint,
  onChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'indicators' | 'form'>('indicators');

  const handleApplyTemplate = (template: ProjectTemplateDefinition) => {
    onChange({
      ...blueprint,
      templateId: template.id,
      indicators: template.indicators.map((ind) => ({
        code: ind.code,
        name: ind.name,
        description: ind.description,
        unit: ind.unit,
        target: String(ind.defaultTarget),
        baseline: '0',
        calculationType: ind.calculationType,
        sourceFieldKey: ind.sourceFieldKey,
      })),
      formName: template.form.name,
      formFields: template.form.fields.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
        helpText: f.helpText,
      })),
      checklists: [...template.checklists],
    });
    setActiveSubTab('indicators');
  };

  const handleApplyBlankSlate = () => {
    onChange({
      ...blueprint,
      templateId: 'custom_blank',
      indicators: [
        {
          code: 'REACH_TOTAL',
          name: 'Direct Project Beneficiaries Reached',
          description: 'Total verified participants attending project events.',
          unit: 'people',
          target: '1000',
          baseline: '0',
          calculationType: 'sum',
          sourceFieldKey: 'participants_count',
        },
      ],
      formName: 'Field Activity & Attendance Register',
      formFields: [
        { key: 'activity_title', label: 'Activity / Session Title', type: 'text', required: true },
        { key: 'activity_date', label: 'Date of Activity', type: 'date', required: true },
        { key: 'participants_count', label: 'Verified Participants Count', type: 'integer', required: true },
        { key: 'field_notes', label: 'Operational Notes & Challenges', type: 'textarea', required: false },
      ],
      checklists: [
        'Activity attendance register completed and signed',
        'Photo or document evidence attached',
      ],
    });
    setActiveSubTab('indicators');
  };

  // Indicator Handlers
  const handleAddIndicator = () => {
    const newInd: ConfiguredIndicator = {
      code: `IND_${blueprint.indicators.length + 1}`,
      name: 'New Custom Metric',
      description: '',
      unit: 'count',
      target: '100',
      baseline: '0',
      calculationType: 'sum',
      sourceFieldKey: 'participants_count',
    };
    onChange({
      ...blueprint,
      indicators: [...blueprint.indicators, newInd],
    });
  };

  const handleUpdateIndicator = (index: number, key: keyof ConfiguredIndicator, val: string) => {
    const updated = blueprint.indicators.map((ind, i) => (i === index ? { ...ind, [key]: val } : ind));
    onChange({ ...blueprint, indicators: updated });
  };

  const handleRemoveIndicator = (index: number) => {
    onChange({
      ...blueprint,
      indicators: blueprint.indicators.filter((_, i) => i !== index),
    });
  };

  // Form Field Handlers
  const handleAddField = () => {
    const newField: ConfiguredFormField = {
      key: `field_${blueprint.formFields.length + 1}`,
      label: 'New Question / Field',
      type: 'text',
      required: false,
    };
    onChange({
      ...blueprint,
      formFields: [...blueprint.formFields, newField],
    });
  };

  const handleUpdateField = (index: number, key: keyof ConfiguredFormField, val: unknown) => {
    const updated = blueprint.formFields.map((f, i) => (i === index ? { ...f, [key]: val } : f));
    onChange({ ...blueprint, formFields: updated });
  };

  const handleRemoveField = (index: number) => {
    onChange({
      ...blueprint,
      formFields: blueprint.formFields.filter((_, i) => i !== index),
    });
  };

  // Checklist Handlers
  const handleAddChecklist = () => {
    onChange({
      ...blueprint,
      checklists: [...blueprint.checklists, ''],
    });
  };

  const handleUpdateChecklist = (index: number, val: string) => {
    const updated = blueprint.checklists.map((item, i) => (i === index ? val : item));
    onChange({ ...blueprint, checklists: updated });
  };

  const handleRemoveChecklist = (index: number) => {
    onChange({
      ...blueprint,
      checklists: blueprint.checklists.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-forest-50/50 border border-forest-200 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-forest-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-forest-700" />
            <span>Dynamic Project Blueprint &amp; M&amp;E Framework</span>
          </h2>
          <p className="text-xs text-charcoal-muted mt-1 max-w-2xl">
            Configure the metrics, attendance registers, checklists, and data-collection cadence.
            Once saved, BAOMS will automatically generate data forms, KPI tracking cards, and donor-ready tables.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-lg border border-forest-200">
          <button
            type="button"
            onClick={() => setActiveSubTab('indicators')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeSubTab === 'indicators' ? 'bg-[#D68904] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            1. Indicators &amp; Targets ({blueprint.indicators.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('form')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeSubTab === 'form' ? 'bg-[#D68904] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            2. Field Collection Form ({blueprint.formFields.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB 2: INDICATORS TABLE BUILDER */}
      {activeSubTab === 'indicators' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Performance Indicators &amp; Target Metrics</h3>
              <p className="text-xs text-slate-500">
                Define the measurable KPIs. The system will auto-calculate progress against verified logs.
              </p>
            </div>
            <Button size="sm" onClick={handleAddIndicator}>
              <Plus className="w-4 h-4 mr-1" /> Add Indicator
            </Button>
          </div>

          <div className="space-y-3">
            {blueprint.indicators.length === 0 && (
              <p className="text-xs text-slate-500 p-4 bg-slate-50 rounded-lg text-center">
                No indicators added yet. Click &quot;Add Indicator&quot; or choose a template.
              </p>
            )}

            {blueprint.indicators.map((ind, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">Indicator Definition</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveIndicator(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove indicator"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Code (Uppercase) *
                    </label>
                    <input
                      className="w-full text-xs font-mono rounded-md border border-slate-300 p-2 uppercase"
                      value={ind.code}
                      onChange={(e) => handleUpdateIndicator(idx, 'code', e.target.value.toUpperCase())}
                      placeholder="e.g. YOUTH_TRAINED"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Indicator Title *
                    </label>
                    <input
                      className="w-full text-xs rounded-md border border-slate-300 p-2"
                      value={ind.name}
                      onChange={(e) => handleUpdateIndicator(idx, 'name', e.target.value)}
                      placeholder="e.g. Number of youth completing vocational skills course"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Unit of Measurement
                    </label>
                    <input
                      className="w-full text-xs rounded-md border border-slate-300 p-2"
                      value={ind.unit}
                      onChange={(e) => handleUpdateIndicator(idx, 'unit', e.target.value)}
                      placeholder="e.g. youth, %, sessions, kits"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Target Goal
                    </label>
                    <input
                      type="number"
                      className="w-full text-xs rounded-md border border-slate-300 p-2"
                      value={ind.target}
                      onChange={(e) => handleUpdateIndicator(idx, 'target', e.target.value)}
                      placeholder="e.g. 500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Calculation Method
                    </label>
                    <select
                      className="w-full text-xs rounded-md border border-slate-300 p-2 bg-white"
                      value={ind.calculationType}
                      onChange={(e) =>
                        handleUpdateIndicator(idx, 'calculationType', e.target.value as IndicatorCalculation)
                      }
                    >
                      <option value="sum">Sum / Cumulative Count</option>
                      <option value="percentage_of_target">Percentage of Target (%)</option>
                      <option value="average">Average / Mean Score</option>
                      <option value="latest_value_or_milestone_state">Latest Value / Milestone</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Source Field in Form *
                    </label>
                    <input
                      className="w-full text-xs font-mono rounded-md border border-slate-300 p-2"
                      value={ind.sourceFieldKey}
                      onChange={(e) => handleUpdateIndicator(idx, 'sourceFieldKey', e.target.value)}
                      placeholder="e.g. graduates_count"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DATA COLLECTION FORM BUILDER */}
      {activeSubTab === 'form' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Dynamic Activity &amp; Attendance Form Schema</h3>
              <p className="text-xs text-slate-500">
                Design the form questions your field officers will complete for each event or milestone.
              </p>
            </div>
            <Button size="sm" onClick={handleAddField}>
              <Plus className="w-4 h-4 mr-1" /> Add Question / Field
            </Button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-semibold text-slate-700">Form Title</label>
            <input
              className="w-full text-sm font-semibold rounded-md border border-slate-300 p-2 bg-white"
              value={blueprint.formName}
              onChange={(e) => onChange({ ...blueprint, formName: e.target.value })}
              placeholder="e.g. Community Activity & Attendance Register"
            />
          </div>

          <div className="space-y-3">
            {blueprint.formFields.map((field, idx) => (
              <div
                key={idx}
                className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-white grid gap-3 sm:grid-cols-4 items-center"
              >
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Field Key (Stable ID)</label>
                  <input
                    className="w-full text-xs font-mono rounded-md border border-slate-300 p-1.5"
                    value={field.key}
                    onChange={(e) => handleUpdateField(idx, 'key', e.target.value)}
                    placeholder="e.g. participants_count"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Question / Label</label>
                  <input
                    className="w-full text-xs rounded-md border border-slate-300 p-1.5"
                    value={field.label}
                    onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                    placeholder="e.g. Number of verified participants"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Type</label>
                    <select
                      className="w-full text-xs rounded-md border border-slate-300 p-1.5 bg-white"
                      value={field.type}
                      onChange={(e) => handleUpdateField(idx, 'type', e.target.value)}
                    >
                      <option value="text">Short Text</option>
                      <option value="textarea">Long Text</option>
                      <option value="integer">Whole Number</option>
                      <option value="decimal">Decimal</option>
                      <option value="date">Date</option>
                      <option value="boolean">Yes / No</option>
                    </select>
                  </div>

                  <div className="pt-4 flex items-center gap-1">
                    <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => handleUpdateField(idx, 'required', e.target.checked)}
                      />
                      Req.
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(idx)}
                      className="text-red-500 hover:text-red-700 p-1 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
};
