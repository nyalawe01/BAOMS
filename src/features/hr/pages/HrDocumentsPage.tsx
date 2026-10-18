import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  RefreshCw,
  Building,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  FolderOpen,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { getStaffProfiles } from '../services/hrService';
import { StaffProfileRecord } from '../types/hr';

interface PersonnelDocument {
  id: string;
  staffId: string;
  staffName: string;
  staffNumber: string;
  department: string;
  title: string;
  category: 'contract' | 'appointment' | 'id_nida' | 'job_description' | 'certificate' | 'statutory';
  referenceNumber: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  uploadedBy: string;
  verified: boolean;
  notes: string;
}

const STATIC_DOCUMENTS: PersonnelDocument[] = [
  {
    id: 'doc-1',
    staffId: 'stf-001',
    staffName: 'Emmanuel S. Kimaro',
    staffNumber: 'STF-001',
    department: 'Programs & Delivery',
    title: 'Fixed-Term Employment Contract (2026-2027)',
    category: 'contract',
    referenceNumber: 'BAOMS-CON-2026-001',
    fileName: 'Emmanuel_Kimaro_Employment_Contract_Signed.pdf',
    fileSize: '1.4 MB',
    uploadDate: '2026-01-10',
    uploadedBy: 'Elinami Munuo (HR)',
    verified: true,
    notes: 'Signed and countersigned by Executive Director.',
  },
  {
    id: 'doc-2',
    staffId: 'stf-001',
    staffName: 'Emmanuel S. Kimaro',
    staffNumber: 'STF-001',
    department: 'Programs & Delivery',
    title: 'Certified National Identity Card (NIDA Copy)',
    category: 'id_nida',
    referenceNumber: 'NIDA-19850412-14101-00004-21',
    fileName: 'Kimaro_NIDA_Verified_Copy.pdf',
    fileSize: '420 KB',
    uploadDate: '2026-01-12',
    uploadedBy: 'Elinami Munuo (HR)',
    verified: true,
    notes: 'Verified against NIDA national database.',
  },
  {
    id: 'doc-3',
    staffId: 'stf-002',
    staffName: 'Amina Salum',
    staffNumber: 'STF-002',
    department: 'Finance & Operations',
    title: 'Official Appointment Letter — Head of Finance',
    category: 'appointment',
    referenceNumber: 'BAOMS-HR-APPT-2025-014',
    fileName: 'Amina_Salum_Appointment_Letter.pdf',
    fileSize: '890 KB',
    uploadDate: '2025-06-01',
    uploadedBy: 'Rehema Mwenda (ED)',
    verified: true,
    notes: 'Executive appointment letter with salary band details.',
  },
  {
    id: 'doc-4',
    staffId: 'stf-002',
    staffName: 'Amina Salum',
    staffNumber: 'STF-002',
    department: 'Finance & Operations',
    title: 'NSSF Member Registration & Remittance Confirmation',
    category: 'statutory',
    referenceNumber: 'NSSF-TZ-88492014',
    fileName: 'Amina_Salum_NSSF_Membership.pdf',
    fileSize: '510 KB',
    uploadDate: '2025-06-05',
    uploadedBy: 'Elinami Munuo (HR)',
    verified: true,
    notes: 'Direct statutory filing confirmation.',
  },
  {
    id: 'doc-5',
    staffId: 'stf-003',
    staffName: 'Geofrey M. Temba',
    staffNumber: 'STF-003',
    department: 'Procurement & Logistics',
    title: 'Authorized Job Description — Procurement & Logistics Officer',
    category: 'job_description',
    referenceNumber: 'BAOMS-JD-PROC-01',
    fileName: 'JD_Procurement_Logistics_Officer_2026.pdf',
    fileSize: '650 KB',
    uploadDate: '2026-02-15',
    uploadedBy: 'Elinami Munuo (HR)',
    verified: true,
    notes: 'Countersigned by employee upon induction.',
  },
  {
    id: 'doc-6',
    staffId: 'stf-004',
    staffName: 'Neema Mwita',
    staffNumber: 'STF-004',
    department: 'Monitoring & Evaluation',
    title: 'Certified Academic Credentials & M&E Degree',
    category: 'certificate',
    referenceNumber: 'UDSM-CERT-2022-77491',
    fileName: 'Neema_Mwita_Degree_Certificate.pdf',
    fileSize: '2.1 MB',
    uploadDate: '2026-03-01',
    uploadedBy: 'Elinami Munuo (HR)',
    verified: true,
    notes: 'University of Dar es Salaam verified transcript.',
  },
];

