import { useAuth } from '../../context/AuthContext';
import { BookOpen, Download } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePageLoader } from './_shared';

// ==========================================
// 10. HR DOCUMENTS VIEW
// ==========================================
export function HrDocumentsView() {
  const { policyVault } = useAuth();
  const loading = usePageLoader([policyVault]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map(n => (
          <div key={n} className="bg-white border border-slate-200 rounded-xl p-5 h-44"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">Corporate Documents & Policy Vault</h2>
        <p className="text-xs text-slate-400">View official organization manuals, compliance guidelines, and contract forms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {policyVault.map((doc, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 w-fit">
                <BookOpen size={20} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm leading-snug">{doc.title}</h4>
              <p className="text-slate-400 text-[10px]">Updated: {doc.updated} — Category: {doc.category}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono">{doc.size}</span>
              <button
                onClick={() => Swal.fire('Downloading document...', doc.title, 'success')}
                className="flex items-center gap-1 text-slate-700 hover:text-slate-900 hover:underline font-semibold"
              >
                <Download size={13} />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
