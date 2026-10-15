/**
 * Document Detail & Records Audit Modal
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Displays complete document metadata, immutable version lineage,
 * and approval audit history with authorized download controls.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Archive,
  RotateCcw,
  Tag,
  Building,
  User,
  Calendar,
  Lock,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { DocumentRecord, DocumentVersion } from '../types/document';
import { formatFileSize, getSignedDownloadUrl } from '../services/storageService';
import { useAuth } from '@/features/auth/useAuth';

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentRecord | null;
  onUploadNewVersion: (doc: DocumentRecord) => void;
  onReviewApproval: (doc: DocumentRecord) => void;
  onArchive: (doc: DocumentRecord) => void;
  onRestore: (doc: DocumentRecord) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onUploadNewVersion,
  onReviewApproval,
  onArchive,
  onRestore,
}) => {
  const { t, i18n } = useTranslation();
  const { hasPermission, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'metadata' | 'versions' | 'approvals'>('metadata');
  const [downloadingVersionId, setDownloadingVersionId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!doc) return null;

  const currentLang = i18n.language.startsWith('sw') ? 'sw' : 'en';
  const categoryName = doc.category
    ? currentLang === 'sw'
      ? doc.category.name_sw
      : doc.category.name_en
    : doc.category_id;

  const canUpload = (hasPermission('documents.upload') || isAdmin()) && !doc.is_archived;
  const canApprove =
    (hasPermission('documents.approve') || isAdmin()) &&
    doc.status === 'pending_review' &&
    !doc.is_archived;
  const canArchive = hasPermission('documents.delete') || isAdmin();

  const handleDownload = async (version: DocumentVersion) => {
    try {
      setDownloadingVersionId(version.id);
      setDownloadError(null);
      const res = await getSignedDownloadUrl(version.file_path, 60);
      if (res.error || !res.url) {
        setDownloadError(res.error || 'Failed to generate download URL');
        return;
      }
      // Trigger download
      const link = window.document.createElement('a');
      link.href = res.url;
      link.download = version.file_name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setDownloadingVersionId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <StatusIndicator status="approved" label={t('common.approved', 'Approved')} />;
      case 'pending_review':
        return <StatusIndicator status="pending_review" label={t('documents.statusPending', 'Pending Review')} />;
      case 'draft':
        return <StatusIndicator status="draft" label={t('common.draft', 'Draft')} />;
      case 'archived':
      case 'superseded':
        return (
          <StatusIndicator
            status={status}
            label={status === 'archived' ? t('documents.archived', 'Archived') : t('documents.superseded', 'Superseded')}
          />
        );
      default:
        return <StatusIndicator status={status} label={status} />;
    }
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'restricted':
        return <span className="text-xs font-semibold text-red-600">{t('documents.restricted', 'Restricted')}</span>;
      case 'confidential':
        return <span className="text-xs font-semibold text-charcoal-900">{t('documents.confidential', 'Confidential')}</span>;
      case 'internal':
        return <span className="text-xs font-medium text-charcoal-800">{t('documents.internal', 'Internal')}</span>;
      case 'public':
      default:
        return <span className="text-xs font-medium text-charcoal-700">{t('documents.public', 'Public')}</span>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex flex-col gap-1 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold text-charcoal-900">
              {doc.reference_number}
            </span>
            {getClassificationBadge(doc.classification)}
            {getStatusBadge(doc.status)}
          </div>
          <h2 className="text-lg font-semibold text-charcoal leading-snug break-words">
            {doc.title}
          </h2>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {canArchive && (
              doc.is_archived ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRestore(doc)}
                  className="text-forest-700 border-forest-300 hover:bg-forest-50"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  {t('documents.restoreDocument', 'Restore Document')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onArchive(doc)}
                  className="text-red-700 border-red-200 hover:bg-red-50"
                >
                  <Archive className="h-4 w-4 mr-1.5" />
                  {t('documents.archiveDocument', 'Archive Document')}
                </Button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            {canUpload && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUploadNewVersion(doc)}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                {t('documents.uploadNewVersion', 'New Version')}
              </Button>
            )}

            {canApprove && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onReviewApproval(doc)}
                className="bg-forest-700 hover:bg-forest-800 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                {t('documents.reviewApprove', 'Review & Decide')}
              </Button>
            )}

            {doc.current_version && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload(doc.current_version!)}
                disabled={downloadingVersionId === doc.current_version?.id}
              >
                <Download className="h-4 w-4 mr-1.5" />
                {downloadingVersionId === doc.current_version?.id
                  ? t('common.loading', 'Loading...')
                  : t('documents.downloadLatest', 'Download Latest')}
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={onClose}>
              {t('common.cancel', 'Close')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {downloadError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{downloadError}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-surface-border gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === 'metadata'
                ? 'border-forest-700 text-forest-700 font-semibold'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>{t('documents.tabMetadata', 'Document Details')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('versions')}
            className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === 'versions'
                ? 'border-forest-700 text-forest-700 font-semibold'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>
              {t('documents.tabVersions', 'Version Lineage')} ({(doc.versions || []).length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === 'approvals'
                ? 'border-forest-700 text-forest-700 font-semibold'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {t('documents.tabApprovals', 'Review History')} ({(doc.approvals || []).length})
            </span>
          </button>
        </div>

        {/* Tab 1: Metadata Overview */}
        {activeTab === 'metadata' && (
          <div className="space-y-4 text-sm text-charcoal">
            {doc.description && (
              <div className="bg-surface-muted/60 p-3 rounded-md border border-surface-border text-xs leading-relaxed text-charcoal">
                <span className="font-semibold block text-charcoal-muted mb-1 uppercase tracking-wider text-[10px]">
                  {t('documents.summary', 'Document Description')}
                </span>
                {doc.description}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-surface-border rounded-lg p-3 space-y-2.5 bg-white">
                <h4 className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                  {t('documents.classificationMetadata', 'Classification & Indexing')}
                </h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal-muted flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" />
                    {t('documents.category', 'Category')}:
                  </span>
                  <span className="font-medium text-charcoal">{categoryName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal-muted flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    {t('documents.classification', 'Security Classification')}:
                  </span>
                  <span className="font-medium text-charcoal uppercase">{doc.classification}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal-muted flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {t('documents.documentDate', 'Effective Document Date')}:
                  </span>
                  <span className="font-medium text-charcoal">{doc.document_date}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal-muted flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {t('documents.owner', 'Document Owner')}:
                  </span>
                  <span className="font-medium text-charcoal">{doc.owner_name || doc.owner_id}</span>
                </div>
              </div>

              <div className="border border-surface-border rounded-lg p-3 space-y-2.5 bg-white">
                <h4 className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                  {t('documents.fileStorageDetails', 'Current Storage & File Record')}
                </h4>
                {doc.current_version ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-charcoal-muted">{t('documents.fileName', 'File Name')}:</span>
                      <span className="font-mono text-[11px] text-charcoal truncate max-w-[200px]" title={doc.current_version.file_name}>
                        {doc.current_version.file_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-charcoal-muted">{t('documents.fileSize', 'File Size')}:</span>
                      <span className="font-medium text-charcoal">{formatFileSize(doc.current_version.file_size)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-charcoal-muted">{t('documents.version', 'Active Version')}:</span>
                      <span className="font-mono text-forest-700 font-semibold">v{doc.current_version.version_number}.0</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-charcoal-muted">{t('documents.uploadedAt', 'Last Uploaded')}:</span>
                      <span className="font-medium text-charcoal">
                        {new Date(doc.current_version.created_at).toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-charcoal-muted">No version attached.</p>
                )}
              </div>
            </div>

            {/* Tags */}
            {doc.tags && doc.tags.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {t('documents.tags', 'Subject Tags')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {doc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-xs bg-surface-muted text-charcoal-muted border border-surface-border"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Version History */}
        {activeTab === 'versions' && (
          <div className="space-y-3">
            <p className="text-xs text-charcoal-muted">
              {t(
                'documents.versionHistoryExplanation',
                'Versions are strictly immutable. Each new upload increments the version number and records who made the update and why.'
              )}
            </p>

            <div className="space-y-2">
              {(doc.versions || []).map((ver) => (
                <div
                  key={ver.id}
                  className={`p-3.5 rounded-lg border transition-colors flex items-start justify-between gap-4 ${
                    ver.id === doc.current_version_id
                      ? 'border-forest-300 bg-forest-50/40'
                      : 'border-surface-border bg-white hover:bg-surface-muted/30'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-xs text-charcoal-900">
                        v{ver.version_number}.0
                      </span>
                      {ver.id === doc.current_version_id && (
                        <span className="font-semibold text-xs text-charcoal-900">
                          ({t('documents.currentActive', 'Active')})
                        </span>
                      )}
                      <span className="text-xs font-medium text-charcoal truncate" title={ver.file_name}>
                        {ver.file_name}
                      </span>
                      <span className="text-xs text-charcoal-muted">({formatFileSize(ver.file_size)})</span>
                    </div>

                    {ver.change_notes && (
                      <p className="text-xs text-charcoal-muted italic pl-2 border-l-2 border-[#D68904]">
                        "{ver.change_notes}"
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-charcoal-muted pt-1">
                      <span>{t('documents.uploadedBy', 'Uploaded by')}: {ver.created_by_name || ver.created_by}</span>
                      <span>•</span>
                      <span>{new Date(ver.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(ver)}
                    disabled={downloadingVersionId === ver.id}
                    className="shrink-0 text-xs h-8"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    {downloadingVersionId === ver.id ? '...' : t('common.download', 'Download')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Approval History */}
        {activeTab === 'approvals' && (
          <div className="space-y-3">
            <p className="text-xs text-charcoal-muted">
              {t(
                'documents.approvalAuditExplanation',
                'Official workflow review log. Uploaded documents remain in pending status until signed off by authorized leadership.'
              )}
            </p>

            {(doc.approvals || []).length === 0 ? (
              <div className="p-8 text-center border border-dashed border-surface-border rounded-lg bg-surface-muted/30">
                <Clock className="h-8 w-8 text-charcoal-light mx-auto mb-2" />
                <p className="text-sm font-medium text-charcoal">
                  {t('documents.noApprovalsRecorded', 'No formal reviews recorded yet')}
                </p>
                <p className="text-xs text-charcoal-muted mt-1">
                  {doc.status === 'pending_review'
                    ? t('documents.awaitingReviewNotice', 'This document is currently queued for administrative decision.')
                    : t('documents.initialDraftNotice', 'Draft document not yet submitted to the review workflow.')}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {(doc.approvals || []).map((app) => (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-lg border border-surface-border bg-white space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <StatusIndicator
                          status={app.status}
                          label={
                            app.status === 'approved'
                              ? t('common.approved', 'Approved')
                              : app.status === 'amendments_requested'
                              ? t('documents.amendmentsRequested', 'Amendments Requested')
                              : t('common.rejected', 'Rejected')
                          }
                        />
                        <span className="text-xs font-semibold text-charcoal">
                          {app.reviewer_name || 'Authorized Reviewer'}
                        </span>
                        {app.reviewer_role && (
                          <span className="text-[11px] text-charcoal-muted bg-surface-muted px-1.5 py-0.5 rounded">
                            {app.reviewer_role}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-charcoal-muted">
                        {new Date(app.decided_at).toLocaleString()}
                      </span>
                    </div>

                    {app.comments && (
                      <p className="text-xs text-charcoal bg-surface-muted/50 p-2.5 rounded border border-surface-border leading-relaxed">
                        {app.comments}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
