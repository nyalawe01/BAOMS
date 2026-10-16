-- ==============================================================================
-- BAOMS Migration: 20261016090000_user_self_registration_and_approval_workflow.sql
-- Description: Adds approval workflow columns, triggers, RLS policies, and RPCs
--              for self-registration, HR stepper review, and Executive Director authorization.
-- ==============================================================================

-- 0. Ensure base tables exist if running on a fresh database
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_sw TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'sw')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
          AND r.code = 'system_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

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

CREATE OR REPLACE FUNCTION public.log_audit_event(
    action TEXT,
    target_entity TEXT,
    target_id TEXT DEFAULT NULL,
    payload JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    new_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        target_entity,
        target_id,
        payload
    ) VALUES (
        auth.uid(),
        action,
        target_entity,
        target_id,
        payload
    ) RETURNING id INTO new_log_id;
    RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Add approval columns to public.profiles if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending_hr' 
        CHECK (approval_status IN ('pending_hr', 'pending_ed', 'approved', 'rejected'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'official_email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN official_email TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'staged_details'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN staged_details JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'hr_reviewed_by'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN hr_reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'hr_reviewed_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN hr_reviewed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ed_approved_by'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN ed_approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ed_approved_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN ed_approved_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_official_email ON public.profiles(official_email);

-- 2. Update existing profiles with approved status if they already have roles
UPDATE public.profiles p
SET approval_status = 'approved'
WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
  AND p.approval_status != 'approved';

-- 3. Upgrade trigger: handle_new_user() to populate official_email & default pending_hr status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_name TEXT;
    default_lang TEXT;
    default_phone TEXT;
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
    default_phone := NEW.raw_user_meta_data->>'phone';

    IF default_lang NOT IN ('en', 'sw') THEN
        default_lang := 'en';
    END IF;

    -- Provision profile in 'pending_hr' status without roles or department
    INSERT INTO public.profiles (
        id, 
        display_name, 
        official_email, 
        phone_number, 
        preferred_language, 
        is_active, 
        approval_status, 
        staged_details
    )
    VALUES (
        NEW.id, 
        default_name, 
        NEW.email, 
        default_phone, 
        default_lang, 
        true, 
        'pending_hr', 
        '{}'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
        official_email = EXCLUDED.official_email,
        display_name = CASE WHEN profiles.display_name = 'BAO Staff Member' THEN EXCLUDED.display_name ELSE profiles.display_name END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC for HR to submit user dossier to Executive Director
CREATE OR REPLACE FUNCTION public.hr_submit_user_dossier(
    p_user_id UUID,
    p_department_id UUID,
    p_staged_details JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_actor UUID := auth.uid();
BEGIN
    -- Verify caller is HR administrator or System Admin
    IF NOT (public.has_role('hr_administrator') OR public.is_admin()) THEN
        RAISE EXCEPTION 'Access denied: Only HR Administrator or System Administrator can review user dossiers.';
    END IF;

    UPDATE public.profiles
    SET 
        department_id = p_department_id,
        staged_details = p_staged_details,
        approval_status = 'pending_ed',
        hr_reviewed_by = v_actor,
        hr_reviewed_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    -- Audit log
    PERFORM public.log_audit_event(
        'HR_SUBMITTED_USER_DOSSIER',
        'profile',
        p_user_id::text,
        jsonb_build_object(
            'department_id', p_department_id,
            'target_user_id', p_user_id
        )
    );

    RETURN jsonb_build_object('success', true, 'status', 'pending_ed');
END;
$$;

-- 5. RPC for Executive Director to grant final authorization & activate account
CREATE OR REPLACE FUNCTION public.ed_approve_user(
    p_user_id UUID,
    p_role_code TEXT,
    p_department_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_role_id UUID;
    v_final_dept_id UUID := p_department_id;
    v_profile RECORD;
BEGIN
    -- Verify caller is Executive Director or System Admin
    IF NOT (public.has_role('executive_director') OR public.is_admin()) THEN
        RAISE EXCEPTION 'Access denied: Only the Executive Director or System Administrator can grant final authorization.';
    END IF;

    -- Find role
    SELECT id INTO v_role_id FROM public.roles WHERE code = p_role_code;
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role with code % does not exist.', p_role_code;
    END IF;

    -- Retrieve current profile
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile % not found.', p_user_id;
    END IF;

    IF v_final_dept_id IS NULL THEN
        v_final_dept_id := v_profile.department_id;
    END IF;

    -- Update profile
    UPDATE public.profiles
    SET 
        approval_status = 'approved',
        department_id = v_final_dept_id,
        is_active = true,
        ed_approved_by = v_actor,
        ed_approved_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    -- Assign role into user_roles (remove previous if any)
    DELETE FROM public.user_roles WHERE user_id = p_user_id;
    INSERT INTO public.user_roles (user_id, role_id, assigned_by)
    VALUES (p_user_id, v_role_id, v_actor);

    -- Log audit event
    PERFORM public.log_audit_event(
        'ED_APPROVED_USER_ACCESS',
        'profile',
        p_user_id::text,
        jsonb_build_object(
            'role_code', p_role_code,
            'department_id', v_final_dept_id,
            'target_user_id', p_user_id
        )
    );

    RETURN jsonb_build_object('success', true, 'status', 'approved');
END;
$$;

-- 6. RPC for Rejection
CREATE OR REPLACE FUNCTION public.reject_user_registration(
    p_user_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT (public.has_role('hr_administrator') OR public.has_role('executive_director') OR public.is_admin()) THEN
        RAISE EXCEPTION 'Access denied: Insufficient permissions to reject user.';
    END IF;

    UPDATE public.profiles
    SET 
        approval_status = 'rejected',
        rejection_reason = p_reason,
        is_active = false,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    PERFORM public.log_audit_event(
        'USER_REGISTRATION_REJECTED',
        'profile',
        p_user_id::text,
        jsonb_build_object('reason', p_reason)
    );

    RETURN jsonb_build_object('success', true, 'status', 'rejected');
END;
$$;
