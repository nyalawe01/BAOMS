-- ==============================================================================
-- Migration: 20261013170001_hr_seed.sql
-- Description: Idempotent Seed Data for Phase 9 Human Resources:
--              Leave types, staff profiles (with and without system logins),
--              leave balances, leave requests, and onboarding/offboarding checklists
-- Babawatoto Organization Management System (BAOMS)
-- ==============================================================================

-- 1. Seed Leave Types (Statutory Tanzanian NGO Standards)
INSERT INTO public.leave_types (id, code, name_en, name_sw, description_en, description_sw, days_allowed_per_year, requires_attachment, is_active)
VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        'ANNUAL',
        'Annual Leave',
        'Likizo ya Mwaka',
        'Statutory paid annual recreational leave entitlement.',
        'Likizo ya kisheria ya mapumziko ya mwaka yenye malipo.',
        28,
        false,
        true
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'SICK',
        'Sick Leave',
        'Likizo ya Ugonjwa',
        'Medical leave requiring registered practitioner certificate for absences > 2 days.',
        'Likizo ya matibabu inayohitaji cheti cha daktari aliyesajiliwa kwa zaidi ya siku 2.',
        14,
        true,
        true
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'MATERNITY',
        'Maternity Leave',
        'Likizo ya Uzazi (Mama)',
        'Statutory maternity leave for female personnel.',
        'Likizo ya uzazi ya kisheria kwa watumishi wa kike.',
        84,
        true,
        true
    ),
    (
        '10000000-0000-0000-0000-000000000004',
        'PATERNITY',
        'Paternity Leave',
        'Likizo ya Uzazi (Baba)',
        'Statutory paid paternity leave for male personnel upon childbirth.',
        'Likizo ya kisheria ya uzazi kwa mtumishi wa kiume baada ya mzazi kujifungua.',
        7,
        false,
        true
    ),
    (
        '10000000-0000-0000-0000-000000000005',
        'COMPASSIONATE',
        'Compassionate Leave',
        'Likizo ya Msiba au Dharura',
        'Special leave granted for bereavement or critical family emergencies.',
        'Likizo maalum inayotolewa wakati wa msiba au dharura nzito ya kifamilia.',
        5,
        false,
        true
    ),
    (
        '10000000-0000-0000-0000-000000000006',
        'STUDY',
        'Study & Exam Leave',
        'Likizo ya Masomo na Mitihani',
        'Leave granted for professional development and sitting recognized exams.',
        'Likizo inayotolewa kwa ajili ya kujiendeleza kitaluma na kufanya mitihani rasmi.',
        14,
        true,
        true
    )
ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_sw = EXCLUDED.name_sw,
    description_en = EXCLUDED.description_en,
    description_sw = EXCLUDED.description_sw,
    days_allowed_per_year = EXCLUDED.days_allowed_per_year,
    requires_attachment = EXCLUDED.requires_attachment;

-- 2. Seed Staff Profiles
-- Note: Rehema, Daudi, and Joyce have user_id = NULL (demonstrating staff without system logins)
DO $$
DECLARE
    dept_exec_id UUID;
    dept_fin_id UUID;
    dept_prj_id UUID;
    dept_hr_id UUID;
    dept_admin_id UUID;
