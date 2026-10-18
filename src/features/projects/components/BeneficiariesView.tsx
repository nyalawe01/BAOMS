import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search, Filter, MapPin, Calendar, Award } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ActivityRecord, ProjectRecord } from '../types/project';
import { getAllActivities } from '../services/projectService';

interface BeneficiariesViewProps {
  projects: ProjectRecord[];
}

export const BeneficiariesView: React.FC<BeneficiariesViewProps> = ({ projects }) => {
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
        console.error('Failed to load beneficiary outreach data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedProjectId, searchQuery]);

  const totalReach = useMemo(
    () => activities.reduce((sum, a) => sum + (a.participantsCount || 0), 0),
    [activities]
  );

  const locationsCount = useMemo(() => {
    const set = new Set<string>();
    activities.forEach((a) => {
      if (a.location) set.add(a.location.trim().toLowerCase());
    });
    return set.size;
  }, [activities]);

  const avgPerSession = useMemo(() => {
    if (activities.length === 0) return 0;
    return Math.round(totalReach / activities.length);
  }, [activities, totalReach]);

  return (
    <div className="space-y-6">
      {/* Metric Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Community Reach
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-800">
            {totalReach.toLocaleString()}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Verified participants across project forums</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Average Outreach per Activity
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {avgPerSession} participants
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Across {activities.length} recorded community events</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Target Field Locations & Wards
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {locationsCount}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Distinct community clusters served</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#374151] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search outreach records by location, event title, or coordinator..."
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
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode} - {p.name.substring(0, 24)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Beneficiary Outreach Log */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Activity Event & Location</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Facilitator / Lead</th>
                <th className="py-3 px-4 text-right">Participants Reached</th>
                <th className="py-3 px-4 text-right">Date Conducted</th>
                <th className="py-3 px-4 text-center">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading beneficiary outreach data...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No community outreach sessions recorded for the selected filter.
                  </td>
                </tr>
              ) : (
                activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 line-clamp-1">{act.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-[#374151]" />
                        <span>{act.location || 'Community Cluster'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{act.projectName || 'Project'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{act.projectCode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {act.submittedByName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {act.participantsCount} participants
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {act.activityDate}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                          act.submissionStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {act.submissionStatus === 'approved' ? 'Verified Reach' : 'Pending Review'}
                      </span>
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
