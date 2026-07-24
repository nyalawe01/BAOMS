import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import Carousel from '../components/Carousel';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  User, 
  Trash2, 
  ListTodo, 
  AlertCircle,
  HelpCircle,
  FileText
} from 'lucide-react';

export default function ProjectManagement() {
  const { 
    projects, 
    users, 
    addProject, 
    updateProject, 
    deleteProject, 
    addTask, 
    updateTaskStatus 
  } = useProject();

  const { hasPermission, user: currentUser } = useAuth();

  // State
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectStart, setNewProjectStart] = useState('');
  const [newProjectEnd, setNewProjectEnd] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState('Planning');

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Handlers
  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProjectName || !newProjectStart || !newProjectEnd) return;
    
    addProject({
      name: newProjectName,
      description: newProjectDesc,
      startDate: newProjectStart,
      endDate: newProjectEnd,
      status: newProjectStatus,
      progress: 0
    });

    // Reset fields
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectStart('');
    setNewProjectEnd('');
    setNewProjectStatus('Planning');
    setShowAddProjectModal(false);

    // Auto-select newly created project
    if (projects.length > 0) {
      // The state updates asynchronously, so selecting the first one should work on next render
      // or we can select it after we know the ID.
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle || !selectedProjectId) return;

    addTask(selectedProjectId, {
      title: newTaskTitle,
      assignedToId: newTaskAssigneeId,
      status: 'Pending'
    });

    setNewTaskTitle('');
    setNewTaskAssigneeId('');
    setShowAddTaskModal(false);
  };

  const handleDeleteProject = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action is irreversible.')) {
      deleteProject(projectId);
      if (selectedProjectId === projectId) {
        const remaining = projects.filter(p => p.id !== projectId);
        setSelectedProjectId(remaining[0]?.id || null);
      }
    }
  };

  // Build Project Timeline Slides
  // We'll generate sequential milestone slides for the selected project
  const getTimelineSlides = (project) => {
    if (!project) return [];

    const phases = [
      {
        title: 'Phase 1: Alignment & Scope',
        desc: 'Define initial parameters, goals, metrics, and core authorization scopes.',
        date: project.startDate,
        status: project.progress >= 20 ? 'Completed' : 'Active'
      },
      {
        title: 'Phase 2: Architectural Blueprints',
        desc: 'Wireframing, schema planning, and system interface layouts.',
        date: 'Mid-term Milestone',
        status: project.progress >= 50 ? 'Completed' : project.progress >= 20 ? 'Active' : 'Pending'
      },
      {
        title: 'Phase 3: Alpha System Build',
        desc: 'Consolidated components assembly, mock state integration, and base CSS logic.',
        date: 'Mid-term Milestone',
        status: project.progress >= 80 ? 'Completed' : project.progress >= 50 ? 'Active' : 'Pending'
      },
      {
        title: 'Phase 4: Verification & Testing',
        desc: 'Validating role permissions, responsiveness audits, and functional stress testing.',
        date: 'Audit Stage',
        status: project.progress === 100 ? 'Completed' : project.progress >= 80 ? 'Active' : 'Pending'
      },
      {
        title: 'Phase 5: Release & Deployment',
        desc: 'Integration to main production servers, documentation freeze, and user onboarding.',
        date: project.endDate,
        status: project.progress === 100 ? 'Completed' : 'Pending'
      }
    ];

    return phases.map((phase, idx) => (
      <div key={idx} className="h-full flex flex-col justify-between p-2">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Milestone Stage</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
              phase.status === 'Completed' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : phase.status === 'Active'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}>
              {phase.status}
            </span>
          </div>
          
          <h4 className="text-base font-bold text-slate-800">{phase.title}</h4>
          <p className="text-xs text-slate-500 leading-relaxed">{phase.desc}</p>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <Calendar size={14} />
          <span>Timeline Target: {phase.date}</span>
        </div>
      </div>
    ));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Projects Sidebar (Left Col on Desktop) */}
      <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-10rem)] max-h-[700px] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-slate-500" />
            <h3 className="font-bold text-slate-800 text-sm">Projects List</h3>
          </div>
          {hasPermission('manage_projects') && (
            <button
              onClick={() => setShowAddProjectModal(true)}
              className="p-1 bg-brand-600 hover:bg-brand-500 text-white rounded transition-colors"
              title="New Project"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {projects.map((p) => {
            const isSelected = p.id === selectedProjectId;
            let statusDot = 'bg-slate-400';
            if (p.status === 'In Progress') statusDot = 'bg-blue-500';
            else if (p.status === 'Completed') statusDot = 'bg-emerald-500';
            else if (p.status === 'On Hold') statusDot = 'bg-amber-500';

            return (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  isSelected 
                    ? 'bg-slate-100 border border-slate-200' 
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-slate-800 truncate max-w-[70%]">{p.name}</h4>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">{p.status}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{p.description}</p>
                
                {/* Progress bar info */}
                <div className="flex items-center justify-between gap-3 mt-3">
                  <div className="flex-1 bg-slate-200 h-1 rounded-full overflow-hidden">
                    <div style={{ width: `${p.progress}%` }} className="bg-brand-500 h-full"></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">{p.progress}%</span>
                </div>
              </button>
            );
          })}

          {projects.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No projects available. Click the plus icon to add one.
            </div>
          )}
        </div>
      </div>

      {/* Project Details Panel (Right 2 Cols) */}
      <div className="lg:col-span-2 space-y-6">
        {selectedProject ? (
          <>
            {/* Meta Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-800">{selectedProject.name}</h2>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                      selectedProject.status === 'In Progress' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : selectedProject.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedProject.status === 'On Hold'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {selectedProject.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{selectedProject.description}</p>
                </div>
                
                {/* Admin Delete Action */}
                {hasPermission('manage_projects') && currentUser.role === 'Admin' && (
                  <button
                    onClick={() => handleDeleteProject(selectedProject.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Start Date</span>
                    <span className="text-slate-700 font-bold">{selectedProject.startDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">End Date</span>
                    <span className="text-slate-700 font-bold">{selectedProject.endDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Overall Completion</span>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div style={{ width: `${selectedProject.progress}%` }} className="bg-brand-500 h-full"></div>
                      </div>
                      <span className="text-slate-800 font-bold">{selectedProject.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sequential Timeline Carousel */}
            <div className="h-[320px]">
              <Carousel 
                slides={getTimelineSlides(selectedProject)} 
                title="Project Milestone Timeline" 
              />
            </div>

            {/* Task Management Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <ListTodo size={18} className="text-slate-500" />
                  <h3 className="font-bold text-slate-800 text-base">Project Tasks</h3>
                </div>
                {hasPermission('assign_tasks') && (
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Plus size={14} />
                    <span>Add Task</span>
                  </button>
                )}
              </div>

              {/* Task list table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pr-4">Task Details</th>
                      <th className="pb-3 px-4">Assigned Resource</th>
                      <th className="pb-3 px-4">Work Status</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {selectedProject.tasks.map((task) => {
                      // Status styling
                      let badge = 'bg-slate-50 text-slate-500 border-slate-200';
                      if (task.status === 'In Progress') badge = 'bg-blue-50 text-blue-700 border-blue-200';
                      else if (task.status === 'Completed') badge = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                      // Check if current user is assignee (Employee rule)
                      const isAssignedToCurrentUser = currentUser.name === task.assignedTo;

                      return (
                        <tr key={task.id} className="hover:bg-slate-50/50">
                          <td className="py-3 pr-4 font-semibold text-slate-800">{task.title}</td>
                          <td className="py-3 px-4 text-slate-500">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-slate-400" />
                              <span>{task.assignedTo}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badge}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="py-3 pl-4 text-right">
                            {/* Allow status change if:
                                1. User has permission update_task_status
                                2. Admin/Manager can update any status
                                3. Employee can update only if assigned to them
                            */}
                            {hasPermission('update_task_status') && (currentUser.role !== 'Employee' || isAssignedToCurrentUser) ? (
                              <select
                                value={task.status}
                                onChange={(e) => updateTaskStatus(selectedProject.id, task.id, e.target.value)}
                                className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs px-2 py-1 rounded outline-none transition-colors"
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Read-Only</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {selectedProject.tasks.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-slate-400 italic">
                          No tasks have been added to this project yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
            <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="font-bold text-slate-700 text-lg">No Project Selected</h3>
            <p className="text-sm mt-1 text-slate-400">Please select a project from the panel list to view timelines and task status.</p>
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-lg">Initialize New Initiative</h3>
              <button 
                onClick={() => setShowAddProjectModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. ERP Integration Phase 2"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Scope Description
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Summary of objectives..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newProjectStart}
                    onChange={(e) => setNewProjectStart(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Target End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newProjectEnd}
                    onChange={(e) => setNewProjectEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  System Status
                </label>
                <select
                  value={newProjectStatus}
                  onChange={(e) => setNewProjectStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-lg">Assign Project Task</h3>
              <button 
                onClick={() => setShowAddTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Audit API documentation endpoints"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Assign Resource
                </label>
                <select
                  required
                  value={newTaskAssigneeId}
                  onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="">Choose an employee...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role} - {u.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
