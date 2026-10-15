import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StaffProfileRecord,
  CreateStaffProfilePayload,
  EmploymentStatus,
  ContractType,
} from '../types/hr';
import { createStaffProfile } from '../services/hrService';
import { Button } from '@/components/ui/Button';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingStaff: StaffProfileRecord[];
  onStaffCreated: (newStaff: StaffProfileRecord) => void;
}

export const CreateStaffModal: React.FC<CreateStaffModalProps> = ({
  isOpen,
  onClose,
  existingStaff,
  onStaffCreated,
}) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [staffNumber, setStaffNumber] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('dept-prj');
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>('active');
  const [contractType, setContractType] = useState<ContractType>('fixed_term');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [endDate, setEndDate] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError(t('hr.errors.nameRequired', 'Full Name is required.'));
      return;
    }

    if (!jobTitle.trim()) {
      setError(t('hr.errors.titleRequired', 'Job Title is required.'));
      return;
    }

    if (!startDate) {
      setError(t('hr.errors.startDateRequired', 'Start date is required.'));
      return;
    }

    if (contractType !== 'permanent' && !endDate) {
      setError(t('hr.errors.endDateRequired', 'End date is required for fixed-term contracts.'));
      return;
    }

    if (endDate && startDate && endDate < startDate) {
      setError(t('hr.errors.dateSequence', 'Contract end date cannot precede start date.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateStaffProfilePayload = {
        fullName: fullName.trim(),
        staffNumber: staffNumber.trim() || undefined,
        jobTitle: jobTitle.trim(),
        departmentId,
        employmentStatus,
        contractType,
        startDate,
        endDate: contractType === 'permanent' ? null : endDate || null,
        supervisorId: supervisorId || null,
        phoneNumber: phoneNumber.trim() || null,
        email: email.trim() || null,
        emergencyContactName: emergencyContactName.trim() || null,
        emergencyContactPhone: emergencyContactPhone.trim() || null,
        notes: notes.trim() || null,
      };

      const created = await createStaffProfile(payload);
      onStaffCreated(created);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to register staff record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-surface-card rounded-xl border border-surface-border shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/30">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-forest-700" />
            <h2 className="text-lg font-bold text-charcoal-900">
              {t('hr.registerStaff', 'Register Staff Member')}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('hr.fullName', 'Full Name')} *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Daudi Juma Matiko"
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('hr.jobTitle', 'Job Title')} *
              </label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Youth Outreach Facilitator"
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('hr.staffNumber', 'Staff Number')} ({t('common.optional', 'Optional')})
              </label>
              <input
                type="text"
                value={staffNumber}
                onChange={(e) => setStaffNumber(e.target.value)}
                placeholder="Auto-generated if empty"
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('hr.department', 'Department')} *
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              >
                <option value="dept-prj">Projects & Programs (PRJ)</option>
                <option value="dept-fin">Finance & Operations (FIN)</option>
                <option value="dept-hr">Human Resources & Administration (HR)</option>
                <option value="dept-exec">Executive Office (EXEC)</option>
                <option value="dept-admin">IT & System Administration (ADMIN)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('hr.supervisor', 'Direct Supervisor')}
              </label>
              <select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              >
                <option value="">{t('common.none', 'None / Top Management')}</option>
                {existingStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.jobTitle})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('hr.employmentStatus', 'Employment Status')} *
              </label>
              <select
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              >
                <option value="active">Active (Kazi Kamili)</option>
                <option value="probation">Probation (Majaribio)</option>
                <option value="on_leave">On Leave (Likizoni)</option>
                <option value="suspended">Suspended (Simamishwa)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('hr.contractType', 'Contract Type')} *
              </label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as ContractType)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              >
                <option value="fixed_term">Fixed Term (Mkataba wa Muda)</option>
                <option value="permanent">Permanent (Kudumu)</option>
                <option value="consultant">Consultant (Mshauri)</option>
                <option value="volunteer">Volunteer (Mjitolea)</option>
                <option value="intern">Intern (Mwanafunzi)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('hr.startDate', 'Start Date')} *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              />
            </div>

            {contractType !== 'permanent' && (
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  {t('hr.endDate', 'Contract End Date')} *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('hr.phone', 'Phone Number')}
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+255 754 ..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('hr.email', 'Email Address')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@babawatoto.org"
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('hr.emergencyContactName', 'Emergency Contact Person')}
              </label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Next of Kin / Relative"
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                {t('hr.emergencyContactPhone', 'Emergency Contact Phone')}
              </label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="+255 754 ..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              {t('hr.notes', 'Operational Notes')}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes on role assignments, physical contract location, etc."
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('hr.saveStaff', 'Save Staff Profile')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
