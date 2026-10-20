export type DynamicFieldType = 'text' | 'textarea' | 'integer' | 'decimal' | 'date' | 'select' | 'multiselect' | 'boolean';
export type IndicatorCalculation = 'sum' | 'percentage_of_target' | 'average' | 'latest_value_or_milestone_state';
export type DynamicSubmissionStatus = 'draft' | 'pending' | 'verified' | 'returned' | 'rejected';
export type DynamicFormStatus = 'draft' | 'published' | 'retired';

export interface DynamicFormField {
  key: string;
  label: string;
  type: DynamicFieldType;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  helpText?: string;
}

export interface DynamicFormSchema {
  title: string;
  description?: string;
  fields: DynamicFormField[];
}

export interface DynamicIndicator {
  id: string;
  projectId: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  baseline: number | null;
  target: number | null;
  calculationType: IndicatorCalculation;
  sourceFieldKey: string;
  aggregation: 'sum' | 'average' | 'latest';
  configVersion: number;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface DynamicForm {
  id: string;
  projectId: string;
  name: string;
  status: DynamicFormStatus;
  currentVersionId: string | null;
  currentVersionNumber: number;
  createdAt: string;
}

export interface DynamicFormVersion {
  id: string;
  formId: string;
  versionNumber: number;
  schema: DynamicFormSchema;
  status: DynamicFormStatus;
  publishedAt: string | null;
  createdAt: string;
}

export interface DynamicSubmission {
  id: string;
  projectId: string;
  formId: string;
  formVersionId: string;
  assignmentId: string | null;
  collectedOn: string;
  values: Record<string, unknown>;
  indicatorVersions: Record<string, number>;
  status: DynamicSubmissionStatus;
  submittedBy: string;
  submittedAt: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface IndicatorObservation {
  value: number | string | boolean | null;
  observedAt: string;
  verifiedAt: string;
  recordId: string;
  status: DynamicSubmissionStatus;
}

export interface IndicatorResult {
  value: number | string | boolean | null;
  numerator: number | null;
  denominator: number | null;
  observationCount: number;
  excludedCount: number;
  lastVerifiedAt: string | null;
}

export interface CollectionAssignment {
  id: string;
  projectId: string;
  formId: string;
  formVersionId: string;
  assigneeId: string;
  periodKey: string;
  dueDate: string | null;
  status: 'open' | 'submitted' | 'closed';
  createdAt: string;
}

export interface OrganizationProjectTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  versions: Array<{ id: string; versionNumber: number; status: DynamicFormStatus; config: Record<string, unknown> }>;
}
