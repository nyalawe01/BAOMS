/**
 * Create Financial Request Modal
 * Babawatoto Organization Management System (BAOMS)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, AlertCircle, FileText, UploadCloud, Paperclip, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  CreateFinancialRequestPayload,
  FinancialRequestType,
  FinancialRequestPriority,
  BudgetRecord,
} from '../types/finance';
import { getBudgets } from '../services/financeService';

interface CreateFinancialRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateFinancialRequestPayload) => Promise<void>;
  defaultProjectId?: string;
}

interface LineItemDraft {
  description: string;
  quantity: string;
  unitCost: string;
  budgetCategory: string;
}

export const CreateFinancialRequestModal: React.FC<CreateFinancialRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultProjectId,
}) => {
  const { t } = useTranslation();

  const [requestType, setRequestType] = useState<FinancialRequestType | 'other'>('activity_expense');
  const [customRequestType, setCustomRequestType] = useState('');
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [budgetId, setBudgetId] = useState<string>('');
  const [priority, setPriority] = useState<FinancialRequestPriority>('normal');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [lines, setLines] = useState<LineItemDraft[]>([
    { description: '', quantity: '1', unitCost: '', budgetCategory: 'General' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setProofFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeProofFile = (index: number) => {
    setProofFiles((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (isOpen) {
      getBudgets({ status: 'active' }).then((list) => {
        setBudgets(list);
        if (list.length > 0 && !budgetId && list[0]) {
          setBudgetId(list[0].id);
        }
      });
    }
  }, [isOpen, budgetId]);

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      { description: '', quantity: '1', unitCost: '', budgetCategory: 'General' },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (
    index: number,
    field: keyof LineItemDraft,
    val: string
  ) => {
    setLines((prev) => {
      const next = [...prev];
      const item = next[index];
      if (item) {
        next[index] = { ...item, [field]: val };
      }
      return next;
    });
  };

  const calculateTotal = () => {
    return lines.reduce((sum, line) => {
      const qty = parseFloat(line.quantity) || 0;
      const unit = parseFloat(line.unitCost) || 0;
      return sum + qty * unit;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError(t('finance.errors.titleRequired', 'Requisition title is required.'));
      return;
    }

    if (!purpose.trim()) {
      setError(t('finance.errors.purposeRequired', 'Business purpose and justification is required.'));
      return;
    }

    if (requestType === 'other' && !customRequestType.trim()) {
      setError(t('finance.errors.customTypeRequired', 'Please specify the custom requisition category / type.'));
      return;
    }

    const validLines = lines.map((l) => ({
      description: l.description.trim(),
      quantity: parseFloat(l.quantity) || 0,
      unitCost: parseFloat(l.unitCost) || 0,
      budgetCategory: l.budgetCategory.trim() || undefined,
    }));

    if (validLines.some((l) => !l.description || l.quantity <= 0 || l.unitCost < 0)) {
      setError(t('finance.errors.invalidLines', 'All line items must have a valid description, quantity > 0, and unit cost.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedBudget = budgets.find((b) => b.id === budgetId);
      const proofDocsPayload = proofFiles.map((f) => ({
        name: f.name,
        fileSize: f.size,
        fileType: f.type || 'application/octet-stream',
        notes: 'Attached proof of expenditure or supporting quotation',
      }));

      const resolvedPurpose = requestType === 'other' && customRequestType.trim()
        ? `[Category: ${customRequestType.trim()}]\n\n${purpose.trim()}`
        : purpose.trim();

      await onSubmit({
        projectId: defaultProjectId || selectedBudget?.projectId || null,
        budgetId: budgetId || null,
        requestType: requestType === 'other' ? 'operational' : requestType,
        title: title.trim(),
        purpose: resolvedPurpose,
        priority,
        dueDate: dueDate || null,
        currency: 'TZS',
        lines: validLines,
        proofDocuments: proofDocsPayload.length > 0 ? proofDocsPayload : undefined,
      });

      // Reset form
      setTitle('');
      setPurpose('');
      setCustomRequestType('');
      setRequestType('activity_expense');
      setProofFiles([]);
      setLines([{ description: '', quantity: '1', unitCost: '', budgetCategory: 'General' }]);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit financial request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = calculateTotal();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('finance.createRequest', 'New Financial Requisition')}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-md bg-crimson-50 border border-crimson-200 p-3 text-sm text-crimson-900">
            <AlertCircle className="h-5 w-5 text-crimson-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Basic Requisition Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
              {t('finance.requestType', 'Requisition Type')} *
            </label>
            <Select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as FinancialRequestType | 'other')}
              required
            >
              <option value="activity_expense">{t('finance.types.activity_expense', 'Field Activity Expense')}</option>
              <option value="procurement">{t('finance.types.procurement', 'Procurement & Supplies')}</option>
              <option value="travel_per_diem">{t('finance.types.travel_per_diem', 'Travel, Transport & Per Diem')}</option>
              <option value="operational">{t('finance.types.operational', 'Office Operations & Utilities')}</option>
              <option value="petty_cash">{t('finance.types.petty_cash', 'Petty Cash Requisition')}</option>
              <option value="consultancy">{t('finance.types.consultancy', 'Consultancy & Honoraria')}</option>
              <option value="other">Other (Category not listed)...</option>
            </Select>
            {requestType === 'other' && (
              <div className="mt-2">
                <Input
                  label="Specify Custom Category *"
                  placeholder="e.g. Community Emergency Response"
                  value={customRequestType}
                  onChange={(e) => setCustomRequestType(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
              {t('finance.budgetAccount', 'Budget Line Account')} *
            </label>
            <Select
              value={budgetId}
              onChange={(e) => setBudgetId(e.target.value)}
              required
            >
              {budgets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name} ({b.allocatedAmount.toLocaleString()} {b.currency})
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
            {t('finance.requisitionTitle', 'Requisition Title')} *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Community Health Worker Training Workshop Refreshments"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
            {t('finance.businessPurpose', 'Business Purpose & Justification')} *
          </label>
          <Textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Describe the operational necessity and specific objectives of this expenditure..."
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
              {t('finance.priority', 'Priority Level')}
            </label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as FinancialRequestPriority)}
            >
              <option value="low">{t('common.priorityLow', 'Low')}</option>
              <option value="normal">{t('common.priorityNormal', 'Normal')}</option>
              <option value="urgent">{t('common.priorityUrgent', 'Urgent / High')}</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
              {t('finance.requiredByDate', 'Required By / Due Date')}
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="border border-surface-border rounded-lg p-4 bg-surface-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-charcoal flex items-center gap-2">
              <FileText className="h-4 w-4 text-forest-700" />
              <span>{t('finance.itemizedLines', 'Itemized Line Items')}</span>
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLine}
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('finance.addLine', 'Add Line')}</span>
            </Button>
          </div>

          <div className="space-y-2">
            {lines.map((line, idx) => {
              const qty = parseFloat(line.quantity) || 0;
              const unit = parseFloat(line.unitCost) || 0;
              const lineTotal = qty * unit;

              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded border border-surface-border"
                >
                  <div className="col-span-5">
                    <Input
                      value={line.description}
                      onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                      placeholder="Item description / specification"
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="any"
                      min="0.01"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="text-xs text-right"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={line.unitCost}
                      onChange={(e) => handleLineChange(idx, 'unitCost', e.target.value)}
                      placeholder="Unit (TZS)"
                      className="text-xs text-right"
                      required
                    />
                  </div>

                  <div className="col-span-2 text-right pr-2">
                    <span className="text-xs font-semibold text-charcoal">
                      {lineTotal.toLocaleString()} TZS
                    </span>
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      disabled={lines.length <= 1}
                      onClick={() => handleRemoveLine(idx)}
                      className="text-charcoal-muted hover:text-crimson-600 disabled:opacity-30 p-1"
                      title={t('common.remove', 'Remove')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Line Items Summary Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-surface-border">
            <span className="text-xs text-charcoal-muted">
              {t('finance.totalLinesCount', 'Total Lines')}: {lines.length}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                {t('finance.totalRequisitionAmount', 'Total Requisition Amount')}:
              </span>
              <span className="text-base font-bold text-forest-800">
                {totalAmount.toLocaleString()} TZS
              </span>
            </div>
          </div>
        </div>

        {/* Proof of Documents Upload (Optional / NOT a Must) */}
        <div className="border border-slate-200 dark:border-neutral-700 rounded-xl p-4 bg-slate-50/60 dark:bg-neutral-800/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-[#D68904]" />
                Proof of Documents <span className="text-[11px] font-normal text-slate-500">(Optional • NOT a must)</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                Attach scanned receipts, typed proforma quotes, vouchers, budgets, or presentations (PDF, Excel, Word, PPT, JPG, PNG).
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => proofInputRef.current?.click()}
              className="text-xs shrink-0 flex items-center gap-1.5 border-[#D68904]/40 text-[#D68904] hover:bg-amber-50 dark:hover:bg-amber-950/20"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Attach Proof File</span>
            </Button>
            <input
              ref={proofInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleProofFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt"
            />
          </div>

          {proofFiles.length === 0 ? (
            <div className="text-center py-3 border border-dashed border-slate-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900/50">
              <p className="text-xs text-slate-400 dark:text-neutral-500 italic">
                No proof documents attached. You can submit without documents, or upload PDF, Excel, Word, PPT, or Images.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {proofFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-[#D68904] shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-neutral-200 truncate max-w-[280px]">
                      {file.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-500 uppercase font-mono">
                      {file.name.split('.').pop() || 'FILE'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProofFile(idx)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {t('finance.submitRequisition', 'Submit Requisition')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
