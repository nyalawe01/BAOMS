import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { ChevronRight, Eye, Download, BookOpen, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import { FileUpload } from '@/components/application/file-upload/file-upload-base';

// ============================================================================
// 10. PM DOCUMENTS VIEW (per-project, organizational, position-specific)
// ============================================================================
export function PMDocumentsView() {
  const { projectFiles, projects, addProjectFile } = useProject();
  const { user } = useAuth();

  const [selectedFolder, setSelectedFolder] = useState('Contracts');
  const [uploadFile, setUploadFile] = useState(null);
  const [selectedProjId, setSelectedProjId] = useState(projects[0]?.id || '');

  // Mock document registries for Organization-Wide and Position-Specific tiers
  const organizationDocs = [
    { id: 'o1', title: 'NGO Employee Handbook & Code of Conduct v2.pdf', size: '2.4 MB', updated: '2026-05-12' },
    { id: 'o2', title: 'Data Privacy & Security Protocols.pdf', size: '1.8 MB', updated: '2026-06-01' }
  ];

  const positionDocs = [
    { id: 'p1', title: 'Project Management Budget Alignment Guidelines.pdf', size: '1.2 MB', updated: '2026-04-18', position: 'Project Manager' },
    { id: 'p2', title: 'HR Recruitment and Onboarding Policy.pdf', size: '2.1 MB', updated: '2026-03-25', position: 'HR Officer' }
  ].filter(doc => doc.position === (user?.officeDetails?.position || user?.role || 'Project Manager'));

  const filteredProjectFiles = projectFiles.filter(f => f.folderPath === selectedFolder && f.projectId === selectedProjId);

  const handleUpload = (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedProjId) return;

    addProjectFile(selectedProjId, uploadFile.fileName, selectedFolder, uploadFile.fileSize, uploadFile.downloadUrl);
    const uploadedName = uploadFile.fileName;
    setUploadFile(null);
    Swal.fire('File Saved!', `Successfully synced document file to directory folder: "/${selectedFolder}/${uploadedName}".`, 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-normal text-slate-800">Structured File System Manager</h2>
          <p className="text-sm text-slate-400 font-normal">Organize legal contracts, proposals, and training documentation categorized per project, role, and organization.</p>
        </div>
      </div>

      {/* Row 1: Organization & Position Documents (Mandatory Reads) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none font-normal text-sm">
        {/* Organization-Wide Documents */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-normal text-slate-800 text-base border-b border-slate-100 pb-2">
            Organization-Wide Required Documents
          </h3>
          <div className="space-y-2">
            {organizationDocs.map(doc => (
              <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center text-slate-700 font-normal">
                <div>
                  <span className="block font-normal">{doc.title}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">Updated: {doc.updated} • Size: {doc.size}</span>
                </div>
                <button onClick={() => Swal.fire('Preview Mode', 'Opening organizational compliance file...', 'info')} className="p-1 hover:bg-slate-200 rounded text-slate-600 border border-slate-200">
                  <Eye size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Position-Specific Documents */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-normal text-slate-808 text-base border-b border-slate-100 pb-2">
            Position-Specific Guidelines ({user?.officeDetails?.position || user?.role || 'Staff'})
          </h3>
          <div className="space-y-2">
            {positionDocs.map(doc => (
              <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center text-slate-700 font-normal">
                <div>
                  <span className="block font-normal">{doc.title}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">Updated: {doc.updated} • Size: {doc.size}</span>
                </div>
                <button onClick={() => Swal.fire('Preview Mode', 'Opening role guideline guidelines...', 'info')} className="p-1 hover:bg-slate-200 rounded text-slate-600 border border-slate-200">
                  <Eye size={12} />
                </button>
              </div>
            ))}
            {positionDocs.length === 0 && (
              <p className="text-slate-400 italic text-xs py-4 text-center font-normal">No role-specific document references loaded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Per-Project Workspace Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Folders Selector */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-normal text-slate-800 text-base">Project Workspace Folders</h3>
            <p className="text-xs text-slate-400 mt-0.5">Categorized per active project workspace</p>
          </div>

          <div className="space-y-3 font-normal text-sm">
            <div>
              <label className="block text-xs text-slate-400 uppercase mb-1">Select Project</label>
              <select
                value={selectedProjId}
                onChange={(e) => setSelectedProjId(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-200 bg-white"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              {['Contracts', 'Proposals', 'Budgets', 'Reports'].map(folder => (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-lg font-normal transition-all ${
                    selectedFolder === folder
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>/{folder}</span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-3 pt-3 border-t border-slate-200 text-sm font-normal">
            <div>
              <label className="block text-xs text-slate-400 uppercase mb-1 font-normal">Upload File</label>
              <FileUpload.Root value={uploadFile} onChange={setUploadFile}>
                <FileUpload.DropZone
                  label="Attach Project Document"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  storagePath={`projects/${selectedProjId}/documents`}
                />
              </FileUpload.Root>
            </div>
            <button
              type="submit"
              disabled={!uploadFile}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-normal transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload Project Document
            </button>
          </form>
        </div>

        {/* Project Files list */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-normal text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-2">
            <BookOpen size={16} className="text-slate-400" />
            <span>Files In Folder: /{selectedFolder}</span>
          </h3>

          <div className="space-y-2 text-sm font-normal">
            {filteredProjectFiles.map(file => (
              <div key={file.id} className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center text-slate-700 font-normal">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-slate-400" />
                  <div>
                    <span className="font-normal block">{file.fileName}</span>
                    <span className="text-xs text-slate-400 block mt-0.5 font-normal">Uploaded by: {file.senderName || 'Manager'} • {file.uploadedAt || 'N/A'}</span>
                  </div>
                </div>
                <button onClick={() => Swal.fire('Downloaded!', 'File download initiated.', 'success')} className="p-1 hover:bg-slate-200 border border-slate-200 rounded text-slate-600">
                  <Download size={13} />
                </button>
              </div>
            ))}
            {filteredProjectFiles.length === 0 && (
              <p className="text-center py-12 text-slate-400 italic font-normal">No document attachments linked in folder.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
