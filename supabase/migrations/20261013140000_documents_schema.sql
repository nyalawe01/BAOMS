-- ==============================================================================
-- Babawatoto Organization Management System (BAOMS)
-- Migration: 20261013140000_documents_schema.sql
-- Description: Document & records repository schema, version control, approval history,
--              reference number sequences, triggers, and Row-Level Security policies.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DOCUMENT CATEGORIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_sw TEXT NOT NULL,
    description_en TEXT,
    description_sw TEXT,
    icon TEXT NOT NULL DEFAULT 'FileText',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_document_categories_code ON public.document_categories(code);
CREATE INDEX IF NOT EXISTS idx_document_categories_is_active ON public.document_categories(is_active);

-- ------------------------------------------------------------------------------
-- 2. DOCUMENTS (Parent records)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES public.document_categories(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    project_id UUID,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    classification TEXT NOT NULL DEFAULT 'internal' CHECK (classification IN ('public', 'internal', 'confidential', 'restricted')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'superseded', 'archived')),
    document_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_archived BOOLEAN NOT NULL DEFAULT false,
    current_version_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_documents_reference_number ON public.documents(reference_number);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON public.documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_department_id ON public.documents(department_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_classification ON public.documents(classification);
CREATE INDEX IF NOT EXISTS idx_documents_document_date ON public.documents(document_date);
CREATE INDEX IF NOT EXISTS idx_documents_is_archived ON public.documents(is_archived);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON public.documents USING GIN(tags);

-- ------------------------------------------------------------------------------
-- 3. DOCUMENT VERSIONS (Immutable historical versions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    mime_type TEXT NOT NULL,
    file_extension TEXT NOT NULL,
    storage_bucket TEXT NOT NULL DEFAULT 'org-documents',
    checksum_sha256 TEXT,
    change_notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_document_version UNIQUE (document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_version_number ON public.document_versions(version_number);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_by ON public.document_versions(created_by);

-- Link documents.current_version_id foreign key now that document_versions exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_current_version'
    ) THEN
        ALTER TABLE public.documents
        ADD CONSTRAINT fk_documents_current_version
        FOREIGN KEY (current_version_id)
        REFERENCES public.document_versions(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. DOCUMENT APPROVALS (Workflow audit & decisions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version_id UUID REFERENCES public.document_versions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('approved', 'rejected', 'amendments_requested')),
    comments TEXT NOT NULL,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_document_approvals_document_id ON public.document_approvals(document_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_version_id ON public.document_approvals(version_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_reviewer_id ON public.document_approvals(reviewer_id);

-- ------------------------------------------------------------------------------
-- 5. DOCUMENT DEPARTMENTS (Association / shared access)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_departments (
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    shared_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (document_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_document_departments_dept_id ON public.document_departments(department_id);

-- ------------------------------------------------------------------------------
-- 6. REFERENCE NUMBER SEQUENCE & GENERATOR FUNCTION
-- Format: BAO/{CATEGORY_CODE}/{YYYY}/{SEQ:04d} (e.g., BAO/FIN/2026/0001)
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.seq_document_reference START 1;

CREATE OR REPLACE FUNCTION public.generate_document_ref(p_category_code TEXT, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_year TEXT;
    v_seq_val BIGINT;
    v_ref TEXT;
BEGIN
    v_year := to_char(COALESCE(p_date, CURRENT_DATE), 'YYYY');
    v_seq_val := nextval('public.seq_document_reference');
    v_ref := 'BAO/' || UPPER(COALESCE(p_category_code, 'DOC')) || '/' || v_year || '/' || lpad(v_seq_val::text, 4, '0');
    RETURN v_ref;
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. AUTOMATED UPDATED_AT TRIGGERS
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_document_categories_updated_at ON public.document_categories;
CREATE TRIGGER trg_document_categories_updated_at
    BEFORE UPDATE ON public.document_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 8. ROW-LEVEL SECURITY POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_departments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.document_categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_approvals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_departments FORCE ROW LEVEL SECURITY;

-- 8.1 Categories Policies
CREATE POLICY "categories_read_active"
ON public.document_categories FOR SELECT
USING (is_active = true OR public.has_permission('roles.manage') OR public.is_admin());

CREATE POLICY "categories_admin_modify"
ON public.document_categories FOR ALL
USING (public.has_permission('roles.manage') OR public.is_admin())
WITH CHECK (public.has_permission('roles.manage') OR public.is_admin());

-- 8.2 Documents Policies
CREATE POLICY "documents_read_access"
ON public.documents FOR SELECT
USING (
    -- Admins can read all documents
    public.is_admin()
    -- Users with documents.view can read non-restricted documents
    OR (
        public.has_permission('documents.view')
        AND (
            classification IN ('public', 'internal')
            OR owner_id = auth.uid()
            OR (
                classification = 'confidential'
                AND department_id IN (
                    SELECT department_id FROM public.profiles WHERE id = auth.uid()
                )
            )
        )
    )
    -- Authors can always view their own documents
    OR owner_id = auth.uid()
);

CREATE POLICY "documents_insert_permitted"
ON public.documents FOR INSERT
WITH CHECK (
    (public.has_permission('documents.upload') OR public.is_admin())
    AND owner_id = auth.uid()
);

CREATE POLICY "documents_update_permitted"
ON public.documents FOR UPDATE
USING (
    public.is_admin()
    OR (owner_id = auth.uid() AND status = 'draft')
    OR public.has_permission('documents.approve')
)
WITH CHECK (
    public.is_admin()
    OR (owner_id = auth.uid() AND status IN ('draft', 'pending_review'))
    OR public.has_permission('documents.approve')
);

CREATE POLICY "documents_delete_restricted"
ON public.documents FOR DELETE
USING (
    public.is_admin()
    OR public.has_permission('documents.delete')
);

-- 8.3 Document Versions Policies
CREATE POLICY "versions_read_access"
ON public.document_versions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.documents d
        WHERE d.id = document_versions.document_id
    )
);

CREATE POLICY "versions_insert_permitted"
ON public.document_versions FOR INSERT
WITH CHECK (
    (public.has_permission('documents.upload') OR public.is_admin())
    AND created_by = auth.uid()
);

-- Versions are immutable; no client updates allowed
CREATE POLICY "versions_no_update"
ON public.document_versions FOR UPDATE
USING (false);

CREATE POLICY "versions_delete_restricted"
ON public.document_versions FOR DELETE
USING (
    public.is_admin()
    OR public.has_permission('documents.delete')
);

-- 8.4 Document Approvals Policies
CREATE POLICY "approvals_read_access"
ON public.document_approvals FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.documents d
        WHERE d.id = document_approvals.document_id
    )
);

CREATE POLICY "approvals_insert_reviewers"
ON public.document_approvals FOR INSERT
WITH CHECK (
    (public.has_permission('documents.approve') OR public.is_admin())
    AND reviewer_id = auth.uid()
);

-- Approval records are immutable
CREATE POLICY "approvals_no_mutation"
ON public.document_approvals FOR UPDATE
USING (false);

-- 8.5 Document Departments Policies
CREATE POLICY "doc_dept_read"
ON public.document_departments FOR SELECT
USING (true);

CREATE POLICY "doc_dept_modify"
ON public.document_departments FOR ALL
USING (public.has_permission('documents.upload') OR public.is_admin())
WITH CHECK (public.has_permission('documents.upload') OR public.is_admin());
