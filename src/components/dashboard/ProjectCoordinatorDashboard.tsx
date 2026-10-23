/**
 * Project Coordinator Dashboard
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Comprehensive operational portal for Project Coordinators:
 * - 6 KPI cards answering immediate execution questions
 * - Pending follow-up desk for returned submissions requiring correction
 * - Assigned field activities execution table with search, filters, and pagination
 * - Upcoming workplan milestones and task tracker with status toggles
 * - Implementation pipeline progress chart (AnalyticsVisualizer)
 * - In-dashboard modal for recording and submitting field activities to the Project Manager
 * - Strict adherence to BAOMS branding (#D68904) and monochrome dark icons (#374151)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  Activity,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Send,
  Eye,
  MapPin,
  Users,
  CheckSquare,
  ChevronRight,
  RotateCcw,
  FileText,
  Upload,
  Target,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { Card } from '@/components/ui/Card';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnalyticsVisualizer, AnalyticsDataPoint } from '@/components/ui/AnalyticsVisualizer';
import {
  getProjects,
  getAllActivities,
  getAllTasks,
  createActivity,
  updateActivity,
  updateTask,
} from '@/features/projects/services/projectService';
import {
  ProjectRecord,
  ActivityRecord,
  TaskRecord,
} from '@/features/projects/types/project';
import { useAuth } from '@/features/auth/useAuth';
import { showSuccess, showError } from '@/lib/sweetAlert';

export const ProjectCoordinatorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, roles } = useAuth();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Global Filter
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Activities Table Filter & Pagination
  const [activitySearch, setActivitySearch] = useState('');
  const [activityStatusFilter, setActivityStatusFilter] = useState<string>('all');
  const [activityPage, setActivityPage] = useState(1);
  const activityPageSize = 5;

  // Record / Edit Activity Modal State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityRecord | null>(null);
  const [formProjectId, setFormProjectId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formLocation, setFormLocation] = useState('');
  const [formParticipants, setFormParticipants] = useState(0);
  const [formProgress, setFormProgress] = useState('');
  const [formChallenges, setFormChallenges] = useState('');
  const [formFollowUp, setFormFollowUp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pList, aList, tList] = await Promise.all([
        getProjects({}, user ? { id: user.id, role: roles[0] } : undefined),
        getAllActivities(),
        getAllTasks(),
      ]);

      setProjects(pList);
      setActivities(aList);
      setTasks(tList);

      if (pList.length > 0 && !formProjectId) {
        setFormProjectId(pList[0].id);
      }
    } catch (err) {
      console.error('[ProjectCoordinatorDashboard] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, roles, formProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Project-scoped data
  const scopedData = useMemo(() => {
    let filteredProjects = projects;
    let filteredActivities = activities;
    let filteredTasks = tasks;

    if (selectedProjectId !== 'all') {
      filteredProjects = projects.filter((p) => p.id === selectedProjectId);
      filteredActivities = activities.filter((a) => a.projectId === selectedProjectId);
      filteredTasks = tasks.filter((t) => t.projectId === selectedProjectId);
    }

    return {
      projects: filteredProjects,
      activities: filteredActivities,
      tasks: filteredTasks,
    };
  }, [projects, activities, tasks, selectedProjectId]);

  // 6 Required KPI Cards Calculations
  const metrics = useMemo(() => {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    const assignedProjects = scopedData.projects.length;
    const myActivities = scopedData.activities.length;
    const inProgress = scopedData.activities.filter(
      (a) => a.submissionStatus === 'draft' || a.submissionStatus === 'submitted'
    ).length;

    // Overdue tasks: unfinished tasks past due date
    const overdueTasks = scopedData.tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < now;
    }).length;

    // Upcoming deadlines in next 30 days
    const upcomingDeadlines = scopedData.tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      const d = new Date(t.dueDate);
      return d >= now && d <= in30Days;
    }).length;

    // Awaiting review: submissions submitted and waiting for PM decision
    const awaitingReview = scopedData.activities.filter(
      (a) => a.submissionStatus === 'submitted'
    ).length;

    return {
      assignedProjects,
      myActivities,
      inProgress,
      overdueTasks,
      upcomingDeadlines,
      awaitingReview,
    };
  }, [scopedData]);

  // Pending Follow-up: Submissions returned for correction
  const returnedSubmissions = useMemo(() => {
    return scopedData.activities.filter(
      (a) => a.submissionStatus === 'returned_for_correction'
    );
  }, [scopedData.activities]);

  // Coordinator Field Indicators Performance (Target vs. Actual Achievement)
  const coordinatorIndicatorChartData = useMemo((): AnalyticsDataPoint[] => {
    if (scopedData.activities.length === 0) {
      return [{ label: 'No Assigned Indicators', value: 0 }];
    }

    return scopedData.activities.slice(0, 8).map((act) => {
      const actual = Number(act.participantsCount) || 0;
      const target = Math.max(act.targetParticipants || 50, 30);
      const pct = Math.min(Math.round((actual / target) * 100), 100);
      return {
        label: act.title.length > 28 ? act.title.substring(0, 26) + '...' : act.title,
        value: pct,
        color: pct >= 80 ? '#15803d' : pct >= 50 ? '#D68904' : '#b91c1c',
        description: `Reached: ${actual.toLocaleString()} / Target: ${target.toLocaleString()} participants (${pct}%)`,
      };
    });
  }, [scopedData.activities]);

  // Filtered Activities Table Data
  const filteredActivities = useMemo(() => {
    return scopedData.activities.filter((act) => {
      if (activityStatusFilter !== 'all' && act.submissionStatus !== activityStatusFilter) return false;
      if (activitySearch.trim()) {
        const q = activitySearch.toLowerCase();
        const match =
          act.title.toLowerCase().includes(q) ||
          (act.location && act.location.toLowerCase().includes(q)) ||
          act.progress.toLowerCase().includes(q) ||
          (act.projectName && act.projectName.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [scopedData.activities, activityStatusFilter, activitySearch]);

  const paginatedActivities = useMemo(() => {
    const from = (activityPage - 1) * activityPageSize;
    return filteredActivities.slice(from, from + activityPageSize);
  }, [filteredActivities, activityPage]);

  // Quick Task Status Toggle
  const handleTaskToggle = async (task: TaskRecord) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await updateTask(
        { taskId: task.id, status: nextStatus },
        { id: user?.id || 'coord-user', name: 'Project Coordinator' }
      );
      showSuccess(`Task marked as ${nextStatus === 'completed' ? 'Completed' : 'To Do'}`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg || 'Failed to update task');
    }
  };

  // Open Activity Modal
  const openCreateModal = () => {
    setEditingActivity(null);
    setFormTitle('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormLocation('');
    setFormParticipants(0);
    setFormProgress('');
    setFormChallenges('');
    setFormFollowUp('');
    if (projects.length > 0) setFormProjectId(projects[0].id);
    setIsActivityModalOpen(true);
  };

  const openEditModal = (act: ActivityRecord) => {
    setEditingActivity(act);
    setFormProjectId(act.projectId);
    setFormTitle(act.title);
    setFormDate(act.activityDate);
    setFormLocation(act.location || '');
    setFormParticipants(act.participantsCount);
    setFormProgress(act.progress);
    setFormChallenges(act.challenges || '');
    setFormFollowUp(act.followUpActions || '');
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async (submitImmediately: boolean) => {
    if (!formTitle.trim()) {
      showError('Please enter an activity title.');
      return;
    }
    if (!formProjectId) {
      showError('Please select a project.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingActivity) {
        await updateActivity(
          editingActivity.id,
          {
            title: formTitle,
            projectId: formProjectId,
            activityDate: formDate,
            location: formLocation,
            participantsCount: formParticipants,
            progress: formProgress,
            challenges: formChallenges,
            followUpActions: formFollowUp,
            submitImmediately,
          },
          { id: user?.id || 'coord-user' }
        );
      } else {
        await createActivity(
          {
            projectId: formProjectId,
            title: formTitle,
            activityDate: formDate,
            location: formLocation,
            participantsCount: formParticipants,
            progress: formProgress,
            challenges: formChallenges,
            followUpActions: formFollowUp,
            submitImmediately,
          },
          { id: user?.id || 'coord-user', name: profile?.display_name || 'Project Coordinator' }
        );
      }

      showSuccess(
        submitImmediately
          ? t('coordinator.submittedSuccess', 'Activity report submitted to Project Manager for verification.')
          : t('coordinator.draftSavedSuccess', 'Activity draft saved successfully.')
      );

      setIsActivityModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg || 'Failed to save activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('coordinator.dashboardTitle', 'Project Coordinator Dashboard')}
        subtitle={t(
          'coordinator.dashboardSubtitle',
          'Field operations desk, assigned activity execution, participant reach, and report submissions.'
        )}
        breadcrumbs={[
          { label: t('navigation.dashboard', 'Dashboard'), href: '/dashboard' },
          { label: t('coordinator.fieldDesk', 'Field Coordination') },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Project Filter */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
            >
              <option value="all">{t('projects.allProjects', 'All Assigned Projects')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode ? `[${p.projectCode}] ` : ''}{p.name}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/projects/tasks')}
              className="text-xs border-gray-300 text-gray-700"
            >
              <CheckSquare className="w-3.5 h-3.5 mr-1 text-[#374151]" />
              {t('projects.tasks.title', 'Tasks')}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/projects/field-updates')}
              className="text-xs border-gray-300 text-gray-700"
            >
              <MapPin className="w-3.5 h-3.5 mr-1 text-[#374151]" />
              {t('nav.fieldUpdates', 'Field Updates')}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-black" />
              {t('coordinator.recordActivity', 'Record Activity')}
            </Button>
          </div>
        }
      />

      {/* 6 Required KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* 1. Assigned Projects */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('coordinator.kpi.assignedProjects', 'Assigned Projects')}</span>
            <Briefcase className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight">
            {metrics.assignedProjects}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Initiatives in scope</p>
        </Card>

        {/* 2. My Activities */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('coordinator.kpi.myActivities', 'My Activities')}</span>
            <Activity className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight">
            {metrics.myActivities}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Logged outreach sessions</p>
        </Card>

        {/* 3. In Progress */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('coordinator.kpi.inProgress', 'In Progress')}</span>
            <Clock className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight">
            {metrics.inProgress}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Draft & in-flight records</p>
        </Card>

        {/* 4. Overdue Tasks */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('coordinator.kpi.overdue', 'Overdue Tasks')}</span>
            <AlertTriangle className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-700 font-mono tabular-nums leading-tight">
            {metrics.overdueTasks}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Past targeted completion</p>
        </Card>

        {/* 5. Upcoming Deadlines */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('coordinator.kpi.upcoming', 'Deadlines Due')}</span>
            <Calendar className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight">
            {metrics.upcomingDeadlines}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Next 30 days window</p>
        </Card>

        {/* 6. Awaiting Review */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('coordinator.kpi.awaitingReview', 'In PM Review')}</span>
            <CheckCircle2 className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 font-mono tabular-nums leading-tight">
            {metrics.awaitingReview}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Submissions pending PM</p>
        </Card>
      </div>

      {/* Action Queue / Returned Submissions Alert */}
      {returnedSubmissions.length > 0 && (
        <Card className="p-4 bg-amber-50/70 border border-amber-300 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <RotateCcw className="w-4 h-4 text-[#374151]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  {returnedSubmissions.length} Field Activity Report(s) Returned for Correction
                </h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  The Project Manager has requested amendments or additional evidence before approval.
                </p>
                <div className="mt-2 space-y-1">
                  {returnedSubmissions.slice(0, 2).map((act) => (
                    <div key={act.id} className="text-xs text-gray-800 flex items-center gap-2">
                      <span className="font-semibold">{act.title}:</span>
                      <span className="italic text-gray-600">"{act.reviewComments || 'Please revise and resubmit'}"</span>
                      <button
                        onClick={() => openEditModal(act)}
                        className="text-xs font-bold text-[#D68904] hover:underline ml-1"
                      >
                        Edit & Resubmit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActivityStatusFilter('returned_for_correction');
              }}
              className="text-xs border-amber-300 bg-white text-gray-800 shrink-0"
            >
              View In Table
            </Button>
          </div>
        </Card>
      )}

      {/* Analytics Visualizer & Tasks Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Coordinator Field Indicator Performance */}
        <Card className="lg:col-span-5 p-5 bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#D68904]" />
                <h2 className="text-sm font-bold text-gray-900">
                  {t('coordinator.charts.indicatorsTitle', 'Field Execution Pipeline & Indicator Milestones')}
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Target vs. actual participant reach across assigned activities
              </p>
            </div>
            <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
              {coordinatorIndicatorChartData.length} Tracked
            </span>
          </div>

          <div className="min-h-[220px]">
            <AnalyticsVisualizer
              data={coordinatorIndicatorChartData}
              defaultMode="bar"
              availableModes={['bar', 'table']}
              height={200}
            />
          </div>
        </Card>

        {/* Right: Upcoming Workplan Deliverables */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#374151]" />
                {t('coordinator.tasks.title', 'Upcoming Deliverables & Workplan Tasks')}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Priority milestones requiring coordinator action
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/projects/tasks')}
              className="text-xs text-gray-700 hover:text-black"
            >
              {t('common.viewAll', 'All Tasks')}
              <ChevronRight className="w-3.5 h-3.5 ml-0.5 text-[#374151]" />
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4 w-8">Done</th>
                  <th className="py-2.5 px-3">{t('projects.tasks.colTitle', 'Deliverable & Project')}</th>
                  <th className="py-2.5 px-3">{t('projects.tasks.colDue', 'Deadline')}</th>
                  <th className="py-2.5 px-4 text-right">{t('projects.tasks.colPriority', 'Priority')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scopedData.tasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-500 text-xs">
                      No pending tasks assigned in active projects.
                    </td>
                  </tr>
                ) : (
                  scopedData.tasks.slice(0, 5).map((tsk) => {
                    const isLate = tsk.dueDate && new Date(tsk.dueDate) < new Date() && tsk.status !== 'completed';
                    const isDone = tsk.status === 'completed';

                    return (
                      <tr key={tsk.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-2.5 px-4">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleTaskToggle(tsk)}
                            className="rounded border-gray-300 text-[#D68904] focus:ring-[#D68904] w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>

                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          <span className={`block truncate max-w-[220px] ${isDone ? 'line-through text-gray-400' : ''}`}>
                            {tsk.title}
                          </span>
                          <span className="text-[10px] text-gray-500 block truncate">
                            {tsk.projectName || 'Assigned Project'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-xs whitespace-nowrap">
                          <span className={isLate ? 'text-rose-700 font-bold' : isDone ? 'text-gray-400' : 'text-gray-700'}>
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

      {/* My Assigned Activities Execution Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">
              {t('coordinator.activities.title', 'My Assigned Field Activities')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Outreach workshops, field clinics, and community verification logs
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('projects.activities.searchPlaceholder', 'Search activities...')}
                value={activitySearch}
                onChange={(e) => {
                  setActivitySearch(e.target.value);
                  setActivityPage(1);
                }}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
              />
            </div>

            <select
              value={activityStatusFilter}
              onChange={(e) => {
                setActivityStatusFilter(e.target.value);
                setActivityPage(1);
              }}
              className="rounded-lg border border-gray-300 py-1.5 px-2.5 text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
            >
              <option value="all">{t('common.allStatus', 'All Statuses')}</option>
              <option value="draft">Draft (Field Notes)</option>
              <option value="submitted">Submitted (In Review)</option>
              <option value="approved">Approved & Verified</option>
              <option value="returned_for_correction">Returned for Edit</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/projects/activities')}
              className="text-xs border-gray-300 text-gray-700"
            >
              {t('common.viewAll', 'All Activities')}
              <ChevronRight className="w-3 h-3 ml-0.5 text-[#374151]" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">{t('projects.activities.colTitle', 'Activity & Project')}</th>
                <th className="py-3 px-3">{t('projects.activities.colDate', 'Date')}</th>
                <th className="py-3 px-3">{t('projects.activities.colLocation', 'Location')}</th>
                <th className="py-3 px-3 text-right">{t('projects.activities.colReach', 'Reach')}</th>
                <th className="py-3 px-4">{t('common.status', 'Status')}</th>
                <th className="py-3 px-4 text-right">{t('common.actions', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <EmptyState
                      title={t('projects.activities.emptyTitle', 'No activities found')}
                      description={t(
                        'projects.activities.emptyDesc',
                        'No field activities match your current search or status filters.'
                      )}
                      actionLabel={t('coordinator.recordActivity', 'Record Activity')}
                      onAction={openCreateModal}
                    />
                  </td>
                </tr>
              ) : (
                paginatedActivities.map((act) => {
                  const isReturned = act.submissionStatus === 'returned_for_correction';
                  const canEdit = act.submissionStatus === 'draft' || isReturned;

                  return (
                    <tr key={act.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 block truncate max-w-[240px]">
                          {act.title}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate block mt-0.5">
                          {act.projectName}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                        {act.activityDate}
                      </td>

                      <td className="py-3 px-3 text-gray-700 whitespace-nowrap">
                        {act.location || 'Field Location'}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                        {act.participantsCount} ppl
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusIndicator status={act.submissionStatus} label={act.submissionStatus.toUpperCase()} />
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {canEdit ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(act)}
                            className="px-2.5 py-1 text-xs border border-gray-300 text-gray-800 hover:bg-gray-100"
                          >
                            {isReturned ? 'Edit & Resubmit' : 'Update Activity'}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/projects/${act.projectId}`)}
                            className="px-2.5 py-1 text-xs text-gray-700 hover:text-black"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-[#374151]" />
                            View Record
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredActivities.length > activityPageSize && (
          <div className="p-3 border-t border-gray-100">
            <Pagination
              currentPage={activityPage}
              totalPages={Math.ceil(filteredActivities.length / activityPageSize)}
              totalItems={filteredActivities.length}
              pageSize={activityPageSize}
              onPageChange={setActivityPage}
            />
          </div>
        )}
      </div>

      {/* Record / Edit Activity Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {editingActivity ? 'Update Field Activity Report' : 'Record New Field Activity'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Babawatoto Organization Field Operations Desk
                </p>
              </div>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs text-gray-700 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Associated Project *</label>
                <select
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode ? `[${p.projectCode}] ` : ''}{p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Activity Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Community Forum on Child Nutrition"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <DatePicker
                    label="Activity Date *"
                    value={formDate}
                    onChange={(val) => setFormDate(val)}
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Participants Reached *</label>
                  <input
                    type="number"
                    min={0}
                    value={formParticipants}
                    onChange={(e) => setFormParticipants(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Location / Ward *</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g., Ward 4 Youth Hall"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Work Done & Progress Notes *</label>
                <textarea
                  rows={3}
                  value={formProgress}
                  onChange={(e) => setFormProgress(e.target.value)}
                  placeholder="Summarize key activities completed, session topics, community feedback..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Field Challenges & Bottlenecks</label>
                <textarea
                  rows={2}
                  value={formChallenges}
                  onChange={(e) => setFormChallenges(e.target.value)}
                  placeholder="Document field constraints or issues requiring manager assistance..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Follow-Up Action</label>
                <input
                  type="text"
                  value={formFollowUp}
                  onChange={(e) => setFormFollowUp(e.target.value)}
                  placeholder="e.g., Follow up session scheduled with ward leaders"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsActivityModalOpen(false)}
                className="text-xs text-gray-600"
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => handleSaveActivity(false)}
                  className="text-xs border-gray-300 text-gray-700"
                >
                  Save as Draft
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => handleSaveActivity(true)}
                  className="text-xs font-bold"
                >
                  <Send className="w-3.5 h-3.5 mr-1 text-black" />
                  Submit to PM
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
