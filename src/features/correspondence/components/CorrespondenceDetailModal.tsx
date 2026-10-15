import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CorrespondenceRecord } from '../types/correspondence';
import { archiveCorrespondence } from '../services/correspondenceService';
import { confirmAction, showSuccess, showError } from '@/lib/sweetAlert';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import {
  X,
  Mail,
  Calendar,
  Shield,
  Building,
  User,
  Archive,
  FileText,
} from 'lucide-react';

interface CorrespondenceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CorrespondenceRecord | null;
  onUpdated?: (updated: CorrespondenceRecord) => void;
}

export const CorrespondenceDetailModal: React.FC<CorrespondenceDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onUpdated,
}) => {
  const { t } = useTranslation();
  const [isArchiving, setIsArchiving] = useState(false);

  if (!isOpen || !item) return null;

  const handleArchive = async () => {
    const confirmed = await confirmAction({
      title: t('correspondence.confirmArchiveTitle', 'Archive Correspondence'),
      text: t('correspondence.confirmArchive', 'Are you sure you want to archive this correspondence record?'),
      confirmButtonText: t('correspondence.archiveConfirmBtn', 'Yes, Archive Record'),
      isDangerous: true,
      icon: 'warning',
    });
    if (!confirmed) return;

    setIsArchiving(true);
    try {
      const updated = await archiveCorrespondence(item.id);
      await showSuccess(t('correspondence.archiveSuccess', 'Correspondence archived successfully.'));
      if (onUpdated) onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      await showError(t('common.error', 'Error'), (err as Error).message || 'Failed to archive record.');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-surface-card rounded-xl border border-surface-border shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-forest-800">
                  {item.referenceNumber}
                </span>
                <StatusIndicator status={item.status} label={item.status.toUpperCase()} />
                <span className="text-xs font-semibold text-charcoal-600 uppercase">
                  {item.direction}
                </span>
              </div>
              <h2 className="text-base font-bold text-charcoal-900 mt-1 line-clamp-1">
                {item.subject}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-charcoal-muted hover:text-charcoal-800 hover:bg-surface-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Sender & Recipient Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-surface-border bg-surface-muted/20 space-y-1">
              <span className="text-xs font-semibold text-charcoal-500 uppercase flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-charcoal-400" />
                {t('correspondence.sender', 'Sender / Origin')}
              </span>
              <div className="text-sm font-bold text-charcoal-900">{item.sender}</div>
            </div>

            <div className="p-4 rounded-xl border border-surface-border bg-surface-muted/20 space-y-1">
              <span className="text-xs font-semibold text-charcoal-500 uppercase flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-charcoal-400" />
                {t('correspondence.recipient', 'Recipient / Attention')}
              </span>
              <div className="text-sm font-bold text-charcoal-900">{item.recipient}</div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-surface-border bg-surface-card">
            <div>
              <span className="text-xs font-semibold text-charcoal-500 uppercase block">
                {t('correspondence.date', 'Date')}
              </span>
              <div className="text-sm font-medium text-charcoal-900 flex items-center gap-1 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-charcoal-400" />
                {item.correspondenceDate}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-charcoal-500 uppercase block">
                {t('correspondence.category', 'Category')}
              </span>
              <div className="text-sm font-semibold text-charcoal-800 capitalize mt-0.5">
                {item.category}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-charcoal-500 uppercase block">
                {t('correspondence.confidentiality', 'Security')}
              </span>
              <div className="text-sm font-semibold text-charcoal-800 capitalize mt-0.5 flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-charcoal-400" />
                {item.confidentialityLevel}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-charcoal-500 uppercase block">
                {t('correspondence.registeredBy', 'Registered By')}
              </span>
              <div className="text-xs font-medium text-charcoal-700 mt-0.5 truncate">
                {item.registeredByName || 'Staff Member'}
              </div>
            </div>
          </div>

          {/* Subject & Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
              {t('correspondence.detailsSubject', 'Subject & Operational Context')}
            </h4>
            <div className="p-4 rounded-xl border border-surface-border bg-surface-muted/10 text-sm text-charcoal-800 leading-relaxed font-medium">
              {item.subject}
            </div>
            {item.notes && (
              <p className="text-xs text-charcoal-muted leading-relaxed px-1">
                {item.notes}
              </p>
            )}
          </div>

          {/* Linked Document & Project */}
          {(item.documentTitle || item.projectName) && (
            <div className="p-4 rounded-xl border border-surface-border bg-surface-muted/20 space-y-2">
              <h4 className="text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                {t('correspondence.associatedRecords', 'Associated Institutional Records')}
              </h4>
              <div className="flex flex-wrap gap-3">
                {item.documentTitle && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-forest-800 bg-surface-card px-3 py-1.5 rounded-lg border border-surface-border">
                    <FileText className="h-3.5 w-3.5 text-forest-700" />
                    <span>{item.documentTitle}</span>
                  </div>
                )}
                {item.projectName && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-charcoal-800 bg-surface-card px-3 py-1.5 rounded-lg border border-surface-border">
                    <Building className="h-3.5 w-3.5 text-charcoal-500" />
                    <span>{item.projectName}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border bg-surface-muted/20">
          <div>
            {item.status !== 'archived' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleArchive}
                isLoading={isArchiving}
              >
                <Archive className="h-4 w-4 mr-1.5 text-charcoal-500" />
                {t('correspondence.archiveRecord', 'Archive Record')}
              </Button>
            )}
          </div>
          <Button type="button" variant="primary" onClick={onClose}>
            {t('common.close', 'Close')}
          </Button>
        </div>
      </div>
    </div>
  );
};
