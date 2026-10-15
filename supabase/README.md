# Supabase Database & Security Guide — BAOMS

This document provides setup instructions for linking and running the BAOMS database migrations against a Supabase PostgreSQL instance.

---

## 1. Prerequisites
- A Supabase Project created at [supabase.com](https://supabase.com).
- Supabase CLI (`npx supabase`) or access to the Supabase Dashboard SQL Editor.
- Your Project Reference ID and Database Connection String (from Project Settings > Database).

---

## 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate client-safe keys:
- `VITE_SUPABASE_URL`: `https://<your-project-ref>.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `<your-publishable-anon-key>`

> **Security Note**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend environment files or commit credentials to Git. Client data access is strictly governed by PostgreSQL Row-Level Security (RLS).

---

## 3. Applying Migrations

### Option A: Using the Supabase CLI (Recommended)
1. Log in to your Supabase account:
   ```bash
   npx supabase login
   ```
2. Link the repository to your remote project:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```
3. Push the migrations to the remote database:
   ```bash
   npx supabase db push
   ```

### Option B: Using the Supabase Dashboard SQL Editor
If CLI deployment is unavailable, execute the migration files sequentially in the **Supabase Dashboard > SQL Editor**:
1. `supabase/migrations/20261013120000_initial_schema.sql` (Creates tables, triggers, and security functions)
2. `supabase/migrations/20261013120001_roles_and_permissions_seed.sql` (Seeds departments, 6 core roles, and granular permissions)
3. `supabase/migrations/20261013120002_row_level_security.sql` (Enables and enforces RLS policies across all tables)

---

## 4. Initial Administrator Account Provisioning
1. In the Supabase Dashboard under **Authentication > Users**, create an administrative user account (e.g. `admin@babawatoto.org`).
2. The `handle_new_user()` database trigger will automatically create an entry in `public.profiles`.
3. In the SQL Editor, assign the `system_admin` role to the newly created profile:
   ```sql
   INSERT INTO public.user_roles (user_id, role_id)
   SELECT p.id, r.id
   FROM public.profiles p
   CROSS JOIN public.roles r
   WHERE p.id = '<auth-user-uuid>'
     AND r.code = 'system_admin'
   ON CONFLICT (user_id, role_id) DO NOTHING;
   ```

---

## 5. Verifying Row-Level Security (RLS)
Execute the following verification queries in the SQL editor:
```sql
-- 1. Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('departments', 'roles', 'permissions', 'role_permissions', 'profiles', 'user_roles', 'audit_logs');

-- 2. Verify audit logs cannot be updated or deleted
-- (Will raise an error under authenticated role)
DELETE FROM public.audit_logs;
```
