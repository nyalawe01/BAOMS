import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReportCategory, ReportFilterParams } from '../types/reporting';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  FileSpreadsheet,
  Play,
  Search,
  Filter,
} from 'lucide-react';

interface ReportFiltersCardProps {
  selectedCategory: ReportCategory;
  onSelectCategory: (cat: ReportCategory) => void;
  filters: ReportFilterParams;
  onFilterChange: (filters: ReportFilterParams) => void;
  onGenerate: () => void;
  onExport: () => void;
  isLoading: boolean;
  canExport: boolean;
}

export const ReportFiltersCard: React.FC<ReportFiltersCardProps> = ({
  selectedCategory,
  onSelectCategory,
  filters,
  onFilterChange,
  onGenerate,
  onExport,
  isLoading,
  canExport,
}) => {
  const { t } = useTranslation();

  const categories: Array<{ id: ReportCategory; label: string }> = [
    { id: 'projects', label: 'Projects & Programs' },
    { id: 'finance', label: 'Finance & Budgets' },
    { id: 'hr', label: 'Human Resources' },
    { id: 'documents', label: 'Documents & Records' },
    { id: 'correspondence', label: 'Correspondence' },
    { id: 'actions', label: 'Task Deliverables & Governance' },
  ];

  return (
    <Card className="border border-surface-border bg-white">
      <CardContent className="p-5 space-y-5">
        {/* Category Pills */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
            1. Select Operational Report Domain
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#D68904] text-white shadow-xs'
                    : 'bg-white border border-surface-border text-charcoal-700 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter controls */}
        <div className="pt-3 border-t border-surface-border space-y-3">
          <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-[#374151]" />
            2. Configure Filter Parameters
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#374151]" />
              <input
                type="text"
                placeholder={t('reports.searchPlaceholder', 'Filter by title, reference, or name...')}
                value={filters.search || ''}
                onChange={(e) =>
                  onFilterChange({ ...filters, search: e.target.value })
                }
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-surface-border bg-white text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
              />
            </div>

            <div>
              <select
                value={filters.status || 'all'}
                onChange={(e) =>
                  onFilterChange({ ...filters, status: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-surface-border bg-white text-charcoal-700 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
              >
                <option value="all">Status: All Records</option>
                <option value="approved">Status: Approved / Active</option>
                <option value="pending">Status: Pending / In Progress</option>
                <option value="overdue">Status: Overdue</option>
                <option value="dispatched">Status: Dispatched</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) =>
                  onFilterChange({ ...filters, startDate: e.target.value })
                }
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-surface-border bg-surface-card"
                title="Start Date"
              />
              <span className="text-xs text-charcoal-muted">to</span>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) =>
                  onFilterChange({ ...filters, endDate: e.target.value })
                }
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-surface-border bg-surface-card"
                title="End Date"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerate}
            isLoading={isLoading}
            className="text-[#374151]"
          >
            <Play className="h-4 w-4 mr-1.5 text-[#374151]" />
            {t('reports.refreshReport', 'Run Report')}
          </Button>

          {canExport && (
            <Button
              variant="primary"
              size="sm"
              onClick={onExport}
              disabled={isLoading}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1.5 text-[#111827]" />
              {t('reports.exportCsv', 'Export CSV')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
