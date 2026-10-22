import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Layers,
  BarChart3,
  Activity,
  ArrowRight,
  TrendingUp,
  MapPin,
  FileCheck,
  Receipt,
  Sparkles,
  Download,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { useAuth } from '@/features/auth/useAuth';
import { getRequisitions, reviewFinancialRequest } from '@/features/finance/services/financeService';
import { getLeaveRequests, reviewLeaveRequest } from '@/features/hr/services/hrService';
import {
  getProjects,
  approveProject,
  rejectProject,
  getAllActivities,
  authorizeActivityRequest,
  approveActivityRetirement,
} from '@/features/projects/services/projectService';
import { ProjectRecord, ActivityRecord, ProjectStatus } from '@/features/projects/types/project';
import { ActivityLifecycleWorkspaceModal } from '@/features/projects/components/ActivityLifecycleWorkspaceModal';
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

export type ExecutiveViewMode = 'inbox' | 'portfolio' | 'activities' | 'metrics';

export const ApprovalsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, roles, hasRole, isAdmin } = useAuth();

  // Mode switcher: Inbox, All Projects Portfolio, Cross-Project Field Activities, Executive M&E Dashboard
  const initialMode = (searchParams.get('mode') as ExecutiveViewMode) || 'inbox';
  const initialTab = searchParams.get('tab') || 'pending';

  const [viewMode, setViewMode] = useState<ExecutiveViewMode>(initialMode);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Approval items list
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // All Organizational Projects
  const [allProjects, setAllProjects] = useState<ProjectRecord[]>([]);
  const [projectFilterStatus, setProjectFilterStatus] = useState<string>('all');

  // Cross-Project Activities Monitor
  const [allActivities, setAllActivities] = useState<ActivityRecord[]>([]);
  const [activityProjectFilter, setActivityProjectFilter] = useState<string>('all');
  const [activityReqFilter, setActivityReqFilter] = useState<string>('all');
  const [activityImplFilter, setActivityImplFilter] = useState<string>('all');
  const [activityMeFilter, setActivityMeFilter] = useState<string>('all');
  const [activityRetFilter, setActivityRetFilter] = useState<string>('all');

  // Lifecycle workspace modal
  const [selectedActivityForLifecycle, setSelectedActivityForLifecycle] = useState<ActivityRecord | null>(null);
  const [isLifecycleModalOpen, setIsLifecycleModalOpen] = useState(false);

  const isExecutiveDirector = hasRole('executive_director') || isAdmin() || roles.includes('system_admin');

  // Load all data across approvals, projects, and activities
  const loadAllApprovals = async () => {
    setIsLoading(true);
    try {
      const items: ApprovalItem[] = [];

      // 1. Projects pending approval (Planning or on_hold charters)
      const fetchedProjects = await getProjects();
      setAllProjects(fetchedProjects);

      // Fetch real attached documents from entity_supporting_documents
      const { data: realDocs } = await supabase
        .from('entity_supporting_documents')
        .select('*')
        .eq('entity_type', 'project');

      const docsByProjectId: Record<string, any[]> = {};
      (realDocs || []).forEach((d) => {
        if (!docsByProjectId[d.entity_id]) docsByProjectId[d.entity_id] = [];
        docsByProjectId[d.entity_id].push({
          id: d.id,
          name: d.custom_name || d.original_name,
          originalName: d.original_name,
          tag: d.document_tag,
          storagePath: d.storage_path,
          size: d.file_size,
        });
      });

      fetchedProjects.forEach((proj) => {
        if (proj.status === 'planning') {
          items.push({
            id: `proj-${proj.id}`,
            referenceNumber: proj.projectCode || `PRJ-${proj.id.substring(0, 8).toUpperCase()}`,
            title: `Project Charter: ${proj.name}`,
            type: 'project',
            moduleLabel: 'Project Governance',
            requesterName:
              (proj.members || []).find((m) => m.projectRole === 'manager')?.userName ||
              'Project Manager',
            requesterEmail: 'pm@babawatoto.org',
            projectOrDept: proj.name,
            submissionDate: proj.createdAt ? proj.createdAt.substring(0, 10) : '2026-10-18',
            amount: proj.totalBudget,
            currency: proj.currency || 'TZS',
            priority: 'urgent',
            dueDate: proj.startDate || '2026-11-01',
            isOverdue: false,
            status: 'pending',
            workflowStage: 'Executive Director Charter Sign-Off (Activation Gate)',
            justification:
              proj.description ||
              `Donor: ${proj.funder}. Total Budget: ${proj.currency || 'TZS'} ${(proj.totalBudget || 0).toLocaleString()}. Requires Executive Director authorization to activate workplans, procurement, and expenditure drawdowns.`,
            supportingDocuments: docsByProjectId[proj.id] || [],
            rawRecord: proj,
          });
        }
      });

      // 2. Field Activities pending Authorization or Financial Retirement
      const fetchedActivities = await getAllActivities();
      setAllActivities(fetchedActivities);

      fetchedActivities.forEach((act) => {
        // Stage 1: Submitted Pre-implementation ToR
        if (act.requestStatus === 'submitted' || act.submissionStatus === 'submitted') {
          items.push({
            id: `act-req-${act.id}`,
            referenceNumber: act.activityCode || `ACT-${act.id.substring(0, 8).toUpperCase()}`,
            title: `Activity Pre-Implementation ToR: ${act.title}`,
            type: 'project',
            moduleLabel: 'Field Operations',
            requesterName: act.assignedStaffName || act.submittedByName || 'Activity Officer',
            projectOrDept: act.projectName || 'Project Activity',
            submissionDate: act.requestedDate || (act.createdAt ? act.createdAt.substring(0, 10) : '2026-10-19'),
            amount: act.budgetEstimated,
            currency: 'TZS',
            priority: 'high',
            dueDate: act.activityDate,
            isOverdue: false,
            status: 'pending',
            workflowStage: 'Stage 1: ToR & Activity Budget Authorization Gate',
            justification:
              act.requestDescription ||
              act.description ||
              'Terms of Reference, procurement requirements, and operational budget submitted for executive sign-off prior to field implementation.',
            supportingDocuments: [
              { name: 'Activity Terms of Reference (ToR)' },
              { name: 'Target Beneficiaries & Location Plan' },
            ],
            rawRecord: act,
          });
        }

        // Stage 5: Financial Retirement under review
        if (act.retirementStatus === 'submitted' || act.retirementStatus === 'finance_review') {
          items.push({
            id: `act-ret-${act.id}`,
            referenceNumber: `RET-${act.activityCode || act.id.substring(0, 8).toUpperCase()}`,
            title: `Activity Financial Retirement: ${act.title}`,
            type: 'finance',
            moduleLabel: 'Financial Retirement',
            requesterName: act.assignedStaffName || act.submittedByName || 'Activity Lead',
            projectOrDept: act.projectName || 'Project Activity',
            submissionDate: act.retiredAt ? act.retiredAt.substring(0, 10) : '2026-10-19',
            amount: act.retiredAmount || act.budgetEstimated,
            currency: 'TZS',
            priority: 'medium',
            dueDate: act.activityDate,
            isOverdue: false,
            status: 'pending',
            workflowStage: 'Stage 5: Activity Financial Expense Retirement Clearance',
            justification: `Total claimed: TZS ${(act.retiredAmount || 0).toLocaleString()} across ${act.retirementReceiptsCount || 0} verified receipts. Net variance: TZS ${(act.retirementVariance || 0).toLocaleString()}.`,
            supportingDocuments: [
              { name: 'Expense Invoices & EFD Fiscal Receipts' },
              { name: 'Retirement Summary Schedule' },
            ],
            rawRecord: act,
          });
        }
      });

      // 3. Financial Requisitions
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

      // 4. Staff HR Approvals (Pending Executive Director Authorization)
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

      // 5. Leave Requests requiring Executive Director decision
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

      // 6. Procurement Purchase Orders
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
      console.error('Error loading executive approval data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllApprovals();
  }, []);

  // Summary Metrics for Decisions
  const pendingItems = approvalItems.filter((i) => i.status === 'pending');
  const pendingProjectsCount = pendingItems.filter((i) => i.id.startsWith('proj-')).length;
  const pendingActivitiesCount = pendingItems.filter((i) => i.id.startsWith('act-')).length;
  const highPriorityCount = pendingItems.filter((i) => i.priority === 'urgent' || i.priority === 'high').length;
  const dueSoonCount = pendingItems.filter((i) => !i.isOverdue).length;
  const overdueCount = pendingItems.filter((i) => i.isOverdue).length;
  const completedCount = approvalItems.filter((i) => i.status === 'approved' || i.status === 'rejected').length;

  // Filtered List for Inbox Table
  const filteredItems = useMemo(() => {
    return approvalItems.filter((item) => {
      // Tab filter
      if (activeTab === 'pending' && item.status !== 'pending') return false;
      if (activeTab === 'projects' && (!item.id.startsWith('proj-') || item.status !== 'pending')) return false;
      if (activeTab === 'activities' && (!item.id.startsWith('act-') || item.status !== 'pending')) return false;
      if (activeTab === 'finance' && (item.type !== 'finance' || item.status !== 'pending' || item.id.startsWith('act-ret-'))) return false;
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

  // Filtered Cross-Project Activities
  const filteredActivities = useMemo(() => {
    return allActivities.filter((act) => {
      if (activityProjectFilter !== 'all' && act.projectId !== activityProjectFilter) return false;
      if (activityReqFilter !== 'all' && act.requestStatus !== activityReqFilter) return false;
      if (activityImplFilter !== 'all' && act.implementationStatus !== activityImplFilter) return false;
      if (activityMeFilter !== 'all' && act.meStatus !== activityMeFilter) return false;
      if (activityRetFilter !== 'all' && act.retirementStatus !== activityRetFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          act.title.toLowerCase().includes(q) ||
          (act.activityCode && act.activityCode.toLowerCase().includes(q)) ||
          (act.projectName && act.projectName.toLowerCase().includes(q)) ||
          (act.location && act.location.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allActivities, activityProjectFilter, activityReqFilter, activityImplFilter, activityMeFilter, activityRetFilter, searchQuery]);

  // Filtered Projects for Portfolio Directory
  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      if (projectFilterStatus !== 'all' && p.status !== projectFilterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.projectCode.toLowerCase().includes(q) ||
          p.funder.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allProjects, projectFilterStatus, searchQuery]);

  // Executive High-Level Analytics Aggregate
  const executiveMetrics = useMemo(() => {
    const totalProjects = allProjects.length;
    const activeProjects = allProjects.filter((p) => p.status === 'active').length;
    const planningProjects = allProjects.filter((p) => p.status === 'planning').length;
    const totalBudget = allProjects.reduce((acc, p) => acc + (p.totalBudget || 0), 0);

    const totalActivities = allActivities.length;
    const completedActivities = allActivities.filter((a) => a.implementationStatus === 'completed').length;
    const verifiedActivities = allActivities.filter((a) => a.meStatus === 'verified').length;
    const totalRetiredExpenses = allActivities.reduce((acc, a) => acc + (a.retiredAmount || 0), 0);
    const totalParticipants = allActivities.reduce((acc, a) => acc + (a.participantsCount || 0), 0);
    const targetParticipants = allActivities.reduce((acc, a) => acc + (a.targetParticipants || 0), 0);

    return {
      totalProjects,
      activeProjects,
      planningProjects,
      totalBudget,
      totalActivities,
      completedActivities,
      verifiedActivities,
      totalRetiredExpenses,
      totalParticipants,
      targetParticipants,
    };
  }, [allProjects, allActivities]);

  // Handle Approve Action
  const handleApprove = async (item: ApprovalItem) => {
    const isProject = item.id.startsWith('proj-');
    const isActReq = item.id.startsWith('act-req-');
    const isActRet = item.id.startsWith('act-ret-');

    const result = await Swal.fire({
      title: isProject ? 'Authorize Project Charter?' : isActReq ? 'Authorize Activity ToR?' : 'Authorize Request?',
      text: isProject
        ? `Formally authorize project charter "${item.title}"? This will transition status to Active, unlock activity workplans, and enable budget drawdown.`
        : `Grant official Executive Director sign-off for ${item.referenceNumber}: "${item.title}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: isProject ? 'Yes, Activate Project Charter' : 'Yes, Authorize Request',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        if (isProject) {
          await approveProject(
            item.rawRecord.id,
            { id: user?.id || '', name: user?.name || user?.email || 'Executive Director' },
            'Formally authorized and signed by Executive Director'
          );
        } else if (isActReq) {
          await authorizeActivityRequest(
            item.rawRecord.id,
            'approved',
            'Authorized by Executive Director',
            user?.id || ''
          );
        } else if (isActRet) {
          await approveActivityRetirement(
            item.rawRecord.id,
            'approved',
            user?.id || ''
          );
        } else if (item.type === 'finance') {
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

        showSuccess(
          isProject ? 'Project Charter Activated' : 'Decision Authorized',
          `${item.referenceNumber} has been successfully authorized.`
        );
        setIsDetailDrawerOpen(false);
        loadAllApprovals();
      } catch (err: any) {
        showError('Approval Failed', err.message || 'Could not record authorization.');
      }
    }
  };

  // Handle Reject Action (Requires Reason)
  const handleReject = async (item: ApprovalItem) => {
    const isProject = item.id.startsWith('proj-');
    const isActReq = item.id.startsWith('act-req-');
    const isActRet = item.id.startsWith('act-ret-');

    const { value: comment } = await Swal.fire({
      title: isProject ? 'Reject Project Charter' : 'Reject Request',
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
        if (isProject) {
          await rejectProject(
            item.rawRecord.id,
            { id: user?.id || '', name: user?.name || user?.email || 'Executive Director' },
            comment
          );
        } else if (isActReq) {
          await authorizeActivityRequest(
            item.rawRecord.id,
            'rejected',
            comment,
            user?.id || ''
          );
        } else if (isActRet) {
          await approveActivityRetirement(
            item.rawRecord.id,
            'returned',
            user?.id || ''
          );
        } else if (item.type === 'finance') {
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
        } else if (item.id.startsWith('hr-staff-') && isSupabaseConfigured) {
          await supabase
            .from('profiles')
            .update({
              approval_status: 'rejected',
              is_active: false,
              ed_approval_notes: comment,
              ed_approved_by: user?.id,
              ed_approved_at: new Date().toISOString(),
            })
            .eq('id', item.rawRecord.id);
        } else if (item.id.startsWith('leave-')) {
          await reviewLeaveRequest(item.rawRecord.id, {
            status: 'rejected',
            reviewerComments: comment,
          });
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
    const isProject = item.id.startsWith('proj-');
    const isActReq = item.id.startsWith('act-req-');
    const isActRet = item.id.startsWith('act-ret-');

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
        if (isProject) {
          await rejectProject(
            item.rawRecord.id,
            { id: user?.id || '', name: user?.name || user?.email || 'Executive Director' },
            feedback
          );
        } else if (isActReq) {
          await authorizeActivityRequest(
            item.rawRecord.id,
            'rejected',
            feedback,
            user?.id || ''
          );
        } else if (isActRet) {
          await approveActivityRetirement(
            item.rawRecord.id,
            'returned',
            user?.id || ''
          );
        } else if (item.type === 'finance') {
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
        } else if (item.id.startsWith('hr-staff-') && isSupabaseConfigured) {
          await supabase
            .from('profiles')
            .update({
              approval_status: 'returned_for_revision',
              is_active: false,
              ed_approval_notes: feedback,
              ed_approved_by: user?.id,
              ed_approved_at: new Date().toISOString(),
            })
            .eq('id', item.rawRecord.id);
        } else if (item.id.startsWith('leave-')) {
          await reviewLeaveRequest(item.rawRecord.id, {
            status: 'rejected',
            reviewerComments: feedback,
          });
        }

        showSuccess('Returned for Revision', `${item.referenceNumber} returned to requester with remarks.`);
        setIsDetailDrawerOpen(false);
        loadAllApprovals();
      } catch (err: any) {
        showError('Action Failed', err.message || 'Could not record return.');
      }
    }
  };

  const handleViewDocument = async (doc: any) => {
    if (!doc.storagePath) {
      Swal.fire({
        title: doc.name,
        text: `Attached file "${doc.originalName || doc.name}" is recorded in project governance records.`,
        icon: 'info',
      });
      return;
    }
    const { data } = supabase.storage.from('documents').getPublicUrl(doc.storagePath);
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    if (!doc.storagePath) {
      Swal.fire({
        title: 'Document Record',
        text: `Attachment "${doc.originalName || doc.name}" is archived in project charter records.`,
        icon: 'info',
      });
      return;
    }
    try {
      const { data, error } = await supabase.storage.from('documents').download(doc.storagePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName || doc.name || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showError('Download Failed', err.message || 'Could not download the requested file.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Approvals & Oversight Hub"
        subtitle="Centralized governance dashboard for the Executive Director. Authorize project charters, cross-cutting workflows, field activities, and monitor organizational M&E performance."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Executive Approvals & Governance' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/projects')}
              className="flex items-center gap-1.5"
            >
              <Briefcase className="w-4 h-4 text-gray-700" />
              <span>Project Register</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/projects/new')}
              className="flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>Register New Project</span>
            </Button>
          </div>
        }
      />

      {/* Top Executive Mode Switcher Tabs */}
      <div className="bg-white border border-surface-border rounded-lg shadow-2xs overflow-hidden">
        <div className="flex border-b border-surface-border bg-slate-50/70 overflow-x-auto">
          {[
            {
              id: 'inbox',
              label: 'Approvals & Decision Inbox',
              count: pendingItems.length,
              icon: CheckSquare,
              badgeClass: pendingItems.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700',
            },
            {
              id: 'portfolio',
              label: 'All Projects Portfolio',
              count: allProjects.length,
              icon: Briefcase,
              badgeClass: pendingProjectsCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700',
            },
            {
              id: 'activities',
              label: 'Cross-Project Field Activities Monitor',
              count: allActivities.length,
              icon: Activity,
              badgeClass: pendingActivitiesCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700',
            },
            {
              id: 'metrics',
              label: 'Executive M&E & KPIs Dashboard',
              count: null,
              icon: BarChart3,
              badgeClass: 'bg-emerald-100 text-emerald-800',
            },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setViewMode(mode.id as ExecutiveViewMode);
                  setSearchParams({ mode: mode.id, tab: activeTab });
                }}
                className={`py-2.5 px-4 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2 rounded-md ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
                <span>{mode.label}</span>
                {mode.count !== null && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${mode.badgeClass}`}>
                    {mode.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MODE 1: CENTRAL APPROVALS INBOX */}
      {viewMode === 'inbox' && (
        <div className="space-y-6">
          {/* Executive Attention Callout for Pending Project Charters */}
          {pendingProjectsCount > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-200/80 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-amber-900" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    {pendingProjectsCount} Project Charter{pendingProjectsCount > 1 ? 's' : ''} Awaiting Executive Director Sign-off
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Projects created in planning status require your formal authorization before team members can execute workplans or draw funds.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setActiveTab('projects')}
                className="whitespace-nowrap"
              >
                Review Project Charters
              </Button>
            </div>
          )}

          {/* KPI Row (Strict monochrome icons, unboxed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard
              label="Pending Decisions"
              value={pendingItems.length}
              icon={CheckSquare}
              className="border-slate-200"
            />
            <KPICard
              label="Project Charters"
              value={pendingProjectsCount}
              icon={Briefcase}
              className="border-slate-200"
            />
            <KPICard
              label="Field Activity Sign-offs"
              value={pendingActivitiesCount}
              icon={Activity}
              className="border-slate-200"
            />
            <KPICard
              label="High Priority / Urgent"
              value={highPriorityCount}
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
            {/* Module Tabs */}
            <div className="border-b border-surface-border px-4 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
              <nav className="flex space-x-4 overflow-x-auto">
                {[
                  { id: 'pending', label: 'All Pending', count: pendingItems.length },
                  { id: 'projects', label: 'Projects & Charters', count: pendingProjectsCount },
                  { id: 'activities', label: 'Field Activities & ToR', count: pendingActivitiesCount },
                  { id: 'finance', label: 'Requisitions', count: pendingItems.filter((i) => i.type === 'finance' && !i.id.startsWith('act-ret-')).length },
                  { id: 'procurement', label: 'Procurement', count: pendingItems.filter((i) => i.type === 'procurement').length },
                  { id: 'hr', label: 'HR & Clearances', count: pendingItems.filter((i) => i.type === 'hr').length },
                  { id: 'completed', label: 'Completed', count: completedCount },
                  { id: 'returned', label: 'Returned', count: approvalItems.filter((i) => i.status === 'returned').length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-1.5 px-3 text-xs rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'bg-slate-200 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="text-[10px] font-mono bg-white/80 px-1.5 py-0.2 rounded text-slate-700 border border-slate-200 font-bold">
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
                  placeholder="Search reference, title, project, or requester..."
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

            {/* Approvals Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-surface-border">
                  <tr>
                    <th className="py-3 px-4">Reference No</th>
                    <th className="py-3 px-4">Request Title & Module</th>
                    <th className="py-3 px-4">Requester / Manager</th>
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
                          if (item.type === 'project' && item.id.startsWith('proj-')) {
                            navigate(`/projects/${item.rawRecord.id}`);
                          } else {
                            setSelectedItem(item);
                            setIsDetailDrawerOpen(true);
                          }
                        }}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-charcoal-900 whitespace-nowrap">
                          {item.referenceNumber}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-charcoal-900 truncate">{item.title}</div>
                          <div className="text-[10px] font-mono uppercase text-slate-500 mt-0.5">
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
                          {item.amount != null ? `${item.currency || 'TZS'} ${item.amount.toLocaleString()}` : '—'}
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
                          {item.type === 'project' && item.id.startsWith('proj-') ? (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/projects/${item.rawRecord.id}`);
                              }}
                              className="text-slate-800 border-slate-300 hover:bg-slate-100"
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1 text-slate-700" />
                              Open Workspace
                            </Button>
                          ) : (
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
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: ALL PROJECTS PORTFOLIO DIRECTORY */}
      {viewMode === 'portfolio' && (
        <div className="space-y-6">
          {/* Portfolio Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Total Projects in Portfolio"
              value={executiveMetrics.totalProjects}
              icon={Briefcase}
              className="border-slate-200"
            />
            <KPICard
              label="Active Implementations"
              value={executiveMetrics.activeProjects}
              icon={TrendingUp}
              className="border-slate-200"
            />
            <KPICard
              label="Pending Charter Sign-off"
              value={executiveMetrics.planningProjects}
              icon={ShieldCheck}
              className="border-slate-200"
            />
            <KPICard
              label="Total Approved Funding"
              value={`TZS ${(executiveMetrics.totalBudget / 1_000_000).toFixed(1)}M`}
              icon={Wallet}
              className="border-slate-200"
            />
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 border border-surface-border rounded-lg shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects by name, code, donor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 text-xs bg-white text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-charcoal-muted">Status:</span>
              <select
                value={projectFilterStatus}
                onChange={(e) => setProjectFilterStatus(e.target.value)}
                className="rounded-md border border-slate-200 py-1.5 px-3 text-xs bg-white text-charcoal-700 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="planning">Planning (Pending ED Approval)</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => {
              const isPlanning = project.status === 'planning';
              return (
                <Card
                  key={project.id}
                  className={`flex flex-col justify-between border ${
                    isPlanning ? 'border-amber-300 ring-1 ring-amber-300 bg-amber-50/20' : 'border-gray-200'
                  } hover:border-gray-400 transition-all shadow-xs hover:shadow-sm overflow-hidden bg-white`}
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                        {project.projectCode}
                      </span>
                      <StatusIndicator status={project.status} label={project.status} />
                    </div>

                    <div>
                      <h3
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="font-bold text-gray-900 text-base leading-snug hover:text-[#D68904] cursor-pointer line-clamp-2"
                      >
                        {project.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        <strong>Donor / Funder:</strong> {project.funder}
                      </p>
                    </div>

                    {project.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          {project.startDate} — {project.endDate}
                        </span>
                        <span className="font-semibold text-gray-900 font-mono">
                          {project.currency || 'TZS'} {(project.totalBudget || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-gray-500" />
                          {(project.members || []).length} Team Members
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-gray-500" />
                          {project.activityCount || 0} Activities
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer with Executive Direct Actions */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
                    {isPlanning ? (
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={async () => {
                          const conf = await Swal.fire({
                            title: 'Authorize Project Charter?',
                            text: `Grant Executive Director sign-off to activate "${project.name}" (${project.projectCode})?`,
                            icon: 'question',
                            showCancelButton: true,
                            confirmButtonColor: '#10b981',
                            confirmButtonText: 'Yes, Activate Charter',
                          });
                          if (conf.isConfirmed) {
                            try {
                              await approveProject(
                                project.id,
                                { id: user?.id || '', name: user?.name || user?.email || 'Executive Director' },
                                'Authorized by Executive Director'
                              );
                              showSuccess('Charter Activated', `${project.name} is now Active.`);
                              loadAllApprovals();
                            } catch (e: any) {
                              showError('Failed', e.message);
                            }
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Authorize Charter</span>
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-500 truncate">
                        {(project.members || []).find((m) => m.projectRole === 'manager')?.userName || 'Project Manager'}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => navigate(`/projects/${project.id}/engine`)}
                        className="text-gray-700 hover:text-[#D68904] text-xs font-semibold p-0 h-auto"
                      >
                        <BarChart3 className="w-3.5 h-3.5 mr-1" />
                        M&amp;E
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="text-gray-900 hover:text-[#D68904] text-xs font-semibold flex items-center gap-1 p-0 h-auto"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 3: CROSS-PROJECT FIELD ACTIVITIES MONITOR */}
      {viewMode === 'activities' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Total Field Activities"
              value={executiveMetrics.totalActivities}
              icon={Activity}
              className="border-slate-200"
            />
            <KPICard
              label="Field Completed"
              value={executiveMetrics.completedActivities}
              icon={CheckCircle2}
              className="border-slate-200"
            />
            <KPICard
              label="M&E Verified"
              value={executiveMetrics.verifiedActivities}
              icon={FileCheck}
              className="border-slate-200"
            />
            <KPICard
              label="Expenses Retired"
              value={`TZS ${(executiveMetrics.totalRetiredExpenses / 1_000_000).toFixed(1)}M`}
              icon={Receipt}
              className="border-slate-200"
            />
          </div>

          {/* Decoupled Statuses Multi-Filter Bar */}
          <div className="bg-white p-4 border border-surface-border rounded-lg shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities by code, title, project, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 text-xs bg-white text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs text-charcoal-muted">Project:</span>
                <select
                  value={activityProjectFilter}
                  onChange={(e) => setActivityProjectFilter(e.target.value)}
                  className="rounded-md border border-slate-200 py-1.5 px-3 text-xs bg-white text-charcoal-700 focus:outline-none max-w-xs"
                >
                  <option value="all">All Projects</option>
                  {allProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lifecycle Stages Sub-filters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">ToR Request</label>
                <select
                  value={activityReqFilter}
                  onChange={(e) => setActivityReqFilter(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1 px-2 text-xs"
                >
                  <option value="all">All Requests</option>
                  <option value="submitted">Submitted (Pending ED)</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Implementation</label>
                <select
                  value={activityImplFilter}
                  onChange={(e) => setActivityImplFilter(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1 px-2 text-xs"
                >
                  <option value="all">All Implementation</option>
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">M&amp;E Verification</label>
                <select
                  value={activityMeFilter}
                  onChange={(e) => setActivityMeFilter(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1 px-2 text-xs"
                >
                  <option value="all">All M&amp;E States</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="verified">Verified</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Financial Retirement</label>
                <select
                  value={activityRetFilter}
                  onChange={(e) => setActivityRetFilter(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1 px-2 text-xs"
                >
                  <option value="all">All Retirements</option>
                  <option value="finance_review">Finance Review (Pending)</option>
                  <option value="approved">Approved</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
            </div>
          </div>

          {/* Activities Table */}
          <div className="bg-white border border-surface-border rounded-lg shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Activity Code &amp; Title</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Date &amp; Ward</th>
                  <th className="py-3 px-4">Officer</th>
                  <th className="py-3 px-4">ToR Request</th>
                  <th className="py-3 px-4">Implementation</th>
                  <th className="py-3 px-4">M&amp;E State</th>
                  <th className="py-3 px-4">Retirement</th>
                  <th className="py-3 px-4 text-right">Budget</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-xs text-charcoal-muted">
                      No activities found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-mono text-[10px] text-gray-500 font-bold">{act.activityCode || 'ACT-BAOMS'}</div>
                        <div className="font-semibold text-charcoal-900 truncate">{act.title}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-charcoal-700">
                        {act.projectCode ? (
                          <span className="font-mono font-medium">{act.projectCode}</span>
                        ) : (
                          act.projectName || '—'
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-charcoal-600">
                        <div>{act.activityDate}</div>
                        <div className="text-[10px] text-slate-400">{act.location || act.wardLocation || 'Field'}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-charcoal-700">
                        {act.assignedStaffName || act.submittedByName || 'Staff Member'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            act.requestStatus === 'approved'
                              ? 'success'
                              : act.requestStatus === 'submitted'
                              ? 'warning'
                              : act.requestStatus === 'rejected'
                              ? 'danger'
                              : 'default'
                          }
                        >
                          {act.requestStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            act.implementationStatus === 'completed'
                              ? 'success'
                              : act.implementationStatus === 'in_progress'
                              ? 'info'
                              : 'default'
                          }
                        >
                          {act.implementationStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            act.meStatus === 'verified'
                              ? 'success'
                              : act.meStatus === 'submitted'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {act.meStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            act.retirementStatus === 'approved'
                              ? 'success'
                              : act.retirementStatus === 'finance_review'
                              ? 'warning'
                              : act.retirementStatus === 'returned'
                              ? 'danger'
                              : 'default'
                          }
                        >
                          {act.retirementStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-charcoal-900 whitespace-nowrap">
                        TZS {(act.budgetEstimated || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setSelectedActivityForLifecycle(act);
                            setIsLifecycleModalOpen(true);
                          }}
                          className="text-[#374151]"
                        >
                          <Layers className="h-3.5 w-3.5 mr-1" />
                          Lifecycle
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE 4: EXECUTIVE M&E & KPIS DASHBOARD */}
      {viewMode === 'metrics' && (
        <div className="space-y-6">
          {/* High-level Scorecard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border border-slate-200 shadow-sm">
              <span className="text-xs uppercase font-bold text-slate-500">Portfolio Investment</span>
              <div className="text-2xl font-bold font-mono text-gray-900 mt-2">
                TZS {(executiveMetrics.totalBudget / 1_000_000).toFixed(1)}M
              </div>
              <p className="text-xs text-slate-500 mt-1">Total approved grant funding</p>
            </Card>

            <Card className="p-5 bg-white border border-slate-200 shadow-sm">
              <span className="text-xs uppercase font-bold text-slate-500">Accounted Expenditure</span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
                TZS {(executiveMetrics.totalRetiredExpenses / 1_000_000).toFixed(1)}M
              </div>
              <p className="text-xs text-slate-500 mt-1">Formally retired via receipts</p>
            </Card>

            <Card className="p-5 bg-white border border-slate-200 shadow-sm">
              <span className="text-xs uppercase font-bold text-slate-500">Activity Completion Rate</span>
              <div className="text-2xl font-bold font-mono text-charcoal-900 mt-2">
                {executiveMetrics.totalActivities > 0
                  ? Math.round((executiveMetrics.completedActivities / executiveMetrics.totalActivities) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {executiveMetrics.completedActivities} of {executiveMetrics.totalActivities} completed in field
              </p>
            </Card>

            <Card className="p-5 bg-white border border-slate-200 shadow-sm">
              <span className="text-xs uppercase font-bold text-slate-500">M&E Verification Rate</span>
              <div className="text-2xl font-bold font-mono text-[#D68904] mt-2">
                {executiveMetrics.completedActivities > 0
                  ? Math.round((executiveMetrics.verifiedActivities / executiveMetrics.completedActivities) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {executiveMetrics.verifiedActivities} verified with attendance rosters
              </p>
            </Card>
          </div>

          {/* Activity Lifecycle Pipeline Distribution */}
          <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Organizational Field Lifecycle Pipeline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500">Stage 1: ToR Sign-off</span>
                <div className="text-xl font-bold font-mono mt-1 text-slate-800">
                  {allActivities.filter((a) => a.requestStatus === 'submitted').length}
                </div>
                <span className="text-[10px] text-amber-700 font-semibold">Pending Authorization</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500">Stage 2: Procurement</span>
                <div className="text-xl font-bold font-mono mt-1 text-slate-800">
                  {allActivities.filter((a) => a.procurementStatus && a.procurementStatus !== 'delivered' && a.procurementStatus !== 'not_required').length}
                </div>
                <span className="text-[10px] text-blue-700 font-semibold">In Supply Chain</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500">Stage 3: Field Execution</span>
                <div className="text-xl font-bold font-mono mt-1 text-slate-800">
                  {allActivities.filter((a) => a.implementationStatus === 'in_progress').length}
                </div>
                <span className="text-[10px] text-purple-700 font-semibold">Live in Communities</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500">Stage 4: M&amp;E Evidence</span>
                <div className="text-xl font-bold font-mono mt-1 text-slate-800">
                  {allActivities.filter((a) => a.meStatus === 'verified').length}
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold">Rosters &amp; Logs Verified</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500">Stage 5: Finance Clearance</span>
                <div className="text-xl font-bold font-mono mt-1 text-slate-800">
                  {allActivities.filter((a) => a.retirementStatus === 'approved').length}
                </div>
                <span className="text-[10px] text-teal-700 font-semibold">Expenses Fully Retired</span>
              </div>
            </div>
          </Card>

          {/* Project-by-Project Health & Delivery Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Project Performance &amp; Activity Delivery Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allProjects.map((proj) => {
                const projActs = allActivities.filter((a) => a.projectId === proj.id);
                const compCount = projActs.filter((a) => a.implementationStatus === 'completed').length;
                const pct = projActs.length > 0 ? Math.round((compCount / projActs.length) * 100) : 0;
                const retired = projActs.reduce((acc, a) => acc + (a.retiredAmount || 0), 0);

                return (
                  <Card key={proj.id} className="p-5 bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border">
                          {proj.projectCode}
                        </span>
                        <h4 className="text-base font-bold text-gray-900 mt-1">{proj.name}</h4>
                        <p className="text-xs text-slate-500">Donor: {proj.funder}</p>
                      </div>
                      <Badge variant={proj.status === 'active' ? 'success' : 'info'}>
                        {proj.status}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Activity Completion</span>
                        <span className="font-mono font-bold">{pct}% ({compCount}/{projActs.length})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Budget</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {proj.currency || 'TZS'} {(proj.totalBudget || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Retired Expense</span>
                        <span className="font-mono font-semibold text-emerald-700">
                          TZS {retired.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => navigate(`/projects/${proj.id}/engine`)}
                        className="text-gray-700 hover:text-[#D68904]"
                      >
                        <BarChart3 className="w-3.5 h-3.5 mr-1" />
                        Dynamic M&amp;E
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => navigate(`/projects/${proj.id}`)}
                      >
                        Workspace
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
                  {selectedItem.amount != null ? `${selectedItem.currency || 'TZS'} ${selectedItem.amount.toLocaleString()}` : 'N/A'}
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
                Executive Justification &amp; Operational Rationale
              </h4>
              <div className="p-3.5 rounded-lg border border-surface-border bg-white text-xs text-charcoal-800 leading-relaxed whitespace-pre-line">
                {selectedItem.justification}
              </div>
            </div>

            {/* Supporting Documents Section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-900 mb-2">
                Attached Supporting Governance Documents ({selectedItem.supportingDocuments?.length || 0})
              </h4>
              {selectedItem.supportingDocuments && selectedItem.supportingDocuments.length > 0 ? (
                <div className="space-y-2">
                  {selectedItem.supportingDocuments.map((doc: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-slate-100 rounded-md shrink-0">
                          <FileText className="h-4 w-4 text-slate-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-charcoal-900 truncate">{doc.name}</div>
                          <div className="text-[10px] text-charcoal-muted flex items-center gap-2">
                            {doc.originalName && doc.originalName !== doc.name && (
                              <span className="truncate">{doc.originalName}</span>
                            )}
                            {doc.tag && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded uppercase font-mono text-[9px] text-slate-600">
                                {doc.tag}
                              </span>
                            )}
                            {doc.size && <span>{(doc.size / 1024).toFixed(0)} KB</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleViewDocument(doc)}
                          className="h-7 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleDownloadDocument(doc)}
                          className="h-7 text-xs"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-slate-50/50">
                  No supporting governance documents attached to this project charter in the database.
                </div>
              )}
            </div>

            {/* Quick Link to Project Workspace or Activity Lifecycle */}
            {selectedItem.id.startsWith('proj-') && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
                <span>Want to inspect full project team, results framework, indicators, and budget breakdown?</span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    setIsDetailDrawerOpen(false);
                    navigate(`/projects/${selectedItem.rawRecord.id}`);
                  }}
                  className="border-blue-300 text-blue-800 hover:bg-blue-100"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Open Project Workspace
                </Button>
              </div>
            )}

            {selectedItem.id.startsWith('act-') && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between text-xs text-purple-900">
                <span>Inspect full 6-stage lifecycle (ToR, Procurement, Field, M&E Evidence, Financial Retirement)?</span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    setSelectedActivityForLifecycle(selectedItem.rawRecord);
                    setIsLifecycleModalOpen(true);
                  }}
                  className="border-purple-300 text-purple-800 hover:bg-purple-100"
                >
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  Open Full Lifecycle Workspace
                </Button>
              </div>
            )}

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
                    {selectedItem.id.startsWith('proj-') ? 'Authorize & Activate Charter' : 'Authorize Decision'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6-Stage Lifecycle Workspace Modal for Activities */}
      {isLifecycleModalOpen && selectedActivityForLifecycle && (
        <ActivityLifecycleWorkspaceModal
          isOpen={isLifecycleModalOpen}
          onClose={() => {
            setIsLifecycleModalOpen(false);
            setSelectedActivityForLifecycle(null);
          }}
          activity={selectedActivityForLifecycle}
          projectName={selectedActivityForLifecycle.projectName}
          currency="TZS"
          isManagerOrAbove={isExecutiveDirector}
          isFinanceOfficer={isExecutiveDirector}
          onActivityUpdated={async () => {
            await loadAllApprovals();
          }}
        />
      )}
    </div>
  );
};

export default ApprovalsPage;
