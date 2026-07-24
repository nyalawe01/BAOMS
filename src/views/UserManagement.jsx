import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { Plus, UserPlus, Pencil, Trash2, Shield, Mail, Briefcase, Eye } from 'lucide-react';

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useProject();
  const { user: currentUser } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Employee');
  const [department, setDepartment] = useState('Engineering');

  const handleOpenAdd = () => {
    setName('');
    setEmail('');
    setRole('Employee');
    setDepartment('Engineering');
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setDepartment(user.department);
    setEditingUserId(user.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;

    if (isEditing) {
      updateUser(editingUserId, { name, email, role, department });
    } else {
      addUser({ name, email, role, department });
    }

    setShowModal(false);
  };

  const handleDelete = (userId) => {
    if (userId === currentUser.id) {
      alert('Security violation: You cannot delete your own active administrator account.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user from the directory?')) {
      deleteUser(userId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Directory Management</h2>
          <p className="text-slate-500 text-xs mt-1">Add, update access scopes, and audit profiles across the entire organization directory.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-brand-600/10"
        >
          <UserPlus size={16} />
          <span>Add Member</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Name & Identifier</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Access Scope / Role</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {users.map((u) => {
                // Role badge colors
                let roleColor = 'bg-slate-50 text-slate-600 border-slate-200';
                if (u.role === 'Admin') roleColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                else if (u.role === 'Manager') roleColor = 'bg-sky-50 text-sky-700 border-sky-200';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase select-none">
                          {u.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Mail size={14} className="text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleColor}`}>
                        <Shield size={12} />
                        <span>{u.role}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Briefcase size={14} className="text-slate-400" />
                        <span>{u.department}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Profile"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove Profile"
                          disabled={u.id === currentUser.id}
                        >
                          <Trash2 size={15} className={u.id === currentUser.id ? 'opacity-30' : ''} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-lg">
                {isEditing ? 'Modify Directory Profile' : 'Register New Directory Profile'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@organization.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="Executive">Executive</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Operations">Operations</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {isEditing ? 'Apply Changes' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
