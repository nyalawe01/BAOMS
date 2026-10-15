import React, { useState, useId } from 'react';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table as TableIcon } from 'lucide-react';

export interface AnalyticsDataPoint {
  label: string;
  value: number;
  color?: string;
  description?: string;
}

export type AnalyticsVisualizerMode = 'bar' | 'line' | 'pie' | 'table';

export interface AnalyticsVisualizerProps {
  data: AnalyticsDataPoint[];
  title?: string;
  description?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  defaultMode?: AnalyticsVisualizerMode;
  availableModes?: AnalyticsVisualizerMode[];
  height?: number;
  className?: string;
  showSummaryCards?: boolean;
  summaryMetrics?: Array<{
    label: string;
    value: string | number;
    change?: string;
    helper?: string;
  }>;
}

const DEFAULT_COLORS = [
  '#F2A507',
  '#D68904',
  '#1e293b',
  '#0f766e',
  '#0369a1',
  '#7c3aed',
  '#b45309',
  '#15803d',
  '#be123c',
  '#475569',
];

export const AnalyticsVisualizer: React.FC<AnalyticsVisualizerProps> = ({
  data,
  title,
  description,
  valuePrefix = '',
  valueSuffix = '',
  defaultMode = 'bar',
  availableModes = ['bar', 'line', 'pie', 'table'],
  height = 280,
  className = '',
  showSummaryCards = false,
  summaryMetrics,
}) => {
  const [activeMode, setActiveMode] = useState<AnalyticsVisualizerMode>(defaultMode);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const gradientId = useId();

  // Guard against empty data
  if (!data || data.length === 0) {
    return (
      <div className={`p-6 border border-slate-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 text-center ${className}`}>
        {title && <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>}
        <p className="text-xs text-slate-500 dark:text-neutral-400">No analytical data points available.</p>
      </div>
    );
  }

  const totalValue = data.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const maxValue = Math.max(...data.map((d) => Number(d.value) || 0), 1);

  // Format value with prefix and suffix
  const formatVal = (val: number) => {
    return `${valuePrefix}${val.toLocaleString()}${valueSuffix}`;
  };

  return (
    <div className={`border border-slate-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 p-5 transition-all ${className}`}>
      {/* Header and Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-neutral-800 mb-4">
        <div>
          {title && <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>}
          {description && <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">{description}</p>}
        </div>

        {availableModes.length > 1 && (
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-neutral-800 rounded-lg self-start sm:self-auto">
            {availableModes.includes('bar') && (
              <button
                type="button"
                onClick={() => setActiveMode('bar')}
                title="Bar Chart"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  activeMode === 'bar'
                    ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Bar</span>
              </button>
            )}

            {availableModes.includes('line') && (
              <button
                type="button"
                onClick={() => setActiveMode('line')}
                title="Line Trend"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  activeMode === 'line'
                    ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                <span>Line</span>
              </button>
            )}

            {availableModes.includes('pie') && (
              <button
                type="button"
                onClick={() => setActiveMode('pie')}
                title="Donut / Distribution"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  activeMode === 'pie'
                    ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                <span>Distribution</span>
              </button>
            )}

            {availableModes.includes('table') && (
              <button
                type="button"
                onClick={() => setActiveMode('table')}
                title="Data Table"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  activeMode === 'table'
                    ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Optional Summary KPI Badges */}
      {showSummaryCards && summaryMetrics && summaryMetrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {summaryMetrics.map((metric, idx) => (
            <div key={idx} className="p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-lg border border-slate-100 dark:border-neutral-800">
              <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{metric.label}</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{metric.value}</div>
              {metric.helper && <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">{metric.helper}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Visualization Canvas */}
      <div style={{ minHeight: height }} className="relative flex flex-col justify-center">
        {/* BAR CHART VIEW */}
        {activeMode === 'bar' && (
          <div className="w-full">
            <svg viewBox={`0 0 600 ${height}`} className="w-full h-auto overflow-visible select-none" style={{ maxHeight: height }}>
              <defs>
                <linearGradient id={`bar-grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F2A507" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#D68904" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = (height - 50) * (1 - pct) + 15;
                const gridVal = Math.round(maxValue * pct);
                return (
                  <g key={idx}>
                    <line x1="45" y1={y} x2="590" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" className="dark:stroke-neutral-800" />
                    <text x="40" y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8" className="dark:fill-neutral-500">
                      {gridVal >= 1000 ? `${(gridVal / 1000).toFixed(0)}k` : gridVal}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {data.map((item, idx) => {
                const barAreaWidth = 530;
                const slotWidth = barAreaWidth / data.length;
                const barWidth = Math.min(Math.max(slotWidth * 0.55, 16), 48);
                const x = 55 + idx * slotWidth + (slotWidth - barWidth) / 2;
                const barHeight = ((Number(item.value) || 0) / maxValue) * (height - 65);
                const y = height - 40 - barHeight;
                const barColor = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                const isHovered = hoveredIndex === idx;

                return (
                  <g
                    key={idx}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Background hover column */}
                    <rect
                      x={55 + idx * slotWidth}
                      y={10}
                      width={slotWidth}
                      height={height - 45}
                      fill={isHovered ? 'currentColor' : 'transparent'}
                      className="text-slate-100/50 dark:text-neutral-800/40"
                    />

                    {/* Bar rectangle with rounded top */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 2)}
                      rx="4"
                      fill={barColor}
                      opacity={hoveredIndex !== null && !isHovered ? 0.45 : 1}
                      className="transition-all duration-200"
                    />

                    {/* Value on top of bar if space permits */}
                    {barHeight > 24 && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 6}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill={isHovered ? '#0f172a' : '#64748b'}
                        className="dark:fill-neutral-300"
                      >
                        {item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
                      </text>
                    )}

                    {/* X-axis Label */}
                    <text
                      x={x + barWidth / 2}
                      y={height - 20}
                      textAnchor="middle"
                      fontSize="10.5"
                      fontWeight={isHovered ? '600' : '400'}
                      fill={isHovered ? '#0f172a' : '#64748b'}
                      className="dark:fill-neutral-400"
                    >
                      {item.label.length > 12 ? `${item.label.slice(0, 10)}…` : item.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip display banner below graph */}
            <div className="h-7 mt-2 flex items-center justify-center">
              {hoveredIndex !== null && data[hoveredIndex] ? (
                (() => {
                  const item = data[hoveredIndex]!;
                  return (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-md text-xs shadow-md animate-in fade-in zoom-in-95 duration-150">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color || DEFAULT_COLORS[hoveredIndex % DEFAULT_COLORS.length] }}
                      />
                      <span className="font-medium">{item.label}:</span>
                      <span className="font-bold text-[#F2A507]">{formatVal(item.value)}</span>
                      {totalValue > 0 && (
                        <span className="text-slate-400 text-[11px]">
                          ({((item.value / totalValue) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  );
                })()
              ) : (
                <span className="text-[11px] text-slate-400 dark:text-neutral-500">Hover over bars to inspect detailed breakdowns</span>
              )}
            </div>
          </div>
        )}

        {/* LINE TREND VIEW */}
        {activeMode === 'line' && (
          <div className="w-full">
            <svg viewBox={`0 0 600 ${height}`} className="w-full h-auto overflow-visible select-none" style={{ maxHeight: height }}>
              <defs>
                <linearGradient id={`line-area-grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F2A507" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#F2A507" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = (height - 50) * (1 - pct) + 15;
                const gridVal = Math.round(maxValue * pct);
                return (
                  <g key={idx}>
                    <line x1="45" y1={y} x2="590" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" className="dark:stroke-neutral-800" />
                    <text x="40" y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8" className="dark:fill-neutral-500">
                      {gridVal >= 1000 ? `${(gridVal / 1000).toFixed(0)}k` : gridVal}
                    </text>
                  </g>
                );
              })}

              {/* Compute points */}
              {(() => {
                const pointAreaWidth = 530;
                const step = data.length > 1 ? pointAreaWidth / (data.length - 1) : pointAreaWidth;
                const points = data.map((d, i) => {
                  const x = 55 + (data.length > 1 ? i * step : pointAreaWidth / 2);
                  const y = height - 40 - ((Number(d.value) || 0) / maxValue) * (height - 65);
                  return { x, y, ...d };
                });

                const pathD = points.reduce((acc, pt, i) => {
                  return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                }, '');

                const firstPt = points[0];
                const lastPt = points[points.length - 1];
                const areaD =
                  firstPt && lastPt
                    ? `${pathD} L ${lastPt.x} ${height - 40} L ${firstPt.x} ${height - 40} Z`
                    : '';

                return (
                  <>
                    {/* Area fill */}
                    {areaD && <path d={areaD} fill={`url(#line-area-grad-${gradientId})`} />}

                    {/* Connecting Line */}
                    <path d={pathD} fill="none" stroke="#D68904" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Nodes */}
                    {points.map((pt, i) => {
                      const isHovered = hoveredIndex === i;
                      return (
                        <g
                          key={i}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredIndex(i)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        >
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 7 : 4.5}
                            fill="#ffffff"
                            stroke="#D68904"
                            strokeWidth={isHovered ? 3.5 : 2.5}
                            className="transition-all duration-150"
                          />

                          {/* X label */}
                          <text
                            x={pt.x}
                            y={height - 20}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight={isHovered ? '600' : '400'}
                            fill={isHovered ? '#0f172a' : '#64748b'}
                            className="dark:fill-neutral-400"
                          >
                            {pt.label.length > 10 ? `${pt.label.slice(0, 8)}…` : pt.label}
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>

            {/* Hover Tooltip display banner below graph */}
            <div className="h-7 mt-2 flex items-center justify-center">
              {hoveredIndex !== null && data[hoveredIndex] ? (
                (() => {
                  const curr = data[hoveredIndex]!;
                  const prev = hoveredIndex > 0 ? data[hoveredIndex - 1] : undefined;
                  return (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-md text-xs shadow-md animate-in fade-in zoom-in-95 duration-150">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F2A507]" />
                      <span className="font-medium">{curr.label}:</span>
                      <span className="font-bold text-[#F2A507]">{formatVal(curr.value)}</span>
                      {prev && (
                        <span className="text-slate-300 text-[11px]">
                          {curr.value >= prev.value ? '+' : ''}
                          {(
                            ((curr.value - prev.value) /
                              Math.max(prev.value, 1)) *
                            100
                          ).toFixed(1)}
                          % vs prev
                        </span>
                      )}
                    </div>
                  );
                })()
              ) : (
                <span className="text-[11px] text-slate-400 dark:text-neutral-500">Hover over trend nodes to inspect changes</span>
              )}
            </div>
          </div>
        )}

        {/* DONUT / PIE VIEW */}
        {activeMode === 'pie' && (
          <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-2">
            {/* SVG Donut */}
            <div className="relative w-48 h-48 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 select-none">
                {(() => {
                  let accumulatedPct = 0;
                  return data.map((item, idx) => {
                    const pct = totalValue > 0 ? (Number(item.value) || 0) / totalValue : 0;
                    const strokeDasharray = `${pct * 282.74} 282.74`;
                    const strokeDashoffset = -accumulatedPct * 282.74;
                    accumulatedPct += pct;
                    const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                    const isHovered = hoveredIndex === idx;

                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={color}
                        strokeWidth={isHovered ? 16 : 13}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Center readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                {hoveredIndex !== null && data[hoveredIndex] ? (
                  (() => {
                    const item = data[hoveredIndex]!;
                    return (
                      <>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate max-w-[90px]">
                          {item.label}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatVal(item.value)}
                        </span>
                        <span className="text-[10px] text-[#D68904] font-medium">
                          {totalValue > 0 ? `${((item.value / totalValue) * 100).toFixed(1)}%` : '0%'}
                        </span>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{formatVal(totalValue)}</span>
                    <span className="text-[10px] text-slate-400">{data.length} segments</span>
                  </>
                )}
              </div>
            </div>

            {/* Donut Legend */}
            <div className="flex-1 w-full max-h-56 overflow-y-auto space-y-1.5 pr-2">
              {data.map((item, idx) => {
                const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                const pct = totalValue > 0 ? ((Number(item.value) || 0) / totalValue) * 100 : 0;
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                      isHovered
                        ? 'bg-slate-100 dark:bg-neutral-800 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="truncate text-slate-700 dark:text-neutral-200">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-slate-900 dark:text-white">{formatVal(item.value)}</span>
                      <span className="text-slate-400 text-[11px] w-12 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DATA TABLE VIEW */}
        {activeMode === 'table' && (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-neutral-300">
              <thead className="bg-slate-50 dark:bg-neutral-800/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-semibold border-b border-slate-200 dark:border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">Segment / Variable</th>
                  <th className="py-2.5 px-3 text-right">Value</th>
                  <th className="py-2.5 px-3 text-right">Share (%)</th>
                  <th className="py-2.5 px-3">Visual Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                {data.map((item, idx) => {
                  const pct = totalValue > 0 ? ((Number(item.value) || 0) / totalValue) * 100 : 0;
                  const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-2 px-3 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span>{item.label}</span>
                        {item.description && (
                          <span className="text-[11px] text-slate-400 font-normal">({item.description})</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800 dark:text-neutral-100">
                        {formatVal(item.value)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-slate-500">{pct.toFixed(1)}%</td>
                      <td className="py-2 px-3 w-40">
                        <div className="w-full bg-slate-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 dark:border-neutral-700 bg-slate-50/60 dark:bg-neutral-800/40 font-semibold text-slate-900 dark:text-white">
                <tr>
                  <td className="py-2.5 px-3">Total Aggregate</td>
                  <td className="py-2.5 px-3 text-right">{formatVal(totalValue)}</td>
                  <td className="py-2.5 px-3 text-right">100.0%</td>
                  <td className="py-2.5 px-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
