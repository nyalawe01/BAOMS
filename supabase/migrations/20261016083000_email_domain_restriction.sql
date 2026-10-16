-- ============================================================
-- BAOMS: Email Domain Restriction
-- Migration: 20261016083000_email_domain_restriction
-- 
-- Enforces that only @babawatoto.or.tz email addresses
-- can be registered as Supabase Auth users.
-- Applied via a BEFORE INSERT trigger on auth.users.
-- ============================================================

-- Function: validate email domain before inserting a new auth user
CREATE OR REPLACE FUNCTION public.enforce_email_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.email IS NULL OR NEW.email NOT ILIKE '%@babawatoto.or.tz' THEN
    RAISE EXCEPTION
      'Registration denied: Only @babawatoto.or.tz email addresses are authorized. Received: %',
      COALESCE(NEW.email, 'NULL')
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: fire before any INSERT on auth.users
DROP TRIGGER IF EXISTS trg_enforce_email_domain ON auth.users;
CREATE TRIGGER trg_enforce_email_domain
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_email_domain();

-- Comment
COMMENT ON FUNCTION public.enforce_email_domain() IS
  'Rejects user registrations where the email address does not end with @babawatoto.or.tz. Part of BAOMS organizational domain policy.';
