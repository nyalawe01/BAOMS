import { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Building, UserMinus, X, Download } from 'lucide-react';
import Swal from 'sweetalert2';
import { Avatar } from '@/components/base/avatar/avatar';
import { usePageLoader } from './_shared';

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
