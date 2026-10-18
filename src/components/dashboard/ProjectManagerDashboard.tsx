/**
 * Project Manager Dashboard
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Comprehensive project manager dashboard adhering to the AdminCN visual design reference:
 * - 6 required KPI metrics calculated from real Supabase data
 * - Portfolio distribution and activity performance analytics
 * - Coordinator action queue / review desk for field activity validations
 * - Structured project portfolio overview table with search, filters, and pagination
 * - BAOMS gold branding (#D68904) and monochrome dark icons (#374151)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  TrendingUp,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  Plus,
  FileText,
  Users,
  Wallet,
  Check,
  RotateCcw,
  Eye,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnalyticsVisualizer, AnalyticsDataPoint } from '@/components/ui/AnalyticsVisualizer';
import {
  getProjects,
  getAllActivities,
  getAllTasks,
  getAllReports,
  reviewActivitySubmission,
} from '@/features/projects/services/projectService';
import {
  ProjectRecord,
  ActivityRecord,
  TaskRecord,
  ProjectReportRecord,
  ProjectStatus,
} from '@/features/projects/types/project';
import { useAuth } from '@/features/auth/useAuth';
import { showSuccess, showError } from '@/lib/sweetAlert';

export const ProjectManagerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, roles } = useAuth();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [reports, setReports] = useState<ProjectReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Global Dashboard Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'quarter' | 'year'>('all');

  // Portfolio Table Filters & Pagination
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [tablePage, setTablePage] = useState(1);
  const tablePageSize = 5;

  // Review Modal State
  const [reviewingActivity, setReviewingActivity] = useState<ActivityRecord | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pList, aList, tList, rList] = await Promise.all([
        getProjects({}, user ? { id: user.id, role: roles[0] } : undefined),
        getAllActivities(),
        getAllTasks(),
        getAllReports(),
      ]);

      setProjects(pList);
      setActivities(aList);
      setTasks(tList);
      setReports(rList);
    } catch (err) {
      console.error('[ProjectManagerDashboard] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, roles]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Filtered dataset based on selected project and period
  const scopedData = useMemo(() => {
    let filteredProjects = projects;
    let filteredActivities = activities;
    let filteredTasks = tasks;
    let filteredReports = reports;

    if (selectedProjectId !== 'all') {
      filteredProjects = projects.filter((p) => p.id === selectedProjectId);
      filteredActivities = activities.filter((a) => a.projectId === selectedProjectId);
      filteredTasks = tasks.filter((t) => t.projectId === selectedProjectId);
      filteredReports = reports.filter((r) => r.projectId === selectedProjectId);
    }

    if (selectedPeriod !== 'all') {
      const now = new Date();
      let threshold = new Date();
      if (selectedPeriod === 'month') {
        threshold.setMonth(now.getMonth() - 1);
      } else if (selectedPeriod === 'quarter') {
        threshold.setMonth(now.getMonth() - 3);
      } else if (selectedPeriod === 'year') {
        threshold.setFullYear(now.getFullYear() - 1);
      }

      filteredActivities = filteredActivities.filter((a) => {
        if (!a.activityDate) return true;
        return new Date(a.activityDate) >= threshold;
      });
    }

    return {
      projects: filteredProjects,
      activities: filteredActivities,
      tasks: filteredTasks,
      reports: filteredReports,
    };
  }, [projects, activities, tasks, reports, selectedProjectId, selectedPeriod]);

  // 6 Required KPI Cards Calculations
  const metrics = useMemo(() => {
    const assignedProjects = scopedData.projects.length;
    const activeProjects = scopedData.projects.filter((p) => p.status === 'active').length;

    // Activities in progress (draft or submitted, or active tasks)
    const activitiesInProgress = scopedData.activities.filter(
      (a) => a.submissionStatus === 'draft' || a.submissionStatus === 'submitted'
    ).length;

    // Overdue activities and tasks
    const now = new Date();
    const overdueTasks = scopedData.tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < now;
    }).length;

    // Upcoming deliverables (tasks or reports due in next 30 days)
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);
    const upcomingTasks = scopedData.tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      const d = new Date(t.dueDate);
      return d >= now && d <= in30Days;
    }).length;
    const upcomingReports = scopedData.reports.filter((r) => {
      if (!r.reportingPeriodEnd || r.status === 'approved') return false;
      const d = new Date(r.reportingPeriodEnd);
      return d >= now && d <= in30Days;
    }).length;
    const upcomingDeliverables = upcomingTasks + upcomingReports;

    // Pending Reviews: submissions genuinely awaiting PM action
    const pendingReviews = scopedData.activities.filter(
      (a) => a.submissionStatus === 'submitted'
    ).length;

    return {
      assignedProjects,
      activeProjects,
      activitiesInProgress,
      overdueTasks,
      upcomingDeliverables,
      pendingReviews,
    };
  }, [scopedData]);

  // Chart 1: Project Status & Allocation Breakdown
  const projectStatusChartData = useMemo((): AnalyticsDataPoint[] => {
    const statusCounts: Record<string, number> = {
      Active: 0,
      Planning: 0,
      Completed: 0,
      'On Hold': 0,
    };
    scopedData.projects.forEach((p) => {
      if (p.status === 'active') statusCounts['Active'] += 1;
      else if (p.status === 'planning') statusCounts['Planning'] += 1;
      else if (p.status === 'completed') statusCounts['Completed'] += 1;
      else statusCounts['On Hold'] += 1;
    });

    return [
      { label: 'Active Implementation', value: statusCounts['Active'], color: '#D68904' },
      { label: 'Planning & Setup', value: statusCounts['Planning'], color: '#F2A507' },
      { label: 'Completed Deliverables', value: statusCounts['Completed'], color: '#15803d' },
      { label: 'On Hold / Review', value: statusCounts['On Hold'], color: '#64748b' },
    ];
  }, [scopedData.projects]);

  // Chart 2: Activity Implementation & Verification Status
  const activityStatusChartData = useMemo((): AnalyticsDataPoint[] => {
    const counts = {
      Approved: 0,
      'In Review': 0,
      Draft: 0,
      Returned: 0,
    };
    scopedData.activities.forEach((a) => {
      if (a.submissionStatus === 'approved') counts['Approved'] += 1;
      else if (a.submissionStatus === 'submitted') counts['In Review'] += 1;
      else if (a.submissionStatus === 'draft') counts['Draft'] += 1;
      else if (a.submissionStatus === 'returned_for_correction') counts['Returned'] += 1;
    });

    return [
      { label: 'Verified & Approved', value: counts['Approved'], color: '#15803d' },
      { label: 'Awaiting PM Review', value: counts['In Review'], color: '#D68904' },
      { label: 'Drafted in Field', value: counts['Draft'], color: '#64748b' },
      { label: 'Returned for Edit', value: counts['Returned'], color: '#b91c1c' },
    ];
  }, [scopedData.activities]);

  // Pending Review Desk Submissions
  const pendingSubmissions = useMemo(() => {
    return scopedData.activities.filter((a) => a.submissionStatus === 'submitted');
  }, [scopedData.activities]);

  // Overdue / Urgent Tasks
  const urgentTasks = useMemo(() => {
    const now = new Date();
    return scopedData.tasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 5);
  }, [scopedData.tasks]);

  // Portfolio Table Data
  const filteredTableProjects = useMemo(() => {
    return scopedData.projects.filter((p) => {
      if (tableStatusFilter !== 'all' && p.status !== tableStatusFilter) return false;
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        const match =
          p.name.toLowerCase().includes(q) ||
          (p.projectCode && p.projectCode.toLowerCase().includes(q)) ||
          p.funder.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [scopedData.projects, tableStatusFilter, tableSearch]);

  const paginatedProjects = useMemo(() => {
    const from = (tablePage - 1) * tablePageSize;
    return filteredTableProjects.slice(from, from + tablePageSize);
  }, [filteredTableProjects, tablePage]);

  // Handle Review Submission
  const handleReviewDecision = async (decision: 'approved' | 'returned_for_correction') => {
    if (!reviewingActivity) return;
    setIsSubmittingReview(true);
    try {
      await reviewActivitySubmission(
        reviewingActivity.id,
        decision,
        user?.id || 'pm-user',
        reviewComments.trim() || undefined
      );

      showSuccess(
        decision === 'approved'
          ? t('projects.activities.approvedMsg', 'Activity verified and approved successfully.')
          : t('projects.activities.returnedMsg', 'Activity returned to coordinator for correction.')
      );

      setReviewingActivity(null);
      setReviewComments('');
      await loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const formatCurrency = (amount?: number | null, currency: string = 'TZS') => {
    return `${currency || 'TZS'} ${(amount ?? 0).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('pm.dashboardTitle', 'Project Manager Dashboard')}
        subtitle={t(
          'pm.dashboardSubtitle',
          'Portfolio oversight, workplan delivery, coordinator review desk, and milestone analytics.'
        )}
        breadcrumbs={[
          { label: t('navigation.dashboard', 'Dashboard'), href: '/dashboard' },
          { label: t('navigation.projects', 'Projects'), href: '/projects' },
          { label: t('pm.overview', 'Overview') },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Project Filter */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
            >
              <option value="all">{t('projects.allProjects', 'All Projects Portfolio')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode ? `[${p.projectCode}] ` : ''}{p.name}
                </option>
              ))}
            </select>

            {/* Period Filter */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
            >
              <option value="all">{t('common.allTime', 'All Periods')}</option>
              <option value="month">{t('common.thisMonth', 'This Month')}</option>
              <option value="quarter">{t('common.thisQuarter', 'This Quarter')}</option>
              <option value="year">{t('common.yearToDate', 'Year to Date')}</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/projects/activities')}
              className="text-xs border-gray-300 text-gray-700"
            >
              <Activity className="w-3.5 h-3.5 mr-1 text-[#374151]" />
              {t('projects.tabs.activities', 'Work Plans')}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/projects/new')}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-black" />
              {t('projects.newProject', 'New Project')}
            </Button>
          </div>
        }
      />

      {/* 6 Required KPI Cards - AdminCN Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* 1. Assigned Projects */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('pm.kpi.assignedProjects', 'Assigned Projects')}</span>
            <Briefcase className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight">
            {metrics.assignedProjects}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Portfolio in scope</p>
        </Card>

        {/* 2. Active Projects */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('pm.kpi.activeProjects', 'Active Projects')}</span>
            <TrendingUp className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight">
            {metrics.activeProjects}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">In field delivery</p>
        </Card>

        {/* 3. Activities in Progress */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('pm.kpi.activitiesInProgress', 'In Progress')}</span>
            <Activity className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight">
            {metrics.activitiesInProgress}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Field operations active</p>
        </Card>

        {/* 4. Overdue Activities & Tasks */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('pm.kpi.overdue', 'Overdue Items')}</span>
            <AlertTriangle className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-700 font-mono tabular-nums leading-tight">
            {metrics.overdueTasks}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Past targeted completion</p>
        </Card>

        {/* 5. Upcoming Deliverables */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('pm.kpi.upcomingDeliverables', 'Deliverables Due')}</span>
            <Calendar className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight">
            {metrics.upcomingDeliverables}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Next 30 days window</p>
        </Card>

        {/* 6. Pending Reviews */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('pm.kpi.pendingReviews', 'Pending Reviews')}</span>
            <Clock className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 font-mono tabular-nums leading-tight">
            {metrics.pendingReviews}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Field reports in queue</p>
        </Card>
      </div>

      {/* Analytics Visualizer Row - 2 Balanced Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <Card className="p-5 bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {t('pm.charts.portfolioStatus', 'Project Portfolio Status Breakdown')}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Distribution of managed projects across operational stages
              </p>
            </div>
            <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
              {metrics.assignedProjects} Projects
            </span>
          </div>

          <div className="min-h-[220px]">
            <AnalyticsVisualizer
              data={projectStatusChartData}
              defaultMode="pie"
              availableModes={['pie', 'bar', 'table']}
              height={200}
            />
          </div>
        </Card>

        <Card className="p-5 bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {t('pm.charts.activityStatus', 'Activity Verification & Execution')}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Field activity validation pipeline and review progress
              </p>
            </div>
            <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
              {scopedData.activities.length} Activities
            </span>
          </div>

          <div className="min-h-[220px]">
            <AnalyticsVisualizer
              data={activityStatusChartData}
              defaultMode="bar"
              availableModes={['bar', 'table']}
              height={200}
            />
          </div>
        </Card>
      </div>

      {/* Operational Queues: Coordinator Submissions Review Desk & Tasks Priority */}
      <div id="action-queue" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Coordinator Submissions Awaiting PM Review */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#374151]" />
                {t('pm.submissions.title', 'Coordinator Submissions Awaiting Review')}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Field activity reports requiring programmatic verification & sign-off
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/projects/activities')}
              className="text-xs text-gray-700 hover:text-black"
            >
              {t('common.viewAll', 'All Submissions')}
              <ChevronRight className="w-3.5 h-3.5 ml-0.5 text-[#374151]" />
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">{t('projects.activities.colTitle', 'Activity & Project')}</th>
                  <th className="py-2.5 px-3">{t('projects.activities.colSubmitter', 'Submitted By')}</th>
                  <th className="py-2.5 px-3 text-right">{t('projects.activities.colReach', 'Reach')}</th>
                  <th className="py-2.5 px-4 text-right">{t('common.actions', 'Review Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-500 text-xs">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2 opacity-80" />
                      All submitted coordinator reports have been reviewed and verified.
                    </td>
                  </tr>
                ) : (
                  pendingSubmissions.slice(0, 5).map((act) => (
                    <tr key={act.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-gray-900 block truncate max-w-[240px]">
                          {act.title}
                        </span>
                        <span className="text-[11px] text-gray-500 truncate block">
                          {act.projectName} • {act.location || 'Field Location'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">
                        <span className="font-medium text-gray-900 block">{act.submittedByName || 'Coordinator'}</span>
                        <span className="text-[10px] text-gray-500">{act.activityDate}</span>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                        {act.participantsCount} ppl
                      </td>

                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setReviewingActivity(act)}
                          className="px-2.5 py-1 text-xs border border-gray-300 text-gray-800 hover:bg-gray-100"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-[#374151]" />
                          {t('common.review', 'Review')}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Workplan Tasks & Milestone Tracker */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#374151]" />
                {t('pm.milestones.title', 'Workplan Tasks & Deliverables')}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Priority operational milestones assigned to team members
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/projects/planning')}
              className="text-xs text-gray-700 hover:text-black"
            >
              {t('common.viewAll', 'Timeline')}
              <ChevronRight className="w-3.5 h-3.5 ml-0.5 text-[#374151]" />
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">{t('projects.tasks.colTitle', 'Deliverable')}</th>
                  <th className="py-2.5 px-3">{t('projects.tasks.colDue', 'Due Date')}</th>
                  <th className="py-2.5 px-4 text-right">{t('projects.tasks.colPriority', 'Priority')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {urgentTasks.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-gray-500 text-xs">
                      No pending workplan tasks registered.
                    </td>
                  </tr>
                ) : (
                  urgentTasks.map((tsk) => {
                    const isLate = tsk.dueDate && new Date(tsk.dueDate) < new Date();
                    return (
                      <tr key={tsk.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-gray-900">
                          <span className="block truncate max-w-[200px]">{tsk.title}</span>
                          <span className="text-[10px] text-gray-500 block truncate">
                            {tsk.assignedToName || 'Unassigned'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-xs whitespace-nowrap">
                          <span className={isLate ? 'text-rose-700 font-bold' : 'text-gray-600'}>
                            {tsk.dueDate || 'No Date'}
                          </span>
                        </td>

                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <span
                            className={`font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                              tsk.priority === 'urgent' || tsk.priority === 'high'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {tsk.priority}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Project Portfolio Overview Table (AdminCN Reference Style) */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">
              {t('pm.portfolio.title', 'Project Portfolio Overview')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live organizational initiatives, coordinator allocations, and approved budgets
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('projects.searchPlaceholder', 'Search projects...')}
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setTablePage(1);
                }}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
              />
            </div>

            <select
              value={tableStatusFilter}
              onChange={(e) => {
                setTableStatusFilter(e.target.value as any);
                setTablePage(1);
              }}
              className="rounded-lg border border-gray-300 py-1.5 px-2.5 text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
            >
              <option value="all">{t('common.all', 'All Statuses')}</option>
              <option value="active">{t('projects.status.active', 'Active')}</option>
              <option value="planning">{t('projects.status.planning', 'Planning')}</option>
              <option value="completed">{t('projects.status.completed', 'Completed')}</option>
              <option value="on_hold">{t('projects.status.on_hold', 'On Hold')}</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/projects')}
              className="text-xs border-gray-300 text-gray-700"
            >
              {t('common.all', 'All Projects')}
              <ChevronRight className="w-3 h-3 ml-0.5 text-[#374151]" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">{t('projects.fields.name', 'Project Name & Code')}</th>
                <th className="py-3 px-4">{t('projects.fields.funder', 'Funder / Donor')}</th>
                <th className="py-3 px-4">{t('projects.fields.duration', 'Implementation Dates')}</th>
                <th className="py-3 px-3 text-right">{t('projects.metrics.activities', 'Activities')}</th>
                <th className="py-3 px-4 text-right">{t('projects.metrics.budget', 'Approved Budget')}</th>
                <th className="py-3 px-4">{t('common.status', 'Status')}</th>
                <th className="py-3 px-4 text-right">{t('common.actions', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTableProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <EmptyState
                      title={t('projects.emptyTitle', 'No projects found')}
                      description={t('projects.emptyDesc', 'No project records match the active filters.')}
                    />
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 hover:text-[#D68904]">
                        {p.name}
                      </div>
                      <div className="text-[11px] font-mono text-gray-500 mt-0.5">
                        {p.projectCode || 'PRJ'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {p.funder}
                    </td>

                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {p.startDate} — {p.endDate}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                      {p.activityCount || 0}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                      {formatCurrency(p.totalBudget, p.currency)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusIndicator status={p.status} label={p.status.toUpperCase()} />
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${p.id}`);
                        }}
                        className="text-xs font-semibold text-gray-800 hover:text-[#D68904] p-0 h-auto"
                      >
                        <span>{t('projects.openWorkspace', 'Workspace')}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1 text-[#374151]" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredTableProjects.length > tablePageSize && (
          <div className="p-3 border-t border-gray-100">
            <Pagination
              currentPage={tablePage}
              totalPages={Math.ceil(filteredTableProjects.length / tablePageSize)}
              totalItems={filteredTableProjects.length}
              pageSize={tablePageSize}
              onPageChange={setTablePage}
            />
          </div>
        )}
      </div>

      {/* Review Activity Submission Modal */}
      {reviewingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {t('projects.activities.reviewTitle', 'Review Field Activity Submission')}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {reviewingActivity.projectName}
                </p>
              </div>
              <button
                onClick={() => setReviewingActivity(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-gray-700">
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold">Activity</span>
                <p className="font-bold text-gray-900">{reviewingActivity.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <span className="text-gray-500 block">Submitted By</span>
                  <span className="font-semibold text-gray-900">{reviewingActivity.submittedByName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Date of Activity</span>
                  <span className="font-semibold text-gray-900">{reviewingActivity.activityDate}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Location</span>
                  <span className="font-semibold text-gray-900">{reviewingActivity.location || 'Field'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Participants Reached</span>
                  <span className="font-semibold text-gray-900 font-mono">{reviewingActivity.participantsCount} people</span>
                </div>
              </div>

              {reviewingActivity.progress && (
                <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">Field Progress Notes</span>
                  <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded-md border border-gray-200 mt-1">
                    {reviewingActivity.progress}
                  </p>
                </div>
              )}

              {reviewingActivity.challenges && (
                <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold text-amber-700">
                    Reported Challenges
                  </span>
                  <p className="text-xs text-gray-800 bg-amber-50/50 p-3 rounded-md border border-amber-200 mt-1">
                    {reviewingActivity.challenges}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Manager Verification Feedback / Instructions
                </label>
                <textarea
                  rows={3}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Provide validation comments or specific reasons if returning for correction..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReviewingActivity(null)}
                className="text-xs text-gray-600"
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSubmittingReview}
                  onClick={() => handleReviewDecision('returned_for_correction')}
                  className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Return for Edit
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingReview}
                  onClick={() => handleReviewDecision('approved')}
                  className="text-xs font-bold"
                >
                  <Check className="w-3.5 h-3.5 mr-1 text-black" />
                  Approve Activity
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
