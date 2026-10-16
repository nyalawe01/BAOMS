-- ==============================================================================
-- Babawatoto Organization Management System (BAOMS)
-- Migration: 20261016100000_seed_admin_user.sql
-- Description: Provision System Administrator in auth.users, profiles, and user_roles
-- ==============================================================================

DO $$
DECLARE
    v_admin_id UUID;
    v_dept_id UUID;
    v_role_id UUID;
BEGIN
    -- 1. Locate Admin Department & System Admin Role
    SELECT id INTO v_dept_id FROM public.departments WHERE code = 'ADMIN' LIMIT 1;
    SELECT id INTO v_role_id FROM public.roles WHERE code = 'system_admin' LIMIT 1;

    -- 2. Check if admin user exists in auth.users
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@babawatoto.or.tz';

    IF v_admin_id IS NULL THEN
        -- Generate fixed or random UUID for admin
        v_admin_id := '76a9777b-d93c-479c-9391-3cff9b3f8ec1'::UUID;

        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_admin_id,
            'authenticated',
            'authenticated',
            'admin@babawatoto.or.tz',
            crypt('Admin@BabaWatoto2026!', gen_salt('bf')),
            timezone('utc'::text, now()),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"System Administrator","role":"system_admin"}',
            timezone('utc'::text, now()),
            timezone('utc'::text, now()),
            ''
        )
        ON CONFLICT (id) DO UPDATE SET
            encrypted_password = crypt('Admin@BabaWatoto2026!', gen_salt('bf')),
            email_confirmed_at = COALESCE(auth.users.email_confirmed_at, timezone('utc'::text, now())),
            updated_at = timezone('utc'::text, now());
    ELSE
        -- Admin already exists in auth.users: ensure email is confirmed & active
        UPDATE auth.users
        SET 
            encrypted_password = crypt('Admin@BabaWatoto2026!', gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, timezone('utc'::text, now())),
            updated_at = timezone('utc'::text, now())
        WHERE id = v_admin_id;
    END IF;

    -- 3. Upsert admin record in public.profiles with immediate 'approved' status
    INSERT INTO public.profiles (
        id,
        display_name,
        preferred_language,
        department_id,
        is_active,
        approval_status,
        official_email
    ) VALUES (
        v_admin_id,
        'System Administrator',
        'en',
        v_dept_id,
        true,
        'approved',
        'admin@babawatoto.or.tz'
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name = 'System Administrator',
        department_id = COALESCE(v_dept_id, public.profiles.department_id),
        is_active = true,
        approval_status = 'approved',
        official_email = 'admin@babawatoto.or.tz',
        updated_at = timezone('utc'::text, now());

    -- 4. Assign system_admin role in public.user_roles
    IF v_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (v_admin_id, v_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    RAISE NOTICE 'Admin user provisioned successfully with ID: %', v_admin_id;
END $$;