BEGIN
    SELECT id INTO dept_exec_id FROM public.departments WHERE code = 'EXEC' LIMIT 1;
    SELECT id INTO dept_fin_id FROM public.departments WHERE code = 'FIN' LIMIT 1;
    SELECT id INTO dept_prj_id FROM public.departments WHERE code = 'PRJ' LIMIT 1;
    SELECT id INTO dept_hr_id FROM public.departments WHERE code = 'HR' LIMIT 1;
    SELECT id INTO dept_admin_id FROM public.departments WHERE code = 'ADMIN' LIMIT 1;

    -- Executive Director (Elisha N. Mwakipesile)
    INSERT INTO public.staff_profiles (
        id, user_id, staff_number, full_name, email, phone_number,
        job_title, department_id, employment_status, contract_type,
        start_date, end_date, supervisor_id,
        emergency_contact_name, emergency_contact_phone, notes
    ) VALUES (
        '20000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'STF-2024-001',
        'Elisha N. Mwakipesile',
        'director@babawatoto.org',
        '+255 754 222 002',
        'Executive Director',
        dept_exec_id,
        'active',
        'permanent',
        '2024-01-01',
        NULL,
        NULL,
        'Sarah Mwakipesile',
        '+255 754 222 999',
        'Executive Leadership and Organization Spokesperson'
    ) ON CONFLICT (staff_number) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    -- HR Administrator (Amina L. Kimaro)
    INSERT INTO public.staff_profiles (
        id, user_id, staff_number, full_name, email, phone_number,
        job_title, department_id, employment_status, contract_type,
        start_date, end_date, supervisor_id,
        emergency_contact_name, emergency_contact_phone, notes
    ) VALUES (
        '20000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000006',
        'STF-2024-002',
        'Amina L. Kimaro',
        'hr@babawatoto.org',
        '+255 754 666 006',
        'HR & Administration Manager',
        dept_hr_id,
        'active',
        'permanent',
        '2024-02-01',
        NULL,
        '20000000-0000-0000-0000-000000000001',
        'David Kimaro',
        '+255 754 666 999',
        'Human resources administration and compliance'
    ) ON CONFLICT (staff_number) DO UPDATE SET
        full_name = EXCLUDED.full_name;

    -- Finance Officer (Baraka Said)
    INSERT INTO public.staff_profiles (
        id, user_id, staff_number, full_name, email, phone_number,
        job_title, department_id, employment_status, contract_type,
        start_date, end_date, supervisor_id,
        emergency_contact_name, emergency_contact_phone, notes
    ) VALUES (
        '20000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000003',
        'STF-2024-003',
        'Baraka Said',
        'finance@babawatoto.org',
        '+255 754 333 003',
        'Finance & Operations Officer',
        dept_fin_id,
        'active',
        'permanent',
        '2024-03-01',
        NULL,
        '20000000-0000-0000-0000-000000000001',
        'Halima Said',
        '+255 754 333 999',
        'Financial management and compliance'
    ) ON CONFLICT (staff_number) DO UPDATE SET
        full_name = EXCLUDED.full_name;

    -- Project Manager (Mariam M. Juma) - Expires in 45 days (Contract Reminder!)
    INSERT INTO public.staff_profiles (
        id, user_id, staff_number, full_name, email, phone_number,
        job_title, department_id, employment_status, contract_type,
        start_date, end_date, supervisor_id,
        emergency_contact_name, emergency_contact_phone, notes
    ) VALUES (
        '20000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000004',
        'STF-2024-004',
        'Mariam M. Juma',
        'pm@babawatoto.org',
        '+255 754 444 004',
        'Project Manager',
        dept_prj_id,
        'active',
        'fixed_term',
        '2024-04-01',
        CURRENT_DATE + INTERVAL '45 days', -- Contract expiry within 45 days
        '20000000-0000-0000-0000-000000000001',
        'Mohamed Juma',
        '+255 754 444 999',
        'Overall project management and donor liaison'
    ) ON CONFLICT (staff_number) DO UPDATE SET
        full_name = EXCLUDED.full_name;

    -- Project Coordinator (Juma K. Temu)
    INSERT INTO public.staff_profiles (
        id, user_id, staff_number, full_name, email, phone_number,
        job_title, department_id, employment_status, contract_type,
        start_date, end_date, supervisor_id,
        emergency_contact_name, emergency_contact_phone, notes
    ) VALUES (
        '20000000-0000-0000-0000-000000000005',
        '00000000-0000-0000-0000-000000000005',
        'STF-2024-005',
        'Juma K. Temu',
        'coordinator@babawatoto.org',
        '+255 754 555 005',
        'Senior Project Coordinator',
        dept_prj_id,
        'active',
        'fixed_term',
        '2024-06-01',
        CURRENT_DATE + INTERVAL '240 days',
        '20000000-0000-0000-0000-000000000004',
        'Zainab Temu',
        '+255 754 555 999',
        'Field coordination and youth academy training'
    ) ON CONFLICT (staff_number) DO UPDATE SET
        full_name = EXCLUDED.full_name;

    -- IT & Systems Administrator (Amani Bakari)
    INSERT INTO public.staff_profiles (
        id, user_id, staff_number, full_name, email, phone_number,
        job_title, department_id, employment_status, contract_type,
        start_date, end_date, supervisor_id,
        emergency_contact_name, emergency_contact_phone, notes
    ) VALUES (
        '20000000-0000-0000-0000-000000000006',
        '00000000-0000-0000-0000-000000000001',
        'STF-2024-006',
        'Amani Bakari',
        'admin@babawatoto.org',
        '+255 754 111 001',
        'IT & Systems Administrator',
        dept_admin_id,
        'active',
        'permanent',
        '2024-01-15',
        NULL,
        '20000000-0000-0000-0000-000000000001',
        'Fatma Bakari',
        '+255 754 111 999',
        'Infrastructure and security administration'
    ) ON CONFLICT (staff_number) DO UPDATE SET
        full_name = EXCLUDED.full_name;

    -- Non-Login Staff 1: Rehema S. Msuya (Community Outreach Facilitator, Expires in 22 days!)
    INSERT INTO public.staff_profiles (
        id, user_id, staff_number, full_name, email, phone_number,
        job_title, department_id, employment_status, contract_type,
        start_date, end_date, supervisor_id,
        emergency_contact_name, emergency_contact_phone, notes
    ) VALUES (
        '20000000-0000-0000-0000-000000000007',
        NULL, -- No system login
        'STF-2025-007',
        'Rehema S. Msuya',
        'rehema.msuya@babawatoto.org',
        '+255 754 777 001',
        'Community Outreach Facilitator',
        dept_prj_id,
        'active',
        'fixed_term',
        '2025-01-01',
        CURRENT_DATE + INTERVAL '22 days', -- Urgent contract expiry reminder!
        '20000000-0000-0000-0000-000000000005',
        'Selemani Msuya',
        '+255 754 777 999',
        'Field mobilization and community drama workshops. No system login required.'
    ) ON CONFLICT (staff_number) DO UPDATE SET
        full_name = EXCLUDED.full_name;

    -- Non-Login Staff 2: Daudi J. Matiko (Youth Arts Instructor & Mentor)
    INSERT INTO public.staff_profiles (
        id, user_id, staff_number, full_name, email, phone_number,
        job_title, department_id, employment_status, contract_type,
        start_date, end_date, supervisor_id,
        emergency_contact_name, emergency_contact_phone, notes
    ) VALUES (
        '20000000-0000-0000-0000-000000000008',
        NULL, -- No system login
        'STF-2025-008',
        'Daudi J. Matiko',
        'daudi.matiko@babawatoto.org',
        '+255 754 888 002',
        'Youth Arts Instructor & Mentor',
        dept_prj_id,
        'active',
        'fixed_term',
        '2025-03-01',
        CURRENT_DATE + INTERVAL '320 days',
        '20000000-0000-0000-0000-000000000004',
        'Asha Matiko',
        '+255 754 888 999',
        'Acrobatics and performing arts instructor. Field based.'
    ) ON CONFLICT (staff_number) DO UPDATE SET
        full_name = EXCLUDED.full_name;

    -- Non-Login Staff 3: Joyce E. Mwenda (Logistics & Transport Assistant, on probation!)
    INSERT INTO public.staff_profiles (
        id, user_id, staff_number, full_name, email, phone_number,
        job_title, department_id, employment_status, contract_type,
        start_date, end_date, supervisor_id,
        emergency_contact_name, emergency_contact_phone, notes
    ) VALUES (
        '20000000-0000-0000-0000-000000000009',
        NULL, -- No system login
        'STF-2026-009',
        'Joyce E. Mwenda',
        'joyce.mwenda@babawatoto.org',
        '+255 754 999 003',
        'Logistics & Transport Assistant',
        dept_fin_id,
        'probation',
        'fixed_term',
        CURRENT_DATE - INTERVAL '60 days',
        CURRENT_DATE + INTERVAL '30 days', -- Probation review in 30 days
        '20000000-0000-0000-0000-000000000003',
        'Edward Mwenda',
        '+255 754 999 999',
        'Fleet coordination and field supplies transport'
    ) ON CONFLICT (staff_number) DO UPDATE SET
        full_name = EXCLUDED.full_name;
