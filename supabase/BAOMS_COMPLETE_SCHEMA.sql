-- ==============================================================================
-- Babawatoto Organization Management System (BAOMS)
-- Comprehensive Database Schema, RLS Security Policies & Storage Provisioning
--
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/sqleehfbooigtthzmvbd
-- 2. Navigate to "SQL Editor" on the left navigation bar.
-- 3. Click "+ New query", paste the entire contents of this file, and click "Run".
-- 4. Once executed, run: npm run test:supabase
-- ==============================================================================


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF MODULE: 20261013120000_initial_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- Babawatoto Organization Management System (BAOMS)
-- Migration: 20261013120000_initial_schema.sql
-- Description: Core schema, tables, constraints, foreign keys, triggers & security functions
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. DEPARTMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_sw TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_departments_code ON public.departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON public.departments(is_active);

-- ------------------------------------------------------------------------------
-- 2. ROLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_sw TEXT NOT NULL,
    description_en TEXT,
    description_sw TEXT,
    is_system BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_roles_code ON public.roles(code);

-- ------------------------------------------------------------------------------
-- 3. PERMISSIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_sw TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_permissions_code ON public.permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);

-- ------------------------------------------------------------------------------
-- 4. ROLE_PERMISSIONS (Junction)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- ------------------------------------------------------------------------------
-- 5. PROFILES (Linked to Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    phone_number TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'sw')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- ------------------------------------------------------------------------------
-- 6. USER_ROLES (Junction)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- ------------------------------------------------------------------------------
-- 7. AUDIT_LOGS (Append-only)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 8. TRIGGERS & SECURITY DEFINER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Generic updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger applications for updated_at
DROP TRIGGER IF EXISTS trg_departments_updated_at ON public.departments;
CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON public.departments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_roles_updated_at ON public.roles;
CREATE TRIGGER trg_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-provision profile on Supabase auth.users registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_name TEXT;
    default_lang TEXT;
