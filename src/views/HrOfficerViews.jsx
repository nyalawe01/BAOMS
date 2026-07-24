import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { 
  LayoutDashboard, Users, Plus, Send, FileText, Briefcase, FileSpreadsheet, 
  Calendar, Clipboard, BookOpen, Shield, Trash2, UserMinus, ChevronRight, 
  Search, Building, Check, X, ChevronDown, UserCheck, Bell, ArrowRight, 
  Upload, Download, ChevronUp, FileCheck, Eye, Settings, AlertCircle, 
  MapPin, Mail, Phone, ShieldAlert, FileClock, DollarSign, ExternalLink
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Avatar } from '@/components/base/avatar/avatar';
import { FileUpload } from '@/components/application/file-upload/file-upload-base';
import { Paperclip } from 'lucide-react';

// Helper component to trigger skeleton delays
function usePageLoader(triggerArray = []) {
  const [loading, setLoading] = useState(true);
  const triggerLen = triggerArray?.length || 0;

  useEffect(() => {
    const hasData = triggerArray && triggerArray.some(item => {
      if (Array.isArray(item)) return item.length > 0;
      return !!item;
    });
    if (hasData) {
      setLoading(false);
    } else {
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [triggerLen]);

  return loading;
}

// Generic component wireframes
function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
          <div className="h-2.5 bg-slate-200 rounded w-16"></div>
          <div className="h-6 bg-slate-200 rounded w-8"></div>
        </div>
      ))}
    </div>
  );
}

function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col items-center space-y-4">
          <div className="w-14 h-14 bg-slate-200 rounded-full"></div>
          <div className="h-3.5 bg-slate-200 rounded w-24"></div>
          <div className="h-2.5 bg-slate-200 rounded w-36"></div>
          <div className="h-2 bg-slate-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 animate-pulse">
      <div className="h-8 bg-slate-100 rounded w-full"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex justify-between items-center py-3 border-b border-slate-55">
          <div className="h-3 bg-slate-200 rounded w-1/4"></div>
          <div className="h-3 bg-slate-200 rounded w-1/6"></div>
          <div className="h-3 bg-slate-200 rounded w-1/6"></div>
          <div className="h-4 bg-slate-200 rounded w-12"></div>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 1. HR HOME VIEW
