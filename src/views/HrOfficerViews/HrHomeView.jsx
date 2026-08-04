import { useProject } from '../../context/ProjectContext';
import { Users, Building, Bell, UserCheck, AlarmClock } from 'lucide-react';
import { usePageLoader, CardSkeleton } from './_shared';

// Badge styling for the expiry radar, matching this file's slate/amber/rose conventions
function getExpiryBadge(daysRemaining) {
  if (daysRemaining < 0) {
    return { label: 'Overdue', className: 'text-rose-600 bg-rose-50 border-rose-150' };
  }
  if (daysRemaining < 14) {
    return { label: `${daysRemaining}d remaining`, className: 'text-rose-600 bg-rose-50 border-rose-150' };
  }
  if (daysRemaining < 30) {
    return { label: `${daysRemaining}d remaining`, className: 'text-amber-600 bg-amber-50 border-amber-150' };
  }
  return { label: `${daysRemaining}d remaining`, className: 'text-slate-600 bg-slate-100 border-slate-200' };
}

// ==========================================
// 1. HR HOME VIEW
// ==========================================
export function HrHomeView() {
  const { users, requests, auditLogs } = useProject();
  const loading = usePageLoader([users, auditLogs]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-slate-200 rounded-2xl animate-pulse"></div>
        <CardSkeleton count={6} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 p-5 rounded-xl h-64 animate-pulse"></div>
          <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl h-64 animate-pulse"></div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl h-40 animate-pulse"></div>
      </div>
    );
  }

  const totalStaff = users.length;
  const activeStaff = users.filter(u => u.status === 'Active' || u.officeDetails?.status === 'Active').length;
  const onLeave = users.filter(u => u.status === 'On Leave' || u.officeDetails?.status === 'On Leave').length;
  const newStaff = users.filter(u => {
    const hireDate = u.officeDetails?.hireDate || u.hireDate;
    if (!hireDate) return false;
    const diffTime = Math.abs(new Date() - new Date(hireDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 60;
  }).length;

  const pendingRequests = requests.filter(r => r.status === 'Pending').length;

  // Contract & placement expiry radar: active users with a recorded internPlacement.endDate,
  // expiring within the next 90 days, soonest first.
  const usersWithPlacementDates = users.filter(u => !!u.internPlacement?.endDate);
  const placementRadar = usersWithPlacementDates
    .filter(u => u.officeDetails?.status === 'Active')
    .map(u => {
      const endDate = new Date(u.internPlacement.endDate);
      const diffTime = endDate.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
      const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return { ...u, daysRemaining };
    })
    .filter(u => u.daysRemaining <= 90)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
  const expiringContracts = placementRadar.length;

  // Department distribution count
  const deptCounts = users.reduce((acc, u) => {
    const dept = u.officeDetails?.department || u.department || 'Operations';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/20">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="text-indigo-400" />
              <span>HR Executive Intelligence Command</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1">Review workforce stats, monitor leave pipelines, and inspect organizational activity feeds.</p>
          </div>
          <span className="bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
            Live Database Sync
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Employees', val: totalStaff, color: 'text-slate-800 bg-slate-50 border-slate-100' },
          { label: 'Active Staff', val: activeStaff, color: 'text-slate-800 bg-slate-50 border-slate-100' },
          { label: 'New Employees', val: newStaff, color: 'text-slate-800 bg-slate-50 border-slate-100' },
          { label: 'Staff on Leave', val: onLeave, color: 'text-slate-800 bg-slate-50 border-slate-100' },
          { label: 'Pending Requests', val: pendingRequests, color: 'text-rose-600 bg-rose-50 border-rose-150' },
          { label: 'Expiring Contracts', val: expiringContracts, color: 'text-slate-800 bg-slate-50 border-slate-100' }
        ].map((m, idx) => (
          <div key={idx} className={`p-4 rounded-xl border bg-white shadow-sm flex flex-col justify-between ${m.color.split(' ')[2]}`}>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-tight">{m.label}</span>
            <span className={`text-2xl font-black mt-2 ${m.color.split(' ')[0]}`}>{m.val}</span>
          </div>
        ))}
      </div>

      {/* Dash Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Department summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Building size={16} className="text-indigo-500" />
              <span>Department Resources</span>
            </h3>
            <p className="text-xs text-slate-400">Resource counts across functional units</p>
          </div>
          <div className="space-y-3">
            {Object.entries(deptCounts).map(([dept, count], idx) => {
              const pct = totalStaff > 0 ? Math.round((count / totalStaff) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-700">{dept}</span>
                    <span className="text-slate-500">{count} staff ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center/Right: Chronological activity logs */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Bell size={16} className="text-amber-500" />
                <span>Real-Time Audit Activity Feed</span>
              </h3>
              <p className="text-xs text-slate-400">Force activity log tracking submissions</p>
            </div>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">Immutable</span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {auditLogs.slice(0, 8).map((log, idx) => (
              <div key={idx} className="flex gap-3 text-sm border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                <div className="mt-0.5">
                  <div className={`p-1.5 rounded-lg ${
                    log.actionType === 'USER_MANAGEMENT' ? 'bg-slate-100 text-slate-700' :
                    log.actionType === 'REQUEST_CENTER' ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-655'
                  }`}>
                    <UserCheck size={14} />
                  </div>
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{log.userName}</span>
                    <span className="text-xs text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-655 text-xs leading-relaxed">{log.description}</p>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">No recent actions logged.</div>
            )}
          </div>
        </div>
      </div>

      {/* Contract & Placement Expiry Radar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <AlarmClock size={16} className="text-rose-500" />
            <span>Contract & Placement Expiry Radar</span>
          </h3>
          <p className="text-xs text-slate-400">Active intern/placement end dates expiring in the next 90 days</p>
        </div>

        {usersWithPlacementDates.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No placement end dates on record. This list will populate once HR onboarding captures an internship/placement end date for active staff.
          </div>
        ) : placementRadar.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No contracts or placements expiring in the next 90 days.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
            {placementRadar.map((u) => {
              const badge = getExpiryBadge(u.daysRemaining);
              return (
                <div key={u.id} className="flex justify-between items-center gap-3 text-sm border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{u.name}</p>
                    <p className="text-slate-500 text-xs">{u.role}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
