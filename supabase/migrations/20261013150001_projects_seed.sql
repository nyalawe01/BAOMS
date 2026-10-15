-- ==============================================================================
-- Babawatoto Organization Management System (BAOMS)
-- Migration: 20261013150001_projects_seed.sql
-- Description: Idempotent seed data for Projects, Project Members, Activities,
--              Tasks, Reports, and Budget Summaries.
-- ==============================================================================

DO $$
DECLARE
    v_dept_prj_id UUID;
    v_dept_exec_id UUID;
    v_pm_id UUID;
    v_coord_id UUID;
    v_admin_id UUID;
    v_prj1_id UUID;
    v_prj2_id UUID;
    v_prj3_id UUID;
    v_act1_id UUID;
    v_act2_id UUID;
    v_act3_id UUID;
BEGIN
    -- Resolve Department IDs
    SELECT id INTO v_dept_prj_id FROM public.departments WHERE code = 'PRJ' LIMIT 1;
    SELECT id INTO v_dept_exec_id FROM public.departments WHERE code = 'EXEC' LIMIT 1;

    -- Resolve Known User Profile IDs (if present in profiles)
    SELECT id INTO v_pm_id FROM public.profiles WHERE email = 'pm@babawatoto.org' LIMIT 1;
    SELECT id INTO v_coord_id FROM public.profiles WHERE email = 'coordinator@babawatoto.org' LIMIT 1;
    SELECT id INTO v_admin_id FROM public.profiles WHERE email = 'admin@babawatoto.org' LIMIT 1;

    -- Fallback dummy UUIDs if profiles table is empty in migration environment
    IF v_pm_id IS NULL THEN
        v_pm_id := '00000000-0000-0000-0000-000000000004'::UUID;
    END IF;
    IF v_coord_id IS NULL THEN
        v_coord_id := '00000000-0000-0000-0000-000000000005'::UUID;
    END IF;
    IF v_admin_id IS NULL THEN
        v_admin_id := '00000000-0000-0000-0000-000000000001'::UUID;
    END IF;

    -- 1. SEED PROJECTS
    -- Project 1: Babawatoto Youth Academy 2026
    INSERT INTO public.projects (
        id, project_code, name, description, funder, start_date, end_date,
        status, currency, total_budget, department_id, created_by
    )
    VALUES (
        '10000000-0000-0000-0000-000000000001'::UUID,
        'PRJ-BYA-2026',
        'Babawatoto Youth Academy 2026',
        'Arts, life skills, and digital literacy empowerment programs for vulnerable youth in Dar es Salaam.',
        'Foundation for Civil Society (FCS)',
        '2026-01-01',
        '2026-12-31',
        'active',
        'TZS',
        75000000.00,
        v_dept_prj_id,
        v_admin_id
    )
    ON CONFLICT (project_code) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        funder = EXCLUDED.funder,
        total_budget = EXCLUDED.total_budget,
        status = EXCLUDED.status,
        updated_at = now()
    RETURNING id INTO v_prj1_id;

    -- Project 2: Community Safe Spaces Outreach
    INSERT INTO public.projects (
        id, project_code, name, description, funder, start_date, end_date,
        status, currency, total_budget, department_id, created_by
    )
    VALUES (
        '10000000-0000-0000-0000-000000000002'::UUID,
        'PRJ-CSO-2026',
        'Community Safe Spaces & Child Protection Outreach',
        'Community-level psychosocial support, safe recreational hubs, and reporting mechanisms for child welfare in Temeke.',
        'UNICEF Tanzania & Local Government',
        '2026-03-01',
        '2026-11-30',
        'active',
        'TZS',
        48500000.00,
        v_dept_prj_id,
        v_admin_id
    )
    ON CONFLICT (project_code) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        funder = EXCLUDED.funder,
        total_budget = EXCLUDED.total_budget,
        status = EXCLUDED.status,
        updated_at = now()
    RETURNING id INTO v_prj2_id;

    -- Project 3: Maternal and Child Health Education Initiative
    INSERT INTO public.projects (
        id, project_code, name, description, funder, start_date, end_date,
        status, currency, total_budget, department_id, created_by
    )
    VALUES (
        '10000000-0000-0000-0000-000000000003'::UUID,
        'PRJ-MCH-2025',
        'Maternal & Child Health Grassroots Education 2025',
        'Completed community health worker training and maternal nutrition workshops across 12 ward health centers.',
        'Global Health Partners / Ministry of Health',
        '2025-01-01',
        '2025-12-31',
        'completed',
        'TZS',
        62000000.00,
        v_dept_prj_id,
        v_admin_id
    )
    ON CONFLICT (project_code) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        funder = EXCLUDED.funder,
        total_budget = EXCLUDED.total_budget,
        status = EXCLUDED.status,
        updated_at = now()
    RETURNING id INTO v_prj3_id;

    -- 2. SEED PROJECT MEMBERS (Only if user profiles actually exist in profiles table to satisfy foreign keys)
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_pm_id) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = v_coord_id) THEN
        -- Project 1 Assignments: Mariam (Manager), Juma (Coordinator)
        INSERT INTO public.project_members (project_id, user_id, project_role, assigned_by)
        VALUES
            (v_prj1_id, v_pm_id, 'manager', v_admin_id),
            (v_prj1_id, v_coord_id, 'coordinator', v_admin_id)
        ON CONFLICT (project_id, user_id) DO UPDATE SET project_role = EXCLUDED.project_role;

        -- Project 2 Assignments: Mariam (Manager), Juma (Coordinator)
        INSERT INTO public.project_members (project_id, user_id, project_role, assigned_by)
        VALUES
            (v_prj2_id, v_pm_id, 'manager', v_admin_id),
            (v_prj2_id, v_coord_id, 'coordinator', v_admin_id)
        ON CONFLICT (project_id, user_id) DO UPDATE SET project_role = EXCLUDED.project_role;

        -- Project 3 Assignments: Mariam (Manager)
        INSERT INTO public.project_members (project_id, user_id, project_role, assigned_by)
        VALUES
            (v_prj3_id, v_pm_id, 'manager', v_admin_id)
        ON CONFLICT (project_id, user_id) DO UPDATE SET project_role = EXCLUDED.project_role;
    END IF;

    -- 3. SEED PROJECT BUDGETS
    INSERT INTO public.project_budgets (
        project_id, currency, total_allocated, total_spent, total_committed, last_reviewed_at
    )
    VALUES
        (v_prj1_id, 'TZS', 75000000.00, 24500000.00, 8000000.00, now()),
        (v_prj2_id, 'TZS', 48500000.00, 12200000.00, 4500000.00, now()),
        (v_prj3_id, 'TZS', 62000000.00, 61850000.00, 0.00, now())
    ON CONFLICT (project_id) DO UPDATE SET
        total_allocated = EXCLUDED.total_allocated,
        total_spent = EXCLUDED.total_spent,
        total_committed = EXCLUDED.total_committed,
        last_reviewed_at = now();

    -- 4. SEED ACTIVITIES (Only if user profiles exist)
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_coord_id) THEN
        -- Activity 1: Approved Art & Theater Workshop
        INSERT INTO public.activities (
            id, project_id, title, description, activity_date, location, participants_count,
            progress, challenges, follow_up_actions, submission_status, submitted_by, submitted_at,
            reviewed_by, reviewed_at, review_comments
        )
        VALUES (
            '20000000-0000-0000-0000-000000000001'::UUID,
            v_prj1_id,
            'Youth Theater & Expression Workshop Session 1',
            'Introductory physical theater, improvisation, and child rights awareness session held at Kigamboni Community Center.',
            '2026-02-15',
            'Kigamboni Center, Dar es Salaam',
            45,
            'Successfully conducted 3 full sessions with 45 youth (24 girls, 21 boys). High engagement observed.',
            'Rain caused a 30-minute delay in outdoor setup.',
            'Schedule photography and digital video recording for Session 2.',
            'approved',
            v_coord_id,
            '2026-02-16 10:00:00+03',
            v_pm_id,
            '2026-02-17 14:30:00+03',
            'Excellent attendance and thorough documentation. Approved.'
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id INTO v_act1_id;

        -- Activity 2: Submitted Community Dialogues
        INSERT INTO public.activities (
            id, project_id, title, description, activity_date, location, participants_count,
            progress, challenges, follow_up_actions, submission_status, submitted_by, submitted_at
        )
        VALUES (
            '20000000-0000-0000-0000-000000000002'::UUID,
            v_prj1_id,
            'Ward Stakeholder Dialogue on Youth Mentorship',
            'Consultative forum with ward local government leaders, religious leaders, and youth peer educators.',
            '2026-03-20',
            'Temeke Ward Executive Office Hall',
            32,
            'Identified 8 community mentorship locations and agreed on youth referral guidelines.',
            'Limited meeting space capacity at the ward office.',
            'Draft formal minutes and share with Ward Development Committee.',
            'submitted',
            v_coord_id,
            '2026-03-21 09:15:00+03'
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id INTO v_act2_id;

        -- Activity 3: Returned for Correction Activity
        INSERT INTO public.activities (
            id, project_id, title, description, activity_date, location, participants_count,
            progress, challenges, follow_up_actions, submission_status, submitted_by, submitted_at,
            reviewed_by, reviewed_at, review_comments
        )
        VALUES (
            '20000000-0000-0000-0000-000000000003'::UUID,
            v_prj2_id,
            'Community Safe Hub Site Assessment',
            'Preliminary reconnaissance of primary school grounds for child-safe recreational zones.',
            '2026-03-10',
            'Mbagala Primary School Grounds',
            12,
            'Visited 3 school sites and evaluated perimeter fencing and sanitation facilities.',
            'School leadership requested formal letter from District Education Officer before granting full access.',
            'Obtain clearance letter from DEO and re-visit remaining 2 schools.',
            'returned_for_correction',
            v_coord_id,
            '2026-03-11 11:00:00+03',
            v_pm_id,
            '2026-03-12 16:00:00+03',
            'Please attach the initial site checklist and specify exact ward boundaries before resubmitting.'
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id INTO v_act3_id;

        -- 5. SEED TASKS
        INSERT INTO public.tasks (
            project_id, activity_id, title, description, assigned_to, due_date,
            priority, status, created_by
        )
        VALUES
            (
                v_prj1_id,
                v_act1_id,
                'Procure workshop art materials & refreshments',
                'Deliver paints, paper, drawing boards, and bottled water to Kigamboni Center.',
                v_coord_id,
                '2026-02-14',
                'high',
                'completed',
                v_pm_id
            ),
            (
                v_prj1_id,
                v_act2_id,
                'Finalize Ward Consultation Minutes and Referral Protocol',
                'Compile stakeholder feedback and prepare final agreement document for signing.',
                v_coord_id,
                '2026-04-10',
                'medium',
                'in_progress',
                v_pm_id
            ),
            (
                v_prj2_id,
                v_act3_id,
                'Secure DEO Clearance Letter for Safe Hub Schools',
                'Follow up with Temeke Municipal Education Office to receive official permit.',
                v_coord_id,
                '2026-04-05',
                'urgent',
                'todo',
                v_pm_id
            );
    END IF;

    -- 6. SEED PROJECT REPORTS
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_pm_id) THEN
        INSERT INTO public.project_reports (
            project_id, report_type, title, reporting_period_start, reporting_period_end,
            summary, achievements, challenges, recommendations, status, submitted_by, submitted_at
        )
        VALUES (
            v_prj1_id,
            'quarterly',
            'Q1 2026 Progress Report: Babawatoto Youth Academy',
            '2026-01-01',
            '2026-03-31',
            'During Q1 2026, the BYA project achieved 92% of target milestone outputs, reaching over 45 youth directly.',
            'Successfully launched theater sessions, engaged 32 ward stakeholders, and established child safeguarding team.',
            'Unseasonal rainfall delayed outdoor outreach by 1 week; resolved by securing indoor community centers.',
            'Expand peer educator leadership training to 15 additional secondary schools in Q2.',
            'approved',
            v_pm_id,
            '2026-04-02 11:30:00+03'
        );
    END IF;

END $$;
