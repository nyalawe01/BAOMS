import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StaffProfileRecord,
  LeaveTypeRecord,
  LeaveBalanceRecord,
  LeaveRequestRecord,
  CreateLeaveRequestPayload,
} from '../types/hr';
import {
  getLeaveTypes,
  getLeaveBalances,
  createLeaveRequest,
} from '../services/hrService';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/Button';
import { DateRangePicker } from '@/components/ui/DatePicker';
import { X, Calendar, AlertCircle, Info } from 'lucide-react';

interface CreateLeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffProfileRecord[];
  onRequestCreated: (newRequest: LeaveRequestRecord) => void;
}

export const CreateLeaveRequestModal: React.FC<CreateLeaveRequestModalProps> = ({
  isOpen,
  onClose,
  staffList,
  onRequestCreated,
}) => {
  const { t } = useTranslation();
  const { user, roles } = useAuth();
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeRecord[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [balances, setBalances] = useState<LeaveBalanceRecord[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [handoverStaffId, setHandoverStaffId] = useState('');
  const [reason, setReason] = useState('');
  const [customLeaveType, setCustomLeaveType] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isHrOrAdmin = roles.some((r) =>
    ['system_admin', 'executive_director', 'hr_administrator'].includes(r)
  );

  useEffect(() => {
    if (!isOpen) return;

    const loadTypes = async () => {
      const types = await getLeaveTypes();
      setLeaveTypes(types);
      if (types.length > 0 && types[0]) {
        setSelectedTypeId(types[0].id);
      }

      // Default staff selector to current logged-in user's profile
      const currentStaff = staffList.find((s) => s.userId === user?.id);
      if (currentStaff) {
        setSelectedStaffId(currentStaff.id);
      } else if (staffList.length > 0 && staffList[0]) {
        setSelectedStaffId(staffList[0].id);
      }
    };

    loadTypes();
  }, [isOpen, staffList, user?.id]);

  useEffect(() => {
    if (selectedStaffId) {
      loadBalances(selectedStaffId);
    }
  }, [selectedStaffId]);

  const loadBalances = async (staffId: string) => {
    const b = await getLeaveBalances(staffId);
    setBalances(b);
  };

  if (!isOpen) return null;

  // Real-time calculation of days requested
  const calcDays = () => {
    if (!startDate || !endDate || endDate < startDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  };

  const daysRequested = calcDays();

  // Find balance for selected leave type
  const currentBalance = balances.find((b) => b.leaveTypeId === selectedTypeId);
  const remainingDays = currentBalance ? currentBalance.remainingDays : 28;
  const isOverBalance = daysRequested > remainingDays;

  const handleAction = async (asDraft: boolean) => {
    setError(null);

    if (!selectedStaffId) {
      setError(t('hr.errors.staffRequired', 'Please select a staff member.'));
      return;
    }

    if (!selectedTypeId) {
      setError(t('hr.errors.leaveTypeRequired', 'Please select a leave type.'));
      return;
    }

    if (!startDate || !endDate) {
      setError(t('hr.errors.datesRequired', 'Start and end dates are required.'));
      return;
    }

    if (endDate < startDate) {
      setError(t('hr.errors.dateSequence', 'End date cannot precede start date.'));
      return;
    }

    if (!reason.trim()) {
      setError(t('hr.errors.reasonRequired', 'Please provide a reason for the leave application.'));
      return;
    }

    if (selectedTypeId === 'other' && !customLeaveType.trim()) {
      setError('Please specify the custom leave category.');
      return;
    }

    if (selectedTypeId !== 'other' && !asDraft && isOverBalance) {
      setError(
        t(
          'hr.errors.insufficientBalance',
          'Insufficient leave balance. You requested {{req}} days, but only {{rem}} days remain.',
          { req: daysRequested, rem: remainingDays }
        )
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const resolvedReason = selectedTypeId === 'other' && customLeaveType.trim()
        ? `[Category: ${customLeaveType.trim()}]\n\n${reason.trim()}`
        : reason.trim();

      const fallbackTypeId = leaveTypes[0]?.id || 'lt-unpaid';

      const payload: CreateLeaveRequestPayload = {
        staffId: selectedStaffId,
        leaveTypeId: selectedTypeId === 'other' ? fallbackTypeId : selectedTypeId,
        startDate,
        endDate,
        reason: resolvedReason,
        handoverStaffId: handoverStaffId || null,
        status: asDraft ? 'draft' : 'pending',
      };

      const newReq = await createLeaveRequest(payload, {
        id: user?.id || 'sys-admin',
      });
      onRequestCreated(newReq);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to submit leave application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAction(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-surface-card rounded-xl border border-surface-border shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/30">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-forest-700" />
            <h2 className="text-lg font-bold text-charcoal-900">
              {t('hr.applyForLeave', 'Submit Leave Application')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-charcoal-muted hover:text-charcoal-800 hover:bg-surface-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Staff Member */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              {t('hr.staffMember', 'Staff Member')} *
            </label>
            <select
              value={selectedStaffId}
              disabled={!isHrOrAdmin}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600 disabled:opacity-75 disabled:bg-surface-muted"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.staffNumber} • {s.jobTitle})
                </option>
              ))}
            </select>
          </div>

          {/* Leave Type */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              {t('hr.leaveType', 'Leave Category')} *
            </label>
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
            >
              {leaveTypes.map((lt) => {
                const bal = balances.find((b) => b.leaveTypeId === lt.id);
                return (
                  <option key={lt.id} value={lt.id}>
                    {lt.nameEn} ({lt.nameSw}) — {bal ? bal.remainingDays : lt.daysAllowedPerYear} {t('hr.daysRemaining', 'days remaining')}
                  </option>
                );
              })}
              <option value="other">Other (Category not listed)...</option>
            </select>
            {selectedTypeId === 'other' && (
              <div className="mt-2">
                <input
                  type="text"
                  required
                  placeholder="Specify custom leave category..."
                  value={customLeaveType}
                  onChange={(e) => setCustomLeaveType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-1 focus:ring-forest-600"
                />
              </div>
            )}
            {currentBalance && (
              <div className="mt-1.5 flex items-center gap-2 text-xs text-charcoal-muted">
                <Info className="h-3.5 w-3.5 text-forest-700" />
                <span>
                  {t('hr.entitlementSummary', 'Allocated: {{alloc}}d • Used: {{used}}d • Remaining: {{rem}}d', {
                    alloc: currentBalance.allocatedDays,
                    used: currentBalance.usedDays,
                    rem: currentBalance.remainingDays,
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Date Range */}
          <DateRangePicker
            label={t('hr.leavePeriod', 'Leave Period (Start & End Date)')}
            startDate={startDate}
            endDate={endDate}
            onRangeChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            required
          />

          {/* Days requested preview badge */}
          <div className="p-3 rounded-lg border border-surface-border bg-surface-muted/20 flex items-center justify-between">
            <span className="text-xs text-charcoal-600 font-medium">
              {t('hr.totalDaysRequested', 'Total Days Requested')}:
            </span>
            <span className={`text-base font-extrabold ${isOverBalance ? 'text-rose-600' : 'text-forest-800'}`}>
              {daysRequested} {t('hr.calendarDays', 'calendar day(s)')}
            </span>
          </div>

          {/* Handover colleague */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              {t('hr.handoverColleague', 'Handover Colleague / Focal Person')}
            </label>
            <select
              value={handoverStaffId}
              onChange={(e) => setHandoverStaffId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
            >
              <option value="">{t('common.selectColleague', 'Select handover colleague (Optional)')}</option>
              {staffList
                .filter((s) => s.id !== selectedStaffId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.jobTitle})
                  </option>
                ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              {t('hr.reason', 'Reason & Details')} *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide context, emergency reasons, or scheduled handover arrangements..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAction(true)}
              isLoading={isSubmitting}
              disabled={daysRequested <= 0}
            >
              {t('hr.saveDraft', 'Save as Draft')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isOverBalance || daysRequested <= 0}
            >
              {t('hr.submitLeaveApplication', 'Submit Leave Application')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
