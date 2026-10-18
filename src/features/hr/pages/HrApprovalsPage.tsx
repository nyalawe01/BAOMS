import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Check,
  X,
  RefreshCw,
  Eye,
  Building,
  User,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertTriangle,
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
} from '../services/hrService';
import { LeaveRequestRecord, StaffProfileRecord } from '../types/hr';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserOnboardingReviewModal, PendingUserCandidate } from '@/features/users/components/UserOnboardingReviewModal';
import { useAuth } from '@/features/auth/useAuth';

interface GenericHrRequest {
  id: string;
  reference: string;
  type: 'leave' | 'onboarding' | 'contract' | 'document';
  staffName: string;
  department: string;
  submissionDate: string;
  dueDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'forwarded';
  urgency: 'high' | 'medium' | 'normal';
  details: string;
  rawRecord?: any;
}

export const HrApprovalsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, roles } = useAuth();

  const [requests, setRequests] = useState<GenericHrRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'leave' | 'onboarding' | 'contract'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [selectedCandidate, setSelectedCandidate] = useState<PendingUserCandidate | null>(null);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<GenericHrRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [lList, sList] = await Promise.all([
        getLeaveRequests(undefined, user ? { id: user.id, roles } : undefined),
        getStaffProfiles(),
      ]);

      const items: GenericHrRequest[] = [];

      // 1. Leave Requests
      lList.forEach((l) => {
        items.push({
          id: `req-leave-${l.id}`,
          reference: l.requestNumber,
          type: 'leave',
          staffName: l.staffName,
          department: l.staffDepartment,
          submissionDate: l.createdAt?.split('T')[0] || '2026-10-15',
          dueDate: l.startDate,
          status: l.status === 'pending' ? 'pending' : l.status === 'approved' ? 'approved' : 'rejected',
          urgency: l.daysRequested >= 5 ? 'high' : 'normal',
          details: `${l.daysRequested} days of ${l.leaveTypeName} (${l.startDate} to ${l.endDate}). Reason: ${l.reason || 'Personal'}`,
          rawRecord: l,
        });
      });

      // 2. Pending Onboarding Candidates
      if (isSupabaseConfigured) {
        const { data: pRows } = await supabase
          .from('profiles')
          .select('id, display_name, official_email, phone_number, approval_status, staged_details, created_at')
          .eq('approval_status', 'pending_hr');

        if (pRows) {
          pRows.forEach((p: any) => {
            items.push({
              id: `req-onb-${p.id}`,
              reference: `ONB-${p.id.substring(0, 5).toUpperCase()}`,
              type: 'onboarding',
              staffName: p.display_name || p.official_email?.split('@')[0] || 'Incoming Staff',
              department: p.staged_details?.departmentName || 'Pending Assignment',
              submissionDate: p.created_at?.split('T')[0] || 'Recent',
              dueDate: 'Immediate',
              status: 'pending',
              urgency: 'high',
              details: `Candidate self-registered (${p.official_email}). HR clearance vetting and role assignment required.`,
              rawRecord: {
                id: p.id,
                email: p.official_email || '',
                displayName: p.display_name || p.official_email?.split('@')[0] || 'Incoming Staff',
                phoneNumber: p.phone_number || '',
                approvalStatus: p.approval_status,
                createdAt: p.created_at,
                stagedDetails: p.staged_details || {},
              },
            });
          });
        }
      }

      // 3. Expiring Contracts needing preparation
      const now = new Date();
      const in45Days = new Date(now.getTime() + 45 * 86400000);
      sList.forEach((s) => {
        if (s.endDate) {
          const end = new Date(s.endDate);
          if (end >= now && end <= in45Days) {
            items.push({
              id: `req-con-${s.id}`,
              reference: `CON-RENEW-${s.staffNumber}`,
              type: 'contract',
              staffName: s.fullName,
              department: s.departmentName,
              submissionDate: s.startDate,
              dueDate: s.endDate,
              status: 'pending',
              urgency: end <= new Date(now.getTime() + 20 * 86400000) ? 'high' : 'medium',
              details: `Fixed-term agreement expires on ${s.endDate}. Performance review and contract renewal dossier required.`,
              rawRecord: s,
            });
          }
        }
      });

      setRequests(items);
    } catch (e) {
      console.warn('Approvals telemetry notice:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user, roles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const urgentRequests = requests.filter((r) => r.status === 'pending' && r.urgency === 'high');

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        r.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.details.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab = activeTab === 'all' || r.type === activeTab;
      const matchesUrgency = selectedUrgency === 'all' || r.urgency === selectedUrgency;

      return matchesSearch && matchesTab && matchesUrgency;
    });
  }, [requests, searchQuery, activeTab, selectedUrgency]);

  const handleAction = async (req: GenericHrRequest) => {
    if (req.type === 'onboarding') {
      setSelectedCandidate(req.rawRecord);
      setIsOnboardingModalOpen(true);
    } else if (req.type === 'leave') {
      const l = req.rawRecord as LeaveRequestRecord;
      const result = await Swal.fire({
        title: 'Review Leave Application',
        text: `Authorize ${l.daysRequested} days of ${l.leaveTypeName} for ${l.staffName}?`,
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: '#10b981',
        denyButtonColor: '#ef4444',
        confirmButtonText: 'Approve',
        denyButtonText: 'Reject',
        cancelButtonText: 'Cancel',
      });

      if (result.isConfirmed) {
        await reviewLeaveRequest(
          { requestId: l.id, decision: 'approved', decisionNotes: 'Authorized in HR Requests Queue.' },
          { id: user?.id || '', displayName: user?.name || user?.email || 'HR Administrator', roles: roles || ['hr_administrator'] }
        );
        Swal.fire('Approved', 'Leave request has been approved.', 'success');
        loadData();
      } else if (result.isDenied) {
        await reviewLeaveRequest(
          { requestId: l.id, decision: 'rejected', decisionNotes: 'Declined in HR Requests Queue.' },
          { id: user?.id || '', displayName: user?.name || user?.email || 'HR Administrator', roles: roles || ['hr_administrator'] }
        );
        Swal.fire('Rejected', 'Leave request has been rejected.', 'info');
        loadData();
      }
    } else if (req.type === 'contract') {
      navigate('/hr/contracts');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Requests & Central Approvals Queue"
        subtitle="Operational triage desk for leave authorizations, candidate onboarding vetting, and contract renewal actions."
        breadcrumbs={[
          { label: 'HR Dashboard', href: '/' },
          { label: 'Staff Directory', href: '/hr' },
          { label: 'HR Approvals' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Sync Queue
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/approvals')}>
              All Org Approvals
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Pending Action</span>
            <Clock className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono tabular-nums leading-tight ${pendingRequests.length > 0 ? 'text-amber-600' : 'text-charcoal-900'}`}>
            {pendingRequests.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Requests requiring HR review or decision
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>High Priority</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono tabular-nums leading-tight ${urgentRequests.length > 0 ? 'text-rose-600' : 'text-charcoal-900'}`}>
            {urgentRequests.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Critical deadlines or immediate clearances
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Leave Applications</span>
            <FileText className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-900">
            {requests.filter((r) => r.type === 'leave' && r.status === 'pending').length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Absence approvals awaiting sign-off
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Onboarding Vetting</span>
            <ShieldCheck className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-emerald-700">
            {requests.filter((r) => r.type === 'onboarding' && r.status === 'pending').length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            New staff awaiting HR dossier vetting
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'all'
              ? 'border-charcoal-900 text-charcoal-900 font-bold'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <CheckSquare className="h-4 w-4 text-charcoal-700" />
          <span>All Requests ({requests.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('leave')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'leave'
              ? 'border-charcoal-900 text-charcoal-900 font-bold'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Clock className="h-4 w-4 text-charcoal-700" />
          <span>Leave Approvals ({requests.filter((r) => r.type === 'leave').length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('onboarding')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'onboarding'
              ? 'border-charcoal-900 text-charcoal-900 font-bold'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-charcoal-700" />
          <span>Onboarding Vetting ({requests.filter((r) => r.type === 'onboarding').length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contract')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'contract'
              ? 'border-charcoal-900 text-charcoal-900 font-bold'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <FileText className="h-4 w-4 text-charcoal-700" />
          <span>Contract Renewals ({requests.filter((r) => r.type === 'contract').length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-surface-border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="h-3.5 w-3.5 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search request ref, staff member, details..."
            className="pl-9 pr-3 py-1.5 text-xs rounded border border-surface-border bg-white focus:outline-none focus:ring-1 focus:ring-charcoal-500 w-full"
          />
        </div>

        <select
          value={selectedUrgency}
          onChange={(e) => setSelectedUrgency(e.target.value)}
          className="py-1.5 px-3 text-xs rounded border border-surface-border bg-white text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-charcoal-500"
        >
          <option value="all">All Urgency Levels</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium</option>
          <option value="normal">Normal</option>
        </select>
      </div>

      {/* Main Request Queue Table */}
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[750px]">
            <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-4">Request Ref</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Staff Member</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Details Summary</th>
                <th className="py-2.5 px-4">Due Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-charcoal-muted text-xs">
                    No requests pending in this queue view.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-charcoal-700">
                      {req.reference}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-charcoal-800">
                        {req.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-charcoal-900 text-xs">
                      {req.staffName}
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-700">
                      {req.department}
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-600 max-w-xs truncate">
                      {req.details}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-charcoal-600">
                      {req.dueDate}
                    </td>
                    <td className="py-3 px-4">
                      {req.status === 'pending' ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          req.urgency === 'high'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {req.urgency === 'high' ? 'Urgent Review' : 'Pending'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {req.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleAction(req)}
                        className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-charcoal-900 hover:bg-black text-white transition-colors"
                      >
                        Action
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stepper Onboarding Modal */}
      <UserOnboardingReviewModal
        isOpen={isOnboardingModalOpen}
        onClose={() => {
          setIsOnboardingModalOpen(false);
          setSelectedCandidate(null);
        }}
        user={selectedCandidate}
        onSuccess={loadData}
      />
    </div>
  );
};

export default HrApprovalsPage;
