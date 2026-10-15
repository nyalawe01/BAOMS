import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MeetingRecord,
  MeetingAttendeeRecord,
  MeetingDecisionRecord,
  MeetingActionRecord,
} from '../types/correspondence';
import {
  getMeetingAttendees,
  getMeetingDecisions,
  getMeetingActions,
  createMeetingDecision,
  createMeetingAction,
  updateMeetingAction,
} from '../services/correspondenceService';
import { useAuth } from '@/features/auth/useAuth';
import { showSuccess, showError } from '@/lib/sweetAlert';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  X,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

interface MeetingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingRecord | null;
}

export const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({
  isOpen,
  onClose,
  meeting,
}) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const [attendees, setAttendees] = useState<MeetingAttendeeRecord[]>([]);
  const [decisions, setDecisions] = useState<MeetingDecisionRecord[]>([]);
  const [actions, setActions] = useState<MeetingActionRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'decisions' | 'actions' | 'attendees'>('decisions');

  // Form states for new decision
  const [isAddingDecision, setIsAddingDecision] = useState(false);
  const [decisionTitle, setDecisionTitle] = useState('');
  const [decisionDesc, setDecisionDesc] = useState('');

  // Form states for new action
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [actionDesc, setActionDesc] = useState('');
  const [actionAssignee, setActionAssignee] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');

  useEffect(() => {
    if (!isOpen || !meeting) return;

    const loadData = async () => {
      const [att, dec, act] = await Promise.all([
        getMeetingAttendees(meeting.id),
        getMeetingDecisions(meeting.id),
        getMeetingActions({ meetingId: meeting.id }),
      ]);
      setAttendees(att);
      setDecisions(dec);
      setActions(act);
    };

    loadData();
  }, [isOpen, meeting]);

  if (!isOpen || !meeting) return null;

  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionTitle.trim() || !decisionDesc.trim()) return;

    try {
      const newDec = await createMeetingDecision({
        meetingId: meeting.id,
        title: decisionTitle.trim(),
        description: decisionDesc.trim(),
      });
      setDecisions([...decisions, newDec]);
      setDecisionTitle('');
      setDecisionDesc('');
      setIsAddingDecision(false);
      await showSuccess(t('meetings.decisionAdded', 'Decision recorded successfully.'));
    } catch (err: unknown) {
      await showError(t('common.error', 'Error'), (err as Error).message || 'Failed to add decision.');
    }
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionDesc.trim() || !actionDueDate) return;

    try {
      const newAct = await createMeetingAction({
        meetingId: meeting.id,
        taskDescription: actionDesc.trim(),
        assignedToName: actionAssignee.trim() || 'Assigned Officer',
        dueDate: actionDueDate,
      });
      setActions([...actions, newAct]);
      setActionDesc('');
      setActionAssignee('');
      setActionDueDate('');
      setIsAddingAction(false);
      await showSuccess(t('meetings.actionAssigned', 'Action item assigned successfully.'));
    } catch (err: unknown) {
      await showError(t('common.error', 'Error'), (err as Error).message || 'Failed to assign action.');
    }
  };

  const handleToggleActionCompleted = async (actionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const updated = await updateMeetingAction(
        {
          actionId,
          status: newStatus,
          completionNotes: newStatus === 'completed' ? 'Completed by user' : null,
        },
        {
          id: user?.id || 'sys-admin',
          displayName: profile?.display_name || user?.email || 'User',
        }
      );
      setActions(actions.map((a) => (a.id === actionId ? updated : a)));
      await showSuccess(
        newStatus === 'completed'
          ? t('meetings.actionCompleted', 'Action item marked as completed.')
          : t('meetings.actionReopened', 'Action item reopened.')
      );
    } catch (err: unknown) {
      await showError(t('common.error', 'Error'), (err as Error).message || 'Failed to update action status.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-surface-card rounded-xl border border-surface-border shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-forest-800">
                  {meeting.meetingNumber}
                </span>
                <Badge variant="success" withDot>
                  {meeting.status.toUpperCase()}
                </Badge>
                <span className="text-xs font-semibold text-charcoal-600 uppercase">
                  {meeting.meetingType}
                </span>
              </div>
              <h2 className="text-base font-bold text-charcoal-900 mt-1 line-clamp-1">
                {meeting.title}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Metadata pill bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border border-surface-border bg-surface-muted/20 text-xs text-charcoal-700">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-charcoal-400 shrink-0" />
              <span>{new Date(meeting.meetingDate).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-charcoal-400 shrink-0" />
              <span className="truncate">{meeting.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-charcoal-400 shrink-0" />
              <span>{attendees.length} Attendees Recorded</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-surface-border gap-6">
            <button
              onClick={() => setActiveTab('decisions')}
              className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'decisions'
                  ? 'border-forest-700 text-forest-800'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal-800'
              }`}
            >
              <FileCheck className="h-4 w-4" />
              {t('meetings.decisionsTab', 'Decisions Log')} ({decisions.length})
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'actions'
                  ? 'border-forest-700 text-forest-800'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal-800'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {t('meetings.actionsTab', 'Follow-up Actions')} ({actions.length})
            </button>
            <button
              onClick={() => setActiveTab('attendees')}
              className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'attendees'
                  ? 'border-forest-700 text-forest-800'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal-800'
              }`}
            >
              <Users className="h-4 w-4" />
              {t('meetings.attendeesTab', 'Attendees')} ({attendees.length})
            </button>
          </div>

          {/* TAB 1: DECISIONS */}
          {activeTab === 'decisions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-charcoal-500 uppercase">
                  {t('meetings.recordedResolutions', 'Recorded Resolutions & Approvals')}
                </span>
                {!isAddingDecision && (
                  <Button size="sm" variant="outline" onClick={() => setIsAddingDecision(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {t('meetings.addDecision', 'Log Decision')}
                  </Button>
                )}
              </div>

              {isAddingDecision && (
                <form
                  onSubmit={handleCreateDecision}
                  className="p-4 rounded-xl border border-forest-200 bg-forest-50/30 space-y-3"
                >
                  <h4 className="text-xs font-bold text-forest-900 uppercase">New Resolution</h4>
                  <input
                    type="text"
                    required
                    placeholder="Decision Title (e.g. Approved Q2 Travel Budget Reallocation)"
                    value={decisionTitle}
                    onChange={(e) => setDecisionTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-border bg-surface-card"
                  />
                  <textarea
                    rows={2}
                    required
                    placeholder="Detailed resolution text and voting summary..."
                    value={decisionDesc}
                    onChange={(e) => setDecisionDesc(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-border bg-surface-card"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" type="button" onClick={() => setIsAddingDecision(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="primary" type="submit">
                      Save Decision
                    </Button>
                  </div>
                </form>
              )}

              {decisions.length === 0 ? (
                <div className="py-8 text-center text-xs text-charcoal-muted border border-dashed border-surface-border rounded-xl">
                  No decisions logged for this meeting yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {decisions.map((dec) => (
                    <div
                      key={dec.id}
                      className="p-4 rounded-xl border border-surface-border bg-surface-card space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-forest-800">
                          {dec.decisionNumber}
                        </span>
                        <h4 className="text-sm font-bold text-charcoal-900">{dec.title}</h4>
                      </div>
                      <p className="text-xs text-charcoal-700 leading-relaxed pl-1">
                        {dec.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIONS */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-charcoal-500 uppercase">
                  {t('meetings.actionTasks', 'Assigned Follow-up Tasks')}
                </span>
                {!isAddingAction && (
                  <Button size="sm" variant="outline" onClick={() => setIsAddingAction(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {t('meetings.addAction', 'Assign Action')}
                  </Button>
                )}
              </div>

              {isAddingAction && (
                <form
                  onSubmit={handleCreateAction}
                  className="p-4 rounded-xl border border-forest-200 bg-forest-50/30 space-y-3"
                >
                  <h4 className="text-xs font-bold text-forest-900 uppercase">New Action Item</h4>
                  <input
                    type="text"
                    required
                    placeholder="Task Description (e.g. Submit revised child protection pledge to donor)"
                    value={actionDesc}
                    onChange={(e) => setActionDesc(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-border bg-surface-card"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Focal Person Name (e.g. Amina Kimaro)"
                      value={actionAssignee}
                      onChange={(e) => setActionAssignee(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-border bg-surface-card"
                    />
                    <input
                      type="date"
                      required
                      value={actionDueDate}
                      onChange={(e) => setActionDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-border bg-surface-card"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" type="button" onClick={() => setIsAddingAction(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="primary" type="submit">
                      Assign Task
                    </Button>
                  </div>
                </form>
              )}

              {actions.length === 0 ? (
                <div className="py-8 text-center text-xs text-charcoal-muted border border-dashed border-surface-border rounded-xl">
                  No follow-up action items assigned yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {actions.map((act) => (
                    <div
                      key={act.id}
                      className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                        act.status === 'completed'
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : act.isOverdue
                          ? 'border-rose-200 bg-rose-50/20'
                          : 'border-surface-border bg-surface-card'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-charcoal-700">
                            {act.actionNumber}
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              act.status === 'completed'
                                ? 'line-through text-charcoal-muted'
                                : 'text-charcoal-900'
                            }`}
                          >
                            {act.taskDescription}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-charcoal-muted">
                          <span>Assigned: <strong className="text-charcoal-800">{act.assignedToName}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            Due: {act.dueDate}
                            {act.isOverdue && (
                              <span className="text-rose-700 font-bold flex items-center gap-0.5">
                                <AlertTriangle className="h-3 w-3" /> Overdue
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={act.status === 'completed' ? 'outline' : 'primary'}
                        onClick={() => handleToggleActionCompleted(act.id, act.status)}
                      >
                        {act.status === 'completed' ? 'Mark Incomplete' : 'Complete Task'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATTENDEES */}
          {activeTab === 'attendees' && (
            <div className="space-y-3">
              {attendees.map((att) => (
                <div
                  key={att.id}
                  className="p-3 rounded-xl border border-surface-border bg-surface-card flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-white border border-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">
                      {att.displayName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-charcoal-900">{att.displayName}</div>
                      {att.email && <div className="text-xs text-charcoal-muted">{att.email}</div>}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-surface-muted text-charcoal-700 border border-surface-border">
                    {att.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-surface-border bg-surface-muted/20">
          <Button type="button" variant="primary" onClick={onClose}>
            {t('common.close', 'Close')}
          </Button>
        </div>
      </div>
    </div>
  );
};
