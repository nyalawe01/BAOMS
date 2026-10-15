-- ==============================================================================
-- Migration: 20261013150000_projects_schema.sql
-- Description: Phase 7 Projects, Project Members, Activities, Tasks, Reports,
--              and Budget Summaries with Row-Level Security
-- Babawatoto Organization Management System (BAOMS)
-- ==============================================================================

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    funder TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    currency TEXT NOT NULL DEFAULT 'TZS',
    total_budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_budget >= 0),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_project_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON public.projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_projects_funder ON public.projects(funder);

-- 2. Project Members Junction Table
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_role TEXT NOT NULL CHECK (project_role IN ('manager', 'coordinator', 'officer', 'viewer')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);

-- 3. Activities Table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL,
    location TEXT,
    participants_count INTEGER DEFAULT 0 CHECK (participants_count >= 0),
    progress TEXT NOT NULL,
    challenges TEXT,
    follow_up_actions TEXT,
    submission_status TEXT NOT NULL DEFAULT 'draft' CHECK (submission_status IN ('draft', 'submitted', 'approved', 'returned_for_correction')),
    submitted_by UUID NOT NULL REFERENCES public.profiles(id),
    submitted_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_project ON public.activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(submission_status);
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(activity_date);

-- 4. Activity Documents (Supporting Evidence)
CREATE TABLE IF NOT EXISTS public.activity_documents (
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    attached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (activity_id, document_id)
);

-- 5. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date DATE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- 6. Project Reports Table
CREATE TABLE IF NOT EXISTS public.project_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('monthly', 'quarterly', 'annual', 'midterm', 'final')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
    submitted_by UUID NOT NULL REFERENCES public.profiles(id),
    submitted_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_report_period CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_reports_project ON public.project_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.project_reports(report_type);

-- 7. Project Budgets Breakdown Table
CREATE TABLE IF NOT EXISTS public.project_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    allocated_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (allocated_amount >= 0),
    committed_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (committed_amount >= 0),
    spent_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (spent_amount >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budgets_project ON public.project_budgets(project_id);

-- Triggers for updated_at
CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_activities_updated_at
    BEFORE UPDATE ON public.activities
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_project_reports_updated_at
    BEFORE UPDATE ON public.project_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_project_budgets_updated_at
    BEFORE UPDATE ON public.project_budgets
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;

-- Helper function to check project membership
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_id = p_project_id
        AND user_id = auth.uid()
    );
$$;

-- Projects RLS
CREATE POLICY "projects_select_policy"
    ON public.projects FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_permission('projects.view')
        OR public.is_project_member(id)
    );

CREATE POLICY "projects_insert_policy"
    ON public.projects FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_permission('projects.create')
    );

CREATE POLICY "projects_update_policy"
    ON public.projects FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_permission('projects.manage')
    );

-- Project Members RLS
CREATE POLICY "project_members_select_policy"
    ON public.project_members FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_permission('projects.view')
        OR user_id = auth.uid()
    );

CREATE POLICY "project_members_manage_policy"
    ON public.project_members FOR ALL
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_permission('projects.manage')
    );

-- Activities RLS
CREATE POLICY "activities_select_policy"
    ON public.activities FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_permission('projects.view')
        OR public.is_project_member(project_id)
    );

CREATE POLICY "activities_insert_policy"
    ON public.activities FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR public.has_role('executive_director')
        OR (
            public.has_permission('projects.report')
            AND public.is_project_member(project_id)
        )
    );

CREATE POLICY "activities_update_policy"
    ON public.activities FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR (
            public.has_permission('projects.manage')
            AND public.is_project_member(project_id)
        )
        OR (
            submitted_by = auth.uid()
            AND submission_status IN ('draft', 'returned_for_correction')
        )
    );

-- Tasks RLS
CREATE POLICY "tasks_select_policy"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_permission('projects.view')
        OR public.is_project_member(project_id)
        OR assigned_to = auth.uid()
    );

CREATE POLICY "tasks_manage_policy"
    ON public.tasks FOR ALL
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR (
            public.has_permission('projects.manage')
            AND public.is_project_member(project_id)
        )
        OR assigned_to = auth.uid()
    );

-- Budgets RLS (Restricted to Finance, Executive Director, Admins, and PMs)
CREATE POLICY "budgets_select_policy"
    ON public.project_budgets FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_role('finance_officer')
        OR (
            public.has_role('project_manager')
            AND public.is_project_member(project_id)
        )
    );

CREATE POLICY "budgets_manage_policy"
    ON public.project_budgets FOR ALL
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_role('finance_officer')
    );
