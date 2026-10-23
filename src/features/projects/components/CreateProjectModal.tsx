/**
 * Create Project Modal
 * Babawatoto Organization Management System (BAOMS)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DateRangePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { CreateProjectInput } from '../types/project';
import { fetchActiveStaffMembers, StaffMemberOption } from '@/services/staffService';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateProjectInput) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const [projectCode, setProjectCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [funder, setFunder] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [totalBudget, setTotalBudget] = useState('50000000');
  const [currency, setCurrency] = useState('TZS');
  const [activeStaff, setActiveStaff] = useState<StaffMemberOption[]>([]);
  const [managerId, setManagerId] = useState('');
  const [coordinatorId, setCoordinatorId] = useState('');

  useEffect(() => {
    fetchActiveStaffMembers().then((staff) => {
      setActiveStaff(staff);
      const defaultManager = staff.find((a) => a.role === 'project_manager')?.id || staff[0]?.id || '';
      const defaultCoordinator = staff.find((a) => a.role === 'project_coordinator')?.id || staff[1]?.id || '';
      setManagerId((curr) => curr || defaultManager);
      setCoordinatorId((curr) => curr || defaultCoordinator);
    });
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!projectCode.trim()) {
      setError(t('projects.errors.codeRequired', 'Project code is required.'));
      return;
    }
    if (!name.trim()) {
      setError(t('projects.errors.nameRequired', 'Project name is required.'));
      return;
    }
    if (!funder.trim()) {
      setError(t('projects.errors.funderRequired', 'Funder is required.'));
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError(
        t('projects.errors.invalidDates', 'End date must be on or after start date.')
      );
      return;
    }

    const budgetNum = parseFloat(totalBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setError(
        t('projects.errors.invalidBudget', 'Please specify a valid total budget amount.')
      );
      return;
    }
    if (!managerId) {
      setError(t('projects.errors.managerRequired', 'Project Manager assignment is required.'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        projectCode: projectCode.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        funder: funder.trim(),
        startDate,
        endDate,
        totalBudget: budgetNum,
        currency,
        managerId,
        coordinatorId: coordinatorId || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t('projects.errors.createFailed', 'Failed to create project.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-forest-900 font-semibold text-lg">
          <Briefcase className="w-5 h-5 text-forest-700" />
          <span>{t('projects.createProject', 'Create New Project')}</span>
        </div>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('projects.fields.projectCode', 'Project Code')}
            placeholder="e.g. PRJ-BYA-2026"
            value={projectCode}
            onChange={(e) => setProjectCode(e.target.value)}
            helperText={t('projects.fields.projectCodeHelp', 'Unique alphanumeric identifier')}
            required
          />

          <Input
            label={t('projects.fields.funder', 'Funder / Donor')}
            placeholder="e.g. Foundation for Civil Society"
            value={funder}
            onChange={(e) => setFunder(e.target.value)}
            required
          />
        </div>

        <Input
          label={t('projects.fields.projectName', 'Project Name')}
          placeholder="e.g. Babawatoto Youth Academy 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Textarea
          label={t('projects.fields.description', 'Description & Objectives')}
          placeholder="Brief description of the program, expected impact, and core community targets..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <DateRangePicker
          label={t('projects.fields.projectDuration', 'Project Duration (Start & End Date)')}
          startDate={startDate}
          endDate={endDate}
          onRangeChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              type="number"
              min="0"
              step="1000"
              label={t('projects.fields.totalBudget', 'Total Approved Budget')}
              placeholder="e.g. 75000000"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              required
            />
          </div>
          <div>
            <Select
              label={t('projects.fields.currency', 'Currency')}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: 'TZS', label: 'TZS (Tanzanian Shilling)' },
                { value: 'USD', label: 'USD (US Dollar)' },
                { value: 'EUR', label: 'EUR (Euro)' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-surface-border">
          <Select
            label={t('projects.fields.projectManager', 'Assigned Project Manager')}
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            options={activeStaff.map((s) => ({
              value: s.id,
              label: `${s.displayName} (${s.role.replace('_', ' ')})`,
            }))}
            required
          />

          <Select
            label={t('projects.fields.projectCoordinator', 'Assigned Coordinator (Optional)')}
            value={coordinatorId}
            onChange={(e) => setCoordinatorId(e.target.value)}
            options={[
              { value: '', label: t('common.unassigned', '-- Unassigned --') },
              ...activeStaff.map((s) => ({
                value: s.id,
                label: `${s.displayName} (${s.role.replace('_', ' ')})`,
              })),
            ]}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {t('projects.createProject', 'Create Project')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
