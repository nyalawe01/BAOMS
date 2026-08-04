import { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Send, ShieldAlert, Check, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePageLoader } from './_shared';

// ==========================================
// 5. HR REQUESTS VIEW
// ==========================================
export function HrRequestsView() {
  const { requests, updateRequestStatus, users, addAnnouncement } = useProject();
  const loading = usePageLoader([requests]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [noticeType, setNoticeType] = useState('Leave Approval Reminder');
  const [noticeNotes, setNoticeNotes] = useState('');

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
        <div className="bg-white border border-slate-200 rounded-xl p-5 h-64"></div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 h-64"></div>
      </div>
    );
  }

  const handleAction = (reqId, action) => {
    Swal.fire({
      title: `${action} Request?`,
      text: `Are you sure you want to mark this request as ${action.toLowerCase()}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: action === 'Approve' ? '#10b981' : '#ef4444',
      confirmButtonText: `Yes, ${action}`
    }).then((res) => {
      if (res.isConfirmed) {
        updateRequestStatus(reqId, action === 'Approve' ? 'Approved' : 'Rejected');
        Swal.fire(action === 'Approve' ? 'Approved!' : 'Rejected!', `The request has been updated.`, 'success');
      }
    });
  };

  const handleSendNotice = (e) => {
    e.preventDefault();
    if (!selectedStaffId || !noticeNotes) {
      Swal.fire('Error', 'Please select a staff member and write your directive notes.', 'error');
      return;
    }
    const staff = users.find(u => u.id === selectedStaffId);
    addAnnouncement(noticeType, `${noticeNotes} (Directed to: ${staff ? staff.name : 'Staff'})`);
    Swal.fire({
      title: 'Notice Synced & Dispatched',
      text: `Successfully dispatched directive notice (${noticeType}) to ${staff ? staff.name : 'Staff'}.`,
      icon: 'success'
    });
    setSelectedStaffId('');
    setNoticeNotes('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Review Requests */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Send size={16} className="text-indigo-500" />
              <span>Incoming Staff Requests Pipeline</span>
            </h3>
            <p className="text-xs text-slate-400">Review time-off, complaints, or contract query forms</p>
          </div>

          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
            {requests.map(req => (
              <div key={req.id} className="py-3 flex justify-between items-center text-sm">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800">{req.userName} ({req.department})</div>
                  <div className="text-slate-500 font-medium text-xs">
                    Type: <span className="font-bold text-slate-700">{req.requestType}</span> — {req.details?.reason || 'No description supplied.'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border uppercase ${
                    req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                    req.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-250' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {req.status}
                  </span>
                  {req.status === 'Pending' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAction(req.id, 'Approve')}
                        className="p-1 hover:bg-emerald-50 text-emerald-600 rounded border border-slate-200"
                        title="Approve Request"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'Reject')}
                        className="p-1 hover:bg-rose-50 text-rose-600 rounded border border-slate-200"
                        title="Reject Request"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">No pending requests found.</div>
            )}
          </div>
        </div>

        {/* Right: Dispatch notice directive */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-500" />
              <span>Dispatch Directive / Formal Notice</span>
            </h3>
            <p className="text-xs text-slate-400">Issue warnings, leave notices, or official reminders</p>
          </div>

          <form onSubmit={handleSendNotice} className="space-y-4 text-sm">
            <div className="space-y-1">
              <label className="font-bold text-slate-500 block">Select Target Resource</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
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
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              >
                <option value="Leave Approval Reminder">Leave Approval Reminder</option>
                <option value="Suspension Letter Dispatch">Suspension Letter Dispatch</option>
                <option value="Compliance Disciplinary Warning">Compliance Disciplinary Warning</option>
                <option value="Contract Longevity Extension">Contract Longevity Extension</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500 block">Directive Description Notes</label>
              <textarea
                value={noticeNotes}
                onChange={(e) => setNoticeNotes(e.target.value)}
                placeholder="Type the formal message details..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 h-24"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Send size={13} />
              <span>Send Directive</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
