import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { 
  Shield, Activity, Database, Layers
} from 'lucide-react';
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";

export function SystemAdminView() {
  const { auditLogs } = useProject();
  const [filterType, setFilterType] = useState('ALL');

  const filteredLogs = filterType === 'ALL' 
    ? auditLogs 
    : auditLogs.filter(log => log.actionType === filterType);

  const filterSet = new Set([filterType]);

  const handleFilterChange = (keys) => {
    const val = Array.from(keys)[0] || 'ALL';
    setFilterType(val);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield className="text-indigo-400" />
          <span>System Administrator Control Console</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1">Configure user access directories, inspect immutable cryptographic audit logs, and monitor integration pipelines.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Health Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Activity className="text-emerald-500" size={16} />
            <span>Infrastructure Health</span>
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Firestore Read load</span>
              <span className="font-bold text-emerald-600">Optimal (0.01s latency)</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[24%]"></div>
            </div>
            <div className="flex justify-between text-sm pt-1">
              <span className="text-slate-500">Firebase Auth status</span>
              <span className="font-bold text-emerald-600">Connected</span>
            </div>
            <div className="flex justify-between text-sm pt-1">
              <span className="text-slate-500">Storage capacity</span>
              <span className="font-bold text-slate-700">12% (1.2 GB of 10 GB)</span>
            </div>
          </div>
        </div>

        {/* Roles Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Layers className="text-[#F2A507]" size={16} />
            <span>Active Authorization Roles</span>
          </h3>
          <div className="text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Privileged (Admin/ED/Finance)</span>
              <span className="font-semibold text-slate-800">4 Accounts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Officers (HR/PM/Procure/Comms/Field)</span>
              <span className="font-semibold text-slate-800">6 Accounts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trainees (Volunteers/Interns)</span>
              <span className="font-semibold text-slate-800">2 Accounts</span>
            </div>
          </div>
        </div>

        {/* DB Integrations */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Database className="text-indigo-500" size={16} />
            <span>Core Integrations</span>
          </h3>
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Firestore Sync Module (Active)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Secure Token Auth Encryption</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chronological Audit Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Chronological Security Audit Log</h3>
            <p className="text-sm text-slate-400">Immutable trace of transactions across operations databases.</p>
          </div>
          <ButtonGroup selectedKeys={filterSet} onSelectionChange={handleFilterChange}>
            <ButtonGroupItem id="ALL">All</ButtonGroupItem>
            <ButtonGroupItem id="PROJECT_CREATION">Projects</ButtonGroupItem>
            <ButtonGroupItem id="BUDGET_ENTRY">Budgets</ButtonGroupItem>
            <ButtonGroupItem id="EXPENSE_APPROVAL">Expenses</ButtonGroupItem>
            <ButtonGroupItem id="SYSTEM_HEALTH">Health</ButtonGroupItem>
          </ButtonGroup>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Principal User</th>
                <th className="py-3 px-6">Access Role</th>
                <th className="py-3 px-6">Transaction Type</th>
                <th className="py-3 px-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/40 font-mono">
                  <td className="py-3 px-6 text-slate-400">{log.timestamp}</td>
                  <td className="py-3 px-6 font-semibold text-slate-900">{log.userName}</td>
                  <td className="py-3 px-6 text-slate-500">{log.userRole}</td>
                  <td className="py-3 px-6">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                      log.actionType === 'SYSTEM_HEALTH' ? 'bg-emerald-50 text-emerald-700' :
                      log.actionType === 'PROJECT_CREATION' ? 'bg-indigo-50 text-indigo-700' :
                      log.actionType === 'EXPENSE_APPROVAL' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {log.actionType}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-slate-600 font-sans">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
