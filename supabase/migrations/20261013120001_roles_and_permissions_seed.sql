-- ==============================================================================
-- Babawatoto Organization Management System (BAOMS)
-- Migration: 20261013120001_roles_and_permissions_seed.sql
-- Description: Idempotent seed data for departments, roles, granular permissions, and mappings
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED DEPARTMENTS (Idempotent)
-- ------------------------------------------------------------------------------
INSERT INTO public.departments (code, name_en, name_sw, is_active)
VALUES
    ('EXEC', 'Executive Office', 'Ofisi ya Mkurugenzi', true),
    ('FIN', 'Finance & Operations', 'Idara ya Fedha na Uendeshaji', true),
    ('PRJ', 'Projects & Programs', 'Idara ya Miradi na Programu', true),
    ('HR', 'Human Resources & Administration', 'Rasilimali Watu na Utawala', true),
    ('ADMIN', 'Information Technology & System Administration', 'TEHAMA na Utawala wa Mfumo', true)
ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_sw = EXCLUDED.name_sw,
    is_active = EXCLUDED.is_active,
    updated_at = timezone('utc'::text, now());

-- ------------------------------------------------------------------------------
-- 2. SEED CORE ROLES (Idempotent)
-- ------------------------------------------------------------------------------
INSERT INTO public.roles (code, name_en, name_sw, description_en, description_sw, is_system)
VALUES
    (
        'system_admin',
        'System Administrator',
        'Msimamizi wa Mfumo',
        'Full administrative authority, security configuration, role assignments, and audit review.',
        'Mamlaka kamili ya kiutawala, usanidi wa usalama, ugawaji wa majukumu, na ukaguzi wa kumbukumbu.',
        true
    ),
    (
        'executive_director',
        'Executive Director',
        'Mkurugenzi Mtendaji',
        'Organizational leadership, strategic oversight, executive approvals, and audit inspection.',
        'Uongozi mkuu wa shirika, usimamizi wa kimkakati, idhini za kiutendaji, na ukaguzi wa mifumo.',
        true
    ),
    (
        'finance_officer',
        'Finance Officer',
        'Afisa Fedha',
        'Budget tracking, financial requests, voucher verification, and payment disbursement.',
        'Ufuatiliaji wa bajeti, maombi ya fedha, uhakiki wa vocha, na ulipaji wa fedha zilizoidhinishwa.',
        true
    ),
    (
        'project_manager',
        'Project Manager',
        'Meneja wa Mradi',
        'Project lifecycle administration, activity scheduling, field budgeting, and progress reporting.',
        'Usimamizi wa mzunguko wa miradi, upangaji wa shughuli, bajeti za nyanjani, na taarifa za maendeleo.',
        true
    ),
    (
        'project_coordinator',
        'Project Coordinator',
        'Mratibu wa Mradi',
        'Field activity execution, beneficiary records, attendance registers, and activity notes.',
        'Utekelezaji wa shughuli za nyanjani, kumbukumbu za walengwa, madaftari ya mahudhurio, na taarifa za nyanjani.',
        true
    ),
    (
        'hr_administrator',
        'HR Administrator',
        'Msimamizi wa Rasilimali Watu',
        'Personnel records administration, leave processing, safeguarding compliance, and staff documentation.',
        'Usimamizi wa kumbukumbu za watumishi, usindikaji wa likizo, uzingatiaji wa ulinzi wa watoto, na nyaraka za wafanyakazi.',
        true
    )
ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_sw = EXCLUDED.name_sw,
    description_en = EXCLUDED.description_en,
    description_sw = EXCLUDED.description_sw,
    is_system = true,
    updated_at = timezone('utc'::text, now());

