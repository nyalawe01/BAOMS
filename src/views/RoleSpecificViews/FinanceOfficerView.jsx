import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  FileText, Plus, FileSpreadsheet, Check, X
} from 'lucide-react';
import Swal from 'sweetalert2';

export function FinanceOfficerView() {
  const { budgets, expenses, updateExpenseStatus, addBudgetLedgerItem, projects } = useProject();
  const [selectedProjId, setSelectedProjId] = useState(projects[0]?.id || '');
  
  // Budget Form State
  const [budgetDesc, setBudgetDesc] = useState('');
  const [budgetCat, setBudgetCat] = useState('Operations');
  const [budgetAmount, setBudgetAmount] = useState('');

  const activeBudget = budgets.find(b => b.projectId === selectedProjId);
  const pendingExpenses = expenses.filter(ex => ex.status === 'Pending');

  const handleAddBudgetItem = (e) => {
    e.preventDefault();
    if (!budgetDesc || !budgetAmount || !selectedProjId) return;

    addBudgetLedgerItem(selectedProjId, budgetDesc, budgetCat, budgetAmount);
    setBudgetDesc('');
    setBudgetAmount('');
  };

  const handleApproveExpense = (id, description, amount) => {
    Swal.fire({
      title: 'Approve Expense?',
      text: `Are you sure you want to approve TZS ${amount.toLocaleString()} for "${description}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Yes, Approve'
    }).then((res) => {
      if (res.isConfirmed) {
        updateExpenseStatus(id, 'Approved');
        Swal.fire('Approved!', 'Expense claim has been approved.', 'success');
      }
    });
  };

  const handleRejectExpense = (id, description) => {
    Swal.fire({
      title: 'Reject Expense?',
      text: `Deny the expense claim for "${description}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Reject'
    }).then((res) => {
      if (res.isConfirmed) {
        updateExpenseStatus(id, 'Rejected');
        Swal.fire('Rejected', 'Expense claim was declined.', 'info');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileSpreadsheet className="text-emerald-400" />
          <span>Spreadsheet Ledger & Expense Router</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">Review fiscal ledgers, allocate budget distributions, and approve expense vouchers with supporting receipts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Budget Allocation Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Plus className="text-emerald-500" size={16} />
            <span>Allocate Budget Distribution</span>
          </h3>

          <form onSubmit={handleAddBudgetItem} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Project Portfolio</label>
              <select 
                value={selectedProjId}
                onChange={(e) => setSelectedProjId(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Line Item Description</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. AWS Production Cloud Hosting" 
                value={budgetDesc}
                onChange={(e) => setBudgetDesc(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Expense Category</label>
                <select 
                  value={budgetCat} 
                  onChange={(e) => setBudgetCat(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
                >
                  <option value="Operations">Operations</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Consultancies">Consultancies</option>
                  <option value="Travel">Travel</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Amount (TZS)</label>
                <input 
                  type="number" 
                  required 
                  placeholder="TZS" 
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-2 rounded text-xs transition-colors"
            >
              Allocate Budget Line Item
            </button>
          </form>
        </div>

        {/* Ledger View */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Active Ledger Spreadsheet</h3>
            <span className="text-xs text-slate-500">FY26 Financial Year</span>
          </div>

          {activeBudget ? (
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-semibold text-slate-500 bg-slate-50 p-3 rounded border border-slate-150">
                <span>Project: {activeBudget.projectName}</span>
                <span>Cumulative Portfolio Allocation: TZS {activeBudget.allocatedBudget.toLocaleString()}</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-[11px] font-bold text-slate-400 uppercase">
                      <th className="pb-2">Details</th>
                      <th className="pb-2 px-3">Category</th>
                      <th className="pb-2 px-3">Allocation</th>
                      <th className="pb-2 text-right">Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {activeBudget.items.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-semibold text-slate-900">{item.description}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 uppercase border border-slate-200">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">TZS {item.allocatedAmount.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-semibold text-rose-600">TZS {item.spent.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-6 text-center">No active budget allocations defined for this workspace.</p>
          )}
        </div>
      </div>

      {/* Expense Routing approvals */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Expense Routing approval matrix</h3>
          <p className="text-xs text-slate-400">Review employee travel, supplies, and consultancy expense claims with receipt vouchers.</p>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingExpenses.map(ex => (
            <div key={ex.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="font-bold text-xs text-slate-800">{ex.description}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Project: {ex.projectName}</span>
                  <span>•</span>
                  <span>Submitted by: {ex.submittedByName} ({ex.department})</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <FileText size={12} />
                    <span>{ex.receiptUrl}</span>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-xs font-extrabold text-slate-800">TZS {ex.amount.toLocaleString()}</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleApproveExpense(ex.id, ex.description, ex.amount)}
                    className="p-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded transition-colors"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => handleRejectExpense(ex.id, ex.description)}
                    className="p-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {pendingExpenses.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No employee expense claims currently pending approval.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
