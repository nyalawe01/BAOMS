import React from 'react';
import { Bell } from 'lucide-react';

// ============================================================================
// 14. PM NOTIFICATIONS VIEW
// ============================================================================
export function PMNotificationsView() {
  const alerts = [
    { message: 'Deadline Tomorrow: Website redesign milestone due.', time: '1h ago', category: 'Urgent' },
    { message: 'Task Assigned: John allocated to Mombasa Port Assessment.', time: '3h ago', category: 'Task' },
    { message: 'Budget Approved: UNICEF grant funding ledger configured.', time: '1 day ago', category: 'Finance' },
    { message: 'Report Due: M&E baseline indicators update required.', time: '2 days ago', category: 'Reminder' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-800">Alert Center & Notifications</h2>
        <p className="text-xs text-slate-400 font-normal">Review real-time task triggers, project approvals, and deadline alerts.</p>
      </div>

      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-normal text-slate-808 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
          <Bell size={16} className="text-slate-400" />
          <span>Real-time alerts log</span>
        </h3>

        <div className="divide-y divide-slate-100 text-xs font-normal">
          {alerts.map((alert, idx) => (
            <div key={idx} className="py-3 flex justify-between items-center gap-4">
              <div>
                <p className="font-normal text-slate-808">{alert.message}</p>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-normal">{alert.time}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[8px] font-normal border uppercase shrink-0 bg-slate-100 text-slate-600 border-slate-200">
                {alert.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
