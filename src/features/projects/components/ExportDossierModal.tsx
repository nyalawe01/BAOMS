import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProjectRecord, ActivityRecord, TaskRecord, ProjectReportRecord } from '../types/project';
import { exportProjectDossierToWord, exportProjectDossierToExcel } from '../utils/exportProjectDossier';

interface ExportDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectRecord;
  activities: ActivityRecord[];
  tasks: TaskRecord[];
  reports: ProjectReportRecord[];
  procurementItems?: any[];
}

export const ExportDossierModal: React.FC<ExportDossierModalProps> = ({
  isOpen,
  onClose,
  project,
  activities,
  tasks,
  reports,
  procurementItems = [],
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'word' | 'excel' | 'pdf'>('word');
  const [includeNarratives, setIncludeNarratives] = useState(true);
  const [includeQuotes, setIncludeQuotes] = useState(true);
  const [includeDemographics, setIncludeDemographics] = useState(true);
  const [includeFinances, setIncludeFinances] = useState(true);
  const [includeProcurement, setIncludeProcurement] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExecuteExport = async () => {
    setIsExporting(true);
    try {
      if (selectedFormat === 'word') {
        exportProjectDossierToWord(
          project,
          activities,
          tasks,
          reports,
          includeProcurement ? procurementItems : []
        );
      } else if (selectedFormat === 'excel') {
        exportProjectDossierToExcel(
          project,
          activities,
          tasks,
          reports,
          includeProcurement ? procurementItems : []
        );
      } else if (selectedFormat === 'pdf') {
        window.print();
      }
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Export Project Analytics & Dossier">
      <div className="space-y-5">
        <p className="text-xs text-slate-600 dark:text-neutral-400">
          Generate an executive analytical dossier for <strong className="text-slate-900 dark:text-white">{project.name}</strong> ({project.projectCode}).
          Includes comprehensive field narratives, participant feedback, demographic analytics, financial utilization, and procurement logs.
        </p>

        {/* Format Selector */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 block mb-2">
            Select Export Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Word Card */}
            <div
              onClick={() => setSelectedFormat('word')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedFormat === 'word'
                  ? 'border-[#D68904] bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">Word (.doc)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Formatted Word document with integrated spreadsheet tables, long-form narratives, and quotes.
              </p>
            </div>

            {/* Excel Card */}
            <div
              onClick={() => setSelectedFormat('excel')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedFormat === 'excel'
                  ? 'border-[#D68904] bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">Excel (.xlsx)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Multi-sheet structured workbook with raw data, demographics, indicators, and budget.
              </p>
            </div>

            {/* PDF Card */}
            <div
              onClick={() => setSelectedFormat('pdf')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedFormat === 'pdf'
                  ? 'border-[#D68904] bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Printer className="w-5 h-5 text-slate-700 dark:text-neutral-300" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">Print / PDF</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Optimized layout ready for donor presentation, printing, or PDF generation.
              </p>
            </div>
          </div>
        </div>

        {/* Inclusions checklist */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 block mb-2">
            Included Analytical Modules
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNarratives}
                onChange={(e) => setIncludeNarratives(e.target.checked)}
                className="rounded border-slate-300 text-[#D68904] focus:ring-[#D68904]"
              />
              <span>Full Field Session Narratives & Methodology</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeQuotes}
                onChange={(e) => setIncludeQuotes(e.target.checked)}
                className="rounded border-slate-300 text-[#D68904] focus:ring-[#D68904]"
              />
              <span>Participant Quotes & Community Voices</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDemographics}
                onChange={(e) => setIncludeDemographics(e.target.checked)}
                className="rounded border-slate-300 text-[#D68904] focus:ring-[#D68904]"
              />
              <span>Demographic Tables & Cluster Distribution</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeFinances}
                onChange={(e) => setIncludeFinances(e.target.checked)}
                className="rounded border-slate-300 text-[#D68904] focus:ring-[#D68904]"
              />
              <span>Financial Utilization & Burn Rate</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/50 cursor-pointer sm:col-span-2">
              <input
                type="checkbox"
                checked={includeProcurement}
                onChange={(e) => setIncludeProcurement(e.target.checked)}
                className="rounded border-slate-300 text-[#D68904] focus:ring-[#D68904]"
              />
              <span>Procurement & Supplies Fulfillment Register</span>
            </label>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-neutral-800">
          <span className="text-[11px] text-slate-500">
            {activities.length} activities • {tasks.length} tasks • {procurementItems.length} procurement items
          </span>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExecuteExport}
              isLoading={isExporting}
              className="bg-[#D68904] hover:bg-[#b45309] text-white flex items-center gap-1.5 text-xs font-semibold"
            >
              <Download className="w-4 h-4" />
              <span>Generate & Download</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