BEGIN
    default_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'BAO Staff Member'
    );
    default_lang := COALESCE(
        NEW.raw_user_meta_data->>'preferred_language',
        'en'
    );
    IF default_lang NOT IN ('en', 'sw') THEN
        default_lang := 'en';
    END IF;

    INSERT INTO public.profiles (id, display_name, preferred_language, is_active)
    VALUES (NEW.id, default_name, default_lang, true)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security Helper: Check if current user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(requested_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
          AND r.code = requested_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Security Helper: Check if current user is System Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.has_role('system_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Security Helper: Check if current user has a specific granular permission
CREATE OR REPLACE FUNCTION public.has_permission(requested_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- System Administrator inherently has all permissions
    IF public.is_admin() THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
          AND p.code = requested_permission
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Security Helper: Log an audit event (Security Definer, append-only)
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        auth.uid(),
        p_action,
        p_entity_type,
        p_entity_id,
        p_metadata
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF MODULE: 20261013120001_roles_and_permissions_seed.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF MODULE: 20261013120002_row_level_security.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- Babawatoto Organization Management System (BAOMS)
-- Migration: 20261013120002_row_level_security.sql
-- Description: Comprehensive PostgreSQL Row-Level Security (RLS) policies
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY ACROSS ALL FOUNDATIONAL TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (except superusers/service role)
ALTER TABLE public.departments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. DEPARTMENTS POLICIES
-- ------------------------------------------------------------------------------

-- Authenticated users can view active departments
DROP POLICY IF EXISTS "Allow authenticated users to read active departments" ON public.departments;
CREATE POLICY "Allow authenticated users to read active departments"
    ON public.departments
    FOR SELECT
    TO authenticated
    USING (is_active = true OR public.has_permission('departments.manage'));

-- Only users with departments.manage or system admin can create/modify departments
DROP POLICY IF EXISTS "Allow department managers to insert departments" ON public.departments;
CREATE POLICY "Allow department managers to insert departments"
    ON public.departments
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_permission('departments.manage') OR public.is_admin());

DROP POLICY IF EXISTS "Allow department managers to update departments" ON public.departments;
CREATE POLICY "Allow department managers to update departments"
    ON public.departments
    FOR UPDATE
    TO authenticated
    USING (public.has_permission('departments.manage') OR public.is_admin())
    WITH CHECK (public.has_permission('departments.manage') OR public.is_admin());

DROP POLICY IF EXISTS "Disallow hard deletion of departments" ON public.departments;
CREATE POLICY "Disallow hard deletion of departments"
    ON public.departments
    FOR DELETE
    TO authenticated
    USING (false);

-- ------------------------------------------------------------------------------
-- 3. ROLES POLICIES
-- ------------------------------------------------------------------------------

-- Authenticated users can view available roles
DROP POLICY IF EXISTS "Allow authenticated users to view roles" ON public.roles;
CREATE POLICY "Allow authenticated users to view roles"
    ON public.roles
    FOR SELECT
    TO authenticated
    USING (true);

-- Only System Admin can insert or update roles
DROP POLICY IF EXISTS "Allow only system admin to modify roles" ON public.roles;
CREATE POLICY "Allow only system admin to modify roles"
    ON public.roles
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. PERMISSIONS POLICIES
-- ------------------------------------------------------------------------------

-- Authenticated users can view permission definitions
DROP POLICY IF EXISTS "Allow authenticated users to view permissions" ON public.permissions;
CREATE POLICY "Allow authenticated users to view permissions"
    ON public.permissions
    FOR SELECT
    TO authenticated
    USING (true);

-- Only System Admin can modify permissions
DROP POLICY IF EXISTS "Allow only system admin to modify permissions" ON public.permissions;
CREATE POLICY "Allow only system admin to modify permissions"
    ON public.permissions
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. ROLE_PERMISSIONS POLICIES
-- ------------------------------------------------------------------------------

-- Authenticated users can view role permissions
DROP POLICY IF EXISTS "Allow authenticated users to view role permissions" ON public.role_permissions;
CREATE POLICY "Allow authenticated users to view role permissions"
    ON public.role_permissions
    FOR SELECT
    TO authenticated
    USING (true);

-- Only users with roles.manage or System Admin can manage role permissions
DROP POLICY IF EXISTS "Allow authorized managers to modify role permissions" ON public.role_permissions;
CREATE POLICY "Allow authorized managers to modify role permissions"
    ON public.role_permissions
    FOR ALL
    TO authenticated
    USING (public.has_permission('roles.manage') OR public.is_admin())
    WITH CHECK (public.has_permission('roles.manage') OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. PROFILES POLICIES
-- ------------------------------------------------------------------------------

-- A user can always read their own profile; colleagues can read active profiles with users.view
DROP POLICY IF EXISTS "Allow users to read their own or authorized profiles" ON public.profiles;
CREATE POLICY "Allow users to read their own or authorized profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR public.has_permission('users.view')
        OR (is_active = true AND auth.uid() IS NOT NULL)
    );

-- A user can update their personal display name, preferred language, and phone number
-- But ordinary users CANNOT change their own department or active status (prevents tampering)
DROP POLICY IF EXISTS "Allow users to update own personal profile fields" ON public.profiles;
CREATE POLICY "Allow users to update own personal profile fields"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        -- Ensure non-admins cannot activate/deactivate themselves or alter department
        AND (
            public.is_admin()
            OR (
                is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid())
                AND department_id IS NOT DISTINCT FROM (SELECT p.department_id FROM public.profiles p WHERE p.id = auth.uid())
            )
        )
    );

-- HR and System Admins can update any staff profile
DROP POLICY IF EXISTS "Allow HR and Admins to update staff profiles" ON public.profiles;
CREATE POLICY "Allow HR and Admins to update staff profiles"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (public.has_permission('users.update') OR public.is_admin())
    WITH CHECK (public.has_permission('users.update') OR public.is_admin());

-- Insert profiles: handled by handle_new_user() security definer trigger or admins
DROP POLICY IF EXISTS "Allow admins to manually provision profiles" ON public.profiles;
CREATE POLICY "Allow admins to manually provision profiles"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid() OR public.is_admin());

-- Deletion is denied (soft deletion via is_active = false)
DROP POLICY IF EXISTS "Disallow hard deletion of profiles" ON public.profiles;
CREATE POLICY "Disallow hard deletion of profiles"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (false);

-- ------------------------------------------------------------------------------
-- 7. USER_ROLES POLICIES (Strict Anti-Self-Promotion)
-- ------------------------------------------------------------------------------

