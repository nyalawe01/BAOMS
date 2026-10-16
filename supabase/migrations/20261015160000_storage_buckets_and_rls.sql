-- ==============================================================================
-- Babawatoto Organization Management System (BAOMS)
-- Migration: 20261015160000_storage_buckets_and_rls.sql
-- Description: Provision private Supabase Storage buckets and strict Row-Level
--              Security policies for documents, attachments, and staff dossiers.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROVISION PRIVATE STORAGE BUCKETS
-- ------------------------------------------------------------------------------

-- 1.1 Official Institutional Documents (Contracts, MOUs, Reports, Policies)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    52428800, -- 50 MB limit
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'text/plain'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 1.2 Program & Finance Attachments (Requisition Receipts, M&E Field Reports, Meeting Notes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'attachments',
    'attachments',
    false,
    26214400, -- 25 MB limit
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'image/jpeg',
        'image/png'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 1.3 Confidential Personnel Dossiers (Curriculum Vitae, Academic Certificates, NIDA Copies)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'staff_dossiers',
    'staff_dossiers',
    false,
    20971520, -- 20 MB limit
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- 2. ROW-LEVEL SECURITY (RLS) FOR STORAGE OBJECTS
-- Ensure RLS is active on storage.objects (Supabase manages this by default)
-- RLS policies on storage.objects:

-- 2.1 DOCUMENTS BUCKET POLICIES
DROP POLICY IF EXISTS "documents_read_authenticated" ON storage.objects;
CREATE POLICY "documents_read_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents'
    AND (
        public.is_admin()
        OR public.has_permission('documents.view')
        OR auth.uid()::text = (storage.foldername(name))[1]
    )
);

DROP POLICY IF EXISTS "documents_insert_authorized" ON storage.objects;
CREATE POLICY "documents_insert_authorized"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents'
    AND (
        public.is_admin()
        OR public.has_permission('documents.upload')
    )
);

DROP POLICY IF EXISTS "documents_delete_restricted" ON storage.objects;
CREATE POLICY "documents_delete_restricted"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'documents'
    AND (
        public.is_admin()
        OR public.has_permission('documents.delete')
    )
);

-- 2.2 ATTACHMENTS BUCKET POLICIES
DROP POLICY IF EXISTS "attachments_read_authenticated" ON storage.objects;
CREATE POLICY "attachments_read_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "attachments_insert_authenticated" ON storage.objects;
CREATE POLICY "attachments_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'attachments'
    AND auth.role() = 'authenticated'
);

-- 2.3 STAFF DOSSIERS BUCKET POLICIES (CONFIDENTIAL HR DATA)
DROP POLICY IF EXISTS "staff_dossiers_read_restricted" ON storage.objects;
CREATE POLICY "staff_dossiers_read_restricted"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'staff_dossiers'
    AND (
        public.is_admin()
        OR public.has_permission('hr.manage')
        OR public.has_permission('hr.view')
        -- Employees may download their own uploaded credentials (folder named after user ID)
        OR auth.uid()::text = (storage.foldername(name))[1]
    )
);

DROP POLICY IF EXISTS "staff_dossiers_insert_authorized" ON storage.objects;
CREATE POLICY "staff_dossiers_insert_authorized"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'staff_dossiers'
    AND (
        public.is_admin()
        OR public.has_permission('hr.manage')
        -- Employee can upload during self-service registration/profile update
        OR auth.uid()::text = (storage.foldername(name))[1]
    )
);

DROP POLICY IF EXISTS "staff_dossiers_delete_admin_only" ON storage.objects;
CREATE POLICY "staff_dossiers_delete_admin_only"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'staff_dossiers'
    AND (public.is_admin() OR public.has_permission('hr.manage'))
);
