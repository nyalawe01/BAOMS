import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  AlertTriangle,
  MapPin,
  FileText,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import {
  getProjects,
  getProjectActivities,
  getProjectTasks,
} from '@/features/projects/services/projectService';
import {
  ProjectRecord,
  ActivityRecord,
  TaskRecord,
} from '@/features/projects/types/project';

export const ProjectManagerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [allActivities, setAllActivities] = useState<ActivityRecord[]>([]);
  const [allTasks, setAllTasks] = useState<TaskRecord[]>([]);

  const loadData = async () => {
    try {
      const pList = await getProjects();
      setProjects(pList);

      // Fetch activities and tasks across active projects
      const activityPromises = pList.map((p) => getProjectActivities(p.id));
      const taskPromises = pList.map((p) => getProjectTasks(p.id));

      const activityResults = await Promise.all(activityPromises);
      const taskResults = await Promise.all(taskPromises);

      setAllActivities(activityResults.flat());
      setAllTasks(taskResults.flat());
    } catch (e) {
      console.error('Failed loading PM telemetry:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeProjects = projects.filter((p) => p.status === 'active');
  const pendingReviews = allActivities.filter(
    (a) => a.submissionStatus === 'submitted'
  );
  const overdueTasks = allTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pm.dashboardTitle', 'Project Management & Program Delivery')}
        subtitle={t(
          'pm.dashboardSubtitle',
          'Workplan execution, coordinator submissions review, milestone tracking, and field analytics.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('pm.overview', 'Program Command') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
              <Briefcase className="h-4 w-4 mr-1.5" />
              {t('pm.allProjects', 'Project Registry')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/projects')}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('pm.newProject', 'Manage Workplans')}
            </Button>
          </div>
        }
      />

      {/* Program Delivery KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Managed Projects
            </span>
            <div className="text-[28px] font-bold text-charcoal-900 leading-tight font-mono tabular-nums">
              {activeProjects.length}
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Active donor programs in delivery
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Field Activities Recorded
            </span>
            <div className="text-[28px] font-bold text-charcoal-900 leading-tight font-mono tabular-nums">
              {allActivities.length}
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Community workshops and forums
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <MapPin className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Field Reports in Review
            </span>
            <div className={`text-[28px] font-bold leading-tight font-mono tabular-nums ${pendingReviews.length > 0 ? 'text-amber-600' : 'text-charcoal-900'}`}>
              {pendingReviews.length}
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Awaiting manager validation
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Overdue Milestones & Tasks
            </span>
            <div className={`text-[28px] font-bold leading-tight font-mono tabular-nums ${overdueTasks.length > 0 ? 'text-rose-600' : 'text-charcoal-900'}`}>
              {overdueTasks.length}
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Tasks past targeted completion date
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Operational Queues: Reports Awaiting Review & Tasks Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coordinator Submissions Awaiting PM Review */}
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-forest-700" />
                Coordinator Submissions Awaiting Review
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Field activity reports requiring programmatic verification
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              {t('common.viewAll', 'View All')}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-3">Activity & Location</th>
                  <th className="py-2.5 px-3">Submitted By</th>
                  <th className="py-2.5 px-3 text-right">Reach</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {pendingReviews.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-charcoal-muted text-xs">
                      All submitted coordinator reports have been reviewed.
                    </td>
                  </tr>
                ) : (
                  pendingReviews.slice(0, 5).map((act) => (
                    <tr
                      key={act.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/projects/${act.projectId}`)}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-charcoal-900 line-clamp-1">{act.title}</div>
                        <div className="text-xs text-charcoal-muted">{act.location || 'Field Location'} • {act.activityDate}</div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-charcoal-700 whitespace-nowrap">
                        {act.submittedByName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-charcoal-900 whitespace-nowrap">
                        {act.participantsCount} ppl
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <StatusIndicator status={act.submissionStatus} label={act.submissionStatus.toUpperCase()} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Milestone & Task Priority Tracker */}
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                Workplan Tasks & Milestone Tracker
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Priority deliverables assigned to project team members
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              {t('common.viewAll', 'View All')}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-3">Task Deliverable</th>
                  <th className="py-2.5 px-3">Assignee</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {allTasks.slice(0, 5).map((tsk) => {
                  const isLate = tsk.dueDate && new Date(tsk.dueDate) < new Date() && tsk.status !== 'completed';
                  return (
                    <tr key={tsk.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-charcoal-900">
                        <div className="line-clamp-1">{tsk.title}</div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-charcoal-700 whitespace-nowrap">
                        {tsk.assignedToName || 'Unassigned'}
                      </td>
                      <td className="py-2.5 px-3 text-xs whitespace-nowrap">
                        <span className={isLate ? 'text-rose-700 font-bold' : 'text-charcoal-600'}>
                          {tsk.dueDate || 'No Deadline'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className={`font-mono text-xs font-semibold uppercase ${
                          tsk.priority === 'high' ? 'text-rose-700' : 'text-charcoal-700'
                        }`}>
                          {tsk.priority}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Program Summary Overview */}
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-forest-700" />
              Active Project Portfolios & Field Activity Count
            </h3>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Programmatic progress and execution status
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
                <th className="py-2.5 px-4">Project Name & Code</th>
                <th className="py-2.5 px-4">Funder</th>
                <th className="py-2.5 px-4 text-right">Activities</th>
                <th className="py-2.5 px-4 text-right">Tasks</th>
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
                  <td className="py-3 px-4 text-right font-mono font-bold text-xs text-charcoal-900 whitespace-nowrap">
                    {p.activityCount}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-xs text-charcoal-900 whitespace-nowrap">
                    {p.taskCount}
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
