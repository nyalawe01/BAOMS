/**
 * Cloudflare R2 Storage Service for BAOMS Documents
 * Babawatoto Organization Management System
 * 
 * Enforces file size limitations, allowed MIME types, and uploads directly
 * to private Cloudflare R2 bucket ('dropin-relay') via Supabase Edge Function ('r2-sign-upload').
 * All document downloads use temporary signed GET URLs.
 * No mock data or in-memory blobs.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const STORAGE_BUCKET = 'dropin-relay';

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
  const cleanBasename = filename.replace(/^.*[\\/]/, '');
  return cleanBasename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

/**
 * Generate a predictable storage path
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
 * Upload a binary file to private Cloudflare R2 bucket via Supabase Edge Function
 */
export async function uploadStorageFile(
  file: File,
  _storagePath?: string
): Promise<{ path: string | null; error: string | null }> {
  const validation = validateDocumentFile(file);
  if (!validation.valid) {
    return { path: null, error: validation.error || 'Invalid file' };
  }

  if (!isSupabaseConfigured) {
    return { path: null, error: 'Database and Cloudflare R2 storage are not configured.' };
  }

  try {
    const contentType = file.type || 'application/octet-stream';
    const safeFilename = sanitizeFileName(file.name);

    // 1. Request presigned PUT URL from r2-sign-upload edge function
    const { data: signData, error: signError } = await supabase.functions.invoke('r2-sign-upload', {
      body: {
        action: 'upload',
        filename: safeFilename,
        contentType,
      },
    });

    if (signError || !signData?.uploadUrl) {
      console.error('[storageService] Failed to get signed upload URL:', signError || signData);
      return {
        path: null,
        error: signError?.message || signData?.error || 'Failed to authorize document upload with Cloudflare R2.',
      };
    }

    // 2. PUT file binary directly to Cloudflare R2
    const uploadRes = await fetch(signData.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      console.error('[storageService] Cloudflare R2 PUT returned non-200:', uploadRes.status);
      return {
        path: null,
        error: `Cloudflare R2 upload failed (HTTP ${uploadRes.status}).`,
      };
    }

    return { path: signData.objectKey, error: null };
  } catch (err) {
    console.error('[storageService] R2 Upload exception:', err);
    return {
      path: null,
      error: err instanceof Error ? err.message : 'Storage upload failed.',
    };
  }
}

/**
 * Generate a short-lived signed URL for authorized download/preview from private Cloudflare R2
 */
export async function getSignedDownloadUrl(
  storagePath: string,
  _expiresInSeconds = 300
): Promise<{ url: string | null; error: string | null }> {
  if (!storagePath) {
    return { url: null, error: 'No storage path provided.' };
  }

  if (!isSupabaseConfigured) {
    return { url: null, error: 'Storage is not configured.' };
  }

  try {
    const { data: signData, error: signError } = await supabase.functions.invoke('r2-sign-upload', {
      body: {
        action: 'download',
        objectKey: storagePath,
      },
    });

    if (signError || !signData?.downloadUrl) {
      console.error('[storageService] Failed to get signed download URL:', signError || signData);
      return {
        url: null,
        error: signError?.message || signData?.error || 'Failed to generate signed download URL.',
      };
    }

    return { url: signData.downloadUrl, error: null };
  } catch (err) {
    console.error('[storageService] R2 Download exception:', err);
    return {
      url: null,
      error: err instanceof Error ? err.message : 'Failed to generate signed download URL.',
    };
  }
}

/**
 * Deletion helper
 */
export async function deleteStorageFile(_storagePath: string): Promise<void> {
  // R2 lifecycle or admin deletion can be handled if needed
}
