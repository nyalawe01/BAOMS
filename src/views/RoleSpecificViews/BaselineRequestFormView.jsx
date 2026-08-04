import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { 
  Send
} from 'lucide-react';

export function BaselineRequestFormView() {
  const { addRequest, requests } = useProject();
  const { user } = useAuth();
  
  const [requestType, setRequestType] = useState('Leave');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [success, setSuccess] = useState(false);

  const myRequests = requests.filter(r => r.userId === user.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason) return;

    const extra = requestType === 'Leave' ? { startDate, endDate } : {};
    addRequest(requestType, reason, extra);
    setReason('');
    setStartDate('');
    setEndDate('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Send className="text-indigo-400" />
          <span>Request & Reporting Center</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1">Submit official organizational reports, leave requests, grievance forms, and request access to supporting documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-bold text-slate-800 text-base">Submit New Request</h3>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Request Category</label>
              <select 
                value={requestType} 
                onChange={(e) => setRequestType(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-slate-800 bg-white"
              >
                <option value="Leave">Annual/Sick Leave</option>
                <option value="Support Document Access">Supporting Documents Access</option>
                <option value="IT Support">IT Support Ticket</option>
                <option value="Grievance">Grievance Submission</option>
                <option value="Asset Request">Asset / Equipment Request</option>
              </select>
            </div>

            {requestType === 'Leave' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 font-semibold text-slate-500">Start</label>
                  <input 
                    type="date" 
                    required 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 font-semibold text-slate-500">End</label>
                  <input 
                    type="date" 
                    required 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-sm text-slate-800"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Justification Reason</label>
              <textarea 
                required 
                placeholder="Explain the reason for this submission..." 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm text-slate-800"
                rows="3"
              />
            </div>

            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded text-sm">Submit Request</button>
          </form>

          {success && (
            <div className="bg-emerald-50 border border-emerald-250 p-2.5 rounded text-sm text-emerald-800 font-bold">
              Request submitted successfully and routed to HR/Admin.
            </div>
          )}
        </div>

        {/* History */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-bold text-slate-800 text-base">Submission Tracking History</h3>
          
          <div className="space-y-3">
            {myRequests.map(req => (
              <div key={req.id} className="p-3 bg-slate-50 border border-slate-150 rounded text-sm space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{req.requestType} Report</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border uppercase ${
                    req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    req.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-slate-600 text-xs">Reason: {req.details.reason}</p>
                {req.details.startDate && (
                  <div className="text-xs text-slate-400">Dates: {req.details.startDate} to {req.details.endDate}</div>
                )}
                <span className="text-xs text-slate-400 block font-mono">Filed on {req.createdAt}</span>
              </div>
            ))}

            {myRequests.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-6">You have not submitted any reporting requests yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
