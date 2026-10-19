/**
 * Upload & Register New Document Page
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Replaces floating upload modal with a dedicated full page for document registration,
 * file validation (PDF, DOCX, XLSX, image up to 25MB), metadata capture, and security classification.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UploadCloud, ArrowLeft, AlertCircle, FileCheck, Shield, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FileUploadDropzone } from '@/components/ui/FileUploadDropzone';
import { useAuth } from '@/features/auth/useAuth';
import {
  DocumentCategory,
  DocumentClassification,
  UploadDocumentPayload,
} from '../types/document';
import { getDocumentCategories, createDocument } from '../services/documentService';
import { validateDocumentFile } from '../services/storageService';

export const UploadDocumentPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const currentLang = i18n.language.startsWith('sw') ? 'sw' : 'en';

  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [classification, setClassification] = useState<DocumentClassification>('internal');
  const [documentDate, setDocumentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState('');
  const [changeNotes, setChangeNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const cats = await getDocumentCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setCategoryId(cats[0].id);
        }
      } catch (err) {
        console.warn('Failed to load document categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

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
        change_notes: changeNotes.trim() || undefined,
      };

      const currentUserMeta = {
        id: user?.id || 'demo-user-id',
        name: profile?.display_name || user?.email || 'Authorized Staff',
      };

      await createDocument(payload, currentUserMeta);
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/documents');
      }, 1200);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader
        title={t('documents.uploadPageTitle', 'Register & Upload New Document')}
        subtitle={t(
          'documents.uploadPageSubtitle',
          'Upload official records, establish initial version control, and set access classifications.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('documents.pageTitle', 'Documents & Records'), href: '/documents' },
          { label: t('documents.uploadBreadcrumb', 'Upload New Document') },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/documents')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {t('common.back', 'Back to Documents')}
          </Button>
        }
      />

      {submitSuccess && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div className="text-sm font-medium">
            Document successfully registered and archived into the organizational repository. Redirecting...
          </div>
        </div>
      )}

      {submitError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">{submitError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: File Dropzone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-forest-700" />
              <span>1. Select & Validate Document File</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FileUploadDropzone
              onFileSelected={handleFileChange}
              selectedFile={selectedFile}
              onClearFile={() => {
                setSelectedFile(null);
                setFileError(null);
              }}
              error={fileError}
              accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
              maxSizeBytes={25 * 1024 * 1024}
              helperText={t(
                'documents.uploadHelper',
                'Supported: PDF, DOCX, XLSX, JPEG, PNG (Max: 25MB). Content will be hashed and versioned.'
              )}
            />
          </CardContent>
        </Card>

        {/* Step 2: Metadata & Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-charcoal-700" />
              <span>2. Document Profile & Metadata</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                label={t('documents.title', 'Document Title *')}
                placeholder={t('documents.titlePlaceholder', 'e.g., Annual Financial Audit Report FY2025/2026')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  label={t('documents.category', 'Category *')}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  options={[
                    ...categories.map((c) => ({
                      value: c.id,
                      label: currentLang === 'sw' && c.name_sw ? c.name_sw : c.name_en,
                    })),
                    { value: 'other', label: t('documents.otherCategory', 'Other (Specify)') },
                  ]}
                  disabled={loadingCategories}
                />
                {categoryId === 'other' && (
                  <div className="mt-2">
                    <Input
                      label={t('documents.specifyCategory', 'Specify Category Name *')}
                      placeholder="e.g. Field Inspection Photo Pack"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <Select
                  label={t('documents.classification', 'Security Classification *')}
                  value={classification}
                  onChange={(e) => setClassification(e.target.value as DocumentClassification)}
                  options={[
                    { value: 'public', label: t('documents.public', 'Public (Open to All)') },
                    { value: 'internal', label: t('documents.internal', 'Internal (Staff Only)') },
                    { value: 'confidential', label: t('documents.confidential', 'Confidential (Executive & Designated Leads)') },
                    { value: 'restricted', label: t('documents.restricted', 'Restricted (Strict RLS Enforcement)') },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label={t('documents.documentDate', 'Document Effective Date *')}
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  label={t('documents.changeNotes', 'Initial Version Notes (Optional)')}
                  placeholder="e.g. Initial signed copy uploaded"
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Textarea
                label={t('documents.description', 'Description / Summary')}
                placeholder={t(
                  'documents.descriptionPlaceholder',
                  'Briefly summarize the contents, context, or program linkage of this document...'
                )}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/documents')}
            disabled={isSubmitting}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !selectedFile}
            className="bg-forest-700 hover:bg-forest-800 text-white min-w-[140px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('common.saving', 'Uploading...')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4" />
                {t('documents.submitUpload', 'Register Document')}
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UploadDocumentPage;
