-- ==============================================================================
-- Migration: 20261013170000_hr_schema.sql
-- Description: Phase 9 Human Resources, Staff Profiles, Personnel Documents,
--              Leave Management, Balances, Checklists with Row-Level Security
-- Babawatoto Organization Management System (BAOMS)
-- ==============================================================================

-- 1. Staff Profiles Table (Staff Records decoupled from mandatory auth logins)
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable: field staff may not have a system login
    staff_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    job_title TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN (
        'active',
        'probation',
        'on_leave',
        'suspended',
        'terminated'
    )),
    contract_type TEXT NOT NULL DEFAULT 'fixed_term' CHECK (contract_type IN (
        'permanent',
        'fixed_term',
        'consultant',
        'volunteer',
        'intern'
    )),
    start_date DATE NOT NULL,
    end_date DATE, -- NULL for permanent staff; set for fixed_term/consultant/volunteer
    supervisor_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_staff_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_number ON public.staff_profiles(staff_number);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON public.staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_dept ON public.staff_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_status ON public.staff_profiles(employment_status);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_contract ON public.staff_profiles(contract_type);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_end_date ON public.staff_profiles(end_date);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_supervisor ON public.staff_profiles(supervisor_id);

-- 2. Staff Documents Junction Table (Links staff to Phase 6 Documents)
CREATE TABLE IF NOT EXISTS public.staff_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'contract',
        'id_copy',
        'cv',
        'certificate',
        'job_description',
        'performance_review',
        'other'
    )),
    notes TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_staff_doc_type UNIQUE (staff_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_documents_staff ON public.staff_documents(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_documents_doc ON public.staff_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_staff_documents_type ON public.staff_documents(document_type);

-- 3. Leave Types Table
CREATE TABLE IF NOT EXISTS public.leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_sw TEXT NOT NULL,
    description_en TEXT,
    description_sw TEXT,
    days_allowed_per_year INTEGER NOT NULL DEFAULT 28 CHECK (days_allowed_per_year >= 0),
    requires_attachment BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leave_types_code ON public.leave_types(code);
CREATE INDEX IF NOT EXISTS idx_leave_types_active ON public.leave_types(is_active);

-- 4. Leave Balances Table (Tracks annual entitlements and used days)
CREATE TABLE IF NOT EXISTS public.leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year >= 2020),
    allocated_days INTEGER NOT NULL DEFAULT 28 CHECK (allocated_days >= 0),
    used_days INTEGER NOT NULL DEFAULT 0 CHECK (used_days >= 0),
    pending_days INTEGER NOT NULL DEFAULT 0 CHECK (pending_days >= 0),
    remaining_days INTEGER NOT NULL DEFAULT 28 CHECK (remaining_days >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_staff_leave_year UNIQUE (staff_id, leave_type_id, year),
    CONSTRAINT chk_leave_balance_integrity CHECK (allocated_days >= (used_days + pending_days))
);

CREATE INDEX IF NOT EXISTS idx_leave_balances_staff ON public.leave_balances(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_type ON public.leave_balances(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON public.leave_balances(year);

-- 5. Leave Requests Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT NOT NULL UNIQUE,
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE RESTRICT,
    leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL CHECK (days_requested > 0),
    reason TEXT NOT NULL,
    handover_staff_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'draft',
        'pending',
        'approved',
        'rejected',
        'cancelled'
    )),
    decision_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    decision_at TIMESTAMPTZ,
    decision_notes TEXT,
    attachment_doc_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_number ON public.leave_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_leave_requests_staff ON public.leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_type ON public.leave_requests(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_start ON public.leave_requests(start_date);

-- 6. Staff Checklists Table (Onboarding and Offboarding task tracking)
CREATE TABLE IF NOT EXISTS public.staff_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
    checklist_type TEXT NOT NULL CHECK (checklist_type IN ('onboarding', 'offboarding')),
    item_key TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_sw TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_staff_checklist_item UNIQUE (staff_id, checklist_type, item_key)
);

CREATE INDEX IF NOT EXISTS idx_staff_checklists_staff ON public.staff_checklists(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_checklists_type ON public.staff_checklists(checklist_type);

-- ------------------------------------------------------------------------------
-- Triggers for Updated At timestamps
-- ------------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_staff_profiles_updated_at
    BEFORE UPDATE ON public.staff_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_leave_balances_updated_at
    BEFORE UPDATE ON public.leave_balances
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_leave_requests_updated_at
    BEFORE UPDATE ON public.leave_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_staff_checklists_updated_at
    BEFORE UPDATE ON public.staff_checklists
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------------
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_checklists ENABLE ROW LEVEL SECURITY;

-- Staff Profiles Policies
-- HR Admin, Executive Director, System Admin have full management access
CREATE POLICY "hr_leadership_manage_staff_profiles"
    ON public.staff_profiles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.code IN ('hr_administrator', 'executive_director', 'system_admin')
        )
    );

