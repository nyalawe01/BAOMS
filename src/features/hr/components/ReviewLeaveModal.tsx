import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LeaveRequestRecord, StaffProfileRecord } from '../types/hr';
import { reviewLeaveRequest } from '../services/hrService';
import { useAuth } from '@/features/auth/useAuth';
import { confirmAction, showSuccess } from '@/lib/sweetAlert';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  ShieldAlert,
} from 'lucide-react';

interface ReviewLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: LeaveRequestRecord | null;
  staffList: StaffProfileRecord[];
  onReviewCompleted: (updatedRequest: LeaveRequestRecord) => void;
}

export const ReviewLeaveModal: React.FC<ReviewLeaveModalProps> = ({
  isOpen,
  onClose,
  request,
  staffList,
  onReviewCompleted,
}) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [decisionNotes, setDecisionNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !request) return null;

  // Check if current logged-in user is the applicant
  const applicant = staffList.find((s) => s.id === request.staffId);
  const isSelf =
    (applicant && applicant.userId === user?.id) ||
    staffList.find((s) => s.userId === user?.id)?.id === request.staffId;

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    setError(null);

    if (isSelf) {
      setError(
        t(
          'hr.errors.selfApprovalBlocked',
          'Staff members are strictly prohibited from approving their own leave requests.'
        )
      );
      return;
    }

    if (decision === 'rejected' && (!decisionNotes || !decisionNotes.trim())) {
      setError(t('hr.errors.rejectionReasonRequired', 'Please provide a reason when rejecting a leave request.'));
      return;
    }

    const actionLabel = decision === 'approved' ? t('hr.approveLeave', 'Approve Leave') : t('hr.rejectLeave', 'Reject Leave');
    const confirmed = await confirmAction({
      title: actionLabel,
      text: decision === 'approved'
        ? t('hr.confirmApproveLeaveDesc', 'Are you sure you want to approve this leave application?')
        : t('hr.confirmRejectLeaveDesc', 'Are you sure you want to reject this leave application?'),
      confirmButtonText: actionLabel,
      isDangerous: decision === 'rejected',
      icon: decision === 'rejected' ? 'warning' : 'question',
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const updated = await reviewLeaveRequest(
        {
          requestId: request.id,
          decision,
          decisionNotes: decisionNotes.trim() || undefined,
        },
        {
          id: user?.id || 'sys-admin',
          displayName: profile?.display_name || 'Authorized Supervisor',
        }
      );
      onReviewCompleted(updated);
      await showSuccess(
        decision === 'approved'
          ? t('hr.leaveApprovedSuccess', 'Leave request approved successfully.')
          : t('hr.leaveRejectedSuccess', 'Leave request rejected.')
      );
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to record leave decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-surface-card rounded-xl border border-surface-border shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/30">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-forest-700" />
            <div>
              <h2 className="text-lg font-bold text-charcoal-900">
                {t('hr.reviewLeaveTitle', 'Review Leave Application')}
              </h2>
              <span className="text-xs text-charcoal-muted">{request.requestNumber}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-charcoal-muted hover:text-charcoal-800 hover:bg-surface-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Self-Approval Warning Alert */}
          {isSelf && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-rose-800 uppercase tracking-wide block">
                  {t('hr.selfApprovalTitle', 'Self-Approval Strictly Prohibited')}
                </span>
                <p className="text-rose-700 leading-relaxed">
                  {t(
                    'hr.selfApprovalNotice',
                    'Per BAOMS organizational policy and Row-Level Security rules, staff and supervisors cannot approve their own leave applications. Another supervisor or HR Administrator must review and approve this request.'
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Request Summary Card */}
          <div className="rounded-lg border border-surface-border bg-surface-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-forest-700" />
                <span className="font-bold text-charcoal-900 text-sm">{request.staffName}</span>
                <span className="text-xs text-charcoal-muted">({request.staffNumber})</span>
              </div>
              <Badge variant="warning" withDot>
                {request.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-surface-border">
              <div>
                <span className="text-charcoal-muted block">{t('hr.leaveType', 'Leave Category')}</span>
                <span className="font-semibold text-charcoal-900">{request.leaveTypeName}</span>
              </div>
              <div>
                <span className="text-charcoal-muted block">{t('hr.duration', 'Duration')}</span>
                <span className="font-semibold text-forest-800">
                  {request.daysRequested} {t('hr.calendarDays', 'calendar day(s)')}
                </span>
              </div>
              <div>
                <span className="text-charcoal-muted block">{t('hr.startDate', 'Start Date')}</span>
                <span className="font-medium text-charcoal-800">{request.startDate}</span>
              </div>
              <div>
                <span className="text-charcoal-muted block">{t('hr.endDate', 'End Date')}</span>
                <span className="font-medium text-charcoal-800">{request.endDate}</span>
              </div>
            </div>

            {request.handoverStaffName && (
              <div className="text-xs pt-2 border-t border-surface-border">
                <span className="text-charcoal-muted">{t('hr.handoverColleague', 'Handover Colleague')}: </span>
                <span className="font-medium text-charcoal-900">{request.handoverStaffName}</span>
              </div>
            )}

            <div className="pt-2 border-t border-surface-border text-xs">
              <span className="text-charcoal-muted block mb-1">{t('hr.reason', 'Application Details')}:</span>
              <p className="text-charcoal-800 bg-surface-card p-2.5 rounded border border-surface-border leading-relaxed">
                {request.reason}
              </p>
            </div>
          </div>

          {/* Decision Notes */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              {t('hr.decisionNotes', 'Decision Notes / Remarks')}
            </label>
            <textarea
              rows={2}
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="Required when rejecting; optional notes for approval..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border bg-surface-muted/20">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={isSubmitting || isSelf}
              onClick={() => handleDecision('rejected')}
              className="text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              <XCircle className="h-4 w-4 mr-1 text-rose-600" />
              {t('hr.rejectLeave', 'Reject Request')}
            </Button>
            <Button
              variant="primary"
              disabled={isSubmitting || isSelf}
              isLoading={isSubmitting}
              onClick={() => handleDecision('approved')}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {t('hr.approveLeave', 'Approve Leave')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
