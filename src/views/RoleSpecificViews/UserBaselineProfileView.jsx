import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Shield, BookOpen, Download
} from 'lucide-react';
import Swal from 'sweetalert2';
import { AvatarProfilePhoto } from "@/components/base/avatar/avatar";
import { Illustration } from "@/components/shared-assets/illustrations";
import { storage } from '@/firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Card & Details (Editable personal, locked office/docs) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 lg:col-span-2">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
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
            <span className="inline-block px-2.5 py-0.5 mt-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full uppercase">
              {user.role}
            </span>
            {avatarUploading && <p className="text-[11px] text-indigo-500 font-semibold mt-1">Uploading photo...</p>}
          </div>
        </div>

        {/* Editable Personal Details */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>Personal Details</span>
            <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-normal uppercase">User Configurable</span>
          </h4>

          <form onSubmit={handleUpdatePersonal} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
              <input 
                type="text" 
                disabled 
                value={user.email} 
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
              <input 
                type="text" 
                required 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
              />
            </div>
            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 rounded text-xs transition-colors self-end w-full sm:w-auto px-4"
            >
              Update Phone Contact
            </button>
            {success && (
              <span className="text-xs text-emerald-600 font-bold self-center">Profile updated successfully.</span>
            )}
          </form>
        </div>

        {/* Locked Office Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>Office Placement Details</span>
            <span className="text-[11px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-normal uppercase flex items-center gap-1">
              <Shield size={10} /> Locked Property
            </span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-450 block text-[11px] font-bold uppercase">Assigned Position</span>
              <span className="font-semibold text-slate-700">{user.officeDetails?.position}</span>
            </div>
            <div>
              <span className="text-slate-450 block text-[11px] font-bold uppercase">Department Unit</span>
              <span className="font-semibold text-slate-700">{user.officeDetails?.department}</span>
            </div>
            <div>
              <span className="text-slate-450 block text-[11px] font-bold uppercase">Date of Hire</span>
              <span className="font-semibold text-slate-700">{user.officeDetails?.hireDate}</span>
            </div>
          </div>
        </div>

        {/* Locked Supporting Documents */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>Supporting Audited Documents</span>
            <span className="text-[11px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-normal uppercase flex items-center gap-1">
              <Shield size={10} /> Locked Property
            </span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 border border-slate-150 rounded flex flex-col justify-between h-14">
              <span className="text-slate-400 text-[11px] font-bold uppercase block font-sans">Employment Contract</span>
              <span className="font-semibold text-[11px] text-slate-750 truncate">{user.supportingDocuments?.contract}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-150 rounded flex flex-col justify-between h-14">
              <span className="text-slate-400 text-[11px] font-bold uppercase block font-sans">NSSF Identifier</span>
              <span className="font-semibold text-[11px] text-slate-750">{user.supportingDocuments?.nssf}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-150 rounded flex flex-col justify-between h-14">
              <span className="text-slate-400 text-[11px] font-bold uppercase block font-sans">NHIF Identifier</span>
              <span className="font-semibold text-[11px] text-slate-750">{user.supportingDocuments?.nhif}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Read-Only Document Vault */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1 flex flex-col justify-between h-[500px]">
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BookOpen className="text-indigo-500" size={16} />
              <span>Read-Only Document Vault</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Official templates and organization policy manuals.</p>
          </div>

          {policyVault.length === 0 ? (
            <div className="py-12 space-y-3">
              <Illustration type="documents" size="sm" />
              <p className="text-xs text-slate-400 text-center italic">No documents are currently stored in this vault folder.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
              {policyVault.map(vault => (
                <div key={vault.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded text-xs flex justify-between items-center hover:bg-slate-100 transition-colors">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-700 block truncate max-w-[150px]">{vault.title}</span>
                    <span className="text-[11px] text-slate-400 uppercase font-mono">{vault.category} • {vault.size}</span>
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
        
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">Documents are managed by the Administration & HR departments. Editing is restricted.</p>
      </div>
    </div>
  );
}
