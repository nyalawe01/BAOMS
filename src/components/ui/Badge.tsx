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
    default: 'text-charcoal-700 font-medium',
    success: 'text-emerald-700 font-semibold',
    warning: 'text-amber-700 font-semibold',
    danger: 'text-rose-700 font-semibold',
    info: 'text-blue-700 font-semibold',
  };

  const dotColors = {
    default: 'bg-charcoal-light',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    danger: 'bg-rose-600',
    info: 'bg-blue-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs select-none',
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
