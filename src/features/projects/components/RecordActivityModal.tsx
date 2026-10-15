/**
 * Record Activity Modal
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Allows Project Coordinators and Officers to record field activities,
 * attach evidence documents, and submit for Manager review.
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Paperclip, AlertCircle, X, UploadCloud } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { CreateActivityInput } from '../types/project';

interface RecordActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  onSubmit: (input: CreateActivityInput) => Promise<void>;
}

export const RecordActivityModal: React.FC<RecordActivityModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activityDate, setActivityDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [location, setLocation] = useState('');
  const [participantsCount, setParticipantsCount] = useState('0');
  const [progress, setProgress] = useState('');
  const [challenges, setChallenges] = useState('');
  const [followUpActions, setFollowUpActions] = useState('');

  // Extended analytical fields
  const [showExtendedFields, setShowExtendedFields] = useState(false);
  const [backgroundContext, setBackgroundContext] = useState('');
  const [methodology, setMethodology] = useState('');
  const [sessionNarrative, setSessionNarrative] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [quoteSpeaker, setQuoteSpeaker] = useState('');
  const [femaleCount, setFemaleCount] = useState('');
  const [maleCount, setMaleCount] = useState('');
  const [youthCount, setYouthCount] = useState('');
  const [budgetAllocated, setBudgetAllocated] = useState('');
  const [budgetSpent, setBudgetSpent] = useState('');

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (submitImmediately: boolean) => {
    setError(null);

    if (!title.trim()) {
      setError(t('projects.errors.activityTitleRequired', 'Activity title is required.'));
      return;
    }
    if (!progress.trim() && !sessionNarrative.trim()) {
      setError(t('projects.errors.progressRequired', 'Progress and outputs summary or narrative is required.'));
      return;
    }

    const participants = parseInt(participantsCount, 10);

    const quotes = quoteText.trim()
      ? [
          {
            quote: quoteText.trim(),
            speaker: quoteSpeaker.trim() || 'Community Participant',
          },
        ]
      : undefined;

    const demographicBreakdown =
      femaleCount || maleCount || youthCount
        ? {
            female: femaleCount ? parseInt(femaleCount, 10) : undefined,
            male: maleCount ? parseInt(maleCount, 10) : undefined,
            youth: youthCount ? parseInt(youthCount, 10) : undefined,
          }
        : undefined;

    setIsSubmitting(true);
    try {
      await onSubmit({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        activityDate,
        location: location.trim() || undefined,
        participantsCount: isNaN(participants) ? 0 : participants,
        progress: progress.trim() || sessionNarrative.trim(),
        challenges: challenges.trim() || undefined,
        followUpActions: followUpActions.trim() || undefined,
        submitImmediately,
        backgroundContext: backgroundContext.trim() || undefined,
        methodology: methodology.trim() || undefined,
        sessionNarrative: sessionNarrative.trim() || undefined,
        participantQuotes: quotes,
        demographicBreakdown,
        budgetAllocated: budgetAllocated ? parseFloat(budgetAllocated) : undefined,
        budgetSpent: budgetSpent ? parseFloat(budgetSpent) : undefined,
        evidenceFiles: attachedFiles.map((f) => ({
          title: f.name,
          file: f,
        })),
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t('projects.errors.activitySaveFailed', 'Failed to save activity.'));
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
          <Activity className="w-5 h-5 text-forest-700" />
          <span>{t('projects.recordActivity', 'Record Field Activity')}</span>
        </div>
      }
      description={projectName ? `${t('projects.forProject', 'For project')}: ${projectName}` : undefined}
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label={t('projects.fields.activityTitle', 'Activity Title')}
          placeholder="e.g. Youth Theater & Expression Workshop Session 2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="date"
            label={t('projects.fields.activityDate', 'Activity Date')}
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            required
          />

          <Input
            label={t('projects.fields.location', 'Location / Ward')}
            placeholder="e.g. Kigamboni Community Hall"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <Input
            type="number"
            min="0"
            label={t('projects.fields.participantsCount', 'Participants Reached')}
            value={participantsCount}
            onChange={(e) => setParticipantsCount(e.target.value)}
          />
        </div>

        <Textarea
          label={t('projects.fields.description', 'Brief Description & Scope')}
          placeholder="Summary of planned curriculum, attendees profile, or key themes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <Textarea
          label={t('projects.fields.progressOutputs', 'Progress, Outputs & Key Results *')}
          placeholder="Describe completed activities, attendance breakdown, delivered sessions, and tangible outcomes achieved..."
          value={progress}
          onChange={(e) => setProgress(e.target.value)}
          rows={3}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label={t('projects.fields.challenges', 'Challenges Encountered (Optional)')}
            placeholder="Weather disruptions, logistics bottlenecks, stakeholder delays..."
            value={challenges}
            onChange={(e) => setChallenges(e.target.value)}
            rows={2}
          />

          <Textarea
            label={t('projects.fields.followUpActions', 'Follow-up Actions & Next Steps (Optional)')}
            placeholder="Upcoming visits, report compilation, equipment returns..."
            value={followUpActions}
            onChange={(e) => setFollowUpActions(e.target.value)}
            rows={2}
          />
        </div>

        {/* Toggle Expandable In-depth Analysis & Demographics */}
        <div className="border border-slate-200 dark:border-neutral-700 rounded-lg p-3 bg-slate-50/50 dark:bg-neutral-800/40">
          <button
            type="button"
            onClick={() => setShowExtendedFields(!showExtendedFields)}
            className="flex items-center justify-between w-full text-xs font-semibold text-[#D68904] hover:text-[#b45309] transition-colors"
          >
            <span>{showExtendedFields ? '▼ Hide Comprehensive Analysis & Demographics' : '► Add Comprehensive Analysis, Demographics & Quotes (Optional)'}</span>
            <span className="text-[11px] text-slate-500 font-normal">Rich reporting for donor dossiers</span>
          </button>

          {showExtendedFields && (
            <div className="space-y-3 mt-3 pt-3 border-t border-slate-200 dark:border-neutral-700">
              <Textarea
                label="Background & Institutional Context"
                placeholder="Explain the local problem context, historical baseline, and why this intervention was conducted..."
                value={backgroundContext}
                onChange={(e) => setBackgroundContext(e.target.value)}
                rows={2}
              />

              <Textarea
                label="Methodology & Facilitation Protocol"
                placeholder="Participatory tools used, workshop structuring, interactive exercises..."
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                rows={2}
              />

              <Textarea
                label="Detailed Multi-Paragraph Field Session Narrative"
                placeholder="Write long narrative paragraphs detailing the full flow of events, dialogue highlights, breakthroughs..."
                value={sessionNarrative}
                onChange={(e) => setSessionNarrative(e.target.value)}
                rows={4}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  type="number"
                  min="0"
                  label="Female Participants"
                  value={femaleCount}
                  onChange={(e) => setFemaleCount(e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  label="Male Participants"
                  value={maleCount}
                  onChange={(e) => setMaleCount(e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  label="Youth Reached (10-24)"
                  value={youthCount}
                  onChange={(e) => setYouthCount(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  type="number"
                  min="0"
                  label="Activity Budget Allocated (TZS)"
                  placeholder="e.g. 1500000"
                  value={budgetAllocated}
                  onChange={(e) => setBudgetAllocated(e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  label="Actual Budget Spent (TZS)"
                  placeholder="e.g. 1420000"
                  value={budgetSpent}
                  onChange={(e) => setBudgetSpent(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Participant / Community Voice (Direct Quote)"
                  placeholder="e.g. This workshop gave us a voice..."
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                />
                <Input
                  label="Speaker Name & Affiliation"
                  placeholder="e.g. Amina S., Peer Educator"
                  value={quoteSpeaker}
                  onChange={(e) => setQuoteSpeaker(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Evidence Documents Attachment */}
        <div className="border border-surface-border rounded-lg p-3 bg-surface-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              {t('projects.evidenceAttachments', 'Supporting Evidence (Attendance Lists, Photos, M&E Forms)')}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs"
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1" />
              {t('projects.addFiles', 'Attach Files')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
            />
          </div>

          {attachedFiles.length === 0 ? (
            <p className="text-xs text-charcoal-muted italic py-1">
              {t('projects.noEvidenceAttached', 'No files attached yet. You can attach PDFs, images, or spreadsheets.')}
            </p>
          ) : (
            <div className="space-y-1.5 mt-2">
              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-white border border-surface-border rounded px-2.5 py-1.5"
                >
                  <span className="truncate max-w-[280px] font-medium text-charcoal">
                    {file.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-charcoal-muted text-[11px]">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-charcoal-muted hover:text-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit(false)}
            isLoading={isSubmitting}
          >
            {t('projects.saveDraft', 'Save as Draft')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => handleSubmit(true)}
            isLoading={isSubmitting}
          >
            {t('projects.submitForReview', 'Submit for Review')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