-- Regular Staff can view their own profile
CREATE POLICY "staff_view_own_profile"
    ON public.staff_profiles FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
    );

-- Managers can view profiles of their supervisees
CREATE POLICY "managers_view_supervisees"
    ON public.staff_profiles FOR SELECT
    TO authenticated
    USING (
        supervisor_id IN (
            SELECT id FROM public.staff_profiles WHERE user_id = auth.uid()
        )
    );

-- Staff Documents Policies
CREATE POLICY "hr_leadership_manage_staff_documents"
    ON public.staff_documents FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.code IN ('hr_administrator', 'executive_director', 'system_admin')
        )
    );

CREATE POLICY "staff_view_own_documents"
    ON public.staff_documents FOR SELECT
    TO authenticated
    USING (
        staff_id IN (
            SELECT id FROM public.staff_profiles WHERE user_id = auth.uid()
        )
    );

-- Leave Types Policies (All authenticated users can view active leave types)
CREATE POLICY "all_authenticated_view_leave_types"
    ON public.leave_types FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "hr_admin_manage_leave_types"
    ON public.leave_types FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.code IN ('hr_administrator', 'system_admin')
        )
    );

-- Leave Balances Policies
CREATE POLICY "hr_leadership_manage_leave_balances"
    ON public.leave_balances FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.code IN ('hr_administrator', 'executive_director', 'system_admin')
        )
    );

CREATE POLICY "staff_view_own_leave_balances"
    ON public.leave_balances FOR SELECT
    TO authenticated
    USING (
        staff_id IN (
            SELECT id FROM public.staff_profiles WHERE user_id = auth.uid()
        )
    );

-- Leave Requests Policies
-- 1. View: HR & Leadership view all; Managers view supervisees; Staff view own
CREATE POLICY "hr_leadership_view_all_leave_requests"
    ON public.leave_requests FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.code IN ('hr_administrator', 'executive_director', 'system_admin')
        )
    );

CREATE POLICY "managers_view_team_leave_requests"
    ON public.leave_requests FOR SELECT
    TO authenticated
    USING (
        staff_id IN (
            SELECT id FROM public.staff_profiles
            WHERE supervisor_id IN (
                SELECT id FROM public.staff_profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "staff_view_own_leave_requests"
    ON public.leave_requests FOR SELECT
    TO authenticated
    USING (
        staff_id IN (
            SELECT id FROM public.staff_profiles WHERE user_id = auth.uid()
        )
    );

-- 2. Insert: Staff can submit requests for themselves (or HR on their behalf)
CREATE POLICY "staff_create_own_leave_requests"
    ON public.leave_requests FOR INSERT
    TO authenticated
    WITH CHECK (
        staff_id IN (
            SELECT id FROM public.staff_profiles WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.code IN ('hr_administrator', 'system_admin')
        )
    );

-- 3. Update / Review: Prohibit self-approval! Approver cannot be the staff member
CREATE POLICY "authorized_decision_on_leave_requests"
    ON public.leave_requests FOR UPDATE
    TO authenticated
    USING (
        -- Approver cannot be the applicant
        staff_id NOT IN (
            SELECT id FROM public.staff_profiles WHERE user_id = auth.uid()
        )
        AND (
            EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.code IN ('hr_administrator', 'executive_director', 'system_admin')
            )
            OR staff_id IN (
                SELECT id FROM public.staff_profiles
                WHERE supervisor_id IN (
                    SELECT id FROM public.staff_profiles WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Staff Checklists Policies
CREATE POLICY "hr_leadership_manage_checklists"
    ON public.staff_checklists FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.code IN ('hr_administrator', 'executive_director', 'system_admin')
        )
    );

CREATE POLICY "staff_view_own_checklists"
    ON public.staff_checklists FOR SELECT
    TO authenticated
    USING (
        staff_id IN (
            SELECT id FROM public.staff_profiles WHERE user_id = auth.uid()
        )
    );
