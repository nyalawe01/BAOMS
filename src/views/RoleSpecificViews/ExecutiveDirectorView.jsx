import React, { useState, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Activity, Check, X, Users2, ClipboardList
} from 'lucide-react';
import Swal from 'sweetalert2';
import { ProgressBarHalfCircle } from "@/components/base/progress-indicators/progress-circles";
import { Button } from "@/components/base/buttons/button";

export function ExecutiveDirectorView() {
  const { projects, expenses, users, requests, updateExpenseStatus } = useProject();
  const [boardReportStatus, setBoardReportStatus] = useState('');

  const pendingStrategicExpenses = expenses.filter(ex => ex.status === 'Pending' && ex.amount >= 2000);
  const totalKPIBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const avgProgress = Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / (projects.length || 1));

  // Cross-department rollup - department list is derived from the distinct
  // values actually present on `users` (never hardcoded), so newly added
  // departments show up automatically. `transactions` has no per-record
  // department attribution (see ProjectContext addTransaction), so a net
  // cash position column is intentionally left out here rather than
  // fabricated - it would misattribute every ledger entry.
  const departmentRollup = useMemo(() => {
    const byDept = new Map();
    users.forEach(u => {
      const dept = u.officeDetails?.department || u.department;
      if (!dept) return;
      if (!byDept.has(dept)) byDept.set(dept, { department: dept, headcount: 0, openApprovals: 0 });
      const status = u.officeDetails?.status || u.status;
      if (status === 'Active') byDept.get(dept).headcount += 1;
    });
    requests.forEach(r => {
      if (r.status === 'Pending' && byDept.has(r.department)) {
        byDept.get(r.department).openApprovals += 1;
      }
    });
    return Array.from(byDept.values()).sort((a, b) => a.department.localeCompare(b.department));
  }, [users, requests]);

  const totalHeadcount = useMemo(
    () => users.filter(u => (u.officeDetails?.status || u.status) === 'Active').length,
    [users]
  );
  const totalOpenApprovalsOrgWide = useMemo(
    () => requests.filter(r => r.status === 'Pending').length,
    [requests]
  );

  const handleGenerateReport = () => {
    setBoardReportStatus('compiling');
    setTimeout(() => {
      setBoardReportStatus('ready');
    }, 1500);
  };

  const handleApproveExpense = (id, description, amount) => {
    Swal.fire({
      title: 'Approve Strategic Expense?',
      text: `Are you sure you want to approve TZS ${amount.toLocaleString()} for "${description}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Yes, Approve'
    }).then((res) => {
      if (res.isConfirmed) {
        updateExpenseStatus(id, 'Approved');
        Swal.fire('Approved!', 'Strategic expense has been signed off.', 'success');
      }
    });
  };

  const handleRejectExpense = (id, description) => {
    Swal.fire({
      title: 'Reject Strategic Expense?',
      text: 'Deny this high-value expense request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Reject'
    }).then((res) => {
      if (res.isConfirmed) {
        updateExpenseStatus(id, 'Rejected');
        Swal.fire('Rejected', 'Strategic expense was declined.', 'info');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="text-emerald-400" />
          <span>Executive Director Portfolio Command</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1">Cross-project operational metrics, high-value strategic budget approvals, and executive briefings generator.</p>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Aggregate Project Budget Limit</span>
          <span className="text-2xl font-extrabold text-slate-800 block">TZS {totalKPIBudget.toLocaleString()}</span>
          <span className="text-sm text-slate-500 block pt-2">Allocated across {projects.length} portfolios.</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Portfolio Execution Index</span>
            <span className="text-2xl font-extrabold text-slate-850 block">{avgProgress}%</span>
            <span className="text-sm text-emerald-600 font-semibold block pt-2">Average project progress.</span>
          </div>
          <div className="scale-75 origin-right">
            <ProgressBarHalfCircle size="xs" label="Progress" value={avgProgress} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Board Report Readiness</span>
            <span className="text-2xl font-extrabold text-slate-800 block">Q3 Active</span>
          </div>
          <Button 
            onClick={handleGenerateReport}
            size="xs"
            color="brand"
            className="mt-2 self-start"
          >
            Compile Briefing Draft
          </Button>
        </div>
      </div>

      {/* Organization-Wide Rollup */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Organization-Wide Rollup</h3>
            <p className="text-sm text-slate-400">Headcount and open approvals across every department, in one view.</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5">
              <Users2 size={14} className="text-indigo-600" />
              <div className="leading-tight">
                <span className="block text-xs font-bold uppercase tracking-wider text-indigo-500">Total Headcount</span>
                <span className="block text-base font-extrabold text-indigo-800">{totalHeadcount}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              <ClipboardList size={14} className="text-amber-600" />
              <div className="leading-tight">
                <span className="block text-xs font-bold uppercase tracking-wider text-amber-500">Open Approvals Org-Wide</span>
                <span className="block text-base font-extrabold text-amber-800">{totalOpenApprovalsOrgWide}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-150 text-xs font-bold text-slate-400 uppercase">
                <th className="py-2 px-5">Department</th>
                <th className="py-2 px-3">Headcount (Active)</th>
                <th className="py-2 px-3 text-right pr-5">Open Approvals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {departmentRollup.map(dept => (
                <tr key={dept.department} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-5 font-semibold text-slate-800">{dept.department}</td>
                  <td className="py-2.5 px-3">{dept.headcount}</td>
                  <td className="py-2.5 px-3 text-right pr-5">
                    {dept.openApprovals > 0 ? (
                      <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                        {dept.openApprovals} pending
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {departmentRollup.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm italic">
              No department directory data available yet.
            </div>
          )}
        </div>
      </div>

      {boardReportStatus === 'compiling' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center animate-pulse text-sm font-semibold text-slate-500">
          Gathering cross-project indicators, financial ledger files, and HR directories...
        </div>
      )}

      {boardReportStatus === 'ready' && (
        <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-start border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-800 text-base">Compiled Board Briefing: Q3 2026</h4>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded uppercase">Ready to Export</span>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <p><strong>Executive Summary:</strong> The organization portfolio contains {projects.length} projects running with high output efficiency. Total fiscal liability is TZS {totalKPIBudget}.</p>
            <p><strong>Core Deliverables:</strong> Website Redesign is currently at 60% completion. Security Audit is 100% completed.</p>
          </div>
        </div>
      )}

      {/* Strategic Approval Queue (High-Value Budgets >= 2,000) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-250 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-base">Strategic Approval Queue (TZS &gt;= 2,000)</h3>
          <p className="text-sm text-slate-400">High-value expenses requiring executive director sign-off.</p>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingStrategicExpenses.map(ex => (
            <div key={ex.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-sm font-bold text-slate-800">{ex.description}</span>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Project: {ex.projectName}</span>
                  <span>•</span>
                  <span>Submitted by: {ex.submittedByName} ({ex.department})</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-base font-extrabold text-slate-900">TZS {ex.amount.toLocaleString()}</span>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => handleApproveExpense(ex.id, ex.description, ex.amount)}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded transition-colors"
                    title="Approve Expense"
                  >
                    <Check size={14} />
                  </button>
                  <button 
                    onClick={() => handleRejectExpense(ex.id, ex.description)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-750 rounded transition-colors"
                    title="Reject Expense"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {pendingStrategicExpenses.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm italic">
              No strategic high-value expenses pending approval.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
