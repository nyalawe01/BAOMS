import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, Plus, Send, FileText, Briefcase, FileSpreadsheet, 
  Calendar, Clipboard, BookOpen, Shield, Trash2, ChevronRight, 
  Search, Check, X, ChevronDown, Bell, Upload, Download, Eye, 
  AlertCircle, MapPin, Mail, Phone, ShieldAlert, FileClock, DollarSign, 
  ExternalLink, Layers, Clock, Settings, Package, Activity, Info, TrendingUp
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Avatar } from '@/components/base/avatar/avatar';

// ============================================================================
// 1. ADMIN DASHBOARD VIEW
// ============================================================================
export function AdminDashboardView() {
  const { projects, users, expenses, transactions } = useProject();

  const totalUsers = users.length;
  const onlineStaff = Math.max(1, Math.round(totalUsers * 0.3)); // Derived online count simulation
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  
  // Calculate total beneficiaries dynamically across projects
  const totalBeneficiaries = projects.reduce((acc, curr) => acc + (curr.beneficiaryCount || 150), 0);

  const approvedTx = transactions.filter(t => t.status === 'Approved');
  const totalIncome = approvedTx.filter(t => t.type === 'Income').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalExpenses = approvedTx.filter(t => t.type === 'Expense').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const currentBudget = totalIncome - totalExpenses;

  const pendingApprovals = expenses.filter(e => e.status === 'Pending').length;
  const openTasksCount = projects.flatMap(p => p.tasks || []).filter(t => t.status !== 'Completed').length;

  const kpis = [
    { label: 'Total Users', value: totalUsers },
    { label: 'Staff Online', value: onlineStaff },
    { label: 'Active Projects', value: activeProjects },
    { label: 'Beneficiaries Served', value: totalBeneficiaries.toLocaleString() },
    { label: 'Current Reserves', value: `TZS ${currentBudget.toLocaleString()}` },
    { label: 'Monthly Expenses', value: `TZS ${totalExpenses.toLocaleString()}` },
    { label: 'Pending Approvals', value: pendingApprovals },
    { label: 'Open Tasks Action', value: openTasksCount }
  ];

  return (
    <div className="space-y-8 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 border border-slate-200">
        <h2 className="text-lg font-normal flex items-center gap-2">
          <Shield className="text-slate-400" />
          <span>System Administrative Control Center</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1 font-normal">Monitor overall organizational indexes, database health parameters, and security clearance logs.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">{kpi.label}</span>
            <span className="text-xl font-normal text-slate-800 mt-4 block">{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-normal">Executive Quick Actions</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Create Project', action: 'Initialize new project workspace' },
            { label: 'Add Staff Member', action: 'Add personnel records to database' },
            { label: 'Add Beneficiary', action: 'Enroll community beneficiaries' },
            { label: 'Send Announcement', action: 'Broadcast announcement notifications' }
          ].map((act, idx) => (
            <button
              key={idx}
              onClick={() => Swal.fire('Executive action triggered', act.action, 'info')}
              className="py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-all text-center text-xs font-normal"
            >
              + {act.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. ADMIN ORGANIZATION VIEW
// ============================================================================
export function AdminOrganizationView() {
  const { users } = useProject();

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Organization General Parameters</h2>
        <p className="text-xs text-slate-400 font-normal">Vision, mission directives, registration parameters, and branch outpost configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-normal">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5 font-normal">Corporate Identity</span>
          <div className="space-y-3 font-normal text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block mb-1">Organization Name</span>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-normal">Babawatoto Organization Management System</div>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Vision Statement</span>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-normal">To empower vulnerable children and youth in communities through active social support and resources.</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5 font-normal">Corporate Registration Details</span>
          <div className="space-y-3 font-normal text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block mb-1">Registration Number</span>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">NGO/000282-TZ-OMS</div>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Total Active Staff Count</span>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-normal">{users.length} Active Records</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. ADMIN PROJECTS VIEW
// ============================================================================
export function AdminProjectsView() {
  const { projects } = useProject();

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Projects Workspace Portfolio</h2>
        <p className="text-xs text-slate-400 font-normal">Overall summary tracker for project completion rates and allocated budgets.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
              <th className="p-3">Project Workspace</th>
              <th className="p-3">Allocated Limit</th>
              <th className="p-3">Completion Progress</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {projects.map((proj, idx) => (
              <tr key={proj.id || idx} className="hover:bg-slate-50/50">
                <td className="p-3 font-normal text-slate-808">{proj.name}</td>
                <td className="p-3 font-normal text-slate-700">TZS {proj.budget?.toLocaleString()}</td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <span className="font-normal text-slate-800">{proj.progress || 0}%</span>
                    <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-slate-500 h-full" style={{ width: `${proj.progress || 0}%` }}></div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[8px] font-normal border uppercase bg-slate-50 text-slate-600 border-slate-200">
                    {proj.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 4. ADMIN FINANCE VIEW
// ============================================================================
export function AdminFinanceView() {
  const { transactions } = useProject();

  const approvedTx = transactions.filter(t => t.status === 'Approved');
  const getBalance = (bankName) => {
    const income = approvedTx.filter(t => t.bankAccount === bankName && t.type === 'Income').reduce((a, c) => a + c.amount, 0);
    const expenses = approvedTx.filter(t => t.bankAccount === bankName && t.type === 'Expense').reduce((a, c) => a + c.amount, 0);
    return income - expenses;
  };

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Executive Financial Oversight</h2>
        <p className="text-xs text-slate-400 font-normal">Reconciled checking balances distributed across NGO bank accounts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-normal">
        {['CRDB', 'NMB', 'M-Pesa'].map((wallet, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-350 transition-all">
            <div>
              <h4 className="font-normal text-slate-800 text-sm">{wallet} Corporate Account</h4>
              <span className="text-[10px] text-slate-400 block font-normal font-mono">Status: Synced</span>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-normal font-normal">Available Balance</span>
              <span className="text-lg font-normal text-slate-800 mt-1 block">TZS {getBalance(wallet).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 5. ADMIN HUMAN RESOURCES VIEW
// ============================================================================
export function AdminHRView() {
  const { users, addUser } = useProject();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Volunteer');

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!email || !name) return;

    addUser({
      firstName: name.split(' ')[0] || 'New',
      surname: name.split(' ')[1] || 'Staff',
      email,
      role,
      department: 'Program Management'
    });

    setEmail('');
    setName('');
    Swal.fire('Personnel Logged', 'Successfully created user record in Firestore database.', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Staff Directory & User Management</h2>
        <p className="text-xs text-slate-400 font-normal">Add staff accounts, assign authorization roles, and toggle status indexes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5 font-normal">Create User Account</span>
          <form onSubmit={handleCreateUser} className="space-y-3 font-normal">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. jdoe@gmail.com" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Authorization Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                <option value="System Administrator">System Administrator</option>
                <option value="Executive Director">Executive Director</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Finance Officer">Finance Officer</option>
                <option value="M&E Officer">M&E Officer</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded font-normal hover:bg-slate-800">Add User Record</button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5 font-normal">Active System Users</span>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-normal">
                {users.map((u, idx) => (
                  <tr key={u.id || idx}>
                    <td className="p-3 font-normal text-slate-808">{u.name}</td>
                    <td className="p-3 text-slate-500">{u.role}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500">{u.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[8px] font-normal border uppercase bg-slate-50 text-slate-655 border-slate-200">
                        {u.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. ADMIN BENEFICIARIES VIEW
// ============================================================================
export function AdminBeneficiariesView() {
  const { beneficiaries, projects, deleteBeneficiary } = useProject();

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || 'Unassigned';

  const handleDelete = (ben) => {
    Swal.fire({
      title: 'Remove Beneficiary?',
      text: `This will permanently remove "${ben.name}" from the registry.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove'
    }).then(res => {
      if (res.isConfirmed) {
        deleteBeneficiary(ben.id);
      }
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">NGO Beneficiary Enrolments</h2>
        <p className="text-xs text-slate-400 font-normal font-normal">Demographics list of community members reached through active projects.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                <th className="p-3">Name</th>
                <th className="p-3">Age</th>
                <th className="p-3">Gender</th>
                <th className="p-3">Location</th>
                <th className="p-3">Category</th>
                <th className="p-3">Enrolled Project</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {beneficiaries.map((ben, idx) => (
                <tr key={ben.id || idx} className="hover:bg-slate-50/50">
                  <td className="p-3 font-normal text-slate-808">{ben.name}</td>
                  <td className="p-3 font-normal text-slate-707">{ben.age}</td>
                  <td className="p-3 text-slate-600">{ben.gender}</td>
                  <td className="p-3 text-slate-600">{ben.location}</td>
                  <td className="p-3 text-slate-600 font-normal">{ben.category}</td>
                  <td className="p-3 text-slate-600 font-normal">{getProjectName(ben.projectId)}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleDelete(ben)} className="text-slate-400 hover:text-red-600 transition-colors" title="Remove beneficiary">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {beneficiaries.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 italic">No beneficiaries enrolled yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. ADMIN MONITORING & EVALUATION VIEW
// ============================================================================
export function AdminMEView() {
  const indicatorsList = [
    { indicator: 'Children reached through feeding program', target: 500, achieved: 420 },
    { indicator: 'Youth trained in vocational tech skills', target: 150, achieved: 162 }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">M&E Performance Indicators</h2>
        <p className="text-xs text-slate-400 font-normal font-normal">Check completion percentages of organizational target metrics.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        {indicatorsList.map((ind, idx) => {
          const pct = Math.round((ind.achieved / ind.target) * 100);
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-700">
                <span>{ind.indicator}</span>
                <span>{pct}% ({ind.achieved} / {ind.target})</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-slate-500 h-full" style={{ width: `${Math.min(pct, 100)}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 8. ADMIN EVENTS VIEW
// ============================================================================
export function AdminEventsView() {
  const { events, addEvent, deleteEvent } = useProject();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!title || !date) return;

    addEvent({ title, date, location, description });

    setTitle('');
    setDate('');
    setLocation('');
    setDescription('');
    Swal.fire('Event Scheduled', 'Successfully created event record in Firestore database.', 'success');
  };

  const handleDeleteEvent = (evt) => {
    Swal.fire({
      title: 'Remove Event?',
      text: `This will permanently delete "${evt.title}" from the calendar.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete'
    }).then(res => {
      if (res.isConfirmed) {
        deleteEvent(evt.id);
      }
    });
  };

  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Organization Events Calendar</h2>
        <p className="text-xs text-slate-400 font-normal">Track campaigns, workshops, meetings, and public forums.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5 font-normal">Schedule New Event</span>
          <form onSubmit={handleCreateEvent} className="space-y-3 font-normal">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Event Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Donor Annual Meeting" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Event Date</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Dar es Salaam HQ" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief event description..." className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" rows="3" />
            </div>
            <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded font-normal hover:bg-slate-800">Schedule Event</button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 font-normal content-start">
          {sortedEvents.length === 0 && (
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center text-slate-400 italic">
              No events scheduled yet.
            </div>
          )}
          {sortedEvents.map((evt) => (
            <div key={evt.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-normal text-slate-808 text-sm">{evt.title}</h4>
                <button onClick={() => handleDeleteEvent(evt)} className="text-slate-400 hover:text-red-600 transition-colors shrink-0" title="Remove event">
                  <Trash2 size={13} />
                </button>
              </div>
              {evt.description && <p className="text-slate-550 font-normal">{evt.description}</p>}
              <div className="text-[10px] text-slate-400 mt-1">Date: {evt.date} • Location: {evt.location || 'TBD'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 9. ADMIN INVENTORY VIEW
// ============================================================================
export function AdminInventoryView() {
  const { assetsAndVendors } = useProject();
  const inventory = assetsAndVendors.filter(av => av.type === 'asset');

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Logistic Assets & Gear Inventory</h2>
        <p className="text-xs text-slate-400 font-normal font-normal">Catalog register for shared equipment and hardware materials.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
              <th className="p-3">Asset Item</th>
              <th className="p-3">Asset Code</th>
              <th className="p-3">Last Updated By</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {inventory.map((inv) => (
              <tr key={inv.id}>
                <td className="p-3 font-normal text-slate-808">{inv.details?.name}</td>
                <td className="p-3 text-slate-700 font-mono">{inv.details?.assetCode || 'N/A'}</td>
                <td className="p-3 text-slate-600">{inv.lastUpdatedBy || 'N/A'}</td>
                <td className="p-3 text-slate-500 font-normal">{inv.details?.status || 'N/A'}</td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-12 text-slate-400 italic">No assets registered in the database.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 10. ADMIN COMMS VIEW
// ============================================================================
export function AdminCommsView() {
  const { addAnnouncement } = useProject();
  const [msg, setMsg] = useState('');

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!msg) return;
    addAnnouncement('Administrative Broadcast', msg);
    setMsg('');
    Swal.fire('Broadcast Dispatched', 'Successfully sent announcement to all directory staff members.', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Communications Broadcast Center</h2>
        <p className="text-xs text-slate-400 font-normal">Disseminate organizational memos, directives, or critical system alerts.</p>
      </div>

      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5 font-normal">Broadcast Memo Notification</span>
        <form onSubmit={handleBroadcast} className="space-y-3 font-normal text-xs">
          <textarea required value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type announcement description here..." className="w-full px-3 py-2 border border-slate-200 rounded" rows="3" />
          <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded font-normal hover:bg-slate-800">Send Announcement</button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 11. ADMIN DOCUMENTS VIEW
// ============================================================================
export function AdminDocumentsView() {
  const documents = [
    { name: 'BAOMS_Compliance_Policy_2026.pdf', size: '2.5 MB', type: 'Policy' },
    { name: 'Financial_Audit_Report_FY25.pdf', size: '4.1 MB', type: 'Report' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Legal Policies & Compliance Documents</h2>
        <p className="text-xs text-slate-400 font-normal">Access contracts, grant agreements, policies, and audit statements.</p>
      </div>

      <div className="space-y-2">
        {documents.map((doc, idx) => (
          <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-slate-700 font-normal hover:border-slate-350 transition-all">
            <div>
              <span className="block font-normal">{doc.name}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Size: {doc.size} • Type: {doc.type}</span>
            </div>
            <button onClick={() => Swal.fire('Downloaded!', 'Compliance document download initiated.', 'success')} className="p-1 hover:bg-slate-100 rounded text-slate-600 border border-slate-200">
              <Download size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 12. ADMIN REPORTS VIEW
// ============================================================================
export function AdminReportsView() {
  const handleExport = (reportName) => {
    Swal.fire('Report Generated', `Compiled "${reportName}" dynamically from active directory values. Downloading CSV format.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Executive Reports Center</h2>
        <p className="text-xs text-slate-400 font-normal font-normal">Generate compiled reports on budgets, active personnel, or M&E metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-normal">
        {['Finance Summary', 'HR Attendance', 'Project Progress', 'Beneficiary Enrolments'].map((rep, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all space-y-4">
            <div>
              <h4 className="font-normal text-slate-808 text-sm">{rep} Report</h4>
              <p className="text-[10px] text-slate-400 mt-1">Consolidated document including current metrics.</p>
            </div>
            <button onClick={() => handleExport(rep)} className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-normal">Compile & Export</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 13. ADMIN SETTINGS VIEW
// ============================================================================
export function AdminSettingsView() {
  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Administrative configurations</h2>
        <p className="text-xs text-slate-400 font-normal">Tweak registration numbers, corporate address details, and portal configurations.</p>
      </div>

      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 font-normal">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5 font-normal font-normal">Portal System Parameters</span>
        <div className="space-y-3 text-xs font-normal">
          <div>
            <span className="text-slate-400 block mb-1">Corporate Email Address</span>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">admin@oms.com</div>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">System Version Tag</span>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">v1.4.2-Production</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 14. ADMIN AUDIT LOGS VIEW
// ============================================================================
export function AdminLogsView() {
  const { auditLogs } = useProject();

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Database Audit Logs</h2>
        <p className="text-xs text-slate-400 font-normal">General activity timeline tracking logins, updates, and approval transactions.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Personnel</th>
                <th className="p-3">Role</th>
                <th className="p-3">Action Module</th>
                <th className="p-3">Operation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-normal">
              {auditLogs.map((log, idx) => (
                <tr key={log.id || idx} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono text-[10px] text-slate-400">{log.timestamp}</td>
                  <td className="p-3 font-normal text-slate-800">{log.userName}</td>
                  <td className="p-3 text-slate-500">{log.userRole}</td>
                  <td className="p-3 font-mono text-[10px] text-slate-500">{log.actionType}</td>
                  <td className="p-3 text-slate-600 font-normal">{log.description || log.details}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400 italic">No audit trail records registered.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