-- ------------------------------------------------------------------------------
-- 3. SEED GRANULAR PERMISSIONS (Idempotent)
-- ------------------------------------------------------------------------------
INSERT INTO public.permissions (code, category, description_en, description_sw)
VALUES
    -- Users & Profiles
    ('users.view', 'User Management', 'View staff profiles and contact details', 'Kutazama wasifu na mawasiliano ya wafanyakazi'),
    ('users.create', 'User Management', 'Create new staff user profiles', 'Kusajili wasifu mpya wa wafanyakazi'),
    ('users.update', 'User Management', 'Update staff profile details and departments', 'Kuhariri taarifa za wasifu na idara za watumishi'),
    ('users.deactivate', 'User Management', 'Deactivate user accounts', 'Kusimamisha akaunti za watumiaji'),

    -- Roles & Access Control
    ('roles.view', 'Security & Access', 'View role definitions and permissions', 'Kutazama ufafanuzi wa majukumu na vibali'),
    ('roles.manage', 'Security & Access', 'Assign or revoke roles and manage permissions', 'Kutoa au kufuta majukumu na kusimamia vibali'),

    -- Departments
    ('departments.view', 'Organization', 'View departments and organizational units', 'Kutazama idara na vitengo vya shirika'),
    ('departments.manage', 'Organization', 'Create and manage organizational departments', 'Kuanzisha na kusimamia idara za shirika'),

    -- Audit Logs
    ('audit.view', 'Auditing', 'Inspect system security and administrative audit logs', 'Kukagua kumbukumbu za usalama na utawala za mfumo'),

    -- System Configuration
    ('system.configure', 'System', 'Configure system settings and localization', 'Kusanidi mipangilio ya mfumo na lugha'),

    -- Documents & Records (Future Module)
    ('documents.view', 'Documents', 'View authorized organizational documents', 'Kutazama nyaraka zilizoidhinishwa za shirika'),
    ('documents.upload', 'Documents', 'Upload new documents and revisions', 'Kupakia nyaraka mpya na masahihisho'),
    ('documents.approve', 'Documents', 'Approve authorized organizational documents', 'Kuidhinisha nyaraka rasmi za shirika'),
    ('documents.delete', 'Documents', 'Archive or delete document records', 'Kuhifadhi kumbukumbu au kufuta nyaraka'),

    -- Projects & Activities (Future Module)
    ('projects.view', 'Projects', 'View project records and milestones', 'Kutazama kumbukumbu na hatua za miradi'),
    ('projects.create', 'Projects', 'Register new projects and activity plans', 'Kusajili miradi mipya na mipango ya shughuli'),
    ('projects.manage', 'Projects', 'Manage project coordinators and milestones', 'Kusimamia waratibu wa miradi na hatua za utekelezaji'),
    ('projects.report', 'Projects', 'Submit field activity reports and attendance', 'Kuwasilisha taarifa za nyanjani na mahudhurio'),

    -- Finance & Budgets (Future Module)
    ('finance.view', 'Finance', 'View financial requests and budget lines', 'Kutazama maombi ya kifedha na vifungu vya bajeti'),
    ('finance.request', 'Finance', 'Create financial procurement requisitions', 'Kuanzisha maombi ya fedha na manunuzi'),
    ('finance.approve', 'Finance', 'Approve financial requests according to thresholds', 'Kuidhinisha maombi ya kifedha kulingana na viwango'),
    ('finance.disburse', 'Finance', 'Record payment disbursements and vouchers', 'Kurekodi malipo na vocha zilizotolewa'),

    -- HR & Personnel (Future Module)
    ('hr.view', 'HR', 'View employee personnel records', 'Kutazama kumbukumbu za wafanyakazi'),
    ('hr.manage', 'HR', 'Manage employment records and compliance', 'Kusimamia kumbukumbu za ajira na uzingatiaji wa sheria'),
    ('leave.request', 'HR', 'Submit personal leave applications', 'Kuwasilisha maombi ya likizo binafsi'),
    ('leave.approve', 'HR', 'Approve or reject staff leave applications', 'Kuidhinisha au kukataa maombi ya likizo ya wafanyakazi')
ON CONFLICT (code) DO UPDATE SET
    category = EXCLUDED.category,
    description_en = EXCLUDED.description_en,
    description_sw = EXCLUDED.description_sw;

-- ------------------------------------------------------------------------------
-- 4. SEED ROLE-PERMISSION MAPPINGS (Idempotent)
-- ------------------------------------------------------------------------------

-- Helper procedure to grant permission by code
CREATE OR REPLACE PROCEDURE public.seed_grant_permission(p_role_code TEXT, p_perm_code TEXT)
LANGUAGE plpgsql AS $$
DECLARE
    v_role_id UUID;
    v_perm_id UUID;
