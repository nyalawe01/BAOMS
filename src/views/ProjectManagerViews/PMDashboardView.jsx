import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { LayoutDashboard, Activity, FileClock, Clock } from 'lucide-react';

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
        <p className="text-slate-400 text-xs mt-1 font-normal">System statistics, budget utilization trackers, and logs synced in real-time with the database.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
            <span className="text-[10px] font-normal text-slate-500 uppercase tracking-wider">{kpi.label}</span>
            <div className="flex justify-between items-center mt-3">
              <span className="text-xl font-normal text-slate-800">{kpi.value}</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-normal border bg-slate-100 text-slate-600 border-slate-200">Database</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-normal text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <Activity size={16} className="text-slate-500" />
              <span>Project Portfolios Progress & Health</span>
            </h3>

            <div className="space-y-4">
              {projects.map((p, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-normal">
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
                <p className="text-xs text-slate-400 italic text-center py-6">No projects found in the database.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="font-normal text-slate-500 text-xs uppercase tracking-wider">Budget Spent vs Remaining</h4>
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="space-y-1.5 text-xs">
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
                  <span className="absolute text-xs font-normal text-slate-700">{budgetUtilization}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="font-normal text-slate-500 text-xs uppercase tracking-wider">Task Completion Rate</h4>
              <div className="space-y-3 py-2 text-xs">
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
            <h3 className="font-normal text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileClock size={16} className="text-slate-500" />
              <span>Database Activity Log</span>
            </h3>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-normal text-slate-700 truncate">{act.title}</div>
                    <p className="text-slate-400 text-[10px] truncate mt-0.5">{act.desc}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono shrink-0">{act.time}</span>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">No recent database operations registered.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-normal text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock size={16} className="text-slate-400" />
              <span>Upcoming Project Milestones</span>
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {upcomingDeadlines.map((proj, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center">
                  <div>
                    <div className="font-normal text-slate-800">{proj.name}</div>
                    <span className="text-[10px] text-slate-400">Deadline: {proj.endDate}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-normal uppercase bg-slate-100 text-slate-600 border border-slate-200">Milestone</span>
                </div>
              ))}
              {upcomingDeadlines.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">No upcoming milestones found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
