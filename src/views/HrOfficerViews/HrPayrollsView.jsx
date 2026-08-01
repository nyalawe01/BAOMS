import { useProject } from '../../context/ProjectContext';
import { Download } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePageLoader, TableSkeleton } from './_shared';

// ==========================================
// 7. HR PAYROLLS VIEW
// ==========================================
export function HrPayrollsView() {
  const { users } = useProject();
  const loading = usePageLoader([users]);

  if (loading) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">Workforce Payroll Directory Ledger</h2>
        <p className="text-xs text-slate-400">Review salary payment transactions, bank configurations, and receipts processed by Finance.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Staff name</th>
                <th className="py-3 px-6">Department Unit</th>
                <th className="py-3 px-6">Salary Rate</th>
                <th className="py-3 px-6">Last Payment date</th>
                <th className="py-3 px-6">Finance status</th>
                <th className="py-3 px-6">Receipt File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {users.map((u, idx) => {
                const salary = u.role === 'Executive Director' ? 'TZS 250,000' : u.role === 'Project Manager' ? 'TZS 140,000' : 'TZS 120,000';
                return (
                  <tr key={idx} className="hover:bg-slate-50/40">
                    <td className="py-3.5 px-6 font-bold text-slate-800">{u.name}</td>
                    <td className="py-3.5 px-6 text-slate-500">{u.officeDetails?.department || u.department || 'Operations'}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{salary}</td>
                    <td className="py-3.5 px-6 text-slate-455 font-mono">2026-06-30</td>
                    <td className="py-3.5 px-6">
                      <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-bold border border-emerald-150 uppercase">Processed</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <button
                        onClick={() => Swal.fire('Downloading...', 'Receipt_P9988.pdf', 'info')}
                        className="flex items-center gap-1 text-[11px] text-slate-700 hover:text-slate-900 hover:underline font-semibold"
                      >
                        <Download size={12} />
                        <span>Receipt_P9988.pdf</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
