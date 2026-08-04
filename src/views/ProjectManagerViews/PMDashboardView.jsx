import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { LayoutDashboard, Activity, FileClock, Clock, Calendar } from 'lucide-react';
import { KpiCard, KpiCardGrid } from '@/components/base/kpi-card/kpi-card';

// ============================================================================
// 1. PM DASHBOARD VIEW
// ============================================================================
export function PMDashboardView() {
  const { projects, users, auditLogs } = useProject();

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const delayedProjects = projects.filter(p => p.status === 'On Hold').length;

  const allTasks = projects.flatMap(p => (p.tasks || []).map(t => ({ ...t, projectId: p.id, projectName: p.name })));
  const pendingTasks = allTasks.filter(t => t.status !== 'Completed').length;
  const completedTasks = allTasks.filter(t => t.status === 'Completed').length;

  const totalBudget = projects.reduce((acc, curr) => acc + (curr.budget || 0), 0);
  const spentBudget = projects.reduce((acc, curr) => acc + ((curr.budget || 0) * (curr.progress || 0) / 100), 0);
  const budgetUtilization = totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0;

  // Derive recent activities from actual context audit logs (derived from db)
  const recentActivities = auditLogs.slice(0, 5).map(log => ({
    title: log.actionType ? log.actionType.replace(/_/g, ' ') : 'WORKSPACE UPDATE',
    desc: log.description || 'Workspace event triggered.',
    time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Just now'
  }));

  // Derive upcoming milestones directly from project end dates (derived from db)
  const upcomingDeadlines = projects
    .filter(p => p.status !== 'Completed' && p.endDate)
    .slice(0, 3)
    .map(p => ({
      name: p.name,
      endDate: p.endDate
    }));

  // Derive an overall date range across all projects for the timeline (poor man's Gantt)
  const timelineProjects = projects.filter(p => p.startDate && p.endDate && !isNaN(new Date(p.startDate)) && !isNaN(new Date(p.endDate)));
  const timelineStart = timelineProjects.length > 0
    ? new Date(Math.min(...timelineProjects.map(p => new Date(p.startDate).getTime())))
    : null;
  const timelineEnd = timelineProjects.length > 0
    ? new Date(Math.max(...timelineProjects.map(p => new Date(p.endDate).getTime())))
    : null;
  const timelineSpanMs = timelineStart && timelineEnd
    ? Math.max(timelineEnd.getTime() - timelineStart.getTime(), 1)
    : 1;

  // Status color conventions matching ProjectManagerView.jsx / ProjectManagement.jsx
  const getStatusTrackClass = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 border-emerald-200';
      case 'In Progress': return 'bg-indigo-100 border-indigo-200';
      case 'On Hold': return 'bg-amber-100 border-amber-200';
      default: return 'bg-slate-100 border-slate-200';
    }
  };
  const getStatusFillClass = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500';
      case 'In Progress': return 'bg-indigo-500';
      case 'On Hold': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  const kpis = [
    { label: 'Total Projects', value: totalProjects },
    { label: 'Active Projects', value: activeProjects },
    { label: 'Completed Projects', value: completedProjects },
    { label: 'Delayed Projects', value: delayedProjects },
    { label: 'Pending Tasks', value: pendingTasks },
    { label: 'Completed Tasks', value: completedTasks },
    { label: 'Budget Utilization', value: `${budgetUtilization}%` },
    { label: 'Team Size', value: users.length }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-200">
        <h2 className="text-lg font-normal flex items-center gap-2">
          <LayoutDashboard className="text-slate-400" />
          <span>Project Manager Dashboard</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1 font-normal">System statistics, budget utilization trackers, and logs synced in real-time with the database.</p>
      </div>

      {/* KPI Cards Grid */}
      <KpiCardGrid>
        {kpis.map((kpi, idx) => (
          <KpiCard key={idx} label={kpi.label} value={kpi.value} badge="Database" />
        ))}
      </KpiCardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-normal text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-2">
              <Activity size={16} className="text-slate-500" />
              <span>Project Portfolios Progress & Health</span>
            </h3>

            <div className="space-y-4">
              {projects.map((p, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-sm font-normal">
                    <span className="text-slate-700">{p.name}</span>
                    <span className="text-slate-500">{p.progress || 0}% Complete</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-400"
                      style={{ width: `${p.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-6">No projects found in the database.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="font-normal text-slate-500 text-sm uppercase tracking-wider">Budget Spent vs Remaining</h4>
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="space-y-1.5 text-sm">
                  <div>
                    <span className="w-2 h-2 inline-block rounded-full bg-slate-500 mr-2"></span>
                    <span className="text-slate-500">Allocated Spent:</span>
                    <div className="font-normal text-slate-800 ml-4">TZS {spentBudget.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="w-2 h-2 inline-block rounded-full bg-slate-300 mr-2"></span>
                    <span className="text-slate-500">Remaining Limit:</span>
                    <div className="font-normal text-slate-800 ml-4">TZS {(totalBudget - spentBudget).toLocaleString()}</div>
                  </div>
                </div>
                {/* Simulated circle SVG */}
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-100" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-slate-500" strokeDasharray={`${budgetUtilization}, 100`} strokeWidth="2.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <span className="absolute text-sm font-normal text-slate-700">{budgetUtilization}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="font-normal text-slate-500 text-sm uppercase tracking-wider">Task Completion Rate</h4>
              <div className="space-y-3 py-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Completed Tasks:</span>
                  <span className="font-normal text-slate-800">{completedTasks}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-500">Pending Actions:</span>
                  <span className="font-normal text-slate-700">{pendingTasks}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-500 h-full" style={{ width: `${allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recent Activity & Deadlines */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-normal text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileClock size={16} className="text-slate-500" />
              <span>Database Activity Log</span>
            </h3>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-normal text-slate-700 truncate">{act.title}</div>
                    <p className="text-slate-400 text-xs truncate mt-0.5">{act.desc}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono shrink-0">{act.time}</span>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-6">No recent database operations registered.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-normal text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock size={16} className="text-slate-400" />
              <span>Upcoming Project Milestones</span>
            </h3>

            <div className="divide-y divide-slate-100 text-sm">
              {upcomingDeadlines.map((proj, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center">
                  <div>
                    <div className="font-normal text-slate-800">{proj.name}</div>
                    <span className="text-xs text-slate-400">Deadline: {proj.endDate}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-normal uppercase bg-slate-100 text-slate-600 border border-slate-200">Milestone</span>
                </div>
              ))}
              {upcomingDeadlines.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-4">No upcoming milestones found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Project Timeline (Gantt-style overview of overlapping project windows) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="font-normal text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-2">
          <Calendar size={16} className="text-slate-500" />
          <span>Project Timeline</span>
        </h3>

        {timelineProjects.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-3">
              {timelineProjects.map((p, idx) => {
                const startMs = new Date(p.startDate).getTime();
                const endMs = new Date(p.endDate).getTime();
                const leftPct = ((startMs - timelineStart.getTime()) / timelineSpanMs) * 100;
                const widthPct = Math.max(((endMs - startMs) / timelineSpanMs) * 100, 2);

                return (
                  <div key={p.id || idx} className="flex items-center gap-3">
                    <span className="w-28 md:w-36 shrink-0 truncate text-sm font-normal text-slate-700" title={p.name}>
                      {p.name}
                    </span>
                    <div className="relative flex-1 h-5 bg-slate-50 rounded-md">
                      <div
                        className={`absolute top-0 h-full rounded-md border overflow-hidden ${getStatusTrackClass(p.status)}`}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={`${p.name}: ${p.startDate} to ${p.endDate}`}
                      >
                        <div
                          className={`h-full rounded-md ${getStatusFillClass(p.status)}`}
                          style={{ width: `${p.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="w-9 shrink-0 text-right text-xs font-mono text-slate-400">{p.progress || 0}%</span>
                  </div>
                );
              })}
            </div>

            {/* Date-axis scale reference */}
            <div className="flex justify-between text-xs text-slate-400 font-mono pl-[7.5rem] md:pl-[9.5rem] pr-9 pt-1 border-t border-slate-100">
              <span>{timelineStart.toLocaleDateString()}</span>
              <span>{timelineEnd.toLocaleDateString()}</span>
            </div>

            {/* Status legend */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>Planning</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>In Progress</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>Completed</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>On Hold</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic text-center py-6">No project dates available to render a timeline.</p>
        )}
      </div>
    </div>
  );
}
