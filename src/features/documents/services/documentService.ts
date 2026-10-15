/**
 * Document & Records Data Service
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Provides unified data access for documents, versioning, approvals,
 * and categories with dual-mode support (Live Supabase & Mock In-Memory).
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
import { MOCK_CATEGORIES, MOCK_DOCUMENTS } from '../data/mockDocuments';
import {
  validateDocumentFile,
  generateStoragePath,
  uploadStorageFile,
  deleteStorageFile,
  getFileExtension,
} from './storageService';
import { getPersistentItem, setPersistentItem } from '@/lib/storageSync';

const DOC_STORAGE_KEYS = {
  DOCUMENTS: 'baoms_documents',
  CATEGORIES: 'baoms_document_categories',
};

// In-memory persistent state for offline/demo operation
let inMemoryDocuments: DocumentRecord[] = getPersistentItem(DOC_STORAGE_KEYS.DOCUMENTS, () =>
  JSON.parse(JSON.stringify(MOCK_DOCUMENTS))
);
let inMemoryCategories: DocumentCategory[] = getPersistentItem(DOC_STORAGE_KEYS.CATEGORIES, () =>
  JSON.parse(JSON.stringify(MOCK_CATEGORIES))
);
let referenceCounter = 20;

export function resetMockDocumentState(): void {
  inMemoryDocuments = JSON.parse(JSON.stringify(MOCK_DOCUMENTS));
  inMemoryCategories = JSON.parse(JSON.stringify(MOCK_CATEGORIES));
  setPersistentItem(DOC_STORAGE_KEYS.DOCUMENTS, inMemoryDocuments);
  setPersistentItem(DOC_STORAGE_KEYS.CATEGORIES, inMemoryCategories);
}

/**
 * Fetch all active document categories
 */
export async function getDocumentCategories(): Promise<DocumentCategory[]> {
  if (!isSupabaseConfigured) {
    return inMemoryCategories.filter((c) => c.is_active);
  }

  try {
    const { data, error } = await supabase
      .from('document_categories')
      .select('*')
      .eq('is_active', true)
      .order('code', { ascending: true });

    if (error) {
      console.warn('Error fetching categories from Supabase, falling back to mock:', error);
      return inMemoryCategories.filter((c) => c.is_active);
    }

    return (data as DocumentCategory[]) || [];
  } catch (err) {
    console.warn('Failed to load categories, using mock:', err);
    return inMemoryCategories.filter((c) => c.is_active);
  }
}

/**
 * Save or update a category (Admin only)
 */
