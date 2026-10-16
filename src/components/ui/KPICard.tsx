import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KPICardProps {
  label: string;
  value: string | number;
  subValue?: string;
  change?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'highlight' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  subValue,
  change,
  subtitle,
  icon: Icon,
  variant = 'default',
  className,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-lg p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-colors',
        onClick && 'cursor-pointer hover:border-slate-300 dark:hover:border-neutral-700',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider truncate">
          {label}
        </span>
        {Icon && (
          <div className="p-1.5 rounded-md bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 shrink-0">
            <Icon className="h-4 w-4 text-slate-600 dark:text-neutral-400" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums leading-none">
            {value}
          </span>
          {subValue && (
            <span className="text-xs font-normal text-slate-500 dark:text-neutral-400">
              {subValue}
            </span>
          )}
        </div>

        {(change || subtitle) && (
          <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
            {change && (
              <span
                className={cn(
                  'inline-flex items-center font-medium px-1.5 py-0.5 rounded text-[11px]',
                  change.isPositive === true
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : change.isPositive === false
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400'
                )}
              >
                {change.value}
              </span>
            )}
            {(change?.label || subtitle) && (
              <span className="text-slate-500 dark:text-neutral-400 text-xs truncate">
                {change?.label || subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
