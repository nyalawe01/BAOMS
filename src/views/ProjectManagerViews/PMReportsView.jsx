import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { useProject } from '../../context/ProjectContext';

// ============================================================================
// Helper utility to export text reports client-side
// ============================================================================
const downloadFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ============================================================================
// 11. PM REPORTS VIEW
// ============================================================================
export function PMReportsView() {
  const { projects, users, projectFiles, transactions } = useProject();
  const [reportType, setReportType] = useState('Project Progress Report');

  const approvedExpenses = transactions.filter(t => t.type === 'Expense' && t.status === 'Approved');

  const buildReportContent = () => {
    const statusCounts = projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const totalSpent = approvedExpenses.reduce((acc, t) => acc + (t.amount || 0), 0);

    return `
BAOMS ${reportType.toUpperCase()}
Generated On: ${new Date().toLocaleDateString()}
------------------------------------
1. PORTFOLIO OVERVIEW
Total Project Workspaces: ${projects.length}
${Object.entries(statusCounts).map(([status, count]) => `- ${status}: ${count}`).join('\n') || 'No projects logged'}

2. BUDGET SUMMARY
Total Authorized Budget: TZS ${totalBudget.toLocaleString()}
Total Approved Expenses: TZS ${totalSpent.toLocaleString()}
Remaining Balance: TZS ${(totalBudget - totalSpent).toLocaleString()}

3. PROJECT BREAKDOWN
${projects.map(p => {
  const projSpent = approvedExpenses.filter(t => t.projectId === p.id).reduce((a, c) => a + (c.amount || 0), 0);
  const staffCount = (p.assignedStaff || []).length;
  const docCount = projectFiles.filter(f => f.projectId === p.id).length;
  return `- ${p.name} [${p.status}]: ${p.progress || 0}% complete, TZS ${projSpent.toLocaleString()} spent of TZS ${p.budget?.toLocaleString() || 0}, ${staffCount} staff assigned, ${docCount} documents`;
}).join('\n') || 'No projects logged'}

4. STAFF DIRECTORY
Total Staff Members: ${users.length}
------------------------------------
EOF
`;
  };

  const handleGenerate = (e) => {
    e.preventDefault();

    const dateStr = new Date().toISOString().substring(0, 10);
    downloadFile(`PM_${reportType.replace(/\s+/g, '_')}_${dateStr}.txt`, buildReportContent());

    Swal.fire({
      title: 'Report Compiled!',
      text: `Successfully compiled and generated your "${reportType}". Downloading text report.`,
      icon: 'success',
      confirmButtonColor: '#4f46e5'
    });
  };

  const handleExportFormat = (fmt) => {
    if (fmt === 'Excel') {
      const dateStr = new Date().toISOString().substring(0, 10);
      const rows = [
        [`BAOMS ${reportType}`],
        ['Generated On', new Date().toLocaleDateString()],
        [],
        ['Project Name', 'Status', 'Progress %', 'Budget (TZS)', 'Spent (TZS)', 'Staff Assigned', 'Documents'],
        ...projects.map(p => {
          const projSpent = approvedExpenses.filter(t => t.projectId === p.id).reduce((a, c) => a + (c.amount || 0), 0);
          return [
            p.name,
            p.status,
            p.progress || 0,
            p.budget || 0,
            projSpent,
            (p.assignedStaff || []).length,
            projectFiles.filter(f => f.projectId === p.id).length
          ];
        })
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `PM_${reportType.replace(/\s+/g, '_')}_${dateStr}.xlsx`);

      Swal.fire('Excel Exported', `Downloading "${reportType}" as an Excel spreadsheet.`, 'success');
    } else {
      Swal.fire('Format Not Available', `${fmt} export isn't available yet. Use the Excel export or the text report instead.`, 'info');
    }
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
                onClick={() => handleExportFormat(fmt)}
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
