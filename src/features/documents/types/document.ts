/**
 * Document & Records Management Domain Types
 * Babawatoto Organization Management System (BAOMS)
 */

export type DocumentClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export type DocumentStatus = 'draft' | 'pending_review' | 'approved' | 'superseded' | 'archived';

export type ApprovalDecision = 'approved' | 'rejected' | 'amendments_requested';

export interface DocumentCategory {
  id: string;
  code: string;
  name_en: string;
  name_sw: string;
  description_en: string | null;
  description_sw: string | null;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_extension: string;
  storage_bucket: string;
  checksum_sha256?: string | null;
  change_notes: string | null;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export interface DocumentApproval {
  id: string;
  document_id: string;
  version_id?: string | null;
  reviewer_id: string;
  reviewer_name?: string;
  reviewer_role?: string;
  status: ApprovalDecision;
  comments: string;
  decided_at: string;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  reference_number: string;
  title: string;
  description: string | null;
  category_id: string;
  category?: DocumentCategory;
  department_id: string | null;
  department_name?: string;
  project_id: string | null;
  project_name?: string;
  owner_id: string;
  owner_name?: string;
  classification: DocumentClassification;
  status: DocumentStatus;
  document_date: string;
  tags: string[];
  is_archived: boolean;
  current_version_id: string | null;
  current_version?: DocumentVersion | null;
  versions?: DocumentVersion[];
  approvals?: DocumentApproval[];
  created_at: string;
  updated_at: string;
}

export interface DocumentFilterState {
  search?: string;
  category?: string;
  department?: string;
  status?: string;
  classification?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
  sortBy?: 'document_date' | 'created_at' | 'title' | 'reference_number';
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentListResult {
  data: DocumentRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UploadDocumentPayload {
  title: string;
  description?: string;
  category_id: string;
  category_code: string;
  department_id?: string;
  project_id?: string;
  classification: DocumentClassification;
  document_date: string;
  tags: string[];
  file: File;
  change_notes?: string;
}

export interface NewVersionPayload {
  document_id: string;
  category_code: string;
  file: File;
  change_notes: string;
}

export interface ApprovalDecisionPayload {
  document_id: string;
  version_id?: string;
  status: ApprovalDecision;
  comments: string;
}
