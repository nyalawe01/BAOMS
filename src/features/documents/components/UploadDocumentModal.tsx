/**
 * Upload & Register New Document Modal
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Validates file size (max 25MB) and authorized extensions (PDF, DOCX, XLSX, images),
 * accepts metadata, and creates the first immutable version record.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, UploadCloud } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FileUploadDropzone } from '@/components/ui/FileUploadDropzone';
import {
  DocumentCategory,
  DocumentClassification,
  UploadDocumentPayload,
} from '../types/document';
import { validateDocumentFile } from '../services/storageService';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DocumentCategory[];
  onSubmit: (payload: UploadDocumentPayload) => Promise<void>;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSubmit,
}) => {
  const { t, i18n } = useTranslation();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [classification, setClassification] = useState<DocumentClassification>('internal');
  const [documentDate, setDocumentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentLang = i18n.language.startsWith('sw') ? 'sw' : 'en';

  const resetForm = () => {
    setSelectedFile(null);
    setFileError(null);
    setTitle('');
    setCategoryId(categories[0]?.id || '');
    setCustomCategory('');
    setClassification('internal');
    setDocumentDate(new Date().toISOString().slice(0, 10));
    setDescription('');
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
      // Auto-populate title if empty
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError(t('documents.fileRequired', 'Please select a file to upload.'));
      return;
    }

    if (!title.trim()) {
      setSubmitError(t('documents.titleRequired', 'Document title is required.'));
      return;
    }

    if (categoryId === 'other' && !customCategory.trim()) {
      setSubmitError(t('documents.customCategoryRequired', 'Please specify the custom category name.'));
      return;
    }

    const selectedCategory = categoryId === 'other'
      ? (categories[0] || { id: 'other', code: 'GEN' })
      : (categories.find((c) => c.id === categoryId) || categories[0]);
    if (!selectedCategory) {
      setSubmitError(t('documents.categoryRequired', 'Please select a valid document category.'));
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const resolvedDescription = categoryId === 'other'
        ? (description.trim() ? `[Category: ${customCategory.trim()}] ${description.trim()}` : `[Category: ${customCategory.trim()}]`)
        : (description.trim() || undefined);

      const payload: UploadDocumentPayload = {
        title: title.trim(),
        description: resolvedDescription,
        category_id: selectedCategory.id,
        category_code: categoryId === 'other' ? 'OTHER' : selectedCategory.code,
        classification,
        document_date: documentDate,
        tags: [],
        file: selectedFile,
        change_notes: undefined,
      };

      await onSubmit(payload);
      resetForm();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Upload failed.');
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
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-forest-700" />
          <span>{t('documents.uploadModalTitle', 'Register & Upload New Document')}</span>
        </div>
      }
      description={t(
        'documents.uploadModalDesc',
        'Upload authorized organizational record. The initial version will be indexed and assigned a unique reference code.'
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* File Dropzone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
            {t('documents.selectFileLabel', 'Document File (PDF, DOCX, XLSX, Images up to 25MB) *')}
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

        {/* Title */}
        <Input
          label={t('documents.documentTitle', 'Document Official Title *')}
          placeholder="e.g. Babawatoto Annual Program Workplan 2026"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <Select
            label={t('documents.category', 'Category *')}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.code} — {currentLang === 'sw' ? cat.name_sw : cat.name_en}
              </option>
            ))}
            <option value="other">{t('common.otherCategory', 'Other (Category not listed)...')}</option>
          </Select>

          {/* Classification */}
          <Select
            label={t('documents.classification', 'Security Classification *')}
            value={classification}
            onChange={(e) => setClassification(e.target.value as DocumentClassification)}
            required
          >
            <option value="public">{t('documents.public', 'Public (Open to All)')}</option>
            <option value="internal">{t('documents.internal', 'Internal (BAO Staff Only)')}</option>
            <option value="confidential">{t('documents.confidential', 'Confidential (Executive/Finance)')}</option>
            <option value="restricted">{t('documents.restricted', 'Restricted (Board/Legal/Admin)')}</option>
          </Select>
        </div>

        {categoryId === 'other' && (
          <Input
            label={t('documents.customCategoryLabel', 'Specify Custom Category *')}
            placeholder="e.g. Environmental Impact & Field Assessment"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            required
          />
        )}

        <div>
          {/* Document Date */}
          <Input
            type="date"
            label={t('documents.effectiveDate', 'Document Effective Date *')}
            value={documentDate}
            onChange={(e) => setDocumentDate(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <Textarea
          label={t('documents.description', 'Brief Summary / Scope (Optional)')}
          placeholder="Contextual purpose or notes describing this document..."
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
            disabled={isSubmitting || !selectedFile || !title.trim()}
            className="bg-forest-700 hover:bg-forest-800 text-white"
          >
            {isSubmitting ? t('common.loading', 'Uploading...') : t('documents.submitUpload', 'Upload & Register')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
