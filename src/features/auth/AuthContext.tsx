import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { RoleCode, PermissionCode, checkPermission, checkRole } from '@/lib/permissions';
import { Profile } from '@/types/database';

export interface AuthUser {
  id: string;
  email: string;
}

export interface UserDepartment {
  id: string;
  code: string;
  name: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  roles: RoleCode[];
  permissions: PermissionCode[];
  department: UserDepartment | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDeactivated: boolean;
  isPendingApproval: boolean;
  approvalStatus: 'pending_hr' | 'pending_ed' | 'approved' | 'rejected' | null;
  reloadProfile: () => Promise<void>;
  isSessionExpired: boolean;
  dismissSessionExpired: () => void;
  triggerSessionExpiry: () => void;
  mfaPending: boolean;
  verifyMfa: (code: string) => Promise<{ success: boolean; error?: string }>;
  cancelMfa: () => void;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; mfaRequired?: boolean }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: RoleCode | RoleCode[]) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SESSION_STORAGE_KEY = 'baoms_session_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<RoleCode[]>([]);
  const [permissions, setPermissions] = useState<PermissionCode[]>([]);
  const [department, setDepartment] = useState<UserDepartment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [mfaPending, setMfaPending] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ id: string; email: string; rememberMe: boolean } | null>(null);

  // Helper to load full profile, roles, and permissions from Supabase or demo account
  const loadUserData = useCallback(async (userId: string, userEmail: string) => {
    if (isSupabaseConfigured) {
      try {
        // 1. Fetch Profile
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('*, departments(id, code, name_en, name_sw)')
          .eq('id', userId)
          .single();

        if (profileErr || !profileData) {
          throw new Error('Failed to load user profile.');
        }

        // 2. Fetch User Roles
        const { data: userRolesData, error: rolesErr } = await supabase
          .from('user_roles')
          .select('roles(code)')
          .eq('user_id', userId);

        if (rolesErr) {
          throw new Error('Failed to load assigned roles.');
        }

        const assignedRoles: RoleCode[] = (userRolesData || []).flatMap((ur) => {
          const roleObj = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
          return roleObj?.code ? [roleObj.code as RoleCode] : [];
        });

        // 3. Fetch Role Permissions
        const { data: rolePermsData } = await supabase
          .from('role_permissions')
          .select('permissions(code), roles!inner(code)')
          .in('roles.code', assignedRoles);

        const assignedPerms: PermissionCode[] = (rolePermsData || []).flatMap((rp) => {
          const permObj = Array.isArray(rp.permissions) ? rp.permissions[0] : rp.permissions;
          return permObj?.code ? [permObj.code as PermissionCode] : [];
        });

        setUser({ id: userId, email: userEmail });
        setProfile(profileData as Profile);
        setRoles(assignedRoles);
        setPermissions(Array.from(new Set(assignedPerms)));

        if (profileData.departments) {
          setDepartment({
            id: profileData.departments.id,
            code: profileData.departments.code,
            name: profileData.departments.name_en,
          });
        }
      } catch (err) {
        console.warn('Authoritative Supabase user lookup failed:', err);
        setUser(null);
        setProfile(null);
        setRoles([]);
        setPermissions([]);
        setDepartment(null);
      }
    } else {
      setUser(null);
      setProfile(null);
      setRoles([]);
      setPermissions([]);
      setDepartment(null);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      setIsLoading(true);
      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserData(session.user.id, session.user.email || '');
        }

        // Listen for live Supabase Auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'TOKEN_REFRESHED' && !session) {
              setIsSessionExpired(true);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setProfile(null);
              setRoles([]);
              setPermissions([]);
              setDepartment(null);
            } else if (session?.user) {
              setIsSessionExpired(false);
              await loadUserData(session.user.id, session.user.email || '');
            }
          }
        );

        setIsLoading(false);
        return () => subscription.unsubscribe();
      } else {
        setIsLoading(false);
      }
    };

    initSession();
  }, [loadUserData]);

  const dismissSessionExpired = () => setIsSessionExpired(false);
  const triggerSessionExpiry = () => {
    setIsSessionExpired(true);
    setUser(null);
    setProfile(null);
    setRoles([]);
    setPermissions([]);
    setDepartment(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const cancelMfa = () => {
    setMfaPending(false);
    setPendingUser(null);
  };

  const verifyMfa = async (code: string) => {
    setIsLoading(true);
    const cleanCode = code.trim();

    if (isSupabaseConfigured) {
      try {
        const { data: factorsData, error: factorsErr } = await supabase.auth.mfa.listFactors();
        if (factorsErr) throw factorsErr;
        const totpFactor = factorsData?.totp?.[0];
        if (!totpFactor) throw new Error('No enrolled TOTP authenticator found for this account.');

        const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
        if (challengeErr) throw challengeErr;

        const { error: verifyErr } = await supabase.auth.mfa.verify({
          factorId: totpFactor.id,
          challengeId: challengeData.id,
          code: cleanCode,
        });
        if (verifyErr) throw verifyErr;

        if (pendingUser) {
          await loadUserData(pendingUser.id, pendingUser.email);
        }
        setMfaPending(false);
        setPendingUser(null);
        setIsLoading(false);
        return { success: true };
      } catch (err: unknown) {
        setIsLoading(false);
        const msg = err instanceof Error ? err.message : 'Invalid MFA verification code.';
        return { success: false, error: msg };
      }
    } else {
      setIsLoading(false);
      return {
        success: false,
        error: 'Database connection is unavailable. Live authentication requires an active connection to Supabase.',
      };
    }
  };

  // Sign In
  const signIn = async (email: string, password: string, rememberMe = true) => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // Domain policy: only @babawatoto.or.tz addresses are permitted
    if (!cleanEmail.endsWith('@babawatoto.or.tz')) {
      setIsLoading(false);
      return {
        success: false,
        error: 'Access denied. Only @babawatoto.or.tz email addresses are authorized for this system.',
      };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          setIsLoading(false);
          return {
            success: false,
            error: error.message || 'Authentication failed. Please verify your credentials.',
          };
        }

        if (data.user) {
          // Check if account has MFA enrolled / requires AAL2
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
            setPendingUser({ id: data.user.id, email: data.user.email || '', rememberMe });
            setMfaPending(true);
            setIsLoading(false);
            return { success: false, mfaRequired: true };
          }

          await loadUserData(data.user.id, data.user.email || '');
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setIsLoading(false);
        return {
          success: false,
          error: err?.message || 'Network error communicating with authentication database.',
        };
      }
    }

    setIsLoading(false);
    return {
      success: false,
      error: 'Database connection is not configured.',
    };
  };

  // Sign Out
  const signOut = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setUser(null);
    setProfile(null);
    setRoles([]);
    setPermissions([]);
    setDepartment(null);
    setIsLoading(false);
  };

  // Request Password Reset
  const requestPasswordReset = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    }
    return { success: false, error: 'Database service is not configured.' };
  };

  // Update Password
  const updatePassword = async (newPassword: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } else {
      if (newPassword.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters long.' };
      }
      return { success: true };
    }
  };

  const hasPermission = (permission: string): boolean => {
    return checkPermission(permissions, permission, roles);
  };

  const hasRole = (role: RoleCode | RoleCode[]): boolean => {
    const required = Array.isArray(role) ? role : [role];
    return checkRole(roles, required);
  };

  const isAdmin = (): boolean => {
    return roles.includes('system_admin') || roles.includes('executive_director');
  };

  const reloadProfile = useCallback(async () => {
    if (user) {
      await loadUserData(user.id, user.email);
    }
  }, [user, loadUserData]);

  const approvalStatus: 'pending_hr' | 'pending_ed' | 'approved' | 'rejected' | null =
    profile?.approval_status || (roles.length > 0 ? 'approved' : null);

  const isPendingApproval = Boolean(
    user && (approvalStatus === 'pending_hr' || approvalStatus === 'pending_ed' || (roles.length === 0 && approvalStatus !== 'approved'))
  );

  const isDeactivated = Boolean(profile && profile.is_active === false && approvalStatus !== 'pending_hr' && approvalStatus !== 'pending_ed');
  const isAuthenticated = Boolean(user && !isDeactivated);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        roles,
        permissions,
        department,
        isLoading,
        isAuthenticated,
        isDeactivated,
        isPendingApproval,
        approvalStatus,
        reloadProfile,
        isSessionExpired,
        dismissSessionExpired,
        triggerSessionExpiry,
        mfaPending,
        verifyMfa,
        cancelMfa,
        signIn,
        signOut,
        requestPasswordReset,
        updatePassword,
        hasPermission,
        hasRole,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
