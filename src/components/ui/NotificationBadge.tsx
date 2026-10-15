import React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number | string;
  isAlert?: boolean;
}

/**
 * User-specified Notification Badge:
 * Red for alerts and emergency, black for simple notifications.
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  isAlert = false,
  className,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium text-white',
        isAlert ? 'bg-red-500' : 'bg-black',
        className
      )}
      {...props}
    >
      {count}
    </span>
  );
};

export interface NotificationIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count?: number;
  isAlert?: boolean;
}

/**
 * Exact icon-based notification button as specified:
 * size-11, rounded-lg, border border-gray-200, shadow-2xs, with top-right absolute badge
 */
export const NotificationIconButton = React.forwardRef<HTMLButtonElement, NotificationIconButtonProps>(
  ({ count = 0, isAlert = false, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'relative inline-flex justify-center items-center size-11 text-sm font-semibold rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-800 dark:text-white shadow-2xs hover:bg-gray-50 dark:hover:bg-neutral-700 focus:outline-hidden focus:bg-gray-50 dark:focus:bg-neutral-700 disabled:opacity-50 disabled:pointer-events-none transition-colors',
          className
        )}
        {...props}
      >
        {children || <Bell className="shrink-0 size-5" />}
        {count > 0 && (
          <span
            className={cn(
              'absolute top-0 inset-e-0 inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-1/2 text-white',
              isAlert ? 'bg-red-500' : 'bg-black'
            )}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    );
  }
);
NotificationIconButton.displayName = 'NotificationIconButton';

export interface NotificationTextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count?: number | string;
  isAlert?: boolean;
  label?: React.ReactNode;
}

/**
 * Exact component-based notification button as specified:
 * py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-white border border-gray-200
 */
export const NotificationTextButton = React.forwardRef<HTMLButtonElement, NotificationTextButtonProps>(
  ({ count, isAlert = false, label = 'Notifications', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-800 dark:text-white shadow-2xs hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50 focus:outline-hidden focus:bg-gray-50 dark:focus:bg-neutral-700 transition-colors',
          className
        )}
        {...props}
      >
        {children || label}
        {count !== undefined && (
          <span
            className={cn(
              'inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium text-white',
              isAlert ? 'bg-red-500' : 'bg-black'
            )}
          >
            {count}
          </span>
        )}
      </button>
    );
  }
);
NotificationTextButton.displayName = 'NotificationTextButton';
