import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Search, X } from 'lucide-react';
import { Avatar } from '@/components/base/avatar/avatar';

// ============================================================================
// 4. PM TEAM MEMBERS VIEW (original 4, since Tasks was removed from sidebar)
// ============================================================================
export function PMTeamMembersView() {
  const { users, projects } = useProject();
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-normal text-slate-800">Resource Personnel & Staff Workload</h2>
        <p className="text-sm text-slate-400 font-normal">View team availability, track task workload balances, and review contact directories.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search team member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 shadow-inner"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {filteredUsers.map(u => {
          const dept = u.officeDetails?.department || u.department || 'Operations';
          const activeProjCount = projects.filter(p => (p.assignedStaff || []).includes(u.id)).length;

          return (
            <div
              key={u.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center text-center space-y-4 hover:border-slate-350 transition-all cursor-pointer select-none"
              onClick={() => setSelectedUser(u)}
            >
              <Avatar size="lg" src={u.avatar} alt={u.name} className="ring-1 ring-slate-100" />
              <div>
                <h4 className="font-normal text-slate-808 text-base leading-tight">{u.name}</h4>
                <p className="text-slate-400 text-xs mt-0.5 font-normal">{u.officeDetails?.position || u.role}</p>
              </div>
              <div className="flex flex-col gap-1 w-full text-xs border-t border-slate-100 pt-3 font-normal">
                <div className="flex justify-between text-slate-550">
                  <span>Department</span>
                  <span className="text-slate-700">{dept}</span>
                </div>
                <div className="flex justify-between text-slate-550 pt-1.5">
                  <span>Projects</span>
                  <span className="text-slate-600">{activeProjCount} Assigned</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Popup */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Avatar size="sm" src={selectedUser.avatar} alt={selectedUser.name} />
                <div>
                  <h3 className="text-base font-normal leading-none">{selectedUser.name}</h3>
                  <span className="text-xs text-slate-400 font-normal">{selectedUser.email}</span>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-4 text-sm bg-slate-50 max-h-[70vh] overflow-y-auto font-normal">
              <div className="space-y-2">
                <h5 className="text-xs font-normal text-slate-400 uppercase tracking-wider">Contact & Performance</h5>
                <div className="grid grid-cols-2 gap-3 bg-white border border-slate-200 rounded-lg p-3">
                  <div>
                    <span className="text-slate-400 block font-normal">Phone Contact</span>
                    <span className="text-slate-700 font-normal">{selectedUser.phone || selectedUser.personalDetails?.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-405 block font-normal">Department</span>
                    <span className="text-slate-700 font-normal">{selectedUser.officeDetails?.department || selectedUser.department || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-405 block font-normal">Hire Date</span>
                    <span className="text-slate-700 font-normal">{selectedUser.officeDetails?.hireDate || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-405 block font-normal">Status</span>
                    <span className="text-slate-600 font-normal">Active</span>
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
