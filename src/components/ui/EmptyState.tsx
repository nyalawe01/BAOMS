import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from './Button';

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps['variant'];
    icon?: React.ComponentType<{ className?: string }>;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}) => {
  const ActionIcon = action?.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-surface-border bg-white/60 p-8 sm:p-12 text-center',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-charcoal-light border border-surface-border">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-charcoal tracking-tight">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-xs text-charcoal-muted leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-5">
          <Button
            variant={action.variant || 'primary'}
            size="sm"
            onClick={action.onClick}
          >
            {ActionIcon && <ActionIcon className="h-3.5 w-3.5 mr-1.5" />}
            <span>{action.label}</span>
          </Button>
        </div>
      )}
    </div>
  );
};
