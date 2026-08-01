import { useProject } from '../../context/ProjectContext';
import { Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePageLoader, TableSkeleton } from './_shared';

// ==========================================
// 9. HR REPORTS VIEW
// ==========================================
export function HrReportsView() {
  const { reports } = useProject();
  const loading = usePageLoader([reports]);

  if (loading) {
    return <TableSkeleton rows={3} />;
  }

  const handleReadReport = (rep) => {
    Swal.fire({
      title: rep.type,
      text: rep.preview || 'No description supplied.',
      icon: 'info',
      confirmButtonText: 'Archive Report',
      confirmButtonColor: '#0031C9'
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">Staff Monthly & Weekly Reports</h2>
        <p className="text-xs text-slate-400">Review task summary submissions uploaded by field officers and department managers.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Author</th>
                <th className="py-3 px-6">Report Type</th>
                <th className="py-3 px-6">Submission Date</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {reports.map((rep, idx) => (
                <tr key={idx} className="hover:bg-slate-50/40">
                  <td className="py-3.5 px-6 font-bold text-slate-800">{rep.author}</td>
                  <td className="py-3.5 px-6 text-slate-550">{rep.type}</td>
                  <td className="py-3.5 px-6 text-slate-400 font-mono">{rep.date}</td>
                  <td className="py-3.5 px-6">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border uppercase ${
                      rep.status === 'Reviewed' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{rep.status}</span>
                  </td>
                  <td className="py-3.5 px-6">
                    <button
                      onClick={() => handleReadReport(rep)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded text-indigo-700 text-[11px] font-bold"
                    >
                      <Eye size={12} />
                      <span>Read Report</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">No staff reports have been submitted.</div>
          )}
        </div>
      </div>
    </div>
  );
}
