import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ChipColor = 'default' | 'accent' | 'success' | 'warning' | 'danger';
export type ChipVariant = 'primary' | 'secondary' | 'tertiary' | 'soft';
export type ChipSize = 'sm' | 'md' | 'lg';

export interface ChipLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export const ChipLabel: React.FC<ChipLabelProps> = ({ className, children, ...props }) => {
  return (
    <span className={cn('chip__label font-medium tracking-tight truncate', className)} {...props}>
      {children}
    </span>
  );
};

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: ChipColor;
  variant?: ChipVariant;
  size?: ChipSize;
  children: ReactNode;
}

export const ChipRoot: React.FC<ChipProps> = ({
  color = 'default',
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const sizeStyles: Record<ChipSize, string> = {
    sm: 'h-5 px-2 text-[10px] gap-1 rounded-full',
    md: 'h-6 px-2.5 text-xs gap-1.5 rounded-full',
    lg: 'h-7.5 px-3 text-sm gap-2 rounded-full',
  };

  // Compound variant + color mappings per HeroUI specs
  const variantColorStyles: Record<ChipVariant, Record<ChipColor, string>> = {
    primary: {
      default: 'bg-slate-900 text-white border-transparent',
      accent: 'bg-[#D68904] text-white border-transparent',
      success: 'bg-emerald-600 text-white border-transparent',
      warning: 'bg-amber-600 text-white border-transparent',
      danger: 'bg-rose-600 text-white border-transparent',
    },
    secondary: {
      default:
        'bg-white text-slate-700 border border-slate-200/90 shadow-2xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300',
      accent:
        'bg-white text-amber-800 border border-amber-300 shadow-2xs dark:bg-slate-900 dark:border-amber-700 dark:text-amber-300',
      success:
        'bg-white text-emerald-800 border border-emerald-300 shadow-2xs dark:bg-slate-900 dark:border-emerald-700 dark:text-emerald-300',
      warning:
        'bg-white text-amber-800 border border-amber-300 shadow-2xs dark:bg-slate-900 dark:border-amber-700 dark:text-amber-300',
      danger:
        'bg-white text-rose-800 border border-rose-300 shadow-2xs dark:bg-slate-900 dark:border-rose-700 dark:text-rose-300',
    },
    soft: {
      default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-transparent',
      accent: 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border-transparent',
      success: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-transparent',
      warning: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-transparent',
      danger: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-transparent',
    },
    tertiary: {
      default: 'bg-transparent text-slate-700 dark:text-slate-300 border-transparent',
      accent: 'bg-transparent text-amber-700 dark:text-amber-400 border-transparent',
      success: 'bg-transparent text-emerald-700 dark:text-emerald-400 border-transparent',
      warning: 'bg-transparent text-amber-700 dark:text-amber-400 border-transparent',
      danger: 'bg-transparent text-rose-700 dark:text-rose-400 border-transparent',
    },
  };

  // If children is plain string or number, automatically wrap in Chip.Label
  const renderedChildren =
    typeof children === 'string' || typeof children === 'number' ? (
      <ChipLabel>{children}</ChipLabel>
    ) : (
      children
    );

  return (
    <span
      className={cn(
        'chip inline-flex items-center justify-center font-medium leading-none select-none shrink-0 transition-colors',
        sizeStyles[size],
        variantColorStyles[variant][color],
        className
      )}
      {...props}
    >
      {renderedChildren}
    </span>
  );
};

export const Chip = Object.assign(ChipRoot, {
  Label: ChipLabel,
});
