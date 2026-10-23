/**
 * RecordPaymentPage — Full-page stepper for issuing and recording financial disbursements
 * BAOMS | Babawatoto Organization Management System
 *
 * Steps:
 *   1. Voucher & Target       — Approved requisition selection & voucher number
 *   2. Amount & Disbursement — Payment amount, source account & transfer mode
 *   3. Payee Multi-Banking   — Payee contacts & multiple bank account options
 *   4. Proof of Payment      — Upload EFT slips, vouchers (with custom renaming)
 *   5. Review & Finalize     — Disbursement verification
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  FileCheck,
  Building,
  FileStack,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Wallet,
} from 'lucide-react';
import { FullPageStepper, FullPageStep } from '@/components/ui/FullPageStepper';
import { DocumentUploadSection, UploadedDocument } from '@/components/ui/DocumentUploadSection';
import {
  MultiPhoneInput,
  MultiPhoneItem,
  MultiBankDetailsInput,
  MultiBankItem,
} from '@/components/ui/MultiContactAndBankFields';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/lib/ToastContext';
import { useAuth } from '@/features/auth/useAuth';
import {
  getRequisitions,
  recordPaymentTransaction,
} from '../services/financeService';
import {
  FinancialRequestRecord,
  PaymentMethod,
  RecordPaymentPayload,
} from '../types/finance';

// ─── Steps Definition ────────────────────────────────────────────────────────

const STEPS: FullPageStep[] = [
  {
    id: 'target',
    title: 'Disbursement Target',
    subtitle: 'Requisition link & voucher reference',
    icon: <Receipt className="w-4 h-4" />,
  },
  {
    id: 'amount',
    title: 'Amount & Channel',
    subtitle: 'Disbursement value, source bank & method',
    icon: <Wallet className="w-4 h-4" />,
  },
  {
    id: 'banking',
    title: 'Payee Settlement',
    subtitle: 'Beneficiary multi-bank & contact details',
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    id: 'proof',
    title: 'Payment Proof',
    subtitle: 'EFT slips, stamped receipts (with custom names)',
    icon: <FileStack className="w-4 h-4" />,
  },
  {
    id: 'review',
    title: 'Review & Disburse',
    subtitle: 'Confirm financial transaction release',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
];

interface RecordPaymentPageProps {
  initialRequest?: FinancialRequestRecord | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const RecordPaymentPage: React.FC<RecordPaymentPageProps> = ({
  initialRequest,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { user, profile } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Available Requisitions
  const [requisitions, setRequisitions] = useState<FinancialRequestRecord[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>(initialRequest?.id || '');

  // Step 1: Voucher & Target
  const [paymentReference, setPaymentReference] = useState(
    `PV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

  // Step 2: Amount & Method
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [sourceAccount, setSourceAccount] = useState('CRDB Main Operations A/C (0150...)');

  // Step 3: Payee & Multi-Banking
  const [payeeName, setPayeeName] = useState(initialRequest?.requesterName || '');
  const [phones, setPhones] = useState<MultiPhoneItem[]>([
    {
      id: 'phone-1',
      number: '',
      type: 'primary',
      isPrimary: true,
    },
  ]);
  const [banks, setBanks] = useState<MultiBankItem[]>([
    {
      id: 'bank-1',
      bankName: 'CRDB Bank Plc',
      accountName: initialRequest?.requesterName || '',
      accountNumber: '',
      branch: 'Dar es Salaam',
      currency: 'TZS',
      isPrimary: true,
    },
  ]);
  const [notes, setNotes] = useState('');

  // Step 4: Documents (custom renameable)
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  useEffect(() => {
    getRequisitions().then((list) => {
      // Filter for approved / partially paid requisitions or all
      const eligible = list.filter((r) => r.status === 'approved' || r.status === 'partially_paid' || r.status === 'submitted');
      setRequisitions(eligible.length > 0 ? eligible : list);

      const targetId = searchParams.get('requestId') || initialRequest?.id;
      if (targetId) {
        setSelectedRequestId(targetId);
      } else if (eligible.length > 0 && !selectedRequestId) {
        setSelectedRequestId(eligible[0].id);
      }
    });
  }, [searchParams, initialRequest]);

  const activeRequest = requisitions.find((r) => r.id === selectedRequestId) || initialRequest;

  useEffect(() => {
    if (activeRequest) {
      const authorized = activeRequest.approvedAmount ?? activeRequest.totalAmount;
      const remaining = Math.max(0, authorized - (activeRequest.paidAmount || 0));
      setAmount(String(remaining));
      setPayeeName(activeRequest.requesterName);
    }
  }, [activeRequest]);

  const authorized = activeRequest ? (activeRequest.approvedAmount ?? activeRequest.totalAmount) : 0;
  const remaining = activeRequest ? Math.max(0, authorized - (activeRequest.paidAmount || 0)) : 0;

  // Validation
  const validateCurrentStep = (): boolean => {
    setValidationError(null);

    if (currentStep === 0) {
      if (!selectedRequestId) {
        setValidationError('Please select an authorized requisition to disburse against.');
        return false;
      }
      if (!paymentReference.trim()) {
        setValidationError('Payment voucher / reference number is required.');
        return false;
      }
    }

    if (currentStep === 1) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setValidationError('Disbursement amount must be greater than zero.');
        return false;
      }
      if (remaining > 0 && parsedAmount > remaining) {
        setValidationError(
          `Disbursement amount (TZS ${parsedAmount.toLocaleString()}) cannot exceed remaining authorized balance (TZS ${remaining.toLocaleString()}).`
        );
        return false;
      }
    }

    if (currentStep === 2) {
      if (!payeeName.trim()) {
        setValidationError('Payee / Beneficiary full name is required.');
        return false;
      }
      const validBank = banks.some((b) => b.accountNumber.trim().length > 0);
      if (!validBank) {
        setValidationError('Please specify the recipient bank account or mobile money channel.');
        return false;
      }
    }

    return true;
  };

  const handleStepChange = (nextStep: number) => {
    if (nextStep > currentStep) {
      if (!validateCurrentStep()) return;
    }
    setCurrentStep(nextStep);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const primaryPhone = phones.find((p) => p.isPrimary)?.number || phones[0]?.number || '';
      const primaryBank = banks.find((b) => b.isPrimary) || banks[0];

      const payload: RecordPaymentPayload = {
        paymentMethod,
        paymentReference: paymentReference.trim(),
        amount: parseFloat(amount),
        currency: 'TZS',
        paymentDate,
        payeeName: payeeName.trim(),
        payeePhone: primaryPhone,
        bankName: primaryBank.bankName,
        bankAccountNumber: primaryBank.accountNumber,
        notes: notes.trim()
          ? `${notes.trim()}\n[Disbursed from ${sourceAccount}]`
          : `Disbursed from ${sourceAccount} with ${documents.length} attached proof documents.`,
      };

      await recordPaymentTransaction(selectedRequestId, payload, {
        id: user?.id || 'officer',
        name: profile?.display_name || user?.email || 'Finance Officer',
      });

      showToast({
        title: 'Payment Disbursed',
        message: `Voucher ${paymentReference} for TZS ${parseFloat(amount).toLocaleString()} successfully processed.`,
        type: 'success',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/finance');
      }
    } catch (err: any) {
      setValidationError(err.message || 'Failed to record payment disbursement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/finance');
    }
  };

  return (
    <FullPageStepper
      title="Record Payment Disbursement"
      subtitle="Full-page stepper for voucher generation, fund disbursement, multi-bank recipient settlement, and proof documentation."
      steps={STEPS}
      currentStep={currentStep}
      onStepChange={handleStepChange}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitLabel="Confirm & Execute Disbursement"
      isSubmitting={isSubmitting}
    >
      {validationError && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{validationError}</span>
        </div>
      )}

      {/* ── STEP 1: TARGET & VOUCHER ──────────────────────────────────────── */}
      {currentStep === 0 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#374151]" />
              Select Requisition to Settle
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Authorized Requisition *
              </label>
              <Select
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
              >
                {requisitions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.requestNumber} — {r.title} (Balance: TZS {(r.approvedAmount ?? r.totalAmount - (r.paidAmount || 0)).toLocaleString()})
                  </option>
                ))}
              </Select>
            </div>

            {activeRequest && (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Requester</span>
                  <span className="font-semibold text-slate-900">{activeRequest.requesterName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Approved</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    TZS {authorized.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Already Paid</span>
                  <span className="font-semibold text-slate-600 font-mono">
                    TZS {(activeRequest.paidAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Remaining Due</span>
                  <span className="font-semibold text-amber-600 font-mono">
                    TZS {remaining.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#374151]" />
              Payment Voucher & Audit Reference
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Payment Voucher (PV) Number *"
                placeholder="e.g. PV-2026-1049"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                required
              />

              <DatePicker
                label="Disbursement Date *"
                value={paymentDate}
                onChange={(val) => setPaymentDate(val)}
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: AMOUNT & CHANNEL ──────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#374151]" />
              Disbursement Amount & Source Funding
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Disbursement Amount (TZS) *"
                  type="number"
                  min="1"
                  placeholder="e.g. 500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                {remaining > 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Max authorized balance: TZS {remaining.toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Payment Disbursement Method *
                </label>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  options={[
                    { value: 'bank_transfer', label: 'Bank Electronic Funds Transfer (EFT / TISS)' },
                    { value: 'cheque', label: 'Institutional Cheque' },
                    { value: 'mobile_money', label: 'Mobile Money (M-Pesa / Tigo Pesa)' },
                    { value: 'cash', label: 'Petty Cash Voucher' },
                  ]}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Source Bank / Organizational Account
                </label>
                <Select
                  value={sourceAccount}
                  onChange={(e) => setSourceAccount(e.target.value)}
                  options={[
                    { value: 'CRDB Main Operations A/C (0150...)', label: 'CRDB Bank — Main Operations Account (TZS)' },
                    { value: 'CRDB USD Grant A/C (0250...)', label: 'CRDB Bank — Donor Grants Account (USD)' },
                    { value: 'NMB Program Activity A/C (2110...)', label: 'NMB Bank — Youth Programs Account (TZS)' },
                    { value: 'Petty Cash Vault (HQ)', label: 'Petty Cash Vault — HQ Office' },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: PAYEE SETTLEMENT & MULTI-BANK ─────────────────────────── */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#374151]" />
              Payee Recipient Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Payee / Recipient Full Name *"
                  placeholder="e.g. John Doe / Vendor Name"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#374151]" />
              Payee Contact Numbers
            </h3>
            <MultiPhoneInput
              phones={phones}
              onChange={setPhones}
              required
            />
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#374151]" />
              Recipient Bank Accounts / Mobile Money (Multi-Bank)
            </h3>
            <p className="text-xs text-slate-500">
              Confirm or select the target recipient bank account. You can register multiple accounts and pick the active one.
            </p>
            <MultiBankDetailsInput
              banks={banks}
              onChange={setBanks}
              required
            />
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <Textarea
              label="Audit & Verification Notes"
              placeholder="Internal disbursement notes, reference codes, or memo instructions..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── STEP 4: SUPPORTING PROOF (CUSTOM RENAMABLE) ──────────────────── */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileStack className="w-4 h-4 text-[#374151]" />
                Proof of Payment Documentation (Optional)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload stamped bank transfer confirmation slips, cheque photocopies, or signed payment vouchers. You can customize the document title for each file.
              </p>
            </div>

            <DocumentUploadSection
              documents={documents}
              onChange={setDocuments}
              title="Upload Disbursement Proof"
              hint="PDF, PNG, JPG, or Excel up to 25MB each. User can rename each document."
            />
          </div>
        </div>
      )}

      {/* ── STEP 5: REVIEW & DISBURSE ────────────────────────────────────── */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Requisition & Voucher
              </span>
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="text-xs font-semibold text-[#D68904] hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Voucher Reference</span>
                <span className="font-semibold text-slate-900 font-mono">{paymentReference}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Payment Date</span>
                <span className="font-semibold text-slate-900">{paymentDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Requisition</span>
                <span className="font-semibold text-slate-900">{activeRequest?.requestNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Requester</span>
                <span className="font-semibold text-slate-900">{activeRequest?.requesterName}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Amount & Source Account
              </span>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-semibold text-[#D68904] hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Disbursed Amount</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  TZS {parseFloat(amount).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Method</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {paymentMethod.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Source Account</span>
                <span className="font-semibold text-slate-900">{sourceAccount}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Recipient Settlement
              </span>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs font-semibold text-[#D68904] hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="font-semibold text-slate-900">{payeeName}</div>
              <div className="text-slate-500">
                Phone: {phones.map((p) => p.number).filter(Boolean).join(', ')}
              </div>
              {banks.map((b) => (
                <div key={b.id} className="p-2 rounded bg-slate-50 text-slate-800 flex justify-between">
                  <span>{b.bankName} — A/C {b.accountNumber} ({b.accountName})</span>
                  {b.isPrimary && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                      Settlement Target
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                4. Proof Documentation ({documents.length} attached)
              </span>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs font-semibold text-[#D68904] hover:underline"
              >
                Edit
              </button>
            </div>
            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No proof documents attached.</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between p-2 rounded bg-slate-50">
                    <div className="flex items-center gap-2">
                      <FileStack className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-800">{d.customName}</span>
                      <span className="text-slate-400">({d.file.name})</span>
                    </div>
                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 uppercase">
                      {d.tag}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </FullPageStepper>
  );
};
