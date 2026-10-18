import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Check,
  X,
  RefreshCw,
  Plus,
  Eye,
  FileText,
  Building,
  User,
  ArrowRight,
  Download,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  getLeaveRequests,
  reviewLeaveRequest,
  getStaffProfiles,
  getLeaveBalances,
} from '../services/hrService';
import {
  LeaveRequestRecord,
  StaffProfileRecord,
  LeaveBalanceRecord,
} from '../types/hr';
import { CreateLeaveRequestModal } from '../components/CreateLeaveRequestModal';
import { useAuth } from '@/features/auth/useAuth';

export const HrLeavePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, roles } = useAuth();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffProfileRecord[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [requestBalances, setRequestBalances] = useState<LeaveBalanceRecord[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [lList, sList] = await Promise.all([
        getLeaveRequests(undefined, user ? { id: user.id, roles } : undefined),
        getStaffProfiles(),
      ]);
      setLeaveRequests(lList);
      setStaffList(sList);
    } catch (e) {
      console.error('Failed loading leave telemetry:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user, roles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When detail opens, fetch staff balances
  useEffect(() => {
    if (selectedRequest) {
      getLeaveBalances(selectedRequest.staffId)
        .then(setRequestBalances)
        .catch(() => setRequestBalances([]));
    } else {
      setRequestBalances([]);
    }
  }, [selectedRequest]);

  const pendingRequests = leaveRequests.filter((r) => r.status === 'pending');
  const approvedRequests = leaveRequests.filter((r) => r.status === 'approved');
  const rejectedRequests = leaveRequests.filter((r) => r.status === 'rejected');

  // Today & upcoming on leave
  const todayStr = new Date().toISOString().split('T')[0];
  const currentlyOnLeave = approvedRequests.filter(
    (r) => r.startDate <= todayStr && r.endDate >= todayStr
  );

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((req) => {
      const matchesSearch =
        req.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.leaveTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.staffDepartment.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || req.status === selectedStatus;
      const matchesType = selectedLeaveType === 'all' || req.leaveTypeCode.toLowerCase() === selectedLeaveType.toLowerCase();

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [leaveRequests, searchQuery, selectedStatus, selectedLeaveType]);

  const handleApprove = async (req: LeaveRequestRecord) => {
    const result = await Swal.fire({
      title: 'Approve Leave Application?',
      text: `Authorize ${req.daysRequested} days of ${req.leaveTypeName} for ${req.staffName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Yes, Authorize Leave',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await reviewLeaveRequest(
          {
            requestId: req.id,
            decision: 'approved',
            decisionNotes: 'Authorized by HR Administrator upon entitlement verification.',
          },
          {
            id: user?.id || '',
            displayName: user?.name || user?.email || 'HR Administrator',
            roles: roles || ['hr_administrator'],
          }
        );
        Swal.fire({
          title: 'Authorized!',
          text: `Leave request ${req.requestNumber} for ${req.staffName} approved.`,
          icon: 'success',
          confirmButtonColor: '#D68904',
        });
        setIsDetailOpen(false);
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

  const handleReject = async (req: LeaveRequestRecord) => {
    const { value: comment } = await Swal.fire({
      title: 'Reject Leave Application',
      input: 'textarea',
      inputLabel: 'Reason for Rejection',
      inputPlaceholder: 'Enter operational reason for rejecting this leave application...',
      inputValidator: (value) => {
        if (!value) return 'Please specify an operational reason.';
      },
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Reject Application',
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
          text: `Leave request ${req.requestNumber} was rejected.`,
          icon: 'info',
          confirmButtonColor: '#D68904',
        });
        setIsDetailOpen(false);
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

  const exportCsv = () => {
    const headers = ['Request Number', 'Staff Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'];
    const rows = filteredRequests.map((r) => [
      r.requestNumber,
      `"${r.staffName}"`,
      `"${r.staffDepartment}"`,
      `"${r.leaveTypeName}"`,
      r.startDate,
      r.endDate,
      r.daysRequested,
      r.status,
      `"${r.reason.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BAOMS_Leave_Register_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Leave Governance"
        subtitle="Manage staff leave applications, track entitlement balances, enforce statutory allowances, and monitor absence schedules."
        breadcrumbs={[
          { label: 'HR Dashboard', href: '/' },
          { label: 'Staff Directory', href: '/hr' },
          { label: 'Attendance & Leave' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Leave Application
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Pending Review</span>
            <Clock className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono tabular-nums leading-tight ${pendingRequests.length > 0 ? 'text-amber-600' : 'text-charcoal-900'}`}>
            {pendingRequests.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Applications awaiting HR administrator review
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Currently On Leave</span>
            <Calendar className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-900">
            {currentlyOnLeave.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Personnel absent today with approved leave
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Approved (Total)</span>
            <CheckCircle2 className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-emerald-700">
            {approvedRequests.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Authorized leave applications this calendar year
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Declined / Returned</span>
            <AlertCircle className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-700">
            {rejectedRequests.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Applications rejected due to staffing quotas
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-surface-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="relative max-w-xs w-full">
            <Search className="h-3.5 w-3.5 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff, reference..."
              className="pl-8 pr-3 py-1.5 text-xs rounded border border-surface-border bg-white focus:outline-none focus:ring-1 focus:ring-charcoal-500 w-full"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1.5 px-3 text-xs rounded border border-surface-border bg-white text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-charcoal-500"
          >
            <option value="all">All Approval Statuses</option>
            <option value="pending">Pending Review ({pendingRequests.length})</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={selectedLeaveType}
            onChange={(e) => setSelectedLeaveType(e.target.value)}
            className="py-1.5 px-3 text-xs rounded border border-surface-border bg-white text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-charcoal-500"
          >
            <option value="all">All Leave Types</option>
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="maternity">Maternity / Paternity</option>
            <option value="compassionate">Compassionate</option>
            <option value="unpaid">Leave without Pay</option>
          </select>
        </div>

        <div className="text-xs text-charcoal-muted">
          Showing {filteredRequests.length} leave requests
        </div>
      </div>

      {/* Main Leave Register Table */}
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[750px]">
            <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-4">Ref Number</th>
                <th className="py-2.5 px-4">Staff Member</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Leave Type</th>
                <th className="py-2.5 px-4">Period</th>
                <th className="py-2.5 px-4 text-center">Days</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-charcoal-muted text-xs">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-charcoal-400 mb-2" />
                    Loading leave requests from database...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-charcoal-muted text-xs">
                    No leave applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-charcoal-700">
                      {req.requestNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-charcoal-900">{req.staffName}</div>
                      <div className="text-[11px] font-mono text-charcoal-muted">{req.staffNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-700">
                      {req.staffDepartment}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-charcoal-800">
                      {req.leaveTypeName}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-charcoal-600">
                      {req.startDate} — {req.endDate}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-xs text-charcoal-900">
                      {req.daysRequested}d
                    </td>
                    <td className="py-3 px-4">
                      {req.status === 'pending' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Pending Review
                        </span>
                      ) : req.status === 'approved' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Approved
                        </span>
                      ) : req.status === 'rejected' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {req.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(req);
                            setIsDetailOpen(true);
                          }}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-charcoal-800 hover:bg-slate-200"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Details
                        </button>
                        {req.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(req)}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              title="Approve Leave"
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(req)}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100"
                              title="Reject Leave"
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Request Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRequest(null);
        }}
        title={selectedRequest ? `Leave Application ${selectedRequest.requestNumber}` : 'Leave Details'}
        description="Comprehensive review of employee entitlement, handover notes, and approval history."
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
            {selectedRequest && selectedRequest.status === 'pending' && (
              <div className="flex items-center gap-2">
                <Button variant="danger" size="sm" onClick={() => handleReject(selectedRequest)}>
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Reject Application
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleApprove(selectedRequest)}>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Approve Leave
                </Button>
              </div>
            )}
          </div>
        }
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-charcoal-muted">Applicant:</span>
                  <div className="font-bold text-charcoal-900 text-sm">{selectedRequest.staffName}</div>
                  <div className="text-charcoal-600 font-mono text-[11px]">{selectedRequest.staffNumber} • {selectedRequest.staffDepartment}</div>
                </div>
                <div>
                  <span className="text-charcoal-muted">Application Type:</span>
                  <div className="font-bold text-charcoal-900 text-sm">{selectedRequest.leaveTypeName}</div>
                  <div className="font-mono text-[11px] text-charcoal-600">
                    {selectedRequest.startDate} — {selectedRequest.endDate} ({selectedRequest.daysRequested} days)
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-charcoal-muted">Stated Reason:</span>
                <p className="text-charcoal-800 mt-0.5 italic">{selectedRequest.reason || 'None provided'}</p>
              </div>

              {selectedRequest.handoverStaffName && (
                <div className="pt-1 text-charcoal-700">
                  <span>Operational Handover: <strong>{selectedRequest.handoverStaffName}</strong></span>
                </div>
              )}
            </div>

            {/* Leave Entitlement Balances */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-600 mb-2">
                Leave Entitlement Balances ({new Date().getFullYear()})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {requestBalances.map((b) => (
                  <div key={b.id} className="p-2.5 border border-surface-border rounded-lg bg-white text-center">
                    <span className="text-[11px] text-charcoal-muted block truncate">{b.leaveTypeName}</span>
                    <span className="text-sm font-bold font-mono text-charcoal-900 mt-1 block">
                      {b.remainingDays} <span className="text-xs font-normal text-charcoal-muted">/ {b.allocatedDays}d</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision History if already reviewed */}
            {selectedRequest.decisionAt && (
              <div className="p-3 border border-surface-border rounded-lg bg-white space-y-1 text-xs">
                <div className="font-semibold text-charcoal-900">Decision Audit:</div>
                <div className="text-charcoal-700">
                  Status: <strong>{selectedRequest.status.toUpperCase()}</strong> by {selectedRequest.decisionByName || 'HR Administrator'} on {new Date(selectedRequest.decisionAt).toLocaleDateString()}
                </div>
                {selectedRequest.decisionNotes && (
                  <p className="text-charcoal-600 italic mt-1">"{selectedRequest.decisionNotes}"</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Leave Request Modal */}
      <CreateLeaveRequestModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        staffList={staffList}
        onSuccess={loadData}
      />
    </div>
  );
};

export default HrLeavePage;
