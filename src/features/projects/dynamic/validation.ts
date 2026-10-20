import type { DynamicFormSchema, DynamicFormField } from './types';

const SUPPORTED_FIELD_TYPES = new Set(['text', 'textarea', 'integer', 'decimal', 'date', 'select', 'multiselect', 'boolean']);

export function validateFormSchema(schema: DynamicFormSchema): string[] {
  const errors: string[] = [];
  if (!schema.title.trim()) errors.push('Form title is required.');
  if (!Array.isArray(schema.fields) || schema.fields.length < 1 || schema.fields.length > 100) errors.push('A form must contain between 1 and 100 fields.');
  const keys = new Set<string>();
  for (const [index, field] of (schema.fields || []).entries()) {
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(field.key)) errors.push(`Field ${index + 1} key must start with a lowercase letter and contain only lowercase letters, numbers, and underscores.`);
    if (keys.has(field.key)) errors.push(`Field key "${field.key}" is duplicated.`);
    keys.add(field.key);
    if (!field.label.trim()) errors.push(`Field ${index + 1} needs a label.`);
    if (!SUPPORTED_FIELD_TYPES.has(field.type)) errors.push(`Field ${field.label || index + 1} uses an unsupported type.`);
    if ((field.type === 'select' || field.type === 'multiselect') && (!field.options || field.options.length < 1 || field.options.length > 100)) errors.push(`${field.label || `Field ${index + 1}`} needs between 1 and 100 choices.`);
    if (field.options && new Set(field.options).size !== field.options.length) errors.push(`${field.label || `Field ${index + 1}`} has duplicate choices.`);
    if (field.min !== undefined && !Number.isFinite(field.min)) errors.push(`${field.label || `Field ${index + 1}`} has an invalid minimum.`);
    if (field.max !== undefined && !Number.isFinite(field.max)) errors.push(`${field.label || `Field ${index + 1}`} has an invalid maximum.`);
    if (field.min !== undefined && field.max !== undefined && field.min > field.max) errors.push(`${field.label || `Field ${index + 1}`} minimum cannot exceed maximum.`);
    if ((field.min !== undefined || field.max !== undefined) && !['integer', 'decimal'].includes(field.type)) errors.push(`${field.label || `Field ${index + 1}`} numeric limits require a number field.`);
  }
  return errors;
}

export function validateFormAnswers(schema: DynamicFormSchema, answers: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const fieldKeys = new Set(schema.fields.map((field) => field.key));
  for (const key of Object.keys(answers)) if (!fieldKeys.has(key)) errors.push(`Unknown form field: ${key}.`);
  for (const field of schema.fields) {
    const value = answers[field.key];
    if (value === undefined || value === null || value === '') {
      if (field.required) errors.push(`${field.label} is required.`);
      continue;
    }
    const error = validateFieldValue(field, value);
    if (error) errors.push(`${field.label}: ${error}`);
  }
  return errors;
}

function validateFieldValue(field: DynamicFormField, value: unknown): string | null {
  if (field.type === 'text' || field.type === 'textarea') return typeof value === 'string' ? null : 'enter text.';
  if (field.type === 'integer' || field.type === 'decimal') {
    if (typeof value !== 'number' || !Number.isFinite(value)) return field.type === 'integer' ? 'enter a whole number.' : 'enter a valid number.';
    if (field.type === 'integer' && !Number.isInteger(value)) return 'enter a whole number.';
    if (field.min !== undefined && value < field.min) return `enter a value of at least ${field.min}.`;
    if (field.max !== undefined && value > field.max) return `enter a value no greater than ${field.max}.`;
    return null;
  }
  if (field.type === 'date') {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'enter a valid date.';
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? null : 'enter a valid date.';
  }
  if (field.type === 'boolean') return typeof value === 'boolean' ? null : 'choose yes or no.';
  if (field.type === 'select') return typeof value === 'string' && Boolean(field.options?.includes(value)) ? null : 'choose one of the listed options.';
  if (field.type === 'multiselect') return Array.isArray(value) && value.every((choice) => typeof choice === 'string' && field.options?.includes(choice)) ? null : 'choose only listed options.';
  return 'uses an unsupported type.';
}
