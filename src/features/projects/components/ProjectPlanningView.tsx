import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Search, Filter, ExternalLink, Briefcase, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProjectRecord } from '../types/project';

interface ProjectPlanningViewProps {
  projects?: ProjectRecord[];
}

export const ProjectPlanningView: React.FC<ProjectPlanningViewProps> = ({ projects = [] }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProjects = useMemo(() => {
    return (projects || []).filter((p) => {
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.funder.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const planningCount = projects.filter((p) => p.status === 'planning').length;
  const activeCount = projects.filter((p) => p.status === 'active').length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Implementation Workplans
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {activeCount}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Programs in active delivery phase</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Planning & Design Phase
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-800">
            {planningCount}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Milestones being scoped with partners</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Completed Portfolios
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-800">
            {completedCount}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Successfully closed grant cycles</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#374151] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search workplans by project code, title, or donor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="h-3.5 w-3.5 text-[#374151]" />
            <span>Phase:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          >
            <option value="all">All Phases</option>
            <option value="planning">Planning & Design</option>
            <option value="active">Active Delivery</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Planning Timeline Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Project & Funder</th>
                <th className="py-3 px-4">Implementation Period</th>
                <th className="py-3 px-4 text-center">Duration</th>
                <th className="py-3 px-4">Assigned Team</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Workplan Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No project planning records found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const start = new Date(p.startDate);
                  const end = new Date(p.endDate);
                  const diffMonths = Math.max(
                    1,
                    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
                  );
                  const coordinator = p.members.find((m) => m.projectRole === 'coordinator');

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-[#374151] shrink-0" />
                          <span>{p.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {p.projectCode} • Partner: {p.funder}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#374151]" />
                          <span>{p.startDate} — {p.endDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {diffMonths} mos
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {coordinator?.userName || 'Team Assigned'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.members.length} team members
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                            p.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.status === 'planning'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : p.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/projects/${p.id}`)}
                          className="h-7 text-xs px-2.5"
                        >
                          Workspace <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
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
  );
};
