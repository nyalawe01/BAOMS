import React from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}) => {
  const configs = {
    info: {
      container: 'bg-status-info-bg text-status-info-text border-status-info-border',
      icon: Info,
      iconColor: 'text-slate-700',
    },
    success: {
      container: 'bg-status-success-bg text-status-success-text border-status-success-border',
      icon: CheckCircle2,
      iconColor: 'text-forest-700',
    },
    warning: {
      container: 'bg-status-warning-bg text-status-warning-text border-status-warning-border',
      icon: AlertTriangle,
      iconColor: 'text-amber-700',
    },
    error: {
      container: 'bg-status-danger-bg text-status-danger-text border-status-danger-border',
      icon: AlertOctagon,
      iconColor: 'text-red-700',
    },
  };

  const current = configs[variant];
  const Icon = current.icon;

  return (
    <div
      role="alert"
      className={cn(
        'relative flex items-start gap-3 rounded-lg border p-4 text-xs sm:text-sm',
        current.container,
        className
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', current.iconColor)} aria-hidden="true" />
      <div className="flex-1 space-y-0.5">
        {title && <h5 className="font-semibold tracking-tight">{title}</h5>}
        <div className="leading-relaxed opacity-95">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-current opacity-60 hover:opacity-100 p-0.5 rounded transition-opacity"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
