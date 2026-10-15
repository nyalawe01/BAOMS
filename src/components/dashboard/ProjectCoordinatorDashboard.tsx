import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Upload,
  MapPin,
  Users,
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

export const ProjectCoordinatorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [myTasks, setMyTasks] = useState<TaskRecord[]>([]);

  const loadData = async () => {
    try {
      const pList = await getProjects();
      setProjects(pList);

      const actPromises = pList.map((p) => getProjectActivities(p.id));
      const taskPromises = pList.map((p) => getProjectTasks(p.id));

      const actResults = await Promise.all(actPromises);
      const taskResults = await Promise.all(taskPromises);

      const allActs = actResults.flat();
      setActivities(allActs);

      // Tasks assigned to coordinator or unassigned in coordinator projects
      const allTsks = taskResults.flat();
      setMyTasks(allTsks);
    } catch (e) {
      console.error('Failed loading coordinator telemetry:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBeneficiaries = activities.reduce((acc, a) => acc + (a.participantsCount || 0), 0);
  const draftReportsCount = activities.filter((a) => a.submissionStatus === 'draft').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('coordinator.dashboardTitle', 'Project Coordinator Field Operations')}
        subtitle={t(
          'coordinator.dashboardSubtitle',
          'Field activity tracking, community participant reach, evidence documentation, and submission workflow.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('coordinator.desk', 'Field Operations Desk') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/documents')}>
              <Upload className="h-4 w-4 mr-1.5" />
              {t('coordinator.uploadPhotos', 'Upload Evidence')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/projects')}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('coordinator.recordActivity', 'Record Field Activity')}
            </Button>
          </div>
        }
      />

      {/* Field Operations KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Assigned Field Projects
            </span>
            <div className="text-[28px] font-bold text-charcoal-900 leading-tight font-mono tabular-nums">
              {projects.length}
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Community initiatives in Temeke & Mburahati
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Beneficiaries Reached
            </span>
            <div className="text-[28px] font-bold text-charcoal-900 leading-tight font-mono tabular-nums">
              {totalBeneficiaries.toLocaleString()}
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Verified participants & attendees
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Activities Conducted
            </span>
            <div className="text-[28px] font-bold text-charcoal-900 leading-tight font-mono tabular-nums">
              {activities.length}
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Workshops, clinics, & theater forums
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <MapPin className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Draft Reports to Submit
            </span>
            <div className={`text-[28px] font-bold leading-tight font-mono tabular-nums ${draftReportsCount > 0 ? 'text-amber-600' : 'text-charcoal-900'}`}>
              {draftReportsCount}
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Pending final submission to PM
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Operational Queues: Field Activity Log & Assigned Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Field Activities Log */}
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-forest-700" />
                Recent Field Activities & Outreach Sessions
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Community events conducted in target centers
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
                  <th className="py-2.5 px-3">Activity & Date</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3 text-right">Attendance</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {activities.slice(0, 5).map((act) => (
                  <tr
                    key={act.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${act.projectId}`)}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-charcoal-900 line-clamp-1">{act.title}</div>
                      <div className="text-xs text-charcoal-muted">{act.activityDate}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-charcoal-700 whitespace-nowrap">
                      {act.location || 'Field Center'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-charcoal-900 whitespace-nowrap">
                      {act.participantsCount} participants
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <StatusIndicator status={act.submissionStatus} label={act.submissionStatus.toUpperCase()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assigned Field Tasks & Deadlines */}
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                Assigned Operational Tasks & Deliverables
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Workplan milestones requiring execution
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
                  <th className="py-2.5 px-3">Deadline</th>
                  <th className="py-2.5 px-3 text-right">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {myTasks.slice(0, 5).map((tsk) => {
                  const isLate = tsk.dueDate && new Date(tsk.dueDate) < new Date() && tsk.status !== 'completed';
                  return (
                    <tr key={tsk.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-charcoal-900">
                        <div className="line-clamp-1">{tsk.title}</div>
                        <div className="text-xs text-charcoal-muted font-normal">{tsk.description || 'Deliverable milestone'}</div>
                      </td>
                      <td className="py-2.5 px-3 text-xs whitespace-nowrap">
                        <span className={isLate ? 'text-rose-700 font-bold' : 'text-charcoal-700'}>
                          {tsk.dueDate || 'Open'}
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
    </div>
  );
};
