import type { IndicatorCalculation, IndicatorObservation, IndicatorResult } from './types';

export interface CalculationDefinition {
  type: IndicatorCalculation;
  target?: number | null;
  aggregation?: 'sum' | 'average' | 'latest';
}

/** Deterministic indicator aggregation. Only verified observations are eligible. */
export function calculateIndicator(
  definition: CalculationDefinition,
  observations: IndicatorObservation[]
): IndicatorResult {
  const verified = observations
    .filter((item) => item.status === 'verified')
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt) || a.verifiedAt.localeCompare(b.verifiedAt) || a.recordId.localeCompare(b.recordId));
  if (definition.type === 'latest_value_or_milestone_state') {
    const eligible = verified.filter((item) => item.value !== null && item.value !== undefined
      && (typeof item.value !== 'string' || item.value.trim() !== '')
      && (typeof item.value !== 'number' || Number.isFinite(item.value)));
    const latest = eligible.at(-1);
    return {
      value: latest?.value ?? null,
      numerator: typeof latest?.value === 'number' ? latest.value : null,
      denominator: null,
      observationCount: latest ? 1 : 0,
      excludedCount: observations.length - (latest ? 1 : 0),
      lastVerifiedAt: latest?.verifiedAt || null,
    };
  }

  const numeric = verified.filter((item): item is IndicatorObservation & { value: number } =>
    typeof item.value === 'number' && Number.isFinite(item.value)
  );
  const lastVerifiedAt = numeric.reduce<string | null>((latest, item) => !latest || item.verifiedAt > latest ? item.verifiedAt : latest, null);
  const sum = numeric.reduce((total, item) => total + item.value, 0);
  const aggregation = definition.type === 'average' ? 'average' : (definition.aggregation || 'sum');
  const observed = aggregation === 'average' && numeric.length > 0 ? sum / numeric.length : sum;

  if (definition.type === 'percentage_of_target') {
    const target = definition.target;
    const validTarget = typeof target === 'number' && Number.isFinite(target) && target > 0;
    return {
      value: validTarget && numeric.length ? (observed / target) * 100 : null,
      numerator: numeric.length ? observed : null,
      denominator: validTarget ? target : null,
      observationCount: numeric.length,
      excludedCount: observations.length - numeric.length,
      lastVerifiedAt,
    };
  }

  return {
    value: numeric.length ? observed : null,
    numerator: numeric.length ? sum : null,
    denominator: definition.type === 'average' ? numeric.length : null,
    observationCount: numeric.length,
    excludedCount: observations.length - numeric.length,
    lastVerifiedAt,
  };
}

export function validateIndicatorDefinition(definition: CalculationDefinition): string[] {
  const errors: string[] = [];
  if (definition.type === 'percentage_of_target' && !(typeof definition.target === 'number' && Number.isFinite(definition.target) && definition.target > 0)) {
    errors.push('Percentage of target requires a target greater than zero.');
  }
  if (definition.type === 'latest_value_or_milestone_state' && definition.aggregation && definition.aggregation !== 'latest') {
    errors.push('Latest value or milestone state must use latest aggregation.');
  }
  if (definition.type === 'average' && definition.aggregation && definition.aggregation !== 'average') {
    errors.push('Average calculation must use average aggregation.');
  }
  return errors;
}
