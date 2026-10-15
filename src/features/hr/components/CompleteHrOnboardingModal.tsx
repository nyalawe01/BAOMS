import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  FileText,
  DollarSign,
  BookOpen,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StaffProfileRecord, StaffCertification, LoanBoardStatus } from '../types/hr';
import { updateHrDossier } from '../services/hrService';
import { createNotification } from '@/services/notificationsService';
import { useAuth } from '@/features/auth/useAuth';

interface CompleteHrOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffProfileRecord | null;
  onSuccess?: () => void;
}

export const CompleteHrOnboardingModal: React.FC<CompleteHrOnboardingModalProps> = ({
  isOpen,
  onClose,
  staff,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const [dateOfBirth, setDateOfBirth] = useState(staff?.dateOfBirth || '');
  const [nidaNumber, setNidaNumber] = useState(staff?.nidaNumber || '');
  const [tinNumber, setTinNumber] = useState(staff?.tinNumber || '');
  const [loanBoardStatus, setLoanBoardStatus] = useState<LoanBoardStatus>(
    staff?.loanBoardStatus || 'not_applicable'
  );
  const [loanBoardDetails, setLoanBoardDetails] = useState(staff?.loanBoardDetails || '');
  const [basicSalary, setBasicSalary] = useState(staff?.basicSalary ? String(staff.basicSalary) : '');
  const [grossSalary, setGrossSalary] = useState(staff?.grossSalary ? String(staff.grossSalary) : '');
  const [cvName, setCvName] = useState(staff?.cvName || '');
  const [certifications, setCertifications] = useState<StaffCertification[]>(
    staff?.certifications || []
  );

  // New certification form inputs
  const [newCertName, setNewCertName] = useState('');
  const [newCertInstitution, setNewCertInstitution] = useState('');
  const [newCertYear, setNewCertYear] = useState(new Date().getFullYear().toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if staff changes
  React.useEffect(() => {
    if (staff) {
      setDateOfBirth(staff.dateOfBirth || '');
      setNidaNumber(staff.nidaNumber || '');
      setTinNumber(staff.tinNumber || '');
      setLoanBoardStatus(staff.loanBoardStatus || 'not_applicable');
      setLoanBoardDetails(staff.loanBoardDetails || '');
      setBasicSalary(staff.basicSalary ? String(staff.basicSalary) : '');
      setGrossSalary(staff.grossSalary ? String(staff.grossSalary) : '');
      setCvName(staff.cvName || '');
      setCertifications(staff.certifications || []);
    }
  }, [staff]);

  if (!isOpen || !staff) return null;

  const handleAddCert = () => {
    if (!newCertName.trim() || !newCertInstitution.trim()) return;
    const cert: StaffCertification = {
      id: `cert-${Date.now()}`,
      name: newCertName.trim(),
      institution: newCertInstitution.trim(),
      year: parseInt(newCertYear, 10) || new Date().getFullYear(),
      verified: true,
    };
    setCertifications([...certifications, cert]);
    setNewCertName('');
    setNewCertInstitution('');
  };

  const handleRemoveCert = (id: string) => {
    setCertifications(certifications.filter((c) => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateHrDossier(
        staff.id,
        {
          dateOfBirth: dateOfBirth || null,
          nidaNumber: nidaNumber.trim() || null,
          tinNumber: tinNumber.trim() || null,
          loanBoardStatus,
          loanBoardDetails: loanBoardDetails.trim() || null,
          basicSalary: basicSalary ? parseFloat(basicSalary) : null,
          grossSalary: grossSalary ? parseFloat(grossSalary) : null,
          cvName: cvName.trim() || `${staff.fullName.replace(/\s+/g, '_')}_CV.pdf`,
          certifications,
        },
        {
          id: user?.id || 'admin',
          displayName: profile?.display_name || 'HR Administrator',
        }
      );

      // Dispatch alert to Finance Officer to complete statutory requirements
      createNotification({
        title: 'Statutory Enrollment Pending (Finance)',
        message: `HR personnel record completed for ${staff.fullName}. Complete statutory enrollments (NSSF, PSSF, NHIF, CWT, Loan Board).`,
        type: 'finance',
        targetRole: 'finance_officer',
        link: '/finance',
        metadata: {
          staffId: staff.id,
          action: 'complete_statutory',
        },
      });

      Swal.fire({
        title: t('hr.onboardSuccessTitle', 'HR Dossier Saved'),
        text: t(
          'hr.onboardSuccessMsg',
          'Personnel details, NIDA, TIN, Salary, and Certifications have been securely saved. Notification forwarded to Finance for statutory enrollment.'
        ),
        icon: 'success',
        confirmButtonColor: '#D68904',
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      Swal.fire({
        title: 'Save Failed',
        text: err.message || 'Could not save HR dossier.',
        icon: 'error',
        confirmButtonColor: '#D68904',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`HR Personnel Dossier: ${staff.fullName}`}
      description="Record statutory identification, national civil credentials, salary structure, CV, and professional certifications."
      size="xl"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-1.5" />
            {isSubmitting ? 'Saving Records...' : 'Save & Forward to Finance'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Staff Overview Banner */}
        <div className="bg-surface-muted/30 border border-surface-border rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-charcoal-900 block text-sm">{staff.fullName}</span>
            <span className="text-charcoal-muted">
              {staff.staffNumber} • {staff.jobTitle} • {staff.departmentName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#D68904] font-semibold uppercase">
              Step 2: HR Dossier
            </span>
          </div>
        </div>

        {/* Section 1: Identification & National IDs */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-800 border-b border-surface-border pb-2 flex items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-[#D68904]" />
            National Identification & Tax
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Date of Birth (DOB)
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                NIDA Number (National ID)
              </label>
              <input
                type="text"
                placeholder="e.g. 19881120-21102-00003-18"
                value={nidaNumber}
                onChange={(e) => setNidaNumber(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                TRA TIN Number
              </label>
              <input
                type="text"
                placeholder="e.g. 134-567-890"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Compensation & Loan Board */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-800 border-b border-surface-border pb-2 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-emerald-700" />
            Remuneration & Higher Education Loan Board (HESLB)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Basic Monthly Salary (TZS)
              </label>
              <input
                type="number"
                placeholder="e.g. 2500000"
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Gross Monthly Salary (TZS)
              </label>
              <input
                type="number"
                placeholder="e.g. 3000000"
                value={grossSalary}
                onChange={(e) => setGrossSalary(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Loan Board Status (HESLB)
              </label>
              <select
                value={loanBoardStatus}
                onChange={(e) => setLoanBoardStatus(e.target.value as LoanBoardStatus)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white"
              >
                <option value="not_applicable">Not Applicable (Non-Beneficiary)</option>
                <option value="deducting">Deducting (15% Monthly Statutory)</option>
                <option value="cleared">Cleared (Issued Clearance Cert)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Loan Board Deduction Notes
              </label>
              <input
                type="text"
                placeholder="e.g. HESLB Repayment active"
                value={loanBoardDetails}
                onChange={(e) => setLoanBoardDetails(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Curriculum Vitae & File Attachment */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-800 border-b border-surface-border pb-2 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-slate-700" />
            Curriculum Vitae (CV) Document
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Official CV Document Name
              </label>
              <input
                type="text"
                placeholder="e.g. Amina_Kimaro_HR_CV.pdf"
                value={cvName}
                onChange={(e) => setCvName(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white font-mono text-xs"
              />
            </div>
            <div className="text-xs text-charcoal-muted pt-2 sm:pt-4">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Audited Document Vault Ready
              </span>
              <p className="text-[11px] text-charcoal-light mt-0.5">
                Stored under immutable organizational personnel records.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Academic & Professional Certifications */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-800 border-b border-surface-border pb-2 flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-[#D68904]" />
            Academic & Professional Certifications ({certifications.length})
          </h4>

          {/* Add Certification Mini-Form */}
          <div className="p-3 bg-surface-muted/20 border border-surface-border rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                  Certification / Degree Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Postgraduate Diploma in HRM"
                  value={newCertName}
                  onChange={(e) => setNewCertName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-surface-border rounded-md text-xs text-charcoal-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                  Issuing Institution / University
                </label>
                <input
                  type="text"
                  placeholder="e.g. Institute of Social Work"
                  value={newCertInstitution}
                  onChange={(e) => setNewCertInstitution(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-surface-border rounded-md text-xs text-charcoal-900 bg-white"
                />
              </div>

              <div className="flex items-end gap-2">
                <div className="w-24">
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={newCertYear}
                    onChange={(e) => setNewCertYear(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-surface-border rounded-md text-xs text-charcoal-900 bg-white font-mono"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCert}
                  className="mb-0.5"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* List of Current Certifications */}
          <div className="space-y-2">
            {certifications.length === 0 ? (
              <p className="text-xs text-charcoal-muted italic py-1">
                No certifications registered yet. Use the form above to add diplomas or licenses.
              </p>
            ) : (
              certifications.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 bg-white border border-surface-border rounded-md text-xs"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#D68904] shrink-0" />
                    <div>
                      <span className="font-semibold text-charcoal-900">{c.name}</span>
                      <span className="text-charcoal-muted ml-2">
                        {c.institution} • {c.year}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCert(c.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                    title="Remove certification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
