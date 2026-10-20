import React, { useState } from 'react';
import { Target, BarChart3, Download, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { DynamicIndicator, DynamicSubmission, IndicatorResult } from './types';
import * as XLSX from 'xlsx';

interface IndicatorWithResult {
  indicator: DynamicIndicator;
  result: IndicatorResult;
}

interface ProjectEngineVisualizerProps {
  indicators: IndicatorWithResult[];
  submissions: DynamicSubmission[];
  projectName: string;
  projectCode: string;
}

export const ProjectEngineVisualizer: React.FC<ProjectEngineVisualizerProps> = ({
  indicators,
  submissions,
  projectName,
  projectCode,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredIndicators = indicators.filter(({ indicator }) => {
    if (filterType === 'all') return true;
    return indicator.calculationType === filterType;
  });

  const exportAnalyticsExcel = () => {
    const rows = indicators.map(({ indicator, result }) => {
      let percentAchievement = 'N/A';
      if (indicator.target && typeof result.value === 'number') {
        const pct = indicator.calculationType === 'percentage_of_target'
          ? result.value
          : (result.value / indicator.target) * 100;
        percentAchievement = `${pct.toFixed(1)}%`;
      }

      return {
        'Indicator Code': indicator.code,
        'Indicator Name': indicator.name,
        'Unit': indicator.unit,
        'Calculation Method': indicator.calculationType.replaceAll('_', ' '),
        'Baseline': indicator.baseline ?? 0,
        'Target': indicator.target ?? 'None',
        'Current Verified Value': result.value ?? 0,
        'Achievement (%)': percentAchievement,
        'Verified Observations': result.observationCount,
        'Last Verified Date': result.lastVerifiedAt ? new Date(result.lastVerifiedAt).toLocaleDateString() : 'None',
        'Source Field': indicator.sourceFieldKey,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'M&E Indicators');

    // Also export verified raw submissions
    const verifiedSubs = submissions.filter((s) => s.status === 'verified').map((s) => ({
      'Submission ID': s.id.slice(0, 8),
      'Collected Date': s.collectedOn,
      'Verified Date': s.verifiedAt ? new Date(s.verifiedAt).toLocaleDateString() : '',
      ...s.values,
    }));
    if (verifiedSubs.length > 0) {
      const subSheet = XLSX.utils.json_to_sheet(verifiedSubs);
      XLSX.utils.book_append_sheet(workbook, subSheet, 'Verified Observations');
    }

    XLSX.writeFile(workbook, `${projectCode}_Dynamic_ME_Analytics_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (indicators.length === 0) {
    return (
      <Card className="border border-dashed border-slate-300 p-8 text-center bg-slate-50">
        <Target className="mx-auto h-10 w-10 text-slate-400 mb-2" />
        <h3 className="text-base font-semibold text-slate-800">No Dynamic Indicators Configured</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Add indicators to this project blueprint to automatically generate real-time KPI progress cards, achievement gauges, and auto-calculated metrics.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-forest-700" />
            <span>Auto-Generated M&amp;E Analytics &amp; KPI Progress</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time calculations derived strictly from verified field submissions for {projectName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-200"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Calculation Methods</option>
            <option value="sum">Sum / Cumulative Count</option>
            <option value="percentage_of_target">Percentage of Target</option>
            <option value="average">Average / Mean</option>
            <option value="latest_value_or_milestone_state">Latest Milestone State</option>
          </select>

          <Button variant="outline" size="sm" onClick={exportAnalyticsExcel} className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export M&amp;E Report (Excel)
          </Button>
        </div>
      </div>

      {/* Grid of Dynamic Indicator Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredIndicators.map(({ indicator, result }) => {
          const hasValue = result.value != null;
          const numValue = typeof result.value === 'number' ? result.value : null;
          const target = indicator.target;

          let percent = 0;
          if (indicator.calculationType === 'percentage_of_target' && numValue != null) {
            percent = Math.min(Math.max(numValue, 0), 100);
          } else if (target && target > 0 && numValue != null) {
            percent = Math.min(Math.max((numValue / target) * 100, 0), 100);
          }

          const isComplete = percent >= 100;
          const isHealthy = percent >= 75;
          const isModerate = percent >= 40;

          const progressColor = isComplete
            ? 'bg-emerald-600'
            : isHealthy
            ? 'bg-forest-600'
            : isModerate
            ? 'bg-amber-500'
            : 'bg-slate-400';

          return (
            <Card
              key={indicator.id}
              className="relative overflow-hidden border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider">
                      {indicator.code}
                    </span>
                    <h3 className="font-semibold text-sm text-slate-900 leading-tight">
                      {indicator.name}
                    </h3>
                  </div>
                  <Badge variant={indicator.status === 'active' ? 'success' : 'default'} className="text-[10px]">
                    {indicator.status}
                  </Badge>
                </div>

                {indicator.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{indicator.description}</p>
                )}

                {/* Primary Number Display */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900">
                        {hasValue
                          ? typeof result.value === 'number'
                            ? result.value.toLocaleString(undefined, { maximumFractionDigits: 1 })
                            : result.value
                          : '—'}
                      </span>
                      <span className="ml-1 text-xs font-semibold text-slate-500">
                        {indicator.calculationType === 'percentage_of_target' ? '%' : indicator.unit}
                      </span>
                    </div>

                    {target != null && (
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Target</span>
                        <div className="text-xs font-bold text-slate-700">
                          {target.toLocaleString()} {indicator.unit}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar for Metrics with Targets */}
                  {target != null && target > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-600">
                        <span>Progress</span>
                        <span className="font-bold text-slate-800">{percent.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full transition-all duration-500 ${progressColor}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Metadata */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <strong>{result.observationCount}</strong> verified logs
                </span>

                <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                  {indicator.calculationType.replaceAll('_', ' ')}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
