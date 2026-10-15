import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  checkPermission,
  checkRole,
} from '../src/lib/permissions';

describe('BAOMS Phase 3 Database & Security Foundation', () => {
  const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
  const schemaFile = path.join(migrationsDir, '20261013120000_initial_schema.sql');
  const seedFile = path.join(migrationsDir, '20261013120001_roles_and_permissions_seed.sql');
  const rlsFile = path.join(migrationsDir, '20261013120002_row_level_security.sql');

  const schemaSql = fs.readFileSync(schemaFile, 'utf-8');
  const seedSql = fs.readFileSync(seedFile, 'utf-8');
  const rlsSql = fs.readFileSync(rlsFile, 'utf-8');

  describe('1. Schema & Table Architecture', () => {
    it('defines all 7 required foundational tables with UUID primary keys', () => {
      const requiredTables = [
        'departments',
        'roles',
        'permissions',
        'role_permissions',
        'profiles',
        'user_roles',
        'audit_logs',
      ];

      requiredTables.forEach((table) => {
        expect(schemaSql).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}`, 'i'));
      });
    });

    it('links profiles table directly to Supabase auth.users(id)', () => {
      expect(schemaSql).toContain('REFERENCES auth.users(id) ON DELETE CASCADE');
    });

    it('defines profile fields: display_name, phone_number, preferred_language, department_id, and is_active', () => {
      expect(schemaSql).toContain('display_name TEXT NOT NULL');
      expect(schemaSql).toContain("preferred_language TEXT NOT NULL DEFAULT 'en'");
      expect(schemaSql).toContain("CHECK (preferred_language IN ('en', 'sw'))");
      expect(schemaSql).toContain('department_id UUID REFERENCES public.departments(id)');
      expect(schemaSql).toContain('is_active BOOLEAN NOT NULL DEFAULT true');
    });

    it('establishes composite uniqueness and cascade constraints on user_roles and role_permissions', () => {
      expect(schemaSql).toContain('CONSTRAINT uq_user_role UNIQUE (user_id, role_id)');
      expect(schemaSql).toContain('PRIMARY KEY (role_id, permission_id)');
      expect(schemaSql).toContain('REFERENCES public.roles(id) ON DELETE CASCADE');
      expect(schemaSql).toContain('REFERENCES public.permissions(id) ON DELETE CASCADE');
    });

    it('contains triggers for auto-updating timestamps and auto-provisioning profiles from auth.users', () => {
      expect(schemaSql).toContain('CREATE OR REPLACE FUNCTION public.set_updated_at()');
      expect(schemaSql).toContain('CREATE OR REPLACE FUNCTION public.handle_new_user()');
      expect(schemaSql).toContain('ON auth.users');
    });
  });

  describe('2. Idempotent Seed Data', () => {
    it('seeds the 5 core departments in English and Kiswahili', () => {
      const departments = ['EXEC', 'FIN', 'PRJ', 'HR', 'ADMIN'];
      departments.forEach((code) => {
        expect(seedSql).toContain(`('${code}'`);
      });
      expect(seedSql).toContain('Ofisi ya Mkurugenzi');
      expect(seedSql).toContain('Idara ya Fedha na Uendeshaji');
    });

    it('seeds all six approved organizational roles idempotently', () => {
      const roles = [
        'system_admin',
        'executive_director',
        'finance_officer',
        'project_manager',
        'project_coordinator',
        'hr_administrator',
      ];

      roles.forEach((role) => {
        expect(seedSql).toContain(`'${role}'`);
      });

      expect(seedSql).toContain('Msimamizi wa Mfumo');
      expect(seedSql).toContain('Mkurugenzi Mtendaji');
      expect(seedSql).toContain('Afisa Fedha');
      expect(seedSql).toContain('Meneja wa Mradi');
      expect(seedSql).toContain('Mratibu wa Mradi');
      expect(seedSql).toContain('Msimamizi wa Rasilimali Watu');
      expect(seedSql).toContain('ON CONFLICT (code) DO UPDATE');
    });

    it('seeds granular permission codes across multiple operational categories', () => {
      const perms = [
        'users.view',
        'users.create',
        'users.update',
        'users.deactivate',
        'roles.view',
        'roles.manage',
        'departments.view',
        'departments.manage',
        'audit.view',
        'finance.view',
        'finance.request',
        'finance.approve',
        'finance.disburse',
        'projects.view',
        'projects.manage',
        'hr.view',
        'hr.manage',
        'leave.request',
        'leave.approve',
      ];

      perms.forEach((perm) => {
        expect(seedSql).toContain(`'${perm}'`);
      });
    });
  });

  describe('3. Row-Level Security (RLS) Policy Specifications', () => {
    it('enables and forces RLS across all 7 foundational tables', () => {
      const tables = [
        'departments',
        'roles',
        'permissions',
        'role_permissions',
        'profiles',
        'user_roles',
        'audit_logs',
      ];

      tables.forEach((table) => {
        expect(rlsSql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
        expect(rlsSql).toContain(`ALTER TABLE public.${table} FORCE ROW LEVEL SECURITY;`);
      });
    });

    it('enforces least-privilege self-update on profiles preventing self-promotion or deactivation tampering', () => {
      expect(rlsSql).toContain('Allow users to update own personal profile fields');
      // Must prevent regular user from updating department_id or is_active
      expect(rlsSql).toContain('department_id IS NOT DISTINCT FROM');
      expect(rlsSql).toContain('is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid())');
    });

    it('strictly forbids normal users from modifying role assignments (anti-self-promotion)', () => {
      expect(rlsSql).toContain('Allow only role managers to assign roles');
      expect(rlsSql).toContain("WITH CHECK (public.has_permission('roles.manage') OR public.is_admin())");
      expect(rlsSql).toContain('Allow only role managers to update roles');
      expect(rlsSql).toContain('Allow only role managers to revoke roles');
    });

    it('restricts role_permissions modification to role managers or admins', () => {
      expect(rlsSql).toContain('Allow authorized managers to modify role permissions');
      expect(rlsSql).toContain("public.has_permission('roles.manage') OR public.is_admin()");
    });

    it('ensures audit_logs is strictly append-only and client-tamper proof', () => {
      // SELECT requires audit.view
      expect(rlsSql).toContain("public.has_permission('audit.view') OR public.is_admin()");
      // Direct client INSERT denied
      expect(rlsSql).toContain('Disallow direct client insertion into audit logs');
      expect(rlsSql).toContain('WITH CHECK (false)');
      // Direct client UPDATE denied
      expect(rlsSql).toContain('Disallow client modification of audit logs');
      expect(rlsSql).toContain('USING (false)');
      // Direct client DELETE denied
      expect(rlsSql).toContain('Disallow deletion of audit logs');
    });
  });

  describe('4. Client-Side Authorization Utilities', () => {
    it('verifies system_admin possesses full system access inherently', () => {
      expect(checkPermission([], PERMISSIONS.USERS_CREATE, [ROLES.SYSTEM_ADMIN])).toBe(true);
      expect(checkPermission([], PERMISSIONS.ROLES_MANAGE, [ROLES.SYSTEM_ADMIN])).toBe(true);
      expect(checkPermission([], PERMISSIONS.FINANCE_DISBURSE, [ROLES.SYSTEM_ADMIN])).toBe(true);
      expect(checkRole([ROLES.SYSTEM_ADMIN], [ROLES.EXECUTIVE_DIRECTOR])).toBe(true);
    });

    it('verifies non-admin roles only possess their assigned permissions', () => {
      const coordinatorPerms = ROLE_PERMISSIONS[ROLES.PROJECT_COORDINATOR];

      // Coordinator can report and request funds
      expect(checkPermission(coordinatorPerms, PERMISSIONS.PROJECTS_REPORT, [ROLES.PROJECT_COORDINATOR])).toBe(true);
      expect(checkPermission(coordinatorPerms, PERMISSIONS.FINANCE_REQUEST, [ROLES.PROJECT_COORDINATOR])).toBe(true);

      // Coordinator cannot approve finances or manage roles
      expect(checkPermission(coordinatorPerms, PERMISSIONS.FINANCE_APPROVE, [ROLES.PROJECT_COORDINATOR])).toBe(false);
      expect(checkPermission(coordinatorPerms, PERMISSIONS.ROLES_MANAGE, [ROLES.PROJECT_COORDINATOR])).toBe(false);
      expect(checkPermission(coordinatorPerms, PERMISSIONS.AUDIT_VIEW, [ROLES.PROJECT_COORDINATOR])).toBe(false);
    });

    it('verifies finance_officer can disburse but cannot approve executive documents or manage roles', () => {
      const financePerms = ROLE_PERMISSIONS[ROLES.FINANCE_OFFICER];

      expect(checkPermission(financePerms, PERMISSIONS.FINANCE_DISBURSE, [ROLES.FINANCE_OFFICER])).toBe(true);
      expect(checkPermission(financePerms, PERMISSIONS.DOCUMENTS_APPROVE, [ROLES.FINANCE_OFFICER])).toBe(false);
      expect(checkPermission(financePerms, PERMISSIONS.ROLES_MANAGE, [ROLES.FINANCE_OFFICER])).toBe(false);
    });
  });
});
