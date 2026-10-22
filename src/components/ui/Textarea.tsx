import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 5, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            'flex min-h-[140px] w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 transition-colors leading-relaxed',
            'border-slate-300 placeholder:text-slate-400 shadow-none',
            'focus:outline-none focus:border-[#D68904] focus:ring-2 focus:ring-[#D68904]/20',
            'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
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
