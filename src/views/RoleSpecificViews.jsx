import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { 
  Shield, Users, Activity, FileText, Database, Heart, Clock, AlertTriangle, 
  Plus, Upload, Trash2, Calendar, FileSpreadsheet, Check, X, Clipboard, 
  MapPin, Image, Radio, Wifi, WifiOff, FileCheck, Send, Layers, UserCheck, 
  Briefcase, MessageSquare, BookOpen, Download,
  Search, Building, ChevronRight, ChevronDown, ChevronUp, Mail, Phone,
  DollarSign, AlertCircle, UserMinus, LayoutDashboard, Eye
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Avatar, AvatarProfilePhoto } from "@/components/base/avatar/avatar";
import { AvatarAddButton } from "@/components/base/avatar/base-components";
import { BadgeGroup } from "@/components/base/badges/badge-groups";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Illustration } from "@/components/shared-assets/illustrations";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ProgressBarHalfCircle } from "@/components/base/progress-indicators/progress-circles";
import { Select } from "@/components/base/select/select";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { InputBase } from "@/components/base/input/input";


// ==========================================
// 1. SYSTEM ADMINISTRATOR VIEW
// ==========================================
export function SystemAdminView() {
  const { auditLogs } = useProject();
  const { mockUsers } = useAuth();
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
        <p className="text-slate-400 text-xs mt-1">Configure user access directories, inspect immutable cryptographic audit logs, and monitor integration pipelines.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Health Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Activity className="text-emerald-500" size={16} />
            <span>Infrastructure Health</span>
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Firestore Read load</span>
              <span className="font-bold text-emerald-600">Optimal (0.01s latency)</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[24%]"></div>
            </div>
            <div className="flex justify-between text-xs pt-1">
              <span className="text-slate-500">Firebase Auth status</span>
              <span className="font-bold text-emerald-600">Connected</span>
            </div>
            <div className="flex justify-between text-xs pt-1">
              <span className="text-slate-500">Storage capacity</span>
              <span className="font-bold text-slate-700">12% (1.2 GB of 10 GB)</span>
            </div>
          </div>
        </div>

        {/* Roles Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Layers className="text-blue-500" size={16} />
            <span>Active Authorization Roles</span>
          </h3>
          <div className="text-xs space-y-1.5">
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
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Database className="text-indigo-500" size={16} />
            <span>Core Integrations</span>
          </h3>
          <div className="text-xs space-y-2">
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
            <h3 className="font-bold text-slate-800 text-sm">Chronological Security Audit Log</h3>
            <p className="text-xs text-slate-400">Immutable trace of transactions across operations databases.</p>
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
              <tr className="bg-slate-100/50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Principal User</th>
                <th className="py-3 px-6">Access Role</th>
                <th className="py-3 px-6">Transaction Type</th>
                <th className="py-3 px-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/40 font-mono">
                  <td className="py-3 px-6 text-slate-400">{log.timestamp}</td>
                  <td className="py-3 px-6 font-semibold text-slate-900">{log.userName}</td>
                  <td className="py-3 px-6 text-slate-500">{log.userRole}</td>
                  <td className="py-3 px-6">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
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

// ==========================================
// 2. EXECUTIVE DIRECTOR VIEW
// ==========================================
export function ExecutiveDirectorView() {
  const { projects, expenses, updateExpenseStatus } = useProject();
  const [boardReportStatus, setBoardReportStatus] = useState('');

  const pendingStrategicExpenses = expenses.filter(ex => ex.status === 'Pending' && ex.amount >= 2000);
  const totalKPIBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const avgProgress = Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / (projects.length || 1));

  const handleGenerateReport = () => {
    setBoardReportStatus('compiling');
    setTimeout(() => {
      setBoardReportStatus('ready');
    }, 1500);
  };

  const handleApproveExpense = (id, description, amount) => {
    Swal.fire({
      title: 'Approve Strategic Expense?',
      text: `Are you sure you want to approve KES ${amount.toLocaleString()} for "${description}"?`,
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
        <p className="text-slate-400 text-xs mt-1">Cross-project operational metrics, high-value strategic budget approvals, and executive briefings generator.</p>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Aggregate Project Budget Limit</span>
          <span className="text-2xl font-extrabold text-slate-800 block">KES {totalKPIBudget.toLocaleString()}</span>
          <span className="text-xs text-slate-500 block pt-2">Allocated across {projects.length} portfolios.</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Portfolio Execution Index</span>
            <span className="text-2xl font-extrabold text-slate-850 block">{avgProgress}%</span>
            <span className="text-xs text-emerald-600 font-semibold block pt-2">Average project progress.</span>
          </div>
          <div className="scale-75 origin-right">
            <ProgressBarHalfCircle size="xs" label="Progress" value={avgProgress} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Board Report Readiness</span>
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

      {boardReportStatus === 'compiling' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center animate-pulse text-xs font-semibold text-slate-500">
          Gathering cross-project indicators, financial ledger files, and HR directories...
        </div>
      )}

      {boardReportStatus === 'ready' && (
        <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-start border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-800 text-sm">Compiled Board Briefing: Q3 2026</h4>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded uppercase">Ready to Export</span>
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <p><strong>Executive Summary:</strong> The organization portfolio contains {projects.length} projects running with high output efficiency. Total fiscal liability is KES {totalKPIBudget}.</p>
            <p><strong>Core Deliverables:</strong> Website Redesign is currently at 60% completion. Security Audit is 100% completed.</p>
          </div>
        </div>
      )}

      {/* Strategic Approval Queue (High-Value Budgets >= 2,000) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-250 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Strategic Approval Queue (KES &gt;= 2,000)</h3>
          <p className="text-xs text-slate-400">High-value expenses requiring executive director sign-off.</p>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingStrategicExpenses.map(ex => (
            <div key={ex.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800">{ex.description}</span>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Project: {ex.projectName}</span>
                  <span>•</span>
                  <span>Submitted by: {ex.submittedByName} ({ex.department})</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm font-extrabold text-slate-900">KES {ex.amount.toLocaleString()}</span>
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
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No strategic high-value expenses pending approval.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. HR OFFICER VIEW
// ==========================================
export function OnboardingEngine() {
  const { addUser } = useProject();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [personalId, setPersonalId] = useState('');
  const [cvName, setCvName] = useState('');
  const [nhif, setNhif] = useState('');
  const [nssf, setNssf] = useState('');
  const [role, setRole] = useState('Volunteer');
  const [department, setDepartment] = useState('Engineering');
  const [generatedUser, setGeneratedUser] = useState(null);

  const roleItems = [
    { label: "Volunteer", id: "Volunteer" },
    { label: "Intern", id: "Intern" },
    { label: "Program Officer", id: "Program Officer" },
    { label: "Finance Officer", id: "Finance Officer" },
    { label: "Project Manager", id: "Project Manager" },
    { label: "Procurement & Logistics Officer", id: "Procurement & Logistics Officer" },
    { label: "Department Head", id: "Department Head" },
    { label: "Communications Officer", id: "Communications Officer" },
    { label: "Field Officer", id: "Field Officer" }
  ];

  const deptItems = [
    { label: "Engineering", id: "Engineering" },
    { label: "Program Management", id: "Program Management" },
    { label: "HR", id: "HR" },
    { label: "Communications", id: "Communications" },
    { label: "Finance", id: "Finance" },
    { label: "Procurement", id: "Procurement" },
    { label: "Field Operations", id: "Field Operations" }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;

    Swal.fire({
      title: 'Confirm Onboarding',
      text: `Are you sure you want to onboard ${name} as a ${role} in the ${department} department?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Onboard Resource'
    }).then((result) => {
      if (result.isConfirmed) {
        const tempPassword = 'OMS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const onboardedUser = {
          name,
          email,
          phone,
          personalId,
          cvName,
          nhif,
          nssf,
          role,
          department,
          tempPassword
        };

        addUser(onboardedUser);
        setGeneratedUser(onboardedUser);

        // Reset Form
        setName('');
        setEmail('');
        setPhone('');
        setPersonalId('');
        setCvName('');
        setNhif('');
        setNssf('');

        Swal.fire({
          title: 'Success!',
          text: `Security profile has been successfully initialized and generated for ${onboardedUser.name}.`,
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <UserCheck className="text-indigo-650" size={18} />
          <span>Staff Onboarding Engine</span>
        </h3>
        <p className="text-[11px] text-slate-400">Onboard new organizational talent, record mandatory support files, and auto-initialize security profiles.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Samuel Kimani" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-805 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="e.g. samuel@oms.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-850 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
            <input 
              type="text" 
              placeholder="e.g. +254 700 123 456" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-850 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">National ID Number</label>
            <input 
              type="text" 
              required
              placeholder="e.g. 34567890" 
              value={personalId}
              onChange={(e) => setPersonalId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-850 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CV Document Name</label>
            <input 
              type="text" 
              placeholder="e.g. CV_Kimani.pdf" 
              value={cvName}
              onChange={(e) => setCvName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-850 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NHIF Identifier</label>
            <input 
              type="text" 
              required
              placeholder="NHIF Number" 
              value={nhif}
              onChange={(e) => setNhif(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-850 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">PSSF / NSSF Code</label>
            <input 
              type="text" 
              required
              placeholder="NSSF Number" 
              value={nssf}
              onChange={(e) => setNssf(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-850 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              isRequired
              label="Assigned Security Role"
              placeholder="Select security role"
              value={role}
              onChange={setRole}
              items={roleItems}
            >
              {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
            </Select>
          </div>
          <div>
            <Select
              isRequired
              label="Operational Department"
              placeholder="Select department"
              value={department}
              onChange={setDepartment}
              items={deptItems}
            >
              {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
            </Select>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-650/10"
        >
          <UserCheck size={14} />
          <span>Execute Onboarding and Credentials Auto-Gen</span>
        </button>
      </form>

      {generatedUser && (
        <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 space-y-2.5 animate-fadeIn">
          <BadgeGroup addonText="Success" color="success" theme="light" align="leading" size="md">
            You've successfully created a new staff profile
          </BadgeGroup>
          <div className="text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-650 font-mono bg-white p-3 rounded-lg border border-indigo-100">
            <div><strong>Name:</strong> {generatedUser.name}</div>
            <div><strong>Email:</strong> {generatedUser.email}</div>
            <div><strong>Role:</strong> {generatedUser.role}</div>
            <div><strong>Dept:</strong> {generatedUser.department}</div>
            <div><strong>NHIF:</strong> {generatedUser.nhif}</div>
            <div><strong>NSSF/PSSF:</strong> {generatedUser.nssf}</div>
            <div className="col-span-1 sm:col-span-2 text-indigo-700 font-semibold border-t border-indigo-50 pt-1.5 mt-1 truncate">
              <strong>Temporary Password:</strong> {generatedUser.tempPassword}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StaffStatusController() {
  const { users, updateUser } = useProject();
  const [filterDept, setFilterDept] = useState(new Set(['ALL']));

  const handleStatusChange = (userId, newStatus) => {
    const targetUser = users.find(u => u.id === userId);
    Swal.fire({
      title: 'Confirm Status Change',
      text: `Are you sure you want to change the status of ${targetUser?.name} to "${newStatus}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Confirm'
    }).then((result) => {
      if (result.isConfirmed) {
        updateUser(userId, { status: newStatus });
        Swal.fire({
          title: 'Updated!',
          text: `Status updated to ${newStatus}.`,
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
      }
    });
  };

  const handleDeptChange = (userId, newDept) => {
    const targetUser = users.find(u => u.id === userId);
    Swal.fire({
      title: 'Confirm Reassignment',
      text: `Reassign ${targetUser?.name} to the "${newDept}" department?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Reassign'
    }).then((result) => {
      if (result.isConfirmed) {
        updateUser(userId, { department: newDept });
        Swal.fire({
          title: 'Reassigned!',
          text: `Department reassigned to ${newDept}.`,
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
      }
    });
  };

  // Convert Set selection for filter
  const filterKey = Array.from(filterDept)[0] || 'ALL';

  const filteredUsers = filterKey === 'ALL'
    ? users
    : users.filter(u => u.department === filterKey);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
      <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Users className="text-indigo-650" size={18} />
            <span>Staff Status Controller Directory</span>
          </h3>
          <p className="text-[11px] text-slate-400">View corporate directories, toggle active/leave/suspended permissions, and reallocate departments.</p>
        </div>

        {/* Filter buttons */}
        <div className="shrink-0">
          <ButtonGroup selectedKeys={filterDept} onSelectionChange={setFilterDept}>
            <ButtonGroupItem id="ALL">All</ButtonGroupItem>
            <ButtonGroupItem id="Engineering">Eng</ButtonGroupItem>
            <ButtonGroupItem id="HR">HR</ButtonGroupItem>
            <ButtonGroupItem id="Finance">Finance</ButtonGroupItem>
          </ButtonGroup>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[360px] overflow-y-auto pr-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-150 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
              <th className="pb-2.5 pt-1.5 px-3">Name</th>
              <th className="pb-2.5 pt-1.5">Role</th>
              <th className="pb-2.5 pt-1.5">Department</th>
              <th className="pb-2.5 pt-1.5 text-right px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/30">
                <td className="py-2 px-3 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <Avatar 
                      size="xs" 
                      src={u.avatar || "https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80"} 
                      alt={u.name} 
                      className="ring-1 ring-slate-100" 
                    />
                    <div className="flex flex-col">
                      <span className="truncate max-w-[120px]">{u.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono font-normal truncate max-w-[120px]">{u.email}</span>
                    </div>
                  </div>
                </td>
                <td className="py-2 font-medium text-slate-500 truncate max-w-[100px]" title={u.role}>{u.role}</td>
                <td className="py-2">
                  <select 
                    value={u.department}
                    onChange={(e) => handleDeptChange(u.id, e.target.value)}
                    className="border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Executive">Executive</option>
                    <option value="Engineering">Engineering</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Communications">Communications</option>
                    <option value="Program Management">Program Management</option>
                    <option value="Field Operations">Field Operations</option>
                  </select>
                </td>
                <td className="py-2 text-right px-3">
                  <select 
                    value={u.status || 'Active'}
                    onChange={(e) => handleStatusChange(u.id, e.target.value)}
                    className={`border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-bold focus:outline-none focus:border-indigo-500 ${
                      (u.status || 'Active') === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                      (u.status || 'Active') === 'Suspended' ? 'bg-rose-50 text-rose-700 border-rose-250' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function HrOfficerView() {
  const { requests, updateRequestStatus } = useProject();
  const leaveRequests = requests.filter(r => r.requestType === 'Leave');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="text-indigo-400" />
          <span>HR Onboarding Engine & Staff Status Controller</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">Register new profiles, auto-generate temporary credentials, reallocate departments, and process organizational leave requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Onboarding Form */}
        <OnboardingEngine />

        {/* Staff status matrix grid */}
        <StaffStatusController />
      </div>

      {/* Leave & Status Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Calendar className="text-indigo-500" size={16} />
            <span>Leave / Attendance approval pipeline</span>
          </h3>
          <p className="text-[11px] text-slate-400">Review time-off requests submitted by organizational resources.</p>
        </div>

        <div className="divide-y divide-slate-100">
          {leaveRequests.map(req => (
            <div key={req.id} className="py-3.5 flex justify-between items-center text-xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-800">{req.userName} ({req.department})</div>
                <div className="text-slate-455 text-[10px] font-medium">
                  Requested Dates: {req.details.startDate} to {req.details.endDate} — Reason: {req.details.reason}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                  req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                  req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-250' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {req.status}
                </span>
                
                {req.status === 'pending' && (
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => {
                        Swal.fire({
                          title: 'Approve Leave Request',
                          text: `Approve leave request for ${req.userName}?`,
                          icon: 'question',
                          showCancelButton: true,
                          confirmButtonColor: '#10b981',
                          confirmButtonText: 'Yes, Approve'
                        }).then((res) => {
                          if (res.isConfirmed) {
                            updateRequestStatus(req.id, 'Approved');
                            Swal.fire('Approved!', 'Leave has been approved.', 'success');
                          }
                        });
                      }}
                      className="p-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded transition-colors"
                      title="Approve Leave"
                    >
                      <Check size={13} />
                    </button>
                    <button 
                      onClick={() => {
                        Swal.fire({
                          title: 'Deny Leave Request',
                          text: `Deny leave request for ${req.userName}?`,
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonColor: '#ef4444',
                          confirmButtonText: 'Yes, Deny'
                        }).then((res) => {
                          if (res.isConfirmed) {
                            updateRequestStatus(req.id, 'rejected');
                            Swal.fire('Denied', 'Leave request has been denied.', 'info');
                          }
                        });
                      }}
                      className="p-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-750 rounded transition-colors"
                      title="Deny Leave"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {leaveRequests.length === 0 && (
            <div className="p-6 text-center text-slate-400 text-xs italic">
              No leave requests currently pending HR processing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. PROJECT MANAGER VIEW
export function ProjectManagerView() {
  const { 
    projects, 
    projectFiles, 
    addProject, 
    addProjectFile, 
    updateProject, 
    users, 
    announcements,
    setActivePreviewDoc 
  } = useProject();
  const { policyVault } = useAuth();
  
  const [activePmTab, setActivePmTab] = useState('workspace');
  
  // Workspace Creator & File Browser states
  const [selectedProjId, setSelectedProjId] = useState(projects[0]?.id || '');
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjBudget, setNewProjBudget] = useState('');
  const [newProjStart, setNewProjStart] = useState('');
  const [newProjEnd, setNewProjEnd] = useState('');
  const [activeFolder, setActiveFolder] = useState('Design');
  const [uploadFileName, setUploadFileName] = useState('');

  // Portfolio & Teams states
  const [editingProjId, setEditingProjId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editProgress, setEditProgress] = useState(0);
  const [selectedStaffToAssign, setSelectedStaffToAssign] = useState('');

  // Resource Directory states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Directives states
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [noticeType, setNoticeType] = useState('Milestone Delivery Directive');
  const [noticeNotes, setNoticeNotes] = useState('');

  // Sync selectedProjId if it's empty but projects exist
  useEffect(() => {
    if (!selectedProjId && projects.length > 0) {
      setSelectedProjId(projects[0].id);
    }
  }, [projects, selectedProjId]);

  const currentFiles = projectFiles.filter(f => f.projectId === selectedProjId && f.folderPath === activeFolder);
  const selectedProj = projects.find(p => p.id === selectedProjId);
  const progressVal = selectedProj ? selectedProj.progress || 0 : 0;

  const handleCreateProj = (e) => {
    e.preventDefault();
    if (!newProjName || !newProjStart || !newProjEnd) return;

    addProject({
      name: newProjName,
      description: newProjDesc,
      budget: parseFloat(newProjBudget || 2000),
      startDate: newProjStart,
      endDate: newProjEnd
    });

    setNewProjName('');
    setNewProjDesc('');
    setNewProjBudget('');
    Swal.fire('Workspace Spun Up!', `Initialized isolated workspace for "${newProjName}".`, 'success');
  };

  const handleFileUpload = (e) => {
    e.preventDefault();
    if (!uploadFileName || !selectedProjId) return;

    addProjectFile(selectedProjId, uploadFileName, activeFolder);
    setUploadFileName('');
    Swal.fire({
      title: 'File Uploaded!',
      text: `Successfully synced file to database storage path: "/${activeFolder}/${uploadFileName}".`,
      icon: 'success',
      confirmButtonColor: '#4f46e5'
    });
  };

  const handleUpdateProjectSettings = (e, projId) => {
    e.preventDefault();
    updateProject(projId, {
      status: editStatus,
      progress: parseInt(editProgress, 10) || 0
    });
    setEditingProjId(null);
    Swal.fire('Project Updated!', 'Successfully saved status and progress changes.', 'success');
  };

  const handleAssignStaff = (projId) => {
    if (!selectedStaffToAssign) return;
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    
    const currentStaff = proj.assignedStaff || [];
    if (currentStaff.includes(selectedStaffToAssign)) {
      Swal.fire('Already Assigned', 'This staff member is already assigned to the project.', 'warning');
      return;
    }

    const updatedStaff = [...currentStaff, selectedStaffToAssign];
    updateProject(projId, { assignedStaff: updatedStaff });
    setSelectedStaffToAssign('');
    Swal.fire('Personnel Assigned!', 'Successfully added team member to this project workspace.', 'success');
  };

  const handleUnassignStaff = (projId, staffId) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;

    const currentStaff = proj.assignedStaff || [];
    const updatedStaff = currentStaff.filter(id => id !== staffId);
    
    Swal.fire({
      title: 'Remove Team Member?',
      text: 'Are you sure you want to remove this member from the project?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, remove'
    }).then((result) => {
      if (result.isConfirmed) {
        updateProject(projId, { assignedStaff: updatedStaff });
        Swal.fire('Removed!', 'Personnel unassigned from the project.', 'success');
      }
    });
  };

  const handleSendDirective = (e) => {
    e.preventDefault();
    if (!selectedStaffId || !noticeNotes) {
      Swal.fire('Error', 'Please select a staff member and write your directive notes.', 'error');
      return;
    }
    const staff = users.find(u => u.id === selectedStaffId);
    Swal.fire({
      title: 'Project Directive Dispatched',
      text: `Successfully dispatched directive notice (${noticeType}) to ${staff ? staff.name : 'Staff'}.`,
      icon: 'success'
    });
    setSelectedStaffId('');
    setNoticeNotes('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub Tab Navigation */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        {[
          { id: 'workspace', label: 'Workspaces & Files', icon: FileText },
          { id: 'portfolio', label: 'Portfolio & Teams', icon: Layers },
          { id: 'directory', label: 'Resource Directory', icon: Users },
          { id: 'directives', label: 'Directives & Announcements', icon: Send },
          { id: 'templates', label: 'Templates & Policies', icon: BookOpen }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePmTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activePmTab === tab.id
                  ? 'bg-indigo-650 text-white shadow'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Workspaces & Files */}
      {activePmTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workspace Creator */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Plus className="text-indigo-500" size={16} />
              <span>Workspace Creator</span>
            </h3>

            <form onSubmit={handleCreateProj} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Project Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Mombasa Port Assessment" 
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Brief Objectives</label>
                <textarea 
                  placeholder="Objectives..." 
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Starting Budget Limit (KES)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 5000" 
                  value={newProjBudget}
                  onChange={(e) => setNewProjBudget(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date</label>
                  <input 
                    type="date" 
                    required 
                    value={newProjStart}
                    onChange={(e) => setNewProjStart(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-805 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Date</label>
                  <input 
                    type="date" 
                    required 
                    value={newProjEnd}
                    onChange={(e) => setNewProjEnd(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-805 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Initialize Project Workspace
              </button>
            </form>
          </div>

          {/* Structured File Browser */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileCheck className="text-indigo-500" size={16} />
                <span>Advanced Structured File Browser</span>
              </h3>
              
              <div className="flex items-center gap-4 text-xs">
                {selectedProj && (
                  <div className="scale-75 origin-right translate-y-1.5">
                    <ProgressBarHalfCircle size="xxs" label="Done" value={progressVal} />
                  </div>
                )}
                <select 
                  value={selectedProjId}
                  onChange={(e) => setSelectedProjId(e.target.value)}
                  className="border border-slate-200 rounded px-2.5 py-1 bg-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Folder tabs */}
            <div className="flex border-b border-slate-150 gap-2">
              {['Design', 'Engineering', 'Audit', 'Reports'].map(folder => (
                <button
                  key={folder}
                  onClick={() => setActiveFolder(folder)}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                    activeFolder === folder 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  /{folder}
                </button>
              ))}
            </div>

            {/* File Upload Simulator */}
            <form onSubmit={handleFileUpload} className="flex gap-2">
              <input 
                type="text" 
                required
                placeholder="e.g. Website_Audit_Specs_v2.pdf" 
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
              />
              <button 
                type="submit" 
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-1.5 px-4 rounded flex items-center gap-1.5"
              >
                <Upload size={13} />
                <span>Upload to /{activeFolder}</span>
              </button>
            </form>

            {/* Files List */}
            <div className="space-y-2">
              {currentFiles.map(file => (
                <div key={file.id} className="p-3 bg-slate-50 border border-slate-150 rounded flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <FileText size={14} className="text-slate-400" />
                      <span>{file.fileName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <Avatar 
                        size="xxs" 
                        src="https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80" 
                        alt={file.senderName} 
                        className="ring-1 ring-slate-100" 
                      />
                      <span>Sender: {file.senderName} ({file.senderOriginId}) • Uploaded: {new Date(file.uploadedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{file.size}</span>
                </div>
              ))}

              {currentFiles.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Illustration type="documents" size="xs" />
                  <p className="mt-2 italic">No files found in folder project "/{activeFolder}".</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Portfolio & Teams */}
      {activePmTab === 'portfolio' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((proj) => {
            const assignedIds = proj.assignedStaff || [];
            const assignedMembers = users.filter(u => assignedIds.includes(u.id));
            const unassignedMembers = users.filter(u => !assignedIds.includes(u.id) && u.role !== 'System Administrator');
            const isEditing = editingProjId === proj.id;

            return (
              <div key={proj.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{proj.name}</h4>
                      <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">{proj.description}</p>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                        Budget: KES {proj.budget?.toLocaleString()} Limit • {proj.startDate} to {proj.endDate}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                        proj.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        proj.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        proj.status === 'On Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {proj.status}
                      </span>
                      <span className="block text-xs font-extrabold text-slate-700 mt-1">{proj.progress}% Done</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-650 h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                  </div>

                  {/* Edit status/progress */}
                  {isEditing ? (
                    <form onSubmit={(e) => handleUpdateProjectSettings(e, proj.id)} className="bg-slate-50 border border-slate-150 rounded-lg p-3 space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-xs"
                          >
                            <option value="Planning">Planning</option>
                            <option value="In Progress">In Progress</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Progress (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editProgress}
                            onChange={(e) => setEditProgress(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingProjId(null)}
                          className="px-2.5 py-1 text-slate-550 hover:bg-slate-200 rounded font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-indigo-650 text-white rounded font-semibold hover:bg-indigo-700"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setEditingProjId(proj.id);
                          setEditStatus(proj.status || 'Planning');
                          setEditProgress(proj.progress || 0);
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded font-semibold text-[10px]"
                      >
                        Update Status/Progress
                      </button>
                    </div>
                  )}

                  {/* Team Assignment List */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Assigned Project Personnel</span>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                      {assignedMembers.map((member) => (
                        <div key={member.id} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded">
                          <div className="flex items-center gap-2">
                            <Avatar size="xs" src={member.avatar || 'https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80'} alt={member.name} />
                            <div className="text-xs">
                              <div className="font-bold text-slate-800">{member.name}</div>
                              <span className="text-[9px] text-slate-400">{member.officeDetails?.position || member.role}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnassignStaff(proj.id, member.id)}
                            className="text-[9px] text-rose-500 hover:bg-rose-50 border border-rose-100 px-2 py-0.5 rounded font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {assignedMembers.length === 0 && (
                        <p className="text-[11px] text-slate-400 italic text-center py-2">No team members assigned yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assign Personnel Form */}
                <div className="pt-3 mt-3 border-t border-slate-100 text-xs">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Assign Team Member</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedStaffToAssign}
                      onChange={(e) => setSelectedStaffToAssign(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded border border-slate-200 bg-white"
                    >
                      <option value="">Select Employee...</option>
                      {unassignedMembers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.officeDetails?.position || u.role})</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssignStaff(proj.id)}
                      className="bg-indigo-650 hover:bg-indigo-750 text-white px-3 py-1.5 rounded font-semibold text-[11px]"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {projects.length === 0 && (
            <div className="col-span-2 text-center text-slate-400 py-12 bg-white rounded-xl border border-slate-200">
              No projects found. Use the "Workspaces & Files" tab to create one.
            </div>
          )}
        </div>
      )}

      {/* Tab: Resource Directory */}
      {activePmTab === 'directory' && (
        <div className="space-y-6 relative animate-fadeIn">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
            />
          </div>

          {/* Staff Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {users.filter(u => 
              u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
              u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              u.role?.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(u => {
              const dept = u.officeDetails?.department || u.department || 'Operations';
              const uStatus = u.officeDetails?.status || u.status || 'Active';
              return (
                <div 
                  key={u.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center text-center space-y-4 hover:border-indigo-300 transition-all cursor-pointer"
                  onClick={() => setSelectedUser(u)}
                >
                  <Avatar size="lg" src={u.avatar} alt={u.name} className="ring-2 ring-slate-100" />
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{u.name}</h4>
                    <p className="text-slate-400 text-[10px] mt-0.5">{u.officeDetails?.position || u.role}</p>
                  </div>
                  <div className="flex flex-col gap-1 w-full text-[10px]">
                    <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-455">
                      <span>Department</span>
                      <span className="font-bold text-slate-700">{dept}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-1.5 text-slate-455">
                      <span>Status</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        uStatus === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                        uStatus === 'Suspended' ? 'bg-rose-50 text-rose-700' :
                        uStatus === 'On Leave' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700'
                      }`}>
                        {uStatus}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected User Modal Popup */}
          {selectedUser && (
            <div 
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedUser(null)}
            >
              <div 
                className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Popup Header */}
                <div className="px-6 py-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between text-white shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar size="sm" src={selectedUser.avatar} alt={selectedUser.name} className="ring-1 ring-slate-700" />
                    <div>
                      <h3 className="font-extrabold text-sm leading-none">{selectedUser.name}</h3>
                      <span className="text-[10px] text-slate-400">{selectedUser.email}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Popup Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 select-none no-scrollbar bg-slate-50">
                  {/* Profile Details Grid */}
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Personal Credentials</h5>
                    <div className="grid grid-cols-2 gap-3 text-xs bg-white border border-slate-200 rounded-lg p-3">
                      <div>
                        <span className="text-slate-400 block">Organization Email</span>
                        <span className="font-semibold text-slate-700 truncate block">{selectedUser.organizationEmail || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Phone Contact</span>
                        <span className="font-semibold text-slate-700">{selectedUser.phone || selectedUser.personalDetails?.phone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Work Location</span>
                        <span className="font-semibold text-slate-700">{selectedUser.officeDetails?.officeLocation || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Place of Living</span>
                        <span className="font-semibold text-slate-700">{selectedUser.personalDetails?.placeOfLiving || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Gender Type</span>
                        <span className="font-semibold text-slate-700">{selectedUser.personalDetails?.gender || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Date of Birth (DOB)</span>
                        <span className="font-semibold text-slate-700">{selectedUser.personalDetails?.dob || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Place of Birth</span>
                        <span className="font-semibold text-slate-700">{selectedUser.personalDetails?.placeOfBirth || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Disability Status</span>
                        <span className="font-semibold text-slate-700">
                          {selectedUser.personalDetails?.disability === 'Yes' 
                            ? `Yes (${selectedUser.personalDetails?.disabilityDescription || 'Specified'})`
                            : 'None'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Nationality</span>
                        <span className="font-semibold text-slate-700">{selectedUser.personalDetails?.nationality || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">National ID No</span>
                        <span className="font-semibold text-slate-700">{selectedUser.personalId || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Office Details */}
                  <div className="space-y-2 pt-2 border-t border-slate-150">
                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Office Description</h5>
                    <div className="grid grid-cols-2 gap-3 text-xs bg-white border border-slate-200 rounded-lg p-3">
                      <div>
                        <span className="text-slate-400 block">Department Unit</span>
                        <span className="font-semibold text-slate-700">{selectedUser.officeDetails?.department || selectedUser.department || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Current Designation</span>
                        <span className="font-semibold text-slate-700">{selectedUser.officeDetails?.position || selectedUser.role || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Hire / Start Date</span>
                        <span className="font-semibold text-slate-700">{selectedUser.officeDetails?.hireDate || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Office Location</span>
                        <span className="font-semibold text-slate-700">{selectedUser.officeDetails?.officeLocation || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attached Supporting Documents */}
                  <div className="space-y-2 pt-2 border-t border-slate-150">
                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Attached Supporting Documents</h5>
                    <div className="space-y-2 text-xs">
                      {[
                        { key: 'cv', name: 'Curriculum Vitae (CV)' },
                        { key: 'certificates', name: 'Academic Certificates' },
                        { key: 'contract', name: 'Employment Agreement Contract' }
                      ].map((docItem) => {
                        const attachedFile = selectedUser.supportingDocuments?.[docItem.key];
                        return (
                          <div key={docItem.key} className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-2.5 hover:border-slate-350 transition-all">
                            <span className="font-medium text-slate-755 truncate max-w-[200px]">{docItem.name}</span>
                            <div className="flex items-center gap-1.5">
                              {attachedFile ? (
                                <>
                                  <span className="text-[9px] text-slate-400 font-mono truncate max-w-[100px]">Attachment File</span>
                                  <button 
                                    onClick={() => setActivePreviewDoc({ fileName: docItem.name, dataUrl: attachedFile })}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-750 hover:text-slate-900"
                                    title="Preview document"
                                  >
                                    <Eye size={13} />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Not Attached</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Popup Footer */}
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-all"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Directives & Announcements */}
      {activePmTab === 'directives' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
          {/* Left: Project Bulletins */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <LayoutDashboard size={16} className="text-indigo-500" />
                <span>Project Bulletin & Announcements</span>
              </h3>
              <p className="text-[10px] text-slate-400">Review announcements and board circulars broadcasted to all staff.</p>
            </div>

            <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
              {announcements.map(ann => (
                <div key={ann.id} className="py-3 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-800">{ann.title}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{new Date(ann.publishedAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-650 leading-relaxed text-[11px]">{ann.content}</p>
                  <div className="text-[9px] text-slate-400">Author: {ann.authorName || 'Management'}</div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">No bulletins found.</div>
              )}
            </div>
          </div>

          {/* Right: Dispatch Project Directive */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-500" />
                <span>Dispatch Project Directive / Alert Notice</span>
              </h3>
              <p className="text-[10px] text-slate-400">Issue direct task reminders, milestones alerts, or compliance warnings to resources.</p>
            </div>

            <form onSubmit={handleSendDirective} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 block">Select Target Resource</label>
                <select 
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">Select Employee...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.officeDetails?.position || u.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 block">Directive Type</label>
                <select 
                  value={noticeType}
                  onChange={(e) => setNoticeType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Milestone Delivery Directive">Milestone Delivery Directive</option>
                  <option value="Compliance Disciplinary Warning">Compliance Disciplinary Warning</option>
                  <option value="Task Overdue Reminder">Task Overdue Reminder</option>
                  <option value="Budget Compliance Warning">Budget Compliance Warning</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 block">Directive Description Notes</label>
                <textarea 
                  value={noticeNotes}
                  onChange={(e) => setNoticeNotes(e.target.value)}
                  placeholder="Type the formal instruction details..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 h-24"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Send size={13} />
                <span>Send Directive</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Templates & Policies */}
      {activePmTab === 'templates' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {policyVault.map((docItem, idx) => (
              <div key={docItem.id || idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all">
                <div className="flex gap-3 items-start">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
                    <BookOpen size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-slate-800 text-xs truncate max-w-[180px]">{docItem.title}</h4>
                    <span className="text-[10px] text-slate-455 block">{docItem.category} • {docItem.size || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Updated: {docItem.updated || 'N/A'}</span>
                  <button 
                    onClick={() => Swal.fire('Preview Mode', `Loading preview for "${docItem.title}"...`, 'info')}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Open Document
                  </button>
                </div>
              </div>
            ))}
            {policyVault.length === 0 && (
              <div className="col-span-3 text-center text-slate-400 py-12 bg-white rounded-xl border border-slate-200">
                No templates or policy documents found in the vault.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


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
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Project Portfolio</label>
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Line Item Description</label>
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expense Category</label>
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount (KES)</label>
                <input 
                  type="number" 
                  required 
                  placeholder="KES" 
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
                <span>Cumulative Portfolio Allocation: KES {activeBudget.allocatedBudget.toLocaleString()}</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase">
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
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase border border-slate-200">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">KES {item.allocatedAmount.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-semibold text-rose-600">KES {item.spent.toLocaleString()}</td>
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
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
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
                <span className="text-xs font-extrabold text-slate-800">KES {ex.amount.toLocaleString()}</span>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => updateExpenseStatus(ex.id, 'Approved')}
                    className="p-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded transition-colors"
                  >
                    <Check size={12} />
                  </button>
                  <button 
                    onClick={() => updateExpenseStatus(ex.id, 'Rejected')}
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

// ==========================================
// 6. PROCUREMENT & LOGISTICS VIEW
// ==========================================
export function ProcurementView() {
  const { assetsAndVendors, orders, addAssetOrVendor, createOrder, updateOrderStatus } = useProject();
  
  // Assets Register State
  const [assetCode, setAssetCode] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetStatus, setAssetStatus] = useState('Operational');

  // Vendor Register State
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorCategory, setVendorCategory] = useState('IT Support');

  // Orders State
  const [orderType, setOrderType] = useState('Purchase');
  const [orderVendor, setOrderVendor] = useState('');
  const [orderItemDesc, setOrderItemDesc] = useState('');
  const [orderItemQty, setOrderItemQty] = useState('');
  const [orderItemPrice, setOrderItemPrice] = useState('');

  const vendors = assetsAndVendors.filter(av => av.type === 'vendor');
  const assets = assetsAndVendors.filter(av => av.type === 'asset');

  const handleAddAsset = (e) => {
    e.preventDefault();
    if (!assetCode || !assetName) return;
    addAssetOrVendor('asset', { assetCode, name: assetName, status: assetStatus });
    setAssetCode('');
    setAssetName('');
  };

  const handleAddVendor = (e) => {
    e.preventDefault();
    if (!vendorName || !vendorEmail) return;
    addAssetOrVendor('vendor', { vendorName, contactPerson: vendorContact, email: vendorEmail, category: vendorCategory });
    setVendorName('');
    setVendorContact('');
    setVendorEmail('');
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!orderVendor || !orderItemDesc || !orderItemQty || !orderItemPrice) return;
    
    const items = [{ description: orderItemDesc, quantity: parseInt(orderItemQty), unitPrice: parseFloat(orderItemPrice) }];
    const totalAmount = parseInt(orderItemQty) * parseFloat(orderItemPrice);

    createOrder(orderType, orderVendor, items, totalAmount);
    setOrderItemDesc('');
    setOrderItemQty('');
    setOrderItemPrice('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Layers className="text-indigo-400" />
          <span>Asset & Vendor Registry Command</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">Manage vendor databases, register physical enterprise assets, and execute Purchase, Buy, or Return order workflows.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Asset Register Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Physical Asset Registry</h3>
          <form onSubmit={handleAddAsset} className="grid grid-cols-3 gap-3">
            <input 
              type="text" 
              required
              placeholder="Code (e.g. OMS-ASSET)" 
              value={assetCode} 
              onChange={(e) => setAssetCode(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
            />
            <input 
              type="text" 
              required
              placeholder="Asset Name (e.g. Dell Monitor)" 
              value={assetName} 
              onChange={(e) => setAssetName(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
            />
            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-1.5 rounded">Register Asset</button>
          </form>

          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2">
            {assets.map(as => (
              <div key={as.id} className="p-2 bg-slate-50 border border-slate-150 rounded flex justify-between items-center text-xs">
                <span><strong>{as.details.assetCode}:</strong> {as.details.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  as.details.status === 'Operational' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {as.details.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor Register Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Vendor Registry Directory</h3>
          <form onSubmit={handleAddVendor} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input 
              type="text" 
              required 
              placeholder="Vendor Name" 
              value={vendorName} 
              onChange={(e) => setVendorName(e.target.value)}
              className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
            />
            <input 
              type="text" 
              placeholder="Contact Person" 
              value={vendorContact} 
              onChange={(e) => setVendorContact(e.target.value)}
              className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
            />
            <input 
              type="email" 
              required 
              placeholder="Email" 
              value={vendorEmail} 
              onChange={(e) => setVendorEmail(e.target.value)}
              className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-1.5 rounded">Register Vendor</button>
          </form>

          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2">
            {vendors.map(v => (
              <div key={v.id} className="p-2 bg-slate-50 border border-slate-150 rounded text-xs flex justify-between">
                <span><strong>{v.details.vendorName}</strong> ({v.details.contactPerson})</span>
                <span className="text-[10px] text-slate-400 font-mono">{v.details.email}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Workflow Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">Execute Order Workflow (Purchase / Buy / Return)</h3>
        
        <form onSubmit={handleCreateOrder} className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <select 
            value={orderType} 
            onChange={(e) => setOrderType(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
          >
            <option value="Purchase">Purchase Order</option>
            <option value="Buy">Buy Order</option>
            <option value="Return">Return Order</option>
          </select>
          <select 
            value={orderVendor} 
            onChange={(e) => setOrderVendor(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
          >
            <option value="">Select Vendor...</option>
            {vendors.map(v => (
              <option key={v.id} value={v.details.vendorName}>{v.details.vendorName}</option>
            ))}
          </select>
          <input 
            type="text" 
            required 
            placeholder="Item Description" 
            value={orderItemDesc} 
            onChange={(e) => setOrderItemDesc(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
          />
          <input 
            type="number" 
            required 
            placeholder="Qty" 
            value={orderItemQty} 
            onChange={(e) => setOrderItemQty(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
          />
          <input 
            type="number" 
            required 
            placeholder="Price (KES)" 
            value={orderItemPrice} 
            onChange={(e) => setOrderItemPrice(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-1.5 rounded">Create Order</button>
        </form>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase">
                <th className="pb-2">Order ID</th>
                <th className="pb-2">Order Type</th>
                <th className="pb-2">Vendor Name</th>
                <th className="pb-2">Item Description</th>
                <th className="pb-2">Total Amount</th>
                <th className="pb-2 px-3">Status</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orders.map(ord => (
                <tr key={ord.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 font-semibold text-slate-900">{ord.id}</td>
                  <td className="py-2.5">{ord.orderType}</td>
                  <td className="py-2.5 font-medium">{ord.vendorName}</td>
                  <td className="py-2.5">{ord.items?.[0]?.description} (x{ord.items?.[0]?.quantity})</td>
                  <td className="py-2.5 font-bold text-slate-900">KES {ord.totalAmount.toLocaleString()}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      ord.status === 'Ordered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    {ord.status === 'Draft' && (
                      <button 
                        onClick={() => updateOrderStatus(ord.id, 'Ordered')}
                        className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded hover:bg-slate-800"
                      >
                        Submit Order
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. DEPARTMENT HEAD VIEW
// ==========================================
export function DepartmentHeadView() {
  const { user } = useAuth();
  const { requests, updateRequestStatus, projects } = useProject();

  const myDept = user?.officeDetails?.department || 'Engineering';
  const pendingRequests = requests.filter(r => r.status === 'pending' && r.department === myDept);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Briefcase className="text-indigo-400" />
          <span>Department Dashboard & Approval Inbox</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">Monitor team activities, track task completion ratios, and sign off on internal leave and operational expenses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">My Department</span>
          <span className="text-2xl font-extrabold text-indigo-700 block">{myDept}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Team Capacity</span>
          <span className="text-2xl font-extrabold text-slate-800 block">Active</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Pending Team Claims</span>
          <span className="text-2xl font-extrabold text-slate-800 block">{pendingRequests.length} Inbox Items</span>
        </div>
      </div>

      {/* Approval Inbox */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Department Approval Inbox</h3>
          <p className="text-xs text-slate-400">Claims submitted by personnel in your direct reporting line.</p>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingRequests.map(req => (
            <div key={req.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800">{req.userName} — {req.requestType} Report</span>
                <p className="text-[10px] text-slate-400">Reason: {req.details.reason}</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => updateRequestStatus(req.id, 'Approved')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-1 px-3.5 rounded flex items-center gap-1"
                >
                  <Check size={12} /> Approve
                </button>
                <button 
                  onClick={() => updateRequestStatus(req.id, 'rejected')}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs py-1 px-3.5 rounded flex items-center gap-1"
                >
                  <X size={12} /> Reject
                </button>
              </div>
            </div>
          ))}

          {pendingRequests.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              All clear! No pending approval items in your inbox.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. PROGRAM OFFICER VIEW
// ==========================================
export function ProgramOfficerView() {
  const { user } = useAuth();
  const { projects, addExpense } = useProject();
  
  // Activity Reporting Form State
  const [reportProjId, setReportProjId] = useState('');
  const [reportAmount, setReportAmount] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportFile, setReportFile] = useState('');
  const [submitStatus, setSubmitStatus] = useState(false);

  const assignedTasks = projects.flatMap(p => 
    p.tasks.filter(t => t.assignedTo === user.name).map(t => ({ ...t, projectName: p.name }))
  );

  const handleActivitySubmit = (e) => {
    e.preventDefault();
    if (!reportProjId || !reportAmount || !reportDesc) return;

    addExpense(reportProjId, reportAmount, reportDesc, reportFile);
    setReportAmount('');
    setReportDesc('');
    setReportFile('');
    setSubmitStatus(true);
    setTimeout(() => setSubmitStatus(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="text-indigo-400" />
          <span>My Tasks Calendar & Activity Reporting</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">Review assigned milestone deliverables, record operational logs, and submit project expense claims.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Calendar Grid */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-bold text-slate-800 text-sm">My Project Deliverables</h3>
          
          <div className="space-y-3">
            {assignedTasks.map(task => (
              <div key={task.id} className="p-3 bg-slate-50 border border-slate-150 rounded text-xs space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-800">{task.title}</span>
                  <span className="text-[10px] font-semibold text-indigo-600">{task.projectName}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Status: {task.status}</span>
                  <span className="bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-indigo-700 font-bold uppercase">Assignee</span>
                </div>
              </div>
            ))}

            {assignedTasks.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs italic">
                No milestone deliverables currently assigned to your profile.
              </div>
            )}
          </div>
        </div>

        {/* Activity & Expense Claim form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-bold text-slate-800 text-sm">Activity Reporting & Expenses claim form</h3>
          
          <form onSubmit={handleActivitySubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Related Project</label>
                <select 
                  required
                  value={reportProjId} 
                  onChange={(e) => setReportProjId(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
                >
                  <option value="">Select Project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expense Liability Amount (KES)</label>
                <input 
                  type="number" 
                  required 
                  placeholder="e.g. 1500" 
                  value={reportAmount} 
                  onChange={(e) => setReportAmount(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Activity Log Description</label>
              <textarea 
                required 
                placeholder="Details of expense, activities, or travel logs..." 
                value={reportDesc} 
                onChange={(e) => setReportDesc(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Supporting Receipt File Name</label>
              <input 
                type="text" 
                placeholder="e.g. receipt_transport_kajiado.jpg" 
                value={reportFile} 
                onChange={(e) => setReportFile(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
              />
            </div>

            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded text-xs transition-colors"
            >
              Submit Activity Claim Report
            </button>
          </form>

          {submitStatus && (
            <div className="bg-emerald-50 border border-emerald-250 p-3 rounded text-xs text-emerald-800 font-bold">
              Activity Expense Claim successfully filed. Routed to Finance & Department Head.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 9. COMMUNICATIONS OFFICER VIEW
// ==========================================
export function CommunicationsView() {
  const { announcements, mediaLibrary, addAnnouncement, addMediaAsset, projects } = useProject();
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [mediaFile, setMediaFile] = useState('');
  const [mediaProjTag, setMediaProjTag] = useState('');

  const handlePubAnn = (e) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    addAnnouncement(annTitle, annContent);
    setAnnTitle('');
    setAnnContent('');
  };

  const handleUploadMedia = (e) => {
    e.preventDefault();
    if (!mediaFile || !mediaProjTag) return;

    const mockUnsplashUrl = "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400";
    addMediaAsset(mediaFile, mockUnsplashUrl, mediaProjTag);
    setMediaFile('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="text-indigo-400" />
          <span>Announcement Publisher & Media Library</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">Broadcast general notices to the organization and manage digital media files linked to specific projects.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Publisher */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Publish Board Announcement</h3>
          
          <form onSubmit={handlePubAnn} className="space-y-3">
            <input 
              type="text" 
              required 
              placeholder="Announcement Title" 
              value={annTitle} 
              onChange={(e) => setAnnTitle(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
            />
            <textarea 
              required 
              placeholder="Content..." 
              value={annContent} 
              onChange={(e) => setAnnContent(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
              rows="3"
            />
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded text-xs">Publish Broadcast</button>
          </form>

          <div className="space-y-2 max-h-[160px] overflow-y-auto">
            {announcements.map(ann => (
              <div key={ann.id} className="p-3 bg-slate-50 border border-slate-150 rounded text-xs space-y-1">
                <div className="font-bold text-slate-800">{ann.title}</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{ann.content}</p>
                <span className="text-[10px] text-slate-400 block font-mono">By: {ann.authorName} • {ann.publishedAt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Media Library */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Media Asset Library</h3>
          
          <form onSubmit={handleUploadMedia} className="grid grid-cols-3 gap-3">
            <input 
              type="text" 
              required 
              placeholder="File Name (e.g. logo.png)" 
              value={mediaFile} 
              onChange={(e) => setMediaFile(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
            />
            <select 
              required
              value={mediaProjTag} 
              onChange={(e) => setMediaProjTag(e.target.value)}
              className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
            >
              <option value="">Tag Project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-1.5 rounded">Tag & Upload</button>
          </form>

          <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
            {mediaLibrary.map(med => (
              <div key={med.id} className="border border-slate-200 rounded p-2 bg-slate-50 space-y-1">
                <img src={med.url} alt={med.fileName} className="w-full h-16 object-cover rounded bg-slate-200" />
                <div className="text-[10px] font-bold text-slate-700 truncate">{med.fileName}</div>
                <div className="text-[9px] text-indigo-600 truncate">Project: {med.projectName}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 10. FIELD OFFICER VIEW
// ==========================================
export function FieldOfficerView() {
  const { offlineSubmissions, submitOfflineForm } = useProject();
  const [offlineMode, setOfflineMode] = useState(false);
  
  // Form details
  const [activityNotes, setActivityNotes] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [gpsSimulated, setGpsSimulated] = useState({ latitude: -1.2921, longitude: 36.8219 });
  const [cachedSubmissions, setCachedSubmissions] = useState([]);

  // Generate simulated random GPS coords
  const handleRandomizeGPS = () => {
    setGpsSimulated({
      latitude: -1.2921 + (Math.random() - 0.5) * 0.05,
      longitude: 36.8219 + (Math.random() - 0.5) * 0.05
    });
  };

  const handleFieldSubmit = (e) => {
    e.preventDefault();
    if (!activityNotes) return;

    const payload = {
      id: 'sub_' + Date.now(),
      userName: 'Fred Tracker',
      gpsLocation: gpsSimulated,
      photoUrl: photoName || 'captured_kajiado_well.jpg',
      activityNotes,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    if (offlineMode) {
      // Offline: Cache in local component/localStorage array
      const updatedCache = [payload, ...cachedSubmissions];
      setCachedSubmissions(updatedCache);
      localStorage.setItem('oms_field_cache', JSON.stringify(updatedCache));
      alert('Network Offline: Report successfully cached in LocalStorage. It will sync automatically when network connectivity is restored.');
    } else {
      // Online: Submit directly to the Project Context Database
      submitOfflineForm(gpsSimulated, activityNotes, photoName);
    }

    setActivityNotes('');
    setPhotoName('');
  };

  const handleSyncCache = () => {
    if (offlineMode) {
      alert('Cannot sync: Disable offline mode first to restore network connectivity.');
      return;
    }
    
    // Sync all cached items to project context
    cachedSubmissions.forEach(sub => {
      submitOfflineForm(sub.gpsLocation, sub.activityNotes, sub.photoUrl);
    });

    setCachedSubmissions([]);
    localStorage.removeItem('oms_field_cache');
    alert('Database Synchronized: Synced all offline cached reports with Firestore documents.');
  };

  // Load cache on start
  useEffect(() => {
    const savedCache = localStorage.getItem('oms_field_cache');
    if (savedCache) {
      setCachedSubmissions(JSON.parse(savedCache));
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/25 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Radio className="text-emerald-400 animate-pulse" />
            <span>Offline-Capable Field Surveyor Form</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">Caches geolocation logs and surveys inside local client databases. Syncs up to central cloud once connections recover.</p>
        </div>

        {/* Offline Simulation Toggle */}
        <button 
          onClick={() => setOfflineMode(!offlineMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
            offlineMode 
              ? 'bg-amber-600 border border-amber-500 text-white animate-bounce' 
              : 'bg-emerald-600 border border-emerald-500 text-white'
          }`}
        >
          {offlineMode ? <WifiOff size={16} /> : <Wifi size={16} />}
          <span>{offlineMode ? 'Simulating: OFFLINE' : 'Simulating: ONLINE'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Survey Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-bold text-slate-800 text-sm">Collect Survey Data</h3>
          
          <form onSubmit={handleFieldSubmit} className="space-y-3">
            <div className="bg-slate-50 rounded border border-slate-150 p-3 text-xs space-y-2">
              <span className="font-bold text-slate-700 block flex items-center gap-1">
                <MapPin size={14} className="text-rose-500" />
                <span>Simulated GPS Coordinates</span>
              </span>
              <div className="font-mono text-[10px] text-slate-600">
                Lat: {gpsSimulated.latitude.toFixed(6)} <br />
                Lon: {gpsSimulated.longitude.toFixed(6)}
              </div>
              <button 
                type="button" 
                onClick={handleRandomizeGPS}
                className="text-[10px] bg-slate-200 text-slate-700 py-0.5 px-2 rounded hover:bg-slate-350"
              >
                Change Geolocation
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Survey / Notes</label>
              <textarea 
                required 
                placeholder="Log activity details, village counts, or water tower integrity reports..." 
                value={activityNotes} 
                onChange={(e) => setActivityNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Attached Photo File Name</label>
              <input 
                type="text" 
                placeholder="e.g. well_mombasa_audit.jpg" 
                value={photoName} 
                onChange={(e) => setPhotoName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
              />
            </div>

            <button 
              type="submit" 
              className={`w-full font-semibold py-2 rounded text-xs transition-colors ${
                offlineMode ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {offlineMode ? 'Cache Report Offline' : 'Submit Report directly'}
            </button>
          </form>
        </div>

        {/* Sync queue & Submission History */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-2">
          {/* Sync control block */}
          {cachedSubmissions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-amber-800">You have {cachedSubmissions.length} offline cached reports</span>
                <p className="text-slate-500 text-[10px]">Ready to sync to the primary Firestore database.</p>
              </div>
              <button 
                onClick={handleSyncCache}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1 rounded shadow text-xs flex items-center gap-1"
                disabled={offlineMode}
              >
                <Wifi size={14} /> Synchronize Cloud
              </button>
            </div>
          )}

          <h3 className="font-bold text-slate-800 text-sm">Submission Sync Log History</h3>
          <div className="space-y-3">
            {offlineSubmissions.map(sub => (
              <div key={sub.id} className="p-3 bg-slate-50 border border-slate-150 rounded text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{sub.userName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{sub.submittedAt}</span>
                </div>
                <p className="text-slate-650 leading-relaxed">{sub.activityNotes}</p>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-3">
                  <span>GPS: {sub.gpsLocation.latitude.toFixed(4)}, {sub.gpsLocation.longitude.toFixed(4)}</span>
                  <span>•</span>
                  <span>Photo Attachment: {sub.photoUrl}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 11 & 12. VOLUNTEER & INTERN VIEW
// ==========================================
export function VolunteerLoggerView() {
  const { user, internCountdown } = useAuth();
  const { projects, logTaskHours } = useProject();
  const [selectedProj, setSelectedProj] = useState(projects[0]?.id || '');
  const [selectedTask, setSelectedTask] = useState('');
  const [logHrs, setLogHrs] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [success, setSuccess] = useState(false);

  const activeProject = projects.find(p => p.id === selectedProj);

  const handleTimeSubmit = (e) => {
    e.preventDefault();
    if (!selectedProj || !selectedTask || !logHrs || !logNotes) return;

    logTaskHours(selectedProj, selectedTask, logHrs, logNotes);
    setLogHrs('');
    setLogNotes('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="text-indigo-400" />
            <span>Simplified Task Logger</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">Log volunteer hours, record placement notes, and track supervisors assigned to your placement.</p>
        </div>

        {/* Intern placement countdown timer */}
        {user?.role === 'Intern' && (
          <div className="bg-indigo-900/50 border border-indigo-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <AlertTriangle className="text-yellow-500 animate-pulse" size={20} />
            <div>
              <span className="text-[10px] text-slate-300 block font-bold uppercase tracking-wider">Internship placement Countdown</span>
              <span className="text-sm font-mono font-extrabold text-white">
                {internCountdown !== null ? `${Math.floor(internCountdown / 60)}m ${internCountdown % 60}s` : 'Calculating...'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Log Hours Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-bold text-slate-800 text-sm">Log Workspace Hours</h3>
          
          <form onSubmit={handleTimeSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Project</label>
              <select 
                value={selectedProj} 
                onChange={(e) => setSelectedProj(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Task Deliverable</label>
              <select 
                value={selectedTask} 
                onChange={(e) => setSelectedTask(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
              >
                <option value="">Select Task...</option>
                {activeProject?.tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hours Logged</label>
                <input 
                  type="number" 
                  step="0.5"
                  required
                  placeholder="Hrs" 
                  value={logHrs} 
                  onChange={(e) => setLogHrs(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Log Notes</label>
              <textarea 
                required 
                placeholder="Details of what was accomplished..." 
                value={logNotes} 
                onChange={(e) => setLogNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
                rows="2"
              />
            </div>

            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded text-xs">Log Hours</button>
          </form>

          {success && (
            <div className="bg-emerald-50 border border-emerald-250 p-2.5 rounded text-xs text-emerald-800 font-bold">
              Time logged successfully. Added to task logs.
            </div>
          )}
        </div>

        {/* Task Log Details & Intern Metadata */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-2">
          {user?.role === 'Intern' && (
            <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 flex items-center justify-between text-xs text-slate-700">
              <div>
                <span className="block font-bold text-indigo-900">Internship Supervisor</span>
                <span>{user.internPlacement.supervisorName} ({user.internPlacement.supervisorId})</span>
              </div>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded uppercase">Linked</span>
            </div>
          )}

          <h3 className="font-bold text-slate-800 text-sm">Hour Logging History</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {activeProject?.tasks.flatMap(t => 
              (t.loggedTime || []).map((l, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-150 rounded text-xs space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-800">Task: {t.title}</span>
                    <span className="text-indigo-600">{l.hours} Hours</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">Notes: {l.notes}</p>
                  <span className="text-[10px] text-slate-400 block font-mono">Logged by: {l.loggedBy} on {l.date}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 13. REQUEST/REPORTING CENTER VIEW
// ==========================================
export function BaselineRequestFormView() {
  const { addRequest, requests } = useProject();
  const { user } = useAuth();
  
  const [requestType, setRequestType] = useState('Leave');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [success, setSuccess] = useState(false);

  const myRequests = requests.filter(r => r.userId === user.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason) return;

    const extra = requestType === 'Leave' ? { startDate, endDate } : {};
    addRequest(requestType, reason, extra);
    setReason('');
    setStartDate('');
    setEndDate('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Send className="text-indigo-400" />
          <span>Request & Reporting Center</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">Submit official organizational reports, leave requests, grievance forms, and request access to supporting documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-bold text-slate-800 text-sm">Submit New Request</h3>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Request Category</label>
              <select 
                value={requestType} 
                onChange={(e) => setRequestType(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
              >
                <option value="Leave">Annual/Sick Leave</option>
                <option value="Support Document Access">Supporting Documents Access</option>
                <option value="IT Support">IT Support Ticket</option>
                <option value="Grievance">Grievance Submission</option>
              </select>
            </div>

            {requestType === 'Leave' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-semibold text-slate-500">Start</label>
                  <input 
                    type="date" 
                    required 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-semibold text-slate-500">End</label>
                  <input 
                    type="date" 
                    required 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-800"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Justification Reason</label>
              <textarea 
                required 
                placeholder="Explain the reason for this submission..." 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
                rows="3"
              />
            </div>

            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded text-xs">Submit Request</button>
          </form>

          {success && (
            <div className="bg-emerald-50 border border-emerald-250 p-2.5 rounded text-xs text-emerald-800 font-bold">
              Request submitted successfully and routed to HR/Admin.
            </div>
          )}
        </div>

        {/* History */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-bold text-slate-800 text-sm">Submission Tracking History</h3>
          
          <div className="space-y-3">
            {myRequests.map(req => (
              <div key={req.id} className="p-3 bg-slate-50 border border-slate-150 rounded text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{req.requestType} Report</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                    req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">Reason: {req.details.reason}</p>
                {req.details.startDate && (
                  <div className="text-[10px] text-slate-400">Dates: {req.details.startDate} to {req.details.endDate}</div>
                )}
                <span className="text-[10px] text-slate-400 block font-mono">Filed on {req.createdAt}</span>
              </div>
            ))}

            {myRequests.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">You have not submitted any reporting requests yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// BASELINE PROFILE & DOCUMENT VAULT COMPONENT
// ==========================================
export function UserBaselineProfileView() {
  const { user, policyVault, updateProfileDetails } = useAuth();
  const [phone, setPhone] = useState(user?.personalDetails?.phone || '');
  const [success, setSuccess] = useState(false);
  const [simulateEmptyVault, setSimulateEmptyVault] = useState(false);

  const handleUpdatePersonal = (e) => {
    e.preventDefault();
    updateProfileDetails({ phone });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const simulatedUrl = URL.createObjectURL(file);
      updateProfileDetails({ avatar: simulatedUrl });
      Swal.fire({
        title: 'Avatar Updated!',
        text: 'Your profile photo has been successfully updated on the server directory.',
        icon: 'success',
        confirmButtonColor: '#4f46e5'
      });
    }
  };

  if (!user) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Card & Details (Editable personal, locked office/docs) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 lg:col-span-2">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <AvatarProfilePhoto 
            verified={true} 
            size="lg" 
            alt={user.name} 
            src={user.avatar} 
            onUpload={handleAvatarUpload}
          />
          <div>
            <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
            <span className="inline-block px-2.5 py-0.5 mt-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full uppercase">
              {user.role}
            </span>
          </div>
        </div>

        {/* Editable Personal Details */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>Personal Details</span>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-normal uppercase">User Configurable</span>
          </h4>

          <form onSubmit={handleUpdatePersonal} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
              <input 
                type="text" 
                disabled 
                value={user.email} 
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
              <input 
                type="text" 
                required 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
              />
            </div>
            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 rounded text-xs transition-colors self-end w-full sm:w-auto px-4"
            >
              Update Phone Contact
            </button>
            {success && (
              <span className="text-xs text-emerald-600 font-bold self-center">Profile updated successfully.</span>
            )}
          </form>
        </div>

        {/* Locked Office Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>Office Placement Details</span>
            <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-normal uppercase flex items-center gap-1">
              <Shield size={10} /> Locked Property
            </span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-450 block text-[10px] font-bold uppercase">Assigned Position</span>
              <span className="font-semibold text-slate-700">{user.officeDetails?.position}</span>
            </div>
            <div>
              <span className="text-slate-450 block text-[10px] font-bold uppercase">Department Unit</span>
              <span className="font-semibold text-slate-700">{user.officeDetails?.department}</span>
            </div>
            <div>
              <span className="text-slate-450 block text-[10px] font-bold uppercase">Date of Hire</span>
              <span className="font-semibold text-slate-700">{user.officeDetails?.hireDate}</span>
            </div>
          </div>
        </div>

        {/* Locked Supporting Documents */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>Supporting Audited Documents</span>
            <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-normal uppercase flex items-center gap-1">
              <Shield size={10} /> Locked Property
            </span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 border border-slate-150 rounded flex flex-col justify-between h-14">
              <span className="text-slate-400 text-[9px] font-bold uppercase block font-sans">Employment Contract</span>
              <span className="font-semibold text-[10px] text-slate-750 truncate">{user.supportingDocuments?.contract}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-150 rounded flex flex-col justify-between h-14">
              <span className="text-slate-400 text-[9px] font-bold uppercase block font-sans">NSSF Identifier</span>
              <span className="font-semibold text-[10px] text-slate-750">{user.supportingDocuments?.nssf}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-150 rounded flex flex-col justify-between h-14">
              <span className="text-slate-400 text-[9px] font-bold uppercase block font-sans">NHIF Identifier</span>
              <span className="font-semibold text-[10px] text-slate-750">{user.supportingDocuments?.nhif}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Read-Only Document Vault */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1 flex flex-col justify-between h-[500px]">
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BookOpen className="text-indigo-500" size={16} />
                <span>Read-Only Document Vault</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Official templates and organization policy manuals.</p>
            </div>
            
            <button 
              onClick={() => setSimulateEmptyVault(!simulateEmptyVault)}
              className="text-[10px] text-indigo-650 hover:underline font-bold"
              title="Toggle view to test vault empty states illustration"
            >
              {simulateEmptyVault ? 'Restore' : 'Test Empty State'}
            </button>
          </div>

          {simulateEmptyVault ? (
            <div className="py-12 space-y-3">
              <Illustration type="documents" size="sm" />
              <p className="text-xs text-slate-400 text-center italic">No documents are currently stored in this vault folder.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
              {policyVault.map(vault => (
                <div key={vault.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded text-xs flex justify-between items-center hover:bg-slate-100 transition-colors">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-700 block truncate max-w-[150px]">{vault.title}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-mono">{vault.category} • {vault.size}</span>
                  </div>
                  <button 
                    onClick={() => {
                      Swal.fire({
                        title: 'Vault Download',
                        text: `Do you want to download "${vault.title}" (${vault.size})?`,
                        icon: 'info',
                        showCancelButton: true,
                        confirmButtonColor: '#4f46e5',
                        confirmButtonText: 'Download PDF'
                      }).then((result) => {
                        if (result.isConfirmed) {
                          Swal.fire('Downloaded!', 'File download initiated.', 'success');
                        }
                      });
                    }}
                    className="p-1 hover:bg-slate-250 rounded border border-slate-200 text-slate-500"
                    title="Download File"
                  >
                    <Download size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">Documents are managed by the Administration & HR departments. Editing is restricted.</p>
      </div>
    </div>
  );
}
