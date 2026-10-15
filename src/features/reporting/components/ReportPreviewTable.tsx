import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportDataSet } from '../types/reporting';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface ReportPreviewTableProps {
  report: ReportDataSet | null;
  isLoading: boolean;
}

export const ReportPreviewTable: React.FC<ReportPreviewTableProps> = ({
  report,
  isLoading,
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  if (isLoading) {
    return (
      <div className="py-16 text-center text-charcoal-muted rounded-xl border border-surface-border bg-surface-card">
        <div className="inline-block animate-spin h-6 w-6 border-2 border-[#D68904] border-t-transparent rounded-full mb-2" />
        <p className="text-sm">{t('reports.compilingData', 'Compiling authorized operational dataset...')}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-16 text-center text-charcoal-muted rounded-xl border border-dashed border-surface-border bg-surface-card">
        <FileText className="h-8 w-8 mx-auto text-charcoal-300 mb-2" />
        <p className="text-sm font-semibold">{t('reports.selectReportToRun', 'Configure filters above and run a report to preview data.')}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(report.rows.length / pageSize) || 1;
  const paginatedRows = report.rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="rounded-lg border border-surface-border bg-surface-card overflow-hidden space-y-0">
      {/* Report Metadata Banner */}
      <div className="p-4 border-b border-surface-border bg-surface-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-charcoal-900">{report.metadata.reportTitle}</h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-muted mt-0.5">
            <span>Generated: {new Date(report.metadata.generatedAt).toLocaleString()}</span>
            <span>•</span>
            <span>By: <strong>{report.metadata.generatedByName}</strong></span>
            <span>•</span>
            <span>Scope: {report.metadata.dateRangeLabel}</span>
          </div>
        </div>
        <div className="text-xs font-bold px-2.5 py-1 rounded bg-forest-50 text-forest-800 border border-forest-200">
          {report.rows.length} {t('reports.recordsFound', 'Records')}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-muted/60 text-charcoal-600 font-semibold border-b border-surface-border uppercase tracking-wider">
            <tr>
              {report.columns.map((col) => (
                <th key={col.key} className="py-3 px-4">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border text-charcoal-800">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={report.columns.length} className="py-12 text-center text-charcoal-muted">
                  {t('reports.noMatchingRows', 'No records match the configured filter criteria.')}
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-surface-muted/20 transition-colors">
                  {report.columns.map((col) => {
                    const cellVal = String(row[col.key] ?? '—');
                    if (col.type === 'badge') {
                      return (
                        <td key={col.key} className="py-3 px-4">
                          <StatusIndicator status={cellVal} label={cellVal} />
                        </td>
                      );
                    }
                    if (col.type === 'currency') {
                      return (
                        <td key={col.key} className="py-3 px-4 font-mono font-semibold text-charcoal-900">
                          {cellVal}
                        </td>
                      );
                    }
                    return (
                      <td key={col.key} className="py-3 px-4 font-medium">
                        {cellVal}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-surface-border bg-surface-muted/20 flex items-center justify-between text-xs text-charcoal-muted">
          <span>
            Page {currentPage} of {totalPages} ({report.rows.length} total entries)
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