-- Users can inspect their own role assignments
DROP POLICY IF EXISTS "Allow users to read own assigned roles" ON public.user_roles;
CREATE POLICY "Allow users to read own assigned roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.has_permission('roles.view')
        OR public.has_permission('roles.manage')
        OR public.is_admin()
    );

-- Only authorized security managers can assign roles (ordinary users CANNOT insert)
DROP POLICY IF EXISTS "Allow only role managers to assign roles" ON public.user_roles;
CREATE POLICY "Allow only role managers to assign roles"
    ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_permission('roles.manage') OR public.is_admin());

-- Only authorized security managers can update or revoke roles
DROP POLICY IF EXISTS "Allow only role managers to update roles" ON public.user_roles;
CREATE POLICY "Allow only role managers to update roles"
    ON public.user_roles
    FOR UPDATE
    TO authenticated
    USING (public.has_permission('roles.manage') OR public.is_admin())
    WITH CHECK (public.has_permission('roles.manage') OR public.is_admin());

DROP POLICY IF EXISTS "Allow only role managers to revoke roles" ON public.user_roles;
CREATE POLICY "Allow only role managers to revoke roles"
    ON public.user_roles
    FOR DELETE
    TO authenticated
    USING (public.has_permission('roles.manage') OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. AUDIT_LOGS POLICIES (Append-Only & Read-Restricted)
-- ------------------------------------------------------------------------------

-- Only users with audit.view (Executive Director, System Admin) can inspect audit logs
DROP POLICY IF EXISTS "Allow audit inspectors to view audit logs" ON public.audit_logs;
CREATE POLICY "Allow audit inspectors to view audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (public.has_permission('audit.view') OR public.is_admin());

-- Direct client INSERT is completely denied under RLS
-- Writes can ONLY happen through trusted security definer functions (log_audit_event)
DROP POLICY IF EXISTS "Disallow direct client insertion into audit logs" ON public.audit_logs;
CREATE POLICY "Disallow direct client insertion into audit logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (false);

-- Historical alteration is strictly forbidden
DROP POLICY IF EXISTS "Disallow client modification of audit logs" ON public.audit_logs;
CREATE POLICY "Disallow client modification of audit logs"
    ON public.audit_logs
    FOR UPDATE
    TO authenticated
    USING (false);

-- Deletion of audit records is strictly forbidden
DROP POLICY IF EXISTS "Disallow deletion of audit logs" ON public.audit_logs;
CREATE POLICY "Disallow deletion of audit logs"
    ON public.audit_logs
    FOR DELETE
    TO authenticated
    USING (false);



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF MODULE: 20261013140000_documents_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF MODULE: 20261013150000_projects_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF MODULE: 20261013160000_finance_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- Migration: 20261013160000_finance_schema.sql
-- Description: Phase 8 Finance, Budgets, Multi-Tier Approval Workflows,
--              Supporting Documents, and Payment Disbursements with Row-Level Security
-- Babawatoto Organization Management System (BAOMS)
-- ==============================================================================

-- 1. Budgets Table (Organizational and Project Budgets)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    fiscal_year TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    allocated_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (allocated_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'TZS',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budgets_code ON public.budgets(code);
CREATE INDEX IF NOT EXISTS idx_budgets_project ON public.budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_year ON public.budgets(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);

-- 2. Financial Requests Table
CREATE TABLE IF NOT EXISTS public.financial_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT NOT NULL UNIQUE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
    requester_id UUID NOT NULL REFERENCES public.profiles(id),
    request_type TEXT NOT NULL CHECK (request_type IN (
        'activity_expense',
        'procurement',
        'travel_per_diem',
        'operational',
        'petty_cash',
        'consultancy'
    )),
    title TEXT NOT NULL,
    purpose TEXT NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount > 0),
    currency TEXT NOT NULL DEFAULT 'TZS',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',
        'submitted',
        'under_review',
        'approved',
        'partially_paid',
        'paid',
        'returned',
        'rejected',
        'cancelled'
    )),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
    due_date DATE,
    approved_amount NUMERIC(15, 2) CHECK (approved_amount IS NULL OR approved_amount >= 0),
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rejected_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_paid_not_exceed_approved CHECK (
        approved_amount IS NULL OR paid_amount <= approved_amount
    )
);

