/**
 * Create Task Modal
 * Babawatoto Organization Management System (BAOMS)
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  CreateTaskInput,
  TaskPriority,
  ActivityRecord,
  ProjectMemberRecord,
} from '../types/project';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  activities: ActivityRecord[];
  members: ProjectMemberRecord[];
  onSubmit: (input: CreateTaskInput) => Promise<void>;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  projectId,
  activities,
  members,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activityId, setActivityId] = useState('');
  const [assignedTo, setAssignedTo] = useState(members[0]?.userId || '');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [priority, setPriority] = useState<TaskPriority>('medium');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError(t('projects.errors.taskTitleRequired', 'Task title is required.'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        activityId: activityId || undefined,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined,
        priority,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t('projects.errors.taskCreateFailed', 'Failed to create task.'));
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
          <CheckSquare className="w-5 h-5 text-forest-700" />
          <span>{t('projects.createTask', 'Create New Task')}</span>
        </div>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label={t('projects.fields.taskTitle', 'Task Title')}
          placeholder="e.g. Procure workshop training materials"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label={t('projects.fields.description', 'Description & Deliverables')}
          placeholder="Details on deliverables, suppliers to contact, or expectations..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <Select
          label={t('projects.fields.linkedActivity', 'Linked Field Activity (Optional)')}
          value={activityId}
          onChange={(e) => setActivityId(e.target.value)}
          options={[
            { value: '', label: t('common.none', '-- None / General Project Task --') },
            ...activities.map((a) => ({
              value: a.id,
              label: `${a.activityDate} - ${a.title}`,
            })),
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={t('projects.fields.assignedTo', 'Assigned Staff Member')}
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            options={[
              { value: '', label: t('common.unassigned', '-- Unassigned --') },
              ...members.map((m) => ({
                value: m.userId,
                label: `${m.userName} (${m.projectRole})`,
              })),
            ]}
          />

          <Select
            label={t('projects.fields.priority', 'Priority')}
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            options={[
              { value: 'low', label: t('projects.priority.low', 'Low') },
              { value: 'medium', label: t('projects.priority.medium', 'Medium') },
              { value: 'high', label: t('projects.priority.high', 'High') },
              { value: 'urgent', label: t('projects.priority.urgent', 'Urgent') },
            ]}
          />
        </div>

        <DatePicker
          label={t('projects.fields.dueDate', 'Due Date')}
          value={dueDate}
          onChange={(val) => setDueDate(val)}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {t('projects.createTask', 'Create Task')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
