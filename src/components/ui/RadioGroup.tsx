import React from 'react';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: RadioOption[];
  label?: string;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  label,
  orientation = 'vertical',
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)} role="radiogroup" aria-label={label}>
      {label && (
        <span className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
          {label}
        </span>
      )}
      <div
        className={cn(
          'gap-3',
          orientation === 'horizontal' ? 'flex flex-wrap items-center' : 'flex flex-col'
        )}
      >
        {options.map((opt) => {
          const radioId = `${name}-${opt.value}`;
          const isChecked = value === opt.value;

          return (
            <label
              key={opt.value}
              htmlFor={radioId}
              className={cn(
                'flex items-start gap-2.5 cursor-pointer select-none',
                opt.disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <div className="relative flex items-center pt-0.5">
                <input
                  id={radioId}
                  name={name}
                  type="radio"
                  value={opt.value}
                  checked={isChecked}
                  disabled={opt.disabled}
                  onChange={() => onChange?.(opt.value)}
                  className={cn(
                    'peer h-4 w-4 appearance-none rounded-full border border-surface-border bg-white transition-colors',
                    'checked:border-[#D68904]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D68904] focus-visible:ring-offset-2'
                  )}
                />
                <span
                  className={cn(
                    'pointer-events-none absolute left-1 top-1.5 h-2 w-2 rounded-full bg-[#D68904] opacity-0 transition-opacity',
                    isChecked && 'opacity-100'
                  )}
                  aria-hidden="true"
                />
              </div>
              <div className="text-sm">
                <span className="font-medium text-charcoal">{opt.label}</span>
                {opt.description && (
                  <p className="text-xs text-charcoal-muted mt-0.5">{opt.description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
