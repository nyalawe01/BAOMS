import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  ...props
}) => {
  const variantStyles = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-md',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-surface-muted/90 border border-surface-border/40',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => (
  <div className={cn('space-y-2.5', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('rounded-lg border border-surface-border bg-white p-6 space-y-4 shadow-card', className)} {...props}>
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
);

export const SkeletonKPI: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('rounded-xl border border-surface-border bg-white p-6 shadow-xs space-y-3', className)} {...props}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton variant="rounded" className="h-8 w-8" />
    </div>
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

export interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className,
  ...props
}) => (
  <div className={cn('w-full border border-surface-border rounded-xl bg-white overflow-hidden shadow-xs', className)} {...props}>
    <div className="flex items-center gap-4 px-5 py-3.5 bg-slate-50 border-b border-surface-border">
      {Array.from({ length: columns }).map((_, col) => (
        <Skeleton key={col} className="h-3.5 flex-1" />
      ))}
    </div>
    <div className="divide-y divide-surface-border">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-4 px-5 py-4">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={col} className={cn('h-3.5 flex-1', col === 0 ? 'max-w-[120px]' : '')} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

