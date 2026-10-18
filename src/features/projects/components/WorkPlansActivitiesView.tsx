import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, CheckSquare, MapPin, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ActivityRecord, ProjectRecord } from '../types/project';
import { getAllActivities, getProjects } from '../services/projectService';

interface WorkPlansActivitiesViewProps {
  projects?: ProjectRecord[];
  onOpenReviewModal?: (activity: ActivityRecord) => void;
}

export const WorkPlansActivitiesView: React.FC<WorkPlansActivitiesViewProps> = ({
  projects: initialProjects = [],
  onOpenReviewModal,
}) => {
  const navigate = useNavigate();
  const [projectList, setProjectList] = useState<ProjectRecord[]>(initialProjects);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (initialProjects && initialProjects.length > 0) {
      setProjectList(initialProjects);
    } else {
      getProjects().then((data) => setProjectList(data)).catch(console.error);
    }
  }, [initialProjects]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAllActivities({
          projectId: selectedProjectId,
          status: statusFilter,
          searchQuery,
        });
        setActivities(data);
      } catch (err) {
        console.error('Failed to load workplan activities:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedProjectId, statusFilter, searchQuery]);

  const totalParticipants = useMemo(
    () => activities.reduce((sum, a) => sum + (a.participantsCount || 0), 0),
    [activities]
  );
  const pendingReviews = useMemo(
    () => activities.filter((a) => a.submissionStatus === 'submitted').length,
    [activities]
  );

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Field Activities
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {activities.length}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Logged across all managed workplans</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Awaiting Manager Review
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-800">
            {pendingReviews}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Coordinator reports requiring sign-off</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Beneficiary Reach Recorded
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-800">
            {totalParticipants.toLocaleString()}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Community participants and youth reached</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#374151] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activities by title, location, or findings..."
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
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode} - {p.name.substring(0, 24)}...
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted (Awaiting Review)</option>
            <option value="approved">Approved & Verified</option>
            <option value="returned_for_correction">Returned for Correction</option>
            <option value="draft">Draft Workplans</option>
          </select>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Activity & Location</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4 text-right">Reach</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading workplan activities...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No field activities found matching your criteria.
                  </td>
                </tr>
              ) : (
                activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 line-clamp-1">{act.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-[#374151]" />
                        <span>{act.location || 'Field Site'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{act.projectName || 'Project'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{act.projectCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{act.submittedByName}</div>
                      <div className="text-[11px] text-slate-500">Coordinator</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {act.participantsCount} ppl
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                          act.submissionStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : act.submissionStatus === 'submitted'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : act.submissionStatus === 'returned_for_correction'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {act.submissionStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {act.activityDate}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/projects/${act.projectId}`)}
                          className="h-7 text-xs px-2"
                        >
                          Workspace <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                        {act.submissionStatus === 'submitted' && onOpenReviewModal && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => onOpenReviewModal(act)}
                            className="h-7 text-xs px-2.5"
                          >
                            <CheckSquare className="h-3 w-3 mr-1 text-white" /> Review
                          </Button>
                        )}
                      </div>
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
