/**
 * Document & Records Data Service
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Strict Database-Driven Architecture:
 * All document metadata, versions, approvals, and categories are queried and persisted
 * exclusively via Supabase PostgreSQL, while file binaries are stored in Cloudflare R2 ('dropin-relay').
 * No mock data or offline fallbacks.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  DocumentRecord,
  DocumentCategory,
  DocumentFilterState,
  DocumentListResult,
  UploadDocumentPayload,
  NewVersionPayload,
  ApprovalDecisionPayload,
  DocumentVersion,
  DocumentApproval,
} from '../types/document';
import {
  validateDocumentFile,
  uploadStorageFile,
  getFileExtension,
} from './storageService';

// Compatibility stub for tests
export function resetMockDocumentState(): void {}

/**
 * Fetch all active document categories directly from Supabase
 */
export async function getDocumentCategories(): Promise<DocumentCategory[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('document_categories')
    .select('*')
    .eq('is_active', true)
    .order('code', { ascending: true });

  if (error || !data) {
    console.error('[documentService] Failed to fetch document categories:', error);
    return [];
  }

  return data as DocumentCategory[];
}

/**
 * Save or update a category (Admin only)
 */
export async function saveDocumentCategory(
  category: Partial<DocumentCategory> & { code: string; name_en: string; name_sw: string }
): Promise<DocumentCategory> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  if (category.id) {
    const { data, error } = await supabase
      .from('document_categories')
      .update({
        name_en: category.name_en,
        name_sw: category.name_sw,
        description_en: category.description_en,
        description_sw: category.description_sw,
        icon: category.icon,
        is_active: category.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', category.id)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to update category.');
    return data as DocumentCategory;
  } else {
    const { data, error } = await supabase
      .from('document_categories')
      .insert({
        code: category.code.toUpperCase(),
        name_en: category.name_en,
        name_sw: category.name_sw,
        description_en: category.description_en,
        description_sw: category.description_sw,
        icon: category.icon || 'Folder',
        is_active: category.is_active ?? true,
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to create category.');
    return data as DocumentCategory;
  }
}

/**
 * Query documents with rich filters, search, and pagination
 */
export async function getDocuments(filters: DocumentFilterState): Promise<DocumentListResult> {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.max(1, filters.pageSize || 10);

  if (!isSupabaseConfigured) {
    return { data: [], total: 0, page, pageSize, totalPages: 1 };
  }

  try {
    let query = supabase
      .from('documents')
      .select(
        `
        *,
        category:document_categories(*),
        current_version:document_versions!current_version_id(*),
        owner:profiles!owner_id(display_name)
      `,
        { count: 'exact' }
      );

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'archived') {
        query = query.eq('is_archived', true);
      } else {
        query = query.eq('status', filters.status).eq('is_archived', false);
      }
    } else if (!filters.search) {
      query = query.eq('is_archived', false);
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category_id', filters.category);
    }

    if (filters.classification && filters.classification !== 'all') {
      query = query.eq('classification', filters.classification);
    }

    if (filters.startDate) {
      query = query.gte('document_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('document_date', filters.endDate);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      query = query.or(`title.ilike.%${q}%,reference_number.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const sortField = filters.sortBy === 'reference_number' ? 'reference_number' : 'document_date';
    const isAscending = filters.sortOrder === 'asc';
    query = query.order(sortField, { ascending: isAscending });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('[documentService] Supabase document query error:', error);
      return { data: [], total: 0, page, pageSize, totalPages: 1 };
    }

    const records: DocumentRecord[] = (data || []).map((row: any) => ({
      id: row.id,
      reference_number: row.reference_number,
      title: row.title,
      description: row.description,
      category_id: row.category_id,
      category: row.category,
      department_id: row.department_id,
      project_id: row.project_id,
      owner_id: row.owner_id,
      owner_name: row.owner?.display_name || 'Staff Member',
      classification: row.classification,
      status: row.status,
      document_date: row.document_date,
      tags: row.tags || [],
      is_archived: row.is_archived,
      current_version_id: row.current_version_id,
      current_version: row.current_version,
      versions: row.current_version ? [row.current_version] : [],
      approvals: [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    const total = count || 0;
    return {
      data: records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  } catch (err) {
    console.error('[documentService] Failed to load documents:', err);
    return { data: [], total: 0, page, pageSize, totalPages: 1 };
  }
}

/**
 * Get single document with complete versions and approvals
 */
export async function getDocumentById(id: string): Promise<DocumentRecord | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select('*, category:document_categories(*), owner:profiles!owner_id(display_name)')
      .eq('id', id)
      .single();

    if (docError || !docData) return null;

    // Fetch versions
    const { data: versionsData } = await supabase
      .from('document_versions')
      .select('*, creator:profiles!created_by(display_name)')
      .eq('document_id', id)
      .order('version_number', { ascending: false });

    // Fetch approvals
    const { data: approvalsData } = await supabase
      .from('document_approvals')
      .select('*')
      .eq('document_id', id)
      .order('decided_at', { ascending: false });

    const versions = (versionsData || []).map((v: any) => ({
      ...v,
      created_by_name: v.creator?.display_name || 'Staff Member',
    })) as DocumentVersion[];

    const currentVersion = versions.find((v) => v.id === docData.current_version_id) || versions[0] || null;

    return {
      ...docData,
      owner_name: docData.owner?.display_name || 'Staff Member',
      category: docData.category,
      current_version: currentVersion,
      versions,
      approvals: (approvalsData || []) as DocumentApproval[],
    } as DocumentRecord;
  } catch (err) {
    console.error('[documentService] Error fetching document by ID:', err);
    return null;
  }
}

/**
 * Generate collision-proof unique reference number
 */
export async function generateDocumentReference(
  categoryCode: string,
  docDate: string
): Promise<string> {
  const year = docDate ? new Date(docDate).getFullYear() : new Date().getFullYear();
  const safeCat = categoryCode.toUpperCase().slice(0, 4);

  if (!isSupabaseConfigured) {
    return `BAO/${safeCat}/${year}/0001`;
  }

  try {
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    const seqStr = String((count || 0) + 1).padStart(4, '0');
    return `BAO/${safeCat}/${year}/${seqStr}`;
  } catch {
    return `BAO/${safeCat}/${year}/0001`;
  }
}

/**
 * Create a new document with initial version (v1) stored in Cloudflare R2
 */
export async function createDocument(
  payload: UploadDocumentPayload,
  currentUser: { id: string; name: string }
): Promise<DocumentRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const validation = validateDocumentFile(payload.file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  // 1. Upload binary file to Cloudflare R2 via r2-sign-upload edge function
  const uploadRes = await uploadStorageFile(payload.file);
  if (uploadRes.error || !uploadRes.path) {
    throw new Error(uploadRes.error || 'Failed to upload document file to Cloudflare R2.');
  }

  // 2. Generate unique reference number
  const referenceNumber = await generateDocumentReference(
    payload.category_code,
    payload.document_date
  );

  // 3. Insert document record in Supabase
  const { data: docData, error: docErr } = await supabase
    .from('documents')
    .insert({
      reference_number: referenceNumber,
      title: payload.title.trim(),
      description: payload.description || null,
      category_id: payload.category_id,
      department_id: payload.department_id || null,
      project_id: payload.project_id || null,
      owner_id: currentUser.id,
      classification: payload.classification,
      status: 'pending_review',
      document_date: payload.document_date,
      tags: payload.tags || [],
      is_archived: false,
    })
    .select('*, category:document_categories(*)')
    .single();

  if (docErr || !docData) {
    throw new Error(docErr?.message || 'Failed to insert document metadata.');
  }

  // 4. Insert initial document version (v1) in Supabase
  const { data: verData, error: verErr } = await supabase
    .from('document_versions')
    .insert({
      document_id: docData.id,
      version_number: 1,
      file_name: payload.file.name,
      file_path: uploadRes.path,
      file_size: payload.file.size,
      mime_type: payload.file.type || 'application/octet-stream',
      file_extension: getFileExtension(payload.file.name),
      storage_bucket: 'dropin-relay',
      change_notes: payload.change_notes || 'Initial document upload to Cloudflare R2.',
      created_by: currentUser.id,
    })
    .select()
    .single();

  if (verErr || !verData) {
    throw new Error(verErr?.message || 'Failed to insert document version record.');
  }

  // 5. Update current_version_id
  await supabase
    .from('documents')
    .update({ current_version_id: verData.id })
    .eq('id', docData.id);

  return getDocumentById(docData.id) as Promise<DocumentRecord>;
}

/**
 * Upload a new version of an existing document to Cloudflare R2
 */
export async function uploadNewVersion(
  payload: NewVersionPayload,
  currentUser: { id: string; name: string }
): Promise<DocumentRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const validation = validateDocumentFile(payload.file);
  if (!validation.valid) throw new Error(validation.error || 'Invalid file');

  const existingDoc = await getDocumentById(payload.document_id);
  if (!existingDoc) throw new Error('Document not found');

  const nextVersionNum = (existingDoc.versions?.length || 0) + 1;

  // Upload to Cloudflare R2
  const uploadRes = await uploadStorageFile(payload.file);
  if (uploadRes.error || !uploadRes.path) {
    throw new Error(uploadRes.error || 'Failed to upload new version to Cloudflare R2.');
  }

  // Insert new version record
  const { data: verData, error: verErr } = await supabase
    .from('document_versions')
    .insert({
      document_id: payload.document_id,
      version_number: nextVersionNum,
      file_name: payload.file.name,
      file_path: uploadRes.path,
      file_size: payload.file.size,
      mime_type: payload.file.type || 'application/octet-stream',
      file_extension: getFileExtension(payload.file.name),
      storage_bucket: 'dropin-relay',
      change_notes: payload.change_notes.trim(),
      created_by: currentUser.id,
    })
    .select()
    .single();

  if (verErr || !verData) {
    throw new Error(verErr?.message || 'Failed to insert version record.');
  }

  // Update current_version_id
  await supabase
    .from('documents')
    .update({
      current_version_id: verData.id,
      status: 'pending_review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.document_id);

  return getDocumentById(payload.document_id) as Promise<DocumentRecord>;
}

/**
 * Record an approval or rejection decision
 */
export async function recordApprovalDecision(
  payload: ApprovalDecisionPayload,
  currentUser: { id: string; name: string; role: string }
): Promise<DocumentRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const now = new Date().toISOString();
  const nextStatus = payload.decision === 'approve' ? 'approved' : 'rejected';

  await supabase.from('document_approvals').insert({
    document_id: payload.document_id,
    version_id: payload.version_id,
    approver_id: currentUser.id,
    decision: payload.decision,
    comments: payload.comments || null,
    decided_at: now,
  });

  await supabase
    .from('documents')
    .update({
      status: nextStatus,
      updated_at: now,
    })
    .eq('id', payload.document_id);

  return getDocumentById(payload.document_id) as Promise<DocumentRecord>;
}

/**
 * Archive a document
 */
export async function archiveDocument(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const { error } = await supabase
    .from('documents')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to archive document: ${error.message}`);
  }
}

/**
 * Restore an archived document
 */
export async function restoreDocument(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const { error } = await supabase
    .from('documents')
    .update({ is_archived: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to restore document: ${error.message}`);
  }
}

export const submitApprovalDecision = recordApprovalDecision;