END $$;

-- 3. Seed Leave Balances for 2026
DO $$
DECLARE
    rec RECORD;
    lt_annual UUID;
    lt_sick UUID;
    lt_compassionate UUID;
BEGIN
    SELECT id INTO lt_annual FROM public.leave_types WHERE code = 'ANNUAL' LIMIT 1;
    SELECT id INTO lt_sick FROM public.leave_types WHERE code = 'SICK' LIMIT 1;
    SELECT id INTO lt_compassionate FROM public.leave_types WHERE code = 'COMPASSIONATE' LIMIT 1;

    FOR rec IN SELECT id FROM public.staff_profiles LOOP
        -- Annual Leave: 28 days
        INSERT INTO public.leave_balances (
            staff_id, leave_type_id, year, allocated_days, used_days, pending_days, remaining_days
        ) VALUES (
            rec.id, lt_annual, 2026, 28, 0, 0, 28
        ) ON CONFLICT (staff_id, leave_type_id, year) DO NOTHING;

        -- Sick Leave: 14 days
        INSERT INTO public.leave_balances (
            staff_id, leave_type_id, year, allocated_days, used_days, pending_days, remaining_days
        ) VALUES (
            rec.id, lt_sick, 2026, 14, 0, 0, 14
        ) ON CONFLICT (staff_id, leave_type_id, year) DO NOTHING;

        -- Compassionate Leave: 5 days
        INSERT INTO public.leave_balances (
            staff_id, leave_type_id, year, allocated_days, used_days, pending_days, remaining_days
        ) VALUES (
            rec.id, lt_compassionate, 2026, 5, 0, 0, 5
        ) ON CONFLICT (staff_id, leave_type_id, year) DO NOTHING;
    END LOOP;

    -- Adjust Juma Temu's used annual days (5 days used in July 2026)
    UPDATE public.leave_balances
    SET used_days = 5, remaining_days = 23
    WHERE staff_id = '20000000-0000-0000-0000-000000000005' AND leave_type_id = lt_annual AND year = 2026;

    -- Adjust Baraka Said's used sick days (3 days used in August 2026)
    UPDATE public.leave_balances
    SET used_days = 3, remaining_days = 11
    WHERE staff_id = '20000000-0000-0000-0000-000000000003' AND leave_type_id = lt_sick AND year = 2026;

    -- Adjust Mariam Juma's pending annual days (7 days requested pending review)
    UPDATE public.leave_balances
    SET pending_days = 7, remaining_days = 21
    WHERE staff_id = '20000000-0000-0000-0000-000000000004' AND leave_type_id = lt_annual AND year = 2026;
