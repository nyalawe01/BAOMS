import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Briefcase, ExternalLink, Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  getProjectFinancialTracking,
  ProjectFinancialMetric,
} from '../services/financeService';

export const ProjectFinancialTrackingView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectFinancialMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [funderFilter, setFunderFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getProjectFinancialTracking();
        setProjects(data);
      } catch (err) {
        console.error('Failed to load project financial tracking:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
        p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.funder.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFunder = funderFilter === 'all' || p.funder === funderFilter;
      return matchSearch && matchFunder;
    });
  }, [projects, searchQuery, funderFilter]);

  const totalAllocated = useMemo(
    () => filteredProjects.reduce((s, p) => s + p.totalBudget, 0),
    [filteredProjects]
  );
  const totalSpent = useMemo(
    () => filteredProjects.reduce((s, p) => s + p.totalSpent, 0),
    [filteredProjects]
  );
  const totalAvailable = useMemo(
    () => filteredProjects.reduce((s, p) => s + p.availableBalance, 0),
    [filteredProjects]
  );

  return (
    <div className="space-y-6">
      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Project Allocations
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            TZS {(totalAllocated / 1000000).toFixed(1)}M
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Across {filteredProjects.length} active projects</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Project Disbursements
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            TZS {(totalSpent / 1000000).toFixed(1)}M
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">
            {totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) : 0}% aggregate utilization
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Remaining Project Balances
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-800">
            TZS {(totalAvailable / 1000000).toFixed(1)}M
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Unspent grant and program funds</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#374151] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by code, name, or funder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="h-3.5 w-3.5 text-[#374151]" />
            <span>Funder:</span>
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

      {/* Projects Financial Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Project & Funder</th>
                <th className="py-3 px-4 text-right">Allocated Budget</th>
                <th className="py-3 px-4 text-right">Actual Spent</th>
                <th className="py-3 px-4 text-right">Committed</th>
                <th className="py-3 px-4 text-right">Available Balance</th>
                <th className="py-3 px-4 w-44">Utilization Rate</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading project financial ledgers...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No project financial records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.projectId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-[#374151] shrink-0" />
                        <span>{p.projectName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {p.projectCode} • Partner: {p.funder}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      TZS {p.totalBudget.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                      TZS {p.totalSpent.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 whitespace-nowrap">
                      TZS {p.totalCommitted.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                      TZS {p.availableBalance.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="font-semibold text-slate-700">{p.utilizationRate}%</span>
                        <span className="text-slate-400">{p.requisitionsCount} reqs</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            p.utilizationRate > 90
                              ? 'bg-rose-500'
                              : p.utilizationRate > 75
                              ? 'bg-amber-500'
                              : 'bg-[#D68904]'
                          }`}
                          style={{ width: `${Math.min(100, p.utilizationRate)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/projects/${p.projectId}`)}
                        className="text-xs h-7 px-2"
                      >
                        Workspace <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
