import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MeetingType,
  ConfidentialityLevel,
  MeetingRecord,
  CreateMeetingPayload,
} from '../types/correspondence';
import { createMeeting } from '../services/correspondenceService';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/Button';
import { X, Calendar, AlertCircle } from 'lucide-react';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: MeetingRecord) => void;
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const [title, setTitle] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('management');
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [location, setLocation] = useState('');
  const [confidentialityLevel, setConfidentialityLevel] = useState<ConfidentialityLevel>('internal');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !location.trim() || !meetingDate) {
      setError(t('meetings.errors.requiredFields', 'Title, date, and location are required.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateMeetingPayload = {
        title: title.trim(),
        meetingType,
        meetingDate: new Date(meetingDate).toISOString(),
        location: location.trim(),
        confidentialityLevel,
      };

      const newMeeting = await createMeeting(payload, {
        id: user?.id || 'sys-admin',
        displayName: profile?.display_name || user?.email || 'System Admin',
      });
      onCreated(newMeeting);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to register meeting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-surface-card rounded-xl border border-surface-border shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/30">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-forest-700" />
            <h2 className="text-lg font-bold text-charcoal-900">
              {t('meetings.recordNewMeeting', 'Record Administrative Meeting')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-charcoal-muted hover:text-charcoal-800 hover:bg-surface-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              {t('meetings.title', 'Meeting Title / Agenda')} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Management Review & Activity Alignment"
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('meetings.type', 'Meeting Type')} *
              </label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              >
                <option value="board">Board of Trustees</option>
                <option value="management">Executive Management</option>
                <option value="staff">General Staff Meeting</option>
                <option value="project">Project Team Meeting</option>
                <option value="donor">Donor / Partner Session</option>
                <option value="committee">Special Committee</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('meetings.confidentiality', 'Confidentiality')} *
              </label>
              <select
                value={confidentialityLevel}
                onChange={(e) => setConfidentialityLevel(e.target.value as ConfidentialityLevel)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              >
                <option value="public">Public / Open</option>
                <option value="internal">Internal Staff</option>
                <option value="confidential">Confidential (Executive Only)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('meetings.date', 'Date & Time')} *
              </label>
              <input
                type="datetime-local"
                required
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('meetings.location', 'Location / Venue')} *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. BAO Boardroom / MS Teams"
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('meetings.submitMeeting', 'Save Meeting Record')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
