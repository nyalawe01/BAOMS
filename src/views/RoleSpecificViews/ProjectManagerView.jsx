import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import {
  Users, FileText, Plus, Upload, X, FileCheck, Send, Layers, BookOpen, Search, LayoutDashboard, Eye, ShieldAlert
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Avatar } from "@/components/base/avatar/avatar";
import { Illustration } from "@/components/shared-assets/illustrations";
import { ProgressBarHalfCircle } from "@/components/base/progress-indicators/progress-circles";

export function ProjectManagerView() {
  const { 
    projects, 
    projectFiles, 
    addProject, 
    addProjectFile,
    updateProject,
    users,
    announcements,
    addAnnouncement,
    setActivePreviewDoc
  } = useProject();
  const { policyVault } = useAuth();
  
  const [activePmTab, setActivePmTab] = useState('workspace');
  
  // Workspace Creator & File Browser states
  const [selectedProjId, setSelectedProjId] = useState(projects[0]?.id || '');
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjBudget, setNewProjBudget] = useState('');
  const [newProjStart, setNewProjStart] = useState('');
  const [newProjEnd, setNewProjEnd] = useState('');
  const [activeFolder, setActiveFolder] = useState('Design');
  const [uploadFileName, setUploadFileName] = useState('');

  // Portfolio & Teams states
  const [editingProjId, setEditingProjId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editProgress, setEditProgress] = useState(0);
  const [selectedStaffToAssign, setSelectedStaffToAssign] = useState('');

  // Resource Directory states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Directives states
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [noticeType, setNoticeType] = useState('Milestone Delivery Directive');
  const [noticeNotes, setNoticeNotes] = useState('');

  // Sync selectedProjId if it's empty but projects exist
  useEffect(() => {
    if (!selectedProjId && projects.length > 0) {
      setSelectedProjId(projects[0].id);
    }
  }, [projects, selectedProjId]);

  const currentFiles = projectFiles.filter(f => f.projectId === selectedProjId && f.folderPath === activeFolder);
  const selectedProj = projects.find(p => p.id === selectedProjId);
  const progressVal = selectedProj ? selectedProj.progress || 0 : 0;

  const handleCreateProj = (e) => {
    e.preventDefault();
    if (!newProjName || !newProjStart || !newProjEnd) return;

    addProject({
      name: newProjName,
      description: newProjDesc,
      budget: parseFloat(newProjBudget || 2000),
      startDate: newProjStart,
      endDate: newProjEnd
    });

    setNewProjName('');
    setNewProjDesc('');
    setNewProjBudget('');
    Swal.fire('Workspace Spun Up!', `Initialized isolated workspace for "${newProjName}".`, 'success');
  };

  const handleFileUpload = (e) => {
    e.preventDefault();
    if (!uploadFileName || !selectedProjId) return;

    addProjectFile(selectedProjId, uploadFileName, activeFolder);
    setUploadFileName('');
    Swal.fire({
      title: 'File Uploaded!',
      text: `Successfully synced file to database storage path: "/${activeFolder}/${uploadFileName}".`,
      icon: 'success',
      confirmButtonColor: '#D68904'
    });
  };

  const handleUpdateProjectSettings = (e, projId) => {
    e.preventDefault();
    updateProject(projId, {
      status: editStatus,
      progress: parseInt(editProgress, 10) || 0
    });
    setEditingProjId(null);
    Swal.fire('Project Updated!', 'Successfully saved status and progress changes.', 'success');
  };

  const handleAssignStaff = (projId) => {
    if (!selectedStaffToAssign) return;
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    
    const currentStaff = proj.assignedStaff || [];
    if (currentStaff.includes(selectedStaffToAssign)) {
      Swal.fire('Already Assigned', 'This staff member is already assigned to the project.', 'warning');
      return;
    }

    const updatedStaff = [...currentStaff, selectedStaffToAssign];
    updateProject(projId, { assignedStaff: updatedStaff });
    setSelectedStaffToAssign('');
    Swal.fire('Personnel Assigned!', 'Successfully added team member to this project workspace.', 'success');
  };

  const handleUnassignStaff = (projId, staffId) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;

    const currentStaff = proj.assignedStaff || [];
    const updatedStaff = currentStaff.filter(id => id !== staffId);
    
    Swal.fire({
      title: 'Remove Team Member?',
      text: 'Are you sure you want to remove this member from the project?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, remove'
    }).then((result) => {
      if (result.isConfirmed) {
        updateProject(projId, { assignedStaff: updatedStaff });
        Swal.fire('Removed!', 'Personnel unassigned from the project.', 'success');
      }
    });
  };

  const handleSendDirective = (e) => {
    e.preventDefault();
    if (!selectedStaffId || !noticeNotes) {
      Swal.fire('Error', 'Please select a staff member and write your directive notes.', 'error');
      return;
    }
    const staff = users.find(u => u.id === selectedStaffId);
    addAnnouncement(noticeType, `${noticeNotes} (Directed to: ${staff ? staff.name : 'Staff'})`);
    Swal.fire({
      title: 'Project Directive Dispatched',
      text: `Successfully dispatched directive notice (${noticeType}) to ${staff ? staff.name : 'Staff'}.`,
      icon: 'success'
    });
    setSelectedStaffId('');
    setNoticeNotes('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub Tab Navigation */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        {[
          { id: 'workspace', label: 'Workspaces & Files', icon: FileText },
          { id: 'portfolio', label: 'Portfolio & Teams', icon: Layers },
          { id: 'directory', label: 'Resource Directory', icon: Users },
          { id: 'directives', label: 'Directives & Announcements', icon: Send },
          { id: 'templates', label: 'Templates & Policies', icon: BookOpen }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePmTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activePmTab === tab.id
                  ? 'bg-indigo-650 text-white shadow'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Workspaces & Files */}
      {activePmTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workspace Creator */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Plus className="text-indigo-500" size={16} />
              <span>Workspace Creator</span>
            </h3>

            <form onSubmit={handleCreateProj} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Project Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Zanzibar Port Assessment" 
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded text-sm text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Brief Objectives</label>
                <textarea 
                  placeholder="Objectives..." 
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded text-sm text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Starting Budget Limit (TZS)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 5000" 
                  value={newProjBudget}
                  onChange={(e) => setNewProjBudget(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded text-sm text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Start Date</label>
                  <input 
                    type="date" 
                    required 
                    value={newProjStart}
                    onChange={(e) => setNewProjStart(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-200 rounded text-sm text-slate-805 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">End Date</label>
                  <input 
                    type="date" 
                    required 
                    value={newProjEnd}
                    onChange={(e) => setNewProjEnd(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-200 rounded text-sm text-slate-805 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-semibold py-2.5 rounded text-sm transition-colors"
              >
                Initialize Project Workspace
              </button>
            </form>
          </div>

          {/* Structured File Browser */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FileCheck className="text-indigo-500" size={16} />
                <span>Advanced Structured File Browser</span>
              </h3>
              
              <div className="flex items-center gap-4 text-sm">
                {selectedProj && (
                  <div className="scale-75 origin-right translate-y-1.5">
                    <ProgressBarHalfCircle size="xxs" label="Done" value={progressVal} />
                  </div>
                )}
                <select 
                  value={selectedProjId}
                  onChange={(e) => setSelectedProjId(e.target.value)}
                  className="border border-slate-200 rounded px-3 py-1 bg-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Folder tabs */}
            <div className="flex border-b border-slate-150 gap-2">
              {['Design', 'Engineering', 'Audit', 'Reports'].map(folder => (
                <button
                  key={folder}
                  onClick={() => setActiveFolder(folder)}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                    activeFolder === folder 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  /{folder}
                </button>
              ))}
            </div>

            {/* File Upload Simulator */}
            <form onSubmit={handleFileUpload} className="flex gap-2">
              <input 
                type="text" 
                required
                placeholder="e.g. Website_Audit_Specs_v2.pdf" 
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                className="flex-1 px-3.5 py-2 border border-slate-200 rounded text-sm text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
              />
              <button 
                type="submit" 
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-2 px-4 rounded flex items-center gap-1.5"
              >
                <Upload size={13} />
                <span>Upload to /{activeFolder}</span>
              </button>
            </form>

            {/* Files List */}
            <div className="space-y-2">
              {currentFiles.map(file => (
                <div key={file.id} className="p-3 bg-slate-50 border border-slate-150 rounded flex justify-between items-center text-sm">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <FileText size={14} className="text-slate-400" />
                      <span>{file.fileName}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <Avatar 
                        size="xxs" 
                        src="https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80" 
                        alt={file.senderName} 
                        className="ring-1 ring-slate-100" 
                      />
                      <span>Sender: {file.senderName} ({file.senderOriginId}) • Uploaded: {new Date(file.uploadedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{file.size}</span>
                </div>
              ))}

              {currentFiles.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-sm">
                  <Illustration type="documents" size="xs" />
                  <p className="mt-2 italic">No files found in folder project "/{activeFolder}".</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Portfolio & Teams */}
      {activePmTab === 'portfolio' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((proj) => {
            const assignedIds = proj.assignedStaff || [];
            const assignedMembers = users.filter(u => assignedIds.includes(u.id));
            const unassignedMembers = users.filter(u => !assignedIds.includes(u.id) && u.role !== 'System Administrator');
            const isEditing = editingProjId === proj.id;

            return (
              <div key={proj.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base">{proj.name}</h4>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{proj.description}</p>
                      <span className="text-xs text-slate-400 font-semibold block mt-1">
                        Budget: TZS {proj.budget?.toLocaleString()} Limit • {proj.startDate} to {proj.endDate}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase border ${
                        proj.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        proj.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        proj.status === 'On Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {proj.status}
                      </span>
                      <span className="block text-sm font-extrabold text-slate-700 mt-1">{proj.progress}% Done</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-650 h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                  </div>

                  {/* Edit status/progress */}
                  {isEditing ? (
                    <form onSubmit={(e) => handleUpdateProjectSettings(e, proj.id)} className="bg-slate-50 border border-slate-150 rounded-lg p-3 space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full px-2 py-2 border border-slate-200 rounded bg-white text-sm"
                          >
                            <option value="Planning">Planning</option>
                            <option value="In Progress">In Progress</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Progress (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editProgress}
                            onChange={(e) => setEditProgress(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingProjId(null)}
                          className="px-3 py-1 text-slate-550 hover:bg-slate-200 rounded font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1 bg-indigo-650 text-white rounded font-semibold hover:bg-indigo-700"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setEditingProjId(proj.id);
                          setEditStatus(proj.status || 'Planning');
                          setEditProgress(proj.progress || 0);
                        }}
                        className="px-3.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded font-semibold text-xs"
                      >
                        Update Status/Progress
                      </button>
                    </div>
                  )}

                  {/* Team Assignment List */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Assigned Project Personnel</span>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                      {assignedMembers.map((member) => (
                        <div key={member.id} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded">
                          <div className="flex items-center gap-2">
                            <Avatar size="xs" src={member.avatar || 'https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80'} alt={member.name} />
                            <div className="text-sm">
                              <div className="font-bold text-slate-800">{member.name}</div>
                              <span className="text-xs text-slate-400">{member.officeDetails?.position || member.role}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnassignStaff(proj.id, member.id)}
                            className="text-xs text-rose-500 hover:bg-rose-50 border border-rose-100 px-2 py-0.5 rounded font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {assignedMembers.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-2.5">No team members assigned yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assign Personnel Form */}
                <div className="pt-3 mt-3 border-t border-slate-100 text-sm">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Assign Team Member</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedStaffToAssign}
                      onChange={(e) => setSelectedStaffToAssign(e.target.value)}
                      className="flex-1 px-3 py-2 rounded border border-slate-200 bg-white"
                    >
                      <option value="">Select Employee...</option>
                      {unassignedMembers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.officeDetails?.position || u.role})</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssignStaff(proj.id)}
                      className="bg-indigo-650 hover:bg-indigo-750 text-white px-3.5 py-2 rounded font-semibold text-xs"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {projects.length === 0 && (
            <div className="col-span-2 text-center text-slate-400 py-12 bg-white rounded-xl border border-slate-200">
              No projects found. Use the "Workspaces & Files" tab to create one.
            </div>
          )}
        </div>
      )}

      {/* Tab: Resource Directory */}
      {activePmTab === 'directory' && (
        <div className="space-y-6 relative animate-fadeIn">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
            />
          </div>

          {/* Staff Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {users.filter(u => 
              u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
              u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              u.role?.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(u => {
              const dept = u.officeDetails?.department || u.department || 'Operations';
              const uStatus = u.officeDetails?.status || u.status || 'Active';
              return (
                <div 
                  key={u.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center text-center space-y-4 hover:border-indigo-300 transition-all cursor-pointer"
                  onClick={() => setSelectedUser(u)}
                >
                  <Avatar size="lg" src={u.avatar} alt={u.name} className="ring-2 ring-slate-100" />
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base leading-tight">{u.name}</h4>
                    <p className="text-slate-400 text-xs mt-0.5">{u.officeDetails?.position || u.role}</p>
                  </div>
                  <div className="flex flex-col gap-1 w-full text-xs">
                    <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-455">
                      <span>Department</span>
                      <span className="font-bold text-slate-700">{dept}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-1.5 text-slate-455">
                      <span>Status</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        uStatus === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                        uStatus === 'Suspended' ? 'bg-rose-50 text-rose-700' :
                        uStatus === 'On Leave' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700'
                      }`}>
                        {uStatus}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected User Modal Popup */}
          {selectedUser && (
            <div 
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedUser(null)}
            >
              <div 
                className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Popup Header */}
                <div className="px-6 py-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between text-white shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar size="sm" src={selectedUser.avatar} alt={selectedUser.name} className="ring-1 ring-slate-700" />
                    <div>
                      <h3 className="font-extrabold text-base leading-none">{selectedUser.name}</h3>
                      <span className="text-xs text-slate-400">{selectedUser.email}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Popup Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 select-none no-scrollbar bg-slate-50">
                  {/* Profile Details Grid */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider">Personal Credentials</h5>
                    <div className="grid grid-cols-2 gap-3 text-sm bg-white border border-slate-200 rounded-lg p-3">
                      <div>
                        <span className="text-slate-400 block">Organization Email</span>
                        <span className="font-semibold text-slate-700 truncate block">{selectedUser.organizationEmail || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Phone Contact</span>
                        <span className="font-semibold text-slate-700">{selectedUser.phone || selectedUser.personalDetails?.phone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Work Location</span>
                        <span className="font-semibold text-slate-700">{selectedUser.officeDetails?.officeLocation || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Place of Living</span>
                        <span className="font-semibold text-slate-700">{selectedUser.personalDetails?.placeOfLiving || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Gender Type</span>
                        <span className="font-semibold text-slate-700">{selectedUser.personalDetails?.gender || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Date of Birth (DOB)</span>
                        <span className="font-semibold text-slate-700">{selectedUser.personalDetails?.dob || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Place of Birth</span>
                        <span className="font-semibold text-slate-700">{selectedUser.personalDetails?.placeOfBirth || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Disability Status</span>
                        <span className="font-semibold text-slate-700">
                          {selectedUser.personalDetails?.disability === 'Yes' 
                            ? `Yes (${selectedUser.personalDetails?.disabilityDescription || 'Specified'})`
                            : 'None'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Nationality</span>
                        <span className="font-semibold text-slate-700">{selectedUser.personalDetails?.nationality || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">National ID No</span>
                        <span className="font-semibold text-slate-700">{selectedUser.personalId || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Office Details */}
                  <div className="space-y-2 pt-2 border-t border-slate-150">
                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider">Office Description</h5>
                    <div className="grid grid-cols-2 gap-3 text-sm bg-white border border-slate-200 rounded-lg p-3">
                      <div>
                        <span className="text-slate-400 block">Department Unit</span>
                        <span className="font-semibold text-slate-700">{selectedUser.officeDetails?.department || selectedUser.department || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Current Designation</span>
                        <span className="font-semibold text-slate-700">{selectedUser.officeDetails?.position || selectedUser.role || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Hire / Start Date</span>
                        <span className="font-semibold text-slate-700">{selectedUser.officeDetails?.hireDate || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Office Location</span>
                        <span className="font-semibold text-slate-700">{selectedUser.officeDetails?.officeLocation || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attached Supporting Documents */}
                  <div className="space-y-2 pt-2 border-t border-slate-150">
                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider">Attached Supporting Documents</h5>
                    <div className="space-y-2 text-sm">
                      {[
                        { key: 'cv', name: 'Curriculum Vitae (CV)' },
                        { key: 'certificates', name: 'Academic Certificates' },
                        { key: 'contract', name: 'Employment Agreement Contract' }
                      ].map((docItem) => {
                        const attachedFile = selectedUser.supportingDocuments?.[docItem.key];
                        return (
                          <div key={docItem.key} className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-2.5 hover:border-slate-350 transition-all">
                            <span className="font-medium text-slate-755 truncate max-w-[200px]">{docItem.name}</span>
                            <div className="flex items-center gap-1.5">
                              {attachedFile ? (
                                <>
                                  <span className="text-xs text-slate-400 font-mono truncate max-w-[100px]">Attachment File</span>
                                  <button 
                                    onClick={() => setActivePreviewDoc({ fileName: docItem.name, dataUrl: attachedFile })}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-750 hover:text-slate-900"
                                    title="Preview document"
                                  >
                                    <Eye size={13} />
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Not Attached</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Popup Footer */}
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-semibold rounded-lg transition-all"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Directives & Announcements */}
      {activePmTab === 'directives' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
          {/* Left: Project Bulletins */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <LayoutDashboard size={16} className="text-indigo-500" />
                <span>Project Bulletin & Announcements</span>
              </h3>
              <p className="text-xs text-slate-400">Review announcements and board circulars broadcasted to all staff.</p>
            </div>

            <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
              {announcements.map(ann => (
                <div key={ann.id} className="py-3 text-sm space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-800">{ann.title}</span>
                    <span className="text-xs text-slate-400 font-mono">{new Date(ann.publishedAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-650 leading-relaxed text-xs">{ann.content}</p>
                  <div className="text-xs text-slate-400">Author: {ann.authorName || 'Management'}</div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">No bulletins found.</div>
              )}
            </div>
          </div>

          {/* Right: Dispatch Project Directive */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-500" />
                <span>Dispatch Project Directive / Alert Notice</span>
              </h3>
              <p className="text-xs text-slate-400">Issue direct task reminders, milestones alerts, or compliance warnings to resources.</p>
            </div>

            <form onSubmit={handleSendDirective} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 block">Select Target Resource</label>
                <select 
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">Select Employee...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.officeDetails?.position || u.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 block">Directive Type</label>
                <select 
                  value={noticeType}
                  onChange={(e) => setNoticeType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Milestone Delivery Directive">Milestone Delivery Directive</option>
                  <option value="Compliance Disciplinary Warning">Compliance Disciplinary Warning</option>
                  <option value="Task Overdue Reminder">Task Overdue Reminder</option>
                  <option value="Budget Compliance Warning">Budget Compliance Warning</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 block">Directive Description Notes</label>
                <textarea 
                  value={noticeNotes}
                  onChange={(e) => setNoticeNotes(e.target.value)}
                  placeholder="Type the formal instruction details..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 h-24"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Send size={13} />
                <span>Send Directive</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Templates & Policies */}
      {activePmTab === 'templates' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {policyVault.map((docItem, idx) => (
              <div key={docItem.id || idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all">
                <div className="flex gap-3 items-start">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
                    <BookOpen size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-slate-800 text-sm truncate max-w-[180px]">{docItem.title}</h4>
                    <span className="text-xs text-slate-455 block">{docItem.category} • {docItem.size || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Updated: {docItem.updated || 'N/A'}</span>
                  <button
                    onClick={() => setActivePreviewDoc({ fileName: docItem.title, fileSize: docItem.size })}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Open Document
                  </button>
                </div>
              </div>
            ))}
            {policyVault.length === 0 && (
              <div className="col-span-3 text-center text-slate-400 py-12 bg-white rounded-xl border border-slate-200">
                No templates or policy documents found in the vault.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
