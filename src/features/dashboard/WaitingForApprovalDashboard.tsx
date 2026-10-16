import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  RefreshCw,
  LogOut,
  Mail,
  User,
  Building,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from '@/lib/ToastContext';

export const WaitingForApprovalDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile, approvalStatus, reloadProfile, signOut } = useAuth();
  const { showToast } = useToast();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Staff Member';
  const email = profile?.official_email || user?.email || '';
  const currentStage = approvalStatus || 'pending_hr';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'ST';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await reloadProfile();
      showToast({
        title: 'Status Synchronized',
        message: 'Checked latest authorization status with Supabase.',
        variant: 'info',
      });
    } catch {
      showToast({
        title: 'Sync Notice',
        message: 'Could not check status right now. Please try again shortly.',
        variant: 'warning',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* Left Sidebar: Minimal Dark Sidebar for Waiting Users                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between p-6 shrink-0 z-20">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
            <img src="/logo.png" alt="BAOMS Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">BAOMS</h1>
              <p className="text-[11px] text-amber-400 font-medium">Babawatoto Organization</p>
            </div>
          </div>

          {/* User Profile Summary */}
          <div className="my-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{email}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Status</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Waiting for Approval
              </span>
            </div>
          </div>

          {/* Sidebar Nav Items */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 mb-2">
              Navigation
            </p>

            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold text-left transition"
            >
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Waiting for Approval</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 text-[11px] text-slate-400">
            <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              Need Assistance?
            </p>
            <p className="text-[10px] text-slate-400">
              Contact Human Resources or System Administration at:
            </p>
            <a
              href="mailto:hr@babawatoto.or.tz"
              className="text-amber-400 hover:underline text-[10px] block mt-1 font-medium"
            >
              hr@babawatoto.or.tz
            </a>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800/60 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-slate-700/60 text-xs font-medium text-slate-300 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Portal</span>
          </button>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* Main Content Area: Dark Waiting Portal                                    */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-8 sm:p-12 relative flex flex-col justify-between">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto w-full relative z-10">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
                <ShieldCheck className="w-4 h-4" />
                Multi-tier Institutional Clearance
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Account Created: Waiting for Approval
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Welcome to Babawatoto Organization Management System. Your account credentials have been verified.
                Your profile is currently queued in the dual-approval pipeline. Once Human Resources configures your role
                and the Executive Director authorizes your account, your full dashboard will unlock.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D68904] hover:bg-[#b86e03] text-white font-semibold text-xs transition shadow-lg shadow-amber-500/10 shrink-0 self-start sm:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking...' : 'Check Approval Status'}</span>
            </button>
          </div>

          {/* Rejection Alert if rejected */}
          {currentStage === 'rejected' && (
            <div className="my-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-300">Registration Not Approved</h4>
                <p className="mt-1 text-slate-300">
                  {profile?.rejection_reason ||
                    'Your registration could not be approved by Administration. Please contact HR for clarification.'}
                </p>
              </div>
            </div>
          )}

          {/* Visual Step-by-Step Approval Pipeline */}
          <div className="my-8 bg-slate-900/60 rounded-2xl border border-slate-800 p-6 sm:p-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Organizational Approval Pipeline
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Step 1: Self-Registration */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Step 1</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Official Registration</h4>
                <p className="text-[11px] text-slate-400">
                  Account created with {email}. Credentials confirmed.
                </p>
                <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Completed ✓
                </span>
              </div>

              {/* Step 2: HR Review */}
              <div
                className={`p-4 rounded-xl bg-slate-950/80 border ${
                  currentStage === 'pending_hr'
                    ? 'border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'border-emerald-500/40'
                } relative`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Step 2</span>
                  {currentStage === 'pending_hr' ? (
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-white mb-1">HR Department Review</h4>
                <p className="text-[11px] text-slate-400">
                  HR fills out your personal dossier, role, department, and project permissions.
                </p>
                <span
                  className={`inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-medium ${
                    currentStage === 'pending_hr'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  }`}
                >
                  {currentStage === 'pending_hr' ? 'In Review ⏳' : 'Completed ✓'}
                </span>
              </div>

              {/* Step 3: Executive Director Approval */}
              <div
                className={`p-4 rounded-xl bg-slate-950/80 border ${
                  currentStage === 'pending_ed'
                    ? 'border-amber-500/60 ring-1 ring-amber-500/30'
                    : currentStage === 'approved'
                    ? 'border-emerald-500/40'
                    : 'border-slate-800'
                } relative`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 3</span>
                  {currentStage === 'pending_ed' ? (
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Executive Authorization</h4>
                <p className="text-[11px] text-slate-400">
                  The Executive Director reviews HR recommendations and authorizes clearance.
                </p>
                <span
                  className={`inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-medium ${
                    currentStage === 'pending_ed'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStage === 'pending_ed' ? 'Awaiting Decision ⏳' : 'Pending 🔒'}
                </span>
              </div>

              {/* Step 4: Workspace Provisioned */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step 4</span>
                  <Lock className="w-4 h-4 text-slate-600" />
                </div>
                <h4 className="text-xs font-bold text-slate-300 mb-1">Access Activated</h4>
                <p className="text-[11px] text-slate-500">
                  Full respective dashboard, module permissions, and assigned projects unlock.
                </p>
                <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-500">
                  Locked 🔒
                </span>
              </div>
            </div>
          </div>

          {/* User Details & Institutional Policy Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-slate-900/40 rounded-xl border border-slate-800 p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Registered Profile Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Full Legal Name</span>
                  <span className="font-semibold text-slate-200">{displayName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Official Email</span>
                  <span className="font-semibold text-slate-200">{email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Department & Role</span>
                  <span className="text-amber-400 italic font-medium">To be assigned by HR during review</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Database Authority</span>
                  <span className="text-slate-300">Live PostgreSQL (Supabase Connected)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                ℹ️ <strong>Why is my role not yet assigned?</strong>
                <p className="mt-1 text-slate-400">
                  In accordance with Babawatoto Organization governance and safeguarding mandates, system access levels
                  cannot be self-selected. Human Resources verifies employment records and statutory requirements before
                  the Executive Director authorizes granular module permissions.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Estimated Approval Time
                </h4>
                <p className="text-2xl font-extrabold text-amber-400 mb-1">24 - 48 hrs</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  HR notifications are dispatched immediately upon registration. You do not need to keep this page open;
                  once approved, signing in will direct you to your workspace.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 mt-4">
                <span className="text-[10px] text-slate-500 block">Child Safeguarding Mandate</span>
                <span className="text-[11px] text-emerald-400 font-medium">Policy Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Footer */}
        <div className="max-w-4xl mx-auto w-full pt-8 mt-8 border-t border-slate-900 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Babawatoto Organization Management System (BAOMS)</span>
          <span>Dar es Salaam, Tanzania • Confidential Internal System</span>
        </div>
      </main>
    </div>
  );
};
