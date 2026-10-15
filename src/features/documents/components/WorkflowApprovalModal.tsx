/**
 * Workflow Review & Approval Modal
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Enforces explicit sign-off workflow decisions (Approve, Amendments, Reject)
 * with mandatory reviewer notes and audit logging.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertTriangle, XCircle, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { DocumentRecord, ApprovalDecision, ApprovalDecisionPayload } from '../types/document';

interface WorkflowApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentRecord | null;
  onSubmit: (payload: ApprovalDecisionPayload) => Promise<void>;
}

export const WorkflowApprovalModal: React.FC<WorkflowApprovalModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const [decision, setDecision] = useState<ApprovalDecision>('approved');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!doc) return null;

  const resetForm = () => {
    setDecision('approved');
    setComments('');
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((decision === 'amendments_requested' || decision === 'rejected') && !comments.trim()) {
      setSubmitError(
        t(
          'documents.commentsRequiredOnReject',
          'Review comments explaining the decision are mandatory when requesting amendments or rejecting.'
        )
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload: ApprovalDecisionPayload = {
        document_id: doc.id,
        version_id: doc.current_version_id || undefined,
        status: decision,
        comments: comments.trim() || 'Approved as organizational record.',
      };

      await onSubmit(payload);
      resetForm();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Review submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      size="md"
      title={
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-forest-700" />
          <span>{t('documents.reviewModalTitle', 'Document Review & Approval Sign-off')}</span>
        </div>
      }
      description={
        <div className="space-y-1">
          <p className="font-mono text-xs text-forest-700">{doc.reference_number}</p>
          <p className="text-xs text-charcoal-muted line-clamp-1">{doc.title}</p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Decision Selector Cards */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
            {t('documents.selectDecision', 'Review Decision *')}
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Approve */}
            <div
              onClick={() => setDecision('approved')}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                decision === 'approved'
                  ? 'border-forest-600 bg-forest-50/60 ring-1 ring-forest-600'
                  : 'border-surface-border bg-white hover:bg-surface-muted/40'
              }`}
            >
              <CheckCircle2
                className={`h-5 w-5 mt-0.5 shrink-0 ${
                  decision === 'approved' ? 'text-forest-700' : 'text-charcoal-light'
                }`}
              />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-charcoal block">
                  {t('documents.decisionApprove', 'Approve Document')}
                </span>
                <span className="text-[11px] text-charcoal-muted leading-relaxed">
                  {t(
                    'documents.approveDesc',
                    'Certifies this document as an approved organization record available to authorized staff.'
                  )}
                </span>
              </div>
            </div>

            {/* Request Amendments */}
            <div
              onClick={() => setDecision('amendments_requested')}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                decision === 'amendments_requested'
                  ? 'border-amber-600 bg-amber-50/60 ring-1 ring-amber-600'
                  : 'border-surface-border bg-white hover:bg-surface-muted/40'
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 mt-0.5 shrink-0 ${
                  decision === 'amendments_requested' ? 'text-amber-600' : 'text-charcoal-light'
                }`}
              />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-charcoal block">
                  {t('documents.decisionAmend', 'Request Amendments')}
                </span>
                <span className="text-[11px] text-charcoal-muted leading-relaxed">
                  {t(
                    'documents.amendDesc',
                    'Returns document to author with notes. New revised version required prior to final approval.'
                  )}
                </span>
              </div>
            </div>

            {/* Reject */}
            <div
              onClick={() => setDecision('rejected')}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                decision === 'rejected'
                  ? 'border-red-600 bg-red-50/60 ring-1 ring-red-600'
                  : 'border-surface-border bg-white hover:bg-surface-muted/40'
              }`}
            >
              <XCircle
                className={`h-5 w-5 mt-0.5 shrink-0 ${
                  decision === 'rejected' ? 'text-red-600' : 'text-charcoal-light'
                }`}
              />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-charcoal block">
                  {t('documents.decisionReject', 'Reject Document')}
                </span>
                <span className="text-[11px] text-charcoal-muted leading-relaxed">
                  {t(
                    'documents.rejectDesc',
                    'Declines this document. Retains submission and review decision in permanent audit log.'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Review Comments */}
        <Textarea
          label={
            decision === 'approved'
              ? t('documents.approvalNotesOptional', 'Approval Notes / Conditions (Optional)')
              : t('documents.reviewCommentsRequired', 'Required Review Comments & Feedback *')
          }
          placeholder={
            decision === 'approved'
              ? 'e.g. Endorsed by Executive Director per Board resolution #3...'
              : 'e.g. Please update budget table 4 to reflect revised donor exchange rates...'
          }
          rows={3}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          required={decision !== 'approved'}
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isSubmitting}
          >
            {t('common.cancel', 'Cancel')}
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className={
              decision === 'approved'
                ? 'bg-forest-700 hover:bg-forest-800 text-white'
                : decision === 'amendments_requested'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }
          >
            {isSubmitting ? t('common.loading', 'Submitting...') : t('documents.submitDecision', 'Record Decision')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
