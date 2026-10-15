/**
 * Record Payment Disbursement Modal
 * Babawatoto Organization Management System (BAOMS)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FinancialRequestRecord, PaymentMethod, RecordPaymentPayload } from '../types/finance';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: FinancialRequestRecord | null;
  onSubmitPayment: (payload: RecordPaymentPayload) => Promise<void>;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  request,
  onSubmitPayment,
}) => {
  const { t } = useTranslation();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [payeeName, setPayeeName] = useState('');
  const [payeeContact, setPayeeContact] = useState('');
  const [bankName, setBankName] = useState('CRDB Bank Plc');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (request) {
      const authorized = request.approvedAmount ?? request.totalAmount;
      const remaining = Math.max(0, authorized - request.paidAmount);
      setAmount(String(remaining));
      setPaymentReference('');
      setPayeeName(request.requesterName);
      setPayeeContact('');
      setNotes('');
      setError(null);
    }
  }, [request]);

  if (!request) return null;

  const authorized = request.approvedAmount ?? request.totalAmount;
  const remaining = Math.max(0, authorized - request.paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!paymentReference.trim()) {
      setError(t('finance.errors.referenceRequired', 'A unique payment reference or voucher number is required.'));
      return;
    }

    if (!payeeName.trim()) {
      setError(t('finance.errors.payeeRequired', 'Payee name is required.'));
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(t('finance.errors.invalidAmount', 'Disbursement amount must be greater than zero.'));
      return;
    }

    if (parsedAmount > remaining) {
      setError(
        t(
          'finance.errors.amountExceedsBalance',
          'Payment amount cannot exceed the remaining outstanding approved balance.'
        )
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitPayment({
        paymentMethod,
        paymentReference: paymentReference.trim(),
        amount: parsedAmount,
        paymentDate,
        payeeName: payeeName.trim(),
        payeeContact: payeeContact.trim() || undefined,
        bankName: paymentMethod === 'bank_transfer' ? bankName.trim() : undefined,
        bankAccountNumber: paymentMethod === 'bank_transfer' ? bankAccountNumber.trim() : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record payment disbursement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('finance.recordPayment', 'Record Payment Disbursement')} — ${request.requestNumber}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-md bg-crimson-50 border border-crimson-200 p-3 text-sm text-crimson-900">
            <AlertCircle className="h-5 w-5 text-crimson-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Commitment & Balance Breakdown */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg border border-surface-border bg-surface-muted/30 text-xs">
          <div>
            <span className="text-charcoal-muted block">{t('finance.authorizedAmount', 'Authorized')}:</span>
            <span className="text-sm font-bold text-charcoal">
              {authorized.toLocaleString()} TZS
            </span>
          </div>
          <div>
            <span className="text-charcoal-muted block">{t('finance.alreadyPaid', 'Already Disbursed')}:</span>
            <span className="text-sm font-bold text-forest-700">
              {request.paidAmount.toLocaleString()} TZS
            </span>
          </div>
          <div>
            <span className="text-charcoal-muted block">{t('finance.remainingBalance', 'Remaining Balance')}:</span>
            <span className="text-sm font-bold text-amber-700">
              {remaining.toLocaleString()} TZS
            </span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
              {t('finance.paymentMethod', 'Disbursement Channel')} *
            </label>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              required
            >
              <option value="bank_transfer">{t('finance.methods.bank_transfer', 'Bank Transfer (EFT/TISS)')}</option>
              <option value="mobile_money">{t('finance.methods.mobile_money', 'Mobile Money (M-Pesa / Tigo / Airtel)')}</option>
              <option value="cash">{t('finance.methods.cash', 'Petty Cash Voucher')}</option>
              <option value="cheque">{t('finance.methods.cheque', 'Bank Cheque')}</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
              {t('finance.referenceNumber', 'Transaction / Voucher Reference')} *
            </label>
            <Input
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g. CRDB-FT261099, MPESA-QW1289"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
              {t('finance.disbursementAmount', 'Disbursement Amount (TZS)')} *
            </label>
            <Input
              type="number"
              step="any"
              min="1"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
              {t('finance.disbursementDate', 'Payment Date')} *
            </label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
              {t('finance.payeeName', 'Beneficiary / Payee Name')} *
            </label>
            <Input
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              placeholder="Full name or company name"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
              {t('finance.payeeContact', 'Payee Phone / Contact')}
            </label>
            <Input
              value={payeeContact}
              onChange={(e) => setPayeeContact(e.target.value)}
              placeholder="+255 754 000 000"
            />
          </div>
        </div>

        {paymentMethod === 'bank_transfer' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-lg border border-surface-border bg-white">
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
                {t('finance.bankName', 'Bank Name')}
              </label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. CRDB Bank, NMB Bank, NBC"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
                {t('finance.bankAccount', 'Account Number')}
              </label>
              <Input
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="0150..."
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
            {t('finance.paymentNotes', 'Disbursement Notes & Voucher Details')}
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record payment details, partial payment stage, or voucher number..."
            rows={2}
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {t('finance.confirmPayment', 'Confirm Disbursement')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
