import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DEMO_ACCOUNTS } from './demoAccounts';
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
        console.warn('Authoritative Supabase user lookup failed, falling back to local account:', err);
        const demo = DEMO_ACCOUNTS.find((a) => a.id === userId || a.email.toLowerCase() === userEmail.toLowerCase());
        if (demo) {
          setUser({ id: demo.id, email: demo.email });
          setProfile({
            id: demo.id,
            display_name: demo.displayName,
            phone_number: demo.phoneNumber,
            preferred_language: demo.preferredLanguage,
            department_id: demo.departmentId,
            is_active: demo.isActive,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-10-13T00:00:00Z',
          });
          setRoles(demo.roles);
          setPermissions(demo.permissions);
          setDepartment({
            id: demo.departmentId,
            code: demo.departmentCode,
            name: demo.departmentName,
          });
        } else {
          setUser(null);
          setProfile(null);
          setRoles([]);
          setPermissions([]);
          setDepartment(null);
        }
      }
    } else {
      // Local development / demonstration mode
      const demo = DEMO_ACCOUNTS.find((a) => a.id === userId || a.email.toLowerCase() === userEmail.toLowerCase());
      if (demo) {
        setUser({ id: demo.id, email: demo.email });
        setProfile({
          id: demo.id,
          display_name: demo.displayName,
          phone_number: demo.phoneNumber,
          preferred_language: demo.preferredLanguage,
          department_id: demo.departmentId,
          is_active: demo.isActive,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-10-13T00:00:00Z',
        });
        setRoles(demo.roles);
        setPermissions(demo.permissions);
        setDepartment({
          id: demo.departmentId,
          code: demo.departmentCode,
          name: demo.departmentName,
        });
      } else {
        setUser(null);
        setProfile(null);
        setRoles([]);
        setPermissions([]);
        setDepartment(null);
      }
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
        } else {
          // Check local session storage fallback for demo accounts
          const savedUserId =
            localStorage.getItem(SESSION_STORAGE_KEY) ||
            sessionStorage.getItem(SESSION_STORAGE_KEY) ||
            localStorage.getItem('baoms_active_session_id') ||
            sessionStorage.getItem('baoms_active_session_id');
          if (savedUserId) {
            const match = DEMO_ACCOUNTS.find(
              (a) =>
                a.id === savedUserId ||
                a.email.toLowerCase() === savedUserId.toLowerCase() ||
                a.role === savedUserId
            );
            if (match) {
              await loadUserData(match.id, match.email);
            }
          }
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
        // Dev fallback: restore session identifier if present
        const savedUserId =
          localStorage.getItem(SESSION_STORAGE_KEY) ||
          sessionStorage.getItem(SESSION_STORAGE_KEY) ||
          localStorage.getItem('baoms_active_session_id') ||
          sessionStorage.getItem('baoms_active_session_id');
        if (savedUserId) {
          const match = DEMO_ACCOUNTS.find(
            (a) =>
              a.id === savedUserId ||
              a.email.toLowerCase() === savedUserId.toLowerCase() ||
              a.role === savedUserId
          );
          if (match) {
            await loadUserData(match.id, match.email);
          }
        }
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
      // In offline / preview demo mode:
      if (cleanCode === '123456' || (cleanCode.length === 6 && /^\d+$/.test(cleanCode))) {
        if (pendingUser) {
          if (pendingUser.rememberMe) {
            localStorage.setItem(SESSION_STORAGE_KEY, pendingUser.id);
          } else {
            sessionStorage.setItem(SESSION_STORAGE_KEY, pendingUser.id);
          }
          await loadUserData(pendingUser.id, pendingUser.email);
        }
        setMfaPending(false);
        setPendingUser(null);
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return {
        success: false,
        error: 'Invalid 6-digit authenticator code. Enter any 6-digit numeric code (e.g. 123456) to verify.',
      };
    }
  };

  // Sign In
  const signIn = async (email: string, password: string, rememberMe = true) => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data.user) {
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
      } catch (err) {
        console.warn('Supabase signIn encountered network error, falling back to demo check:', err);
      }
    }

    // Local dev / demonstration mode fallback
    const matchedAccount = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === cleanEmail);

      if (!matchedAccount) {
        setIsLoading(false);
        return {
          success: false,
          error: 'No registered staff account found with this email. Contact your System Administrator.',
        };
      }

      // In demo mode, accept any non-empty password of length >= 6 (or default "baoms2026")
      if (password.length < 6) {
        setIsLoading(false);
        return {
          success: false,
          error: 'Password must be at least 6 characters long.',
        };
      }

      // Check account active status
      if (!matchedAccount.isActive) {
        // Set user to trigger deactivated page
        setUser({ id: matchedAccount.id, email: matchedAccount.email });
        setProfile({
          id: matchedAccount.id,
          display_name: matchedAccount.displayName,
          phone_number: matchedAccount.phoneNumber,
          preferred_language: matchedAccount.preferredLanguage,
          department_id: matchedAccount.departmentId,
          is_active: false,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-10-13T00:00:00Z',
        });
        setRoles(matchedAccount.roles);
        setPermissions([]);
        setIsLoading(false);
        return {
          success: false,
          error: 'Account deactivated: Access denied by Organization Administration.',
        };
      }

      // Check if account has MFA enrolled
      if (matchedAccount.isMfaEnrolled) {
        setPendingUser({ id: matchedAccount.id, email: matchedAccount.email, rememberMe });
        setMfaPending(true);
        setIsLoading(false);
        return { success: false, mfaRequired: true };
      }

      // Successful login
      if (rememberMe) {
        localStorage.setItem(SESSION_STORAGE_KEY, matchedAccount.id);
      } else {
        sessionStorage.setItem(SESSION_STORAGE_KEY, matchedAccount.id);
      }

      await loadUserData(matchedAccount.id, matchedAccount.email);
      setIsLoading(false);
      return { success: true };
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
    } else {
      const exists = DEMO_ACCOUNTS.some((a) => a.email.toLowerCase() === cleanEmail);
      if (!exists) {
        return {
          success: false,
          error: 'Email address not found in authorized organization directory.',
        };
      }
      return { success: true };
    }
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
    return roles.includes('system_admin');
  };

  const isDeactivated = Boolean(profile && profile.is_active === false);
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
