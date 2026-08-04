import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import {
  Clock, AlertTriangle
} from 'lucide-react';

export function VolunteerLoggerView() {
  const { user } = useAuth();
  const { projects, logTaskHours } = useProject();

  const internEndDate = user?.internPlacement?.endDate;
  const internCountdown = internEndDate
    ? Math.max(0, Math.floor((new Date(internEndDate).getTime() - Date.now()) / 1000))
    : null;
  const [selectedProj, setSelectedProj] = useState(projects[0]?.id || '');
  const [selectedTask, setSelectedTask] = useState('');
  const [logHrs, setLogHrs] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [success, setSuccess] = useState(false);

  const activeProject = projects.find(p => p.id === selectedProj);

  const handleTimeSubmit = (e) => {
    e.preventDefault();
    if (!selectedProj || !selectedTask || !logHrs || !logNotes) return;

    logTaskHours(selectedProj, selectedTask, logHrs, logNotes);
    setLogHrs('');
    setLogNotes('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="text-indigo-400" />
            <span>Simplified Task Logger</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">Log volunteer hours, record placement notes, and track supervisors assigned to your placement.</p>
        </div>

        {/* Intern placement countdown timer */}
        {user?.role === 'Intern' && (
          <div className="bg-indigo-900/50 border border-indigo-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="text-yellow-500 animate-pulse" size={20} />
            <div>
              <span className="text-xs text-slate-300 block font-bold uppercase tracking-wider">Internship placement Countdown</span>
              <span className="text-base font-mono font-extrabold text-white">
                {internCountdown !== null ? `${Math.floor(internCountdown / 60)}m ${internCountdown % 60}s` : 'Not configured'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Log Hours Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-bold text-slate-800 text-base">Log Workspace Hours</h3>
          
          <form onSubmit={handleTimeSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Project</label>
              <select 
                value={selectedProj} 
                onChange={(e) => setSelectedProj(e.target.value)}
                className="w-full px-2 py-2 border border-slate-200 rounded text-sm text-slate-800 bg-white"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Task Deliverable</label>
              <select 
                value={selectedTask} 
                onChange={(e) => setSelectedTask(e.target.value)}
                className="w-full px-2 py-2 border border-slate-200 rounded text-sm text-slate-800 bg-white"
              >
                <option value="">Select Task...</option>
                {activeProject?.tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hours Logged</label>
                <input 
                  type="number" 
                  step="0.5"
                  required
                  placeholder="Hrs" 
                  value={logHrs} 
                  onChange={(e) => setLogHrs(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded text-sm text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Log Notes</label>
              <textarea 
                required 
                placeholder="Details of what was accomplished..." 
                value={logNotes} 
                onChange={(e) => setLogNotes(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded text-sm text-slate-800"
                rows="2"
              />
            </div>

            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded text-sm">Log Hours</button>
          </form>

          {success && (
            <div className="bg-emerald-50 border border-emerald-250 p-2.5 rounded text-sm text-emerald-800 font-bold">
              Time logged successfully. Added to task logs.
            </div>
          )}
        </div>

        {/* Task Log Details & Intern Metadata */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-2">
          {user?.role === 'Intern' && (
            <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 flex items-center justify-between text-sm text-slate-700">
              <div>
                <span className="block font-bold text-indigo-900">Internship Supervisor</span>
                <span>
                  {user.internPlacement
                    ? `${user.internPlacement.supervisorName} (${user.internPlacement.supervisorId})`
                    : 'Not yet assigned'}
                </span>
              </div>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded uppercase">
                {user.internPlacement ? 'Linked' : 'Pending'}
              </span>
            </div>
          )}

          <h3 className="font-bold text-slate-800 text-base">Hour Logging History</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {activeProject?.tasks.flatMap(t => 
              (t.loggedTime || []).map((l, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-150 rounded text-sm space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-800">Task: {t.title}</span>
                    <span className="text-indigo-600">{l.hours} Hours</span>
                  </div>
                  <p className="text-slate-600 text-xs">Notes: {l.notes}</p>
                  <span className="text-xs text-slate-400 block font-mono">Logged by: {l.loggedBy} on {l.date}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
