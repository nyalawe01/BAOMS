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

export const SkeletonHeader: React.FC = () => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/80">
    <div className="space-y-1.5">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-3.5 w-72" />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-28" />
    </div>
  </div>
);

export const SkeletonDashboard: React.FC<{ kpiCount?: number }> = ({ kpiCount = 6 }) => (
  <div className="space-y-6">
    <SkeletonHeader />

    {/* KPI Cards Row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: kpiCount }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton variant="rounded" className="h-8 w-8" />
          </div>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>

    {/* Content Rows */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 rounded-xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-xs">
        <Skeleton className="h-5 w-1/3" />
        <SkeletonText lines={4} />
      </div>
      <div className="lg:col-span-7 rounded-xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-xs">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>

    {/* Table Skeleton */}
    <SkeletonTable rows={4} columns={5} />
  </div>
);

export const SkeletonPage: React.FC = () => (
  <div className="space-y-6">
    <SkeletonHeader />
    <div className="flex gap-2 border-b border-slate-200 pb-2">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-24" />
    </div>
    <SkeletonTable rows={6} columns={4} />
  </div>
);

