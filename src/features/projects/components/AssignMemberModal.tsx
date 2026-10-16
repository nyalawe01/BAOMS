/**
 * Assign Member Modal
 * Babawatoto Organization Management System (BAOMS)
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { AssignMemberInput, ProjectRole } from '../types/project';
import { fetchActiveStaffMembers, StaffMemberOption } from '@/services/staffService';

interface AssignMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingUserIds: string[];
  onSubmit: (input: AssignMemberInput) => Promise<void>;
}

export const AssignMemberModal: React.FC<AssignMemberModalProps> = ({
  isOpen,
  onClose,
  projectId,
  existingUserIds,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const [staffList, setStaffList] = useState<StaffMemberOption[]>([]);
  const [userId, setUserId] = useState('');
  const [projectRole, setProjectRole] = useState<ProjectRole>('officer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    fetchActiveStaffMembers().then((staff) => {
      setStaffList(staff);
      const available = staff.filter((a) => a.isActive && !existingUserIds.includes(a.id));
      if (available.length > 0) {
        setUserId((curr) => curr || available[0].id);
      }
    });
  }, [existingUserIds]);

  const availableStaff = staffList.filter(
    (a) => a.isActive && !existingUserIds.includes(a.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError(t('projects.errors.userSelectRequired', 'Please select a staff member.'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        projectId,
        userId,
        projectRole,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t('projects.errors.assignFailed', 'Failed to assign member.'));
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
          <UserPlus className="w-5 h-5 text-forest-700" />
          <span>{t('projects.assignMember', 'Assign Team Member')}</span>
        </div>
      }
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {availableStaff.length === 0 ? (
          <p className="text-sm text-charcoal-muted py-2">
            {t('projects.allStaffAssigned', 'All active staff members are already assigned to this project.')}
          </p>
        ) : (
          <>
            <Select
              label={t('projects.fields.selectStaff', 'Select Staff Member')}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              options={availableStaff.map((s) => ({
                value: s.id,
                label: `${s.displayName} (${s.email})`,
              }))}
              required
            />

            <Select
              label={t('projects.fields.projectRole', 'Project Workspace Role')}
              value={projectRole}
              onChange={(e) => setProjectRole(e.target.value as ProjectRole)}
              options={[
                { value: 'manager', label: t('projects.roles.manager', 'Project Manager') },
                { value: 'coordinator', label: t('projects.roles.coordinator', 'Project Coordinator') },
                { value: 'officer', label: t('projects.roles.officer', 'Project Officer') },
                { value: 'viewer', label: t('projects.roles.viewer', 'Viewer / Observer') },
              ]}
              required
            />
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={availableStaff.length === 0}
            isLoading={isSubmitting}
          >
            {t('projects.assign', 'Assign to Project')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
