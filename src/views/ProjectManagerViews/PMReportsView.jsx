import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import Swal from 'sweetalert2';

// ============================================================================
// 11. PM REPORTS VIEW
// ============================================================================
export function PMReportsView() {
  const [reportType, setReportType] = useState('Project Progress Report');

  const handleGenerate = (e) => {
    e.preventDefault();
    Swal.fire({
      title: 'Report Compiled!',
      text: `Successfully compiled and generated your "${reportType}".`,
      icon: 'success',
      confirmButtonColor: '#4f46e5'
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-800">NGO Reports Center</h2>
        <p className="text-xs text-slate-400 font-normal">Generate and export project progress, monthly activities, budgets, donor, or completion reports.</p>
      </div>

      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-normal text-slate-808 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
          <FileText size={16} className="text-slate-400" />
          <span>Report Generator</span>
        </h3>

        <form onSubmit={handleGenerate} className="space-y-4 text-xs font-normal">
          <div className="space-y-1">
            <label className="font-normal text-slate-500 block">Select Report Classification</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded bg-white"
            >
              <option value="Project Progress Report">Project Progress Report</option>
              <option value="Monthly Activities Report">Monthly Activities Report</option>
              <option value="Donor Funding Sponsor Report">Donor Funding Sponsor Report</option>
              <option value="Financial Budget Audit Report">Financial Budget Audit Report</option>
              <option value="Completion & Impact Evaluation Report">Completion & Impact Evaluation Report</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['PDF', 'Excel', 'Word'].map(fmt => (
              <button
                key={fmt}
                type="button"
                onClick={() => Swal.fire('Format Confirmed', `Export format configured: ${fmt}`, 'info')}
                className="py-2.5 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 font-normal"
              >
                Export as {fmt}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-normal transition-all shadow-sm"
          >
            Compile & Generate Report
          </button>
        </form>
      </div>
    </div>
  );
}
