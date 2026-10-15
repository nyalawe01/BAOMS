/**
 * Upload New Version Modal
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Enforces immutable versioning by creating a new version entry
 * with mandatory change notes, preserving prior versions.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ShieldAlert, UploadCloud } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { FileUploadDropzone } from '@/components/ui/FileUploadDropzone';
import { DocumentRecord, NewVersionPayload } from '../types/document';
import { validateDocumentFile } from '../services/storageService';

interface UploadVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentRecord | null;
  onSubmit: (payload: NewVersionPayload) => Promise<void>;
}

export const UploadVersionModal: React.FC<UploadVersionModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [changeNotes, setChangeNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!doc) return null;

  const nextVersionNumber = (doc.versions?.length || 1) + 1;

  const resetForm = () => {
    setSelectedFile(null);
    setFileError(null);
    setChangeNotes('');
    setSubmitError(null);
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setFileError(null);
      return;
    }

    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setFileError(validation.error || 'Invalid file');
      setSelectedFile(null);
    } else {
      setFileError(null);
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError(t('documents.fileRequired', 'Please select a file to upload.'));
      return;
    }

    if (!changeNotes.trim()) {
      setSubmitError(t('documents.changeNotesRequired', 'Change notes are required to explain what was modified in this revision.'));
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload: NewVersionPayload = {
        document_id: doc.id,
        category_code: doc.category?.code || 'GEN',
        file: selectedFile,
        change_notes: changeNotes.trim(),
      };

      await onSubmit(payload);
      resetForm();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Version upload failed.');
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
          <UploadCloud className="h-5 w-5 text-forest-700" />
          <span>{t('documents.uploadNewVersionTitle', 'Upload New Version (v{{ver}}.0)', { ver: nextVersionNumber })}</span>
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

        <div className="p-3 bg-forest-50/60 border border-forest-200 rounded-lg text-xs text-forest-900 flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 text-forest-700 shrink-0 mt-0.5" />
          <p>
            {t(
              'documents.versionPreservationNotice',
              'Previous versions will remain immutable and accessible in the audit lineage. The new version will become active and reset document review status to Pending Review.'
            )}
          </p>
        </div>

        {/* File Dropzone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
            {t('documents.newVersionFileLabel', 'New Revision File *')}
          </label>

          <FileUploadDropzone
            selectedFile={selectedFile}
            onFileSelect={handleFileChange}
            error={fileError}
            accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.jpeg,.png,.webp"
            maxSizeMB={25}
            hint="PDF, Microsoft Word, Microsoft Excel, PNG, JPG (Max 25 MB). Pick a file or entire folder."
          />
        </div>

        {/* Mandatory Change Notes */}
        <Textarea
          label={t('documents.changeNotesLabel', 'Revision Notes & Summary of Amendments *')}
          placeholder="Describe the changes made in this revision (e.g. Incorporated Q1 auditor recommendations, updated budget table 3.2)..."
          rows={3}
          value={changeNotes}
          onChange={(e) => setChangeNotes(e.target.value)}
          required
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
            disabled={isSubmitting || !selectedFile || !changeNotes.trim()}
            className="bg-forest-700 hover:bg-forest-800 text-white"
          >
            {isSubmitting
              ? t('common.loading', 'Uploading...')
              : t('documents.submitNewVersion', 'Publish Version v{{ver}}.0', { ver: nextVersionNumber })}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
