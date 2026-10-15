import React from 'react';
import { Check, X, Clock } from '@/lib/fontAwesomeIcons';
import { cn } from '@/lib/utils';

export type StatusCategory = 'granted' | 'rejected' | 'pending' | 'partial' | 'neutral';

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string;
  variant?: StatusCategory;
  label?: React.ReactNode;
  iconOnly?: boolean;
}

/**
 * Resolves a raw status string to its standard category:
 * - 'granted': accepted, approved, paid in full, active, completed, etc. (Green tick)
 * - 'rejected': rejected, declined, terminated, suspended, cancelled, overdue, etc. (Red X)
 * - 'pending': pending, submitted, under review, draft, scheduled, etc. (Orange clock)
 * - 'partial': partially paid, returned for correction, amendments requested (Orange clock/indicator)
 */
export function resolveStatusCategory(status?: string): StatusCategory {
  if (!status) return 'neutral';
  const s = status.toLowerCase().trim();

  // Granted / Accepted / Paid in Full / Approved / Active / Completed / Dispatched
  if (
    s === 'approved' ||
    s === 'granted' ||
    s === 'accepted' ||
    s === 'paid' ||
    s === 'paid in full' ||
    s === 'paid_in_full' ||
    s === 'completed' ||
    s === 'active' ||
    s === 'dispatched' ||
    s === 'received' ||
    s === 'cleared' ||
    s === 'confirmed' ||
    s === 'adopted' ||
    s === 'success' ||
    s === 'passed'
  ) {
    return 'granted';
  }

  // Rejected / Declined / Terminated / Suspended / Cancelled / Overdue / Expired / Archived
  if (
    s === 'rejected' ||
    s === 'declined' ||
    s === 'terminated' ||
    s === 'suspended' ||
    s === 'cancelled' ||
    s === 'overdue' ||
    s === 'expired' ||
    s === 'critical' ||
    s === 'danger' ||
    s === 'failed' ||
    s === 'deactivated' ||
    s === 'archived' ||
    s === 'superseded' ||
    s === 'restricted'
  ) {
    return 'rejected';
  }

  // Partial / Partially Paid / Returned for Correction / Amendments Requested
  if (
    s === 'partially_paid' ||
    s === 'partially paid' ||
    s === 'partial' ||
    s === 'returned' ||
    s === 'amendments_requested' ||
    s === 'warning' ||
    s === 'expiring_soon'
  ) {
    return 'partial';
  }

  // Pending / Submitted / Under Review / In Progress / Draft / Scheduled / Probation
  if (
    s === 'pending' ||
    s === 'pending_review' ||
    s === 'pending_hr' ||
    s === 'pending_finance' ||
    s === 'submitted' ||
    s === 'under_review' ||
    s === 'in_progress' ||
    s === 'in progress' ||
    s === 'draft' ||
    s === 'scheduled' ||
    s === 'probation' ||
    s === 'on_leave' ||
    s === 'invited' ||
    s === 'planning' ||
    s === 'on_hold'
  ) {
    return 'pending';
  }

  return 'neutral';
}

/**
 * Institutional Status Indicator
 * Renders status with an icon and borderless text reflecting the status condition color.
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  variant,
  label,
  iconOnly = false,
  className,
  ...props
}) => {
  const category = variant || resolveStatusCategory(status);

  const categoryTextColor = {
    granted: 'text-emerald-700',
    rejected: 'text-red-700',
    pending: 'text-amber-700',
    partial: 'text-amber-700',
    neutral: 'text-charcoal-700',
  };

  const renderIcon = () => {
    switch (category) {
      case 'granted':
        // Green tick for granted / accepted / paid in full
        return <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />;
      case 'rejected':
        // Red X for rejected
        return <X className="w-3.5 h-3.5 text-red-600 shrink-0" aria-hidden="true" />;
      case 'pending':
        // Amber clock icon for pending
        return <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />;
      case 'partial':
        // Amber clock icon for partial
        return <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-semibold select-none text-left justify-start',
        categoryTextColor[category],
        className
      )}
      {...props}
    >
      <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
        {renderIcon()}
      </span>
      {!iconOnly && (
        <span className={cn('truncate text-left font-semibold', categoryTextColor[category])}>
          {label !== undefined ? label : status}
        </span>
      )}
    </span>
  );
};
