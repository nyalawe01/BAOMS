import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, Plus, Send, FileText, Briefcase, FileSpreadsheet, 
  Calendar, Clipboard, BookOpen, Shield, Trash2, ChevronRight, 
  Search, Check, X, ChevronDown, Bell, Upload, Download, Eye, 
  AlertCircle, MapPin, Mail, Phone, ShieldAlert, FileClock, DollarSign, 
  ExternalLink, Layers, Clock, Settings, Package, Activity, Info, TrendingUp, HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { Avatar } from '@/components/base/avatar/avatar';
import { ProgressBarHalfCircle } from '@/components/base/progress-indicators/progress-circles';
import { Illustration } from '@/components/shared-assets/illustrations';

// ============================================================================
// Helper utility to export files simulated client-side
// ============================================================================
const downloadFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

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
    desc: log.details || 'Workspace event triggered.',
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
                    <div className="font-normal text-slate-800 ml-4">KES {spentBudget.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="w-2 h-2 inline-block rounded-full bg-slate-300 mr-2"></span>
                    <span className="text-slate-500">Remaining Limit:</span>
                    <div className="font-normal text-slate-800 ml-4">KES {(totalBudget - spentBudget).toLocaleString()}</div>
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

// ============================================================================
// 2. PM PROJECTS VIEW
// ============================================================================
export function PMProjectsView() {
  const { projects, addProject, deleteProject, updateProject, users, projectFiles, budgets } = useProject();
  const [selectedProjId, setSelectedProjId] = useState(null);
  
  // Create Project Form State
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjBudget, setNewProjBudget] = useState('');
  const [newProjStart, setNewProjStart] = useState('');
  const [newProjEnd, setNewProjEnd] = useState('');
  const [newProjDonor, setNewProjDonor] = useState('UNICEF');
  const [newProjProgram, setNewProjProgram] = useState('Education Pillar');
  const [newProjLocation, setNewProjLocation] = useState('Nairobi Hub');
  
  const [filterStatus, setFilterStatus] = useState('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedProj = projects.find(p => p.id === selectedProjId);

  const handleCreateProj = (e) => {
    e.preventDefault();
    if (!newProjName || !newProjStart || !newProjEnd) return;

    addProject({
      name: newProjName,
      description: newProjDesc,
      budget: parseFloat(newProjBudget || 2000),
      startDate: newProjStart,
      endDate: newProjEnd,
      donor: newProjDonor,
      program: newProjProgram,
      location: newProjLocation,
      status: 'Planning'
    });

    setNewProjName('');
    setNewProjDesc('');
    setNewProjBudget('');
    Swal.fire('Workspace Spun Up!', `Initialized isolated workspace for "${newProjName}".`, 'success');
  };

  const handleArchivedProj = (projId) => {
    Swal.fire({
      title: 'Archive Project?',
      text: 'Mark this project workspace as archived?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      confirmButtonText: 'Yes, Archive'
    }).then((res) => {
      if (res.isConfirmed) {
        updateProject(projId, { status: 'On Hold' });
        Swal.fire('Archived!', 'Project workspace status changed to On Hold.', 'success');
      }
    });
  };

  const handleDeleteProj = (projId) => {
    Swal.fire({
      title: 'Delete Project Portfolio?',
      text: 'Are you sure? This will remove all files, budgets, and ledger items associated with this workspace.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete'
    }).then((res) => {
      if (res.isConfirmed) {
        deleteProject(projId);
        if (selectedProjId === projId) setSelectedProjId(null);
        Swal.fire('Deleted!', 'Workspace removed successfully.', 'success');
      }
    });
  };

  // Generate Report on selected project based on actual uploaded data
  const handleGenerateProjectReport = (proj) => {
    const projFilesList = projectFiles.filter(f => f.projectId === proj.id);
    const projBudgetList = budgets.filter(b => b.projectId === proj.id);
    const projTasks = proj.tasks || [];
    const assignedUsers = users.filter(u => (proj.assignedStaff || []).includes(u.id));

    const reportContent = `
BAOMS PROJECT STATUS SUMMARY REPORT
Generated On: ${new Date().toLocaleDateString()}
------------------------------------
Project Name: ${proj.name}
Description: ${proj.description || 'N/A'}
Program Class: ${proj.program || 'N/A'}
Donor/Sponsor: ${proj.donor || 'N/A'}
Work Location: ${proj.location || 'N/A'}
Start Date: ${proj.startDate}
End Date: ${proj.endDate}
Status: ${proj.status}
Overall Completion: ${proj.progress || 0}%

Budget Allocation: KES ${proj.budget?.toLocaleString() || 0}
Budget Items Registered: ${projBudgetList.length}

Tasks Overview:
Total Tasks: ${projTasks.length}
Completed Tasks: ${projTasks.filter(t => t.status === 'Completed').length}
Pending Tasks: ${projTasks.filter(t => t.status !== 'Completed').length}

Assigned Team Members:
${assignedUsers.map(u => `- ${u.name} (${u.role})`).join('\n') || 'None'}

Documents Uploaded:
${projFilesList.map(f => `- ${f.fileName} (Folder: /${f.folderPath})`).join('\n') || 'None'}
------------------------------------
EOF
`;
    downloadFile(`${proj.name.replace(/\s+/g, '_')}_Report.txt`, reportContent);
    Swal.fire('Report Generated', `Compiled data for "${proj.name}". Downloading txt format.`, 'success');
  };

  const filteredProjects = filterStatus === 'All' 
    ? projects 
    : projects.filter(p => p.status === filterStatus);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-sm font-normal text-slate-800">Projects Portfolios Hierarchy</h2>
          <p className="text-xs text-slate-400 font-normal">Initialize workspaces, allocate budgets, track progress indicators, and assign personnel.</p>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-normal transition-all"
        >
          <Plus size={14} />
          <span>Create Project Portfolio</span>
        </button>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <span className="font-normal text-slate-400">Filter Status:</span>
          {['All', 'Planning', 'In Progress', 'Completed', 'On Hold'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-lg border font-normal transition-all ${
                filterStatus === status 
                  ? 'bg-slate-900 border-slate-900 text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden select-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                <th className="p-3">Project ID</th>
                <th className="p-3">Project Name</th>
                <th className="p-3">Program</th>
                <th className="p-3">Budget</th>
                <th className="p-3">Status</th>
                <th className="p-3">Progress</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredProjects.map((proj, idx) => (
                <tr 
                  key={proj.id} 
                  className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedProjId === proj.id ? 'bg-slate-50' : ''}`}
                  onClick={() => { setSelectedProjId(proj.id); setIsModalOpen(true); }}
                >
                  <td className="p-3 font-mono text-[10px] text-slate-400">#{proj.id.substring(0,6) || idx+1}</td>
                  <td className="p-3 font-normal text-slate-800">{proj.name}</td>
                  <td className="p-3 text-slate-550 font-normal">{proj.program || 'Field Program'}</td>
                  <td className="p-3 font-normal text-slate-700">KES {proj.budget?.toLocaleString() || '0'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[8px] font-normal uppercase border bg-slate-50 text-slate-600 border-slate-200">
                      {proj.status}
                    </span>
                  </td>
                  <td className="p-3 font-normal text-slate-600">{proj.progress || 0}%</td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1.5">
                      <button 
                        onClick={() => handleArchivedProj(proj.id)}
                        className="p-1 hover:bg-slate-100 text-slate-600 rounded border border-slate-200"
                        title="Archive Project"
                      >
                        <Clock size={12} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProj(proj.id)}
                        className="p-1 hover:bg-slate-100 text-slate-500 rounded border border-slate-200"
                        title="Delete Project"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 italic font-normal">No project portfolios logged under this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POP-UP CENTER MODAL (REPLACING SIDE MODAL) */}
      {isModalOpen && selectedProj && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div>
                <h3 className="text-sm font-normal">{selectedProj.name}</h3>
                <span className="text-[10px] text-slate-400 font-normal">Project workspace overview</span>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setSelectedProjId(null); }} 
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 select-none bg-slate-50 text-xs text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-normal mb-1">Project Objectives</span>
                <p className="text-slate-600 leading-relaxed font-normal">{selectedProj.description || 'No description provided.'}</p>
              </div>

              {/* Data fields grid */}
              <div className="grid grid-cols-2 gap-3 bg-white border border-slate-200 rounded-lg p-3 font-normal">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-normal">Timeline Limit</span>
                  <span className="text-slate-700 block font-normal">{selectedProj.startDate} to {selectedProj.endDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-normal">Overall Progress</span>
                  <span className="text-slate-700 block font-normal">{selectedProj.progress || 0}% Complete</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-normal">Authorized Budget Limit</span>
                  <span className="text-slate-700 block font-normal">KES {selectedProj.budget?.toLocaleString() || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-normal">Donor Sponsors</span>
                  <span className="text-slate-700 block font-normal">{selectedProj.donor || 'UNICEF'}</span>
                </div>
              </div>

              {/* Team Members List */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-normal">Team Members Allocated</span>
                <div className="space-y-1.5">
                  {users.filter(u => (selectedProj.assignedStaff || []).includes(u.id)).map(member => (
                    <div key={member.id} className="flex justify-between items-center p-2 bg-white border border-slate-200 rounded">
                      <span className="text-slate-700 font-normal">{member.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{member.officeDetails?.position || member.role}</span>
                    </div>
                  ))}
                  {users.filter(u => (selectedProj.assignedStaff || []).includes(u.id)).length === 0 && (
                    <p className="text-slate-400 italic font-normal text-[11px]">No staff allocated to this project workspace.</p>
                  )}
                </div>
              </div>

              {/* Files / Folder Documents (Resources) */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-normal">Linked Folder Documents</span>
                <div className="space-y-1.5">
                  {projectFiles.filter(f => f.projectId === selectedProj.id).map(file => (
                    <div key={file.id} className="p-2 bg-white border border-slate-200 rounded flex justify-between items-center text-slate-700 font-normal">
                      <span>{file.fileName}</span>
                      <span className="text-[9px] text-slate-400 font-mono">/{file.folderPath}</span>
                    </div>
                  ))}
                  {projectFiles.filter(f => f.projectId === selectedProj.id).length === 0 && (
                    <p className="text-slate-400 italic font-normal text-[11px]">No synced document attachments linked.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <button
                onClick={() => handleGenerateProjectReport(selectedProj)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-normal transition-all"
              >
                Generate Report
              </button>
              <button
                onClick={() => { setIsModalOpen(false); setSelectedProjId(null); }}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-normal transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Creator Drawer popup */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-normal text-slate-800 text-sm flex items-center gap-2">
                <Plus className="text-slate-500" size={16} />
                <span>Initialize Workspace</span>
              </h3>
              <button onClick={() => setIsDrawerOpen(false)} className="p-1 hover:bg-slate-150 rounded text-slate-400"><X size={16} /></button>
            </div>

            <form onSubmit={(e) => { handleCreateProj(e); setIsDrawerOpen(false); }} className="space-y-3 text-xs font-normal">
              <div>
                <label className="block text-[10px] font-normal text-slate-400 uppercase mb-1">Project Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Website Redesign" 
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-800 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-normal text-slate-400 uppercase mb-1">Description / Objectives</label>
                <textarea 
                  placeholder="Goals & Description..." 
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-800 bg-slate-50/50"
                  rows="2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 font-normal">
                <div>
                  <label className="block text-[10px] font-normal text-slate-400 uppercase mb-1">Donor Sponsor</label>
                  <input 
                    type="text" 
                    value={newProjDonor}
                    onChange={(e) => setNewProjDonor(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-normal text-slate-400 uppercase mb-1">Budget Limit (KES)</label>
                  <input 
                    type="number" 
                    value={newProjBudget}
                    onChange={(e) => setNewProjBudget(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 font-normal">
                <div>
                  <label className="block text-[10px] font-normal text-slate-400 uppercase mb-1">Start Date</label>
                  <input 
                    type="date" 
                    required 
                    value={newProjStart}
                    onChange={(e) => setNewProjStart(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-normal text-slate-400 uppercase mb-1">End Date</label>
                  <input 
                    type="date" 
                    required 
                    value={newProjEnd}
                    onChange={(e) => setNewProjEnd(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-normal transition-all text-xs"
              >
                Initialize Project Workspace
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. PM TEAM MEMBERS VIEW (original 4, since Tasks was removed from sidebar)
// ============================================================================
export function PMTeamMembersView() {
  const { users, projects } = useProject();
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-800">Resource Personnel & Staff Workload</h2>
        <p className="text-xs text-slate-400 font-normal">View team availability, track task workload balances, and review contact directories.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search team member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 shadow-inner"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {filteredUsers.map(u => {
          const dept = u.officeDetails?.department || u.department || 'Operations';
          const activeProjCount = projects.filter(p => (p.assignedStaff || []).includes(u.id)).length;
          
          return (
            <div 
              key={u.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center text-center space-y-4 hover:border-slate-350 transition-all cursor-pointer select-none"
              onClick={() => setSelectedUser(u)}
            >
              <Avatar size="lg" src={u.avatar} alt={u.name} className="ring-1 ring-slate-100" />
              <div>
                <h4 className="font-normal text-slate-808 text-sm leading-tight">{u.name}</h4>
                <p className="text-slate-400 text-[10px] mt-0.5 font-normal">{u.officeDetails?.position || u.role}</p>
              </div>
              <div className="flex flex-col gap-1 w-full text-[10px] border-t border-slate-100 pt-3 font-normal">
                <div className="flex justify-between text-slate-550">
                  <span>Department</span>
                  <span className="text-slate-700">{dept}</span>
                </div>
                <div className="flex justify-between text-slate-550 pt-1.5">
                  <span>Projects</span>
                  <span className="text-slate-600">{activeProjCount} Assigned</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Popup */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Avatar size="sm" src={selectedUser.avatar} alt={selectedUser.name} />
                <div>
                  <h3 className="text-sm font-normal leading-none">{selectedUser.name}</h3>
                  <span className="text-[10px] text-slate-400 font-normal">{selectedUser.email}</span>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-4 text-xs bg-slate-50 max-h-[70vh] overflow-y-auto font-normal">
              <div className="space-y-2">
                <h5 className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">Contact & Performance</h5>
                <div className="grid grid-cols-2 gap-3 bg-white border border-slate-200 rounded-lg p-3">
                  <div>
                    <span className="text-slate-400 block font-normal">Phone Contact</span>
                    <span className="text-slate-700 font-normal">{selectedUser.phone || selectedUser.personalDetails?.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-405 block font-normal">Department</span>
                    <span className="text-slate-700 font-normal">{selectedUser.officeDetails?.department || selectedUser.department || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-405 block font-normal">Hire Date</span>
                    <span className="text-slate-700 font-normal">{selectedUser.officeDetails?.hireDate || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-405 block font-normal">Status</span>
                    <span className="text-slate-600 font-normal">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 7. PM BUDGET & FINANCE VIEW (categorized per-project)
// ============================================================================
export function PMBudgetFinanceView() {
  const { expenses, projects } = useProject();
  const [selectedProjId, setSelectedProjId] = useState(projects[0]?.id || '');

  const activeProj = projects.find(p => p.id === selectedProjId);
  const projExpenses = expenses.filter(e => e.projectId === selectedProjId);

  const totalBudget = activeProj ? activeProj.budget || 0 : 0;
  const totalSpent = projExpenses.filter(e => e.status === 'Approved').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const remaining = totalBudget - totalSpent;
  const pending = projExpenses.filter(e => e.status === 'Pending').reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-normal text-slate-800">Financial Ledger Tracker</h2>
          <p className="text-xs text-slate-400 font-normal">Review allocated budgets and expenses categorized per project.</p>
        </div>
        
        {/* Project Selector */}
        <div className="text-xs font-normal">
          <select
            value={selectedProjId}
            onChange={(e) => setSelectedProjId(e.target.value)}
            className="border border-slate-200 rounded px-2.5 py-1.5 bg-white text-xs font-normal focus:outline-none"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Project Budget Limit', value: `KES ${totalBudget.toLocaleString()}`, color: 'border-l-slate-400' },
          { label: 'Project Expenditures Spent', value: `KES ${totalSpent.toLocaleString()}`, color: 'border-l-slate-600' },
          { label: 'Remaining Cashflow', value: `KES ${remaining.toLocaleString()}`, color: 'border-l-slate-300' },
          { label: 'Pending Approvals', value: `KES ${pending.toLocaleString()}`, color: 'border-l-slate-200' }
        ].map((card, idx) => (
          <div key={idx} className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 ${card.color} flex flex-col justify-between`}>
            <span className="text-[9px] font-normal text-slate-500 uppercase tracking-widest">{card.label}</span>
            <span className="text-base font-normal text-slate-800 mt-2 block">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-normal text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
          <FileSpreadsheet size={16} className="text-slate-400" />
          <span>Operational Expenses Log Ledger ({activeProj ? activeProj.name : 'Selected Project'})</span>
        </h3>

        <div className="overflow-x-auto text-xs select-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                <th className="p-3">Expense Item</th>
                <th className="p-3">Category</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {projExpenses.map((exp, idx) => (
                <tr key={exp.id || idx} className="hover:bg-slate-50/50">
                  <td className="p-3 font-normal text-slate-800">{exp.description}</td>
                  <td className="p-3 text-slate-655 font-normal">{exp.category || 'Operations'}</td>
                  <td className="p-3 font-normal text-slate-700">KES {exp.amount?.toLocaleString()}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[8px] font-normal border uppercase bg-slate-50 text-slate-600 border-slate-200">
                      {exp.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
              {projExpenses.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-slate-400 italic font-normal">No expenses logged for this project workspace.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. PM RESOURCES VIEW (categorized per-project)
// ============================================================================
export function PMResourcesView() {
  const { projects } = useProject();
  const [selectedProjId, setSelectedProjId] = useState(projects[0]?.id || '');

  // State for inventory list grouped/allocated to projects
  const [resources, setResources] = useState([
    { id: 'r1', name: 'NGO Toyota Hilux 4x4', category: 'Vehicle', status: 'Available', owner: 'Mombasa Outpost', projectId: projects[0]?.id || '' },
    { id: 'r2', name: 'Dell XPS Project laptop', category: 'Computer', status: 'Assigned', owner: 'Paul Manager', projectId: projects[0]?.id || '' },
    { id: 'r3', name: 'Epson LCD Projector v3', category: 'Equipment', status: 'Maintenance', owner: 'Logistics Unit', projectId: projects[1]?.id || '' },
    { id: 'r4', name: 'PA System Speakers Kit', category: 'Equipment', status: 'Available', owner: 'Nairobi Office', projectId: projects[1]?.id || '' }
  ]);

  const activeProj = projects.find(p => p.id === selectedProjId);
  const projResources = resources.filter(r => r.projectId === selectedProjId);

  const handleUpdateStatus = (id, newStatus) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    Swal.fire('Inventory Synced', 'Resource availability status updated.', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-normal text-slate-800">Resource Inventory & Logistics</h2>
          <p className="text-xs text-slate-400 font-normal">Track and assign shared equipment and materials categorized per project.</p>
        </div>

        {/* Project Selector */}
        <div className="text-xs font-normal">
          <select
            value={selectedProjId}
            onChange={(e) => setSelectedProjId(e.target.value)}
            className="border border-slate-200 rounded px-2.5 py-1.5 bg-white text-xs font-normal focus:outline-none"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resource Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="font-normal text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
          <Package size={16} className="text-slate-400" />
          <span>Active Logistics Equipment Register ({activeProj ? activeProj.name : 'Selected Project'})</span>
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                <th className="p-3">Resource Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned Owner</th>
                <th className="p-3 text-right">Toggle Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-normal">
              {projResources.map(res => (
                <tr key={res.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-normal text-slate-808">{res.name}</td>
                  <td className="p-3 text-slate-500 font-normal">{res.category}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[8px] font-normal uppercase border bg-slate-50 text-slate-655 border-slate-200">
                      {res.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-normal">{res.owner}</td>
                  <td className="p-3 text-right">
                    <select
                      value={res.status}
                      onChange={(e) => handleUpdateStatus(res.id, e.target.value)}
                      className="border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none text-xs font-normal"
                    >
                      <option value="Available">Available</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </td>
                </tr>
              ))}
              {projResources.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-400 italic font-normal">No resources allocated to this project workspace.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 10. PM DOCUMENTS VIEW (per-project, organizational, position-specific)
// ============================================================================
export function PMDocumentsView() {
  const { projectFiles, projects, addProjectFile } = useProject();
  const { user } = useAuth();
  
  const [selectedFolder, setSelectedFolder] = useState('Contracts');
  const [uploadName, setUploadName] = useState('');
  const [selectedProjId, setSelectedProjId] = useState(projects[0]?.id || '');

  // Mock document registries for Organization-Wide and Position-Specific tiers
  const organizationDocs = [
    { id: 'o1', title: 'NGO Employee Handbook & Code of Conduct v2.pdf', size: '2.4 MB', updated: '2026-05-12' },
    { id: 'o2', title: 'Data Privacy & Security Protocols.pdf', size: '1.8 MB', updated: '2026-06-01' }
  ];

  const positionDocs = [
    { id: 'p1', title: 'Project Management Budget Alignment Guidelines.pdf', size: '1.2 MB', updated: '2026-04-18', position: 'Project Manager' },
    { id: 'p2', title: 'HR Recruitment and Onboarding Policy.pdf', size: '2.1 MB', updated: '2026-03-25', position: 'HR Officer' }
  ].filter(doc => doc.position === (user?.officeDetails?.position || user?.role || 'Project Manager'));

  const filteredProjectFiles = projectFiles.filter(f => f.folderPath === selectedFolder && f.projectId === selectedProjId);

  const handleUpload = (e) => {
    e.preventDefault();
    if (!uploadName || !selectedProjId) return;

    addProjectFile(selectedProjId, uploadName, selectedFolder);
    setUploadName('');
    Swal.fire('File Saved!', `Successfully synced document file to directory folder: "/${selectedFolder}/${uploadName}".`, 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-normal text-slate-800">Structured File System Manager</h2>
          <p className="text-xs text-slate-400 font-normal">Organize legal contracts, proposals, and training documentation categorized per project, role, and organization.</p>
        </div>
      </div>

      {/* Row 1: Organization & Position Documents (Mandatory Reads) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none font-normal text-xs">
        {/* Organization-Wide Documents */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-normal text-slate-800 text-sm border-b border-slate-100 pb-2">
            Organization-Wide Required Documents
          </h3>
          <div className="space-y-2">
            {organizationDocs.map(doc => (
              <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center text-slate-700 font-normal">
                <div>
                  <span className="block font-normal">{doc.title}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Updated: {doc.updated} • Size: {doc.size}</span>
                </div>
                <button onClick={() => Swal.fire('Preview Mode', 'Opening organizational compliance file...', 'info')} className="p-1 hover:bg-slate-200 rounded text-slate-600 border border-slate-200">
                  <Eye size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Position-Specific Documents */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-normal text-slate-808 text-sm border-b border-slate-100 pb-2">
            Position-Specific Guidelines ({user?.officeDetails?.position || user?.role || 'Staff'})
          </h3>
          <div className="space-y-2">
            {positionDocs.map(doc => (
              <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center text-slate-700 font-normal">
                <div>
                  <span className="block font-normal">{doc.title}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Updated: {doc.updated} • Size: {doc.size}</span>
                </div>
                <button onClick={() => Swal.fire('Preview Mode', 'Opening role guideline guidelines...', 'info')} className="p-1 hover:bg-slate-200 rounded text-slate-600 border border-slate-200">
                  <Eye size={12} />
                </button>
              </div>
            ))}
            {positionDocs.length === 0 && (
              <p className="text-slate-400 italic text-[11px] py-4 text-center font-normal">No role-specific document references loaded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Per-Project Workspace Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Folders Selector */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-normal text-slate-800 text-sm">Project Workspace Folders</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Categorized per active project workspace</p>
          </div>

          <div className="space-y-3 font-normal text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Select Project</label>
              <select
                value={selectedProjId}
                onChange={(e) => setSelectedProjId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-white"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              {['Contracts', 'Proposals', 'Budgets', 'Reports'].map(folder => (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`w-full flex items-center justify-between py-2 px-3 rounded-lg font-normal transition-all ${
                    selectedFolder === folder 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>/{folder}</span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-3 pt-3 border-t border-slate-200 text-xs font-normal">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1 font-normal">Upload File Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Project_Audit_Specs.pdf" 
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-white"
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-normal transition-all"
            >
              Upload Project Document
            </button>
          </form>
        </div>

        {/* Project Files list */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-normal text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <BookOpen size={16} className="text-slate-400" />
            <span>Files In Folder: /{selectedFolder}</span>
          </h3>

          <div className="space-y-2 text-xs font-normal">
            {filteredProjectFiles.map(file => (
              <div key={file.id} className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center text-slate-700 font-normal">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-slate-400" />
                  <div>
                    <span className="font-normal block">{file.fileName}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">Uploaded by: {file.senderName || 'Manager'} • {file.uploadedAt || 'N/A'}</span>
                  </div>
                </div>
                <button onClick={() => Swal.fire('Downloaded!', 'File download initiated.', 'success')} className="p-1 hover:bg-slate-200 border border-slate-200 rounded text-slate-600">
                  <Download size={13} />
                </button>
              </div>
            ))}
            {filteredProjectFiles.length === 0 && (
              <p className="text-center py-12 text-slate-400 italic font-normal">No document attachments linked in folder.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 11. PM REPORTS VIEW
// ============================================================================
export function PMReportsView() {
  const [reportType, setReportType] = useState('Project Progress Report');

  const handleGenerate = (e) => {
    e.preventDefault();
    Swal.fire({
      title: 'Report Compiled!',
      text: `Successfully compiled and generated your "${reportType}".`,
      icon: 'success',
      confirmButtonColor: '#4f46e5'
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-800">NGO Reports Center</h2>
        <p className="text-xs text-slate-400 font-normal">Generate and export project progress, monthly activities, budgets, donor, or completion reports.</p>
      </div>

      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-normal text-slate-808 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
          <FileText size={16} className="text-slate-400" />
          <span>Report Generator</span>
        </h3>

        <form onSubmit={handleGenerate} className="space-y-4 text-xs font-normal">
          <div className="space-y-1">
            <label className="font-normal text-slate-500 block">Select Report Classification</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded bg-white"
            >
              <option value="Project Progress Report">Project Progress Report</option>
              <option value="Monthly Activities Report">Monthly Activities Report</option>
              <option value="Donor Funding Sponsor Report">Donor Funding Sponsor Report</option>
              <option value="Financial Budget Audit Report">Financial Budget Audit Report</option>
              <option value="Completion & Impact Evaluation Report">Completion & Impact Evaluation Report</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['PDF', 'Excel', 'Word'].map(fmt => (
              <button
                key={fmt}
                type="button"
                onClick={() => Swal.fire('Format Confirmed', `Export format configured: ${fmt}`, 'info')}
                className="py-2.5 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 font-normal"
              >
                Export as {fmt}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-normal transition-all shadow-sm"
          >
            Compile & Generate Report
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 12. PM MONITORING & EVALUATION (M&E) VIEW (Excel extraction uploader enabled)
// ============================================================================
export function PMMEView() {
  const [indicators, setIndicators] = useState([
    { id: '1', name: 'Children reached through feeding program', target: 500, actual: 420 },
    { id: '2', name: 'Youth trained in vocational tech skills', target: 150, actual: 162 },
    { id: '3', name: 'Indigenous trees planted in deforested areas', target: 2000, actual: 1850 },
    { id: '4', name: 'Outreach workshops conducted in rural Hubs', target: 20, actual: 18 }
  ]);

  const handleUpdateActual = (id, val) => {
    setIndicators(prev => prev.map(ind => ind.id === id ? { ...ind, actual: parseInt(val, 10) || 0 } : ind));
  };

  // Excel/CSV Document parser & data extraction
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    const isCsv = file.name.endsWith('.csv');
    
    reader.onload = (evt) => {
      try {
        if (isCsv) {
          // CSV Parser
          const text = evt.target.result;
          const lines = text.split('\n').map(l => l.split(','));
          const parsed = lines.slice(1).map((row, idx) => {
            if (row.length < 3) return null;
            return {
              id: String(idx + 1),
              name: row[0].replace(/"/g, '').trim(),
              target: parseInt(row[1], 10) || 100,
              actual: parseInt(row[2], 10) || 0
            };
          }).filter(Boolean);

          if (parsed.length > 0) {
            setIndicators(parsed);
            Swal.fire('Data Imported!', `Successfully parsed ${parsed.length} indicators from CSV document.`, 'success');
          }
        } else {
          // XLSX/XLS Excel Parser
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
          
          const parsed = json.slice(1).map((row, idx) => {
            if (row.length < 3) return null;
            return {
              id: String(idx + 1),
              name: String(row[0]).trim(),
              target: parseInt(row[1], 10) || 100,
              actual: parseInt(row[2], 10) || 0
            };
          }).filter(Boolean);

          if (parsed.length > 0) {
            setIndicators(parsed);
            Swal.fire('Excel Data Extracted!', `Successfully parsed ${parsed.length} indicators from sheet.`, 'success');
          }
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Extraction Failure', 'Failed to extract M&E data. Check structure (Header: Indicator, Target, Actual).', 'error');
      }
    };

    if (isCsv) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none font-normal text-xs text-slate-700">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-normal text-slate-800">Monitoring & Evaluation (M&E) Trackers</h2>
          <p className="text-xs text-slate-400 font-normal">Extract indicators and target actual achievements from Excel spreadsheets.</p>
        </div>
        
        {/* Excel/CSV File dropzone input */}
        <div>
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs cursor-pointer font-normal">
            <Upload size={12} />
            <span>Upload Indicator Sheet (.xlsx/.csv)</span>
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              onChange={handleExcelUpload}
            />
          </label>
        </div>
      </div>

      {/* Indicators Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="font-normal text-slate-855 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
          <Activity size={16} className="text-slate-400" />
          <span>Active Program Performance Indicators</span>
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                <th className="p-3">Performance Indicator</th>
                <th className="p-3">Target</th>
                <th className="p-3">Actual Achieved</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-normal text-slate-700">
              {indicators.map(ind => {
                const prog = Math.round((ind.actual / ind.target) * 100);
                const variance = ind.actual - ind.target;
                
                return (
                  <tr key={ind.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-normal text-slate-808">{ind.name}</td>
                    <td className="p-3 font-normal text-slate-500">{ind.target}</td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        value={ind.actual} 
                        onChange={(e) => handleUpdateActual(ind.id, e.target.value)}
                        className="w-20 px-2 py-1 border border-slate-200 rounded text-center text-xs font-normal"
                      />
                    </td>
                    <td className="p-3 font-normal text-slate-655">{prog}%</td>
                    <td className="p-3 font-normal text-slate-700">
                      {variance >= 0 ? `+${variance}` : variance}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 14. PM NOTIFICATIONS VIEW
// ============================================================================
export function PMNotificationsView() {
  const alerts = [
    { message: 'Deadline Tomorrow: Website redesign milestone due.', time: '1h ago', category: 'Urgent' },
    { message: 'Task Assigned: John allocated to Mombasa Port Assessment.', time: '3h ago', category: 'Task' },
    { message: 'Budget Approved: UNICEF grant funding ledger configured.', time: '1 day ago', category: 'Finance' },
    { message: 'Report Due: M&E baseline indicators update required.', time: '2 days ago', category: 'Reminder' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-800">Alert Center & Notifications</h2>
        <p className="text-xs text-slate-400 font-normal">Review real-time task triggers, project approvals, and deadline alerts.</p>
      </div>

      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-normal text-slate-808 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
          <Bell size={16} className="text-slate-400" />
          <span>Real-time alerts log</span>
        </h3>

        <div className="divide-y divide-slate-100 text-xs font-normal">
          {alerts.map((alert, idx) => (
            <div key={idx} className="py-3 flex justify-between items-center gap-4">
              <div>
                <p className="font-normal text-slate-808">{alert.message}</p>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-normal">{alert.time}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[8px] font-normal border uppercase shrink-0 bg-slate-100 text-slate-600 border-slate-200">
                {alert.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 15. PM SETTINGS VIEW
// ============================================================================
export function PMSettingsView() {
  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-805">Project Manager Settings</h2>
        <p className="text-xs text-slate-400 font-normal">Configure program pillars, location lists, donor databases, and task statuses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto select-none font-normal">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-normal text-slate-400 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">Project Classification</h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Pillar Programs</span>
              <span className="font-normal text-slate-700 block bg-slate-50 p-2.5 rounded border border-slate-200">Education Pillar, Nutrition Program, Environmental Pillar</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Donor Sponsorships</span>
              <span className="font-normal text-slate-700 block bg-slate-50 p-2.5 rounded border border-slate-200">UNICEF, Red Cross, USAID, Gates Foundation</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-normal text-slate-400 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">Work Locations</h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Configured Location Hubs</span>
              <span className="font-normal text-slate-700 block bg-slate-50 p-2.5 rounded border border-slate-200">Nairobi HQ, Kisumu Hub, Mombasa Outpost, Garissa Field Office</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
