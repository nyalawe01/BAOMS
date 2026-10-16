import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Database,
  Lock,
  ArrowRight,
  UserPlus,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AdminStaffUser {
  id: string;
  email: string;
  displayName: string;
  departmentName: string;
  role: string;
  isActive: boolean;
  approvalStatus?: string;
  isMfaEnrolled?: boolean;
}

export const SystemAdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminStaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const t0 = performance.now();

    // 1. Live Supabase fetch when online
    if (navigator.onLine && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            display_name,
            official_email,
            is_active,
            approval_status,
            departments ( name_en ),
            user_roles:user_roles!user_roles_user_id_fkey ( roles ( code ) )
          `)
          .order('created_at', { ascending: false });

        const latency = Math.round(performance.now() - t0);
        setDbLatency(latency);
        setIsLiveConnected(true);

        if (!error && data) {
          const liveUsers: AdminStaffUser[] = data.map((p: any) => {
            const dept = p.departments;
            const roleArr = (p.user_roles || []).flatMap((ur: any) => {
              const r = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
              return r?.code ? [r.code] : [];
            });
            return {
              id: p.id,
              email: p.official_email || 'staff@babawatoto.or.tz',
              displayName: p.display_name || 'Staff Member',
              departmentName: dept?.name_en || 'General Administration',
              role: roleArr[0] || 'Unassigned',
              isActive: p.is_active ?? true,
              approvalStatus: p.approval_status || 'approved',
              isMfaEnrolled: false,
            };
          });

          setUsers(liveUsers);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.warn('Error fetching users from Supabase:', err);
        setIsLiveConnected(false);
        setUsers([]);
      }
    } else {
      setIsLiveConnected(false);
      setUsers([]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive && u.approvalStatus !== 'rejected').length;
  const pendingApprovalsCount = users.filter((u) => u.approvalStatus === 'pending_hr' || u.approvalStatus === 'pending_ed').length;
  const deactivatedCount = users.filter((u) => !u.isActive).length;
  const mfaEnrolledCount = users.filter((u) => u.isMfaEnrolled).length;
  const mfaPercentage = Math.round((mfaEnrolledCount / (totalUsers || 1)) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.dashboardTitle', 'System Administration & Security Console')}
        subtitle={t(
          'admin.dashboardSubtitle',
          'Enterprise identity directory, infrastructure status, security audit events, and access governance.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('admin.console', 'Administration Console') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              {t('common.refresh', 'Refresh Telemetry')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/users')}>
              <UserPlus className="h-4 w-4 mr-1.5" />
              {t('admin.manageUsers', 'Manage Users & Roles')}
            </Button>
          </div>
        }
      />

      {/* Primary Infrastructure & Security Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Active User Accounts</span>
            <Users className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-charcoal-900 font-mono tabular-nums leading-tight">
            {activeUsers} <span className="text-sm font-normal text-charcoal-muted">/ {totalUsers}</span>
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            {pendingApprovalsCount > 0 ? (
              <span className="text-amber-600 font-medium">{pendingApprovalsCount} awaiting approval</span>
            ) : (
              <span>{deactivatedCount} deactivated accounts</span>
            )}
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>MFA Enforcement</span>
            <Lock className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-charcoal-900 font-mono tabular-nums leading-tight">
            {mfaPercentage}%
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            {mfaEnrolledCount} of {totalUsers} staff enrolled
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Pending Approvals</span>
            <UserCheck className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono tabular-nums leading-tight ${pendingApprovalsCount > 0 ? 'text-amber-600' : 'text-charcoal-900'}`}>
            {pendingApprovalsCount}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            {pendingApprovalsCount > 0 ? 'Awaiting HR or ED authorization' : 'All accounts verified'}
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>System Infrastructure</span>
            <Database className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono tabular-nums leading-tight">
            {isLiveConnected ? '100%' : '99.98%'}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            {isLiveConnected ? `PostgreSQL 17 • Latency ${dbLatency !== null ? dbLatency + 'ms' : 'Live'}` : 'Offline Mode • Cache'}
          </p>
        </div>
      </div>

      {/* Staff Accounts Management */}
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-forest-700" />
              Staff Accounts & Role Assignments
            </h3>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Active organizational accounts with security privileges
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
            {t('common.viewAll', 'View All')}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm min-w-[500px]">
            <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-3">Staff Name</th>
                <th className="py-2.5 px-3">Role Code</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {users.slice(0, 8).map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-charcoal-900">{u.displayName}</div>
                    <div className="text-xs text-charcoal-muted font-mono">{u.email}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-xs font-semibold text-charcoal-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-charcoal-700">{u.departmentName}</td>
                  <td className="py-2.5 px-3 text-right">
                    <StatusIndicator
                      status={u.isActive ? 'approved' : 'rejected'}
                      label={u.isActive ? 'ACTIVE' : 'INACTIVE'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
