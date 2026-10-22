/**
 * Review Activity Modal
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Allows Project Managers to review submitted field activities,
 * approve them, or return them for correction with detailed comments.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, RotateCcw, AlertCircle, FileText } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ActivityRecord, ReviewActivityInput } from '../types/project';

interface ReviewActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityRecord | null;
  onSubmit: (input: ReviewActivityInput) => Promise<void>;
}

export const ReviewActivityModal: React.FC<ReviewActivityModalProps> = ({
  isOpen,
  onClose,
  activity,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const [decision, setDecision] = useState<'approve' | 'return_for_correction'>('approve');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (decision === 'return_for_correction' && !comments.trim()) {
      setError(
        t(
          'projects.errors.correctionCommentsRequired',
          'Review comments are required when returning an activity for correction.'
        )
      );
      return;
    }

    if (decision === 'approve') {
      const hasMetrics = (activity.participantsCount || 0) > 0;
      const hasDocs = activity.evidenceDocuments && activity.evidenceDocuments.length > 0;
      if (!hasMetrics) {
        setError('Cannot mark complete: Activity requires recorded participant reach metrics before completion.');
        return;
      }
      if (!hasDocs) {
        setError('Cannot mark complete: Activity requires attached verification documents (attendance register, signed logs, or field reports).');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        activityId: activity.id,
        decision,
        comments: comments.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t('projects.errors.reviewFailed', 'Failed to complete review.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-forest-900 font-semibold text-lg">
          <FileText className="w-5 h-5 text-forest-700" />
          <span>{t('projects.reviewActivity', 'Review Field Activity')}</span>
        </div>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Activity Summary Card */}
        <div className="p-3.5 bg-surface-muted/40 border border-surface-border rounded-lg space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-forest-950 text-base">{activity.title}</h4>
            <span className="text-xs text-charcoal-muted">
              {activity.activityDate} • {activity.location || 'Location unspecified'}
            </span>
          </div>

          <p className="text-charcoal leading-relaxed text-xs">
            <span className="font-semibold text-charcoal-dark">
              {t('projects.fields.progressOutputs', 'Progress / Outputs')}:
            </span>{' '}
            {activity.progress}
          </p>

          {activity.challenges && (
            <p className="text-amber-800 text-xs">
              <span className="font-semibold">{t('projects.fields.challenges', 'Challenges')}:</span>{' '}
              {activity.challenges}
            </p>
          )}

          {activity.followUpActions && (
            <p className="text-charcoal text-xs">
              <span className="font-semibold text-charcoal-dark">
                {t('projects.fields.followUpActions', 'Next Steps')}:
              </span>{' '}
              {activity.followUpActions}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-charcoal-muted pt-1 border-t border-surface-border">
            <span>
              {t('projects.submittedBy', 'Submitted by')}:{' '}
              <strong className="text-charcoal">{activity.submittedByName || 'Coordinator'}</strong>
            </span>
            <span>
              {t('projects.participants', 'Participants')}:{' '}
              <strong className="text-charcoal">{activity.participantsCount}</strong>
            </span>
          </div>
        </div>

        {/* Decision Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
            {t('projects.reviewDecision', 'Review Decision')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision('approve')}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                decision === 'approve'
                  ? 'border-forest-700 bg-forest-50 text-forest-900 ring-2 ring-forest-700/20'
                  : 'border-surface-border bg-white text-charcoal hover:bg-surface-muted'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 ${
                  decision === 'approve' ? 'text-forest-700' : 'text-charcoal-muted'
                }`}
              />
              <span>{t('projects.decisions.approve', 'Approve Activity')}</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('return_for_correction')}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                decision === 'return_for_correction'
                  ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600/20'
                  : 'border-surface-border bg-white text-charcoal hover:bg-surface-muted'
              }`}
            >
              <RotateCcw
                className={`w-4 h-4 ${
                  decision === 'return_for_correction' ? 'text-amber-600' : 'text-charcoal-muted'
                }`}
              />
              <span>{t('projects.decisions.return', 'Return for Correction')}</span>
            </button>
          </div>
        </div>

        {/* Feedback comments */}
        <Textarea
          label={
            decision === 'approve'
              ? t('projects.fields.reviewCommentsOptional', 'Review Notes (Optional)')
              : t('projects.fields.correctionInstructions', 'Required Correction Instructions *')
          }
          placeholder={
            decision === 'approve'
              ? 'Add any commendation or notes for final archiving...'
              : 'Specify exactly what data, evidence files, or participant numbers need correction...'
          }
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          required={decision === 'return_for_correction'}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant={decision === 'approve' ? 'primary' : 'danger'}
            isLoading={isSubmitting}
          >
            {decision === 'approve'
              ? t('projects.decisions.confirmApprove', 'Confirm Approval')
              : t('projects.decisions.confirmReturn', 'Return to Submitter')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
