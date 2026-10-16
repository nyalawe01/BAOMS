import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, checked, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex items-start gap-2.5">
        <div className="relative flex items-center pt-0.5">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            checked={checked}
            className={cn(
              'peer h-4 w-4 shrink-0 appearance-none rounded border border-slate-300 bg-white transition-colors',
              'checked:bg-white checked:border-charcoal-700 hover:border-slate-400',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-charcoal-400 focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />
          <Check
            className="pointer-events-none absolute left-0 top-0.5 h-4 w-4 text-charcoal-900 opacity-0 peer-checked:opacity-100 transition-opacity p-0.5 stroke-[2.5]"
            aria-hidden="true"
          />
        </div>
        {(label || description) && (
          <div className="text-sm select-none">
            {label && (
              <label
                htmlFor={checkboxId}
                className="font-medium text-charcoal cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-charcoal-muted mt-0.5">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
