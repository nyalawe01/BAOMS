import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { 
  Users
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Avatar } from "@/components/base/avatar/avatar";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";

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
      confirmButtonColor: '#D68904',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Confirm'
    }).then((result) => {
      if (result.isConfirmed) {
        updateUser(userId, { status: newStatus });
        Swal.fire({
          title: 'Updated!',
          text: `Status updated to ${newStatus}.`,
          icon: 'success',
          confirmButtonColor: '#D68904'
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
      confirmButtonColor: '#D68904',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Reassign'
    }).then((result) => {
      if (result.isConfirmed) {
        updateUser(userId, { department: newDept });
        Swal.fire({
          title: 'Reassigned!',
          text: `Department reassigned to ${newDept}.`,
          icon: 'success',
          confirmButtonColor: '#D68904'
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
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Users className="text-indigo-650" size={18} />
            <span>Staff Status Controller Directory</span>
          </h3>
          <p className="text-xs text-slate-400">View corporate directories, toggle active/leave/suspended permissions, and reallocate departments.</p>
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
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-150 text-xs font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
              <th className="pb-2.5 pt-1.5 px-3.5">Name</th>
              <th className="pb-2.5 pt-1.5">Role</th>
              <th className="pb-2.5 pt-1.5">Department</th>
              <th className="pb-2.5 pt-1.5 text-right px-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/30">
                <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <Avatar 
                      size="xs" 
                      src={u.avatar || "https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80"} 
                      alt={u.name} 
                      className="ring-1 ring-slate-100" 
                    />
                    <div className="flex flex-col">
                      <span className="truncate max-w-[120px]">{u.name}</span>
                      <span className="text-xs text-slate-400 font-mono font-normal truncate max-w-[120px]">{u.email}</span>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 font-medium text-slate-500 truncate max-w-[100px]" title={u.role}>{u.role}</td>
                <td className="py-2.5">
                  <select 
                    value={u.department}
                    onChange={(e) => handleDeptChange(u.id, e.target.value)}
                    className="border border-slate-200 rounded px-1.5 py-0.5 text-sm bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
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
                <td className="py-2.5 text-right px-3.5">
                  <select 
                    value={u.status || 'Active'}
                    onChange={(e) => handleStatusChange(u.id, e.target.value)}
                    className={`border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold focus:outline-none focus:border-indigo-500 ${
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
