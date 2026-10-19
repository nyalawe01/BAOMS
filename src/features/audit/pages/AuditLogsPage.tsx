import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Download,
  Eye,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterControls } from '@/components/ui/FilterControls';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/lib/ToastContext';
import {
  getAuditLogs,
  exportAuditLogsToCsv,
} from '../services/auditService';
import { AuditLogRecord, AuditActionCategory } from '../types/audit';

export const AuditLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<AuditActionCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAuditLogs({
        category: categoryFilter,
        search: searchQuery,
        page: currentPage,
        pageSize: 10,
      });
      setLogs(res.logs);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      showToast({
        title: 'Audit Retrieval Failed',
        message: 'Could not query audit register.',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, searchQuery, currentPage, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCsv = () => {
    if (logs.length === 0) {
      showToast({
        title: 'Export Empty',
        message: 'No audit records match the selected filter criteria.',
        variant: 'warning',
      });
      return;
    }

    const csvData = exportAuditLogsToCsv(logs);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BAOMS_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      title: 'Audit Trail Exported',
      message: `${logs.length} audit entries exported with formula injection protection.`,
      variant: 'success',
    });
  };

  const filterOptions = [
    { id: 'all', label: t('audit.allCategories', 'All Categories') },
    { id: 'AUTH', label: 'Auth' },
    { id: 'HR', label: 'HR' },
    { id: 'FINANCE', label: 'Finance' },
    { id: 'DOCUMENTS', label: 'Documents' },
    { id: 'CORRESPONDENCE', label: 'Correspondence' },
    { id: 'SYSTEM', label: 'System' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('audit.pageTitle', 'Institutional Audit Trail')}
        subtitle={t(
          'audit.pageSubtitle',
          'Immutable, timestamped register of administrative events, security checks, and cross-module transactions.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('nav.auditLogs', 'Audit Logs') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCsv}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              <span>{t('audit.exportCsv', 'Export Audit CSV')}</span>
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>{t('audit.filterTitle', 'Audit Events Register')}</CardTitle>
              <CardDescription>
                {t('audit.filterDesc', 'Search across actors, entity references, and event descriptions.')}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                placeholder={t('audit.searchPlaceholder', 'Search actor, action, or entity ID...')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-72"
              />
            </div>
          </div>
          <div className="pt-2">
            <FilterControls
              options={filterOptions}
              activeFilter={categoryFilter}
              onSelectFilter={(id: string) => {
                setCategoryFilter(id as AuditActionCategory | 'all');
                setCurrentPage(1);
              }}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('audit.timestamp', 'Timestamp')}</TableHead>
                  <TableHead>{t('audit.actor', 'Actor / Role')}</TableHead>
                  <TableHead>{t('audit.category', 'Category')}</TableHead>
                  <TableHead>{t('audit.action', 'Action Code')}</TableHead>
                  <TableHead>{t('audit.entity', 'Target Entity')}</TableHead>
                  <TableHead>{t('audit.details', 'Event Summary')}</TableHead>
                  <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-7 w-16 ml-auto rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-charcoal-muted">
                      <div className="flex flex-col items-center justify-center py-6">
                        <ShieldAlert className="h-8 w-8 text-charcoal-300 mb-2" />
                        <span className="font-medium">{t('audit.noRecords', 'No audit logs match current filters.')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap font-mono tabular-nums text-charcoal-muted text-xs">
                        {new Date(log.createdAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-charcoal">{log.actorName}</div>
                        <div className="text-[11px] text-charcoal-light font-mono">{log.actorRole}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-charcoal-900">
                          {log.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-charcoal">
                        {log.action}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-medium text-charcoal-800">
                          {log.entityId}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-md truncate text-xs text-charcoal-muted">
                        {log.details}
                      </TableCell>
                      <TableCell isNumeric>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsDetailModalOpen(true);
                          }}
                          aria-label="View Audit Record Details"
                        >
                          <Eye className="h-4 w-4 mr-1 text-charcoal-muted" />
                          <span className="text-xs">{t('common.view', 'View')}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-surface-border">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={10}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspect Modal */}
      {selectedLog && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={t('audit.modalTitle', 'Audit Record Inspector')}
          size="lg"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-surface-border bg-surface-muted/30 p-3">
                <span className="text-charcoal-muted block mb-0.5">{t('audit.recordId', 'Audit Record ID')}</span>
                <span className="font-mono font-semibold text-charcoal">{selectedLog.id}</span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-muted/30 p-3">
                <span className="text-charcoal-muted block mb-0.5">{t('audit.timestamp', 'Timestamp (UTC)')}</span>
                <span className="font-mono tabular-nums font-semibold text-charcoal">
                  {selectedLog.createdAt}
                </span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-muted/30 p-3">
                <span className="text-charcoal-muted block mb-0.5">{t('audit.actor', 'Actor / User ID')}</span>
                <span className="font-medium text-charcoal">{selectedLog.actorName}</span>
                <div className="font-mono text-[11px] text-charcoal-light truncate">{selectedLog.actorId}</div>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-muted/30 p-3">
                <span className="text-charcoal-muted block mb-0.5">{t('audit.ipAddress', 'Client IP & Origin')}</span>
                <span className="font-mono text-charcoal">{selectedLog.ipAddress || '127.0.0.1'}</span>
              </div>
            </div>

            <div className="rounded-lg border border-surface-border p-3 space-y-2">
              <span className="text-xs font-semibold text-charcoal block">{t('audit.eventSummary', 'Event Summary')}</span>
              <p className="text-xs text-charcoal-muted leading-relaxed">{selectedLog.details}</p>
            </div>

            {selectedLog.metadata && (
              <div className="rounded-lg border border-surface-border p-3 space-y-2">
                <span className="text-xs font-semibold text-charcoal block">{t('audit.metadata', 'Structured Metadata Payload')}</span>
                <pre className="font-mono text-[11px] bg-slate-900 text-slate-100 p-3 rounded-md overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
              >
                {t('common.close', 'Close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
