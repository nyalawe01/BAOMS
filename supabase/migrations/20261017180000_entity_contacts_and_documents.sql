-- ==============================================================================
-- Babawatoto Organization Management System (BAOMS)
-- Migration: 20261017180000_entity_contacts_and_documents.sql
-- Description: Polymorphic multi-contact and supporting-document tables.
--   - entity_contacts: multiple phone / email / address / bank entries
--     linked to any entity (vendor, project, staff_profile, partner, etc.)
--   - entity_documents: named supporting documents attached to any entity
--     or workflow record (purchase_order, financial_request, project, vendor)
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1.  ENTITY CONTACTS
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.entity_contacts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     TEXT        NOT NULL,
    -- e.g. 'vendor' | 'project' | 'staff_profile' | 'user' | 'partner'
    entity_id       TEXT        NOT NULL,
    -- UUID of the target record (stored as TEXT for poly flexibility)
    contact_type    TEXT        NOT NULL CHECK (contact_type IN (
        'phone', 'email', 'address', 'bank_account'
    )),
    label           TEXT,                   -- user-defined: "Main Line", "CRDB", etc.
    value           TEXT        NOT NULL,   -- phone/email/address/account number
    bank_name       TEXT,                   -- for bank_account type
    branch_name     TEXT,
    swift_code      TEXT,
    is_primary      BOOLEAN     NOT NULL DEFAULT false,
    created_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entity_contacts_entity
    ON public.entity_contacts (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_contacts_type
    ON public.entity_contacts (contact_type);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_entity_contacts_updated_at'
    ) THEN
        CREATE TRIGGER trg_entity_contacts_updated_at
            BEFORE UPDATE ON public.entity_contacts
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2.  ENTITY SUPPORTING DOCUMENTS
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.entity_supporting_documents (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     TEXT        NOT NULL,
    -- 'vendor' | 'purchase_order' | 'financial_request' | 'project' | 'staff_profile'
    entity_id       TEXT        NOT NULL,
    custom_name     TEXT        NOT NULL,    -- user-editable display name
    original_name   TEXT        NOT NULL,    -- original file name
    document_tag    TEXT        NOT NULL DEFAULT 'other' CHECK (document_tag IN (
        'quote', 'contract', 'invoice', 'id_copy',
        'certificate', 'report', 'photo', 'letter', 'other'
    )),
    notes           TEXT,
    storage_path    TEXT,                   -- Supabase Storage object path
    file_size       BIGINT,                 -- bytes
    mime_type       TEXT,
    uploaded_by     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entity_docs_entity
    ON public.entity_supporting_documents (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_docs_tag
    ON public.entity_supporting_documents (document_tag);

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_entity_docs_updated_at'
    ) THEN
        CREATE TRIGGER trg_entity_docs_updated_at
            BEFORE UPDATE ON public.entity_supporting_documents
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3.  EXTEND VENDOR TABLE with contacts JSONB column (fast client read)
--     The canonical store is entity_contacts; this is a denormalized cache
--     for quick vendor card display without extra joins.
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.vendors
    ADD COLUMN IF NOT EXISTS contacts_json JSONB    DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS vrn_number   TEXT;

COMMENT ON COLUMN public.vendors.contacts_json IS
    'Denormalized cache of entity_contacts rows for this vendor. '
    'Source of truth is entity_contacts table.';

-- ──────────────────────────────────────────────────────────────────────────────
-- 4.  ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.entity_contacts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_supporting_documents ENABLE ROW LEVEL SECURITY;

-- entity_contacts: authenticated users may read; only owners / admins may write
CREATE POLICY IF NOT EXISTS "entity_contacts_select"
    ON public.entity_contacts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY IF NOT EXISTS "entity_contacts_insert"
    ON public.entity_contacts FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

CREATE POLICY IF NOT EXISTS "entity_contacts_update_admin"
    ON public.entity_contacts FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
              AND r.code IN ('system_admin', 'hr_administrator', 'executive_director')
        )
    );

CREATE POLICY IF NOT EXISTS "entity_contacts_delete_admin"
    ON public.entity_contacts FOR DELETE
    TO authenticated
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
              AND r.code IN ('system_admin', 'hr_administrator', 'executive_director')
        )
    );

-- entity_supporting_documents: same pattern
CREATE POLICY IF NOT EXISTS "entity_docs_select"
    ON public.entity_supporting_documents FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY IF NOT EXISTS "entity_docs_insert"
    ON public.entity_supporting_documents FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "entity_docs_delete_owner_admin"
    ON public.entity_supporting_documents FOR DELETE
    TO authenticated
    USING (
        auth.uid() = uploaded_by
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
              AND r.code IN ('system_admin', 'hr_administrator', 'executive_director')
        )
    );

RAISE NOTICE 'entity_contacts and entity_supporting_documents tables created successfully.';