export async function saveDocumentCategory(
  category: Partial<DocumentCategory> & { code: string; name_en: string; name_sw: string }
): Promise<DocumentCategory> {
  if (!isSupabaseConfigured) {
    const existingIndex = inMemoryCategories.findIndex(
      (c) => c.id === category.id || c.code === category.code
    );
    const now = new Date().toISOString();

    if (existingIndex >= 0 && inMemoryCategories[existingIndex]) {
      const existing = inMemoryCategories[existingIndex]!;
      const updated: DocumentCategory = {
        ...existing,
        ...category,
        id: existing.id,
        updated_at: now,
      };
      inMemoryCategories[existingIndex] = updated;
      return updated;
    }

    const created: DocumentCategory = {
      id: `cat-${Date.now()}`,
      code: category.code.toUpperCase(),
      name_en: category.name_en,
      name_sw: category.name_sw,
      description_en: category.description_en || null,
      description_sw: category.description_sw || null,
      icon: category.icon || 'Folder',
      is_active: category.is_active ?? true,
      created_at: now,
      updated_at: now,
    };
    inMemoryCategories.push(created);
    return created;
  }

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

    if (error) throw new Error(error.message);
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

    if (error) throw new Error(error.message);
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
    let filtered = [...inMemoryDocuments];

    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'archived') {
        filtered = filtered.filter((d) => d.is_archived);
      } else {
        filtered = filtered.filter((d) => d.status === filters.status && !d.is_archived);
      }
    } else {
      // Default: exclude archived unless specifically requested or search query present
      if (!filters.search) {
        filtered = filtered.filter((d) => !d.is_archived);
      }
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(
        (d) => d.category_id === filters.category || d.category?.code === filters.category
      );
    }

    // Classification filter
    if (filters.classification && filters.classification !== 'all') {
      filtered = filtered.filter((d) => d.classification === filters.classification);
    }

    // Free text search
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.reference_number.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Date filters
    if (filters.startDate) {
      filtered = filtered.filter((d) => d.document_date >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter((d) => d.document_date <= filters.endDate!);
    }

    // Sorting
    filtered.sort((a, b) => {
      const fieldA = a[filters.sortBy || 'document_date'] || '';
      const fieldB = b[filters.sortBy || 'document_date'] || '';
      if (filters.sortOrder === 'asc') {
        return fieldA > fieldB ? 1 : -1;
      }
      return fieldA < fieldB ? 1 : -1;
    });

    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  try {
    let query = supabase
      .from('documents')
      .select(
        `
        *,
        category:document_categories(*),
        current_version:document_versions!current_version_id(*)
      `,
        { count: 'exact' }
      );

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'archived') {
        query = query.eq('is_archived', true);
      } else {
        query = query.eq('status', filters.status).eq('is_archived', false);
      }
    } else {
      if (!filters.search) {
        query = query.eq('is_archived', false);
      }
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category_id', filters.category);
    }

    if (filters.classification && filters.classification !== 'all') {
      query = query.eq('classification', filters.classification);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      query = query.or(`title.ilike.%${q}%,reference_number.ilike.%${q}%,description.ilike.%${q}%`);
    }

    if (filters.startDate) {
      query = query.gte('document_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('document_date', filters.endDate);
    }

    const sortCol = filters.sortBy || 'document_date';
    query = query.order(sortCol, { ascending: filters.sortOrder === 'asc' });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.warn('Error querying Supabase documents, fallback to mock:', error);
      return getDocumentsMock(filters);
    }

    const records = (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      category: row.category,
      current_version: row.current_version,
    })) as unknown as DocumentRecord[];

    const total = count || 0;
    return {
      data: records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  } catch (err) {
    console.warn('Supabase query failed, fallback to mock:', err);
    return getDocumentsMock(filters);
  }
}

function getDocumentsMock(filters: DocumentFilterState): DocumentListResult {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  return {
    data: inMemoryDocuments.slice((page - 1) * pageSize, page * pageSize),
    total: inMemoryDocuments.length,
    page,
    pageSize,
    totalPages: Math.ceil(inMemoryDocuments.length / pageSize),
  };
}

/**
 * Get single document with complete versions and approvals
 */
export async function getDocumentById(id: string): Promise<DocumentRecord | null> {
  if (!isSupabaseConfigured) {
    const doc = inMemoryDocuments.find((d) => d.id === id);
    return doc ? JSON.parse(JSON.stringify(doc)) : null;
  }

  try {
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select('*, category:document_categories(*)')
      .eq('id', id)
      .single();

    if (docError || !docData) return null;

    // Fetch versions
    const { data: versionsData } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', id)
      .order('version_number', { ascending: false });

    // Fetch approvals
    const { data: approvalsData } = await supabase
      .from('document_approvals')
      .select('*')
      .eq('document_id', id)
      .order('decided_at', { ascending: false });

    const versions = (versionsData || []) as DocumentVersion[];
    const currentVersion = versions.find((v) => v.id === docData.current_version_id) || versions[0] || null;

    return {
      ...docData,
      category: docData.category,
      current_version: currentVersion,
      versions,
      approvals: (approvalsData || []) as DocumentApproval[],
    } as DocumentRecord;
  } catch (err) {
    console.warn('Error fetching document by ID, checking mock:', err);
    const doc = inMemoryDocuments.find((d) => d.id === id);
    return doc || null;
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
    referenceCounter += 1;
    const seqStr = String(referenceCounter).padStart(4, '0');
    return `BAO/${safeCat}/${year}/${seqStr}`;
  }

  try {
    const { data, error } = await supabase.rpc('generate_document_ref', {
      p_category_code: safeCat,
      p_date: docDate || new Date().toISOString().split('T')[0],
    });

    if (error || !data) {
      referenceCounter += 1;
      return `BAO/${safeCat}/${year}/${String(referenceCounter).padStart(4, '0')}`;
    }

    return data as string;
  } catch {
    referenceCounter += 1;
    return `BAO/${safeCat}/${year}/${String(referenceCounter).padStart(4, '0')}`;
  }
}

