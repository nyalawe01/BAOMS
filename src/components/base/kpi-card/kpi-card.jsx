import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Shared KPI stat tile used across dashboard home pages. `trend` is optional:
// pass a signed number (e.g. 4.2 or -1.7) to show a green/red delta arrow: -
// omit it for a plain figure with no trend line.
export function KpiCard({ label, value, trend, tooltip, badge }) {
  const hasTrend = typeof trend === 'number' && !Number.isNaN(trend);
  const isUp = hasTrend && trend >= 0;

  return (
    <div className="flex flex-col bg-white border border-slate-200 shadow-sm rounded-xl">
      <div className="p-5">
        <div className="flex items-center gap-x-2">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
          {tooltip && (
            <span className="group relative">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-400 text-[10px] flex items-center justify-center cursor-help">?</span>
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 text-center z-10 py-1.5 px-2.5 bg-slate-900 text-white text-xs rounded-md shadow-lg">
                {tooltip}
              </span>
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-x-2">
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
          {hasTrend && (
            <span className={`flex items-center gap-x-1 text-sm font-semibold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              <span>{Math.abs(trend)}%</span>
            </span>
          )}
          {!hasTrend && badge && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold border bg-slate-50 text-slate-500 border-slate-200">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Grid wrapper matching the reference layout (2 cols mobile, 4 cols desktop).
export function KpiCardGrid({ children }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
