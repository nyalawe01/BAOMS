import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { 
  Users, Calendar, Check, X
} from 'lucide-react';
import Swal from 'sweetalert2';
import { OnboardingEngine } from './OnboardingEngine';
import { StaffStatusController } from './StaffStatusController';

export function HrOfficerView() {
  const { requests, updateRequestStatus } = useProject();
  const leaveRequests = requests.filter(r => r.requestType === 'Leave');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="text-indigo-400" />
          <span>HR Onboarding Engine & Staff Status Controller</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">Register new profiles, auto-generate temporary credentials, reallocate departments, and process organizational leave requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Onboarding Form */}
        <OnboardingEngine />

        {/* Staff status matrix grid */}
        <StaffStatusController />
      </div>

      {/* Leave & Status Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Calendar className="text-indigo-500" size={16} />
            <span>Leave / Attendance approval pipeline</span>
          </h3>
          <p className="text-[11px] text-slate-400">Review time-off requests submitted by organizational resources.</p>
        </div>

        <div className="divide-y divide-slate-100">
          {leaveRequests.map(req => (
            <div key={req.id} className="py-3.5 flex justify-between items-center text-xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-800">{req.userName} ({req.department})</div>
                <div className="text-slate-455 text-[10px] font-medium">
                  Requested Dates: {req.details.startDate} to {req.details.endDate} — Reason: {req.details.reason}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                  req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                  req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-250' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {req.status}
                </span>
                
                {req.status === 'pending' && (
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => {
                        Swal.fire({
                          title: 'Approve Leave Request',
                          text: `Approve leave request for ${req.userName}?`,
                          icon: 'question',
                          showCancelButton: true,
                          confirmButtonColor: '#10b981',
                          confirmButtonText: 'Yes, Approve'
                        }).then((res) => {
                          if (res.isConfirmed) {
                            updateRequestStatus(req.id, 'Approved');
                            Swal.fire('Approved!', 'Leave has been approved.', 'success');
                          }
                        });
                      }}
                      className="p-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded transition-colors"
                      title="Approve Leave"
                    >
                      <Check size={13} />
                    </button>
                    <button 
                      onClick={() => {
                        Swal.fire({
                          title: 'Deny Leave Request',
                          text: `Deny leave request for ${req.userName}?`,
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonColor: '#ef4444',
                          confirmButtonText: 'Yes, Deny'
                        }).then((res) => {
                          if (res.isConfirmed) {
                            updateRequestStatus(req.id, 'rejected');
                            Swal.fire('Denied', 'Leave request has been denied.', 'info');
                          }
                        });
                      }}
                      className="p-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-750 rounded transition-colors"
                      title="Deny Leave"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {leaveRequests.length === 0 && (
            <div className="p-6 text-center text-slate-400 text-xs italic">
              No leave requests currently pending HR processing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
