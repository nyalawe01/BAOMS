import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  Wallet,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Check,
  X,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { getProjects } from '@/features/projects/services/projectService';
import { ProjectRecord } from '@/features/projects/types/project';
import { getRequisitions, reviewFinancialRequest } from '@/features/finance/services/financeService';
import { FinancialRequestRecord } from '@/features/finance/types/finance';
import { getMeetingActions } from '@/features/correspondence/services/correspondenceService';
import { MeetingActionRecord } from '@/features/correspondence/types/correspondence';
import { useAuth } from '@/features/auth/useAuth';

export const ExecutiveDirectorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [requisitions, setRequisitions] = useState<FinancialRequestRecord[]>([]);
  const [actions, setActions] = useState<MeetingActionRecord[]>([]);

  const loadData = async () => {
    try {
      const [pList, rList, aList] = await Promise.all([
        getProjects(),
        getRequisitions(),
        getMeetingActions(),
      ]);
      setProjects(pList);
      setRequisitions(rList);
      setActions(aList);
    } catch (e) {
      console.error('Failed loading director telemetry:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Strategic approvals: items requiring Director authorization (Pending and amount >= 1,000,000 or status submitted/under_review)
  const pendingApprovals = requisitions.filter(
    (r) => r.status === 'submitted' || r.status === 'under_review'
  );

  const totalPortfolioBudget = projects.reduce((acc, p) => acc + p.totalBudget, 0);
  const activeProjectsCount = projects.filter((p) => p.status === 'active').length;
  const overdueActions = actions.filter((a) => a.isOverdue);

  const handleApprove = async (req: FinancialRequestRecord) => {
    const result = await Swal.fire({
      title: 'Approve Financial Requisition?',
      text: `Authorize disbursement of ${req.currency} ${req.totalAmount.toLocaleString()} for "${req.title}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Authorize Request',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await reviewFinancialRequest(
          req.id,
          {
            action: 'approved',
            comments: `Formally signed off by Executive Director (${user?.email || 'Executive Office'})`,
          },
          {
            id: user?.id || '00000000-0000-0000-0000-000000000002',
            name: 'Elisha N. Mwakipesile',
            role: 'executive_director',
          }
        );
        await Swal.fire({
          title: 'Authorized!',
          text: `Requisition ${req.requestNumber} has been approved for disbursement.`,
          icon: 'success',
          confirmButtonColor: '#D68904',
        });
        loadData();
      } catch (err: any) {
        Swal.fire({
          title: 'Approval Failed',
          text: err.message || 'Could not record approval.',
          icon: 'error',
          confirmButtonColor: '#D68904',
        });
      }
    }
  };

  const handleReject = async (req: FinancialRequestRecord) => {
    const { value: comment } = await Swal.fire({
      title: 'Reject Requisition',
      input: 'textarea',
      inputLabel: 'Reason for Rejection / Return',
      inputPlaceholder: 'Enter executive remarks or required revisions...',
      inputValidator: (value) => {
        if (!value) return 'Please provide an explanatory remark for the audit trail.';
      },
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Reject Requisition',
    });

    if (comment) {
      try {
        await reviewFinancialRequest(
          req.id,
          {
            action: 'rejected',
            comments: comment,
          },
          {
            id: user?.id || '00000000-0000-0000-0000-000000000002',
            name: 'Elisha N. Mwakipesile',
            role: 'executive_director',
          }
        );
        await Swal.fire({
          title: 'Rejected',
          text: `Requisition ${req.requestNumber} was rejected.`,
          icon: 'info',
          confirmButtonColor: '#D68904',
        });
        loadData();
      } catch (err: any) {
        Swal.fire({
          title: 'Operation Failed',
          text: err.message || 'Could not record rejection.',
          icon: 'error',
          confirmButtonColor: '#D68904',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('director.dashboardTitle', 'Executive Director Command & Governance')}
        subtitle={t(
          'director.dashboardSubtitle',
          'Strategic portfolio oversight, organizational approval queue, governance follow-ups, and risk management.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('director.overview', 'Executive Overview') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
              <Briefcase className="h-4 w-4 mr-1.5" />
              {t('director.viewReports', 'Institutional Reports')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/correspondence')}>
              <Calendar className="h-4 w-4 mr-1.5" />
              {t('director.viewMeetings', 'Governance & Meetings')}
            </Button>
          </div>
        }
      />

      {/* Strategic Portfolio Health KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Active Project Portfolio
            </span>
            <div className="text-[28px] font-bold text-charcoal-900 leading-tight font-mono tabular-nums">
              {activeProjectsCount} <span className="text-sm font-normal text-charcoal-muted">/ {projects.length}</span>
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Programs in active field execution
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Committed Grants & Budget
            </span>
            <div className="text-[28px] font-bold text-charcoal-900 leading-tight font-mono tabular-nums">
              {(totalPortfolioBudget / 1000000).toFixed(1)}M
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              TZS across all approved donor grants
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Pending Executive Approvals
            </span>
            <div className={`text-[28px] font-bold leading-tight font-mono tabular-nums ${pendingApprovals.length > 0 ? 'text-amber-600' : 'text-charcoal-900'}`}>
              {pendingApprovals.length}
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Strategic requisitions awaiting sign-off
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Overdue Governance Actions
            </span>
            <div className={`text-[28px] font-bold leading-tight font-mono tabular-nums ${overdueActions.length > 0 ? 'text-rose-600' : 'text-charcoal-900'}`}>
              {overdueActions.length}
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Action items past statutory deadline
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Operational Queues: Executive Approvals & Governance Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Executive Approval Queue */}
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-forest-700" />
                Strategic Approvals Requiring Executive Sign-Off
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Financial requests and agreements awaiting your authorization
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/finance')}>
              {t('common.viewAll', 'View All')}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm min-w-[540px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-3">Reference & Title</th>
                  <th className="py-2.5 px-3">Requester</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-charcoal-muted text-xs">
                      No pending requests currently requiring executive authorization.
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.slice(0, 5).map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-charcoal-900 line-clamp-1">{req.title}</div>
                        <div className="text-xs font-mono text-charcoal-muted">{req.requestNumber} • {req.requestType}</div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-charcoal-700 whitespace-nowrap">
                        {req.requesterName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-charcoal-900 whitespace-nowrap">
                        {req.currency} {req.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(req)}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Approve Requisition"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(req)}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                            title="Reject Requisition"
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

        {/* Governance Decisions & Overdue Action Items */}
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                Board & Governance Follow-up Action Items
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Committees and management decisions tracking
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/correspondence')}>
              {t('common.viewAll', 'View All')}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-3">Action Ref</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Assignee</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {actions.slice(0, 5).map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-xs text-charcoal-800 whitespace-nowrap">
                      {act.actionNumber}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-charcoal-900 max-w-[220px] truncate">
                      {act.taskDescription}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-charcoal-700 whitespace-nowrap">
                      {act.assignedToName}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <StatusIndicator
                        status={act.isOverdue ? 'overdue' : act.status}
                        label={act.isOverdue ? 'OVERDUE' : act.status.toUpperCase()}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Program Portfolio Breakdown Table */}
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-forest-700" />
              Strategic Program Delivery & Budget Health
            </h3>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Snapshot of high-impact donor-funded initiatives
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            {t('common.viewAll', 'All Projects')}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-4">Project Code & Name</th>
                <th className="py-2.5 px-4">Funding Partner</th>
                <th className="py-2.5 px-4">Period</th>
                <th className="py-2.5 px-4 text-right">Total Budget</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {projects.slice(0, 4).map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-charcoal-900">{p.name}</div>
                    <div className="text-xs font-mono text-charcoal-muted">{p.projectCode}</div>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-charcoal-800">{p.funder}</td>
                  <td className="py-3 px-4 text-xs text-charcoal-600 whitespace-nowrap">
                    {p.startDate} — {p.endDate}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-xs text-charcoal-900 whitespace-nowrap">
                    {p.currency} {p.totalBudget.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <StatusIndicator status={p.status} label={p.status.toUpperCase()} />
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
