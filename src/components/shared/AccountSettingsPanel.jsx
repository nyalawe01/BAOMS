import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, AlertTriangle, Lock } from 'lucide-react';
import Swal from 'sweetalert2';

const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F2A507]/30 focus:border-[#F2A507] bg-white";

// Standard account-settings block reused across every role's Settings page:
// change password, delete account. Role-specific org configuration
// (approval thresholds, tax defaults, etc.) lives in that role's own
// Settings view, above or below this panel.
export function AccountSettingsPanel() {
  const { changePassword, deleteMyAccount } = useAuth();

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  const [deletePwd, setDeletePwd] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPwd.length < 6) {
      Swal.fire({ title: 'Password Too Short', text: 'New password must be at least 6 characters.', icon: 'warning', confirmButtonColor: '#D68904' });
      return;
    }
    if (newPwd !== confirmPwd) {
      Swal.fire({ title: 'Passwords Do Not Match', text: 'Confirm the new password correctly.', icon: 'warning', confirmButtonColor: '#D68904' });
      return;
    }
    setPwdSaving(true);
    try {
      await changePassword(currentPwd, newPwd);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      Swal.fire({ title: 'Password Updated', text: 'Your password has been changed successfully.', icon: 'success', confirmButtonColor: '#D68904' });
    } catch (err) {
      console.error('Password change failed:', err);
      Swal.fire({ title: 'Could Not Change Password', text: 'Your current password may be incorrect. Please try again.', icon: 'error', confirmButtonColor: '#D68904' });
    } finally {
      setPwdSaving(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePwd) return;

    const result = await Swal.fire({
      title: 'Delete Your Account?',
      text: 'This permanently removes your profile and sign-in access. This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete My Account'
    });
    if (!result.isConfirmed) return;

    setDeleteBusy(true);
    try {
      await deleteMyAccount(deletePwd);
    } catch (err) {
      console.error('Account deletion failed:', err);
      Swal.fire({ title: 'Could Not Delete Account', text: 'Your password may be incorrect. Please try again.', icon: 'error', confirmButtonColor: '#D68904' });
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password & Security */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-1">
          <KeyRound size={16} className="text-[#D68904]" />
          <span>Password & Security</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">Change the password used to sign in to BAOMS.</p>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Current Password</label>
            <input type="password" required value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className={inputClass} placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">New Password</label>
            <input type="password" required value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className={inputClass} placeholder="At least 6 characters" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Confirm New Password</label>
            <input type="password" required value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className={inputClass} placeholder="••••••••" />
          </div>
          <button
            type="submit"
            disabled={pwdSaving}
            className="w-full bg-[#D68904] hover:bg-[#F2A507] disabled:opacity-60 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            {pwdSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-6">
        <h3 className="font-bold text-rose-700 text-base flex items-center gap-2 mb-1">
          <AlertTriangle size={16} />
          <span>Danger Zone</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">Permanently delete your BAOMS account and sign-in access.</p>
        <form onSubmit={handleDeleteAccount} className="flex flex-col sm:flex-row gap-3">
          <input type="password" required value={deletePwd} onChange={(e) => setDeletePwd(e.target.value)} className={inputClass} placeholder="Confirm your password" />
          <button
            type="submit"
            disabled={deleteBusy}
            className="shrink-0 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <Lock size={14} />
            {deleteBusy ? 'Deleting...' : 'Delete My Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
