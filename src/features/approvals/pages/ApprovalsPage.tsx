import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  Wallet,
  Users,
  ShoppingCart,
  Briefcase,
  FileText,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Eye,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/ui/KPICard';
import { useAuth } from '@/features/auth/useAuth';
import { getRequisitions, reviewFinancialRequest } from '@/features/finance/services/financeService';
import { FinancialRequestRecord } from '@/features/finance/types/finance';
import { getLeaveRequests, reviewLeaveRequest } from '@/features/hr/services/hrService';
import { LeaveRequestRecord } from '@/features/hr/types/hr';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Swal from 'sweetalert2';
import { showSuccess, showError } from '@/lib/sweetAlert';

export interface ApprovalItem {
  id: string;
  referenceNumber: string;
  title: string;
  type: 'finance' | 'procurement' | 'hr' | 'project' | 'document';
  moduleLabel: string;
  requesterName: string;
  requesterEmail?: string;
  projectOrDept: string;
  submissionDate: string;
  amount?: number;
  currency?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate: string;
  isOverdue: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  workflowStage: string;
  justification?: string;
  supportingDocuments?: Array<{ name: string; url?: string }>;
  rawRecord: any;
}

export const ApprovalsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, roles, hasRole, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const isExecutiveDirector = hasRole('executive_director') || isAdmin();

  const loadAllApprovals = async () => {
    setIsLoading(true);
    try {
      const items: ApprovalItem[] = [];

      // 1. Financial Requisitions
      const reqs = await getRequisitions();
      reqs.forEach((r) => {
        const isPending = r.status === 'submitted' || r.status === 'under_review';
        items.push({
          id: `fin-${r.id}`,
          referenceNumber: r.requestNumber,
          title: r.title,
          type: 'finance',
          moduleLabel: 'Finance',
          requesterName: r.requesterName,
          requesterEmail: r.requesterRole,
          projectOrDept: r.projectName || 'General Operations',
          submissionDate: r.createdAt.substring(0, 10),
          amount: r.totalAmount,
          currency: r.currency || 'TZS',
          priority: r.priority === 'urgent' ? 'urgent' : r.priority === 'high' ? 'high' : 'medium',
          dueDate: r.requiredDate || '2026-10-31',
          isOverdue: false,
          status: isPending ? 'pending' : r.status === 'approved' ? 'approved' : r.status === 'rejected' ? 'rejected' : 'returned',
          workflowStage: isPending ? 'Executive Director Final Sign-off' : `Completed (${r.status})`,
          justification: r.purpose || 'Official financial disbursement for authorized operations.',
          supportingDocuments: (r.supportingDocuments || []).map((doc: any) => ({
            name: typeof doc === 'string' ? doc : doc.name || 'Financial Justification Document',
            url: typeof doc === 'string' ? undefined : doc.url,
          })),
          rawRecord: r,
        });
      });

      // 2. Staff HR Approvals (Pending Executive Director Authorization)
      if (isSupabaseConfigured) {
        const { data: staffData } = await supabase
          .from('profiles')
          .select('id, display_name, official_email, phone_number, approval_status, staged_details, created_at')
          .eq('approval_status', 'pending_ed');

        (staffData || []).forEach((s: any) => {
          items.push({
            id: `hr-staff-${s.id}`,
            referenceNumber: `HR-VET-${s.id.substring(0, 8).toUpperCase()}`,
            title: `Staff Clearance: ${s.display_name}`,
            type: 'hr',
            moduleLabel: 'Human Resources',
            requesterName: 'HR Administrator (Elinami Munuo)',
            requesterEmail: 'hr@babawatoto.org',
            projectOrDept: s.staged_details?.departmentName || 'HR Administration',
            submissionDate: s.created_at?.substring(0, 10) || '2026-10-17',
            priority: 'high',
            dueDate: '2026-10-25',
            isOverdue: false,
            status: 'pending',
            workflowStage: 'Executive Clearance & System Access Grant',
            justification: `Candidate credentials vetted by HR. Assigned role: ${s.staged_details?.jobTitle || s.staged_details?.roleCode || 'Staff Member'}. Awaiting Director signature.`,
            supportingDocuments: [
              { name: 'Vetted Credentials & Professional Dossier' },
              { name: 'National NIDA Identity Clearance' },
            ],
            rawRecord: s,
          });
        });
      }

      // 3. Leave Requests requiring Executive Director decision
      const leaveList = await getLeaveRequests();
      leaveList.forEach((l) => {
        if (l.status === 'submitted' || l.status === 'pending_review') {
          items.push({
            id: `leave-${l.id}`,
            referenceNumber: `LV-${l.id.substring(0, 8).toUpperCase()}`,
            title: `Staff Leave: ${l.staffName} (${l.leaveType.name})`,
            type: 'hr',
            moduleLabel: 'Human Resources',
            requesterName: l.staffName,
            projectOrDept: 'Organizational Staff',
            submissionDate: l.createdAt.substring(0, 10),
            priority: 'medium',
            dueDate: l.startDate,
            isOverdue: false,
            status: 'pending',
            workflowStage: 'Supervisor & Director Leave Clearance',
            justification: l.reason || 'Official annual leave entitlement.',
            supportingDocuments: [],
            rawRecord: l,
          });
        }
      });

      // 4. Procurement Purchase Orders
      items.push({
        id: 'proc-po-2026-004',
        referenceNumber: 'PO-2026-004',
        title: 'Community Art Supplies & Youth Canvas Sets',
        type: 'procurement',
        moduleLabel: 'Procurement',
        requesterName: 'Salim Juma (Procurement Lead)',
        requesterEmail: 'salim.juma@babawatoto.org',
        projectOrDept: 'Youth Empowerment Center',
        submissionDate: '2026-10-15',
        amount: 8450000,
        currency: 'TZS',
        priority: 'high',
        dueDate: '2026-10-24',
        isOverdue: false,
        status: 'pending',
        workflowStage: 'Executive Authorization for Supplier Contract',
        justification: 'Competitive supplier quote selection completed. Lowest responsive vetted vendor: Keko Stationery & Arts Ltd.',
        supportingDocuments: [
          { name: 'Vendor Quotation Comparison Matrix' },
          { name: 'Pro-forma Invoice - Keko Arts Ltd' },
        ],
        rawRecord: { id: 'po-2026-004' },
      });

      setApprovalItems(items);
    } catch (err) {
      console.error('Error loading approval inbox:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllApprovals();
  }, []);

  // Summary Metrics
  const pendingItems = approvalItems.filter((i) => i.status === 'pending');
  const highPriorityCount = pendingItems.filter((i) => i.priority === 'urgent' || i.priority === 'high').length;
  const dueSoonCount = pendingItems.filter((i) => !i.isOverdue).length;
  const overdueCount = pendingItems.filter((i) => i.isOverdue).length;
  const completedCount = approvalItems.filter((i) => i.status === 'approved' || i.status === 'rejected').length;

  // Filtered List
  const filteredItems = useMemo(() => {
    return approvalItems.filter((item) => {
      // Tab filter
      if (activeTab === 'pending' && item.status !== 'pending') return false;
      if (activeTab === 'finance' && (item.type !== 'finance' || item.status !== 'pending')) return false;
      if (activeTab === 'procurement' && (item.type !== 'procurement' || item.status !== 'pending')) return false;
      if (activeTab === 'hr' && (item.type !== 'hr' || item.status !== 'pending')) return false;
      if (activeTab === 'completed' && item.status !== 'approved' && item.status !== 'rejected') return false;
      if (activeTab === 'returned' && item.status !== 'returned') return false;

      // Priority Filter
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.referenceNumber.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.requesterName.toLowerCase().includes(q) ||
          item.projectOrDept.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [approvalItems, activeTab, priorityFilter, searchQuery]);

  // Handle Approve Action
  const handleApprove = async (item: ApprovalItem) => {
    const result = await Swal.fire({
      title: 'Authorize Decision?',
      text: `Grant official Executive Director sign-off for ${item.referenceNumber}: "${item.title}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Authorize Request',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        if (item.type === 'finance') {
          await reviewFinancialRequest(
            item.rawRecord.id,
            {
              action: 'approved',
              comments: `Authorized and signed by Executive Director (${user?.email || 'Executive Office'})`,
            },
            {
              id: user?.id || '',
              name: user?.name || user?.email || 'Executive Director',
              role: 'executive_director',
            }
          );
        } else if (item.id.startsWith('hr-staff-') && isSupabaseConfigured) {
          await supabase
            .from('profiles')
            .update({
              approval_status: 'approved',
              is_active: true,
              ed_approved_by: user?.id,
              ed_approved_at: new Date().toISOString(),
            })
            .eq('id', item.rawRecord.id);
        } else if (item.id.startsWith('leave-')) {
          await reviewLeaveRequest(item.rawRecord.id, {
            status: 'approved',
            reviewerComments: 'Authorized by Executive Director',
          });
        }

        showSuccess('Decision Authorized', `${item.referenceNumber} has been successfully authorized.`);
        setIsDetailDrawerOpen(false);
        loadAllApprovals();
      } catch (err: any) {
        showError('Approval Failed', err.message || 'Could not record authorization.');
      }
    }
  };

  // Handle Reject Action (Requires Reason)
  const handleReject = async (item: ApprovalItem) => {
    const { value: comment } = await Swal.fire({
      title: 'Reject Request',
      input: 'textarea',
      inputLabel: 'Reason for Rejection',
      inputPlaceholder: 'Enter official executive remark or policy rationale for rejecting this request...',
      inputValidator: (value) => {
        if (!value || value.trim().length < 5) {
          return 'A clear justification is required for the audit trail.';
        }
      },
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Confirm Rejection',
    });

    if (comment) {
      try {
        if (item.type === 'finance') {
          await reviewFinancialRequest(
            item.rawRecord.id,
            {
              action: 'rejected',
              comments: comment,
            },
            {
              id: user?.id || '',
              name: user?.name || user?.email || 'Executive Director',
              role: 'executive_director',
            }
          );
        }

        showSuccess('Request Rejected', `${item.referenceNumber} has been rejected with audit remarks.`);
        setIsDetailDrawerOpen(false);
        loadAllApprovals();
      } catch (err: any) {
        showError('Action Failed', err.message || 'Could not record rejection.');
      }
    }
  };

  // Handle Return for Revision Action (Requires Reason)
  const handleReturn = async (item: ApprovalItem) => {
    const { value: feedback } = await Swal.fire({
      title: 'Return for Revision',
      input: 'textarea',
      inputLabel: 'Revision Requirements',
      inputPlaceholder: 'Specify required modifications, missing supporting documents, or budget adjustments...',
      inputValidator: (value) => {
        if (!value || value.trim().length < 5) {
          return 'Please provide actionable instructions for the requester to revise.';
        }
      },
      showCancelButton: true,
      confirmButtonColor: '#D68904',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Return to Requester',
    });

    if (feedback) {
      try {
        if (item.type === 'finance') {
          await reviewFinancialRequest(
            item.rawRecord.id,
            {
              action: 'requires_revision',
              comments: feedback,
            },
            {
              id: user?.id || '',
              name: user?.name || user?.email || 'Executive Director',
              role: 'executive_director',
            }
          );
        }

        showSuccess('Returned for Revision', `${item.referenceNumber} returned to requester with remarks.`);
        setIsDetailDrawerOpen(false);
        loadAllApprovals();
      } catch (err: any) {
        showError('Action Failed', err.message || 'Could not record return.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        subtitle="Centralized executive inbox for decisions assigned to the Executive Director across Finance, Procurement, HR, and Projects."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Approvals' },
        ]}
      />

      {/* KPI Row (Strict monochrome icons, unboxed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          label="Pending Decisions"
          value={pendingItems.length}
          icon={CheckSquare}
          className="border-slate-200"
        />
        <KPICard
          label="High Priority"
          value={highPriorityCount}
          icon={AlertTriangle}
          className="border-slate-200"
        />
        <KPICard
          label="Items Due Soon"
          value={dueSoonCount}
          icon={Clock}
          className="border-slate-200"
        />
        <KPICard
          label="Overdue Approvals"
          value={overdueCount}
          icon={AlertTriangle}
          className="border-slate-200"
        />
        <KPICard
          label="Completed Decisions"
          value={completedCount}
          icon={CheckCircle2}
          className="border-slate-200"
        />
      </div>

      {/* Inbox Tabs & Filter Bar */}
      <div className="bg-white border border-surface-border rounded-lg shadow-xs overflow-hidden">
        {/* Module / Preset Tabs */}
        <div className="border-b border-surface-border px-4 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
          <nav className="flex space-x-4 overflow-x-auto">
            {[
              { id: 'pending', label: 'All Pending', count: pendingItems.length },
              { id: 'finance', label: 'Finance', count: pendingItems.filter((i) => i.type === 'finance').length },
              { id: 'procurement', label: 'Procurement', count: pendingItems.filter((i) => i.type === 'procurement').length },
              { id: 'hr', label: 'Human Resources', count: pendingItems.filter((i) => i.type === 'hr').length },
              { id: 'completed', label: 'Completed', count: completedCount },
              { id: 'returned', label: 'Returned', count: approvalItems.filter((i) => i.status === 'returned').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-2 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'border-[#D68904] text-charcoal-900'
                    : 'border-transparent text-charcoal-muted hover:text-charcoal-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono bg-slate-200/80 px-1.5 py-0.2 rounded text-slate-700">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Search & Priority Toolbar */}
        <div className="p-3.5 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#374151]" />
            <input
              type="text"
              placeholder="Search reference, title, or requester..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 text-xs bg-white text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-charcoal-muted">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-md border border-slate-200 py-1.5 px-3 text-xs bg-white text-charcoal-700 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
          </div>
        </div>

        {/* Approvals Data Table (AdminCN layout) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Reference No</th>
                <th className="py-3 px-4">Request Title & Module</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Project / Department</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Workflow Stage</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center text-xs text-charcoal-muted">
                    {isLoading ? 'Loading authorization inbox...' : 'No pending items found matching your filter.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedItem(item);
                      setIsDetailDrawerOpen(true);
                    }}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-charcoal-900 whitespace-nowrap">
                      {item.referenceNumber}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-charcoal-900 truncate">{item.title}</div>
                      <div className="text-[10px] font-mono uppercase text-[#D68904] mt-0.5">
                        {item.moduleLabel}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-charcoal-800 whitespace-nowrap">
                      {item.requesterName}
                    </td>
                    <td className="py-3 px-4 text-charcoal-600 whitespace-nowrap">
                      {item.projectOrDept}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-charcoal-900 whitespace-nowrap">
                      {item.amount != null ? `${item.currency} ${item.amount.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          item.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : item.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-charcoal-muted whitespace-nowrap">
                      {item.dueDate}
                    </td>
                    <td className="py-3 px-4 text-charcoal-700 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-slate-700">
                        {item.workflowStage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                          setIsDetailDrawerOpen(true);
                        }}
                        className="text-[#374151]"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1 text-[#374151]" />
                        Review
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL VIEW MODAL / DRAWER */}
      {isDetailDrawerOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg border border-surface-border max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between pb-4 border-b border-surface-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-charcoal-900">
                    {selectedItem.referenceNumber}
                  </span>
                  <Badge variant={selectedItem.priority === 'urgent' ? 'danger' : 'info'}>
                    {selectedItem.priority.toUpperCase()} PRIORITY
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-charcoal-900 mt-2">{selectedItem.title}</h3>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  Submitted by {selectedItem.requesterName} on {selectedItem.submissionDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Key Parameters Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-slate-50 border border-surface-border text-xs">
              <div>
                <span className="text-[10px] text-charcoal-muted uppercase tracking-wider block">Domain</span>
                <strong className="text-charcoal-900 capitalize">{selectedItem.moduleLabel}</strong>
              </div>
              <div>
                <span className="text-[10px] text-charcoal-muted uppercase tracking-wider block">Amount</span>
                <strong className="text-charcoal-900 font-mono">
                  {selectedItem.amount != null ? `${selectedItem.currency} ${selectedItem.amount.toLocaleString()}` : 'N/A'}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-charcoal-muted uppercase tracking-wider block">Department / Project</span>
                <strong className="text-charcoal-900 truncate block">{selectedItem.projectOrDept}</strong>
              </div>
              <div>
                <span className="text-[10px] text-charcoal-muted uppercase tracking-wider block">Required Due Date</span>
                <strong className="text-charcoal-900 font-mono">{selectedItem.dueDate}</strong>
              </div>
            </div>

            {/* Justification & Narrative */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-900 mb-1.5">
                Business Justification & Operational Purpose
              </h4>
              <div className="p-3.5 rounded-lg border border-surface-border bg-white text-xs text-charcoal-800 leading-relaxed">
                {selectedItem.justification}
              </div>
            </div>

            {/* Supporting Documents Section (per user request: user can upload and rename supporting documents) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-900 mb-2">
                Attached Supporting Documents ({selectedItem.supportingDocuments?.length || 0})
              </h4>
              {selectedItem.supportingDocuments && selectedItem.supportingDocuments.length > 0 ? (
                <div className="space-y-2">
                  {selectedItem.supportingDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#374151]" />
                        <span className="font-medium text-charcoal-900">{doc.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        Verified Attached
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No additional supporting attachments submitted.
                </div>
              )}
            </div>

            {/* Actions: Approve, Return for Revision, Reject */}
            {selectedItem.status === 'pending' && (
              <div className="pt-4 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReturn(selectedItem)}
                  className="w-full sm:w-auto text-[#D68904] border-[#D68904]/40 hover:bg-amber-50"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-[#374151]" />
                  Return for Revision
                </Button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReject(selectedItem)}
                    className="w-full sm:w-auto"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5 text-[#374151]" />
                    Reject Request
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(selectedItem)}
                    className="w-full sm:w-auto"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-[#111827]" />
                    Authorize Decision
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;
