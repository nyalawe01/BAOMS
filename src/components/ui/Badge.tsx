import React from 'react';
import { cn } from '@/lib/utils';
import { StatusVariant } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  withDot = false,
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white text-charcoal-700 border-0',
    success: 'bg-white text-emerald-700 font-semibold border-0',
    warning: 'bg-white text-amber-700 font-semibold border-0',
    danger: 'bg-white text-rose-700 font-semibold border-0',
    info: 'bg-white text-slate-700 border-0',
  };

  const dotColors = {
    default: 'bg-charcoal-light',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    danger: 'bg-rose-600',
    info: 'bg-slate-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium leading-none select-none',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {withDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
