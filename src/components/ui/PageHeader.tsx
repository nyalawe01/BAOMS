import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  badge,
  className,
}) => {
  return (
    <div className={cn('space-y-3 pb-6 border-b border-surface-border', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-semibold tracking-tight text-charcoal leading-[1.3]">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap shrink-0 items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
