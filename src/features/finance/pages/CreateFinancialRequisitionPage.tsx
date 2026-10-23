/**
 * CreateFinancialRequisitionPage — Full-page stepper for financial requests
 * BAOMS | Babawatoto Organization Management System
 *
 * Steps:
 *   1. Requisition Details   — type, title, purpose, priority, due date
 *   2. Budget & Line Items   — budget line selection + itemized amounts
 *   3. Payee / Beneficiary   — who receives the funds (multi-contact for payee)
 *   4. Supporting Documents  — proof of expenditure, quotations, receipts
 *   5. Review & Submit       — full summary before submission
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  DollarSign,
  User2,
  FileStack,
  CheckCircle2,
  Plus,
  Trash2,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { FullPageStepper, FullPageStep } from '@/components/ui/FullPageStepper';
import { MultiContactFields, ContactEntry } from '@/components/ui/MultiContactFields';
import { DocumentUploadSection, UploadedDocument, serializeDocuments } from '@/components/ui/DocumentUploadSection';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/lib/ToastContext';
import {
  CreateFinancialRequestPayload,
  FinancialRequestType,
  FinancialRequestPriority,
  BudgetRecord,
} from '../types/finance';
import { getBudgets, createFinancialRequest } from '../services/financeService';

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS: FullPageStep[] = [
  {
    id: 'details',
    title: 'Requisition Details',
    subtitle: 'Type, title, purpose & priority',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: 'budget',
    title: 'Budget & Line Items',
    subtitle: 'Budget line + itemized cost breakdown',
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    id: 'payee',
    title: 'Payee / Beneficiary',
    subtitle: 'Who receives or benefits from the payment',
    icon: <User2 className="w-4 h-4" />,
  },
  {
    id: 'documents',
    title: 'Supporting Documents',
    subtitle: 'Proof of expenditure, quotes & receipts (optional)',
    icon: <FileStack className="w-4 h-4" />,
  },
  {
    id: 'review',
    title: 'Review & Submit',
    subtitle: 'Confirm before submitting for approval',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItemDraft {
  id: string;
  description: string;
  quantity: string;
  unitCost: string;
  budgetCategory: string;
}

interface CreateFinancialRequisitionPageProps {
  defaultProjectId?: string;
  onSuccess?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newLine(): LineItemDraft {
  return {
    id: `ln-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: '',
    quantity: '1',
    unitCost: '',
    budgetCategory: 'General',
  };
}

function newContactId() {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  activity_expense: 'Activity / Event Expense',
  operational: 'Operational Expenditure',
  procurement: 'Procurement Requisition',
  travel_subsistence: 'Travel & Subsistence Allowance',
  training: 'Training & Capacity Building',
  stipend: 'Staff Stipend / Honorarium',
  grant_disbursement: 'Grant / Project Disbursement',
  other: 'Other (specify below)',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const CreateFinancialRequisitionPage: React.FC<CreateFinancialRequisitionPageProps> = ({
  defaultProjectId,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // ── Step 1: Requisition Details ──────────────────────────────────────────
  const [requestType, setRequestType] = useState<FinancialRequestType | 'other'>('activity_expense');
  const [customRequestType, setCustomRequestType] = useState('');
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState<FinancialRequestPriority>('normal');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  // ── Step 2: Budget & Line Items ──────────────────────────────────────────
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [budgetId, setBudgetId] = useState('');
  const [lines, setLines] = useState<LineItemDraft[]>([newLine()]);

  // ── Step 3: Payee / Beneficiary ──────────────────────────────────────────
  const [payeeName, setPayeeName] = useState('');
  const [payeeType, setPayeeType] = useState<'staff' | 'vendor' | 'individual' | 'other'>('vendor');
  const [payeeContacts, setPayeeContacts] = useState<ContactEntry[]>([
    {
      id: newContactId(),
      type: 'bank_account',
      label: 'Payment Account',
      value: '',
      bankName: '',
      isPrimary: true,
    },
  ]);

  // ── Step 4: Documents ────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  // ─── Load budgets ─────────────────────────────────────────────────────────
  useEffect(() => {
    getBudgets({ status: 'active' }).then((list) => {
      setBudgets(list);
      if (list.length > 0 && !budgetId && list[0]) setBudgetId(list[0].id);
    });
  }, []);

  // ─── Line item CRUD ───────────────────────────────────────────────────────
  const addLine = () => setLines((prev) => [...prev, newLine()]);
  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };
  const updateLine = (id: string, field: keyof LineItemDraft, val: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: val } : l)));
  };

  const total = lines.reduce((sum, l) => {
    return sum + (parseFloat(l.quantity) || 0) * (parseFloat(l.unitCost) || 0);
  }, 0);

  // ─── Validation ───────────────────────────────────────────────────────────
  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!title.trim()) return 'Requisition title is required.';
      if (!purpose.trim()) return 'Business purpose and justification is required.';
      if (requestType === 'other' && !customRequestType.trim()) return 'Please specify the requisition category.';
    }
    if (s === 1) {
      const invalid = lines.some((l) => !l.description.trim() || parseFloat(l.quantity) <= 0 || parseFloat(l.unitCost) < 0);
      if (invalid) return 'All line items must have a description, valid quantity, and cost.';
    }
    if (s === 2) {
      if (!payeeName.trim()) return 'Payee / beneficiary name is required.';
    }
    return null;
  };

  const handleStepChange = (next: number) => {
    if (next > step) {
      const err = validateStep(step);
      if (err) { setValidationError(err); return; }
    }
    setValidationError(null);
    setStep(next);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validateStep(step);
    if (err) { setValidationError(err); return; }
    setValidationError(null);
    setIsSubmitting(true);

    try {
      const selectedBudget = budgets.find((b) => b.id === budgetId);
      const resolvedPurpose =
        requestType === 'other' && customRequestType.trim()
          ? `[Category: ${customRequestType.trim()}]\n\n${purpose.trim()}`
          : purpose.trim();

      const proofDocsPayload = serializeDocuments(documents);

      await createFinancialRequest({
        projectId: defaultProjectId || selectedBudget?.projectId || null,
        budgetId: budgetId || null,
        requestType: requestType === 'other' ? 'operational' : requestType,
        title: title.trim(),
        purpose: resolvedPurpose,
        priority,
        dueDate: dueDate || null,
        currency: 'TZS',
        lines: lines.map((l) => ({
          description: l.description.trim(),
          quantity: parseFloat(l.quantity) || 1,
          unitCost: parseFloat(l.unitCost) || 0,
          budgetCategory: l.budgetCategory || undefined,
        })),
        proofDocuments: proofDocsPayload.length > 0 ? proofDocsPayload : undefined,
        payee: {
          name: payeeName.trim(),
          type: payeeType,
          contacts: payeeContacts,
        },
      });

      showToast({
        title: '✅ Requisition Submitted',
        message: `"${title.trim()}" has been submitted for approval.`,
        variant: 'success',
      });

      if (onSuccess) onSuccess();
      else navigate('/finance');
    } catch (err: unknown) {
      showToast({
        title: 'Submission Failed',
        message: err instanceof Error ? err.message : 'Could not submit requisition.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FullPageStepper
      title="New Financial Requisition"
      subtitle="Finance & Operations · Babawatoto"
      steps={STEPS}
      currentStep={step}
      onStepChange={handleStepChange}
      onSubmit={handleSubmit}
      onCancel={() => (onSuccess ? onSuccess() : navigate('/finance'))}
      submitLabel="Submit Requisition"
      isSubmitting={isSubmitting}
    >
      {validationError && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {validationError}
        </div>
      )}

      {/* ── STEP 0: Requisition Details ──────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requisition Type *
              </label>
              <Select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as FinancialRequestType | 'other')}
              >
                {Object.entries(REQUEST_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </div>

            {requestType === 'other' && (
              <Input
                label="Specify Category *"
                placeholder="e.g. Community Sensitization, Rent Subsidy"
                value={customRequestType}
                onChange={(e) => setCustomRequestType(e.target.value)}
              />
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority Level
              </label>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as FinancialRequestPriority)}
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent / Emergency</option>
              </Select>
            </div>

            <DatePicker
              label="Payment Due Date"
              value={dueDate}
              onChange={(val) => setDueDate(val)}
              helperText="When the payment or reimbursement is needed"
            />
          </div>

          <Input
            label="Requisition Title *"
            placeholder="e.g. BYA Q4 Workshop — Stationery & Catering Expenses"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Textarea
            label="Business Purpose & Justification *"
            placeholder="Describe what this expense covers, how it relates to organizational objectives, and any budget line it draws from…"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={4}
            required
          />
        </div>
      )}

      {/* ── STEP 1: Budget & Line Items ───────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          {budgets.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Budget / Funding Line
              </label>
              <Select
                value={budgetId}
                onChange={(e) => setBudgetId(e.target.value)}
              >
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.currency} {b.totalAmount.toLocaleString()})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Cost Breakdown — Line Items
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLine}
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Line
            </Button>
          </div>

          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
            <span className="col-span-5">Description</span>
            <span className="col-span-2">Qty</span>
            <span className="col-span-2">Unit Cost (TZS)</span>
            <span className="col-span-2">Budget Category</span>
            <span className="col-span-1" />
          </div>

          <div className="space-y-2">
            {lines.map((line) => (
              <div
                key={line.id}
                className="grid grid-cols-12 gap-2 items-start bg-white border border-slate-200 rounded-xl p-2"
              >
                <div className="col-span-12 sm:col-span-5">
                  <Input
                    placeholder="Item / service description"
                    value={line.description}
                    onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="Qty"
                    value={line.quantity}
                    onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={line.unitCost}
                    onChange={(e) => updateLine(line.id, 'unitCost', e.target.value)}
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <Input
                    placeholder="Category"
                    value={line.budgetCategory}
                    onChange={(e) => updateLine(line.id, 'budgetCategory', e.target.value)}
                  />
                </div>
                <div className="col-span-1 flex items-center justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length <= 1}
                    className="text-slate-300 hover:text-red-500 disabled:opacity-20 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl">
            <span className="text-sm font-semibold">Total Requested Amount (TZS)</span>
            <span className="text-lg font-bold">
              {total.toLocaleString('en-TZ', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* ── STEP 2: Payee / Beneficiary ──────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2">
            <User2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <span>
              Identify who will receive these funds. Add their bank account(s) for payment processing.
              For staff reimbursements, use their official staff profile details.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Payee / Beneficiary Full Name *"
              placeholder="e.g. Dar Office Essentials Ltd, John M. Mbwana"
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payee Type
              </label>
              <Select
                value={payeeType}
                onChange={(e) => setPayeeType(e.target.value as typeof payeeType)}
              >
                <option value="vendor">Registered Vendor / Supplier</option>
                <option value="staff">Staff Member (Reimbursement)</option>
                <option value="individual">Individual / Beneficiary</option>
                <option value="other">Other (NGO, Government, etc.)</option>
              </Select>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 pt-2">
            Payee Bank Accounts & Contacts
          </h3>
          <MultiContactFields
            contacts={payeeContacts}
            onChange={setPayeeContacts}
            allowedTypes={['bank_account', 'phone', 'email']}
          />
        </div>
      )}

      {/* ── STEP 3: Supporting Documents ─────────────────────────────────── */}
      {step === 3 && (
        <DocumentUploadSection
          documents={documents}
          onChange={setDocuments}
          title="Proof of Expenditure & Supporting Documents"
          hint="Upload quotations, invoices, receipts, LPO forms, or any other documents supporting this financial request. All uploads are optional but strongly recommended for auditing."
        />
      )}

      {/* ── STEP 4: Review & Submit ───────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#D68904]" />
              <h3 className="text-sm font-bold text-slate-800">Requisition Summary</h3>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Title</span>
                <span className="font-bold text-slate-800">{title}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Type</span>
                <Badge variant="info">
                  {requestType === 'other' ? customRequestType : REQUEST_TYPE_LABELS[requestType]}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Priority</span>
                <Badge variant={priority === 'urgent' ? 'destructive' : priority === 'high' ? 'warning' : 'default'}>
                  {priority}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Payee</span>
                <span className="font-semibold text-slate-800">{payeeName} ({payeeType})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Due Date</span>
                <span className="text-slate-800">{dueDate || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Documents</span>
                <span className="text-slate-800">{documents.length} file(s)</span>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700">{lines.length} Line Item(s)</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="px-5 py-2 text-left font-semibold">Description</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold">Unit Cost</th>
                  <th className="px-5 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lines.map((l) => {
                  const lineTotal = (parseFloat(l.quantity) || 0) * (parseFloat(l.unitCost) || 0);
                  return (
                    <tr key={l.id}>
                      <td className="px-5 py-2.5 text-slate-800 font-medium">{l.description}</td>
                      <td className="px-3 py-2.5 text-right text-slate-700">{l.quantity}</td>
                      <td className="px-3 py-2.5 text-right text-slate-700">
                        {parseFloat(l.unitCost || '0').toLocaleString()}
                      </td>
                      <td className="px-5 py-2.5 text-right font-semibold text-slate-900">
                        {lineTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-900 text-white">
                  <td colSpan={3} className="px-5 py-3 font-bold text-sm">Total Amount (TZS)</td>
                  <td className="px-5 py-3 text-right font-bold text-base">
                    {total.toLocaleString('en-TZ', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="text-xs text-slate-500 italic">
            Submitting will create this requisition with status <strong>Pending Finance Review</strong>.
            The Finance Officer will process and forward for Executive Director authorization.
          </p>
        </div>
      )}
    </FullPageStepper>
  );
};
