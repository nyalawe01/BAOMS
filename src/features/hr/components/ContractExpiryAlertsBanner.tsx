import React from 'react';
import { useTranslation } from 'react-i18next';
import { StaffProfileRecord } from '../types/hr';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';

interface ContractExpiryAlertsBannerProps {
  expiringStaff: StaffProfileRecord[];
  onSelectStaff: (staff: StaffProfileRecord) => void;
}

export const ContractExpiryAlertsBanner: React.FC<ContractExpiryAlertsBannerProps> = ({
  expiringStaff,
  onSelectStaff,
}) => {
  const { t } = useTranslation();

  if (expiringStaff.length === 0) return null;

  const urgentList = expiringStaff.filter(
    (s) => s.daysToContractExpiry !== null && s.daysToContractExpiry <= 30
  );
  const warningList = expiringStaff.filter(
    (s) => s.daysToContractExpiry !== null && s.daysToContractExpiry > 30 && s.daysToContractExpiry <= 60
  );

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            {t('hr.contractExpiryAlertTitle', 'Contract Expiry & Renewal Reminders')} ({expiringStaff.length})
          </span>
        </div>
        <span className="text-xs text-amber-800">
          {urgentList.length > 0 && (
            <span className="font-semibold text-rose-700 mr-2">
              • {urgentList.length} {t('hr.urgentAttention', 'urgent (< 30 days)')}
            </span>
          )}
          {warningList.length > 0 && (
            <span>
              • {warningList.length} {t('hr.upcomingAttention', 'upcoming (< 60 days)')}
            </span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {expiringStaff.map((staff) => {
          const isUrgent = staff.daysToContractExpiry !== null && staff.daysToContractExpiry <= 30;
          return (
            <div
              key={staff.id}
              onClick={() => onSelectStaff(staff)}
              className="p-3 rounded-lg border border-amber-200/80 bg-surface-card hover:bg-amber-100/40 cursor-pointer transition-colors flex items-center justify-between"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-charcoal-900 truncate">{staff.fullName}</span>
                  <Badge variant={isUrgent ? 'danger' : 'warning'}>
                    {staff.daysToContractExpiry !== null && staff.daysToContractExpiry <= 0
                      ? t('hr.expired', 'Expired')
                      : `${staff.daysToContractExpiry}d`}
                  </Badge>
                </div>
                <p className="text-xs text-charcoal-muted truncate">
                  {staff.jobTitle} • {staff.departmentCode}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-charcoal-500">
                  <Clock className="h-3 w-3 text-amber-600" />
                  <span>{t('hr.expiresOn', 'Expires')}: {staff.endDate}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-charcoal-400 shrink-0 ml-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
