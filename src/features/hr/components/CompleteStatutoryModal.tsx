import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Building2,
  Save,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StaffProfileRecord, LoanBoardStatus } from '../types/hr';
import { updateStatutoryDetails } from '../services/hrService';
import { createNotification } from '@/services/notificationsService';
import { useAuth } from '@/features/auth/useAuth';

interface CompleteStatutoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffProfileRecord | null;
  onSuccess?: () => void;
}

export const CompleteStatutoryModal: React.FC<CompleteStatutoryModalProps> = ({
  isOpen,
  onClose,
  staff,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const [cwtNumber, setCwtNumber] = useState(staff?.cwtNumber || '');
  const [nssfNumber, setNssfNumber] = useState(staff?.nssfNumber || '');
  const [pssfNumber, setPssfNumber] = useState(staff?.pssfNumber || '');
  const [nhifNumber, setNhifNumber] = useState(staff?.nhifNumber || '');
  const [loanBoardStatus, setLoanBoardStatus] = useState<LoanBoardStatus>(
    staff?.loanBoardStatus || 'not_applicable'
  );
  const [loanBoardDetails, setLoanBoardDetails] = useState(staff?.loanBoardDetails || '');
  const [bankName, setBankName] = useState(staff?.bankName || 'CRDB Bank PLC');
  const [bankAccountNumber, setBankAccountNumber] = useState(staff?.bankAccountNumber || '');
  const [bankBranch, setBankBranch] = useState(staff?.bankBranch || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (staff) {
      setCwtNumber(staff.cwtNumber || '');
      setNssfNumber(staff.nssfNumber || '');
      setPssfNumber(staff.pssfNumber || '');
      setNhifNumber(staff.nhifNumber || '');
      setLoanBoardStatus(staff.loanBoardStatus || 'not_applicable');
      setLoanBoardDetails(staff.loanBoardDetails || '');
      setBankName(staff.bankName || 'CRDB Bank PLC');
      setBankAccountNumber(staff.bankAccountNumber || '');
      setBankBranch(staff.bankBranch || '');
    }
  }, [staff]);

  if (!isOpen || !staff) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateStatutoryDetails(
        staff.id,
        {
          cwtNumber: cwtNumber.trim() || null,
          nssfNumber: nssfNumber.trim() || null,
          pssfNumber: pssfNumber.trim() || null,
          nhifNumber: nhifNumber.trim() || null,
          loanBoardStatus,
          loanBoardDetails: loanBoardDetails.trim() || null,
          bankName: bankName.trim() || null,
          bankAccountNumber: bankAccountNumber.trim() || null,
          bankBranch: bankBranch.trim() || null,
        },
        {
          id: user?.id || 'finance',
          displayName: profile?.display_name || 'Finance Officer',
        }
      );

      // Create completion notification
      createNotification({
        title: 'Staff Onboarding Fully Completed',
        message: `Statutory enrollment and onboarding completed for ${staff.fullName}. All compliance requirements verified.`,
        type: 'hr',
        targetRole: 'all',
        link: '/hr',
        metadata: {
          staffId: staff.id,
          action: 'view',
        },
      });

      Swal.fire({
        title: t('hr.statutorySavedTitle', 'Statutory Details Enrolled'),
        text: t(
          'hr.statutorySavedMsg',
          'Social security (NSSF/PSSF), Health insurance (NHIF), CWT union dues, and banking records have been registered. Staff onboarding is now marked complete.'
        ),
        icon: 'success',
        confirmButtonColor: '#D68904',
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      Swal.fire({
        title: 'Save Failed',
        text: err.message || 'Could not save statutory details.',
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
      title={`Statutory & Payroll Enrollment: ${staff.fullName}`}
      description="Record statutory social security, health insurance, CWT union membership, and bank disbursement accounts."
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-1.5" />
            {isSubmitting ? 'Saving Enrollment...' : 'Complete Statutory Enrollment'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner */}
        <div className="bg-surface-muted/30 border border-surface-border rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-charcoal-900 block text-sm">{staff.fullName}</span>
            <span className="text-charcoal-muted">
              {staff.staffNumber} • {staff.jobTitle} • {staff.departmentName}
            </span>
          </div>
          <div>
            <span className="font-mono text-[11px] text-emerald-800 font-semibold uppercase">
              Step 3: Finance Statutory Desk
            </span>
          </div>
        </div>

        {/* Section 1: Social Protection & Statutory Funds */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-800 border-b border-surface-border pb-2 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            Social Security & Health Insurance Identifiers
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                NSSF Member Number
              </label>
              <input
                type="text"
                placeholder="e.g. NSSF-8829102"
                value={nssfNumber}
                onChange={(e) => setNssfNumber(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                PSSF Member Number
              </label>
              <input
                type="text"
                placeholder="e.g. PSSF-0019284"
                value={pssfNumber}
                onChange={(e) => setPssfNumber(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                NHIF Card Number (National Health Insurance)
              </label>
              <input
                type="text"
                placeholder="e.g. NHIF-1029384756"
                value={nhifNumber}
                onChange={(e) => setNhifNumber(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                CWT Number (Chama cha Walimu / Union Dues)
              </label>
              <input
                type="text"
                placeholder="e.g. CWT-TZ-4482"
                value={cwtNumber}
                onChange={(e) => setCwtNumber(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Banking & Disbursement Details */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-800 border-b border-surface-border pb-2 flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-[#D68904]" />
            Direct Salary Remittance Account
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Bank Institution Name
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white"
              >
                <option value="CRDB Bank PLC">CRDB Bank PLC</option>
                <option value="NMB Bank PLC">NMB Bank PLC</option>
                <option value="NBC Tanzania">NBC Tanzania</option>
                <option value="Stanbic Bank Tanzania">Stanbic Bank Tanzania</option>
                <option value="Absa Bank Tanzania">Absa Bank Tanzania</option>
                <option value="Other Bank">Other Licensed Commercial Bank</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                placeholder="e.g. 0152488392000"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Bank Branch Name
              </label>
              <input
                type="text"
                placeholder="e.g. Oysterbay Branch"
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Loan Board Verification */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-800 border-b border-surface-border pb-2 flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-slate-700" />
            HESLB Loan Board Deduction Verification
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Loan Board Deduction Status
              </label>
              <select
                value={loanBoardStatus}
                onChange={(e) => setLoanBoardStatus(e.target.value as LoanBoardStatus)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white"
              >
                <option value="not_applicable">Not Applicable</option>
                <option value="deducting">Deducting (15% Monthly Statutory)</option>
                <option value="cleared">Cleared</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                HESLB Verification Notes / Index
              </label>
              <input
                type="text"
                placeholder="e.g. Verified with HESLB portal 2026"
                value={loanBoardDetails}
                onChange={(e) => setLoanBoardDetails(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-md text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-[#D68904]/30 focus:border-[#D68904] bg-white text-xs"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
