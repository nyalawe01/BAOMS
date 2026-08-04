import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import {
  Calendar
} from 'lucide-react';

export function ProgramOfficerView() {
  const { user } = useAuth();
  const { projects, addExpense } = useProject();
  
  // Activity Reporting Form State
  const [reportProjId, setReportProjId] = useState('');
  const [reportAmount, setReportAmount] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportFile, setReportFile] = useState('');
  const [submitStatus, setSubmitStatus] = useState(false);

  const assignedTasks = projects.flatMap(p => 
    p.tasks.filter(t => t.assignedTo === user.name).map(t => ({ ...t, projectName: p.name }))
  );

  const handleActivitySubmit = (e) => {
    e.preventDefault();
    if (!reportProjId || !reportAmount || !reportDesc) return;

    addExpense(reportProjId, reportAmount, reportDesc, undefined, reportFile);
    setReportAmount('');
    setReportDesc('');
    setReportFile('');
    setSubmitStatus(true);
    setTimeout(() => setSubmitStatus(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="text-indigo-400" />
          <span>My Tasks Calendar & Activity Reporting</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1">Review assigned milestone deliverables, record operational logs, and submit project expense claims.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Calendar Grid */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-bold text-slate-800 text-base">My Project Deliverables</h3>
          
          <div className="space-y-3">
            {assignedTasks.map(task => (
              <div key={task.id} className="p-3 bg-slate-50 border border-slate-150 rounded text-sm space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-800">{task.title}</span>
                  <span className="text-xs font-semibold text-indigo-600">{task.projectName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Status: {task.status}</span>
                  <span className="bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-indigo-700 font-bold uppercase">Assignee</span>
                </div>
              </div>
            ))}

            {assignedTasks.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-sm italic">
                No milestone deliverables currently assigned to your profile.
              </div>
            )}
          </div>
        </div>

        {/* Activity & Expense Claim form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-bold text-slate-800 text-base">Activity Reporting & Expenses claim form</h3>
          
          <form onSubmit={handleActivitySubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Related Project</label>
                <select 
                  required
                  value={reportProjId} 
                  onChange={(e) => setReportProjId(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-slate-800 bg-white"
                >
                  <option value="">Select Project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Expense Liability Amount (TZS)</label>
                <input 
                  type="number" 
                  required 
                  placeholder="e.g. 1500" 
                  value={reportAmount} 
                  onChange={(e) => setReportAmount(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Activity Log Description</label>
              <textarea 
                required 
                placeholder="Details of expense, activities, or travel logs..." 
                value={reportDesc} 
                onChange={(e) => setReportDesc(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm text-slate-800"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Supporting Receipt File Name</label>
              <input 
                type="text" 
                placeholder="e.g. receipt_transport_kajiado.jpg" 
                value={reportFile} 
                onChange={(e) => setReportFile(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm text-slate-800"
              />
            </div>

            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded text-sm transition-colors"
            >
              Submit Activity Claim Report
            </button>
          </form>

          {submitStatus && (
            <div className="bg-emerald-50 border border-emerald-250 p-3 rounded text-sm text-emerald-800 font-bold">
              Activity Expense Claim successfully filed. Routed to Finance & Department Head.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
