import React, { useMemo, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { Search, X, Mail, Phone, Building2, Briefcase, Users } from 'lucide-react';
import { Avatar } from '@/components/base/avatar/avatar';

// ============================================================================
// ORGANIZATION DIRECTORY VIEW (universal, role-agnostic "who works here" page)
// ============================================================================
export function DirectoryView() {
  const { users } = useProject();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);

  // Only show staff who are still with the organization (mirrors HrStaffView's
  // status convention: officeDetails.status falls back to top-level status).
  const activeUsers = useMemo(() => {
    return (users || []).filter(u => {
      const status = u.officeDetails?.status || u.status || 'Active';
      return status !== 'Suspended' && status !== 'Terminated';
    });
  }, [users]);

  const departments = useMemo(() => {
    const set = new Set();
    activeUsers.forEach(u => {
      set.add(u.officeDetails?.department || u.department || 'Operations');
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [activeUsers]);

  const filteredUsers = activeUsers.filter(u => {
    const dept = u.officeDetails?.department || u.department || 'Operations';
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      dept.toLowerCase().includes(q);
    const matchesDept = selectedDept === 'All' || dept === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-800">Organization Directory</h2>
        <p className="text-xs text-slate-400 font-normal">Browse every staff member across the organization and view their contact details.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search by name, role, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 shadow-inner"
        />
      </div>

      {/* Department filter chips */}
      {departments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedDept('All')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-normal border transition-all ${
              selectedDept === 'All'
                ? 'bg-indigo-650 text-white border-indigo-650'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
            }`}
          >
            All Departments
          </button>
          {departments.map(dept => (
            <button
              type="button"
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-normal border transition-all ${
                selectedDept === dept
                  ? 'bg-indigo-650 text-white border-indigo-650'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      )}

      {/* Grid / Empty states */}
      {(users || []).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
          <Users className="mx-auto text-slate-300" size={32} />
          <p className="text-xs text-slate-400 font-normal mt-3">No staff members have been added to the organization yet.</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
          <Search className="mx-auto text-slate-300" size={32} />
          <p className="text-xs text-slate-400 font-normal mt-3">No team members match your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {filteredUsers.map(u => {
            const dept = u.officeDetails?.department || u.department || 'Operations';
            return (
              <div
                key={u.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center text-center space-y-4 hover:border-slate-350 transition-all cursor-pointer select-none"
                onClick={() => setSelectedUser(u)}
              >
                <Avatar size="lg" src={u.avatar} alt={u.name} className="ring-1 ring-slate-100" />
                <div>
                  <h4 className="font-normal text-slate-808 text-sm leading-tight">{u.name}</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5 font-normal">{u.officeDetails?.position || u.role}</p>
                </div>
                <div className="flex flex-col gap-1 w-full text-[11px] border-t border-slate-100 pt-3 font-normal">
                  <div className="flex justify-between text-slate-550">
                    <span>Role</span>
                    <span className="text-slate-700">{u.role || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-slate-550 pt-1.5">
                    <span>Department</span>
                    <span className="text-slate-600">{dept}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Popup (read-only) */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Avatar size="sm" src={selectedUser.avatar} alt={selectedUser.name} />
                <div>
                  <h3 className="text-sm font-normal leading-none">{selectedUser.name}</h3>
                  <span className="text-[11px] text-slate-400 font-normal">{selectedUser.officeDetails?.position || selectedUser.role}</span>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-4 text-xs bg-slate-50 max-h-[70vh] overflow-y-auto font-normal">
              <div className="space-y-2">
                <h5 className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">Contact & Role</h5>
                <div className="grid grid-cols-2 gap-3 bg-white border border-slate-200 rounded-lg p-3">
                  <div className="col-span-2">
                    <span className="text-slate-400 flex items-center gap-1 font-normal"><Mail size={11} /> Email</span>
                    <span className="text-slate-700 font-normal break-all">{selectedUser.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 flex items-center gap-1 font-normal"><Phone size={11} /> Phone</span>
                    <span className="text-slate-700 font-normal">{selectedUser.personalDetails?.phone || selectedUser.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 flex items-center gap-1 font-normal"><Briefcase size={11} /> Role</span>
                    <span className="text-slate-700 font-normal">{selectedUser.role || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 flex items-center gap-1 font-normal"><Building2 size={11} /> Department</span>
                    <span className="text-slate-700 font-normal">{selectedUser.officeDetails?.department || selectedUser.department || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal">Position</span>
                    <span className="text-slate-700 font-normal">{selectedUser.officeDetails?.position || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
