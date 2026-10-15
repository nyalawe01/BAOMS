import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            'flex w-full rounded-md border bg-white px-3 py-2 text-sm text-charcoal transition-colors',
            'border-surface-border placeholder:text-charcoal-light',
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

Textarea.displayName = 'Textarea';
