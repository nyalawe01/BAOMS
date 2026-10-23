import React from 'react';
import { cn } from '@/lib/utils';
import { DatePicker } from './DatePicker';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    if (props.type === 'date') {
      const val =
        typeof props.value === 'string'
          ? props.value
          : typeof props.defaultValue === 'string'
          ? props.defaultValue
          : '';

      return (
        <DatePicker
          id={inputId}
          label={label}
          value={val}
          minDate={typeof props.min === 'string' ? props.min : undefined}
          maxDate={typeof props.max === 'string' ? props.max : undefined}
          placeholder={props.placeholder || 'YYYY-MM-DD'}
          required={props.required}
          disabled={props.disabled}
          error={error}
          helperText={helperText}
          className={className}
          name={props.name}
          onChange={(newDate) => {
            if (props.onChange) {
              const syntheticEvent = {
                target: { value: newDate, name: props.name || inputId || '' },
                currentTarget: { value: newDate, name: props.name || inputId || '' },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              props.onChange(syntheticEvent);
            }
          }}
        />
      );
    }

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'flex min-h-[44px] w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors',
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

Input.displayName = 'Input';