END $$;

-- 4. Seed Leave Requests
INSERT INTO public.leave_requests (
    id, request_number, staff_id, leave_type_id,
    start_date, end_date, days_requested, reason,
    handover_staff_id, status, decision_by, decision_at, decision_notes
) VALUES
    (
        '30000000-0000-0000-0000-000000000001',
        'LV-2026-001',
        '20000000-0000-0000-0000-000000000005', -- Juma K. Temu
        '10000000-0000-0000-0000-000000000001', -- Annual
        '2026-07-10',
        '2026-07-15',
        5,
        'Mid-year family visit and rest after youth academy workshop delivery.',
        '20000000-0000-0000-0000-000000000007', -- Handover to Rehema Msuya
        'approved',
        '00000000-0000-0000-0000-000000000004', -- Approved by Mariam Juma (Manager)
        '2026-07-05 10:00:00+00',
        'Approved. Handover arrangements with Rehema confirmed.'
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        'LV-2026-002',
        '20000000-0000-0000-0000-000000000003', -- Baraka Said
        '10000000-0000-0000-0000-000000000002', -- Sick
        '2026-08-03',
        '2026-08-06',
        3,
        'Severe malaria treatment and bed rest per medical practitioner advice.',
        '20000000-0000-0000-0000-000000000002', -- Handover to Amina
        'approved',
        '00000000-0000-0000-0000-000000000006', -- Approved by Amina Kimaro (HR)
        '2026-08-03 08:30:00+00',
        'Medical certificate verified. Get well soon.'
    ),
    (
        '30000000-0000-0000-0000-000000000003',
        'LV-2026-003',
        '20000000-0000-0000-0000-000000000004', -- Mariam M. Juma
        '10000000-0000-0000-0000-000000000001', -- Annual
        '2026-11-15',
        '2026-11-22',
        7,
        'Annual leave for personal rest prior to end-of-year donor evaluation cycle.',
        '20000000-0000-0000-0000-000000000005', -- Handover to Juma Temu
        'pending',
        NULL,
        NULL,
        NULL
    )
