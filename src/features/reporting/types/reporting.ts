/**
 * BAOMS Phase 10: Cross-Module Reporting & Export Domain Types
 * Babawatoto Organization Management System
 */

export type ReportCategory =
  | 'documents'
  | 'projects'
  | 'finance'
  | 'hr'
  | 'actions'
  | 'correspondence';

export interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  departmentId?: string;
  status?: string;
  search?: string;
}

export interface ReportColumn {
  key: string;
  header: string;
  type?: 'string' | 'number' | 'date' | 'currency' | 'badge';
}

export interface ReportMetadata {
  reportId: string;
  reportTitle: string;
  reportCategory: ReportCategory;
  generatedAt: string;
  generatedByName: string;
  rowCount: number;
  dateRangeLabel: string;
}

export interface ReportDataSet {
  metadata: ReportMetadata;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
}

export interface ExportReportOptions {
  filename?: string;
  includeBOM?: boolean;
  maskConfidential?: boolean;
}
