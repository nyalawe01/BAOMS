import { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Plus, Search, ChevronDown, X, Eye, Download } from 'lucide-react';
import Swal from 'sweetalert2';
import { Avatar } from '@/components/base/avatar/avatar';
import { usePageLoader, GridSkeleton } from './_shared';

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
          <p className="text-sm text-slate-400">View detailed credentials, shift departments, and update active state flags.</p>
        </div>
        <button
          onClick={() => setActiveTab('hr_add_staff')}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
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
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
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
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1 text-left text-sm font-semibold">
                    {uStatus !== 'Active' && (
                      <button onClick={() => handleActionClick('Activate', u)} className="w-full px-3.5 py-2 hover:bg-slate-50 text-emerald-600 block">Activate</button>
                    )}
                    {uStatus !== 'Suspended' && (
                      <button onClick={() => handleActionClick('Suspend', u)} className="w-full px-3.5 py-2 hover:bg-slate-50 text-rose-600 block">Suspend</button>
                    )}
                    {uStatus !== 'On Leave' && (
                      <button onClick={() => handleActionClick('Put on Leave', u)} className="w-full px-3.5 py-2 hover:bg-slate-50 text-amber-600 block">Put on Leave</button>
                    )}
                    <button onClick={() => handleActionClick('Terminate', u)} className="w-full px-3.5 py-2 hover:bg-slate-50 text-slate-600 block">Terminate</button>
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
                <h4 className="font-bold text-slate-800 text-base truncate">{u.name}</h4>
                <p className="text-slate-400 text-xs truncate">{u.email}</p>
                <div className="text-xs font-semibold text-slate-500 truncate">{dept} — {u.role}</div>
              </div>

              <span className={`px-3 py-0.5 rounded-full text-xs font-bold border uppercase ${
                uStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                uStatus === 'On Leave' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-250'
              }`}>
                {uStatus}
              </span>
            </div>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-455 text-sm font-semibold bg-white rounded-xl border border-slate-200 shadow-sm">
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
                <h3 className="font-bold text-slate-800 text-base">Staff Detailed Review Card</h3>
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
                  <p className="text-slate-400 text-sm">{selectedUser.email}</p>
                  <span className={`inline-block px-2 py-0.5 mt-1 rounded text-xs font-bold border uppercase ${
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
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider">Personal details</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
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
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider">Office Description</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
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
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider">Attached Supporting Documents</h5>
                  <div className="space-y-2 text-sm">
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
                                <span className="text-xs text-slate-400 font-mono truncate max-w-[100px]">{attachedFile.fileName}</span>
                                <button
                                  onClick={() => setActivePreviewDoc({
                                    fileName: attachedFile.fileName,
                                    dataUrl: attachedFile.dataUrl,
                                    downloadUrl: attachedFile.downloadUrl,
                                    fileType: attachedFile.fileType,
                                    fileSize: attachedFile.fileSize
                                  })}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900"
                                  title="Preview document"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (attachedFile.downloadUrl) {
                                      window.open(attachedFile.downloadUrl, '_blank');
                                      return;
                                    }
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
                              <span className="text-xs text-slate-400 italic">Not Attached</span>
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
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-all"
              >
                Suspend User
              </button>
              <button
                onClick={() => handleActionClick('Terminate', selectedUser)}
                className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-sm font-bold transition-all border border-rose-250"
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
