/**
 * CreateFinancialRequestPage — Full-page stepper for issuing institutional financial requisitions
 * BAOMS | Babawatoto Organization Management System
 *
 * Steps:
 *   1. Requisition Scope    — Title, purpose, grant/project, priority, due date
 *   2. Itemized Lines       — Line items, quantities, unit prices, budget categories
 *   3. Payee & Settlement   — Payee name, multi-phone, multi-bank accounts
 *   4. Supporting Documents — Quotations, proformas, invoices (with custom rename)
 *   5. Review & Submit      — Budget verification summary
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  ListPlus,
  CreditCard,
  FileStack,
  CheckCircle2,
  Plus,
  Trash2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { FullPageStepper, FullPageStep } from '@/components/ui/FullPageStepper';
import { DocumentUploadSection, UploadedDocument } from '@/components/ui/DocumentUploadSection';
import { Button } from '@/components/ui/Button';
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
import { getBudgets, createFinancialRequest } from '../services/financeService';
import {
  BudgetRecord,
  FinancialRequestType,
  FinancialRequestPriority,
  CreateFinancialRequestPayload,
} from '../types/finance';

// ─── Steps Definition ────────────────────────────────────────────────────────

const STEPS: FullPageStep[] = [
  {
    id: 'scope',
    title: 'Requisition Scope',
    subtitle: 'Purpose, project allocation & timeframe',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: 'lines',
    title: 'Itemized Breakdown',
    subtitle: 'Line items, quantities & estimated costs',
    icon: <ListPlus className="w-4 h-4" />,
  },
  {
    id: 'payee',
    title: 'Payee & Banking',
    subtitle: 'Beneficiary contacts & settlement bank accounts',
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    id: 'documents',
    title: 'Supporting Documents',
    subtitle: 'Quotes, proformas, invoices (with custom names)',
    icon: <FileStack className="w-4 h-4" />,
  },
  {
    id: 'review',
    title: 'Review & Submit',
    subtitle: 'Budget check & multi-tier authorization submission',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
];

interface LineItemDraft {
  id: string;
  description: string;
  quantity: string;
  unitCost: string;
  budgetCategory: string;
}

interface CreateFinancialRequestPageProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultProjectId?: string;
}

export const CreateFinancialRequestPage: React.FC<CreateFinancialRequestPageProps> = ({
  onSuccess,
  onCancel,
  defaultProjectId,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, profile, roles } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Budgets
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);

  // Step 1: Scope
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [requestType, setRequestType] = useState<FinancialRequestType | 'other'>('activity_expense');
  const [customRequestType, setCustomRequestType] = useState('');
  const [budgetId, setBudgetId] = useState('');
  const [priority, setPriority] = useState<FinancialRequestPriority>('normal');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  // Step 2: Lines
  const [lines, setLines] = useState<LineItemDraft[]>([
    {
      id: 'line-1',
      description: '',
      quantity: '1',
      unitCost: '',
      budgetCategory: 'General Activity Expenditure',
    },
  ]);

  // Step 3: Payee & Multi-Banking
  const [payeeName, setPayeeName] = useState(profile?.display_name || user?.email || '');
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
      accountName: profile?.display_name || '',
      accountNumber: '',
      branch: 'Dar es Salaam',
      currency: 'TZS',
      isPrimary: true,
    },
  ]);

  // Step 4: Documents (custom renameable)
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  useEffect(() => {
    getBudgets({ status: 'active' }).then((list) => {
      setBudgets(list);
      if (list.length > 0 && !budgetId) {
        setBudgetId(list[0].id);
      }
    });
  }, [budgetId]);

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        description: '',
        quantity: '1',
        unitCost: '',
        budgetCategory: 'Operational Line Item',
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: keyof LineItemDraft, val: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: val } : l)));
  };

  const totalAmount = lines.reduce(
    (sum, l) => sum + (parseFloat(l.quantity) || 0) * (parseFloat(l.unitCost) || 0),
    0
  );

  // Validation
  const validateCurrentStep = (): boolean => {
    setValidationError(null);

    if (currentStep === 0) {
      if (!title.trim()) {
        setValidationError('Requisition title is required.');
        return false;
      }
      if (!purpose.trim()) {
        setValidationError('Business purpose and justification is required.');
        return false;
      }
      if (requestType === 'other' && !customRequestType.trim()) {
        setValidationError('Please specify the custom category.');
        return false;
      }
    }

    if (currentStep === 1) {
      const invalid = lines.some(
        (l) => !l.description.trim() || (parseFloat(l.quantity) || 0) <= 0 || (parseFloat(l.unitCost) || 0) <= 0
      );
      if (invalid) {
        setValidationError('All line items must have a valid description, quantity > 0, and unit cost > 0.');
        return false;
      }
    }

    if (currentStep === 2) {
      if (!payeeName.trim()) {
        setValidationError('Payee / Beneficiary full name is required.');
        return false;
      }
      const validPhone = phones.some((p) => p.number.trim().length >= 8);
      if (!validPhone) {
        setValidationError('At least one contact phone number is required.');
        return false;
      }
      const validBank = banks.some((b) => b.accountNumber.trim().length > 0);
      if (!validBank) {
        setValidationError('Please specify at least one bank account or settlement channel for fund disbursement.');
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
      const selectedBudget = budgets.find((b) => b.id === budgetId);
      const resolvedPurpose =
        requestType === 'other' && customRequestType.trim()
          ? `[Category: ${customRequestType.trim()}]\n\n${purpose.trim()}`
          : purpose.trim();

      const primaryPhone = phones.find((p) => p.isPrimary)?.number || phones[0]?.number || '';
      const primaryBank = banks.find((b) => b.isPrimary) || banks[0];

      // Package banking and multi-contact notes
      const settlementMetadata = {
        payeeName: payeeName.trim(),
        phones: phones.filter((p) => p.number.trim().length > 0),
        banks: banks.filter((b) => b.accountNumber.trim().length > 0),
        documents: documents.map((d) => ({
          id: d.id,
          name: d.file.name,
          customName: d.customName,
          tag: d.tag,
          size: d.file.size,
        })),
      };

      const finalPurpose = `${resolvedPurpose}\n\n[Settlement Details]:\nPayee: ${payeeName}\nPhone: ${primaryPhone}\nBank: ${primaryBank.bankName} - A/C ${primaryBank.accountNumber} (${primaryBank.accountName || payeeName})`;

      const payload: CreateFinancialRequestPayload = {
        projectId: defaultProjectId || selectedBudget?.projectId || null,
        budgetId: budgetId || null,
        requestType: requestType === 'other' ? 'operational' : requestType,
        title: title.trim(),
        purpose: finalPurpose,
        priority,
        dueDate: dueDate || null,
        currency: 'TZS',
        lines: lines.map((l) => ({
          description: l.description.trim(),
          quantity: parseFloat(l.quantity) || 1,
          unitCost: parseFloat(l.unitCost) || 0,
          budgetCategory: l.budgetCategory.trim(),
        })),
        proofDocuments: documents.map((d) => ({
          name: d.customName || d.file.name,
          fileSize: d.file.size,
          fileType: d.file.type || 'application/octet-stream',
          notes: `Uploaded as ${d.tag}: ${d.notes || d.customName}`,
        })),
      };

      await createFinancialRequest(payload, {
        id: user?.id || 'officer',
        name: profile?.display_name || user?.email || 'Finance Officer',
        role: roles[0] || 'staff',
      });

      showToast({
        title: 'Requisition Created',
        message: `Financial request for TZS ${totalAmount.toLocaleString()} submitted for review.`,
        type: 'success',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/finance');
      }
    } catch (err: any) {
      setValidationError(err.message || 'Failed to submit financial request.');
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
      title="Create Financial Requisition"
      subtitle="Full-page stepper for budget allocation, itemized costs, multi-channel payee settlement, and supporting documents."
      steps={STEPS}
      currentStep={currentStep}
      onStepChange={handleStepChange}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitLabel="Submit Requisition"
      isSubmitting={isSubmitting}
    >
      {validationError && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{validationError}</span>
        </div>
      )}

      {/* ── STEP 1: REQUISITION SCOPE ────────────────────────────────────── */}
      {currentStep === 0 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#374151]" />
              Requisition Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Requisition Title *"
                  placeholder="e.g. Community Health Outreach Workshop Supplies — Kigamboni"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Requisition Classification *
                </label>
                <Select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as FinancialRequestType | 'other')}
                  options={[
                    { value: 'activity_expense', label: 'Program / Project Activity Expense' },
                    { value: 'procurement', label: 'Procurement / Goods & Supplies' },
                    { value: 'travel_advance', label: 'Travel & Field Per Diem Advance' },
                    { value: 'operational', label: 'Operational & Office Overhead' },
                    { value: 'statutory_tax', label: 'Statutory / Tax Payment' },
                    { value: 'emergency', label: 'Urgent / Emergency Contingency' },
                    { value: 'other', label: 'Other Custom Purpose...' },
                  ]}
                />
              </div>

              {requestType === 'other' ? (
                <Input
                  label="Specify Custom Category *"
                  placeholder="e.g. Legal Retainer"
                  value={customRequestType}
                  onChange={(e) => setCustomRequestType(e.target.value)}
                  required
                />
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Chargeable Budget Line *
                  </label>
                  <Select
                    value={budgetId}
                    onChange={(e) => setBudgetId(e.target.value)}
                  >
                    {budgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} - {b.name} (Remaining: TZS {(b.allocatedAmount - b.spentAmount).toLocaleString()})
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Priority Urgency
                </label>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as FinancialRequestPriority)}
                  options={[
                    { value: 'low', label: 'Low (Scheduled routine disbursement)' },
                    { value: 'normal', label: 'Normal (Standard 5-day cycle)' },
                    { value: 'high', label: 'High (Expedited 48-hour requirement)' },
                    { value: 'urgent', label: 'Urgent / Critical Action (Immediate)' },
                  ]}
                />
              </div>

              <DatePicker
                label="Target Payment Due Date *"
                value={dueDate}
                onChange={(val) => setDueDate(val)}
                required
              />

              <div className="sm:col-span-2">
                <Textarea
                  label="Operational Purpose & Activity Justification *"
                  placeholder="Detail the objective, target beneficiaries, milestone alignment, and why this expenditure is required..."
                  rows={4}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: ITEMIZED BREAKDOWN ───────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-[#374151]" />
                  Itemized Cost Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Itemize every expenditure item, quantity, unit price, and category.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addLine}
                className="text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </Button>
            </div>

            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div
                  key={line.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      Line #{idx + 1}
                    </span>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <Input
                        label="Item Description *"
                        placeholder="e.g. Venue hire for 2 days"
                        value={line.description}
                        onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        label="Qty *"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                        required
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        label="Unit Cost (TZS) *"
                        type="number"
                        min="0"
                        placeholder="e.g. 150000"
                        value={line.unitCost}
                        onChange={(e) => updateLine(line.id, 'unitCost', e.target.value)}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Subtotal
                      </label>
                      <div className="h-9 px-3 flex items-center bg-white rounded-lg border border-slate-200 font-mono text-xs font-bold text-slate-900">
                        {((parseFloat(line.quantity) || 0) * (parseFloat(line.unitCost) || 0)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Footer Banner */}
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-[#D68904]/30 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Total Requisition Amount
              </span>
              <div className="text-lg font-bold text-slate-900 font-mono">
                TZS {totalAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: PAYEE & SETTLEMENT (MULTI-BANK) ──────────────────────── */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#374151]" />
              Beneficiary / Payee Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Payee / Recipient Full Name *"
                  placeholder="e.g. Staff member, facilitator, or enterprise name"
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
              Payee Contact Numbers (Multi-Phone)
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
              Settlement Bank Accounts / Mobile Money (Multi-Bank)
            </h3>
            <p className="text-xs text-slate-500">
              Enter one or more bank accounts or mobile payout numbers. Designate the primary account for this transfer.
            </p>
            <MultiBankDetailsInput
              banks={banks}
              onChange={setBanks}
              required
            />
          </div>
        </div>
      )}

      {/* ── STEP 4: SUPPORTING DOCUMENTS (CUSTOM RENAMABLE) ──────────────── */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileStack className="w-4 h-4 text-[#374151]" />
                Supporting Proof & Attachments (Optional)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Attach proforma invoices, quotations, travel manifests, or approved activity concept notes. You can give each document a custom title.
              </p>
            </div>

            <DocumentUploadSection
              documents={documents}
              onChange={setDocuments}
              title="Upload Requisition Files"
              hint="PDF, PNG, JPG, or Excel up to 25MB each. User can rename each document."
            />
          </div>
        </div>
      )}

      {/* ── STEP 5: REVIEW & SUBMIT ──────────────────────────────────────── */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Requisition Scope
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
                <span className="text-slate-400 block">Title</span>
                <span className="font-semibold text-slate-900">{title}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Category</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {requestType.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Priority</span>
                <span className="font-semibold text-slate-900 capitalize">{priority}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Target Due Date</span>
                <span className="font-semibold text-slate-900">{dueDate}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Line Items ({lines.length} items) · TZS {totalAmount.toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-semibold text-[#D68904] hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {lines.map((l) => (
                <div key={l.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-900">{l.description}</span>
                    <span className="text-slate-400 ml-2">
                      ({l.quantity} × TZS {parseFloat(l.unitCost).toLocaleString()})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    TZS {(parseFloat(l.quantity) * parseFloat(l.unitCost)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Payee & Settlement ({banks.length} bank accounts)
              </span>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs font-semibold text-[#D68904] hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-900">{payeeName}</div>
              <div className="text-slate-500">
                Phones: {phones.map((p) => p.number).filter(Boolean).join(', ')}
              </div>
              {banks.map((b) => (
                <div key={b.id} className="p-2 rounded bg-slate-50 text-slate-800 flex justify-between">
                  <span>{b.bankName} — A/C {b.accountNumber} ({b.accountName})</span>
                  {b.isPrimary && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                4. Supporting Documents ({documents.length} attached)
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
              <p className="text-xs text-slate-400 italic">No supporting documents attached.</p>
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
