-- ============================================================================
-- BAOMS Phase 10: Correspondence, Meetings & Reporting Schema
-- Babawatoto Organization Management System
-- ============================================================================

-- 1. Correspondence Register Table
CREATE TABLE IF NOT EXISTS public.correspondence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT NOT NULL UNIQUE,
    direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    correspondence_date DATE NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'donor',
        'government',
        'legal',
        'partner',
        'community',
        'general'
    )),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
        'received',
        'draft',
        'under_review',
        'approved',
        'dispatched',
        'archived'
    )),
    confidentiality_level TEXT NOT NULL DEFAULT 'internal' CHECK (confidentiality_level IN (
        'public',
        'internal',
        'confidential'
    )),
    notes TEXT,
    registered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_correspondence_ref ON public.correspondence(reference_number);
CREATE INDEX IF NOT EXISTS idx_correspondence_direction ON public.correspondence(direction);
CREATE INDEX IF NOT EXISTS idx_correspondence_date ON public.correspondence(correspondence_date);
CREATE INDEX IF NOT EXISTS idx_correspondence_project ON public.correspondence(project_id);
CREATE INDEX IF NOT EXISTS idx_correspondence_status ON public.correspondence(status);
CREATE INDEX IF NOT EXISTS idx_correspondence_category ON public.correspondence(category);

-- 2. Meetings Register Table
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    meeting_type TEXT NOT NULL CHECK (meeting_type IN (
        'board',
        'management',
        'staff',
        'project',
        'donor',
        'committee'
    )),
    meeting_date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    chairperson_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    secretary_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    minutes_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN (
        'scheduled',
        'in_progress',
        'completed',
        'adjourned',
        'cancelled'
    )),
    confidentiality_level TEXT NOT NULL DEFAULT 'internal' CHECK (confidentiality_level IN (
        'public',
        'internal',
        'confidential'
    )),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_number ON public.meetings(meeting_number);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_type ON public.meetings(meeting_type);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);

-- 3. Meeting Attendees Table
CREATE TABLE IF NOT EXISTS public.meeting_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    external_name TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'participant',
    attended BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting ON public.meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user ON public.meeting_attendees(user_id);

-- 4. Meeting Decisions Table
CREATE TABLE IF NOT EXISTS public.meeting_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    decision_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'operational',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_decisions_meeting ON public.meeting_decisions(meeting_id);

-- 5. Meeting Actions / Follow-ups Table
CREATE TABLE IF NOT EXISTS public.meeting_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    decision_id UUID REFERENCES public.meeting_decisions(id) ON DELETE SET NULL,
    action_number TEXT NOT NULL,
    task_description TEXT NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_to_name TEXT,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'in_progress',
        'completed',
        'overdue',
        'cancelled'
    )),
    completion_notes TEXT,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_actions_meeting ON public.meeting_actions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_actions_assigned ON public.meeting_actions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_meeting_actions_status ON public.meeting_actions(status);
CREATE INDEX IF NOT EXISTS idx_meeting_actions_due_date ON public.meeting_actions(due_date);

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE public.correspondence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_actions ENABLE ROW LEVEL SECURITY;

-- Correspondence RLS Policies
CREATE POLICY "correspondence_select_policy" ON public.correspondence
    FOR SELECT USING (
        -- Admins and Executive Directors see all correspondence
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.code IN ('system_admin', 'executive_director')
        )
        OR
        -- Non-confidential correspondence is visible to all authenticated staff
        confidentiality_level != 'confidential'
        OR
        -- Registered author can see their confidential records
        registered_by = auth.uid()
    );

CREATE POLICY "correspondence_insert_policy" ON public.correspondence
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

CREATE POLICY "correspondence_update_policy" ON public.correspondence
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.code IN ('system_admin', 'executive_director', 'project_manager')
        )
        OR registered_by = auth.uid()
    );

-- Meetings RLS Policies
CREATE POLICY "meetings_select_policy" ON public.meetings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.code IN ('system_admin', 'executive_director')
        )
        OR confidentiality_level != 'confidential'
        OR chairperson_id = auth.uid()
        OR secretary_id = auth.uid()
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.meeting_attendees ma
            WHERE ma.meeting_id = id AND ma.user_id = auth.uid()
        )
    );

CREATE POLICY "meetings_insert_update_policy" ON public.meetings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.code IN ('system_admin', 'executive_director', 'project_manager', 'hr_administrator')
        )
    );

-- Meeting Attendees, Decisions & Actions RLS Policies
CREATE POLICY "meeting_attendees_all_policy" ON public.meeting_attendees
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "meeting_decisions_all_policy" ON public.meeting_decisions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "meeting_actions_all_policy" ON public.meeting_actions
    FOR ALL USING (auth.role() = 'authenticated');
