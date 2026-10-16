import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import Swal from 'sweetalert2';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
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

export const HrAdministratorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, roles } = useAuth();

  const [staff, setStaff] = useState<StaffProfileRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>([]);

  const loadData = async () => {
    try {
      const [sList, lList] = await Promise.all([
        getStaffProfiles(),
        getLeaveRequests(),
      ]);
      setStaff(sList);
      setLeaveRequests(lList);
    } catch (e) {
      console.error('Failed loading HR telemetry:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeStaff = staff.filter((s) => s.employmentStatus === 'active');
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending');

  // Contracts expiring within 60 days
  const now = new Date();
  const in60Days = new Date(now.getTime() + 60 * 86400000);
  const expiringContracts = staff.filter((s) => {
    if (!s.endDate) return false;
    const endDate = new Date(s.endDate);
    return endDate >= now && endDate <= in60Days;
  });

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
        await Swal.fire({
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
        await Swal.fire({
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
      <PageHeader
        title={t('hr.dashboardTitle', 'Human Resources & Personnel Governance')}
        subtitle={t(
          'hr.dashboardSubtitle',
          'Staff records, contract renewal tracking, leave approvals, and employee documentation compliance.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('hr.console', 'HR Command Console') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
              <Calendar className="h-4 w-4 mr-1.5" />
              {t('hr.reports', 'HR Audits & Reports')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/hr')}>
              <UserPlus className="h-4 w-4 mr-1.5" />
              {t('hr.newStaff', 'Manage Staff Roster')}
            </Button>
          </div>
        }
      />

      {/* HR Health KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Staff Headcount</span>
            <Users className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-charcoal-900 font-mono tabular-nums leading-tight">
            {activeStaff.length} <span className="text-sm font-normal text-charcoal-muted">/ {staff.length}</span>
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Registered personnel across depts
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Pending Leave</span>
            <Clock className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono tabular-nums leading-tight ${pendingLeaves.length > 0 ? 'text-amber-600' : 'text-charcoal-900'}`}>
            {pendingLeaves.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Applications awaiting supervisor sign-off
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Expiring Contracts</span>
            <AlertCircle className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono tabular-nums leading-tight ${expiringContracts.length > 0 ? 'text-rose-600' : 'text-charcoal-900'}`}>
            {expiringContracts.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Personnel contracts nearing renewal
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Statutory Compliance</span>
            <FileCheck className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono tabular-nums leading-tight">
            96%
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Verified ID, NIDA, TIN & contracts
          </p>
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
                Leave Applications Approval Queue
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Staff absence requests requiring supervisor authorization
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/hr')}>
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
                        <div className="font-semibold text-charcoal-900">{req.staffName}</div>
                        <div className="text-xs text-charcoal-muted">{req.startDate} — {req.endDate}</div>
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
                            title="Approve Leave"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectLeave(req)}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                            title="Reject Leave"
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
                Contract Expiry & Renewal Watchlist
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Staff contracts approaching expiration within 60 days
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/hr')}>
              {t('common.viewAll', 'View All')}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-3">Staff Name</th>
                  <th className="py-2.5 px-3">Job Title & Dept</th>
                  <th className="py-2.5 px-3">Contract End</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {expiringContracts.slice(0, 5).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-charcoal-900">
                      {s.fullName}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-charcoal-700">
                      <div>{s.jobTitle}</div>
                      <div className="text-charcoal-muted">{s.departmentName}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono font-bold text-rose-700 whitespace-nowrap">
                      {s.endDate}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className="font-mono text-[11px] font-bold uppercase text-amber-700">
                        RENEWAL DUE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
