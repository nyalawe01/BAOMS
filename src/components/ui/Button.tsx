import React from 'react';
import { cn } from '@/lib/utils';
import { ButtonGroup, ButtonGroupSeparator, useButtonGroup, ButtonVariant, ButtonSize } from './ButtonGroup';

export type { ButtonVariant, ButtonSize };

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isIconOnly?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant: explicitVariant,
      size: explicitSize,
      isLoading = false,
      isIconOnly = false,
      isDisabled: explicitIsDisabled,
      disabled,
      fullWidth: explicitFullWidth,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const group = useButtonGroup();

    const variant = explicitVariant ?? group.variant ?? 'primary';
    const size = explicitSize ?? group.size ?? 'md';
    const isActuallyDisabled = disabled || explicitIsDisabled || (group.isDisabled && explicitIsDisabled !== false) || isLoading;
    const isFullWidth = explicitFullWidth ?? group.fullWidth ?? false;

    const baseStyles = [
      'inline-flex items-center justify-center font-medium select-none',
      'transition-all duration-150 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D68904] focus-visible:ring-offset-1',
      'disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none',
      'cursor-pointer active:scale-[0.98]',
      group.isInGroup && 'active:scale-100', // HeroUI removes scale transform inside button groups
      isFullWidth && 'w-full',
    ].filter(Boolean).join(' ');

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-[#D68904] text-white border border-[#b86e03] hover:bg-[#b86e03] active:bg-[#915206] shadow-xs hover:shadow font-medium',
      secondary:
        'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 shadow-xs font-medium dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800',
      tertiary:
        'bg-slate-100 text-slate-800 border border-transparent hover:bg-slate-200/80 active:bg-slate-300 font-medium dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
      outline:
        'bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 font-medium dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800',
      ghost:
        'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 font-medium border border-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
      danger:
        'bg-red-600 text-white border border-red-700 hover:bg-red-700 active:bg-red-800 shadow-xs hover:shadow font-medium',
    };

    const sizeStyles = isIconOnly
      ? {
          sm: 'h-7.5 w-7.5 p-0 rounded-lg text-xs',
          md: 'h-9 w-9 p-0 rounded-xl text-sm',
          lg: 'h-10.5 w-10.5 p-0 rounded-xl text-base',
        }
      : {
          sm: 'h-7.5 text-xs px-2.5 py-1 gap-1.5 rounded-lg font-medium',
          md: 'h-9 text-xs sm:text-sm px-3.5 py-1.5 gap-2 rounded-xl font-medium',
          lg: 'h-10.5 text-sm sm:text-base px-4.5 py-2 gap-2 rounded-xl font-medium',
        };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isActuallyDisabled}
        aria-disabled={isActuallyDisabled}
        data-disabled={isActuallyDisabled ? 'true' : undefined}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-3.5 w-3.5 text-current shrink-0 mr-1.5"
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
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { ButtonGroup, ButtonGroupSeparator };
