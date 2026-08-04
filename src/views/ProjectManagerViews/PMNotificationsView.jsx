import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { Bell } from 'lucide-react';

// ============================================================================
// 14. PM NOTIFICATIONS VIEW
// ============================================================================
export function PMNotificationsView() {
  const { auditLogs } = useProject();

  // Derive a real-time alerts feed from actual context audit logs (derived from db)
  const alerts = auditLogs.slice(0, 10).map(log => ({
    message: log.description || 'Workspace event triggered.',
    time: log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now',
    category: log.actionType ? log.actionType.replace(/_/g, ' ') : 'Update'
  }));

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-sm text-slate-700">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-normal text-slate-800">Alert Center & Notifications</h2>
        <p className="text-sm text-slate-400 font-normal">Review real-time task triggers, project approvals, and deadline alerts.</p>
      </div>

      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-normal text-slate-808 text-base border-b border-slate-100 pb-2 flex items-center gap-2">
          <Bell size={16} className="text-slate-400" />
          <span>Real-time alerts log</span>
        </h3>

        <div className="divide-y divide-slate-100 text-sm font-normal">
          {alerts.map((alert, idx) => (
            <div key={idx} className="py-3 flex justify-between items-center gap-4">
              <div>
                <p className="font-normal text-slate-808">{alert.message}</p>
                <span className="text-xs text-slate-400 block mt-0.5 font-normal">{alert.time}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[8px] font-normal border uppercase shrink-0 bg-slate-100 text-slate-600 border-slate-200">
                {alert.category}
              </span>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="text-center py-12 text-slate-400 italic">No recent database activity to alert on.</div>
          )}
        </div>
      </div>
    </div>
  );
}