BEGIN
    SELECT id INTO v_role_id FROM public.roles WHERE code = p_role_code;
    SELECT id INTO v_perm_id FROM public.permissions WHERE code = p_perm_code;

    IF v_role_id IS NOT NULL AND v_perm_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (v_role_id, v_perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END;
$$;

-- A. System Administrator: Full system, role, department, audit & user management
CALL public.seed_grant_permission('system_admin', 'users.view');
CALL public.seed_grant_permission('system_admin', 'users.create');
CALL public.seed_grant_permission('system_admin', 'users.update');
CALL public.seed_grant_permission('system_admin', 'users.deactivate');
CALL public.seed_grant_permission('system_admin', 'roles.view');
CALL public.seed_grant_permission('system_admin', 'roles.manage');
CALL public.seed_grant_permission('system_admin', 'departments.view');
CALL public.seed_grant_permission('system_admin', 'departments.manage');
CALL public.seed_grant_permission('system_admin', 'audit.view');
CALL public.seed_grant_permission('system_admin', 'system.configure');
CALL public.seed_grant_permission('system_admin', 'documents.view');
CALL public.seed_grant_permission('system_admin', 'projects.view');
CALL public.seed_grant_permission('system_admin', 'finance.view');
CALL public.seed_grant_permission('system_admin', 'hr.view');

-- B. Executive Director: Strategic leadership, audit inspection & executive approvals
CALL public.seed_grant_permission('executive_director', 'users.view');
CALL public.seed_grant_permission('executive_director', 'departments.view');
CALL public.seed_grant_permission('executive_director', 'audit.view');
CALL public.seed_grant_permission('executive_director', 'documents.view');
CALL public.seed_grant_permission('executive_director', 'documents.upload');
CALL public.seed_grant_permission('executive_director', 'documents.approve');
CALL public.seed_grant_permission('executive_director', 'projects.view');
CALL public.seed_grant_permission('executive_director', 'projects.manage');
CALL public.seed_grant_permission('executive_director', 'finance.view');
CALL public.seed_grant_permission('executive_director', 'finance.approve');
CALL public.seed_grant_permission('executive_director', 'hr.view');
CALL public.seed_grant_permission('executive_director', 'leave.approve');
CALL public.seed_grant_permission('executive_director', 'leave.request');

-- C. Finance Officer: Budgeting, requisition verification & disbursements
CALL public.seed_grant_permission('finance_officer', 'users.view');
CALL public.seed_grant_permission('finance_officer', 'departments.view');
CALL public.seed_grant_permission('finance_officer', 'documents.view');
CALL public.seed_grant_permission('finance_officer', 'documents.upload');
CALL public.seed_grant_permission('finance_officer', 'projects.view');
CALL public.seed_grant_permission('finance_officer', 'finance.view');
CALL public.seed_grant_permission('finance_officer', 'finance.request');
CALL public.seed_grant_permission('finance_officer', 'finance.disburse');
CALL public.seed_grant_permission('finance_officer', 'leave.request');

-- D. Project Manager: Project lifecycle, activity management & budget requests
CALL public.seed_grant_permission('project_manager', 'users.view');
CALL public.seed_grant_permission('project_manager', 'departments.view');
CALL public.seed_grant_permission('project_manager', 'documents.view');
CALL public.seed_grant_permission('project_manager', 'documents.upload');
CALL public.seed_grant_permission('project_manager', 'projects.view');
CALL public.seed_grant_permission('project_manager', 'projects.create');
CALL public.seed_grant_permission('project_manager', 'projects.manage');
CALL public.seed_grant_permission('project_manager', 'projects.report');
CALL public.seed_grant_permission('project_manager', 'finance.view');
CALL public.seed_grant_permission('project_manager', 'finance.request');
CALL public.seed_grant_permission('project_manager', 'leave.request');

-- E. Project Coordinator: Field reporting, participant logs & activity requests
CALL public.seed_grant_permission('project_coordinator', 'departments.view');
CALL public.seed_grant_permission('project_coordinator', 'documents.view');
CALL public.seed_grant_permission('project_coordinator', 'documents.upload');
CALL public.seed_grant_permission('project_coordinator', 'projects.view');
CALL public.seed_grant_permission('project_coordinator', 'projects.report');
CALL public.seed_grant_permission('project_coordinator', 'finance.request');
CALL public.seed_grant_permission('project_coordinator', 'leave.request');

-- F. HR Administrator: Staff records, personnel documentation & leave management
CALL public.seed_grant_permission('hr_administrator', 'users.view');
CALL public.seed_grant_permission('hr_administrator', 'users.create');
CALL public.seed_grant_permission('hr_administrator', 'users.update');
CALL public.seed_grant_permission('hr_administrator', 'departments.view');
CALL public.seed_grant_permission('hr_administrator', 'documents.view');
CALL public.seed_grant_permission('hr_administrator', 'documents.upload');
CALL public.seed_grant_permission('hr_administrator', 'hr.view');
CALL public.seed_grant_permission('hr_administrator', 'hr.manage');
CALL public.seed_grant_permission('hr_administrator', 'leave.request');
CALL public.seed_grant_permission('hr_administrator', 'leave.approve');

-- Cleanup temporary helper procedure
DROP PROCEDURE IF EXISTS public.seed_grant_permission(TEXT, TEXT);
