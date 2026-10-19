import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Search, Filter, Mail, ExternalLink, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProjectMemberRecord, ProjectRecord } from '../types/project';
import { getAllTeamMembers } from '../services/projectService';

interface ProjectTeamViewProps {
  projects?: ProjectRecord[];
}

export const ProjectTeamView: React.FC<ProjectTeamViewProps> = ({ projects = [] }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [members, setMembers] = useState<ProjectMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAllTeamMembers({
          projectId: selectedProjectId,
          role: roleFilter,
        });
        setMembers(data);
      } catch (err) {
        console.error('Failed to load project team members:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedProjectId, roleFilter]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        !searchQuery.trim() ||
        m.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.projectName && m.projectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.projectCode && m.projectCode.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [members, searchQuery]);

  const coordinatorsCount = members.filter((m) => m.projectRole === 'coordinator').length;
  const officersCount = members.filter((m) => m.projectRole === 'officer').length;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Team Deployments
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {members.length}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Active personnel roles across programs</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Project Coordinators
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {coordinatorsCount}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Field leads responsible for activity delivery</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Project Officers & Specialists
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {officersCount}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">M&E, finance, and community officers</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#374151] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search team members by name, email, or project..."
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
            {(projects || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode} - {p.name.substring(0, 24)}...
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          >
            <option value="all">All Roles</option>
            <option value="manager">Project Manager</option>
            <option value="coordinator">Project Coordinator</option>
            <option value="officer">Project Officer</option>
            <option value="viewer">Viewer / Stakeholder</option>
          </select>
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Member & Contact</th>
                <th className="py-3 px-4">Assigned Project</th>
                <th className="py-3 px-4 text-center">Project Role</th>
                <th className="py-3 px-4 text-right">Assigned Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading team members...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No team members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#374151] shrink-0" />
                        <span>{m.userName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span>{m.userEmail}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{m.projectName || 'Project'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{m.projectCode}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                          m.projectRole === 'manager'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : m.projectRole === 'coordinator'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : m.projectRole === 'officer'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {m.projectRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {m.assignedAt ? new Date(m.assignedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/projects/${m.projectId}`)}
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