// ==========================================
export function HrHomeView() {
  const { users, requests, auditLogs } = useProject();
  const loading = usePageLoader([users, auditLogs]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-slate-200 rounded-2xl animate-pulse"></div>
        <CardSkeleton count={6} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 p-5 rounded-xl h-64 animate-pulse"></div>
          <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl h-64 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const totalStaff = users.length;
  const activeStaff = users.filter(u => u.status === 'Active' || u.officeDetails?.status === 'Active').length;
  const onLeave = users.filter(u => u.status === 'On Leave' || u.officeDetails?.status === 'On Leave').length;
  const newStaff = users.filter(u => {
    const hireDate = u.officeDetails?.hireDate || u.hireDate;
    if (!hireDate) return false;
    const diffTime = Math.abs(new Date() - new Date(hireDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 60;
  }).length;

  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const expiringContracts = 2; // Simulated count

  // Department distribution count
  const deptCounts = users.reduce((acc, u) => {
    const dept = u.officeDetails?.department || u.department || 'Operations';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/20">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="text-indigo-400" />
              <span>HR Executive Intelligence Command</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">Review workforce stats, monitor leave pipelines, and inspect organizational activity feeds.</p>
          </div>
          <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
            Live Database Sync
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Employees', val: totalStaff, color: 'text-slate-800 bg-slate-50 border-slate-100' },
          { label: 'Active Staff', val: activeStaff, color: 'text-slate-800 bg-slate-50 border-slate-100' },
          { label: 'New Employees', val: newStaff, color: 'text-slate-800 bg-slate-50 border-slate-100' },
          { label: 'Staff on Leave', val: onLeave, color: 'text-slate-800 bg-slate-50 border-slate-100' },
          { label: 'Pending Requests', val: pendingRequests, color: 'text-rose-600 bg-rose-50 border-rose-150' },
          { label: 'Expiring Contracts', val: expiringContracts, color: 'text-slate-800 bg-slate-50 border-slate-100' }
        ].map((m, idx) => (
          <div key={idx} className={`p-4 rounded-xl border bg-white shadow-sm flex flex-col justify-between ${m.color.split(' ')[2]}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{m.label}</span>
            <span className={`text-2xl font-black mt-2 ${m.color.split(' ')[0]}`}>{m.val}</span>
          </div>
        ))}
      </div>

      {/* Dash Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Department summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Building size={16} className="text-indigo-500" />
              <span>Department Resources</span>
            </h3>
            <p className="text-[10px] text-slate-400">Resource counts across functional units</p>
          </div>
          <div className="space-y-3">
            {Object.entries(deptCounts).map(([dept, count], idx) => {
              const pct = totalStaff > 0 ? Math.round((count / totalStaff) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{dept}</span>
                    <span className="text-slate-500">{count} staff ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center/Right: Chronological activity logs */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Bell size={16} className="text-amber-500" />
                <span>Real-Time Audit Activity Feed</span>
              </h3>
              <p className="text-[10px] text-slate-400">Force activity log tracking submissions</p>
            </div>
            <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">Immutable</span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {auditLogs.slice(0, 8).map((log, idx) => (
              <div key={idx} className="flex gap-3 text-xs border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                <div className="mt-0.5">
                  <div className={`p-1.5 rounded-lg ${
                    log.actionType === 'USER_MANAGEMENT' ? 'bg-slate-100 text-slate-700' :
                    log.actionType === 'REQUEST_CENTER' ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-655'
                  }`}>
                    <UserCheck size={14} />
                  </div>
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{log.userName}</span>
                    <span className="text-[9px] text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-655 text-[11px] leading-relaxed">{log.description}</p>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">No recent actions logged.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. HR STAFF VIEW (DIRECTORY & SLIDE MODAL)
// ==========================================
export function HrStaffView({ setActiveTab }) {
  const { users, updateUser, setActivePreviewDoc } = useProject();
  const loading = usePageLoader([users]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-slate-200 rounded-xl animate-pulse"></div>
        <div className="h-10 bg-slate-200 rounded-lg animate-pulse"></div>
        <GridSkeleton count={8} />
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = (userId, status) => {
    updateUser(userId, { status, 'officeDetails.status': status });
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(prev => ({
        ...prev,
        status,
        officeDetails: { ...prev.officeDetails, status }
      }));
    }
    Swal.fire({
      title: 'Status Updated',
      text: `Staff status changed to ${status}.`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleActionClick = (action, u) => {
    setActiveMenuId(null);
    Swal.fire({
      title: `${action} Staff Member?`,
      text: `Are you sure you want to ${action.toLowerCase()} ${u.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0031C9',
      confirmButtonText: `Yes, ${action}`
    }).then((result) => {
      if (result.isConfirmed) {
        if (action === 'Suspend') {
          handleStatusChange(u.id, 'Suspended');
        } else if (action === 'Terminate') {
          handleStatusChange(u.id, 'Terminated');
        } else if (action === 'Activate') {
          handleStatusChange(u.id, 'Active');
        } else if (action === 'Put on Leave') {
          handleStatusChange(u.id, 'On Leave');
        }
      }
    });
  };

  return (
    <div className="space-y-6 relative animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-800">Staff Management Directory</h2>
          <p className="text-xs text-slate-400">View detailed credentials, shift departments, and update active state flags.</p>
        </div>
        <button 
          onClick={() => setActiveTab('hr_add_staff')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          <Plus size={14} />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
        />
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {filteredUsers.map(u => {
          const dept = u.officeDetails?.department || u.department || 'Operations';
          const uStatus = u.officeDetails?.status || u.status || 'Active';
          return (
            <div 
              key={u.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center text-center space-y-4 hover:border-indigo-300 transition-all cursor-pointer relative"
              onClick={() => setSelectedUser(u)}
            >
              {/* Dropdown Action button */}
              <div className="absolute right-3 top-3" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => setActiveMenuId(activeMenuId === u.id ? null : u.id)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-455 hover:text-slate-700"
                >
                  <ChevronDown size={14} />
                </button>
                {activeMenuId === u.id && (
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1 text-left text-xs font-semibold">
                    {uStatus !== 'Active' && (
                      <button onClick={() => handleActionClick('Activate', u)} className="w-full px-3 py-1.5 hover:bg-slate-50 text-emerald-600 block">Activate</button>
                    )}
                    {uStatus !== 'Suspended' && (
                      <button onClick={() => handleActionClick('Suspend', u)} className="w-full px-3 py-1.5 hover:bg-slate-50 text-rose-600 block">Suspend</button>
                    )}
                    {uStatus !== 'On Leave' && (
                      <button onClick={() => handleActionClick('Put on Leave', u)} className="w-full px-3 py-1.5 hover:bg-slate-50 text-amber-600 block">Put on Leave</button>
                    )}
                    <button onClick={() => handleActionClick('Terminate', u)} className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-600 block">Terminate</button>
                  </div>
                )}
              </div>

              <Avatar
                size="lg"
                src={u.avatar || ''}
                alt={u.name}
                className="ring-2 ring-slate-100"
              />
              <div className="space-y-1 w-full">
                <h4 className="font-bold text-slate-800 text-sm truncate">{u.name}</h4>
                <p className="text-slate-400 text-[10px] truncate">{u.email}</p>
                <div className="text-[11px] font-semibold text-slate-500 truncate">{dept} — {u.role}</div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                uStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                uStatus === 'On Leave' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-250'
              }`}>
                {uStatus}
              </span>
            </div>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-455 text-xs font-semibold bg-white rounded-xl border border-slate-200 shadow-sm">
            No matching staff records found.
          </div>
        )}
      </div>

      {/* Slide-out Panel / Right Drawer for Staff Details */}
      {selectedUser && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end"
          onClick={() => setSelectedUser(null)}
        >
          <div 
            className="w-full max-w-lg bg-white h-screen shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between animate-slideLeft no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">Staff Detailed Review Card</h3>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-455 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Profile Avatar summary */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Avatar 
                  size="xl" 
                  src={selectedUser.avatar || ''} 
                  alt={selectedUser.name} 
                />
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">{selectedUser.name}</h4>
                  <p className="text-slate-400 text-xs">{selectedUser.email}</p>
                  <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[9px] font-bold border uppercase ${
                    (selectedUser.officeDetails?.status || selectedUser.status || 'Active') === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-rose-50 text-rose-700 border-rose-250'
                  }`}>
                    {selectedUser.officeDetails?.status || selectedUser.status || 'Active'}
                  </span>
                </div>
              </div>

              {/* Details Sections */}
              <div className="space-y-4">
                {/* Personal details */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Personal details</h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Personal Email</span>
                      <span className="font-semibold text-slate-700">{selectedUser.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Organization Email</span>
                      <span className="font-semibold text-slate-700">{selectedUser.organizationEmail || 'N/A'}</span>
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
                    <div>
                      <span className="text-slate-400 block">NHIF Number</span>
                      <span className="font-semibold text-slate-700">{selectedUser.nhif || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">NSSF Number</span>
                      <span className="font-semibold text-slate-700">{selectedUser.nssf || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Office Details */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Office Description</h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
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
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Attached Supporting Documents</h5>
                  <div className="space-y-2 text-xs">
                    {[
                      { key: 'cv', name: 'Curriculum Vitae (CV)' },
                      { key: 'certificates', name: 'Academic Certificates' },
                      { key: 'contract', name: 'Employment Agreement Contract' },
                      { key: 'insurance', name: 'National Insurance Card Scan' },
                      { key: 'others', name: 'Other Supporting Documents' }
                    ].map((doc) => {
                      const attachedFile = selectedUser.supportingDocuments?.[doc.key];
                      return (
                        <div key={doc.key} className="flex justify-between items-center bg-white border border-slate-200 rounded p-2 hover:border-slate-350 transition-all">
                          <span className="font-medium text-slate-750 truncate max-w-[200px]">{doc.name}</span>
                          <div className="flex items-center gap-1.5">
                            {attachedFile ? (
                              <>
                                <span className="text-[9px] text-slate-400 font-mono truncate max-w-[100px]">{attachedFile.fileName}</span>
                                <button 
                                  onClick={() => setActivePreviewDoc({ fileName: attachedFile.fileName, dataUrl: attachedFile.dataUrl, fileSize: attachedFile.fileSize })}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900"
                                  title="Preview document"
                                >
                                  <Eye size={13} />
                                </button>
                                <button 
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = attachedFile.dataUrl;
                                    link.download = attachedFile.fileName;
                                    link.click();
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900"
                                  title="Download document file"
                                >
                                  <Download size={13} />
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
            </div>

            {/* Actions panel */}
            <div className="pt-4 border-t border-slate-100 flex gap-2 shrink-0">
              <button 
                onClick={() => handleActionClick('Suspend', selectedUser)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
              >
                Suspend User
              </button>
              <button 
                onClick={() => handleActionClick('Terminate', selectedUser)}
                className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all border border-rose-250"
              >
                Terminate Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. HR ADD STAFF VIEW (SLIDING MULTI-STEP WIZARD)
// ==========================================
export function HrAddStaffView() {
  const { addUser } = useProject();
  const loading = usePageLoader([]);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingPhase, setSubmittingPhase] = useState('');
  const [formData, setFormData] = useState({
    firstName: '', middleName: '', surname: '', email: '', organizationEmail: '', phone: '',
    personalId: '', nhif: '', nssf: '', dob: '', placeOfBirth: '', placeOfLiving: '',
    gender: 'Male', disability: 'No', disabilityDescription: '', nationality: '',
    officeLocation: '', department: 'Engineering', position: '',
    role: 'Intern', hireDate: new Date().toISOString().substring(0, 10),
    avatarFile: null,
    supportingDocuments: {
      cv: null,
      certificates: null,
      contract: null,
      insurance: null,
      others: null
    }
  });

  const [generatedAccount, setGeneratedAccount] = useState(null);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-250 rounded w-1/3"></div>
        <div className="h-32 bg-slate-200 rounded"></div>
        <div className="h-10 bg-slate-200 rounded"></div>
      </div>
    );
  }

  const nextStep = () => {
    // Basic step validation
    if (step === 1) {
      if (!formData.firstName || !formData.surname || !formData.email) {
        Swal.fire('Error', 'First Name, Surname, and Personal Email are mandatory.', 'error');
        return;
      }
    } else if (step === 2) {
      if (!formData.officeLocation || !formData.position) {
        Swal.fire('Error', 'Office Location and Position Designation are mandatory.', 'error');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 4));
  };
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleFormChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleDocUpload = (docKey, fileData) => {
    setFormData(prev => ({
      ...prev,
      supportingDocuments: {
        ...prev.supportingDocuments,
        [docKey]: fileData
      }
    }));
  };

  const handleCreateStaff = async () => {
    // Check files validation
    const { cv, certificates, contract, insurance } = formData.supportingDocuments;
    if (!cv || !certificates || !contract || !insurance) {
      Swal.fire('Error', 'Please upload all mandatory documents (CV, Certificates, Contract, Insurance) before creating the account.', 'error');
      return;
    }

    setIsSubmitting(true);
    setSubmittingPhase('Verifying document profiles...');
    
    // Simulate steps delay to show progress illustrations
    setTimeout(async () => {
      setSubmittingPhase('Encoding and bundling document payloads...');
      setTimeout(async () => {
        setSubmittingPhase('Writing registry keys to database...');
        setTimeout(async () => {
          setSubmittingPhase('Generating credentials keys...');
          
          // Auto-generate password
          const tempPassword = 'Pass_' + Math.random().toString(36).slice(-6) + '!';
          
          const staffData = {
            ...formData,
            avatar: formData.avatarFile?.dataUrl || '',
            tempPassword
          };

          try {
            await addUser(staffData);
            setGeneratedAccount({
              email: formData.email,
              password: tempPassword,
              name: `${formData.firstName} ${formData.surname}`.trim()
            });
            setIsSubmitting(false);
            setStep(4);
            Swal.fire('Success!', 'Staff member registered successfully.', 'success');
          } catch (e) {
            setIsSubmitting(false);
            Swal.fire('Creation Error', e.message, 'error');
          }
        }, 800);
      }, 800);
    }, 800);
  };

  const handleCopyCredentials = () => {
    navigator.clipboard.writeText(`Email: ${generatedAccount.email}\nPassword: ${generatedAccount.password}`);
    Swal.fire('Copied!', 'Credentials copied to clipboard.', 'success');
  };

  if (isSubmitting) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center space-y-6 animate-fadeIn">
        {/* Pulsing, spinning complex premium progress illustration */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Inner pulse */}
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-ping"></div>
          {/* Middle spin */}
          <div className="absolute inset-2 rounded-full border-4 border-t-indigo-650 border-indigo-200 animate-spin"></div>
          {/* Center icon */}
          <div className="absolute w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-slate-700">
            <Upload className="animate-bounce" size={20} />
          </div>
        </div>

        <div className="text-center space-y-2 max-w-sm">
          <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Onboarding Staff Member...</h4>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed animate-pulse">{submittingPhase}</p>
        </div>

        {/* Multi-step progress bar visual indicator */}
        <div className="w-48 bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className={`bg-indigo-600 h-full rounded-full transition-all duration-500 ${
            submittingPhase.startsWith('Verifying') ? 'w-[25%]' :
            submittingPhase.startsWith('Encoding') ? 'w-[50%]' :
            submittingPhase.startsWith('Writing') ? 'w-[75%]' : 'w-[95%]'
          }`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
      {/* Wizard Steps indicator */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Onboard New Team Member</h3>
          <p className="text-[10px] text-slate-400">Step {step} of 4: Fill out the details below.</p>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`w-3.5 h-1.5 rounded-full transition-all ${
                s === step ? 'bg-indigo-600 w-6' : s < step ? 'bg-indigo-300' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Form Steps Panels */}
      <div className="p-6 min-h-[360px] max-h-[60vh] overflow-y-auto no-scrollbar">
        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-4 animate-slideRight">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Step 1: Personal Information</h4>
            
            {/* Profile Photo upload */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">Profile Picture (Manually Uploaded)</label>
              <FileUpload.Root value={formData.avatarFile} onChange={(file) => handleFormChange('avatarFile', file)}>
                <FileUpload.DropZone label="Attach Profile Picture Photo" accept="image/*" />
              </FileUpload.Root>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">First Name *</label>
                <input 
                  type="text" 
                  value={formData.firstName} 
                  onChange={(e) => handleFormChange('firstName', e.target.value)}
                  placeholder="Olivia"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Middle Name</label>
                <input 
                  type="text" 
                  value={formData.middleName} 
                  onChange={(e) => handleFormChange('middleName', e.target.value)}
                  placeholder="Lana"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Surname *</label>
                <input 
                  type="text" 
                  value={formData.surname} 
                  onChange={(e) => handleFormChange('surname', e.target.value)}
                  placeholder="Rhye"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Personal Email *</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder="olivia@personal.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Organization Email</label>
                <input 
                  type="email" 
                  value={formData.organizationEmail} 
                  onChange={(e) => handleFormChange('organizationEmail', e.target.value)}
                  placeholder="olivia@oms.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Phone number/s</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  placeholder="+254 711 000 222"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">National Identity No (ID)</label>
                <input 
                  type="text" 
                  value={formData.personalId} 
                  onChange={(e) => handleFormChange('personalId', e.target.value)}
                  placeholder="ID-88776655"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">NHIF Number</label>
                <input 
                  type="text" 
                  value={formData.nhif} 
                  onChange={(e) => handleFormChange('nhif', e.target.value)}
                  placeholder="NHIF-998811"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">NSSF Number</label>
                <input 
                  type="text" 
                  value={formData.nssf} 
                  onChange={(e) => handleFormChange('nssf', e.target.value)}
                  placeholder="NSSF-332211"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Date of Birth (DOB)</label>
                <input 
                  type="date" 
                  value={formData.dob} 
                  onChange={(e) => handleFormChange('dob', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Place of Birth</label>
                <input 
                  type="text" 
                  value={formData.placeOfBirth} 
                  onChange={(e) => handleFormChange('placeOfBirth', e.target.value)}
                  placeholder="Mombasa"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Place of Living</label>
                <input 
                  type="text" 
                  value={formData.placeOfLiving} 
                  onChange={(e) => handleFormChange('placeOfLiving', e.target.value)}
                  placeholder="Westlands, Nairobi"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Nationality</label>
                <input 
                  type="text" 
                  value={formData.nationality} 
                  onChange={(e) => handleFormChange('nationality', e.target.value)}
                  placeholder="Kenyan"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Gender</label>
                <select 
                  value={formData.gender} 
                  onChange={(e) => handleFormChange('gender', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Any Disability</label>
                <select 
                  value={formData.disability} 
                  onChange={(e) => handleFormChange('disability', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {formData.disability === 'Yes' && (
              <div className="space-y-1 animate-fadeIn">
                <label className="text-[11px] font-bold text-slate-500 block">Disability Description</label>
                <input 
                  type="text" 
                  value={formData.disabilityDescription} 
                  onChange={(e) => handleFormChange('disabilityDescription', e.target.value)}
                  placeholder="Specify details..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Job/Office Description */}
        {step === 2 && (
          <div className="space-y-4 animate-slideRight">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Step 2: Office Location & Description</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <label className="text-[11px] font-bold text-slate-500 block">Office Location *</label>
                <input 
                  type="text" 
                  value={formData.officeLocation} 
                  onChange={(e) => handleFormChange('officeLocation', e.target.value)}
                  placeholder="e.g. HQ Annex, Nairobi"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Department Unit *</label>
                <select 
                  value={formData.department} 
                  onChange={(e) => handleFormChange('department', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Operations">Operations</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">HR</option>
                  <option value="Program Management">Program Management</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Specific Designation / Title *</label>
                <input 
                  type="text" 
                  value={formData.position} 
                  onChange={(e) => handleFormChange('position', e.target.value)}
                  placeholder="Junior Software Engineer"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Hire/Start Date</label>
                <input 
                  type="date" 
                  value={formData.hireDate} 
                  onChange={(e) => handleFormChange('hireDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Authorization Role *</label>
                <select 
                  value={formData.role} 
                  onChange={(e) => handleFormChange('role', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="System Administrator">System Administrator</option>
                  <option value="Executive Director">Executive Director</option>
                  <option value="HR Officer">HR Officer</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Finance Officer">Finance Officer</option>
                  <option value="Procurement & Logistics Officer">Procurement & Logistics Officer</option>
                  <option value="Department Head">Department Head</option>
                  <option value="Program Officer">Program Officer</option>
                  <option value="Communications Officer">Communications Officer</option>
                  <option value="Field Officer">Field Officer</option>
                  <option value="Volunteer">Volunteer</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Attach Supporting Documents */}
        {step === 3 && (
          <div className="space-y-5 animate-slideRight">
            <div className="border-b border-slate-100 pb-1.5">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Step 3: Attach Mandatory Documents</h4>
              <p className="text-[10px] text-slate-400">All supporting documents are required to complete onboarding registration.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-slate-655 block">Curriculum Vitae (CV) *</label>
                <FileUpload.Root value={formData.supportingDocuments.cv} onChange={(file) => handleDocUpload('cv', file)}>
                  <FileUpload.DropZone label="Attach Curriculum Vitae (CV) PDF" accept=".pdf,.doc,.docx" />
                </FileUpload.Root>
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-slate-655 block">Academic Certificates *</label>
                <FileUpload.Root value={formData.supportingDocuments.certificates} onChange={(file) => handleDocUpload('certificates', file)}>
                  <FileUpload.DropZone label="Attach Academic Credentials / Certificates" accept=".pdf,.png,.jpg,.jpeg" />
                </FileUpload.Root>
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-slate-655 block">Employment Agreement Contract *</label>
                <FileUpload.Root value={formData.supportingDocuments.contract} onChange={(file) => handleDocUpload('contract', file)}>
                  <FileUpload.DropZone label="Attach Signed Employment Agreement" accept=".pdf" />
                </FileUpload.Root>
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-slate-655 block">National Insurance Card (NHIF) *</label>
                <FileUpload.Root value={formData.supportingDocuments.insurance} onChange={(file) => handleDocUpload('insurance', file)}>
                  <FileUpload.DropZone label="Attach NHIF / Insurance Scan" accept=".pdf,.png,.jpg,.jpeg" />
                </FileUpload.Root>
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-slate-655 block">Other Supporting Documents (Others) *</label>
                <FileUpload.Root value={formData.supportingDocuments.others} onChange={(file) => handleDocUpload('others', file)}>
                  <FileUpload.DropZone label="Attach Extra Identifications / Police Clearance" accept=".pdf,.png,.jpg,.jpeg" />
                </FileUpload.Root>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Account Creation Result */}
        {step === 4 && generatedAccount && (
          <div className="space-y-5 text-center py-6 animate-fadeIn">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
              <UserCheck size={28} />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 text-base">Staff Account Created Successfully</h4>
              <p className="text-xs text-slate-400">Share these login details with {generatedAccount.name} immediately.</p>
            </div>

            {/* Credentials Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm mx-auto text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Email Address:</span>
                <span className="font-bold text-slate-700">{generatedAccount.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Temp Password:</span>
                <span className="font-bold text-slate-850">{generatedAccount.password}</span>
              </div>
              <button 
                onClick={handleCopyCredentials}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-350 rounded text-center text-xs font-semibold font-sans mt-2"
              >
                Copy Credentials Card
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Buttons bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between shrink-0">
        {step > 1 && step < 4 ? (
          <button 
            onClick={prevStep}
            className="px-4 py-2 border border-slate-250 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition-all"
          >
            Previous
          </button>
        ) : <div />}

        {step < 3 ? (
          <button 
            onClick={nextStep}
            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            Next Step
          </button>
        ) : step === 3 ? (
          <button 
            onClick={handleCreateStaff}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            Create Staff & Generate Account
          </button>
        ) : (
          <button 
            onClick={() => { setStep(1); setGeneratedAccount(null); setFormData({ firstName: '', middleName: '', surname: '', email: '', organizationEmail: '', phone: '', personalId: '', nhif: '', nssf: '', dob: '', placeOfBirth: '', placeOfLiving: '', gender: 'Male', disability: 'No', disabilityDescription: '', nationality: '', officeLocation: '', department: 'Engineering', position: '', role: 'Intern', hireDate: new Date().toISOString().substring(0, 10), avatarFile: null, supportingDocuments: { cv: null, certificates: null, contract: null, insurance: null, others: null } }); }}
            className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            Onboard Another User
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. HR DEPARTMENTS VIEW (TREE / HIERARCHY)
// ==========================================
export function HrDepartmentsView() {
  const { users, updateUser } = useProject();
  const loading = usePageLoader([users]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [newDeptName, setNewDeptName] = useState('');

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5 h-64"></div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 h-64"></div>
        </div>
      </div>
    );
  }

  // Static list of departments
  const departments = ['Engineering', 'Operations', 'Finance', 'HR', 'Program Management'];

  const getStaffInDept = (dept) => {
    return users.filter(u => (u.officeDetails?.department || u.department || 'Operations') === dept);
  };

  const handleShiftDepartment = (userId, oldDept) => {
    const target = users.find(u => u.id === userId);
    const options = departments.filter(d => d !== oldDept);
    
    Swal.fire({
      title: 'Shift Department',
      input: 'select',
      inputOptions: options.reduce((acc, d) => ({ ...acc, [d]: d }), {}),
      inputPlaceholder: 'Select target department Unit',
      showCancelButton: true,
      confirmButtonText: 'Shift Member',
      confirmButtonColor: '#0031C9'
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        updateUser(userId, { 'officeDetails.department': res.value, department: res.value });
        Swal.fire('Shifted!', `${target.name} has been shifted to ${res.value}.`, 'success');
      }
    });
  };

  const handleRemoveFromDept = (userId) => {
    const target = users.find(u => u.id === userId);
    Swal.fire({
      title: 'Remove from Department?',
      text: `Are you sure you want to remove ${target.name} from their department assignment?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Remove'
    }).then((res) => {
      if (res.isConfirmed) {
        updateUser(userId, { 'officeDetails.department': 'Unassigned', department: 'Unassigned' });
        Swal.fire('Removed!', 'User is now unassigned.', 'success');
      }
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">Departments Hierarchy & Tree structure</h2>
        <p className="text-xs text-slate-400">Shift workforce resources between operational departments or review department details.</p>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {departments.map((dept, idx) => {
          const staff = getStaffInDept(dept);
          return (
            <div 
              key={idx} 
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 cursor-pointer hover:border-indigo-300 transition-all"
              onClick={() => setSelectedDept(dept)}
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Building size={16} className="text-indigo-500" />
                  <span>{dept} Department</span>
                </h4>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-semibold">{staff.length} Members</span>
              </div>

              {/* Hierarchy Tree (Top to Bottom List) */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {staff.map((s, sIdx) => {
                  return (
                    <div 
                      key={sIdx} 
                      className="flex items-center justify-between p-2 hover:bg-slate-50 rounded border border-slate-50"
                      onClick={(e) => { e.stopPropagation(); setSelectedDept(dept); }}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar 
                          size="xs" 
                          src={s.avatar || "https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80"} 
                          alt={s.name} 
                        />
                        <div className="text-xs">
                          <div className="font-bold text-slate-800">{s.name}</div>
                          <div className="text-[10px] text-slate-400">{s.role}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleShiftDepartment(s.id, dept)}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-655"
                        >
                          Shift
                        </button>
                        <button 
                          onClick={() => handleRemoveFromDept(s.id)}
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                          title="Remove from Department"
                        >
                          <UserMinus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {staff.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">No employees assigned.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Detail Modal */}
      {selectedDept && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedDept(null)}
        >
          <div 
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">{selectedDept} Overview description</h3>
              <button onClick={() => setSelectedDept(null)} className="p-1 hover:bg-slate-100 rounded text-slate-455">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="font-bold block text-slate-700">Department Mission Description:</span>
                <p className="mt-1 leading-relaxed">Operates as the primary execution engine for all {selectedDept.toLowerCase()} workflows, managing allocated staff projects and compliance frameworks.</p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="font-bold block text-slate-700">Department Specific Documents:</span>
                <div className="space-y-1.5 mt-2">
                  {['Standard_Operating_Procedures.pdf', 'Departmental_Guideline_FY26.pdf'].map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-150 rounded">
                      <span className="font-medium">{doc}</span>
                      <button onClick={() => Swal.fire('Downloading...', doc, 'info')} className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded">
                        <Download size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedDept(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. HR REQUESTS VIEW
// ==========================================
export function HrRequestsView() {
  const { requests, updateRequestStatus, users } = useProject();
  const loading = usePageLoader([requests]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [noticeType, setNoticeType] = useState('Leave Approval Reminder');
  const [noticeNotes, setNoticeNotes] = useState('');

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
        <div className="bg-white border border-slate-200 rounded-xl p-5 h-64"></div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 h-64"></div>
      </div>
    );
  }

  const handleAction = (reqId, action) => {
    Swal.fire({
      title: `${action} Request?`,
      text: `Are you sure you want to mark this request as ${action.toLowerCase()}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: action === 'Approve' ? '#10b981' : '#ef4444',
      confirmButtonText: `Yes, ${action}`
    }).then((res) => {
      if (res.isConfirmed) {
        updateRequestStatus(reqId, action === 'Approve' ? 'Approved' : 'Rejected');
        Swal.fire(action === 'Approve' ? 'Approved!' : 'Rejected!', `The request has been updated.`, 'success');
      }
    });
  };

  const handleSendNotice = (e) => {
    e.preventDefault();
    if (!selectedStaffId || !noticeNotes) {
      Swal.fire('Error', 'Please select a staff member and write your directive notes.', 'error');
      return;
    }
    const staff = users.find(u => u.id === selectedStaffId);
    Swal.fire({
      title: 'Notice Synced & Dispatched',
      text: `Successfully dispatched directive notice (${noticeType}) to ${staff ? staff.name : 'Staff'}.`,
      icon: 'success'
    });
    setSelectedStaffId('');
    setNoticeNotes('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Review Requests */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Send size={16} className="text-indigo-500" />
              <span>Incoming Staff Requests Pipeline</span>
            </h3>
            <p className="text-[10px] text-slate-400">Review time-off, complaints, or contract query forms</p>
          </div>

          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
            {requests.map(req => (
              <div key={req.id} className="py-3 flex justify-between items-center text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800">{req.userName} ({req.department})</div>
                  <div className="text-slate-500 font-medium text-[10px]">
                    Type: <span className="font-bold text-slate-700">{req.requestType}</span> — {req.details?.reason || 'No description supplied.'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                    req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                    req.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-250' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {req.status}
                  </span>
                  {req.status === 'pending' && (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleAction(req.id, 'Approve')}
                        className="p-1 hover:bg-emerald-50 text-emerald-600 rounded border border-slate-200"
                        title="Approve Request"
                      >
                        <Check size={12} />
                      </button>
                      <button 
                        onClick={() => handleAction(req.id, 'Reject')}
                        className="p-1 hover:bg-rose-50 text-rose-600 rounded border border-slate-200"
                        title="Reject Request"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">No pending requests found.</div>
            )}
          </div>
        </div>

        {/* Right: Dispatch notice directive */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-500" />
              <span>Dispatch Directive / Formal Notice</span>
            </h3>
            <p className="text-[10px] text-slate-400">Issue warnings, leave notices, or official reminders</p>
          </div>

          <form onSubmit={handleSendNotice} className="space-y-4 text-xs">
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
                <option value="Leave Approval Reminder">Leave Approval Reminder</option>
                <option value="Suspension Letter Dispatch">Suspension Letter Dispatch</option>
                <option value="Compliance Disciplinary Warning">Compliance Disciplinary Warning</option>
                <option value="Contract Longevity Extension">Contract Longevity Extension</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500 block">Directive Description Notes</label>
              <textarea 
                value={noticeNotes}
                onChange={(e) => setNoticeNotes(e.target.value)}
                placeholder="Type the formal message details..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 h-24"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Send size={13} />
              <span>Send Directive</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. HR PROJECTS VIEW
// ==========================================
export function HrProjectsView() {
  const { projects, users } = useProject();
  const loading = usePageLoader([projects]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-xl p-5 h-56"></div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 h-56"></div>
        </div>
      </div>
    );
  }

  const getStaffOnProject = () => {
    return users.filter(u => u.officeDetails?.department === 'Program Management' || u.role === 'Project Manager');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">Projects Hierarchy Portfolios</h2>
        <p className="text-xs text-slate-400">Review project tasks status assignments and track resource trees.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map((proj, idx) => {
          const staff = getStaffOnProject();
          return (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-indigo-300 transition-all">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">{proj.name}</h4>
                  <span className="text-[10px] text-slate-400">{proj.status} — KES {proj.budget?.toLocaleString()} Limit</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700">{proj.progress}% Done</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
              </div>

              {/* Team Hierarchy Tree list */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Assigned Project Personnel</span>
                {staff.slice(0, 3).map((member, mIdx) => (
                  <div key={mIdx} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded">
                    <div className="flex items-center gap-2">
                      <Avatar size="xs" src={member.avatar} alt={member.name} />
                      <div className="text-xs">
                        <div className="font-bold text-slate-800">{member.name}</div>
                        <span className="text-[9px] text-slate-400">Task Owner</span>
                      </div>
                    </div>
                    <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-750 px-2 py-0.5 rounded font-semibold">Active</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 7. HR PAYROLLS VIEW
// ==========================================
export function HrPayrollsView() {
  const { users } = useProject();
  const loading = usePageLoader([users]);

  if (loading) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">Workforce Payroll Directory Ledger</h2>
        <p className="text-xs text-slate-400">Review salary payment transactions, bank configurations, and receipts processed by Finance.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Staff name</th>
                <th className="py-3 px-6">Department Unit</th>
                <th className="py-3 px-6">Salary Rate</th>
                <th className="py-3 px-6">Last Payment date</th>
                <th className="py-3 px-6">Finance status</th>
                <th className="py-3 px-6">Receipt File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {users.map((u, idx) => {
                const salary = u.role === 'Executive Director' ? 'KES 250,000' : u.role === 'Project Manager' ? 'KES 140,000' : 'KES 120,000';
                return (
                  <tr key={idx} className="hover:bg-slate-50/40">
                    <td className="py-3.5 px-6 font-bold text-slate-800">{u.name}</td>
                    <td className="py-3.5 px-6 text-slate-500">{u.officeDetails?.department || u.department || 'Operations'}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{salary}</td>
                    <td className="py-3.5 px-6 text-slate-455 font-mono">2026-06-30</td>
                    <td className="py-3.5 px-6">
                      <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold border border-emerald-150 uppercase">Processed</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <button 
                        onClick={() => Swal.fire('Downloading...', 'Receipt_P9988.pdf', 'info')}
                        className="flex items-center gap-1 text-[11px] text-slate-700 hover:text-slate-900 hover:underline font-semibold"
                      >
                        <Download size={12} />
                        <span>Receipt_P9988.pdf</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. HR LEAVE MANAGEMENT VIEW
// ==========================================
export function HrLeaveView() {
  const { users, updateUser } = useProject();
  const loading = usePageLoader([users]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-xl"></div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 h-48"></div>
      </div>
    );
  }

  const onLeaveStaff = users.filter(u => u.status === 'On Leave' || u.officeDetails?.status === 'On Leave');

  const handleRevoke = (userId) => {
    Swal.fire({
      title: 'Revoke Active Leave?',
      text: 'Are you sure you want to recall this employee back to office operations immediately?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0031C9',
      confirmButtonText: 'Yes, Recall'
    }).then((res) => {
      if (res.isConfirmed) {
        updateUser(userId, { status: 'Active', 'officeDetails.status': 'Active' });
        Swal.fire('Recalled!', 'Employee has been reinstated to active status.', 'success');
      }
    });
  };

  const handleNotify = (uName) => {
    Swal.fire('Reminder Sent', `Successfully dispatched leave expiration reminder message to ${uName}.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">Leave Pipelines & Timeline Logs</h2>
        <p className="text-xs text-slate-400">Inspect active leaves, dispatch timeline expiration alerts, or recall employees.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
          <Calendar size={16} className="text-indigo-500" />
          <span>Active Staff Leaves Timeline</span>
        </h4>

        <div className="space-y-4">
          {onLeaveStaff.map((s, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
              <div className="space-y-1">
                <div className="font-extrabold text-slate-800 text-sm">{s.name}</div>
                <div className="text-slate-500">Department: {s.officeDetails?.department || s.department} — Position: {s.officeDetails?.position || s.role}</div>
                {/* Timeline Bar */}
                <div className="flex items-center gap-2 pt-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">Starts: 2026-07-01</span>
                  <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full w-[65%]"></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Ends: 2026-07-30 (16 Days Remaining)</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleNotify(s.name)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-bold border border-slate-200"
                >
                  Send Expiry Alert
                </button>
                <button 
                  onClick={() => handleRevoke(s.id)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold border border-rose-250"
                >
                  Revoke Leave
                </button>
              </div>
            </div>
          ))}
          {onLeaveStaff.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">No employees currently registered on leave.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 9. HR REPORTS VIEW
// ==========================================
export function HrReportsView() {
  const { reports } = useProject();
  const loading = usePageLoader([reports]);
  
  if (loading) {
    return <TableSkeleton rows={3} />;
  }

  const handleReadReport = (rep) => {
    Swal.fire({
      title: rep.type,
      text: rep.preview || 'No description supplied.',
      icon: 'info',
      confirmButtonText: 'Archive Report',
      confirmButtonColor: '#0031C9'
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">Staff Monthly & Weekly Reports</h2>
        <p className="text-xs text-slate-400">Review task summary submissions uploaded by field officers and department managers.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Author</th>
                <th className="py-3 px-6">Report Type</th>
                <th className="py-3 px-6">Submission Date</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {reports.map((rep, idx) => (
                <tr key={idx} className="hover:bg-slate-50/40">
                  <td className="py-3.5 px-6 font-bold text-slate-800">{rep.author}</td>
                  <td className="py-3.5 px-6 text-slate-550">{rep.type}</td>
                  <td className="py-3.5 px-6 text-slate-400 font-mono">{rep.date}</td>
                  <td className="py-3.5 px-6">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                      rep.status === 'Reviewed' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{rep.status}</span>
                  </td>
                  <td className="py-3.5 px-6">
                    <button 
                      onClick={() => handleReadReport(rep)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded text-indigo-700 text-[11px] font-bold"
                    >
                      <Eye size={12} />
                      <span>Read Report</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">No staff reports have been submitted.</div>
          )}
        </div>
      </div>
    </div>
  );
}

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

// ==========================================
// 11. HR SETTINGS VIEW
// ==========================================
export function HrSettingsView() {
  const { user, updateProfileDetails } = useAuth();
  const loading = usePageLoader([user]);
  const [phone, setPhone] = useState(user?.personalDetails?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  if (loading) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-250 rounded w-1/4"></div>
        <div className="h-44 bg-slate-200 rounded"></div>
      </div>
    );
  }

  const handleSave = (e) => {
    e.preventDefault();
    updateProfileDetails({ phone, avatar });
    Swal.fire('Settings Saved', 'Your HR profile has been successfully updated.', 'success');
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">System & Profile Configurations</h2>
        <p className="text-xs text-slate-400">Review your designated office variables or update personal contacts.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-500 block">Avatar Profile Photo Link</label>
            <input 
              type="text" 
              value={avatar} 
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200" 
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-500 block">Phone Contact Number</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200" 
            />
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg">
            <div>
              <span className="text-slate-400 block">Office Position</span>
              <span className="font-bold text-slate-700">{user?.officeDetails?.position || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Department Unit</span>
              <span className="font-bold text-slate-700">{user?.officeDetails?.department || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">NSSF ID Number</span>
              <span className="font-bold text-slate-700">{user?.supportingDocuments?.nssf || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Contract Status</span>
              <span className="font-bold text-emerald-600">Active</span>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-all"
          >
            Save Settings Details
          </button>
        </form>
      </div>
    </div>
  );
}
