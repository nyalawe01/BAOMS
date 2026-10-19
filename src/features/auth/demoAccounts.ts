/**
 * BAOMS Staff Account Types
 * Babawatoto Organization Management System
 * 
 * Strict Database-Driven Architecture:
 * Mock and demo account presets have been removed. All user accounts, roles,
 * and permissions are loaded exclusively from Supabase PostgreSQL.
 */

import { RoleCode, PermissionCode } from '@/lib/permissions';

export interface DemoAccount {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  preferredLanguage: 'en' | 'sw';
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  role: RoleCode;
  roles: RoleCode[];
  permissions: PermissionCode[];
  isActive: boolean;
  avatarInitials: string;
  isMfaEnrolled?: boolean;
}

// Emptied: No mock accounts are permitted. Real accounts originate from Supabase.
export const DEMO_ACCOUNTS: DemoAccount[] = [];
# Task: Complete and Test Cloudflare R2 Integration for BAOMS

You are working on the existing BAOMS (Babawatoto Organization Management System) React application. Your task is to complete the integration between the existing Supabase project and Cloudflare R2.

## Existing infrastructure

- Frontend: Existing BAOMS React application deployed on Vercel.
- BAOMS URL: https://baoms.babawatoto.or.tz
- Supabase project reference: `sqleehfbooigtthzmvbd`
- Existing Supabase Edge Function: `r2-sign-upload`
- Existing Cloudflare R2 bucket: `dropin-relay`
- R2 endpoint: `https://81fdcefe138cfcbcae28ed62670876cb.r2.cloudflarestorage.com`
- Bucket region/location: Western Europe (WEUR).
- Cloudflare bucket CORS policy has been configured for `https://baoms.babawatoto.or.tz`.
- The bucket must remain private.
- The automatic 24-hour object deletion lifecycle rule has been disabled.
- R2 API credentials have been created.
- The Edge Function has been deployed without deployment errors.
- Supabase Edge Function JWT verification settings and R2 secrets have been configured during setup.

## Phase 1: Audit before modifying anything

1. Inspect the entire existing BAOMS project, including package.json, Supabase client initialization, authentication, routing, existing file-upload components, storage usage and database schema.
2. Inspect the deployed `r2-sign-upload` Edge Function and its current configuration using authorized Supabase tools.
3. Verify that the required environment secrets exist by checking their names and configuration status. Never print or expose their values.
4. Determine how BAOMS currently stores uploaded files and whether any modules already use Supabase Storage.
5. Identify existing tables, foreign keys, Row Level Security policies and role/permission checks relevant to files.
6. Report findings and a short implementation plan before making destructive changes.

## Phase 2: Correct and secure the Edge Function

Review and implement the required functionality using the existing Supabase project and R2 bucket.

Requirements:
- Authenticate users with a verified Supabase user session.
- Do not treat the Supabase publishable/anon key alone as user authentication.
- Apply appropriate BAOMS role and permission checks before authorizing uploads.
- Restrict access to `dropin-relay`.
- Generate short-lived, presigned R2 upload URLs.
- Validate file types, filenames, file sizes and allowed upload paths.
- Prevent path traversal, arbitrary object overwrites and unauthorized access to other users' files.
- Do not trust client-provided user IDs, department IDs or permissions.
- Never expose R2 credentials in frontend code, browser bundles, public repositories or client-visible logs.
- Handle CORS, errors and OPTIONS preflight requests correctly.
- Do not disable security checks merely to make a test pass.
- Keep the bucket private and do not enable public access or the Public Development URL.

Use dependencies and runtime APIs supported by Supabase Edge Functions. Confirm that the SDK imports and signing implementation work in the deployed environment.

## Phase 3: Test the full upload workflow

Use a harmless test file only.

Verify:
1. Unauthenticated requests are rejected.
2. Invalid or expired sessions are rejected.
3. Authenticated but unauthorized users cannot upload restricted files.
4. Authorized users can obtain a signed upload URL.
5. Uploading with the signed URL succeeds.
6. The object appears in the correct R2 bucket and remains private.
7. Unauthorized users cannot retrieve protected files.
8. Temporary signed download URLs, if implemented, expire as intended.
9. Errors are handled without exposing secrets.

Do not claim a test passed unless you actually ran it and observed the result. If you cannot execute a test, state that explicitly.

## Phase 4: Database and application integration

Before changing the schema, inspect existing tables and reuse appropriate structures when possible.

If a file metadata table is necessary, design it to store only metadata such as:
- File ID
- R2 object key
- Original filename
- MIME type
- File size
- Uploader's authenticated user ID
- Related BAOMS module/record
- Access classification
- Created timestamp

Apply appropriate RLS policies and permissions. Do not store R2 secret keys or permanent public file URLs in the database.

Do not modify unrelated BAOMS tables, finance records, staff records or production data.

## Phase 5: Frontend integration

Integrate R2 uploads with the existing BAOMS upload components and architecture. Do not create a separate demo application or duplicate Supabase client.

Support progress/error feedback where practical. Ensure protected files are accessed through authorized, short-lived signed URLs rather than public bucket URLs.

Do not switch every existing module to R2 until the implementation has been verified and the migration plan is approved.

## Phase 6: Final report

Report:
- Files changed
- Database schema or policies changed
- Edge Function changes and deployment status
- Secrets required (names only, never values)
- Tests executed and their actual results
- Any remaining manual dashboard steps
- Any limitations or unresolved security issues

## Safety constraints

Do not delete buckets, empty buckets, delete existing user records, disable RLS, make the bucket public, overwrite unrelated production data, or perform a bulk migration without explicit approval. Prefer reversible, minimal changes and test with non-sensitive data first.