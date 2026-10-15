import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CorrespondenceDirection,
  CorrespondenceCategory,
  ConfidentialityLevel,
  CorrespondenceRecord,
  CreateCorrespondencePayload,
} from '../types/correspondence';
import { createCorrespondence } from '../services/correspondenceService';
import { useAuth } from '@/features/auth/useAuth';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FileUploadDropzone } from '@/components/ui/FileUploadDropzone';
import { Mail, AlertCircle } from 'lucide-react';

interface CreateCorrespondenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDirection?: CorrespondenceDirection;
  onCreated: (item: CorrespondenceRecord) => void;
}

export const CreateCorrespondenceModal: React.FC<CreateCorrespondenceModalProps> = ({
  isOpen,
  onClose,
  defaultDirection = 'incoming',
  onCreated,
}) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const [direction, setDirection] = useState<CorrespondenceDirection>(defaultDirection);
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [correspondenceDate, setCorrespondenceDate] = useState(
    new Date().toISOString().split('T')[0] ?? ''
  );
  const [category, setCategory] = useState<CorrespondenceCategory>('government');
  const [confidentialityLevel, setConfidentialityLevel] = useState<ConfidentialityLevel>('internal');
  const [notes, setNotes] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sender.trim() || !recipient.trim() || !subject.trim() || !correspondenceDate) {
      setError(t('correspondence.errors.allRequired', 'Sender, recipient, subject, and date are required.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateCorrespondencePayload = {
        direction,
        sender: sender.trim(),
        recipient: recipient.trim(),
        subject: subject.trim(),
        correspondenceDate,
        category,
        confidentialityLevel,
        notes: notes.trim() || null,
      };

      const newItem = await createCorrespondence(payload, {
        id: user?.id || 'sys-admin',
        displayName: profile?.display_name || user?.email || 'System Admin',
      });
      onCreated(newItem);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to register correspondence.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-forest-700" />
          <span>
            {direction === 'incoming'
              ? t('correspondence.registerIncoming', 'Register Incoming Correspondence')
              : t('correspondence.registerOutgoing', 'Register Outgoing Correspondence')}
          </span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Direction toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-surface-muted border border-surface-border">
            <button
              type="button"
              onClick={() => setDirection('incoming')}
              className={`py-2 text-xs font-bold rounded-md transition-colors ${
                direction === 'incoming'
                  ? 'bg-surface-card text-forest-800 shadow-xs'
                  : 'text-charcoal-muted hover:text-charcoal-800'
              }`}
            >
              {t('correspondence.directionIncoming', 'Incoming Letter / Notice')}
            </button>
            <button
              type="button"
              onClick={() => setDirection('outgoing')}
              className={`py-2 text-xs font-bold rounded-md transition-colors ${
                direction === 'outgoing'
                  ? 'bg-surface-card text-forest-800 shadow-xs'
                  : 'text-charcoal-muted hover:text-charcoal-800'
              }`}
            >
              {t('correspondence.directionOutgoing', 'Outgoing Letter / Notice')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('correspondence.sender', 'Sender / Source Agency')} *
              </label>
              <input
                type="text"
                required
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="e.g. Ministry of Community Development"
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('correspondence.recipient', 'Recipient / Attention')} *
              </label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Executive Director, BAO"
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              {t('correspondence.subject', 'Letter Subject / Title')} *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Annual NGO Compliance Certificate & Statutory Filing Acknowledgement"
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('correspondence.date', 'Correspondence Date')} *
              </label>
              <input
                type="date"
                required
                value={correspondenceDate}
                onChange={(e) => setCorrespondenceDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('correspondence.category', 'Category')} *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CorrespondenceCategory)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              >
                <option value="government">Government / Ministry</option>
                <option value="donor">Donor / Funding Agency</option>
                <option value="legal">Legal & Banking</option>
                <option value="partner">Partner NGO</option>
                <option value="community">Community / Local Ward</option>
                <option value="general">General Administrative</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('correspondence.confidentiality', 'Confidentiality')} *
              </label>
              <select
                value={confidentialityLevel}
                onChange={(e) => setConfidentialityLevel(e.target.value as ConfidentialityLevel)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              >
                <option value="public">Public</option>
                <option value="internal">Internal Staff</option>
                <option value="confidential">Confidential (Executive Only)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              {t('correspondence.notes', 'Operational Notes / Summary')}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key decisions, referenced file tracking numbers, physical dispatch courier notes..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
            />
          </div>

          {/* Attachments Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              {t('correspondence.attachments', 'Scanned Letter / Official Attachments')}
            </label>
            <FileUploadDropzone
              files={attachedFiles}
              onFilesChange={setAttachedFiles}
              multiple
              accept=".pdf,.doc,.docx,.jpg,.png"
              maxSizeMB={15}
              hint="Attach signed scans, delivery slips, or supporting PDFs (Max 15MB each)."
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('correspondence.submitRegister', 'Register Correspondence')}
            </Button>
          </div>
        </form>
    </Modal>
  );
};
