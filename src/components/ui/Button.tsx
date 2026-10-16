import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isIconOnly?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isIconOnly = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D68904] focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none';

    const variantStyles = {
      primary:
        'bg-[#D68904] text-white border border-[#b86e03] hover:bg-[#b86e03] active:bg-[#915206] shadow-xs font-medium',
      secondary:
        'bg-white text-charcoal border border-surface-border hover:bg-slate-50 hover:text-charcoal-900 active:bg-slate-100 shadow-xs font-medium',
      outline:
        'bg-white text-charcoal border border-surface-border hover:bg-surface-hover hover:border-slate-300 active:bg-slate-50 shadow-xs font-medium',
      ghost:
        'bg-transparent text-charcoal-muted hover:bg-slate-100 hover:text-charcoal-900 active:bg-slate-200 font-medium',
      danger:
        'bg-red-600 text-white border border-red-700 hover:bg-red-700 active:bg-red-800 shadow-xs font-medium',
    };

    const sizeStyles = isIconOnly
      ? {
          sm: 'h-7 w-7 p-0 rounded',
          md: 'h-9 w-9 p-0 rounded-md',
          lg: 'h-10 w-10 p-0 rounded-md',
        }
      : {
          sm: 'h-7 text-xs px-2.5 py-1 gap-1.5 rounded font-medium',
          md: 'h-9 text-xs sm:text-sm px-3.5 py-1.5 gap-2 rounded-md font-medium',
          lg: 'h-10 text-sm sm:text-base px-4.5 py-2 gap-2 rounded-md font-medium',
        };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