export const HrDocumentsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<PersonnelDocument[]>(STATIC_DOCUMENTS);
  const [staffList, setStaffList] = useState<StaffProfileRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [selectedDoc, setSelectedDoc] = useState<PersonnelDocument | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload Form
  const [uploadStaffId, setUploadStaffId] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<PersonnelDocument['category']>('contract');
  const [uploadRef, setUploadRef] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await getStaffProfiles();
      setStaffList(records);
    } catch (e) {
      console.warn('Documents telemetry notice:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesStaff = selectedStaffFilter === 'all' || doc.staffId === selectedStaffFilter;

      return matchesSearch && matchesCat && matchesStaff;
    });
  }, [documents, searchQuery, selectedCategory, selectedStaffFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire('File Too Large', 'Maximum file size allowed is 10 MB.', 'warning');
        return;
      }
      setSelectedFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadStaffId) {
      Swal.fire('Staff Association Required', 'Please associate this document with an employee record.', 'warning');
      return;
    }

    const stf = staffList.find((s) => s.id === uploadStaffId) || staffList[0];
    const newDoc: PersonnelDocument = {
      id: `doc-${Date.now()}`,
      staffId: stf.id,
      staffName: stf.fullName,
      staffNumber: stf.staffNumber,
      department: stf.departmentName,
      title: uploadTitle,
      category: uploadCategory,
      referenceNumber: uploadRef || `BAOMS-DOC-${Date.now().toString().slice(-4)}`,
      fileName: selectedFile ? selectedFile.name : `${uploadTitle.replace(/ /g, '_')}.pdf`,
      fileSize: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : '1.2 MB',
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: 'Elinami Munuo (HR Administrator)',
      verified: true,
      notes: uploadNotes || 'Uploaded via HR Documents Registry.',
    };

    setDocuments([newDoc, ...documents]);
    setIsUploadOpen(false);
    setSelectedFile(null);
    setUploadTitle('');
    setUploadRef('');
    setUploadNotes('');

    Swal.fire({
      title: 'Document Archived',
      text: `${newDoc.title} securely filed in ${newDoc.staffName}'s confidential dossier.`,
      icon: 'success',
      confirmButtonColor: '#D68904',
    });
  };

  const handleSimulateDownload = (doc: PersonnelDocument) => {
    Swal.fire({
      title: 'Confidential HR Document',
      text: `Opening secure preview for ${doc.fileName}...`,
      icon: 'info',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Personnel Documents Registry"
        subtitle="Confidential repository for signed contracts, appointment letters, NIDA identity records, statutory certificates, and staff qualifications."
        breadcrumbs={[
          { label: 'HR Dashboard', href: '/' },
          { label: 'Staff Directory', href: '/hr' },
          { label: 'HR Documents' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-1.5" />
              Upload Personnel Document
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Archived Documents</span>
            <FileText className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-900">
            {documents.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Secured records across all personnel dossiers
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Employment Contracts</span>
            <FolderOpen className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-900">
            {documents.filter((d) => d.category === 'contract').length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Signed employment & consultancy agreements
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>NIDA / Identity Files</span>
            <Shield className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-emerald-700">
            {documents.filter((d) => d.category === 'id_nida').length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Certified citizen & national identity records
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Statutory Filings</span>
            <FileCheck className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-900">
            {documents.filter((d) => d.category === 'statutory').length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            NSSF, PSSSF, NHIF & TRA tax numbers
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-surface-border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="relative max-w-xs w-full">
            <Search className="h-3.5 w-3.5 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents, staff..."
              className="pl-8 pr-3 py-1.5 text-xs rounded border border-surface-border bg-white focus:outline-none focus:ring-1 focus:ring-charcoal-500 w-full"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1.5 px-3 text-xs rounded border border-surface-border bg-white text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-charcoal-500"
          >
            <option value="all">All Document Categories</option>
            <option value="contract">Contracts & Agreements</option>
            <option value="appointment">Appointment Letters</option>
            <option value="id_nida">NIDA & Identity Records</option>
            <option value="job_description">Job Descriptions</option>
            <option value="statutory">Statutory & Tax Records</option>
            <option value="certificate">Training & Academic Certs</option>
          </select>

          <select
            value={selectedStaffFilter}
            onChange={(e) => setSelectedStaffFilter(e.target.value)}
            className="py-1.5 px-3 text-xs rounded border border-surface-border bg-white text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-charcoal-500"
          >
            <option value="all">Filter by Staff Member (All)</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-charcoal-muted">
          Showing {filteredDocuments.length} documents
        </div>
      </div>

      {/* Main Document Register Table */}
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[750px]">
            <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-4">Document Title</th>
                <th className="py-2.5 px-4">Associated Employee</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Reference Number</th>
                <th className="py-2.5 px-4">Upload Date</th>
                <th className="py-2.5 px-4">Size</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-charcoal-muted text-xs">
                    No documents found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-charcoal-900 text-xs flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-charcoal-500 shrink-0" />
                        <span>{doc.title}</span>
                      </div>
                      <div className="text-[11px] text-charcoal-muted font-mono pl-5.5">{doc.fileName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-charcoal-900 text-xs">{doc.staffName}</div>
                      <div className="text-[11px] text-charcoal-muted">{doc.department}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium capitalize text-charcoal-700">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-charcoal-800">
                        {doc.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-charcoal-600">
                      {doc.referenceNumber}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-charcoal-600">
                      {doc.uploadDate}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-charcoal-500">
                      {doc.fileSize}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setIsDetailOpen(true);
                          }}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-charcoal-800 hover:bg-slate-200"
                          title="View Document Details"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimulateDownload(doc)}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-charcoal-50 text-charcoal-800 hover:bg-charcoal-100"
                          title="Download Document"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDoc(null);
        }}
        title={selectedDoc ? selectedDoc.title : 'Document Summary'}
        description="Confidential HR personnel record metadata and verification status."
        footer={
          <div className="flex justify-between items-center w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
            {selectedDoc && (
              <Button variant="primary" size="sm" onClick={() => handleSimulateDownload(selectedDoc)}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download Document
              </Button>
            )}
          </div>
        }
      >
        {selectedDoc && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex justify-between">
                <span>Associated Staff: <strong>{selectedDoc.staffName}</strong></span>
                <span className="font-mono">ID: {selectedDoc.staffNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Department: <strong>{selectedDoc.department}</strong></span>
                <span className="capitalize">Category: <strong>{selectedDoc.category.replace('_', ' ')}</strong></span>
              </div>
              <div className="flex justify-between">
                <span>Reference: <strong className="font-mono">{selectedDoc.referenceNumber}</strong></span>
                <span>File Size: {selectedDoc.fileSize}</span>
              </div>
              <div className="text-charcoal-500 pt-1 border-t border-slate-200 flex justify-between">
                <span>Uploaded by: {selectedDoc.uploadedBy}</span>
                <span>Date: {selectedDoc.uploadDate}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-charcoal-900 mb-1">Administrative Notes:</h4>
              <p className="p-2.5 bg-white border border-surface-border rounded text-charcoal-700">
                {selectedDoc.notes}
              </p>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Verified and authorized for confidential institutional personnel filing.</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Interface Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Personnel Document"
        description="Securely upload signed contracts, identity papers, or certificates to a staff member's dossier."
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUploadSubmit}>
              Upload & File Document
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-charcoal-700 mb-1">Associate with Staff Member</label>
            <select
              value={uploadStaffId}
              onChange={(e) => setUploadStaffId(e.target.value)}
              className="w-full p-2 border border-surface-border rounded bg-white text-xs"
              required
            >
              <option value="">Select staff member...</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.staffNumber} • {s.departmentName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-charcoal-700 mb-1">Document Category</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as any)}
              className="w-full p-2 border border-surface-border rounded bg-white text-xs"
            >
              <option value="contract">Employment Contract / Agreement</option>
              <option value="appointment">Appointment Letter</option>
              <option value="id_nida">NIDA / National ID Card Copy</option>
              <option value="job_description">Authorized Job Description</option>
              <option value="statutory">Statutory Fund / Tax Documentation</option>
              <option value="certificate">Academic / Professional Certificate</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-charcoal-700 mb-1">Document Title</label>
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="w-full p-2 border border-surface-border rounded bg-white text-xs"
              placeholder="e.g. Countersigned Fixed-Term Contract 2026"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-charcoal-700 mb-1">Reference / Document Code</label>
            <input
              type="text"
              value={uploadRef}
              onChange={(e) => setUploadRef(e.target.value)}
              className="w-full p-2 border border-surface-border rounded bg-white text-xs"
              placeholder="e.g. BAOMS-CON-2026-004"
            />
          </div>

          <div>
            <label className="block font-medium text-charcoal-700 mb-1">Select Document File (PDF, DOCX, PNG)</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
              className="w-full p-2 border border-surface-border rounded bg-white text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-charcoal-700 mb-1">Confidential Filing Notes</label>
            <textarea
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
              rows={2}
              className="w-full p-2 border border-surface-border rounded bg-white text-xs"
              placeholder="Provide context regarding verification or execution..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HrDocumentsPage;
