import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import { usePageLoader } from './_shared';

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
        <p className="text-sm text-slate-400">Review your designated office variables or update personal contacts.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
        <form onSubmit={handleSave} className="space-y-4 text-sm">
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

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg">
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
