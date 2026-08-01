import { useProject } from '../../context/ProjectContext';
import { Avatar } from '@/components/base/avatar/avatar';
import { usePageLoader } from './_shared';

// ==========================================
// 6. HR PROJECTS VIEW
// ==========================================
export function HrProjectsView() {
  const { projects, users } = useProject();
  const loading = usePageLoader([projects]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-xl p-5 h-56"></div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 h-56"></div>
        </div>
      </div>
    );
  }

  const getStaffOnProject = () => {
    return users.filter(u => u.officeDetails?.department === 'Program Management' || u.role === 'Project Manager');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">Projects Hierarchy Portfolios</h2>
        <p className="text-xs text-slate-400">Review project tasks status assignments and track resource trees.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map((proj, idx) => {
          const staff = getStaffOnProject();
          return (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-indigo-300 transition-all">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">{proj.name}</h4>
                  <span className="text-[11px] text-slate-400">{proj.status} — TZS {proj.budget?.toLocaleString()} Limit</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700">{proj.progress}% Done</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
              </div>

              {/* Team Hierarchy Tree list */}
              <div className="space-y-2">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Assigned Project Personnel</span>
                {staff.slice(0, 3).map((member, mIdx) => (
                  <div key={mIdx} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded">
                    <div className="flex items-center gap-2">
                      <Avatar size="xs" src={member.avatar} alt={member.name} />
                      <div className="text-xs">
                        <div className="font-bold text-slate-800">{member.name}</div>
                        <span className="text-[11px] text-slate-400">Task Owner</span>
                      </div>
                    </div>
                    <span className="text-[11px] bg-slate-100 border border-slate-200 text-slate-750 px-2 py-0.5 rounded font-semibold">Active</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
