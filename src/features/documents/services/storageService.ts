/**
 * Supabase Storage Service for BAOMS Documents
 * Babawatoto Organization Management System
 * 
 * Enforces file size limitations, allowed MIME types, safe storage path
 * conventions, and signed temporary download URL generation.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const STORAGE_BUCKET = 'org-documents';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB max

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'jpg', 'jpeg', 'png', 'webp'] as const;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a candidate file against size and MIME/extension restrictions
 */
export function validateDocumentFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'Selected file is empty.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum permitted limit of 25 MB.`,
    };
  }

  const extension = getFileExtension(file.name).toLowerCase();
  const isExtensionValid = ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number]);
  const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number]);

  // Permit if either mime type or standard extension matches known safe document types
  if (!isExtensionValid && !isMimeValid) {
    return {
      valid: false,
      error: `Unsupported file type (.${extension || 'unknown'}). Authorized formats: PDF, DOCX, XLSX, JPG, PNG, WEBP.`,
    };
  }

  return { valid: true };
}

/**
 * Extract clean file extension from a filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts.pop() || '';
  }
  return '';
}

/**
 * Sanitize a filename to prevent path traversal or problematic characters
 */
export function sanitizeFileName(filename: string): string {
  // Extract basename without directory elements
  const cleanBasename = filename.replace(/^.*[\\/]/, '');
  // Replace non-alphanumeric (except dot, dash, underscore) with underscore
  return cleanBasename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

/**
 * Generate a predictable, isolated storage path:
 * {category_code}/{document_id}/v{version_number}_{sanitized_name}
 */
export function generateStoragePath(
  categoryCode: string,
  documentId: string,
  versionNumber: number,
  originalFilename: string
): string {
  const safeCat = categoryCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeName = sanitizeFileName(originalFilename);
  return `${safeCat}/${documentId}/v${versionNumber}_${safeName}`;
}

/**
 * Format raw byte size into human-readable metric
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * In-memory blob store for offline / mock testing
 */
const mockBlobCache = new Map<string, string>();

/**
 * Upload a binary file to the private storage bucket
 */
export async function uploadStorageFile(
  file: File,
  storagePath: string
): Promise<{ path: string | null; error: string | null }> {
  const validation = validateDocumentFile(file);
  if (!validation.valid) {
    return { path: null, error: validation.error || 'Invalid file' };
  }

  if (!isSupabaseConfigured) {
    // Local / Offline demo mode: create an object URL safely
    const objectUrl =
      typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(file)
        : `mock-blob://${storagePath}`;
    mockBlobCache.set(storagePath, objectUrl);
    return { path: storagePath, error: null };
  }

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

    if (error) {
      return { path: null, error: error.message };
    }

    return { path: data.path, error: null };
  } catch (err) {
    return {
      path: null,
      error: err instanceof Error ? err.message : 'Storage upload failed.',
    };
  }
}

/**
 * Generate a short-lived signed URL (default 60 seconds) for authorized download/preview
 */
export async function getSignedDownloadUrl(
  storagePath: string,
  expiresInSeconds = 60
): Promise<{ url: string | null; error: string | null }> {
  if (!storagePath) {
    return { url: null, error: 'No storage path provided.' };
  }

  if (!isSupabaseConfigured) {
    // Offline / Demo mode
    const cached = mockBlobCache.get(storagePath);
    if (cached) {
      return { url: cached, error: null };
    }
    // Return a dummy data URI or placeholder download preview
    return {
      url: `data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg==`,
      error: null,
    };
  }

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
      return { url: null, error: error.message };
    }

    return { url: data.signedUrl, error: null };
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : 'Failed to generate signed download URL.',
    };
  }
}

/**
 * Compensating deletion if document metadata insert fails
 */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  if (!storagePath) return;

  if (!isSupabaseConfigured) {
    mockBlobCache.delete(storagePath);
    return;
  }

  try {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
  } catch {
    // Ignore rollback failure in background cleanup
  }
}
