import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wallet, Search, Filter, ExternalLink, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProjectRecord } from '../types/project';

interface ProjectBudgetsViewProps {
  projects: ProjectRecord[];
}

export const ProjectBudgetsView: React.FC<ProjectBudgetsViewProps> = ({ projects }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [funderFilter, setFunderFilter] = useState('all');

  const funders = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.funder) set.add(p.funder);
    });
    return Array.from(set);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.funder.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFunder = funderFilter === 'all' || p.funder === funderFilter;
      return matchSearch && matchFunder;
    });
  }, [projects, searchQuery, funderFilter]);

  const totalAllocated = useMemo(
    () => filteredProjects.reduce((s, p) => s + (p.budgetSummary?.totalAllocated || p.totalBudget || 0), 0),
    [filteredProjects]
  );
  const totalSpent = useMemo(
    () => filteredProjects.reduce((s, p) => s + (p.budgetSummary?.totalSpent || 0), 0),
    [filteredProjects]
  );
  const totalAvailable = useMemo(
    () => filteredProjects.reduce((s, p) => s + (p.budgetSummary?.balance || p.totalBudget || 0), 0),
    [filteredProjects]
  );

  return (
    <div className="space-y-6">
      {/* Metric Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Approved Program Portfolio
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            TZS {(totalAllocated / 1000000).toFixed(1)}M
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Across {filteredProjects.length} managed grant budgets</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recorded Expenditure
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            TZS {(totalSpent / 1000000).toFixed(1)}M
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">
            {totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) : 0}% aggregate burn rate
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Remaining Program Balance
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-800">
            TZS {(totalAvailable / 1000000).toFixed(1)}M
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Available for ongoing workplan activities</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#374151] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search project budgets by name, code, or donor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="h-3.5 w-3.5 text-[#374151]" />
            <span>Funding Partner:</span>
          </div>
          <select
            value={funderFilter}
            onChange={(e) => setFunderFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          >
            <option value="all">All Funding Partners</option>
            {funders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Project Budgets Ledger */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Project & Donor Grant</th>
                <th className="py-3 px-4 text-right">Approved Budget</th>
                <th className="py-3 px-4 text-right">Recognized Spend</th>
                <th className="py-3 px-4 text-right">Commitments</th>
                <th className="py-3 px-4 text-right">Remaining Balance</th>
                <th className="py-3 px-4 w-44">Burn Rate</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No project budget records found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const b = p.budgetSummary;
                  const alloc = b?.totalAllocated || p.totalBudget || 0;
                  const spent = b?.totalSpent || 0;
                  const committed = b?.totalCommitted || 0;
                  const balance = b?.balance ?? (alloc - spent);
                  const burnRate = b?.burnRatePercent || (alloc > 0 ? Math.round((spent / alloc) * 100) : 0);

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
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {p.currency} {alloc.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                        {p.currency} {spent.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 whitespace-nowrap">
                        {p.currency} {committed.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                        {p.currency} {balance.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className="font-semibold text-slate-700">{burnRate.toFixed(1)}%</span>
                          <span className="text-slate-400">Target 100%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              burnRate > 90
                                ? 'bg-rose-500'
                                : burnRate > 75
                                ? 'bg-amber-500'
                                : 'bg-[#D68904]'
                            }`}
                            style={{ width: `${Math.min(100, burnRate)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/projects/${p.id}`)}
                          className="h-7 text-xs px-2"
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
