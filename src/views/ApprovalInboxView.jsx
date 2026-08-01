import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import {
  Check, X, Clock, FileText, Users, Inbox, ShieldCheck
} from 'lucide-react';
import Swal from 'sweetalert2';

const EXPENSE_APPROVER_ROLES = ['Executive Director', 'Department Head', 'Finance Officer', 'System Administrator'];
const REQUEST_APPROVER_ROLES = ['HR Officer', 'System Administrator'];
const BENEFICIARY_APPROVER_ROLES = ['M&E Officer', 'Monitoring & Evaluation Officer', 'System Administrator'];

export function ApprovalInboxView() {
  const { role } = useAuth();
  const {
    expenses, requests, beneficiaries,
    updateExpenseStatus, updateRequestStatus, updateBeneficiary
  } = useProject();

  const canApproveExpenses = EXPENSE_APPROVER_ROLES.includes(role);
  const canApproveRequests = REQUEST_APPROVER_ROLES.includes(role);
  const canVerifyBeneficiaries = BENEFICIARY_APPROVER_ROLES.includes(role);

  const noSectionsVisible = !canApproveExpenses && !canApproveRequests && !canVerifyBeneficiaries;

  const pendingExpenses = (expenses || []).filter(ex => ex.status === 'Pending');
  const pendingRequests = (requests || []).filter(r => r.status === 'pending');
  const pendingBeneficiaries = (beneficiaries || []).filter(b => b.status === 'Pending Verification');

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
        Swal.fire('Approved!', 'Expense has been approved.', 'success');
      }
    });
  };

  const handleRejectExpense = (id, description) => {
    Swal.fire({
      title: 'Reject Expense?',
      text: `Deny this expense request for "${description}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Reject'
    }).then((res) => {
      if (res.isConfirmed) {
        updateExpenseStatus(id, 'Rejected');
        Swal.fire('Rejected', 'Expense was declined.', 'info');
      }
    });
  };

  const handleApproveRequest = (req) => {
    Swal.fire({
      title: 'Approve Request',
      text: `Approve ${req.requestType} request for ${req.userName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Yes, Approve'
    }).then((res) => {
      if (res.isConfirmed) {
        updateRequestStatus(req.id, 'approved');
        Swal.fire('Approved!', 'Request has been approved.', 'success');
      }
    });
  };

  const handleRejectRequest = (req) => {
    Swal.fire({
      title: 'Reject Request',
      text: `Deny ${req.requestType} request for ${req.userName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Reject'
    }).then((res) => {
      if (res.isConfirmed) {
        updateRequestStatus(req.id, 'rejected');
        Swal.fire('Rejected', 'Request has been denied.', 'info');
      }
    });
  };

  const handleVerifyBeneficiary = (ben) => {
    Swal.fire({
      title: 'Verify Beneficiary?',
      text: `Confirm that "${ben.name}" has been verified?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Yes, Verify'
    }).then((res) => {
      if (res.isConfirmed) {
        updateBeneficiary(ben.id, { status: 'Verified' });
        Swal.fire('Verified!', 'Beneficiary has been verified.', 'success');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Inbox className="text-indigo-400" />
          <span>Approval Inbox</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">Everything currently waiting on your decision, across expenses, staff requests, and beneficiary verifications.</p>
      </div>

      {noSectionsVisible && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center space-y-2">
          <ShieldCheck className="mx-auto text-slate-300" size={32} />
          <h3 className="font-bold text-slate-800 text-sm">No Approval Actions For Your Role</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            This page shows approvals relevant to your role ({role || 'your account'}). You don't currently have any pending action types assigned to you.
          </p>
        </div>
      )}

      {canApproveExpenses && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileText size={15} className="text-indigo-500" />
                <span>Pending Expenses</span>
              </h3>
              <p className="text-xs text-slate-400">Expense claims awaiting your sign-off.</p>
            </div>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full uppercase">
              {pendingExpenses.length} Pending
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingExpenses.map(ex => (
              <div key={ex.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800">{ex.description}</span>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                    <span>Project: {ex.projectName}</span>
                    <span>&bull;</span>
                    <span>Category: {ex.category}</span>
                    <span>&bull;</span>
                    <span>Submitted by: {ex.submittedByName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-extrabold text-slate-900">TZS {Number(ex.amount || 0).toLocaleString()}</span>
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

            {pendingExpenses.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs italic flex flex-col items-center gap-2">
                <Clock size={20} className="text-slate-300" />
                Nothing pending.
              </div>
            )}
          </div>
        </div>
      )}

      {canApproveRequests && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users size={15} className="text-indigo-500" />
                <span>Pending Staff Requests</span>
              </h3>
              <p className="text-xs text-slate-400">Leave and staff requests awaiting your decision.</p>
            </div>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full uppercase">
              {pendingRequests.length} Pending
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingRequests.map(req => (
              <div key={req.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800">{req.userName} &mdash; {req.requestType} Request</span>
                  <p className="text-[10px] text-slate-400">Department: {req.department}</p>
                  <p className="text-[10px] text-slate-400">Reason: {req.details?.reason}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveRequest(req)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-1 px-3.5 rounded flex items-center gap-1"
                  >
                    <Check size={12} /> Approve
                  </button>
                  <button
                    onClick={() => handleRejectRequest(req)}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs py-1 px-3.5 rounded flex items-center gap-1"
                  >
                    <X size={12} /> Reject
                  </button>
                </div>
              </div>
            ))}

            {pendingRequests.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs italic flex flex-col items-center gap-2">
                <Clock size={20} className="text-slate-300" />
                Nothing pending.
              </div>
            )}
          </div>
        </div>
      )}

      {canVerifyBeneficiaries && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ShieldCheck size={15} className="text-indigo-500" />
                <span>Pending Beneficiary Verifications</span>
              </h3>
              <p className="text-xs text-slate-400">Beneficiary records awaiting field verification sign-off.</p>
            </div>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full uppercase">
              {pendingBeneficiaries.length} Pending
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingBeneficiaries.map(ben => (
              <div key={ben.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800">{ben.name}</span>
                  <p className="text-[10px] text-slate-400">Status: {ben.status}</p>
                </div>

                <button
                  onClick={() => handleVerifyBeneficiary(ben)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-1 px-3.5 rounded flex items-center gap-1"
                >
                  <Check size={12} /> Verify
                </button>
              </div>
            ))}

            {pendingBeneficiaries.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs italic flex flex-col items-center gap-2">
                <Clock size={20} className="text-slate-300" />
                Nothing pending.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
