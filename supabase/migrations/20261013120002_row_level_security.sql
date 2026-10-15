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
