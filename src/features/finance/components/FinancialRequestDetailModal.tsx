/**
 * Financial Request Detail Modal
 * Babawatoto Organization Management System (BAOMS)
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  CreditCard,
  Paperclip,
  AlertCircle,
  FileText,
  Download,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { FinancialRequestRecord } from '../types/finance';
import { useAuth } from '@/features/auth/useAuth';

interface FinancialRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: FinancialRequestRecord | null;
  onOpenReviewModal: () => void;
  onOpenPaymentModal: () => void;
}

export const FinancialRequestDetailModal: React.FC<FinancialRequestDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  onOpenReviewModal,
  onOpenPaymentModal,
}) => {
  const { t } = useTranslation();
  const { user, hasPermission, hasRole, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'lines' | 'timeline' | 'transactions'>('lines');

  if (!request) return null;

  const isSelf = user?.id === request.requesterId;
  const canReview =
    !isSelf &&
    (request.status === 'submitted' || request.status === 'under_review') &&
    (hasPermission('finance.approve') || hasRole('finance_officer') || isAdmin());

  const canDisburse =
    (request.status === 'approved' || request.status === 'partially_paid') &&
    (hasPermission('finance.disburse') || isAdmin());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <StatusIndicator status="paid" label={t('finance.status.paid', 'Paid in Full')} />;
      case 'partially_paid':
        return <StatusIndicator status="partially_paid" label={t('finance.status.partially_paid', 'Partially Paid')} />;
      case 'approved':
        return <StatusIndicator status="approved" label={t('finance.status.approved', 'Approved')} />;
      case 'under_review':
        return <StatusIndicator status="under_review" label={t('finance.status.under_review', 'Under Review')} />;
      case 'submitted':
        return <StatusIndicator status="submitted" label={t('finance.status.submitted', 'Submitted')} />;
      case 'returned':
        return <StatusIndicator status="returned" label={t('finance.status.returned', 'Returned for Correction')} />;
      case 'rejected':
        return <StatusIndicator status="rejected" label={t('finance.status.rejected', 'Rejected')} />;
      default:
        return <StatusIndicator status={status} label={status} />;
    }
  };

  const authorized = request.approvedAmount ?? request.totalAmount;
  const remaining = Math.max(0, authorized - request.paidAmount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${request.requestNumber} — ${request.title}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Summary Card */}
        <div className="rounded-lg border border-surface-border bg-surface-muted/30 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                {request.requestType.replace('_', ' ').toUpperCase()}
              </span>
              {getStatusBadge(request.status)}
              {request.priority === 'urgent' && (
                <Badge variant="danger" withDot>
                  {t('common.urgent', 'Urgent')}
                </Badge>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs text-charcoal-muted block">
                {t('finance.authorizedAmount', 'Authorized Amount')}:
              </span>
              <span className="text-lg font-bold text-forest-800">
                {authorized.toLocaleString()} {request.currency}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-3 border-t border-surface-border">
            <div>
              <span className="text-charcoal-muted block">{t('finance.requester', 'Requester')}:</span>
              <span className="font-semibold text-charcoal">{request.requesterName}</span>
            </div>

            <div>
              <span className="text-charcoal-muted block">{t('finance.budgetAccount', 'Budget Line')}:</span>
              <span className="font-semibold text-charcoal truncate block">
                {request.budgetName || 'Organizational Core'}
              </span>
            </div>

            <div>
              <span className="text-charcoal-muted block">{t('finance.alreadyPaid', 'Disbursed')}:</span>
              <span className="font-bold text-forest-700">
                {request.paidAmount.toLocaleString()} {request.currency}
              </span>
            </div>

            <div>
              <span className="text-charcoal-muted block">{t('finance.remainingBalance', 'Remaining Balance')}:</span>
              <span className="font-bold text-amber-700">
                {remaining.toLocaleString()} {request.currency}
              </span>
            </div>
          </div>

          {/* Return or Rejection reason notice */}
          {request.rejectionReason && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">
                  {request.status === 'returned'
                    ? t('finance.returnNotes', 'Notes for Correction')
                    : t('finance.rejectionReason', 'Rejection Reason')}
                  :
                </span>{' '}
                {request.rejectionReason}
              </div>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="border-b border-surface-border">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab('lines')}
              className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'lines'
                  ? 'border-forest-700 text-forest-800'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal'
              }`}
            >
              {t('finance.lineItems', 'Itemized Breakdown')} ({request.lines.length})
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'timeline'
                  ? 'border-forest-700 text-forest-800'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal'
              }`}
            >
              {t('finance.approvalTimeline', 'Approval Audit Trail')} ({request.events.length})
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'transactions'
                  ? 'border-forest-700 text-forest-800'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal'
              }`}
            >
              {t('finance.disbursementHistory', 'Disbursements')} ({request.transactions.length})
            </button>
          </nav>
        </div>

        {/* Tab 1: Line Items Breakdown */}
        {activeTab === 'lines' && (
          <div className="space-y-4">
            <div className="border border-surface-border rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted/50 border-b border-surface-border text-charcoal-muted">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">{t('finance.lineDescription', 'Description')}</th>
                    <th className="py-2.5 px-3 text-right">{t('finance.quantity', 'Qty')}</th>
                    <th className="py-2.5 px-3 text-right">{t('finance.unitCost', 'Unit Cost (TZS)')}</th>
                    <th className="py-2.5 px-3 text-right">{t('finance.totalCost', 'Total (TZS)')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-charcoal">
                  {request.lines.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-surface-muted/20">
                      <td className="py-2.5 px-3 text-charcoal-muted">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium">{line.description}</td>
                      <td className="py-2.5 px-3 text-right">{line.quantity}</td>
                      <td className="py-2.5 px-3 text-right">{line.unitCost.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">
                        {line.totalCost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-surface-muted/40 font-bold border-t border-surface-border text-charcoal">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-right">
                      {t('finance.totalRequested', 'Total Requested')}:
                    </td>
                    <td className="py-2.5 px-3 text-right text-forest-800">
                      {request.totalAmount.toLocaleString()} {request.currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Proof of Documents & Attached Evidence */}
            {((request.proofDocuments && request.proofDocuments.length > 0) || (request.documents && request.documents.length > 0)) ? (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-[#D68904]" />
                  <span>Verified Proof of Documents & Evidence ({(request.proofDocuments?.length || 0) + (request.documents?.length || 0)})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {request.proofDocuments?.map((proof) => (
                    <div
                      key={proof.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/60 shadow-2xs text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 flex items-center justify-center text-[#D68904] shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-900 dark:text-white truncate" title={proof.name}>
                            {proof.name}
                          </p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                            <span className="uppercase font-mono text-[9px] px-1 bg-slate-100 dark:bg-neutral-800 rounded">
                              {proof.name.split('.').pop() || 'DOC'}
                            </span>
                            <span>•</span>
                            <span>{(proof.fileSize / 1024).toFixed(0)} KB</span>
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-[#D68904] hover:bg-amber-50 dark:hover:bg-amber-950/20 p-1.5 h-auto"
                        onClick={() => alert(`Opening proof document: ${proof.name}`)}
                        title="View / Download Proof Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}

                  {request.documents?.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/60 shadow-2xs text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 flex items-center justify-center text-blue-600 shrink-0">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{doc.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">{doc.fileName}</p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-600 hover:bg-blue-50 p-1.5 h-auto"
                        onClick={() => alert(`Opening document: ${doc.fileName}`)}
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-neutral-800/40 rounded-lg border border-slate-200 dark:border-neutral-700 text-xs text-slate-500">
                <span>No proof documents attached to this requisition (proof upload is optional).</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Approval Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-4 py-2">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-border">
              {request.events.map((evt) => {
                const isApproved = evt.action === 'approved';
                const isReviewed = evt.action === 'reviewed';
                const isReturned = evt.action === 'returned';
                const isRejected = evt.action === 'rejected';

                return (
                  <div key={evt.id} className="relative">
                    <div
                      className={`absolute -left-[27px] top-0.5 h-4 w-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        isApproved
                          ? 'border-forest-600 text-forest-600'
                          : isReviewed
                          ? 'border-[#F2A507] text-[#F2A507]'
                          : isReturned
                          ? 'border-amber-500 text-amber-500'
                          : isRejected
                          ? 'border-crimson-600 text-crimson-600'
                          : 'border-charcoal-muted text-charcoal-muted'
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          isApproved
                            ? 'bg-forest-600'
                            : isReviewed
                            ? 'bg-[#F2A507]'
                            : isReturned
                            ? 'bg-amber-500'
                            : isRejected
                            ? 'bg-crimson-600'
                            : 'bg-charcoal-muted'
                        }`}
                      />
                    </div>

                    <div className="rounded-lg border border-surface-border bg-white p-3.5 space-y-1.5 text-xs shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-charcoal capitalize">
                          {evt.action.replace('_', ' ')} (Stage {evt.stepNumber})
                        </span>
                        <span className="text-2xs text-charcoal-muted">
                          {new Date(evt.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-2xs text-charcoal-muted flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        <span>
                          {evt.actorName} ({evt.actorRole.replace('_', ' ')})
                        </span>
                      </div>

                      {evt.comments && (
                        <p className="text-xs text-charcoal bg-surface-muted/30 p-2 rounded border border-surface-border/50 italic mt-1">
                          "{evt.comments}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Transactions / Disbursements */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {request.transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-charcoal-muted border border-dashed border-surface-border rounded-lg">
                <CreditCard className="h-8 w-8 text-charcoal-muted/40 mx-auto mb-2" />
                <p>{t('finance.noTransactionsRecorded', 'No payment disbursements have been recorded yet.')}</p>
              </div>
            ) : (
              <div className="border border-surface-border rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted/50 border-b border-surface-border text-charcoal-muted">
                    <tr>
                      <th className="py-2.5 px-3">{t('finance.voucherRef', 'Reference')}</th>
                      <th className="py-2.5 px-3">{t('finance.paymentMethod', 'Channel')}</th>
                      <th className="py-2.5 px-3">{t('finance.paymentDate', 'Date')}</th>
                      <th className="py-2.5 px-3">{t('finance.payee', 'Payee')}</th>
                      <th className="py-2.5 px-3 text-right">{t('finance.amount', 'Amount (TZS)')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-charcoal">
                    {request.transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-surface-muted/20">
                        <td className="py-2.5 px-3 font-semibold text-forest-700">
                          {txn.paymentReference}
                        </td>
                        <td className="py-2.5 px-3 capitalize">
                          {txn.paymentMethod.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3">{txn.paymentDate}</td>
                        <td className="py-2.5 px-3">{txn.payeeName}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-forest-800">
                          {txn.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-border">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.close', 'Close')}
          </Button>

          <div className="flex items-center gap-2">
            {canReview && (
              <Button type="button" variant="secondary" onClick={onOpenReviewModal}>
                {t('finance.reviewRequest', 'Review / Decide')}
              </Button>
            )}

            {canDisburse && (
              <Button type="button" variant="primary" onClick={onOpenPaymentModal}>
                <CreditCard className="h-4 w-4 mr-1.5" />
                <span>{t('finance.disburseFunds', 'Record Disbursement')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