CREATE INDEX IF NOT EXISTS idx_fin_req_number ON public.financial_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_fin_req_project ON public.financial_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_fin_req_budget ON public.financial_requests(budget_id);
CREATE INDEX IF NOT EXISTS idx_fin_req_requester ON public.financial_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_fin_req_status ON public.financial_requests(status);
CREATE INDEX IF NOT EXISTS idx_fin_req_created ON public.financial_requests(created_at DESC);

-- 3. Financial Request Lines (Itemized Expenditure Breakdown)
CREATE TABLE IF NOT EXISTS public.financial_request_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.financial_requests(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
    unit_cost NUMERIC(15, 2) NOT NULL CHECK (unit_cost >= 0),
    total_cost NUMERIC(15, 2) NOT NULL CHECK (total_cost >= 0),
    budget_category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_fin_req_line UNIQUE (request_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_fin_req_lines_req ON public.financial_request_lines(request_id);

-- 4. Approval Workflows & Steps Configuration
CREATE TABLE IF NOT EXISTS public.approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    required_role TEXT NOT NULL,
    min_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    max_amount NUMERIC(15, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_workflow_step UNIQUE (workflow_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_approval_steps_wf ON public.approval_steps(workflow_id);

-- 5. Approval Instances (Per-Request Workflow Execution)
CREATE TABLE IF NOT EXISTS public.approval_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.financial_requests(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id),
    current_step_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'rejected', 'returned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_req_approval_instance UNIQUE (request_id)
);

CREATE INDEX IF NOT EXISTS idx_approval_instances_req ON public.approval_instances(request_id);

-- 6. Approval Events (Audit Log of Reviews & Decisions)
CREATE TABLE IF NOT EXISTS public.approval_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES public.approval_instances(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('submitted', 'reviewed', 'approved', 'rejected', 'returned')),
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    actor_role TEXT NOT NULL,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_events_instance ON public.approval_events(instance_id);
CREATE INDEX IF NOT EXISTS idx_approval_events_actor ON public.approval_events(actor_id);

-- 7. Payment Transactions (Disbursements)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number TEXT NOT NULL UNIQUE,
    request_id UUID NOT NULL REFERENCES public.financial_requests(id) ON DELETE RESTRICT,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'mobile_money', 'cash', 'cheque')),
    payment_reference TEXT NOT NULL UNIQUE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'TZS',
    payment_date DATE NOT NULL,
    payee_name TEXT NOT NULL,
    payee_contact TEXT,
    bank_name TEXT,
    bank_account_number TEXT,
    disbursed_by UUID NOT NULL REFERENCES public.profiles(id),
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_number ON public.transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_transactions_req ON public.transactions(request_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(payment_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(payment_date);

-- 8. Request Documents (Supporting Evidence Junction)
CREATE TABLE IF NOT EXISTS public.request_documents (
    request_id UUID NOT NULL REFERENCES public.financial_requests(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'receipt', 'terms_of_reference', 'quotation', 'voucher', 'other')),
    attached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (request_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_request_docs_doc ON public.request_documents(document_id);

-- Triggers for updated_at
CREATE TRIGGER trg_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_financial_requests_updated_at
    BEFORE UPDATE ON public.financial_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_approval_workflows_updated_at
    BEFORE UPDATE ON public.approval_workflows
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_approval_instances_updated_at
    BEFORE UPDATE ON public.approval_instances
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_request_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_documents ENABLE ROW LEVEL SECURITY;

-- Budgets RLS
CREATE POLICY "budgets_select_policy"
    ON public.budgets FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_permission('finance.view')
        OR public.has_permission('finance.request')
    );

CREATE POLICY "budgets_insert_update_policy"
    ON public.budgets FOR ALL
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_role('finance_officer')
    );

-- Financial Requests RLS
CREATE POLICY "fin_req_select_policy"
    ON public.financial_requests FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_permission('finance.view')
        OR requester_id = auth.uid()
    );

CREATE POLICY "fin_req_insert_policy"
    ON public.financial_requests FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (public.has_permission('finance.request') AND requester_id = auth.uid())
    );

