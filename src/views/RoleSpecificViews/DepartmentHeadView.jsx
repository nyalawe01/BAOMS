import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import {
  Check, X, Briefcase
} from 'lucide-react';
import Swal from 'sweetalert2';

export function DepartmentHeadView() {
  const { user } = useAuth();
  const { requests, updateRequestStatus, projects } = useProject();

  const myDept = user?.officeDetails?.department || 'Engineering';
  const pendingRequests = requests.filter(r => r.status === 'Pending' && r.department === myDept);

  const handleApproveRequest = (req) => {
    Swal.fire({
      title: 'Approve Request',
      text: `Approve ${req.requestType} request for ${req.userName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Yes, Approve'
    }).then((res) => {
      if (res.isConfirmed) {
        updateRequestStatus(req.id, 'Approved');
        Swal.fire('Approved!', 'Request has been approved.', 'success');
      }
    });
  };

  const handleRejectRequest = (req) => {
    Swal.fire({
      title: 'Reject Request',
      text: `Deny ${req.requestType} request for ${req.userName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Reject'
    }).then((res) => {
      if (res.isConfirmed) {
        updateRequestStatus(req.id, 'rejected');
        Swal.fire('Rejected', 'Request has been denied.', 'info');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Briefcase className="text-indigo-400" />
          <span>Department Dashboard & Approval Inbox</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1">Monitor team activities, track task completion ratios, and sign off on internal leave and operational expenses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">My Department</span>
          <span className="text-2xl font-extrabold text-indigo-700 block">{myDept}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Team Capacity</span>
          <span className="text-2xl font-extrabold text-slate-800 block">Active</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Pending Team Claims</span>
          <span className="text-2xl font-extrabold text-slate-800 block">{pendingRequests.length} Inbox Items</span>
        </div>
      </div>

      {/* Approval Inbox */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-base">Department Approval Inbox</h3>
          <p className="text-sm text-slate-400">Claims submitted by personnel in your direct reporting line.</p>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingRequests.map(req => (
            <div key={req.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-sm font-bold text-slate-800">{req.userName} — {req.requestType} Report</span>
                <p className="text-xs text-slate-400">Reason: {req.details.reason}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApproveRequest(req)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-1 px-3.5 rounded flex items-center gap-1"
                >
                  <Check size={12} /> Approve
                </button>
                <button
                  onClick={() => handleRejectRequest(req)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm py-1 px-3.5 rounded flex items-center gap-1"
                >
                  <X size={12} /> Reject
                </button>
              </div>
            </div>
          ))}

          {pendingRequests.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm italic">
              All clear! No pending approval items in your inbox.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
