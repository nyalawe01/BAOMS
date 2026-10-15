import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportCategory, ReportFilterParams, ReportDataSet } from '../types/reporting';
import { generateReport } from '../services/reportingService';
import { downloadReportAsCsv } from '../utils/exportSanitizer';
import { useAuth } from '@/features/auth/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { ReportFiltersCard } from '../components/ReportFiltersCard';
import { ReportPreviewTable } from '../components/ReportPreviewTable';
import { AlertCircle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile, roles, hasPermission, isAdmin } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('projects');
  const [filters, setFilters] = useState<ReportFilterParams>({ status: 'all' });
  const [reportData, setReportData] = useState<ReportDataSet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canExport = hasPermission('reports.export') || isAdmin();

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateReport(
        selectedCategory,
        filters,
        {
          id: user?.id || 'sys-admin',
          displayName: profile?.display_name || user?.email || 'System Administrator',
          roles,
        }
      );
      setReportData(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to generate operational report.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, filters, user, profile, roles]);

  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleExport = () => {
    if (!reportData) return;
    try {
      downloadReportAsCsv(reportData);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to export CSV report.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('reports.title', 'Reports & Analytical Audits')}
        subtitle={t(
          'reports.subtitle',
          'Generate authorized operational registers, governance audit sheets, and export formula-injection protected spreadsheets.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('nav.reports', 'Reports & Analytics') },
        ]}
      />

      {error && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Configuration Card */}
      <ReportFiltersCard
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setFilters({ status: 'all' });
        }}
        filters={filters}
        onFilterChange={setFilters}
        onGenerate={handleGenerate}
        onExport={handleExport}
        isLoading={isLoading}
        canExport={canExport}
      />

      {/* Data Preview Table */}
      <ReportPreviewTable report={reportData} isLoading={isLoading} />
    </div>
  );
};
