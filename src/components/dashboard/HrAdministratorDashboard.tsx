import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  UserPlus,
  Check,
  X,
  FileCheck,
  UserCog,
  RefreshCw,
  Search,
  Shield,
  Mail,
  Building,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  TrendingUp,
  BarChart3,
  Award,
  CheckSquare,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  getStaffProfiles,
  getLeaveRequests,
  reviewLeaveRequest,
} from '@/features/hr/services/hrService';
import {
  StaffProfileRecord,
  LeaveRequestRecord,
} from '@/features/hr/types/hr';
import { useAuth } from '@/features/auth/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserOnboardingReviewModal, PendingUserCandidate } from '@/features/users/components/UserOnboardingReviewModal';
import { StaffDetailModal } from '@/features/hr/components/StaffDetailModal';

export const HrAdministratorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, roles } = useAuth();

  const [staff, setStaff] = useState<StaffProfileRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>([]);
  const [pendingCandidates, setPendingCandidates] = useState<PendingUserCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');

  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState<string>('q4_2026');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modals
  const [selectedCandidate, setSelectedCandidate] = useState<PendingUserCandidate | null>(null);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [selectedStaffForModal, setSelectedStaffForModal] = useState<StaffProfileRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sList, lList] = await Promise.all([
        getStaffProfiles(undefined, user ? { id: user.id, roles } : undefined),
        getLeaveRequests(undefined, user ? { id: user.id, roles } : undefined),
      ]);
      setStaff(sList);
      setLeaveRequests(lList);

      // Query profiles awaiting HR vetting
      if (isSupabaseConfigured) {
        try {
          const { data: pData } = await supabase
            .from('profiles')
            .select('id, display_name, official_email, phone_number, approval_status, staged_details, created_at')
            .eq('approval_status', 'pending_hr')
            .order('created_at', { ascending: false });

          if (pData) {
            setPendingCandidates(
              pData.map((row: any) => ({
                id: row.id,
                email: row.official_email || '',
                displayName: row.display_name || row.official_email?.split('@')[0] || 'Pending Candidate',
                phoneNumber: row.phone_number || '',
                approvalStatus: row.approval_status,
                createdAt: row.created_at,
                stagedDetails: row.staged_details || {},
              }))
            );
          }
        } catch (e) {
          console.warn('[HrDashboard] Error fetching pending HR candidates:', e);
        }
      }
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Failed loading HR telemetry:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user, roles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Key KPI values
  const activeStaff = useMemo(() => staff.filter((s) => s.employmentStatus === 'active'), [staff]);
  const pendingLeaves = useMemo(() => leaveRequests.filter((l) => l.status === 'pending'), [leaveRequests]);

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000);
  const in60Days = new Date(now.getTime() + 60 * 86400000);
  const in90Days = new Date(now.getTime() + 90 * 86400000);

  const expiringContracts = useMemo(() => {
    return staff.filter((s) => {
      if (!s.endDate) return false;
      const end = new Date(s.endDate);
      return end >= now && end <= in60Days;
    });
  }, [staff, now, in60Days]);

  // Department counts
  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    staff.forEach((s) => {
      const d = s.departmentName || 'General';
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [staff]);

  const uniqueDepartmentsCount = Object.keys(departmentCounts).length || 6;

  // Contract type counts
  const contractTypeCounts = useMemo(() => {
    const counts: Record<string, number> = { permanent: 0, fixed_term: 0, consultant: 0, intern: 0 };
    staff.forEach((s) => {
      const t = s.contractType || 'fixed_term';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [staff]);

  // Contract expiry timeline buckets
  const expiryBuckets = useMemo(() => {
    let within30 = 0;
    let within60 = 0;
    let within90 = 0;
    let beyond90 = 0;

    staff.forEach((s) => {
      if (!s.endDate || s.contractType === 'permanent') {
        beyond90++;
        return;
      }
      const d = new Date(s.endDate);
      if (d <= in30Days) within30++;
      else if (d <= in60Days) within60++;
      else if (d <= in90Days) within90++;
      else beyond90++;
    });

    return { within30, within60, within90, beyond90 };
  }, [staff, in30Days, in60Days, in90Days]);

  const handleApproveLeave = async (req: LeaveRequestRecord) => {
    const result = await Swal.fire({
      title: 'Approve Leave Application?',
      text: `Approve ${req.daysRequested} days of ${req.leaveTypeName} for ${req.staffName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Yes, Approve Leave',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await reviewLeaveRequest(
          {
            requestId: req.id,
            decision: 'approved',
            decisionNotes: 'Approved by HR Administrator upon checking entitlements.',
          },
          {
            id: user?.id || '',
            displayName: user?.name || user?.email || 'HR Administrator',
            roles: roles || ['hr_administrator'],
          }
        );
        Swal.fire({
          title: 'Approved!',
          text: `Leave request for ${req.staffName} has been approved.`,
          icon: 'success',
          confirmButtonColor: '#D68904',
        });
        loadData();
      } catch (err: any) {
        Swal.fire({
          title: 'Operation Failed',
          text: err.message || 'Could not approve leave.',
          icon: 'error',
          confirmButtonColor: '#D68904',
        });
      }
    }
  };

  const handleRejectLeave = async (req: LeaveRequestRecord) => {
    const { value: comment } = await Swal.fire({
      title: 'Reject Leave Application',
      input: 'textarea',
      inputLabel: 'Reason for Rejection',
      inputPlaceholder: 'Enter operational reason for rejecting leave...',
      inputValidator: (value) => {
        if (!value) return 'Please specify a reason.';
      },
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Reject Leave',
    });

    if (comment) {
      try {
        await reviewLeaveRequest(
          {
            requestId: req.id,
            decision: 'rejected',
            decisionNotes: comment,
          },
          {
            id: user?.id || '',
            displayName: user?.name || user?.email || 'HR Administrator',
            roles: roles || ['hr_administrator'],
          }
        );
        Swal.fire({
          title: 'Rejected',
          text: 'Leave application was rejected.',
          icon: 'info',
          confirmButtonColor: '#D68904',
        });
        loadData();
      } catch (err: any) {
        Swal.fire({
          title: 'Operation Failed',
          text: err.message || 'Could not reject leave.',
          icon: 'error',
          confirmButtonColor: '#D68904',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Human Resources Dashboard"
        subtitle="Workforce operations command, personnel statistics, clearance vetting, and contract renewals."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'HR Dashboard' },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Department Filter */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded border border-surface-border bg-white text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-charcoal-500"
            >
              <option value="all">All Departments</option>
              <option value="EXEC">Executive Office</option>
              <option value="PRJ">Programs & Delivery</option>
              <option value="FIN">Finance & Operations</option>
              <option value="HR">Human Resources</option>
              <option value="PROC">Procurement & Logistics</option>
              <option value="ME">Monitoring & Evaluation</option>
            </select>

            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded border border-surface-border bg-white text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-charcoal-500"
            >
              <option value="q4_2026">Q4 2026 (Current)</option>
              <option value="q3_2026">Q3 2026</option>
              <option value="annual_2026">Full Year 2026</option>
            </select>

            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Updated {lastUpdated}</span>
            </Button>

            <Button variant="primary" size="sm" onClick={() => navigate('/hr/staff/new')}>
              <UserPlus className="h-4 w-4 mr-1.5" />
              Register Staff
            </Button>
          </div>
        }
      />

      {/* 6 Compact Enterprise KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Total Staff */}
        <div
          onClick={() => navigate('/hr')}
          className="bg-white border border-surface-border rounded-lg p-3.5 hover:border-charcoal-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Total Staff</span>
            <Users className="h-4 w-4 text-charcoal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-charcoal-900 tabular-nums">
            {staff.length}
          </div>
          <span className="text-[11px] text-charcoal-muted mt-1 block">Roster records</span>
        </div>

        {/* KPI 2: Active Staff */}
        <div
          onClick={() => navigate('/hr')}
          className="bg-white border border-surface-border rounded-lg p-3.5 hover:border-charcoal-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Active Staff</span>
            <CheckCircle2 className="h-4 w-4 text-charcoal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {activeStaff.length}
          </div>
          <span className="text-[11px] text-charcoal-muted mt-1 block">In service today</span>
        </div>

        {/* KPI 3: Departments */}
        <div
          onClick={() => navigate('/hr/departments')}
          className="bg-white border border-surface-border rounded-lg p-3.5 hover:border-charcoal-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Departments</span>
            <Building className="h-4 w-4 text-charcoal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-charcoal-900 tabular-nums">
            {uniqueDepartmentsCount}
          </div>
          <span className="text-[11px] text-charcoal-muted mt-1 block">Organized units</span>
        </div>

        {/* KPI 4: Contracts Nearing Expiry */}
        <div
          onClick={() => navigate('/hr/contracts')}
          className="bg-white border border-surface-border rounded-lg p-3.5 hover:border-charcoal-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Contract Expiry</span>
            <AlertCircle className="h-4 w-4 text-charcoal-600" />
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono tabular-nums ${expiringContracts.length > 0 ? 'text-rose-600' : 'text-charcoal-900'}`}>
            {expiringContracts.length}
          </div>
          <span className="text-[11px] text-charcoal-muted mt-1 block">Due in &le;60 days</span>
        </div>

        {/* KPI 5: Pending Leave Requests */}
        <div
          onClick={() => navigate('/hr/leave')}
          className="bg-white border border-surface-border rounded-lg p-3.5 hover:border-charcoal-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Pending Leave</span>
            <Clock className="h-4 w-4 text-charcoal-600" />
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono tabular-nums ${pendingLeaves.length > 0 ? 'text-amber-600' : 'text-charcoal-900'}`}>
            {pendingLeaves.length}
          </div>
          <span className="text-[11px] text-charcoal-muted mt-1 block">Awaiting sign-off</span>
        </div>

        {/* KPI 6: Clearance Vetting */}
        <div
          onClick={() => navigate('/hr/onboarding')}
          className="bg-white border border-surface-border rounded-lg p-3.5 hover:border-charcoal-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Pending Vetting</span>
            <Shield className="h-4 w-4 text-charcoal-600" />
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono tabular-nums ${pendingCandidates.length > 0 ? 'text-amber-600' : 'text-charcoal-900'}`}>
            {pendingCandidates.length}
          </div>
          <span className="text-[11px] text-charcoal-muted mt-1 block">Onboarding dossiers</span>
        </div>
      </div>

      {/* Workforce Analytics Row (AdminCN horizontal bar + segmented distributions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Staff Headcount by Department (Horizontal Bar Chart) */}
        <div className="bg-white border border-surface-border rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal-900">Staff Headcount by Department</h3>
              <span className="text-xs font-mono text-charcoal-muted">{staff.length} Total</span>
            </div>
            <p className="text-xs text-charcoal-muted mt-0.5">Distribution across institutional units</p>
          </div>

          <div className="mt-4 space-y-2.5">
            {Object.entries(departmentCounts).map(([deptName, count]) => {
              const maxCount = Math.max(...Object.values(departmentCounts), 1);
              const percentage = Math.round((count / (staff.length || 1)) * 100);
              const barWidth = Math.round((count / maxCount) * 100);

              return (
                <div key={deptName} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-charcoal-800 truncate max-w-[200px]">{deptName}</span>
                    <span className="font-mono text-charcoal-600 font-bold">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-charcoal-800 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-surface-border mt-4 text-right">
            <button
              type="button"
              onClick={() => navigate('/hr/departments')}
              className="text-xs font-semibold text-charcoal-800 hover:text-black inline-flex items-center gap-1"
            >
              <span>View Department Hierarchy</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Chart 2: Tenure & Employment Type Distribution */}
        <div className="bg-white border border-surface-border rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal-900">Employment Contract Types</h3>
              <Badge variant="info">Workforce Terms</Badge>
            </div>
            <p className="text-xs text-charcoal-muted mt-0.5">Breakdown of tenure classifications</p>
          </div>

          <div className="mt-4 space-y-3">
            {[
              { label: 'Permanent Appointments', count: contractTypeCounts.permanent || 0, desc: 'Open-ended institutional contracts' },
              { label: 'Fixed-Term Agreements', count: contractTypeCounts.fixed_term || 0, desc: '1-year grant-funded appointments' },
              { label: 'Specialist Consultants', count: contractTypeCounts.consultant || 0, desc: 'Technical deliverable-based terms' },
              { label: 'Volunteers & Interns', count: contractTypeCounts.intern || 0, desc: 'Community development trainees' },
            ].map((t) => {
              const pct = Math.round((t.count / (staff.length || 1)) * 100);
              return (
                <div key={t.label} className="p-2.5 border border-surface-border rounded-lg bg-slate-50/50">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-charcoal-900">{t.label}</span>
                    <span className="font-mono font-bold text-charcoal-900">{t.count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-charcoal-700 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-charcoal-muted mt-1 block">{t.desc}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-surface-border mt-4 text-right">
            <button
              type="button"
              onClick={() => navigate('/hr/contracts')}
              className="text-xs font-semibold text-charcoal-800 hover:text-black inline-flex items-center gap-1"
            >
              <span>Manage Contracts</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Chart 3: Contract Expiry Timeline Forecast */}
        <div className="bg-white border border-surface-border rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal-900">Contract Expiry Horizon</h3>
              <span className="text-xs font-mono text-charcoal-muted">Next 90 Days</span>
            </div>
            <p className="text-xs text-charcoal-muted mt-0.5">Upcoming renewal deadlines for fixed-term staff</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="p-3 border border-rose-200 rounded-lg bg-rose-50/50">
              <span className="text-[11px] font-semibold text-rose-800 uppercase block">Critical (&le;30 Days)</span>
              <span className="text-2xl font-bold font-mono text-rose-700 mt-1 block">{expiryBuckets.within30}</span>
              <span className="text-[10px] text-rose-600 mt-0.5 block">Immediate action required</span>
            </div>

            <div className="p-3 border border-amber-200 rounded-lg bg-amber-50/50">
              <span className="text-[11px] font-semibold text-amber-800 uppercase block">Renewal Due (60 Days)</span>
              <span className="text-2xl font-bold font-mono text-amber-700 mt-1 block">{expiryBuckets.within60}</span>
              <span className="text-[10px] text-amber-600 mt-0.5 block">Appraisal review cycle</span>
            </div>

            <div className="p-3 border border-surface-border rounded-lg bg-white">
              <span className="text-[11px] font-semibold text-charcoal-600 uppercase block">Upcoming (90 Days)</span>
              <span className="text-2xl font-bold font-mono text-charcoal-900 mt-1 block">{expiryBuckets.within90}</span>
              <span className="text-[10px] text-charcoal-muted mt-0.5 block">Forecast horizon</span>
            </div>

            <div className="p-3 border border-surface-border rounded-lg bg-white">
              <span className="text-[11px] font-semibold text-charcoal-600 uppercase block">Stable (&gt;90d / Perm)</span>
              <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block">{expiryBuckets.beyond90}</span>
              <span className="text-[10px] text-charcoal-muted mt-0.5 block">Tenure secured</span>
            </div>
          </div>

          <div className="pt-3 border-t border-surface-border mt-4 text-right">
            <button
              type="button"
              onClick={() => navigate('/hr/contracts')}
              className="text-xs font-semibold text-charcoal-800 hover:text-black inline-flex items-center gap-1"
            >
              <span>View Renewal Register</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Pending Vetting Banner (When candidates need HR clearance) */}
      {pendingCandidates.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-amber-200 flex items-center justify-between bg-amber-100/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Staff Awaiting HR Clearance & Vetting ({pendingCandidates.length})
                </h3>
                <p className="text-xs text-amber-700">
                  Incoming candidates requiring personal credential vetting, department assignment, and system role staging.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/onboarding')}>
              Onboarding Workspace
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[650px] bg-white">
              <thead className="bg-amber-50/80 text-xs font-semibold text-charcoal-700 border-b border-amber-100">
                <tr>
                  <th className="py-2.5 px-4">Applicant Name</th>
                  <th className="py-2.5 px-4">Official Email</th>
                  <th className="py-2.5 px-4">Contact Phone</th>
                  <th className="py-2.5 px-4">Registration Date</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {pendingCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-charcoal-900 text-xs">{c.displayName}</td>
                    <td className="py-3 px-4 text-xs font-mono text-charcoal-700">{c.email}</td>
                    <td className="py-3 px-4 text-xs text-charcoal-600">{c.phoneNumber || '—'}</td>
                    <td className="py-3 px-4 text-xs text-charcoal-500 font-mono">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => {
                          setSelectedCandidate(c);
                          setIsOnboardingModalOpen(true);
                        }}
                        className="bg-charcoal-900 hover:bg-black text-white text-xs py-1 px-3 h-auto"
                      >
                        Review & Onboard
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Personnel Directory & Roles Preview Table */}
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface-muted/20">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-charcoal-700" />
              Staff Personnel Directory & Role Assignments
            </h3>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Live organizational roster connected to Supabase database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr')}>
              View All {staff.length} Staff
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[750px]">
            <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-4">Staff Member</th>
                <th className="py-2.5 px-4">Assigned Role / Title</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Contact Info</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-charcoal-muted text-xs">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-charcoal-400 mb-2" />
                    Synchronizing staff records with database...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-charcoal-muted text-xs">
                    No staff records found in database.
                  </td>
                </tr>
              ) : (
                staff.slice(0, 8).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-charcoal-900 text-xs">{s.fullName}</div>
                      <div className="text-[11px] font-mono text-charcoal-muted">{s.staffNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-xs text-charcoal-800">{s.jobTitle}</div>
                      <div className="text-[11px] text-charcoal-muted capitalize">{s.contractType.replace('_', ' ')}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-700">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-charcoal-400" />
                        <span>{s.departmentName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-600">
                      {s.email && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Mail className="h-3 w-3 text-charcoal-400" />
                          <span>{s.email}</span>
                        </div>
                      )}
                      {s.phoneNumber && (
                        <div className="text-[11px] text-charcoal-muted mt-0.5">{s.phoneNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {s.employmentStatus === 'active' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          {s.employmentStatus}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaffForModal(s);
                            setIsDetailModalOpen(true);
                          }}
                          className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-charcoal-800 hover:bg-slate-200 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Dossier
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/users')}
                          className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-charcoal-50 text-charcoal-800 hover:bg-charcoal-100 transition-colors"
                        >
                          <UserCog className="h-3.5 w-3.5 mr-1" />
                          Role
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Operational Queues: Leave Approvals & Contract Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Requests Approval Queue */}
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-charcoal-600" />
                Leave Applications Approval Queue ({pendingLeaves.length})
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Staff absence requests requiring supervisor authorization
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/hr/leave')}>
              {t('common.viewAll', 'View All')}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-3">Staff Name</th>
                  <th className="py-2.5 px-3">Leave Type</th>
                  <th className="py-2.5 px-3 text-right">Days</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {pendingLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-charcoal-muted text-xs">
                      No pending leave applications requiring approval.
                    </td>
                  </tr>
                ) : (
                  pendingLeaves.slice(0, 5).map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-charcoal-900 text-xs">{req.staffName}</div>
                        <div className="text-[11px] text-charcoal-muted font-mono">{req.startDate} — {req.endDate}</div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-charcoal-700 whitespace-nowrap">
                        {req.leaveTypeName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-charcoal-900 whitespace-nowrap">
                        {req.daysRequested}d
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApproveLeave(req)}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectLeave(req)}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contract Renewal Watchlist */}
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                Contract Expiry & Renewal Watchlist ({expiringContracts.length})
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Staff agreements approaching expiration within 60 days
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/hr/contracts')}>
              {t('common.viewAll', 'View All')}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-3">Staff Member</th>
                  <th className="py-2.5 px-3">Job Title & Dept</th>
                  <th className="py-2.5 px-3">Contract End</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {expiringContracts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-charcoal-muted text-xs">
                      No contracts nearing expiration within 60 days.
                    </td>
                  </tr>
                ) : (
                  expiringContracts.slice(0, 5).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-charcoal-900 text-xs">
                        {s.fullName}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-charcoal-700">
                        <div>{s.jobTitle}</div>
                        <div className="text-charcoal-muted text-[11px]">{s.departmentName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-xs font-mono font-bold text-rose-700 whitespace-nowrap">
                        {s.endDate}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className="font-mono text-[10px] font-bold uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Renewal Due
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* HR User Onboarding Review Modal (Stepper) */}
      <UserOnboardingReviewModal
        isOpen={isOnboardingModalOpen}
        onClose={() => {
          setIsOnboardingModalOpen(false);
          setSelectedCandidate(null);
        }}
        user={selectedCandidate}
        onSuccess={loadData}
      />

      {/* Staff Dossier Detail Modal */}
      <StaffDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedStaffForModal(null);
        }}
        staff={selectedStaffForModal}
        onStaffUpdated={loadData}
      />
    </div>
  );
};

export default HrAdministratorDashboard;
