/**
 * Project Documents & Evidence Registry View
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Provides Project Managers with an authorized, centralized registry of project charters,
 * proposals, donor agreements, activity evidence files, and field verifications.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Search,
  Filter,
  Download,
  ExternalLink,
  FolderOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Paperclip,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { getProjects, getAllActivities } from '../services/projectService';
import { getDocuments } from '@/features/documents/services/documentService';
import { ProjectRecord, ActivityRecord } from '../types/project';
import { DocumentRecord } from '@/features/documents/types/document';
import { useAuth } from '@/features/auth/useAuth';

export const ProjectDocumentsView: React.FC = () => {
  const { t } = useTranslation();
  const { user, roles } = useAuth();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<'all' | 'project_docs' | 'activity_evidence'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projData, docResult, actData] = await Promise.all([
        getProjects({}, user ? { id: user.id, role: roles[0] } : undefined),
        getDocuments({ page: 1, pageSize: 100 }),
        getAllActivities(),
      ]);
      setProjects(projData);
      setDocuments(docResult.data || []);
      setActivities(actData || []);
    } catch (err) {
      console.error('[ProjectDocumentsView] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, roles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate project documents and activity evidence files
  const unifiedFiles = useMemo(() => {
    interface UnifiedDoc {
      id: string;
      title: string;
      reference: string;
      sourceType: 'project_doc' | 'activity_evidence';
      projectName: string;
      projectId?: string;
      categoryOrType: string;
      date: string;
      ownerOrSubmitter: string;
      status: string;
      fileExtension?: string;
      fileSize?: number;
      filePath?: string;
    }

    const list: UnifiedDoc[] = [];

    // Project Documents from repository
    documents.forEach((d) => {
      const matchedProj = projects.find((p) => p.id === d.project_id);
      // Include if it's tied to a project or marked under project categories
      if (d.project_id || d.category?.code === 'PRJ' || d.category?.code === 'MNE' || d.category?.code === 'FIN') {
        list.push({
          id: d.id,
          title: d.title,
          reference: d.reference_number,
          sourceType: 'project_doc',
          projectName: matchedProj?.name || d.project_name || 'Organization Project Repository',
          projectId: d.project_id || undefined,
          categoryOrType: d.category?.name_en || 'Official Project Record',
          date: d.document_date || d.created_at,
          ownerOrSubmitter: d.owner_name || 'System',
          status: d.status,
          fileExtension: d.current_version?.file_extension || 'pdf',
          fileSize: d.current_version?.file_size,
          filePath: d.current_version?.file_path,
        });
      }
    });

    // Evidence attached to field activities
    activities.forEach((act) => {
      if (act.evidenceDocuments && act.evidenceDocuments.length > 0) {
        act.evidenceDocuments.forEach((ev) => {
          list.push({
            id: ev.id,
            title: ev.documentTitle || `${act.title} - Verification Evidence`,
            reference: ev.documentReference || 'ACT-DOC',
            sourceType: 'activity_evidence',
            projectName: act.projectName || 'Project Activity',
            projectId: act.projectId,
            categoryOrType: `Activity Evidence: ${act.title}`,
            date: ev.attachedAt || act.activityDate,
            ownerOrSubmitter: act.submittedByName || 'Coordinator',
            status: act.submissionStatus,
            fileExtension: 'pdf',
          });
        });
      }
    });

    return list;
  }, [documents, activities, projects]);

  const filteredFiles = useMemo(() => {
    return unifiedFiles.filter((item) => {
      if (selectedProjectId !== 'all' && item.projectId !== selectedProjectId) return false;
      if (documentTypeFilter === 'project_docs' && item.sourceType !== 'project_doc') return false;
      if (documentTypeFilter === 'activity_evidence' && item.sourceType !== 'activity_evidence') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.title.toLowerCase().includes(q) ||
          item.reference.toLowerCase().includes(q) ||
          item.projectName.toLowerCase().includes(q) ||
          item.categoryOrType.toLowerCase().includes(q) ||
          item.ownerOrSubmitter.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [unifiedFiles, selectedProjectId, documentTypeFilter, searchQuery]);

  const paginatedFiles = useMemo(() => {
    const from = (currentPage - 1) * pageSize;
    return filteredFiles.slice(from, from + pageSize);
  }, [filteredFiles, currentPage]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalProjectDocs = unifiedFiles.filter((f) => f.sourceType === 'project_doc').length;
  const totalEvidence = unifiedFiles.filter((f) => f.sourceType === 'activity_evidence').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('projects.documents.totalFiles', 'Total Files & Records')}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{unifiedFiles.length}</h3>
              <p className="text-xs text-gray-500 mt-1">Across managed projects</p>
            </div>
            <div className="p-2.5 rounded-lg border border-gray-200 text-gray-700 bg-gray-50">
              <FolderOpen className="w-5 h-5 text-gray-700" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('projects.documents.projectDocs', 'Project Charters & Memos')}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalProjectDocs}</h3>
              <p className="text-xs text-gray-500 mt-1">Proposals & formal records</p>
            </div>
            <div className="p-2.5 rounded-lg border border-gray-200 text-gray-700 bg-gray-50">
              <FileText className="w-5 h-5 text-gray-700" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('projects.documents.activityEvidence', 'Activity Evidence')}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalEvidence}</h3>
              <p className="text-xs text-gray-500 mt-1">Field verifications & photos</p>
            </div>
            <div className="p-2.5 rounded-lg border border-gray-200 text-gray-700 bg-gray-50">
              <Paperclip className="w-5 h-5 text-gray-700" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('projects.documents.storageStatus', 'Storage & Security')}
              </p>
              <h3 className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Cloudflare R2 / Secure
              </h3>
              <p className="text-xs text-gray-500 mt-1">RLS Encrypted Access</p>
            </div>
            <div className="p-2.5 rounded-lg border border-gray-200 text-gray-700 bg-gray-50">
              <RefreshCw className="w-5 h-5 text-gray-700 cursor-pointer" onClick={loadData} />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 bg-white border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('projects.documents.searchPlaceholder', 'Search documents by title, ref, project, or author...')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D68904] focus:border-[#D68904]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
            >
              <option value="all">{t('projects.allProjects', 'All Projects')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode ? `[${p.projectCode}] ` : ''}{p.name}
                </option>
              ))}
            </select>

            <select
              value={documentTypeFilter}
              onChange={(e) => {
                setDocumentTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
            >
              <option value="all">{t('projects.documents.allTypes', 'All Sources')}</option>
              <option value="project_docs">{t('projects.documents.chartersOnly', 'Project Charters & Memos')}</option>
              <option value="activity_evidence">{t('projects.documents.evidenceOnly', 'Field Activity Evidence')}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Documents Table */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden bg-white">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-gray-300 border-t-[#D68904] rounded-full mb-2" />
            <p>{t('common.loading', 'Loading project documents...')}</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title={t('projects.documents.emptyTitle', 'No documents found')}
              description={t(
                'projects.documents.emptyDesc',
                'No project documents or activity verification files match the selected filters.'
              )}
            />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3.5">{t('projects.documents.colDocument', 'Document & Ref')}</th>
                    <th className="px-4 py-3.5">{t('projects.documents.colProject', 'Associated Project')}</th>
                    <th className="px-4 py-3.5">{t('projects.documents.colType', 'Source / Category')}</th>
                    <th className="px-4 py-3.5">{t('projects.documents.colDate', 'Date Attached')}</th>
                    <th className="px-4 py-3.5">{t('projects.documents.colAuthor', 'Uploaded By')}</th>
                    <th className="px-4 py-3.5">{t('projects.documents.colStatus', 'Status')}</th>
                    <th className="px-4 py-3.5 text-right">{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedFiles.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 rounded bg-gray-100 border border-gray-200 text-gray-700 mt-0.5">
                            <FileText className="w-4 h-4 text-gray-700" />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 block">{doc.title}</span>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                              <span className="font-mono bg-gray-100 px-1.5 py-0.2 rounded text-gray-600">
                                {doc.reference}
                              </span>
                              {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-medium text-gray-900 block max-w-xs truncate">
                          {doc.projectName}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                          {doc.sourceType === 'activity_evidence' ? (
                            <Paperclip className="w-3 h-3 text-gray-600" />
                          ) : (
                            <FolderOpen className="w-3 h-3 text-gray-600" />
                          )}
                          <span className="truncate max-w-[160px]">{doc.categoryOrType}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                        {doc.date ? new Date(doc.date).toLocaleDateString() : '—'}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-gray-700">
                        {doc.ownerOrSubmitter}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded capitalize bg-gray-100 text-gray-800 border border-gray-200">
                          {doc.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="px-2.5 py-1 text-xs border border-gray-300 text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                              alert(`Secure file preview: ${doc.title} (${doc.reference})`);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-gray-700" />
                            {t('common.view', 'View')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredFiles.length > pageSize && (
              <div className="p-4 border-t border-gray-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredFiles.length / pageSize)}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
