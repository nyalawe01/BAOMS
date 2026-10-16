/**
 * BAOMS Staff Service Layer
 * Fetches real active staff members directly from Supabase PostgreSQL database.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface StaffMemberOption {
  id: string;
  displayName: string;
  email: string;
  role: string;
  departmentName?: string;
  departmentCode?: string;
  isActive: boolean;
}

export async function fetchActiveStaffMembers(): Promise<StaffMemberOption[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          official_email,
          is_active,
          approval_status,
          departments ( code, name_en ),
          user_roles ( roles ( code ) )
        `)
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .order('display_name', { ascending: true });

      if (!error && data) {
        return data.map((row: any) => {
          const dept = row.departments;
          const roleArr = (row.user_roles || []).flatMap((ur: any) => {
            const r = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
            return r?.code ? [r.code] : [];
          });
          return {
            id: row.id,
            displayName: row.display_name || 'Staff Member',
            email: row.official_email || '',
            role: roleArr[0] || 'staff',
            departmentName: dept?.name_en || 'General Administration',
            departmentCode: dept?.code || 'GEN',
            isActive: row.is_active ?? true,
          };
        });
      }
    } catch (err) {
      console.warn('Failed to fetch staff from Supabase:', err);
    }
  }

  return [];
}
