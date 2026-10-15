import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'flex h-[38px] w-full rounded-md border bg-white px-3 py-2 text-sm text-charcoal leading-[1.5] transition-colors',
            'border-surface-border placeholder:text-charcoal-light shadow-xs',
            'focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus:border-surface-border',
            'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-charcoal-light',
            error && 'border-status-danger-border focus-visible:ring-red-600',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-status-danger-text font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-charcoal-light">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
