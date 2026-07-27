import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { FileSpreadsheet } from 'lucide-react';

// ============================================================================
// 7. PM BUDGET & FINANCE VIEW (categorized per-project)
// ============================================================================
export function PMBudgetFinanceView() {
  const { expenses, projects } = useProject();
  const [selectedProjId, setSelectedProjId] = useState(projects[0]?.id || '');

  const activeProj = projects.find(p => p.id === selectedProjId);
  const projExpenses = expenses.filter(e => e.projectId === selectedProjId);

  const totalBudget = activeProj ? activeProj.budget || 0 : 0;
  const totalSpent = projExpenses.filter(e => e.status === 'Approved').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const remaining = totalBudget - totalSpent;
  const pending = projExpenses.filter(e => e.status === 'Pending').reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-normal text-slate-800">Financial Ledger Tracker</h2>
          <p className="text-xs text-slate-400 font-normal">Review allocated budgets and expenses categorized per project.</p>
        </div>

        {/* Project Selector */}
        <div className="text-xs font-normal">
          <select
            value={selectedProjId}
            onChange={(e) => setSelectedProjId(e.target.value)}
            className="border border-slate-200 rounded px-2.5 py-1.5 bg-white text-xs font-normal focus:outline-none"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Project Budget Limit', value: `TZS ${totalBudget.toLocaleString()}`, color: 'border-l-slate-400' },
          { label: 'Project Expenditures Spent', value: `TZS ${totalSpent.toLocaleString()}`, color: 'border-l-slate-600' },
          { label: 'Remaining Cashflow', value: `TZS ${remaining.toLocaleString()}`, color: 'border-l-slate-300' },
          { label: 'Pending Approvals', value: `TZS ${pending.toLocaleString()}`, color: 'border-l-slate-200' }
        ].map((card, idx) => (
          <div key={idx} className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 ${card.color} flex flex-col justify-between`}>
            <span className="text-[9px] font-normal text-slate-500 uppercase tracking-widest">{card.label}</span>
            <span className="text-base font-normal text-slate-800 mt-2 block">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-normal text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
          <FileSpreadsheet size={16} className="text-slate-400" />
          <span>Operational Expenses Log Ledger ({activeProj ? activeProj.name : 'Selected Project'})</span>
        </h3>

        <div className="overflow-x-auto text-xs select-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                <th className="p-3">Expense Item</th>
                <th className="p-3">Category</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {projExpenses.map((exp, idx) => (
                <tr key={exp.id || idx} className="hover:bg-slate-50/50">
                  <td className="p-3 font-normal text-slate-800">{exp.description}</td>
                  <td className="p-3 text-slate-655 font-normal">{exp.category || 'Operations'}</td>
                  <td className="p-3 font-normal text-slate-700">TZS {exp.amount?.toLocaleString()}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[8px] font-normal border uppercase bg-slate-50 text-slate-600 border-slate-200">
                      {exp.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
              {projExpenses.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-slate-400 italic font-normal">No expenses logged for this project workspace.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
