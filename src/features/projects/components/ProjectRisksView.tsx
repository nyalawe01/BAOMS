import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Search, Filter, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Chip } from '@/components/ui/Chip';
import { ActivityRecord, ProjectRecord } from '../types/project';
import { getAllActivities } from '../services/projectService';

interface ProjectRisksViewProps {
  projects?: ProjectRecord[];
}

export const ProjectRisksView: React.FC<ProjectRisksViewProps> = ({ projects = [] }) => {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAllActivities({
          projectId: selectedProjectId,
          searchQuery,
        });
        setActivities(data);
      } catch (err) {
        console.error('Failed to load project challenges & risks:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedProjectId, searchQuery]);

  // Extract activities that have operational challenges or risks documented
  const riskRecords = useMemo(() => {
    return activities
      .filter((a) => a.challenges && a.challenges.trim().length > 0)
      .map((a) => ({
        id: a.id,
        projectId: a.projectId,
        projectName: a.projectName,
        projectCode: a.projectCode,
        activityTitle: a.title,
        challenges: a.challenges as string,
        followUpActions: a.followUpActions || 'Pending mitigation plan',
        reportedBy: a.submittedByName || 'Coordinator',
        date: a.activityDate,
        status: a.submissionStatus === 'approved' ? 'mitigated' : 'under_review',
      }));
  }, [activities]);

  const filteredRisks = useMemo(() => {
    return riskRecords.filter((r) => {
      const matchSearch =
        !searchQuery.trim() ||
        r.challenges.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.followUpActions.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.projectName && r.projectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.activityTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [riskRecords, searchQuery]);

  const underReviewCount = riskRecords.filter((r) => r.status === 'under_review').length;
  const mitigatedCount = riskRecords.filter((r) => r.status === 'mitigated').length;

  return (
    <div className="space-y-6">
      {/* Metric Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Operational Challenges Logged
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {riskRecords.length}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Identified during field implementation</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Under Manager Review
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-800">
            {underReviewCount}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Awaiting mitigation verification</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Actioned & Addressed
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-800">
            {mitigatedCount}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Follow-up interventions executed</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#374151] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search risks, challenges, or mitigation steps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          />
        </div>

        <div className="flex items-center gap-2">
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
            {(projects || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode} - {p.name.substring(0, 24)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Risk & Issue Register */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <Table.ScrollContainer>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Project & Activity Context</th>
                <th className="py-3.5 px-4 w-1/3">Challenge & Operational Issue</th>
                <th className="py-3.5 px-4 w-1/3">Mitigation & Follow-up Actions</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Reported Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading project risks and challenges...
                  </td>
                </tr>
              ) : filteredRisks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No operational risks or challenges reported for this filter.
                  </td>
                </tr>
              ) : (
                filteredRisks.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{r.activityTitle}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {r.projectCode} • Reported by {r.reportedBy}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{r.challenges}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{r.followUpActions}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Chip
                        color={r.status === 'mitigated' ? 'success' : 'warning'}
                        variant="soft"
                        size="sm"
                      >
                        {r.status === 'mitigated' ? 'Intervention Approved' : 'Under Review'}
                      </Chip>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {r.date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Table.ScrollContainer>
      </div>
    </div>
  );
};