ON CONFLICT (request_number) DO NOTHING;

-- 5. Seed Staff Checklists (Onboarding / Offboarding)
-- Onboarding for new recruit Joyce E. Mwenda (Probation)
INSERT INTO public.staff_checklists (staff_id, checklist_type, item_key, title_en, title_sw, is_completed, completed_at, completed_by, notes)
VALUES
    (
        '20000000-0000-0000-0000-000000000009',
        'onboarding',
        'signed_contract',
        'Signed Employment Contract & Job Description',
        'Mkataba wa Ajira Uliosainiwa na Maelezo ya Kazi',
        true,
        CURRENT_DATE - INTERVAL '58 days',
        '00000000-0000-0000-0000-000000000006',
        'Original contract on physical file; copy in BAOMS.'
    ),
    (
        '20000000-0000-0000-0000-000000000009',
        'onboarding',
        'national_id_nida',
        'National ID / NIDA & Passport Copies Verified',
        'Nakala ya Kitambulisho cha Taifa (NIDA) / Pasipoti',
        true,
        CURRENT_DATE - INTERVAL '58 days',
        '00000000-0000-0000-0000-000000000006',
        'NIDA number verified against government database.'
    ),
    (
        '20000000-0000-0000-0000-000000000009',
        'onboarding',
        'child_protection_policy',
        'Child Safeguarding & Protection Policy Signed',
        'Sera ya Ulinzi na Usalama wa Mtoto Imesainiwa',
        true,
        CURRENT_DATE - INTERVAL '57 days',
        '00000000-0000-0000-0000-000000000006',
        'Mandatory policy adherence confirmed.'
    ),
    (
        '20000000-0000-0000-0000-000000000009',
        'onboarding',
        'emergency_contact',
        'Emergency Contact & Next of Kin Form',
        'Fomu ya Mawasiliano ya Dharura na Mrithi',
        true,
        CURRENT_DATE - INTERVAL '57 days',
        '00000000-0000-0000-0000-000000000006',
        'Edward Mwenda listed as primary contact.'
    ),
    (
        '20000000-0000-0000-0000-000000000009',
        'onboarding',
        'equipment_assignment',
        'Equipment, Assets & Staff ID Badge Handover',
        'Makabidhiano ya Vifaa, Rasilimali na Kitambulisho cha Kazi',
        false,
        NULL,
        NULL,
        'Staff ID badge in printing process.'
    ),
    (
        '20000000-0000-0000-0000-000000000009',
        'onboarding',
        'probation_review',
        'Probation Mid-Term & Final Evaluation',
        'Tathmini ya Kipindi cha Majaribio Kazini',
        false,
        NULL,
        NULL,
        'Scheduled for end of third month.'
    )
ON CONFLICT (staff_id, checklist_type, item_key) DO NOTHING;
