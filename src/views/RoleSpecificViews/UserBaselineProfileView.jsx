import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Shield, BookOpen, Download
} from 'lucide-react';
import Swal from 'sweetalert2';
import { AvatarProfilePhoto } from "@/components/base/avatar/avatar";
import { Illustration } from "@/components/shared-assets/illustrations";
import { AccountSettingsPanel } from '@/components/shared/AccountSettingsPanel';
import { storage } from '@/firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Label/value row matching the sm:col-span-3 / sm:col-span-9 pattern from the
// design reference, adapted to BAOMS's slate/indigo palette (no dark mode).
function ProfileRow({ label, hint, children }) {
  return (
    <div className="grid sm:grid-cols-12 gap-2 sm:gap-4 py-5 border-b border-slate-100 last:border-b-0">
      <div className="sm:col-span-3">
        <label className="block text-sm font-semibold text-slate-700 sm:mt-2.5">{label}</label>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <div className="sm:col-span-9">{children}</div>
    </div>
  );
}

const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-white";

export function UserBaselineProfileView() {
  const { user, policyVault, updateProfileDetails } = useAuth();
  const [phone, setPhone] = useState(user?.personalDetails?.phone || '');
  const [success, setSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleUpdatePersonal = (e) => {
    e.preventDefault();
    updateProfileDetails({ phone });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarUploading(true);
    try {
      const userId = user.id || user.uid;
      const destination = ref(storage, `avatars/${userId}/${Date.now()}_${file.name}`);
      await uploadBytes(destination, file);
      const downloadUrl = await getDownloadURL(destination);
      await updateProfileDetails({ avatar: downloadUrl });
      Swal.fire({
        title: 'Avatar Updated!',
        text: 'Your profile photo has been uploaded and saved.',
        icon: 'success',
        confirmButtonColor: '#4f46e5'
      });
    } catch (err) {
      console.error('Avatar upload failed:', err);
      Swal.fire({
        title: 'Upload Failed',
        text: 'Could not upload your photo. Please try again in a moment.',
        icon: 'error',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile identity + editable personal details + locked office details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-4 p-6 border-b border-slate-100">
            <div className={`relative ${avatarUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <AvatarProfilePhoto
                verified={true}
                size="lg"
                alt={user.name}
                src={user.avatar}
                onUpload={handleAvatarUpload}
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
              <span className="inline-block px-2.5 py-0.5 mt-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full uppercase">
                {user.role}
              </span>
              {avatarUploading && <p className="text-xs text-indigo-500 font-semibold mt-1">Uploading photo...</p>}
            </div>
          </div>

          <div className="px-6">
            <form onSubmit={handleUpdatePersonal}>
              <ProfileRow label="Email Address" hint="Managed by Administration">
                <input type="text" disabled value={user.email} className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`} />
              </ProfileRow>
              <ProfileRow label="Phone Number">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+255 7XX XXX XXX"
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    Save
                  </button>
                </div>
                {success && <p className="text-sm text-emerald-600 font-semibold mt-2">Profile updated successfully.</p>}
              </ProfileRow>
            </form>

            <ProfileRow label="Position" hint="Locked — set by HR/Admin">
              <p className="text-sm font-semibold text-slate-700 py-2">{user.officeDetails?.position || '—'}</p>
            </ProfileRow>
            <ProfileRow label="Department" hint="Locked — set by HR/Admin">
              <p className="text-sm font-semibold text-slate-700 py-2">{user.officeDetails?.department || '—'}</p>
            </ProfileRow>
            <ProfileRow label="Date of Hire" hint="Locked — set by HR/Admin">
              <p className="text-sm font-semibold text-slate-700 py-2">{user.officeDetails?.hireDate || '—'}</p>
            </ProfileRow>
          </div>

          {/* Locked Supporting Documents */}
          <div className="p-6 border-t border-slate-100 space-y-3">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Shield size={14} className="text-rose-500" />
              <span>Supporting Audited Documents</span>
              <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-normal uppercase">Locked</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg flex flex-col justify-between h-14">
                <span className="text-slate-400 text-xs font-bold uppercase">Employment Contract</span>
                <span className="font-semibold text-xs text-slate-700 truncate">{user.supportingDocuments?.contract || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg flex flex-col justify-between h-14">
                <span className="text-slate-400 text-xs font-bold uppercase">NSSF Identifier</span>
                <span className="font-semibold text-xs text-slate-700">{user.supportingDocuments?.nssf || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg flex flex-col justify-between h-14">
                <span className="text-slate-400 text-xs font-bold uppercase">NHIF Identifier</span>
                <span className="font-semibold text-xs text-slate-700">{user.supportingDocuments?.nhif || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Read-Only Document Vault */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1 flex flex-col justify-between h-fit">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <BookOpen className="text-indigo-500" size={16} />
                <span>Document Vault</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Official templates and organization policy manuals.</p>
            </div>

            {policyVault.length === 0 ? (
              <div className="py-12 space-y-3">
                <Illustration type="documents" size="sm" />
                <p className="text-sm text-slate-400 text-center italic">No documents are currently stored in this vault folder.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
                {policyVault.map(vault => (
                  <div key={vault.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-sm flex justify-between items-center hover:bg-slate-100 transition-colors">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-700 block truncate max-w-[150px]">{vault.title}</span>
                      <span className="text-xs text-slate-400 uppercase font-mono">{vault.category} • {vault.size}</span>
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

          <p className="text-xs text-slate-400 text-center leading-relaxed">Documents are managed by the Administration & HR departments. Editing is restricted.</p>
        </div>
      </div>

      {/* Account settings: theme, password, delete account */}
      <AccountSettingsPanel />
    </div>
  );
}