-- Crucial: Segregation of Duties - Requester CANNOT self-approve
CREATE POLICY "fin_req_update_policy"
    ON public.financial_requests FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR (
            -- Requesters can only edit while draft or returned
            requester_id = auth.uid() AND status IN ('draft', 'returned')
        )
        OR (
            -- Approvers can update if they are NOT the requester
            (public.has_permission('finance.approve') OR public.has_role('finance_officer'))
            AND requester_id != auth.uid()
        )
        OR (
            -- Disbursers can update paid status during transaction processing
            public.has_permission('finance.disburse')
        )
    );

-- Lines RLS
CREATE POLICY "fin_req_lines_select_policy"
    ON public.financial_request_lines FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.financial_requests fr
            WHERE fr.id = financial_request_lines.request_id
            AND (
                public.is_admin()
                OR public.has_role('executive_director')
                OR public.has_permission('finance.view')
                OR fr.requester_id = auth.uid()
            )
        )
    );

CREATE POLICY "fin_req_lines_write_policy"
    ON public.financial_request_lines FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.financial_requests fr
            WHERE fr.id = financial_request_lines.request_id
            AND (
                public.is_admin()
                OR (fr.requester_id = auth.uid() AND fr.status IN ('draft', 'returned'))
            )
        )
    );

-- Approval Workflows & Steps RLS
CREATE POLICY "approval_wf_select_policy"
    ON public.approval_workflows FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "approval_steps_select_policy"
    ON public.approval_steps FOR SELECT
    TO authenticated
    USING (true);

-- Approval Instances & Events RLS
CREATE POLICY "approval_instances_select_policy"
    ON public.approval_instances FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.financial_requests fr
            WHERE fr.id = approval_instances.request_id
            AND (
                public.is_admin()
                OR public.has_role('executive_director')
                OR public.has_permission('finance.view')
                OR fr.requester_id = auth.uid()
            )
        )
    );

CREATE POLICY "approval_events_select_policy"
    ON public.approval_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.approval_instances ai
            JOIN public.financial_requests fr ON fr.id = ai.request_id
            WHERE ai.id = approval_events.instance_id
            AND (
                public.is_admin()
                OR public.has_role('executive_director')
                OR public.has_permission('finance.view')
                OR fr.requester_id = auth.uid()
            )
        )
    );

CREATE POLICY "approval_events_insert_policy"
    ON public.approval_events FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR public.has_permission('finance.approve')
        OR public.has_permission('finance.request')
        OR public.has_role('finance_officer')
    );

-- Transactions (Disbursements) RLS
CREATE POLICY "transactions_select_policy"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_permission('finance.view')
        OR EXISTS (
            SELECT 1 FROM public.financial_requests fr
            WHERE fr.id = transactions.request_id
            AND fr.requester_id = auth.uid()
        )
    );

CREATE POLICY "transactions_insert_policy"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR public.has_permission('finance.disburse')
    );

-- Request Documents Junction RLS
CREATE POLICY "request_docs_select_policy"
    ON public.request_documents FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.financial_requests fr
            WHERE fr.id = request_documents.request_id
            AND (
                public.is_admin()
                OR public.has_role('executive_director')
                OR public.has_permission('finance.view')
                OR fr.requester_id = auth.uid()
            )
        )
    );

CREATE POLICY "request_docs_insert_policy"
    ON public.request_documents FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.financial_requests fr
            WHERE fr.id = request_documents.request_id
            AND (
                public.is_admin()
                OR fr.requester_id = auth.uid()
                OR public.has_role('finance_officer')
            )
        )
    );



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF MODULE: 20261013170000_hr_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF MODULE: 20261013180000_correspondence_reporting_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
            AND r.name IN ('system_admin', 'executive_director')
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
            AND r.name IN ('system_admin', 'executive_director', 'project_manager')
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
            AND r.name IN ('system_admin', 'executive_director')
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
            AND r.name IN ('system_admin', 'executive_director', 'project_manager', 'hr_administrator')
        )
    );

-- Meeting Attendees, Decisions & Actions RLS Policies
CREATE POLICY "meeting_attendees_all_policy" ON public.meeting_attendees
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "meeting_decisions_all_policy" ON public.meeting_decisions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "meeting_actions_all_policy" ON public.meeting_actions
    FOR ALL USING (auth.role() = 'authenticated');



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF MODULE: 20261015160000_storage_buckets_and_rls.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
-- ------------------------------------------------------------------------------

-- Ensure RLS is active on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

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


