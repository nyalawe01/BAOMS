import { useProject } from '../../context/ProjectContext';
import { Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePageLoader } from './_shared';

// ==========================================
// 8. HR LEAVE MANAGEMENT VIEW
// ==========================================
export function HrLeaveView() {
  const { users, updateUser } = useProject();
  const loading = usePageLoader([users]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-xl"></div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 h-48"></div>
      </div>
    );
  }

  const onLeaveStaff = users.filter(u => u.status === 'On Leave' || u.officeDetails?.status === 'On Leave');

  const handleRevoke = (userId) => {
    Swal.fire({
      title: 'Revoke Active Leave?',
      text: 'Are you sure you want to recall this employee back to office operations immediately?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0031C9',
      confirmButtonText: 'Yes, Recall'
    }).then((res) => {
      if (res.isConfirmed) {
        updateUser(userId, { status: 'Active', 'officeDetails.status': 'Active' });
        Swal.fire('Recalled!', 'Employee has been reinstated to active status.', 'success');
      }
    });
  };

  const handleNotify = (uName) => {
    Swal.fire('Reminder Sent', `Successfully dispatched leave expiration reminder message to ${uName}.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">Leave Pipelines & Timeline Logs</h2>
        <p className="text-xs text-slate-400">Inspect active leaves, dispatch timeline expiration alerts, or recall employees.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
          <Calendar size={16} className="text-indigo-500" />
          <span>Active Staff Leaves Timeline</span>
        </h4>

        <div className="space-y-4">
          {onLeaveStaff.map((s, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
              <div className="space-y-1">
                <div className="font-extrabold text-slate-800 text-sm">{s.name}</div>
                <div className="text-slate-500">Department: {s.officeDetails?.department || s.department} — Position: {s.officeDetails?.position || s.role}</div>
                {/* Timeline Bar */}
                <div className="flex items-center gap-2 pt-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">Starts: 2026-07-01</span>
                  <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full w-[65%]"></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Ends: 2026-07-30 (16 Days Remaining)</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleNotify(s.name)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-bold border border-slate-200"
                >
                  Send Expiry Alert
                </button>
                <button
                  onClick={() => handleRevoke(s.id)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold border border-rose-250"
                >
                  Revoke Leave
                </button>
              </div>
            </div>
          ))}
          {onLeaveStaff.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">No employees currently registered on leave.</div>
          )}
        </div>
      </div>
    </div>
  );
}
