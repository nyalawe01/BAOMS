import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterControlsProps {
  options: FilterOption[];
  activeFilter: string;
  onSelectFilter: (id: string) => void;
  onReset?: () => void;
  className?: string;
  showReset?: boolean;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  options,
  activeFilter,
  onSelectFilter,
  onReset,
  className,
  showReset = false,
}) => {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="flex items-center gap-1.5 text-xs text-charcoal-muted mr-1">
        <Filter className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="font-semibold uppercase tracking-wider text-[11px]">Filters:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((opt) => {
          const isSelected = activeFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectFilter(opt.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors border select-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D68904]',
                isSelected
                  ? 'bg-[#D68904] text-white border-[#D68904] font-semibold'
                  : 'bg-white text-charcoal border-surface-border hover:bg-surface-hover hover:border-charcoal-light'
              )}
            >
              <span>{opt.label}</span>
              {typeof opt.count === 'number' && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-mono',
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-muted text-charcoal-muted'
                  )}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showReset && onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs text-charcoal-muted hover:text-charcoal gap-1 ml-auto"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </Button>
      )}
    </div>
  );
};
