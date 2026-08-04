import React from 'react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import Carousel from '../components/Carousel';
import { KpiCard, KpiCardGrid } from '../components/base/kpi-card/kpi-card';
import {
  TrendingUp,
  AlertCircle,
  Activity,
  Layers,
  CheckCircle2,
  Megaphone,
  CalendarClock
} from 'lucide-react';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function deadlineLabel(days) {
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: 'text-rose-600 bg-rose-50 border-rose-200' };
  if (days === 0) return { text: 'Today', tone: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (days <= 7) return { text: `In ${days}d`, tone: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { text: `In ${days}d`, tone: 'text-slate-600 bg-slate-100 border-slate-200' };
}

export default function OverviewDashboard() {
  const { projects, users, announcements, events } = useProject();
  const { user } = useAuth();

  const upcomingDeadlines = [
    ...projects
      .filter(p => p.status !== 'Completed' && p.endDate)
      .map(p => ({ id: `proj-${p.id}`, title: p.name, subtitle: 'Project deadline', date: p.endDate })),
    ...events
      .filter(e => e.date)
      .map(e => ({ id: `evt-${e.id}`, title: e.title, subtitle: e.location || 'Organization event', date: e.date }))
  ]
    .map(item => ({ ...item, days: daysUntil(item.date) }))
    .filter(item => item.days !== null)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  const recentAnnouncements = [...announcements]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 4);

  // Metrics calculation
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const planningProjects = projects.filter(p => p.status === 'Planning').length;
  const onHoldProjects = projects.filter(p => p.status === 'On Hold').length;

  const allTasks = projects.flatMap(p => p.tasks || []);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const efficiency = totalProjects > 0 ? Math.round((activeProjects + completedProjects) / totalProjects * 100) : 0;
  const efficiencyText = efficiency >= 80 ? 'Operational Efficiency High' : efficiency >= 50 ? 'Operational Efficiency Normal' : 'Operational Efficiency Low';

  // Minimalist Indicator Slides for Sequential Carousel
  const indicatorSlides = [
    // Slide 1: Project Distribution
    <div className="space-y-4 h-full flex flex-col justify-between" key="slide-1">
      <div>
        <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Project Portfolio Mix</h4>
        <p className="text-sm text-slate-400">Proportional representation of projects across different stages of execution.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 my-2">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-600 block">In Progress</span>
            <span className="text-lg font-medium text-slate-800">{activeProjects}</span>
          </div>
          <Activity size={20} className="text-slate-400" />
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-600 block">Completed</span>
            <span className="text-lg font-medium text-slate-800">{completedProjects}</span>
          </div>
          <CheckCircle2 size={20} className="text-slate-400" />
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-600 block">Planning</span>
            <span className="text-lg font-medium text-slate-800">{planningProjects}</span>
          </div>
          <Layers size={20} className="text-slate-400" />
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-600 block">On Hold</span>
            <span className="text-lg font-medium text-slate-800">{onHoldProjects}</span>
          </div>
          <AlertCircle size={20} className="text-slate-400" />
        </div>
      </div>

      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
        <div style={{ width: `${(activeProjects / (totalProjects || 1)) * 100}%` }} className="bg-slate-400 h-full" title="In Progress"></div>
        <div style={{ width: `${(completedProjects / (totalProjects || 1)) * 100}%` }} className="bg-slate-500 h-full" title="Completed"></div>
        <div style={{ width: `${(planningProjects / (totalProjects || 1)) * 100}%` }} className="bg-slate-300 h-full" title="Planning"></div>
        <div style={{ width: `${(onHoldProjects / (totalProjects || 1)) * 100}%` }} className="bg-slate-200 h-full" title="On Hold"></div>
      </div>
    </div>,

    // Slide 2: Task Allocation & Performance Index
    <div className="space-y-4 h-full flex flex-col justify-between" key="slide-2">
      <div>
        <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Task Execution Efficiency</h4>
        <p className="text-sm text-slate-400">Analysis of team delivery rate, highlighting completed vs pending workloads.</p>
      </div>

      <div className="flex items-end justify-between gap-6 my-2">
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-sm font-medium text-slate-600">
            <span>Completed Tasks</span>
            <span>{completedTasks} / {totalTasks}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              style={{ width: `${taskCompletionRate}%` }} 
              className="bg-slate-400 h-full rounded-full transition-all duration-300"
            ></div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-medium text-slate-805 block">{taskCompletionRate}%</span>
          <span className="text-xs text-slate-400 uppercase font-medium">Overall Score</span>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-sm text-slate-600 flex justify-around">
        <div className="text-center">
          <span className="block font-medium text-slate-800">{completedTasks}</span>
          <span className="text-slate-400 text-xs">Closed Tasks</span>
        </div>
        <div className="w-px bg-slate-200"></div>
        <div className="text-center">
          <span className="block font-medium text-slate-800">{pendingTasks}</span>
          <span className="text-slate-400 text-xs">Open Tasks</span>
        </div>
        <div className="w-px bg-slate-200"></div>
        <div className="text-center">
          <span className="block font-medium text-slate-800">
            {totalTasks > 0 ? (totalTasks / totalProjects).toFixed(1) : 0}
          </span>
          <span className="text-slate-400 text-xs">Avg Tasks / Project</span>
        </div>
      </div>
    </div>,

    // Slide 3: Priority Projects Overview
    <div className="space-y-4 h-full flex flex-col justify-between" key="slide-3">
      <div>
        <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Critical Portfolios</h4>
        <p className="text-sm text-slate-400">Snapshot of top-tier active initiatives and their respective development status.</p>
      </div>

      <div className="space-y-2.5 my-2">
        {projects.slice(0, 3).map((p) => (
          <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded border border-slate-200 transition-colors">
            <div className="truncate max-w-[180px]">
              <span className="font-medium text-sm text-slate-700 block truncate">{p.name}</span>
              <span className="text-xs text-slate-400 block truncate">{p.description}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-800">{p.progress}%</span>
              <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden">
                <div style={{ width: `${p.progress}%` }} className="bg-slate-400 h-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-right">
        <span className="text-xs font-medium text-slate-400">Showing first 3 items</span>
      </div>
    </div>
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Message */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-medium text-slate-800">Welcome Back, {user.name.split(' ')[0]}!</h2>
          <p className="text-slate-405 text-sm mt-1">Here is a summary of your organization's current status and portfolio activity.</p>
        </div>
        <div className="flex items-center gap-2 text-slate-650 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium self-start sm:self-center">
          <TrendingUp size={14} className="text-slate-500" />
          <span>{efficiencyText}</span>
        </div>
      </div>

      {/* Numerical Indicators Grid */}
      <KpiCardGrid>
        <KpiCard
          label="Total Managed Projects"
          value={totalProjects}
          tooltip="Total projects across every stage of execution"
          badge={`${activeProjects} active`}
        />
        <KpiCard
          label="Pending Tasks Action"
          value={pendingTasks}
          tooltip="Tasks not yet marked complete"
          badge={`${completedTasks} closed`}
        />
        <KpiCard
          label="Active Directory Members"
          value={users.length}
          tooltip="Staff assigned across authorization tiers"
        />
      </KpiCardGrid>

      {/* Main Content Layout (Stats + Sequential Indicator Carousel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Project Status Progress List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-medium text-slate-850 text-base mb-6">Active Initiatives Progress</h3>
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm text-slate-800">{project.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{project.description}</p>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium uppercase rounded border bg-slate-100 text-slate-600 border-slate-200">
                    {project.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${project.progress}%` }} 
                      className="h-full rounded-full bg-slate-400"
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-slate-605 min-w-[28px] text-right">
                    {project.progress}%
                  </span>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-6">No initiatives found in the database.</p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Sequential Indicator Dashboard Carousel */}
        <div className="lg:col-span-1 h-full">
          <Carousel
            slides={indicatorSlides}
            title="Sequential KPIs View"
          />
        </div>
      </div>

      {/* Announcements + Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Megaphone size={16} className="text-slate-500" />
            <h3 className="font-medium text-slate-800 text-base">Latest Announcements</h3>
          </div>
          <div className="space-y-4">
            {recentAnnouncements.map((ann) => (
              <div key={ann.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-semibold text-slate-800">{ann.title}</h4>
                  <span className="text-xs text-slate-400 shrink-0">{ann.publishedAt}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann.content}</p>
                <span className="text-xs text-slate-400 mt-1 block">— {ann.authorName}</span>
              </div>
            ))}
            {recentAnnouncements.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-6">No announcements published yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <CalendarClock size={16} className="text-slate-500" />
            <h3 className="font-medium text-slate-800 text-base">Upcoming Deadlines</h3>
          </div>
          <div className="space-y-3">
            {upcomingDeadlines.map((item) => {
              const label = deadlineLabel(item.days);
              return (
                <div key={item.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.subtitle} · {item.date}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${label.tone}`}>
                    {label.text}
                  </span>
                </div>
              );
            })}
            {upcomingDeadlines.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-6">Nothing on the horizon.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
