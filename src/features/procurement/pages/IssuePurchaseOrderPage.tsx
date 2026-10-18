/**
 * IssuePurchaseOrderPage — Full-page stepper for issuing purchase orders
 * BAOMS | Babawatoto Organization Management System
 *
 * Steps:
 *   1. Order Details       — title, vendor selection, project, delivery date
 *   2. Line Items          — itemized procurement lines (add/remove rows)
 *   3. Supporting Documents — quotes, LPO approvals, delivery instructions
 *   4. Review & Submit     — full order summary
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  FileText,
  FileStack,
  CheckCircle2,
  Plus,
  Trash2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { FullPageStepper, FullPageStep } from '@/components/ui/FullPageStepper';
import { DocumentUploadSection, UploadedDocument, serializeDocuments } from '@/components/ui/DocumentUploadSection';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/ToastContext';
import { createPurchaseOrder, getVendors } from '../services/procurementService';
import { VendorRecord } from '../types/procurement';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderItemDraft {
  id: string;
  description: string;
  quantity: string;
  unitOfMeasure: string;
  unitPrice: string;
}

interface IssuePurchaseOrderPageProps {
  vendors?: VendorRecord[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ─── Steps ───────────────────────────────────────────────────────────────────

const STEPS: FullPageStep[] = [
  {
    id: 'details',
    title: 'Order Details',
    subtitle: 'Vendor, project & delivery information',
    icon: <ShoppingCart className="w-4 h-4" />,
  },
  {
    id: 'items',
    title: 'Line Items',
    subtitle: 'Itemized procurement list with quantities & prices',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: 'documents',
    title: 'Supporting Documents',
    subtitle: 'Quotations, LPOs, delivery notes (optional)',
    icon: <FileStack className="w-4 h-4" />,
  },
  {
    id: 'review',
    title: 'Review & Submit',
    subtitle: 'Confirm order before issuing',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function newItem(): OrderItemDraft {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: '',
    quantity: '1',
    unitOfMeasure: 'units',
    unitPrice: '',
  };
}

function calcTotal(items: OrderItemDraft[]) {
  return items.reduce((sum, it) => {
    return sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0);
  }, 0);
}

// ─── Component ───────────────────────────────────────────────────────────────

export const IssuePurchaseOrderPage: React.FC<IssuePurchaseOrderPageProps> = ({
  vendors: initialVendors,
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [vendorList, setVendorList] = useState<VendorRecord[]>(initialVendors || []);

  React.useEffect(() => {
    if (!initialVendors || initialVendors.length === 0) {
      getVendors().then((v) => {
        setVendorList(v);
        if (v.length > 0 && !vendorId) {
          setVendorId(v[0].id);
        }
      });
    }
  }, [initialVendors]);

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // ── Step 1: Order Details ────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [vendorId, setVendorId] = useState(initialVendors?.[0]?.id || '');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('');
  const [projectCode, setProjectCode] = useState('');

  // ── Step 2: Line Items ───────────────────────────────────────────────────
  const [items, setItems] = useState<OrderItemDraft[]>([newItem()]);

  // ── Step 3: Documents ────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  // ─── Per-item CRUD ────────────────────────────────────────────────────────
  const addItem = () => setItems((prev) => [...prev, newItem()]);
  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };
  const updateItem = (id: string, field: keyof OrderItemDraft, val: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  // ─── Validation ───────────────────────────────────────────────────────────
  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!title.trim()) return 'Purchase Order title is required.';
      if (!vendorId) return 'Please select an approved vendor.';
    }
    if (s === 1) {
      const invalid = items.some(
        (it) => !it.description.trim() || parseFloat(it.quantity) <= 0 || parseFloat(it.unitPrice) <= 0
      );
      if (invalid) return 'All line items must have a description, valid quantity, and unit price.';
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
      await createPurchaseOrder({
        vendorId,
        title: title.trim(),
        expectedDeliveryDate,
        currency: 'TZS',
        projectId: projectCode.trim() || undefined,
        items: items.map((it) => ({
          description: it.description.trim(),
          quantity: parseFloat(it.quantity),
          unitOfMeasure: it.unitOfMeasure || 'units',
          unitPrice: parseFloat(it.unitPrice),
        })),
        notes: notes.trim() || undefined,
        documents: serializeDocuments(documents),
      });

      showToast({
        title: 'Purchase Order Issued',
        message: `PO for ${vendorList.find((v) => v.id === vendorId)?.businessName || vendorId} submitted for approval.`,
        type: 'success',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/procurement');
      }
    } catch (err: unknown) {
      showToast({
        title: 'Failed to Issue PO',
        message: err instanceof Error ? err.message : 'Unknown error.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVendor = vendorList.find((v) => v.id === vendorId);
  const total = calcTotal(items);

  return (
    <FullPageStepper
      title="Issue Purchase Order"
      subtitle="Procurement & Supply Chain · Babawatoto"
      steps={STEPS}
      currentStep={step}
      onStepChange={handleStepChange}
      onSubmit={handleSubmit}
      onCancel={() => {
        if (onCancel) onCancel();
        else navigate('/procurement');
      }}
      submitLabel="Issue Purchase Order"
      isSubmitting={isSubmitting}
    >
      {validationError && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {validationError}
        </div>
      )}

      {/* ── STEP 0: Order Details ─────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4">
          <Input
            label="Purchase Order Title *"
            placeholder="e.g. Workshop Stationery & Art Supplies — BYA Q4 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Approved Vendor *
              </label>
              <Select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
              >
                {vendorList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.businessName} ({v.vendorCode})
                  </option>
                ))}
              </Select>
              {selectedVendor && (
                <p className="text-[10px] text-slate-400 mt-1">
                  {selectedVendor.contactPerson} · {selectedVendor.phone}
                </p>
              )}
            </div>

            <Input
              type="date"
              label="Expected Delivery Date *"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              required
            />

            <Input
              label="Project Code (Optional)"
              placeholder="e.g. PRJ-BYA-2026"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              helperText="Link this PO to a specific project budget line"
            />
          </div>

          <Textarea
            label="Delivery Notes & Instructions (Optional)"
            placeholder="Delivery contact, storage location, inspection requirements…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      )}

      {/* ── STEP 1: Line Items ────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Add all procurement line items. Each item needs a description, quantity, and unit price.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </Button>
          </div>

          {/* Column headers — desktop */}
          <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
            <span className="col-span-5">Description</span>
            <span className="col-span-2">Qty</span>
            <span className="col-span-2">UoM</span>
            <span className="col-span-2">Unit Price (TZS)</span>
            <span className="col-span-1" />
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 items-start bg-white border border-slate-200 rounded-xl p-2"
              >
                <div className="col-span-12 sm:col-span-5">
                  <Input
                    placeholder={`Item ${idx + 1} — specification / description`}
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    min="0.01"
                    step="any"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    placeholder="UoM"
                    value={item.unitOfMeasure}
                    onChange={(e) => updateItem(item.id, 'unitOfMeasure', e.target.value)}
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-1 flex items-center justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 1}
                    className="text-slate-300 hover:text-red-500 disabled:opacity-20 transition-colors p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Running total */}
          <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl">
            <span className="text-sm font-semibold">Total Purchase Order Value</span>
            <span className="text-lg font-bold">
              TZS {total.toLocaleString('en-TZ', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* ── STEP 2: Supporting Documents ─────────────────────────────────── */}
      {step === 2 && (
        <DocumentUploadSection
          documents={documents}
          onChange={setDocuments}
          title="Purchase Order Documents"
          hint="Attach supplier quotations, Local Purchase Order (LPO) forms, delivery schedules, or any other relevant documents. All uploads are optional."
        />
      )}

      {/* ── STEP 3: Review & Submit ───────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Order header */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#D68904]" />
              <h3 className="text-sm font-bold text-slate-800">Order Summary</h3>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">PO Title</span>
                <span className="font-bold text-slate-800">{title}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Vendor</span>
                <span className="font-semibold text-slate-800">{selectedVendor?.businessName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Expected Delivery</span>
                <span className="text-slate-800">{expectedDeliveryDate}</span>
              </div>
              {projectCode && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Project</span>
                  <Badge variant="info">{projectCode}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                {items.length} Line Item{items.length !== 1 ? 's' : ''}
              </span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="px-5 py-2 text-left font-semibold">Description</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="px-3 py-2 text-left font-semibold">UoM</th>
                  <th className="px-3 py-2 text-right font-semibold">Unit Price</th>
                  <th className="px-5 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((it) => {
                  const lineTotal = (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0);
                  return (
                    <tr key={it.id}>
                      <td className="px-5 py-2.5 text-slate-800 font-medium">{it.description}</td>
                      <td className="px-3 py-2.5 text-right text-slate-700">{it.quantity}</td>
                      <td className="px-3 py-2.5 text-slate-500">{it.unitOfMeasure}</td>
                      <td className="px-3 py-2.5 text-right text-slate-700">
                        {parseFloat(it.unitPrice).toLocaleString()}
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
                  <td colSpan={4} className="px-5 py-3 font-bold text-sm">Total PO Value (TZS)</td>
                  <td className="px-5 py-3 text-right font-bold text-base">
                    {total.toLocaleString('en-TZ', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {documents.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs">
              <span className="font-bold text-slate-700 block mb-2">
                Supporting Documents ({documents.length})
              </span>
              <ul className="space-y-1">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-2">
                    <Badge variant="default">{d.tag}</Badge>
                    <span className="text-slate-800">{d.customName}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-slate-500 italic">
            Submitting will create the purchase order in <strong>Pending Approval</strong> status.
            The Finance Officer / Executive Director will need to approve before the order is dispatched.
          </p>
        </div>
      )}
    </FullPageStepper>
  );
};
