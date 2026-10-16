/**
 * Documents & Records Management Register Page
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Provides an authorized, searchable, version-controlled records register
 * with status workflow tabs, table/card layouts, and audit details.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Plus,
  Search,
  Clock,
  Download,
  Eye,
  FolderTree,
  LayoutGrid,
  Table as TableIcon,
  Lock,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { useAuth } from '@/features/auth/useAuth';

import {
  DocumentRecord,
  DocumentCategory,
  DocumentFilterState,
  DocumentListResult,
  UploadDocumentPayload,
  NewVersionPayload,
  ApprovalDecisionPayload,
} from '../types/document';
import {
  getDocuments,
  getDocumentCategories,
  createDocument,
  uploadNewVersion,
  submitApprovalDecision,
  archiveDocument,
  restoreDocument,
  getDocumentById,
} from '../services/documentService';
import { getSignedDownloadUrl } from '../services/storageService';

import { DocumentDetailModal } from '../components/DocumentDetailModal';
import { UploadDocumentModal } from '../components/UploadDocumentModal';
import { UploadVersionModal } from '../components/UploadVersionModal';
import { WorkflowApprovalModal } from '../components/WorkflowApprovalModal';
import { CategoryManagementModal } from '../components/CategoryManagementModal';

export const DocumentsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, profile, hasPermission, isAdmin } = useAuth();
  const currentLang = i18n.language.startsWith('sw') ? 'sw' : 'en';

  // State
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documentsResult, setDocumentsResult] = useState<DocumentListResult>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [classificationFilter, setClassificationFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Archive Confirm Dialog
  const [docToArchive, setDocToArchive] = useState<DocumentRecord | null>(null);
  const [docToRestore, setDocToRestore] = useState<DocumentRecord | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // User metadata for service calls
  const currentUserMeta = {
    id: user?.id || 'demo-user-id',
    name: profile?.display_name || user?.email || 'Authorized Staff',
  };

  // Load Categories
  const loadCategories = useCallback(async () => {
    try {
      const cats = await getDocumentCategories();
      setCategories(cats);
    } catch (err) {
      console.warn('Failed to load categories:', err);
    }
  }, []);

  // Load Documents
  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setActionError(null);

      const filterPayload: DocumentFilterState = {
        page: currentPage,
        pageSize: 10,
        status: statusFilter,
        category: categoryFilter,
        classification: classificationFilter,
        search: searchQuery,
        sortBy: 'document_date',
        sortOrder: 'desc',
      };

      const result = await getDocuments(filterPayload);
      setDocumentsResult(result);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, categoryFilter, classificationFilter, searchQuery]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Open full details (fetches latest state)
  const handleOpenDetail = async (doc: DocumentRecord) => {
    const full = await getDocumentById(doc.id);
    setSelectedDoc(full || doc);
    setIsDetailModalOpen(true);
  };

  // Create Document
  const handleCreateDocument = async (payload: UploadDocumentPayload) => {
    await createDocument(payload, currentUserMeta);
    await loadDocuments();
  };

  // Upload New Version
  const handleUploadVersion = async (payload: NewVersionPayload) => {
    await uploadNewVersion(payload, currentUserMeta);
    await loadDocuments();
    if (selectedDoc?.id === payload.document_id) {
      const updated = await getDocumentById(payload.document_id);
      setSelectedDoc(updated);
    }
  };

  // Review & Approval Decision
  const handleApprovalDecision = async (payload: ApprovalDecisionPayload) => {
    await submitApprovalDecision(payload, {
      ...currentUserMeta,
      role: isAdmin() ? 'System Administrator' : 'Executive Director',
    });
    await loadDocuments();
    if (selectedDoc?.id === payload.document_id) {
      const updated = await getDocumentById(payload.document_id);
      setSelectedDoc(updated);
    }
  };

  // Archive Confirm
  const handleConfirmArchive = async () => {
    if (!docToArchive) return;
    try {
      setIsArchiving(true);
      await archiveDocument(docToArchive.id);
      setDocToArchive(null);
      setIsDetailModalOpen(false);
      await loadDocuments();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Archive failed.');
    } finally {
      setIsArchiving(false);
    }
  };

  // Restore Confirm
  const handleConfirmRestore = async () => {
    if (!docToRestore) return;
    try {
      setIsArchiving(true);
      await restoreDocument(docToRestore.id);
      setDocToRestore(null);
      setIsDetailModalOpen(false);
      await loadDocuments();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Restore failed.');
    } finally {
      setIsArchiving(false);
    }
  };

  // Direct download handler
  const handleDirectDownload = async (doc: DocumentRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!doc.current_version) return;
    const res = await getSignedDownloadUrl(doc.current_version.file_path, 60);
    if (res.url) {
      const link = window.document.createElement('a');
      link.href = res.url;
      link.download = doc.current_version.file_name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
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
        return <span className="text-xs font-medium text-charcoal-900">{t('documents.confidential', 'Confidential')}</span>;
      case 'internal':
        return <span className="text-xs font-medium text-charcoal-900">{t('documents.internal', 'Internal')}</span>;
      case 'public':
      default:
        return <span className="text-xs font-medium text-charcoal-900">{t('documents.public', 'Public')}</span>;
    }
  };

  // Status Counts
  const approvedCount = documentsResult.data.filter((d) => d.status === 'approved' && !d.is_archived).length;
  const pendingCount = documentsResult.data.filter((d) => d.status === 'pending_review' && !d.is_archived).length;
  const confidentialCount = documentsResult.data.filter(
    (d) => (d.classification === 'confidential' || d.classification === 'restricted') && !d.is_archived
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('documents.pageTitle', 'Documents & Records Management')}
        subtitle={t(
          'documents.pageSubtitle',
          'Searchable, version-controlled organizational repository with authorized workflow sign-offs.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('documents.pageTitle', 'Documents & Records') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {isAdmin() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-xs"
              >
                <FolderTree className="h-4 w-4 mr-1.5" />
                {t('documents.categoriesBtn', 'Categories')}
              </Button>
            )}

            {(hasPermission('documents.upload') || isAdmin()) && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-forest-700 hover:bg-forest-800 text-white text-xs"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {t('documents.uploadBtn', 'Upload Document')}
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-surface-border min-w-0">
          <CardContent className="p-4 flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-forest-50 flex items-center justify-center text-forest-700 shrink-0">
              <i className="fa-solid fa-file-contract text-lg" aria-hidden="true"></i>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-charcoal-muted uppercase tracking-wider truncate">
                {t('documents.totalDocuments', 'Active Repository')}
              </p>
              <p className="text-[32px] font-bold text-charcoal leading-[1.2] font-mono tabular-nums truncate">{documentsResult.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-surface-border min-w-0">
          <CardContent className="p-4 flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-700 shrink-0">
              <i className="fa-solid fa-file-circle-check text-lg" aria-hidden="true"></i>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-charcoal-muted uppercase tracking-wider truncate">
                {t('common.approved', 'Approved Records')}
              </p>
              <p className="text-[32px] font-bold text-charcoal leading-[1.2] font-mono tabular-nums truncate">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-surface-border min-w-0">
          <CardContent className="p-4 flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
              <i className="fa-solid fa-clock-rotate-left text-lg" aria-hidden="true"></i>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-charcoal-muted uppercase tracking-wider truncate">
                {t('documents.statusPending', 'Pending Review')}
              </p>
              <p className="text-[32px] font-bold text-amber-700 leading-[1.2] font-mono tabular-nums truncate">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-surface-border min-w-0">
          <CardContent className="p-4 flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-700 shrink-0">
              <i className="fa-solid fa-lock text-lg" aria-hidden="true"></i>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-charcoal-muted uppercase tracking-wider truncate">
                {t('documents.confidentialOrRestricted', 'Protected / Restricted')}
              </p>
              <p className="text-[32px] font-bold text-charcoal leading-[1.2] font-mono tabular-nums truncate">{confidentialCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Filter Toolbar & Repository Content */}
      <Card className="border-surface-border bg-white ">
        {/* Status Navigation Tabs */}
        <div className="border-b border-surface-border px-4 pt-3 flex items-center justify-between overflow-x-auto gap-4">
          <div className="flex gap-4 sm:gap-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`pb-3 transition-colors border-b-2 -mb-px ${
                statusFilter === 'all'
                  ? 'border-forest-700 text-forest-700 font-semibold'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal'
              }`}
            >
              {t('documents.allRecords', 'All Active')}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('pending_review');
                setCurrentPage(1);
              }}
              className={`pb-3 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                statusFilter === 'pending_review'
                  ? 'border-forest-700 text-forest-700 font-semibold'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal'
              }`}
            >
              <span>{t('documents.statusPending', 'Pending Review')}</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded-full font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('approved');
                setCurrentPage(1);
              }}
              className={`pb-3 transition-colors border-b-2 -mb-px ${
                statusFilter === 'approved'
                  ? 'border-forest-700 text-forest-700 font-semibold'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal'
              }`}
            >
              {t('common.approved', 'Approved')}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('draft');
                setCurrentPage(1);
              }}
              className={`pb-3 transition-colors border-b-2 -mb-px ${
                statusFilter === 'draft'
                  ? 'border-forest-700 text-forest-700 font-semibold'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal'
              }`}
            >
              {t('common.draft', 'Drafts')}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('archived');
                setCurrentPage(1);
              }}
              className={`pb-3 transition-colors border-b-2 -mb-px ${
                statusFilter === 'archived'
                  ? 'border-forest-700 text-forest-700 font-semibold'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal'
              }`}
            >
              {t('documents.archived', 'Archived')}
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 pb-2">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-forest-100 text-forest-800'
                  : 'text-charcoal-muted hover:bg-surface-muted'
              }`}
            >
              <TableIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-forest-100 text-forest-800'
                  : 'text-charcoal-muted hover:bg-surface-muted'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-surface-border bg-surface-muted/20 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-light" />
            <input
              type="text"
              placeholder={t('documents.searchPlaceholder', 'Search by reference number, title, or tag...')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-full pl-9 pr-3 text-xs bg-white border border-surface-border rounded-md text-charcoal focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 text-xs bg-white border border-surface-border rounded-md px-2.5 text-charcoal focus:outline-none focus:ring-1 focus:ring-forest-700"
            >
              <option value="all">{t('documents.allCategories', 'All Categories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {currentLang === 'sw' ? c.name_sw : c.name_en}
                </option>
              ))}
            </select>

            {/* Classification Dropdown */}
            <select
              value={classificationFilter}
              onChange={(e) => {
                setClassificationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 text-xs bg-white border border-surface-border rounded-md px-2.5 text-charcoal focus:outline-none focus:ring-1 focus:ring-forest-700"
            >
              <option value="all">{t('documents.allClassifications', 'All Classifications')}</option>
              <option value="public">{t('documents.public', 'Public')}</option>
              <option value="internal">{t('documents.internal', 'Internal')}</option>
              <option value="confidential">{t('documents.confidential', 'Confidential')}</option>
              <option value="restricted">{t('documents.restricted', 'Restricted')}</option>
            </select>

            {(searchQuery || categoryFilter !== 'all' || classificationFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setClassificationFilter('all');
                  setCurrentPage(1);
                }}
                className="h-9 text-xs text-charcoal-muted hover:text-charcoal"
              >
                {t('documents.clearFilters', 'Reset')}
              </Button>
            )}
          </div>
        </div>

        {/* Document Register View */}
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={5} columns={6} />
          </div>
        ) : documentsResult.data.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="h-10 w-10 text-charcoal-light mx-auto" />
            <p className="text-sm font-semibold text-charcoal">
              {t('documents.noDocumentsFound', 'No documents found')}
            </p>
            <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
              {t(
                'documents.noDocumentsDesc',
                'No records match the current filter criteria. Adjust your search or upload a new record.'
              )}
            </p>
            {(hasPermission('documents.upload') || isAdmin()) && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-forest-700 hover:bg-forest-800 text-white text-xs mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('documents.uploadFirstDocument', 'Upload New Document')}
              </Button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* Table Layout */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">{t('documents.referenceCode', 'Reference Code')}</TableHead>
                  <TableHead>{t('documents.titleAndCategory', 'Document Title & Category')}</TableHead>
                  <TableHead className="w-[80px]">{t('documents.version', 'Version')}</TableHead>
                  <TableHead className="w-[120px]">{t('documents.classification', 'Classification')}</TableHead>
                  <TableHead className="w-[110px]">{t('common.status', 'Status')}</TableHead>
                  <TableHead className="w-[110px]">{t('documents.effectiveDate', 'Date')}</TableHead>
                  <TableHead className="w-[130px] text-right">{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentsResult.data.map((doc) => {
                  const catName = doc.category
                    ? currentLang === 'sw'
                      ? doc.category.name_sw
                      : doc.category.name_en
                    : doc.category_id;

                  return (
                    <TableRow
                      key={doc.id}
                      onClick={() => handleOpenDetail(doc)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-mono text-xs font-semibold text-forest-800">
                        {doc.reference_number}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-charcoal text-xs hover:text-forest-700 leading-snug">
                            {doc.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] bg-surface-muted text-charcoal-muted px-1.5 py-0.5 rounded border border-surface-border">
                              {catName}
                            </span>
                            {doc.department_name && (
                              <span className="text-[10px] text-charcoal-muted">
                                • {doc.department_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-charcoal-900">
                          v{doc.current_version?.version_number || 1}.0
                        </span>
                      </TableCell>

                      <TableCell>{getClassificationBadge(doc.classification)}</TableCell>

                      <TableCell>{getStatusBadge(doc.status)}</TableCell>

                      <TableCell className="text-xs text-charcoal-muted">
                        {doc.document_date}
                      </TableCell>

                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(doc)}
                            className="h-7 px-2 text-xs text-charcoal-muted hover:text-forest-700"
                            title={t('common.view', 'View Details')}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {doc.current_version && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleDirectDownload(doc, e)}
                              className="h-7 px-2 text-xs text-charcoal-muted hover:text-forest-700"
                              title={t('common.download', 'Download File')}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Grid Cards Layout */
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentsResult.data.map((doc) => {
              const catName = doc.category
                ? currentLang === 'sw'
                  ? doc.category.name_sw
                  : doc.category.name_en
                : doc.category_id;

              return (
                <div
                  key={doc.id}
                  onClick={() => handleOpenDetail(doc)}
                  className="p-4 rounded-lg border border-surface-border bg-white hover:border-forest-400 hover: transition-all cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-forest-800">
                        {doc.reference_number}
                      </span>
                      {getStatusBadge(doc.status)}
                    </div>

                    <h3 className="text-xs font-semibold text-charcoal line-clamp-2 leading-snug">
                      {doc.title}
                    </h3>

                    <p className="text-[11px] text-charcoal-muted line-clamp-2 leading-relaxed">
                      {doc.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-surface-border space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-charcoal-muted">
                      <span>{catName}</span>
                      <span className="font-mono text-forest-700 font-semibold">
                        v{doc.current_version?.version_number || 1}.0
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {getClassificationBadge(doc.classification)}

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetail(doc)}
                          className="h-7 px-2 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {t('common.details', 'Details')}
                        </Button>
                        {doc.current_version && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => handleDirectDownload(doc, e)}
                            className="h-7 px-2 text-xs"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {documentsResult.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={documentsResult.totalPages}
            totalItems={documentsResult.total}
            pageSize={10}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </Card>

      {/* Modals */}
      <DocumentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        document={selectedDoc}
        onUploadNewVersion={(doc) => {
          setSelectedDoc(doc);
          setIsVersionModalOpen(true);
        }}
        onReviewApproval={(doc) => {
          setSelectedDoc(doc);
          setIsApprovalModalOpen(true);
        }}
        onArchive={(doc) => setDocToArchive(doc)}
        onRestore={(doc) => setDocToRestore(doc)}
      />

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        categories={categories}
        onSubmit={handleCreateDocument}
      />

      <UploadVersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        document={selectedDoc}
        onSubmit={handleUploadVersion}
      />

      <WorkflowApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        document={selectedDoc}
        onSubmit={handleApprovalDecision}
      />

      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCategoriesUpdated={loadCategories}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(docToArchive)}
        onClose={() => setDocToArchive(null)}
        onConfirm={handleConfirmArchive}
        title={t('documents.archiveConfirmTitle', 'Archive Organizational Record')}
        message={t(
          'documents.archiveConfirmMessage',
          'Are you sure you want to archive {{ref}}? Archived records will be hidden from general searches and marked as historical records.',
          { ref: docToArchive?.reference_number }
        )}
        confirmText={t('documents.archiveDocument', 'Archive Record')}
        cancelText={t('common.cancel', 'Cancel')}
        variant="danger"
        isLoading={isArchiving}
      />

      {/* Restore Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(docToRestore)}
        onClose={() => setDocToRestore(null)}
        onConfirm={handleConfirmRestore}
        title={t('documents.restoreConfirmTitle', 'Restore Archived Record')}
        message={t(
          'documents.restoreConfirmMessage',
          'Are you sure you want to restore {{ref}}? It will be returned to active draft status.',
          { ref: docToRestore?.reference_number }
        )}
        confirmText={t('documents.restoreDocument', 'Restore Record')}
        cancelText={t('common.cancel', 'Cancel')}
        variant="primary"
        isLoading={isArchiving}
      />
    </div>
  );
};
