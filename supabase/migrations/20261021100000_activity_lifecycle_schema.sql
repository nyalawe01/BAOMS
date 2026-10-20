-- ============================================================================
-- BAOMS Activity-Centric Project Lifecycle & Results Framework Hierarchy Schema
-- Migration: 20261021100000_activity_lifecycle_schema.sql
-- ============================================================================

-- 1. Project Outcomes Table (Intended Changes / Strategic Results)
CREATE TABLE IF NOT EXISTS public.project_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    outcome_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_indicator TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_project_outcome_code UNIQUE (project_id, outcome_code)
);

CREATE INDEX IF NOT EXISTS idx_project_outcomes_project ON public.project_outcomes(project_id);

-- 2. Project Outputs Table (Tangible Deliverables Nested Under Outcomes)
CREATE TABLE IF NOT EXISTS public.project_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outcome_id UUID NOT NULL REFERENCES public.project_outcomes(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    output_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_quantity NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    target_unit TEXT NOT NULL DEFAULT 'deliverable',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_outcome_output_code UNIQUE (outcome_id, output_code)
);

CREATE INDEX IF NOT EXISTS idx_project_outputs_outcome ON public.project_outputs(outcome_id);
CREATE INDEX IF NOT EXISTS idx_project_outputs_project ON public.project_outputs(project_id);

-- 3. Extend Activities Table with Results Hierarchy & Multi-Workflow Decoupled Statuses
DO $$
BEGIN
    -- Hierarchy Linkage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'activity_code') THEN
        ALTER TABLE public.activities ADD COLUMN activity_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'outcome_id') THEN
        ALTER TABLE public.activities ADD COLUMN outcome_id UUID REFERENCES public.project_outcomes(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'output_id') THEN
        ALTER TABLE public.activities ADD COLUMN output_id UUID REFERENCES public.project_outputs(id) ON DELETE SET NULL;
    END IF;

    -- Operational Attributes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'target_participants') THEN
        ALTER TABLE public.activities ADD COLUMN target_participants INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'budget_estimated') THEN
        ALTER TABLE public.activities ADD COLUMN budget_estimated NUMERIC(15, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'ward_location') THEN
        ALTER TABLE public.activities ADD COLUMN ward_location TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'assigned_staff_id') THEN
        ALTER TABLE public.activities ADD COLUMN assigned_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- Decoupled Lifecycle Statuses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'request_status') THEN
        ALTER TABLE public.activities ADD COLUMN request_status TEXT NOT NULL DEFAULT 'not_submitted'
            CHECK (request_status IN ('not_submitted', 'draft', 'submitted', 'under_review', 'returned', 'approved', 'rejected'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'procurement_status') THEN
        ALTER TABLE public.activities ADD COLUMN procurement_status TEXT NOT NULL DEFAULT 'not_required'
            CHECK (procurement_status IN ('not_required', 'not_started', 'requisition', 'quotations', 'order_approved', 'ordered', 'partially_delivered', 'delivered'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'implementation_status') THEN
        ALTER TABLE public.activities ADD COLUMN implementation_status TEXT NOT NULL DEFAULT 'planned'
            CHECK (implementation_status IN ('planned', 'ready', 'in_progress', 'conducted_pending_verification', 'verified'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'me_status') THEN
        ALTER TABLE public.activities ADD COLUMN me_status TEXT NOT NULL DEFAULT 'draft'
            CHECK (me_status IN ('draft', 'submitted', 'pending_review', 'verified', 'returned_for_correction'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'retirement_status') THEN
        ALTER TABLE public.activities ADD COLUMN retirement_status TEXT NOT NULL DEFAULT 'not_started'
            CHECK (retirement_status IN ('not_started', 'draft', 'submitted', 'finance_review', 'returned', 'approved', 'closed'));
    END IF;

    -- Pre-implementation Request & Authorization
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'request_title') THEN
        ALTER TABLE public.activities ADD COLUMN request_title TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'request_description') THEN
        ALTER TABLE public.activities ADD COLUMN request_description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'requested_date') THEN
        ALTER TABLE public.activities ADD COLUMN requested_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'tor_document_id') THEN
        ALTER TABLE public.activities ADD COLUMN tor_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'authorized_by') THEN
        ALTER TABLE public.activities ADD COLUMN authorized_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'authorized_at') THEN
        ALTER TABLE public.activities ADD COLUMN authorized_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'authorization_comments') THEN
        ALTER TABLE public.activities ADD COLUMN authorization_comments TEXT;
    END IF;

    -- Financial Retirement Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'retired_amount') THEN
        ALTER TABLE public.activities ADD COLUMN retired_amount NUMERIC(15, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'retirement_variance') THEN
        ALTER TABLE public.activities ADD COLUMN retirement_variance NUMERIC(15, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'retirement_receipts_count') THEN
        ALTER TABLE public.activities ADD COLUMN retirement_receipts_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'retired_by') THEN
        ALTER TABLE public.activities ADD COLUMN retired_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'retired_at') THEN
        ALTER TABLE public.activities ADD COLUMN retired_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'retirement_approved_by') THEN
        ALTER TABLE public.activities ADD COLUMN retirement_approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'retirement_approved_at') THEN
        ALTER TABLE public.activities ADD COLUMN retirement_approved_at TIMESTAMPTZ;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activities_output ON public.activities(output_id);
CREATE INDEX IF NOT EXISTS idx_activities_outcome ON public.activities(outcome_id);
CREATE INDEX IF NOT EXISTS idx_activities_req_status ON public.activities(request_status);
CREATE INDEX IF NOT EXISTS idx_activities_impl_status ON public.activities(implementation_status);
CREATE INDEX IF NOT EXISTS idx_activities_ret_status ON public.activities(retirement_status);

-- 4. Individual Participant Records (With Deduplication & Disaggregation)
CREATE TABLE IF NOT EXISTS public.activity_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    age_group TEXT CHECK (age_group IN ('children_0_12', 'youth_13_24', 'adults_25_59', 'elderly_60_plus', 'unknown')),
    phone_number TEXT,
    disability_status TEXT DEFAULT 'none' CHECK (disability_status IN ('none', 'physical', 'visual', 'hearing', 'intellectual', 'multiple', 'prefer_not_to_say')),
    ward TEXT,
    attendance_confirmed BOOLEAN NOT NULL DEFAULT true,
    per_diem_received NUMERIC(15, 2) DEFAULT 0.00,
    verified_by_me BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_activity_participant UNIQUE (activity_id, full_name, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_activity_participants_activity ON public.activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_project ON public.activity_participants(project_id);

-- 5. Row-Level Security Policies for Results Hierarchy
ALTER TABLE public.project_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on project_outcomes"
    ON public.project_outcomes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow managers and admins to write project_outcomes"
    ON public.project_outcomes FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_outcomes.project_id
            AND pm.user_id = auth.uid()
            AND pm.project_role IN ('manager', 'coordinator')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('system_admin', 'executive_director', 'me_officer')
        )
    );

CREATE POLICY "Allow authenticated read on project_outputs"
    ON public.project_outputs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow managers and admins to write project_outputs"
    ON public.project_outputs FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_outputs.project_id
            AND pm.user_id = auth.uid()
            AND pm.project_role IN ('manager', 'coordinator')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('system_admin', 'executive_director', 'me_officer')
        )
    );

CREATE POLICY "Allow authenticated read on activity_participants"
    ON public.activity_participants FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow staff to insert participants"
    ON public.activity_participants FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = activity_participants.project_id
            AND pm.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('system_admin', 'executive_director', 'me_officer', 'project_coordinator')
        )
    );
