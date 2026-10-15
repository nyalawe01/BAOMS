/**
 * Review Financial Request Modal
 * Babawatoto Organization Management System (BAOMS)
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { FinancialRequestRecord, ReviewDecisionPayload } from '../types/finance';
import { useAuth } from '@/features/auth/useAuth';

interface ReviewFinancialRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: FinancialRequestRecord | null;
  onSubmitDecision: (decision: ReviewDecisionPayload) => Promise<void>;
}

export const ReviewFinancialRequestModal: React.FC<ReviewFinancialRequestModalProps> = ({
  isOpen,
  onClose,
  request,
  onSubmitDecision,
}) => {
  const { t } = useTranslation();
  const { user, hasRole, isAdmin } = useAuth();

  const [action, setAction] = useState<'reviewed' | 'approved' | 'returned' | 'rejected'>('approved');
  const [approvedAmount, setApprovedAmount] = useState<string>('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize approved amount when request is opened
  React.useEffect(() => {
    if (request) {
      setApprovedAmount(String(request.approvedAmount ?? request.totalAmount));
      // Default to 'reviewed' if user is finance officer and request is just submitted
      if (request.status === 'submitted' && hasRole('finance_officer') && !hasRole('executive_director')) {
        setAction('reviewed');
      } else {
        setAction('approved');
      }
      setComments('');
      setError(null);
    }
  }, [request, hasRole]);

  if (!request) return null;

  const isSelf = user?.id === request.requesterId;
  const isFinanceOfficer = hasRole('finance_officer') || isAdmin();
  const isDirector = hasRole('executive_director') || isAdmin();

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSelf) {
      setError(t('finance.errors.selfApprovalForbidden', 'Internal controls prohibit approving or reviewing your own financial requests.'));
      return;
    }

    if ((action === 'returned' || action === 'rejected') && !comments.trim()) {
      setError(t('finance.errors.commentsMandatory', 'Comments explaining the decision are mandatory when returning or rejecting a request.'));
      return;
    }

    const parsedApprovedAmount = parseFloat(approvedAmount);
    if (action === 'approved' && (isNaN(parsedApprovedAmount) || parsedApprovedAmount <= 0)) {
      setError(t('finance.errors.invalidApprovedAmount', 'Approved amount must be greater than zero.'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitDecision({
        action,
        comments: comments.trim(),
        approvedAmount: action === 'approved' ? parsedApprovedAmount : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record approval decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('finance.reviewRequest', 'Financial Request Review')} — ${request.requestNumber}`}
      size="lg"
    >
      <form onSubmit={handleDecisionSubmit} className="space-y-6">
        {/* Segregation of duties warning if requester is viewing modal */}
        {isSelf && (
          <div className="flex items-start gap-3 rounded-md bg-amber-50 border border-amber-300 p-4 text-sm text-amber-900">
            <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                {t('finance.segregationWarningTitle', 'Self-Approval Strictly Prohibited')}
              </p>
              <p className="text-xs text-amber-800 mt-1">
                {t(
                  'finance.segregationWarningDesc',
                  'You are recorded as the original requester of this financial requisition. To ensure organizational integrity and audit compliance, another authorized officer must review and approve this request.'
                )}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-md bg-crimson-50 border border-crimson-200 p-3 text-sm text-crimson-900">
            <AlertTriangle className="h-5 w-5 text-crimson-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Request Overview Summary */}
        <div className="rounded-lg border border-surface-border bg-surface-muted/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
              {request.requestType.replace('_', ' ').toUpperCase()}
            </span>
            <Badge
              variant={
                request.status === 'approved'
                  ? 'success'
                  : request.status === 'under_review'
                  ? 'info'
                  : request.status === 'returned'
                  ? 'warning'
                  : 'default'
              }
            >
              {request.status.toUpperCase()}
            </Badge>
          </div>

          <h3 className="text-sm font-bold text-charcoal">{request.title}</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">{request.purpose}</p>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-surface-border text-xs">
            <div>
              <span className="text-charcoal-muted">{t('finance.requester', 'Requester')}: </span>
              <span className="font-semibold text-charcoal">{request.requesterName}</span>
            </div>
            <div className="text-right">
              <span className="text-charcoal-muted">{t('finance.requestedAmount', 'Requested Amount')}: </span>
              <span className="font-bold text-forest-800">
                {request.totalAmount.toLocaleString()} {request.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Decision Selector */}
        {!isSelf && (
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
              {t('finance.reviewDecision', 'Review Decision')} *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* If submitted and finance officer, show verify/advance */}
              {request.status === 'submitted' && isFinanceOfficer && (
                <button
                  type="button"
                  onClick={() => setAction('reviewed')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all ${
                    action === 'reviewed'
                      ? 'border-[#F2A507] bg-amber-50 text-charcoal-900 shadow-sm'
                      : 'border-surface-border bg-white text-charcoal-muted hover:border-amber-200'
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5 mb-1.5 text-[#F2A507]" />
                  <span>{t('finance.actions.verify', 'Verify & Forward')}</span>
                </button>
              )}

              {/* Authorize/Approve (Director or Admin) */}
              {(isDirector || (!isFinanceOfficer && !isDirector)) && (
                <button
                  type="button"
                  onClick={() => setAction('approved')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all ${
                    action === 'approved'
                      ? 'border-forest-600 bg-forest-50 text-forest-900 shadow-sm'
                      : 'border-surface-border bg-white text-charcoal-muted hover:border-forest-200'
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5 mb-1.5 text-forest-700" />
                  <span>{t('finance.actions.approve', 'Authorize & Approve')}</span>
                </button>
              )}

              {/* Return for Correction */}
              <button
                type="button"
                onClick={() => setAction('returned')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all ${
                  action === 'returned'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                    : 'border-surface-border bg-white text-charcoal-muted hover:border-amber-200'
                }`}
              >
                <RotateCcw className="h-5 w-5 mb-1.5 text-amber-600" />
                <span>{t('finance.actions.return', 'Return for Correction')}</span>
              </button>

              {/* Reject */}
              <button
                type="button"
                onClick={() => setAction('rejected')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all ${
                  action === 'rejected'
                    ? 'border-crimson-500 bg-crimson-50 text-crimson-900 shadow-sm'
                    : 'border-surface-border bg-white text-charcoal-muted hover:border-crimson-200'
                }`}
              >
                <XCircle className="h-5 w-5 mb-1.5 text-crimson-600" />
                <span>{t('finance.actions.reject', 'Reject Requisition')}</span>
              </button>
            </div>

            {/* Approved Amount Input when approving */}
            {action === 'approved' && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
                  {t('finance.authorizedAmount', 'Authorized Amount (TZS)')} *
                </label>
                <Input
                  type="number"
                  step="any"
                  min="1"
                  max={request.totalAmount}
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  required
                />
                <span className="text-2xs text-charcoal-muted mt-1 block">
                  {t('finance.authorizedAmountHint', 'You may adjust the authorized commitment downwards if line items are trimmed.')}
                </span>
              </div>
            )}

            {/* Comments Field */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
                {t('finance.decisionNotes', 'Decision Comments & Notes')}
                {(action === 'returned' || action === 'rejected') && ' *'}
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  action === 'returned'
                    ? 'State required adjustments, missing quotations, or clarifications...'
                    : action === 'rejected'
                    ? 'State reason for formal requisition rejection...'
                    : 'Optional approval notes or disbursement conditions...'
                }
                rows={3}
                required={action === 'returned' || action === 'rejected'}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          {!isSelf && (
            <Button
              type="submit"
              variant={
                action === 'approved'
                  ? 'primary'
                  : action === 'rejected'
                  ? 'danger'
                  : 'secondary'
              }
              isLoading={isSubmitting}
            >
              {action === 'approved'
                ? t('finance.confirmApproval', 'Confirm Authorization')
                : action === 'reviewed'
                ? t('finance.confirmReview', 'Confirm Verification')
                : action === 'returned'
                ? t('finance.confirmReturn', 'Return to Requester')
                : t('finance.confirmReject', 'Confirm Rejection')}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
