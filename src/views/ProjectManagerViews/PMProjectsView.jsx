import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Plus, Trash2, X, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

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
  const [newProjLocation, setNewProjLocation] = useState('Dar es Salaam Hub');

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

Budget Allocation: TZS ${proj.budget?.toLocaleString() || 0}
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
                  <td className="p-3 font-normal text-slate-700">TZS {proj.budget?.toLocaleString() || '0'}</td>
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
                  <span className="text-slate-700 block font-normal">TZS {selectedProj.budget?.toLocaleString() || 0}</span>
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
                  <label className="block text-[10px] font-normal text-slate-400 uppercase mb-1">Budget Limit (TZS)</label>
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
