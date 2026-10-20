import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShoppingCart,
  Users,
  CheckCircle2,
  Receipt,
  FileCheck,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  Plus,
  Trash2,
  Send,
  ShieldCheck,
  RotateCcw,
  Printer,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/useAuth';
import {
  ActivityRecord,
  ActivityParticipantRecord,
  ProcurementStatus,
} from '../types/project';
import {
  submitActivityRequest,
  authorizeActivityRequest,
  updateActivityProcurementStatus,
  recordActivityImplementation,
  verifyActivityMe,
  submitActivityRetirement,
  approveActivityRetirement,
  getActivityParticipants,
} from '../services/projectService';

interface ActivityLifecycleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityRecord | null;
  projectName?: string;
  currency?: string;
  isManagerOrAbove: boolean;
  isFinanceOfficer?: boolean;
  onActivityUpdated: () => Promise<void>;
}

type LifecycleStage = 'request' | 'procurement' | 'implementation' | 'me' | 'retirement' | 'dossier';

export const ActivityLifecycleWorkspaceModal: React.FC<ActivityLifecycleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  activity,
  projectName = 'Project Workspace',
  currency = 'TZS',
  isManagerOrAbove,
  isFinanceOfficer = false,
  onActivityUpdated,
}) => {
  const { user, profile } = useAuth();
  const [currentStage, setCurrentStage] = useState<LifecycleStage>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Participants roster
  const [participants, setParticipants] = useState<ActivityParticipantRecord[]>([]);
  const [newAttendee, setNewAttendee] = useState({
    fullName: '',
    gender: 'female' as 'male' | 'female' | 'other',
    ageGroup: 'youth_13_24' as 'children_0_12' | 'youth_13_24' | 'adults_25_59' | 'elderly_60_plus' | 'unknown',
    ward: '',
    phoneNumber: '',
    perDiem: '0',
  });

  // Stage 1: Request State
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    date: '',
    budget: '',
  });
  const [authComments, setAuthComments] = useState('');

  // Stage 2: Procurement State
  const [procurementStatus, setProcurementStatus] = useState<ProcurementStatus>('not_required');

  // Stage 3: Implementation State
  const [implForm, setImplForm] = useState({
    participantsCount: 0,
    progress: '',
    challenges: '',
    followUpActions: '',
    location: '',
  });

  // Stage 4: M&E Verification State
  const [meComments, setMeComments] = useState('');

  // Stage 5: Retirement State
  const [retForm, setRetForm] = useState({
    retiredAmount: '',
    receiptsCount: 0,
    notes: '',
  });

  // Load activity state when modal opens
  useEffect(() => {
    if (activity) {
      setRequestForm({
        title: activity.requestTitle || activity.title || '',
        description: activity.requestDescription || activity.description || '',
        date: activity.requestedDate || activity.activityDate || '',
        budget: String(activity.budgetEstimated || ''),
      });

      setProcurementStatus(activity.procurementStatus || 'not_required');

      setImplForm({
        participantsCount: activity.participantsCount || 0,
        progress: activity.progress || '',
        challenges: activity.challenges || '',
        followUpActions: activity.followUpActions || '',
        location: activity.wardLocation || activity.location || '',
      });

      setRetForm({
        retiredAmount: String(activity.retiredAmount || activity.budgetEstimated || ''),
        receiptsCount: activity.retirementReceiptsCount || 0,
        notes: '',
      });

      // Fetch participants
      getActivityParticipants(activity.id).then(setParticipants);

      // Auto-select most appropriate active stage
      if (activity.retirementStatus === 'finance_review' || activity.retirementStatus === 'approved') {
        setCurrentStage('retirement');
      } else if (activity.meStatus === 'submitted' || activity.meStatus === 'verified') {
        setCurrentStage('me');
      } else if (activity.implementationStatus === 'in_progress' || activity.implementationStatus === 'conducted_pending_verification') {
        setCurrentStage('implementation');
      } else if (activity.procurementStatus && activity.procurementStatus !== 'not_required' && activity.procurementStatus !== 'delivered') {
        setCurrentStage('procurement');
      } else {
        setCurrentStage('request');
      }
    }
  }, [activity]);

  if (!activity) return null;

  const currentUserId = user?.id || 'staff';

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Stage 1 Actions
  const handleSubmitRequest = async () => {
    clearMessages();
    setIsLoading(true);
    try {
      await submitActivityRequest(
        activity.id,
        {
          requestTitle: requestForm.title,
          requestDescription: requestForm.description,
          requestedDate: requestForm.date,
          budgetEstimated: parseFloat(requestForm.budget) || 0,
        },
        currentUserId
      );
      setSuccessMessage('Activity request and ToR submitted for manager approval.');
      await onActivityUpdated();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Failed to submit request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorizeRequest = async (decision: 'approved' | 'rejected') => {
    clearMessages();
    setIsLoading(true);
    try {
      await authorizeActivityRequest(activity.id, decision, authComments, currentUserId);
      setSuccessMessage(`Activity request successfully ${decision}.`);
      await onActivityUpdated();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Failed to authorize activity.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stage 2 Action
  const handleUpdateProcurement = async (status: ProcurementStatus) => {
    clearMessages();
    setIsLoading(true);
    try {
      await updateActivityProcurementStatus(activity.id, status);
      setProcurementStatus(status);
      setSuccessMessage(`Procurement status updated to ${status}.`);
      await onActivityUpdated();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Failed to update procurement status.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stage 3 Attendee addition
  const handleAddAttendee = () => {
    if (!newAttendee.fullName.trim()) return;
    const item: ActivityParticipantRecord = {
      id: `part-${Date.now()}`,
      activityId: activity.id,
      projectId: activity.projectId,
      fullName: newAttendee.fullName.trim(),
      gender: newAttendee.gender,
      ageGroup: newAttendee.ageGroup,
      ward: newAttendee.ward.trim() || implForm.location,
      phoneNumber: newAttendee.phoneNumber.trim(),
      attendanceConfirmed: true,
      perDiemReceived: parseFloat(newAttendee.perDiem) || 0,
      verifiedByMe: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...participants, item];
    setParticipants(updated);
    setImplForm((prev) => ({ ...prev, participantsCount: updated.length }));
    setNewAttendee({
      fullName: '',
      gender: 'female',
      ageGroup: 'youth_13_24',
      ward: '',
      phoneNumber: '',
      perDiem: '0',
    });
  };

  const handleRemoveAttendee = (index: number) => {
    const updated = participants.filter((_, i) => i !== index);
    setParticipants(updated);
    setImplForm((prev) => ({ ...prev, participantsCount: updated.length }));
  };

  const handleSaveImplementation = async () => {
    clearMessages();
    setIsLoading(true);
    try {
      await recordActivityImplementation(
        activity.id,
        {
          participantsCount: participants.length || implForm.participantsCount,
          progress: implForm.progress,
          challenges: implForm.challenges,
          followUpActions: implForm.followUpActions,
          location: implForm.location,
          participants: participants.map((p) => ({
            fullName: p.fullName,
            gender: p.gender,
            ageGroup: p.ageGroup,
            ward: p.ward || implForm.location,
            phoneNumber: p.phoneNumber || undefined,
            perDiemReceived: p.perDiemReceived,
            attendanceConfirmed: p.attendanceConfirmed,
          })),
        },
        currentUserId
      );
      setSuccessMessage('Field implementation recorded with participant register. Submitted to M&E.');
      await onActivityUpdated();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Failed to save field implementation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stage 4 Action
  const handleVerifyMe = async (decision: 'verified' | 'returned_for_correction') => {
    clearMessages();
    setIsLoading(true);
    try {
      await verifyActivityMe(activity.id, decision, meComments, currentUserId);
      setSuccessMessage(
        decision === 'verified'
          ? 'M&E results verified! Participant counts locked for organizational KPIs.'
          : 'Activity returned for correction to field team.'
      );
      await onActivityUpdated();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Failed to verify M&E results.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stage 5 Actions
  const handleSubmitRetirement = async () => {
    clearMessages();
    setIsLoading(true);
    try {
      const spent = parseFloat(retForm.retiredAmount) || 0;
      const advance = activity.budgetEstimated || 0;
      const variance = advance - spent;

      await submitActivityRetirement(
        activity.id,
        {
          retiredAmount: spent,
          retirementVariance: variance,
          retirementReceiptsCount: Number(retForm.receiptsCount) || 0,
        },
        currentUserId
      );
      setSuccessMessage('Financial retirement and physical vouchers submitted to Finance.');
      await onActivityUpdated();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Failed to submit financial retirement.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRetirement = async (decision: 'approved' | 'returned') => {
    clearMessages();
    setIsLoading(true);
    try {
      await approveActivityRetirement(activity.id, decision, currentUserId);
      setSuccessMessage(
        decision === 'approved'
          ? 'Financial retirement approved and reconciled in general ledger.'
          : 'Financial retirement returned to activity lead for corrections.'
      );
      await onActivityUpdated();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Failed to process retirement approval.');
    } finally {
      setIsLoading(false);
    }
  };

  // Disaggregated Participant Demographics Calculation
  const maleCount = participants.filter((p) => p.gender === 'male').length;
  const femaleCount = participants.filter((p) => p.gender === 'female').length;
  const otherGenderCount = participants.filter((p) => p.gender === 'other').length;
  const youthCount = participants.filter((p) => p.ageGroup === 'youth_13_24').length;
  const childrenCount = participants.filter((p) => p.ageGroup === 'children_0_12').length;
  const adultCount = participants.filter((p) => p.ageGroup === 'adults_25_59').length;
  const totalPerDiemDisbursed = participants.reduce((sum, p) => sum + (p.perDiemReceived || 0), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className="max-w-5xl"
      title={
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-[#D68904]/10 text-[#b45309] px-2 py-0.5 rounded border border-[#D68904]/30">
              {activity.activityCode || 'ACT'}
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-base">
              {activity.title}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            {projectName} • Outcome: {activity.outcomeTitle || 'General'} • Output: {activity.outputTitle || 'Standard'}
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Decoupled Multi-Workflow Status Bar */}
        <div className="p-3 bg-slate-50 dark:bg-neutral-900/60 rounded-xl border border-slate-200 dark:border-neutral-800 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
          <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200/80">
            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">01. Request</span>
            <span className={`font-semibold capitalize ${activity.requestStatus === 'approved' ? 'text-emerald-700' : activity.requestStatus === 'submitted' ? 'text-amber-700' : 'text-slate-600'}`}>
              {activity.requestStatus?.replace('_', ' ') || 'Not Submitted'}
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200/80">
            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">02. Procurement</span>
            <span className={`font-semibold capitalize ${activity.procurementStatus === 'delivered' ? 'text-emerald-700' : activity.procurementStatus === 'not_required' ? 'text-slate-400' : 'text-blue-700'}`}>
              {activity.procurementStatus?.replace('_', ' ') || 'Not Required'}
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200/80">
            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">03. Implementation</span>
            <span className={`font-semibold capitalize ${activity.implementationStatus === 'verified' ? 'text-emerald-700' : activity.implementationStatus === 'conducted_pending_verification' ? 'text-amber-700' : 'text-slate-600'}`}>
              {activity.implementationStatus?.replace('_', ' ') || 'Planned'}
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200/80">
            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">04. M&amp;E Verification</span>
            <span className={`font-semibold capitalize ${activity.meStatus === 'verified' ? 'text-emerald-700' : activity.meStatus === 'submitted' ? 'text-amber-700' : 'text-slate-600'}`}>
              {activity.meStatus?.replace('_', ' ') || 'Draft'}
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200/80 col-span-2 sm:col-span-1">
            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">05. Retirement</span>
            <span className={`font-semibold capitalize ${activity.retirementStatus === 'approved' ? 'text-emerald-700' : activity.retirementStatus === 'finance_review' ? 'text-amber-700' : 'text-slate-600'}`}>
              {activity.retirementStatus?.replace('_', ' ') || 'Not Started'}
            </span>
          </div>
        </div>

        {/* Notification Alerts */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 6 Lifecycle Stage Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-neutral-800 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setCurrentStage('request')}
            className={`px-3 py-2 rounded-t-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              currentStage === 'request'
                ? 'bg-amber-500/10 text-[#b45309] border-b-2 border-[#D68904]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Pre-Impl Request &amp; ToR</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStage('procurement')}
            className={`px-3 py-2 rounded-t-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              currentStage === 'procurement'
                ? 'bg-amber-500/10 text-[#b45309] border-b-2 border-[#D68904]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>2. Procurement</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStage('implementation')}
            className={`px-3 py-2 rounded-t-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              currentStage === 'implementation'
                ? 'bg-amber-500/10 text-[#b45309] border-b-2 border-[#D68904]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>3. Implementation &amp; Register ({participants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStage('me')}
            className={`px-3 py-2 rounded-t-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              currentStage === 'me'
                ? 'bg-amber-500/10 text-[#b45309] border-b-2 border-[#D68904]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>4. M&amp;E Verification</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStage('retirement')}
            className={`px-3 py-2 rounded-t-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              currentStage === 'retirement'
                ? 'bg-amber-500/10 text-[#b45309] border-b-2 border-[#D68904]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>5. Financial Retirement</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStage('dossier')}
            className={`px-3 py-2 rounded-t-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              currentStage === 'dossier'
                ? 'bg-amber-500/10 text-[#b45309] border-b-2 border-[#D68904]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>6. Activity Dossier</span>
          </button>
        </div>

        {/* STAGE 1: PRE-IMPLEMENTATION REQUEST & AUTHORIZATION */}
        {currentStage === 'request' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Activity Request Title *"
                value={requestForm.title}
                onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                placeholder="e.g. Conduct Ward Mobilization Workshop"
              />

              <Input
                type="date"
                label="Target Activity Date *"
                value={requestForm.date}
                onChange={(e) => setRequestForm({ ...requestForm, date: e.target.value })}
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Terms of Reference (ToR) & Operational Scope"
                  placeholder="Detail the target audience, session objectives, venue requirements, and methodology..."
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <Input
                type="number"
                label={`Estimated Activity Budget (${currency})`}
                value={requestForm.budget}
                onChange={(e) => setRequestForm({ ...requestForm, budget: e.target.value })}
              />

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmitRequest}
                  isLoading={isLoading}
                  className="bg-[#D68904] hover:bg-[#b45309] text-white text-xs w-full"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Submit Request &amp; ToR
                </Button>
              </div>
            </div>

            {/* Authorization Card */}
            <Card className="p-4 bg-slate-50/80 dark:bg-neutral-900/60 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-forest-700" />
                  Administrative &amp; Director Authorization Gate
                </h4>
                <Badge
                  variant={
                    activity.requestStatus === 'approved'
                      ? 'success'
                      : activity.requestStatus === 'rejected'
                      ? 'danger'
                      : activity.requestStatus === 'submitted'
                      ? 'warning'
                      : 'default'
                  }
                >
                  {activity.requestStatus?.replace('_', ' ') || 'Pending'}
                </Badge>
              </div>

              {activity.authorizedAt && (
                <div className="text-xs text-slate-600 bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-slate-200">
                  <p>
                    <strong>Authorized by:</strong> {activity.authorizedByName || 'Program Director'} on{' '}
                    {new Date(activity.authorizedAt).toLocaleDateString()}
                  </p>
                  {activity.authorizationComments && (
                    <p className="mt-1 italic text-slate-500">"{activity.authorizationComments}"</p>
                  )}
                </div>
              )}

              {isManagerOrAbove && activity.requestStatus === 'submitted' && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <Input
                    label="Authorization Comments / Directives"
                    placeholder="Provide specific notes or condition of approval..."
                    value={authComments}
                    onChange={(e) => setAuthComments(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleAuthorizeRequest('approved')}
                      isLoading={isLoading}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Authorize &amp; Approve Activity
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleAuthorizeRequest('rejected')}
                      isLoading={isLoading}
                      className="text-xs"
                    >
                      Reject Request
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STAGE 2: PROCUREMENT */}
        {currentStage === 'procurement' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2 text-xs text-blue-950">
              <span className="font-bold uppercase tracking-wider block">Procurement Management &amp; Supply Link</span>
              <p>
                Link purchase requisitions, quotations, and purchase orders for workshop materials, catering, and transport.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Procurement Status"
                value={procurementStatus}
                onChange={(e) => handleUpdateProcurement(e.target.value as ProcurementStatus)}
                options={[
                  { value: 'not_required', label: 'Not Required (Direct Operational)' },
                  { value: 'not_started', label: 'Not Started' },
                  { value: 'requisition', label: 'Requisition Raised' },
                  { value: 'quotations', label: 'Quotations Under Review' },
                  { value: 'order_approved', label: 'Purchase Order Approved' },
                  { value: 'ordered', label: 'Ordered / Dispatched' },
                  { value: 'partially_delivered', label: 'Partially Delivered' },
                  { value: 'delivered', label: 'Delivered & Confirmed at Venue' },
                ]}
              />

              <div className="p-4 bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <span className="font-bold text-slate-800 block">Estimated Procurement Budget:</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {currency} {Number(activity.budgetEstimated || 0).toLocaleString()}
                </span>
                <p className="text-[11px] text-slate-500">
                  POs linked to this activity will be automatically reconciled against the financial retirement ledger.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: FIELD IMPLEMENTATION & ATTENDANCE REGISTER */}
        {currentStage === 'implementation' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Execution Ward / Venue Location"
                value={implForm.location}
                onChange={(e) => setImplForm({ ...implForm, location: e.target.value })}
                placeholder="e.g. Kigamboni Youth Center Hall"
              />

              <Input
                type="number"
                label="Total Participants Count"
                value={implForm.participantsCount}
                onChange={(e) => setImplForm({ ...implForm, participantsCount: parseInt(e.target.value, 10) || 0 })}
              />

              <div className="sm:col-span-2">
                <Textarea
                  label="Field Qualitative Narrative & Achievements"
                  placeholder="Summarize key discussions, stakeholder engagement, outcomes, and feedback..."
                  value={implForm.progress}
                  onChange={(e) => setImplForm({ ...implForm, progress: e.target.value })}
                  rows={3}
                />
              </div>

              <Textarea
                label="Operational Challenges Encountered"
                placeholder="Challenges faced (weather, venue, delays, etc.)..."
                value={implForm.challenges}
                onChange={(e) => setImplForm({ ...implForm, challenges: e.target.value })}
                rows={2}
              />

              <Textarea
                label="Follow-up Action Items & Deadlines"
                placeholder="Post-activity tasks, participant mentorship, etc..."
                value={implForm.followUpActions}
                onChange={(e) => setImplForm({ ...implForm, followUpActions: e.target.value })}
                rows={2}
              />
            </div>

            {/* Individual Participant Attendance Roster */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-forest-700" />
                    Individual Disaggregated Attendance Register ({participants.length} recorded)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Captures full participant disaggregation (Gender, Age Group, Per Diem) for clean deduplication.
                  </p>
                </div>
              </div>

              {/* Add Attendee Row */}
              <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs">
                <div className="sm:col-span-2">
                  <Input
                    placeholder="Full Name *"
                    value={newAttendee.fullName}
                    onChange={(e) => setNewAttendee({ ...newAttendee, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <Select
                    value={newAttendee.gender}
                    onChange={(e) => setNewAttendee({ ...newAttendee, gender: e.target.value as any })}
                    options={[
                      { value: 'female', label: 'Female' },
                      { value: 'male', label: 'Male' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                </div>
                <div>
                  <Select
                    value={newAttendee.ageGroup}
                    onChange={(e) => setNewAttendee({ ...newAttendee, ageGroup: e.target.value as any })}
                    options={[
                      { value: 'children_0_12', label: 'Child (0-12)' },
                      { value: 'youth_13_24', label: 'Youth (13-24)' },
                      { value: 'adults_25_59', label: 'Adult (25-59)' },
                      { value: 'elderly_60_plus', label: 'Elderly (60+)' },
                    ]}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Per Diem (TZS)"
                    type="number"
                    value={newAttendee.perDiem}
                    onChange={(e) => setNewAttendee({ ...newAttendee, perDiem: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAttendee}
                    className="w-full text-xs text-forest-700 border-forest-600 hover:bg-forest-50"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Attendee
                  </Button>
                </div>
              </div>

              {/* Roster Table */}
              {participants.length > 0 && (
                <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Participant Name</th>
                        <th className="py-2 px-3">Gender</th>
                        <th className="py-2 px-3">Age Group</th>
                        <th className="py-2 px-3">Per Diem Received</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {participants.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-1.5 px-3 font-medium text-slate-900">{p.fullName}</td>
                          <td className="py-1.5 px-3 capitalize">{p.gender}</td>
                          <td className="py-1.5 px-3">{p.ageGroup?.replace('_', ' ')}</td>
                          <td className="py-1.5 px-3 font-mono">
                            {currency} {p.perDiemReceived.toLocaleString()}
                          </td>
                          <td className="py-1.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveAttendee(idx)}
                              className="text-red-600 hover:text-red-800 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSaveImplementation}
                  isLoading={isLoading}
                  className="bg-forest-700 hover:bg-forest-800 text-white text-xs"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Save Implementation &amp; Submit to M&amp;E
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 4: M&E VERIFICATION */}
        {currentStage === 'me' && (
          <div className="space-y-4">
            {/* Demographic Tally Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Reached</span>
                <span className="text-xl font-bold text-slate-900 font-mono">{participants.length}</span>
                <span className="text-[10px] text-slate-400 block">Target: {activity.targetParticipants || 0}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                <span className="block text-[10px] uppercase font-bold">Female Attendees</span>
                <span className="text-xl font-bold font-mono">{femaleCount}</span>
                <span className="text-[10px] block font-semibold">{participants.length > 0 ? Math.round((femaleCount / participants.length) * 100) : 0}%</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-900">
                <span className="block text-[10px] uppercase font-bold">Male Attendees</span>
                <span className="text-xl font-bold font-mono">{maleCount}</span>
                <span className="text-[10px] block font-semibold">{participants.length > 0 ? Math.round((maleCount / participants.length) * 100) : 0}%</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
                <span className="block text-[10px] uppercase font-bold">Youth (13-24)</span>
                <span className="text-xl font-bold font-mono">{youthCount}</span>
                <span className="text-[10px] block">Disaggregated</span>
              </div>
            </div>

            {/* M&E Sign-off Card */}
            <Card className="p-4 bg-slate-50/80 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-forest-700" />
                  M&amp;E Result Verification Sign-Off
                </h4>
                <Badge variant={activity.meStatus === 'verified' ? 'success' : 'warning'}>
                  {activity.meStatus?.replace('_', ' ') || 'Pending'}
                </Badge>
              </div>

              {activity.reviewedAt && (
                <p className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-200">
                  Verified by: <strong>{activity.reviewedByName || 'M&E Officer'}</strong> on{' '}
                  {new Date(activity.reviewedAt).toLocaleDateString()}
                  {activity.reviewComments && <span className="block mt-1 italic">"{activity.reviewComments}"</span>}
                </p>
              )}

              {isManagerOrAbove && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <Input
                    label="M&E Verification Notes"
                    placeholder="Confirm attendance register validity and indicator alignment..."
                    value={meComments}
                    onChange={(e) => setMeComments(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleVerifyMe('verified')}
                      isLoading={isLoading}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Verify &amp; Lock KPI Results
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleVerifyMe('returned_for_correction')}
                      isLoading={isLoading}
                      className="text-xs"
                    >
                      Return to Field Lead
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STAGE 5: FINANCIAL RETIREMENT & RECEIPTS */}
        {currentStage === 'retirement' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Approved Budget Advance</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {currency} {Number(activity.budgetEstimated || 0).toLocaleString()}
                </span>
              </div>

              <Input
                type="number"
                label={`Actual Reconciled Expenditure (${currency}) *`}
                value={retForm.retiredAmount}
                onChange={(e) => setRetForm({ ...retForm, retiredAmount: e.target.value })}
              />

              <Input
                type="number"
                label="Physical Receipts & Vouchers Attached *"
                value={retForm.receiptsCount}
                onChange={(e) => setRetForm({ ...retForm, receiptsCount: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            {/* Variance indicator */}
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
              <span>
                <strong>Calculated Variance Balance:</strong>{' '}
                {currency} {((activity.budgetEstimated || 0) - (parseFloat(retForm.retiredAmount) || 0)).toLocaleString()}
              </span>
              <Badge variant={(activity.budgetEstimated || 0) >= (parseFloat(retForm.retiredAmount) || 0) ? 'success' : 'danger'}>
                {(activity.budgetEstimated || 0) >= (parseFloat(retForm.retiredAmount) || 0) ? 'Within Budget' : 'Budget Overrun'}
              </Badge>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmitRetirement}
                isLoading={isLoading}
                className="bg-[#D68904] hover:bg-[#b45309] text-white text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Submit Financial Retirement to Finance
              </Button>
            </div>

            {/* Finance Review & Approval Card */}
            {(isFinanceOfficer || isManagerOrAbove) && activity.retirementStatus === 'finance_review' && (
              <Card className="p-4 bg-emerald-50/60 border border-emerald-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-700" />
                  Finance Officer Audit &amp; Reconciliation Sign-off
                </h4>
                <p className="text-xs text-emerald-800">
                  Verify attached physical receipts, participant per-diem signatures, and ledger refund balance.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleApproveRetirement('approved')}
                    isLoading={isLoading}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Approve Financial Retirement
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleApproveRetirement('returned')}
                    isLoading={isLoading}
                    className="text-xs"
                  >
                    Return for Receipt Corrections
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* STAGE 6: FINAL ACTIVITY DOSSIER */}
        {currentStage === 'dossier' && (
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 rounded-xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Final Certified Activity Dossier</h3>
                  <p className="text-slate-500">Activity Code: {activity.activityCode || 'ACT'}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="flex items-center gap-1 text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Export Dossier
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Activity Date</span>
                  <span className="font-semibold">{activity.activityDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Venue / Ward</span>
                  <span className="font-semibold">{activity.wardLocation || activity.location || 'Temeke'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Verified Attendees</span>
                  <span className="font-semibold">{participants.length} reached</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Reconciled Spend</span>
                  <span className="font-semibold font-mono">
                    {currency} {Number(activity.retiredAmount || activity.budgetEstimated || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="font-bold text-slate-800 block uppercase text-[10px] tracking-wider">Audit Trace &amp; Governance Signatures:</span>
                <ul className="space-y-1 text-slate-600">
                  <li>• Pre-implementation ToR authorized by: <strong>{activity.authorizedByName || 'Program Director'}</strong></li>
                  <li>• Field implementation logged by: <strong>{activity.submittedByName || 'Field Coordinator'}</strong></li>
                  <li>• M&amp;E Verification stamped by: <strong>{activity.reviewedByName || 'M&E Specialist'}</strong></li>
                  <li>• Financial Retirement audited by: <strong>{activity.retirementApprovedByName || 'Finance Controller'}</strong></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
