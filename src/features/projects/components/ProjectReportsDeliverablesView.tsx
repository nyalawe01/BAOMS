import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Search, Filter, ExternalLink, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProjectRecord, ProjectReportRecord } from '../types/project';
import { getAllReports } from '../services/projectService';

interface ProjectReportsDeliverablesViewProps {
  projects: ProjectRecord[];
}

export const ProjectReportsDeliverablesView: React.FC<ProjectReportsDeliverablesViewProps> = ({ projects }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ProjectReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [reportTypeFilter, setReportTypeFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAllReports({
          projectId: selectedProjectId,
          reportType: reportTypeFilter,
        });
        setReports(data);
      } catch (err) {
        console.error('Failed to load project reports:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedProjectId, reportTypeFilter]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        !searchQuery.trim() ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.projectName && r.projectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.projectCode && r.projectCode.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [reports, searchQuery]);

  const submittedCount = reports.filter((r) => r.status === 'submitted').length;
  const approvedCount = reports.filter((r) => r.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Metric Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Project Deliverables & Reports
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {reports.length}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Across all donor and progress cycles</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Awaiting Manager Review
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-800">
            {submittedCount}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Submissions requiring programmatic sign-off</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Approved & Verified Deliverables
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-800">
            {approvedCount}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Cleared for donor submission</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#374151] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deliverables by title, summary, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="h-3.5 w-3.5 text-[#374151]" />
            <span>Project:</span>
          </div>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode} - {p.name.substring(0, 24)}...
              </option>
            ))}
          </select>

          <select
            value={reportTypeFilter}
            onChange={(e) => setReportTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          >
            <option value="all">All Report Types</option>
            <option value="monthly">Monthly Progress</option>
            <option value="quarterly">Quarterly Report</option>
            <option value="annual">Annual Narrative</option>
            <option value="donor">Donor Deliverable</option>
            <option value="milestone">Milestone Report</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Deliverable Title</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4 text-center">Report Type</th>
                <th className="py-3 px-4">Reporting Period</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading project reports...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No project reports found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-[#374151] shrink-0" />
                        <span>{r.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                        {r.summary}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{r.projectName || 'Project'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{r.projectCode}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="capitalize text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {r.reportType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {r.reportingPeriodStart} — {r.reportingPeriodEnd}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {r.submittedByName}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                          r.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.status === 'submitted'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/projects/${r.projectId}`)}
                        className="h-7 text-xs px-2"
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
