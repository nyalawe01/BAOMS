import React from 'react';
import { cn } from '@/lib/utils';
import { StatusVariant } from '@/types';
import { Chip, ChipColor, ChipVariant, ChipSize } from './Chip';

export { Chip };

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  withDot?: boolean;
  size?: ChipSize;
  badgeStyle?: ChipVariant;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  withDot = false,
  size = 'sm',
  badgeStyle = 'soft',
  children,
  ...props
}) => {
  const colorMap: Record<StatusVariant, ChipColor> = {
    default: 'default',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'accent',
  };

  const dotColors: Record<StatusVariant, string> = {
    default: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-[#D68904]',
  };

  return (
    <Chip
      color={colorMap[variant] || 'default'}
      variant={badgeStyle}
      size={size}
      className={cn('shadow-none', className)}
      {...props}
    >
      {withDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0 -ml-0.5 mr-1', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </Chip>
  );
};
