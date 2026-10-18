-- ==============================================================================
-- Babawatoto Organization Management System (BAOMS)
-- Migration: 20261017170000_activate_hr_elinami_munuo.sql
-- Description: Activate HR Administrator account for Elinami Munuo
--              (elinami.munuo@babawatoto.or.tz) and assign hr_administrator role.
--              Also ensures auth.users record is confirmed and active.
-- ==============================================================================

DO $$
DECLARE
    v_user_id   UUID;
    v_dept_id   UUID;
    v_role_id   UUID;
BEGIN
    -- 1. Resolve HR department and hr_administrator role IDs
    SELECT id INTO v_dept_id FROM public.departments WHERE code = 'HR' LIMIT 1;
    SELECT id INTO v_role_id FROM public.roles       WHERE code = 'hr_administrator' LIMIT 1;

    -- 2. Locate the auth user by email
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'elinami.munuo@babawatoto.or.tz';

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User elinami.munuo@babawatoto.or.tz not found in auth.users. '
                     'She must register via the self-registration portal first, '
                     'or be provisioned by the System Administrator.';
        RETURN;
    END IF;

    -- 3. Confirm the auth.users account (so she can log in immediately)
    UPDATE auth.users
    SET
        email_confirmed_at = COALESCE(email_confirmed_at, timezone('utc', now())),
        banned_until       = NULL,
        updated_at         = timezone('utc', now())
    WHERE id = v_user_id;

    -- 4. Upsert the public.profiles record — mark active + approved
    INSERT INTO public.profiles (
        id,
        display_name,
        official_email,
        department_id,
        is_active,
        approval_status,
        hr_reviewed_at,
        ed_approved_at,
        preferred_language
    ) VALUES (
        v_user_id,
        'Elinami Munuo',
        'elinami.munuo@babawatoto.or.tz',
        v_dept_id,
        true,
        'approved',
        timezone('utc', now()),
        timezone('utc', now()),
        'en'
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name    = COALESCE(NULLIF(public.profiles.display_name, ''), 'Elinami Munuo'),
        official_email  = 'elinami.munuo@babawatoto.or.tz',
        department_id   = COALESCE(v_dept_id, public.profiles.department_id),
        is_active       = true,
        approval_status = 'approved',
        hr_reviewed_at  = COALESCE(public.profiles.hr_reviewed_at, timezone('utc', now())),
        ed_approved_at  = COALESCE(public.profiles.ed_approved_at, timezone('utc', now())),
        updated_at      = timezone('utc', now());

    -- 5. Remove any stale role assignments then grant hr_administrator
    IF v_role_id IS NOT NULL THEN
        DELETE FROM public.user_roles WHERE user_id = v_user_id;

        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (v_user_id, v_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;

        RAISE NOTICE 'hr_administrator role assigned to Elinami Munuo (%).', v_user_id;
    ELSE
        RAISE WARNING 'Role hr_administrator not found in public.roles — skipping role assignment.';
    END IF;

    RAISE NOTICE 'Account elinami.munuo@babawatoto.or.tz activated and set to approved status. User ID: %', v_user_id;
END $$;