/**
 * Create a new document with initial version (v1)
 */
export async function createDocument(
  payload: UploadDocumentPayload,
  currentUser: { id: string; name: string }
): Promise<DocumentRecord> {
  const validation = validateDocumentFile(payload.file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  const documentId = isSupabaseConfigured ? crypto.randomUUID() : `doc-${Date.now()}`;
  const versionId = isSupabaseConfigured ? crypto.randomUUID() : `ver-${Date.now()}-1`;
  const now = new Date().toISOString();

  // 1. Generate unique reference number
  const referenceNumber = await generateDocumentReference(
    payload.category_code,
    payload.document_date
  );

  // 2. Upload storage file
  const storagePath = generateStoragePath(
    payload.category_code,
    documentId,
    1,
    payload.file.name
  );

  const uploadRes = await uploadStorageFile(payload.file, storagePath);
  if (uploadRes.error || !uploadRes.path) {
    throw new Error(uploadRes.error || 'Failed to upload document file.');
  }

  const initialVersion: DocumentVersion = {
    id: versionId,
    document_id: documentId,
    version_number: 1,
    file_name: payload.file.name,
    file_path: uploadRes.path,
    file_size: payload.file.size,
    mime_type: payload.file.type || 'application/octet-stream',
    file_extension: getFileExtension(payload.file.name),
    storage_bucket: 'org-documents',
    change_notes: payload.change_notes || 'Initial document upload.',
    created_by: currentUser.id,
    created_by_name: currentUser.name,
    created_at: now,
  };

  const category = (await getDocumentCategories()).find((c) => c.id === payload.category_id);

  if (!isSupabaseConfigured) {
    const newDoc: DocumentRecord = {
      id: documentId,
      reference_number: referenceNumber,
      title: payload.title,
      description: payload.description || null,
      category_id: payload.category_id,
      category,
      department_id: payload.department_id || null,
      project_id: payload.project_id || null,
      owner_id: currentUser.id,
      owner_name: currentUser.name,
      classification: payload.classification,
      status: 'pending_review',
      document_date: payload.document_date,
      tags: payload.tags || [],
      is_archived: false,
      current_version_id: versionId,
      current_version: initialVersion,
      versions: [initialVersion],
      approvals: [],
      created_at: now,
      updated_at: now,
    };

    inMemoryDocuments.unshift(newDoc);
    setPersistentItem(DOC_STORAGE_KEYS.DOCUMENTS, inMemoryDocuments);
    return newDoc;
  }

  try {
    // Insert document
    const { data: docData, error: docErr } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        reference_number: referenceNumber,
        title: payload.title,
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
      .select()
      .single();

    if (docErr) {
      await deleteStorageFile(storagePath);
      throw new Error(`Failed to create document record: ${docErr.message}`);
    }

    // Insert version 1
    const { error: verErr } = await supabase.from('document_versions').insert({
      id: versionId,
      document_id: documentId,
      version_number: 1,
      file_name: payload.file.name,
      file_path: uploadRes.path,
      file_size: payload.file.size,
      mime_type: payload.file.type || 'application/octet-stream',
      file_extension: getFileExtension(payload.file.name),
      storage_bucket: 'org-documents',
      change_notes: payload.change_notes || 'Initial document upload.',
      created_by: currentUser.id,
    });

    if (verErr) {
      throw new Error(`Failed to save initial version: ${verErr.message}`);
    }

    // Update current_version_id
    await supabase
      .from('documents')
      .update({ current_version_id: versionId })
      .eq('id', documentId);

    return {
      ...(docData as DocumentRecord),
      category,
      current_version: initialVersion,
      versions: [initialVersion],
      approvals: [],
    };
  } catch (err) {
    await deleteStorageFile(storagePath);
    throw err;
  }
}

/**
 * Upload a new version for an existing document (immutable version history)
 */
export async function uploadNewVersion(
  payload: NewVersionPayload,
  currentUser: { id: string; name: string }
): Promise<DocumentRecord> {
  const validation = validateDocumentFile(payload.file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  const existing = await getDocumentById(payload.document_id);
  if (!existing) {
    throw new Error('Target document was not found.');
  }

  if (existing.is_archived) {
    throw new Error('Cannot upload new versions for archived documents.');
  }

  const nextVersionNumber = (existing.versions?.length || 1) + 1;
  const versionId = isSupabaseConfigured ? crypto.randomUUID() : `ver-${Date.now()}-${nextVersionNumber}`;
  const now = new Date().toISOString();

  const storagePath = generateStoragePath(
    payload.category_code,
    payload.document_id,
    nextVersionNumber,
    payload.file.name
  );

  const uploadRes = await uploadStorageFile(payload.file, storagePath);
  if (uploadRes.error || !uploadRes.path) {
    throw new Error(uploadRes.error || 'Failed to upload version file.');
  }

  const newVersion: DocumentVersion = {
    id: versionId,
    document_id: payload.document_id,
    version_number: nextVersionNumber,
    file_name: payload.file.name,
    file_path: uploadRes.path,
    file_size: payload.file.size,
    mime_type: payload.file.type || 'application/octet-stream',
    file_extension: getFileExtension(payload.file.name),
    storage_bucket: 'org-documents',
    change_notes: payload.change_notes,
    created_by: currentUser.id,
    created_by_name: currentUser.name,
    created_at: now,
  };

  if (!isSupabaseConfigured) {
    const docIdx = inMemoryDocuments.findIndex((d) => d.id === payload.document_id);
    if (docIdx >= 0 && inMemoryDocuments[docIdx]) {
      const doc = inMemoryDocuments[docIdx]!;
      const updatedVersions = [newVersion, ...(doc.versions || [])];
      const updatedDoc: DocumentRecord = {
        ...doc,
        current_version_id: versionId,
        current_version: newVersion,
        versions: updatedVersions,
        status: 'pending_review', // Re-submits to review queue upon new version
        updated_at: now,
      };
      inMemoryDocuments[docIdx] = updatedDoc;
      setPersistentItem(DOC_STORAGE_KEYS.DOCUMENTS, inMemoryDocuments);
      return updatedDoc;
    }
    throw new Error('Document not found in local store.');
  }

  // Live Supabase
  const { error: verErr } = await supabase.from('document_versions').insert({
    id: versionId,
    document_id: payload.document_id,
    version_number: nextVersionNumber,
    file_name: payload.file.name,
    file_path: uploadRes.path,
    file_size: payload.file.size,
    mime_type: payload.file.type || 'application/octet-stream',
    file_extension: getFileExtension(payload.file.name),
    storage_bucket: 'org-documents',
    change_notes: payload.change_notes,
    created_by: currentUser.id,
  });

  if (verErr) {
    await deleteStorageFile(storagePath);
    throw new Error(verErr.message);
  }

  await supabase
    .from('documents')
    .update({
      current_version_id: versionId,
      status: 'pending_review',
      updated_at: now,
    })
    .eq('id', payload.document_id);

  return (await getDocumentById(payload.document_id))!;
}

/**
 * Submit an official review/approval decision
 */
export async function submitApprovalDecision(
  payload: ApprovalDecisionPayload,
  reviewer: { id: string; name: string; role?: string }
): Promise<DocumentRecord> {
  const now = new Date().toISOString();
  const approvalId = isSupabaseConfigured ? crypto.randomUUID() : `app-${Date.now()}`;

  const newApproval: DocumentApproval = {
    id: approvalId,
    document_id: payload.document_id,
    version_id: payload.version_id || null,
    reviewer_id: reviewer.id,
    reviewer_name: reviewer.name,
    reviewer_role: reviewer.role,
    status: payload.status,
    comments: payload.comments,
    decided_at: now,
    created_at: now,
  };

  const newStatus = payload.status === 'approved' ? 'approved' : 'draft';

  if (!isSupabaseConfigured) {
    const docIdx = inMemoryDocuments.findIndex((d) => d.id === payload.document_id);
    if (docIdx >= 0 && inMemoryDocuments[docIdx]) {
      const doc = inMemoryDocuments[docIdx]!;
      const updatedDoc: DocumentRecord = {
        ...doc,
        status: newStatus,
        approvals: [newApproval, ...(doc.approvals || [])],
        updated_at: now,
      };
      inMemoryDocuments[docIdx] = updatedDoc;
      setPersistentItem(DOC_STORAGE_KEYS.DOCUMENTS, inMemoryDocuments);
      return updatedDoc;
    }
    throw new Error('Document not found in local store.');
  }

  // Live Supabase
  const { error: appErr } = await supabase.from('document_approvals').insert({
    id: approvalId,
    document_id: payload.document_id,
    version_id: payload.version_id || null,
    reviewer_id: reviewer.id,
    status: payload.status,
    comments: payload.comments,
    decided_at: now,
  });

  if (appErr) throw new Error(appErr.message);

  await supabase
    .from('documents')
    .update({
      status: newStatus,
      updated_at: now,
    })
    .eq('id', payload.document_id);

  return (await getDocumentById(payload.document_id))!;
}

/**
 * Archive an active document
 */
export async function archiveDocument(
  documentId: string
): Promise<void> {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured) {
    const docIdx = inMemoryDocuments.findIndex((d) => d.id === documentId);
    if (docIdx >= 0 && inMemoryDocuments[docIdx]) {
      const doc = inMemoryDocuments[docIdx]!;
      const updatedDoc: DocumentRecord = {
        ...doc,
        is_archived: true,
        status: 'archived',
        updated_at: now,
      };
      inMemoryDocuments[docIdx] = updatedDoc;
      setPersistentItem(DOC_STORAGE_KEYS.DOCUMENTS, inMemoryDocuments);
      return;
    }
  }

  await supabase
    .from('documents')
    .update({
      is_archived: true,
      status: 'archived',
      updated_at: now,
    })
    .eq('id', documentId);
}

/**
 * Restore an archived document to draft status
 */
export async function restoreDocument(
  documentId: string
): Promise<void> {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured) {
    const docIdx = inMemoryDocuments.findIndex((d) => d.id === documentId);
    if (docIdx >= 0 && inMemoryDocuments[docIdx]) {
      const doc = inMemoryDocuments[docIdx]!;
      const updatedDoc: DocumentRecord = {
        ...doc,
        is_archived: false,
        status: 'draft',
        updated_at: now,
      };
      inMemoryDocuments[docIdx] = updatedDoc;
      setPersistentItem(DOC_STORAGE_KEYS.DOCUMENTS, inMemoryDocuments);
      return;
    }
  }

  await supabase
    .from('documents')
    .update({
      is_archived: false,
      status: 'draft',
      updated_at: now,
    })
    .eq('id', documentId);
}
