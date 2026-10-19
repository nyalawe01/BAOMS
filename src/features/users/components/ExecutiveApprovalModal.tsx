import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building,
  User,
  Briefcase,
  FolderKanban,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ROLES, RoleCode } from '@/lib/permissions';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { createNotification } from '@/services/notificationsService';
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from '@/lib/ToastContext';
import { createStaffFromUserCreation } from '@/features/hr/services/hrService';
import { PendingUserCandidate } from './UserOnboardingReviewModal';

interface ExecutiveApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: PendingUserCandidate | null;
  onSuccess: () => void;
}

export const ExecutiveApprovalModal: React.FC<ExecutiveApprovalModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user: currentActor, hasRole, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Only Executive Director (and System Administrator) can authorize accounts.
  // The ED only reads details and approves or disapproves; editing details is restricted to HR.
  const canAuthorize = hasRole('executive_director') || hasRole('system_admin');
  if (!isOpen || !user || !canAuthorize) return null;

  const staged = user.stagedDetails || {};
  const assignedRoleCode: RoleCode = staged.roleCode || ROLES.PROJECT_COORDINATOR;
  const departmentName = staged.departmentName || 'Projects & Programs';
  const jobTitle = staged.jobTitle || 'Field Coordinator';

  const handleApprove = async () => {
    setIsSubmitting(true);

    try {
      if (isSupabaseConfigured) {
        // 1. Resolve role ID
        const { data: roleRow, error: roleErr } = await supabase
          .from('roles')
          .select('id')
          .eq('code', assignedRoleCode)
          .single();

        if (roleErr || !roleRow) {
          throw new Error(`Role ${assignedRoleCode} not found in database.`);
        }

        // 2. Resolve department ID if available
        let deptId = null;
        if (staged.departmentCode) {
          const { data: deptRow } = await supabase
            .from('departments')
            .select('id')
            .eq('code', staged.departmentCode)
            .maybeSingle();
          deptId = deptRow?.id || null;
        }

        // 3. Update Profile to 'approved' and active
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({
            approval_status: 'approved',
            is_active: true,
            department_id: deptId,
            ed_approved_by: currentActor?.id,
            ed_approved_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (profileErr) throw profileErr;

        // 4. Assign role into user_roles
        await supabase.from('user_roles').delete().eq('user_id', user.id);
        const { error: roleAssignErr } = await supabase.from('user_roles').insert({
          user_id: user.id,
          role_id: roleRow.id,
          assigned_by: currentActor?.id,
        });

        if (roleAssignErr) throw roleAssignErr;
      }

      // 5. Populate HR Staff Profile Record
      try {
        await createStaffFromUserCreation({
          userId: user.id,
          fullName: staged.fullName || user.displayName,
          personalEmail: staged.personalEmail || null,
          officialEmail: user.email,
          phoneNumber: staged.phone || user.phoneNumber || '+255 754 000 000',
          departmentCode: staged.departmentCode || 'PRJ',
          departmentName,
          jobTitle,
        });
      } catch (hrErr) {
        console.warn('HR staff sync notice:', hrErr);
      }

      // 6. Send notifications
      createNotification({
        title: 'Staff Access Approved & Activated',
        message: `${staged.fullName || user.displayName} has been authorized by the Executive Director as ${assignedRoleCode.replace(/_/g, ' ')} in ${departmentName}. Full system permissions active.`,
        type: 'hr',
        targetRole: 'all',
        link: '/users',
      });

      showToast({
        title: '🎉 Account Authorized & Activated',
        message: `${staged.fullName || user.displayName} can now access their ${assignedRoleCode.replace(/_/g, ' ')} dashboard.`,
        variant: 'success',
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      showToast({
        title: 'Authorization Error',
        message: err instanceof Error ? err.message : 'Failed to authorize user.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast({ title: 'Reason Required', message: 'Please provide instructions or reason for rejection.', variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('profiles')
          .update({
            approval_status: 'rejected',
            is_active: false,
            rejection_reason: rejectionReason.trim(),
          })
          .eq('id', user.id);
      }

      // Notify HR of the disapproval with instructions
      createNotification({
        title: 'Candidate Registration Disapproved',
        message: `Executive Director disapproved ${staged.fullName || user.displayName}. Reason: ${rejectionReason.trim()}`,
        type: 'hr',
        targetRole: 'hr_administrator',
        link: '/users',
      });

      showToast({
        title: 'Registration Disapproved',
        message: 'The candidate dossier has been disapproved and returned to HR records.',
        variant: 'warning',
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      showToast({
        title: 'Rejection Failed',
        message: err instanceof Error ? err.message : 'Could not decline candidate.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Executive Director Authorization"
      description="Executive Clearance Gate — Review vetted candidate information and authorize account creation."
      size="lg"
    >
      <div className="space-y-5">
        <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-950 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#D68904] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-[#92400e]">Executive Clearance (Read-Only)</h4>
            <p className="mt-1 text-amber-900 leading-relaxed text-[11px]">
              Human Resources has collected, vetted, and submitted all candidate records.
              As Executive Director, your mandate is to review the submission and grant or decline final institutional clearance.
              Editing personnel records is strictly the responsibility of the HR Department.
            </p>
          </div>
        </div>

        {/* Read-Only Dossier Presentation */}
        <div className="space-y-3">
          {/* Personal Information */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Personal & Contact Information (Vetted by HR)
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Full Legal Name</span>
                <span className="font-bold text-slate-900 text-sm">{staged.fullName || user.displayName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Official Email</span>
                <span className="font-mono text-slate-800">{user.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Personal Email</span>
                <span className="text-slate-700 font-mono">{staged.personalEmail || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Phone Number</span>
                <span className="text-slate-700">{staged.phone || user.phoneNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">National ID (NIDA)</span>
                <span className="text-slate-700 font-mono">{staged.nida || 'Verified by HR'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Date of Birth / Gender</span>
                <span className="text-slate-700">{staged.dob || 'N/A'} • {(staged.gender || 'N/A').toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Appointment & Role Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              Institutional Appointment & Authorization
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Appointed System Role</span>
                <Badge variant="info" className="mt-1 font-semibold text-xs">
                  {assignedRoleCode.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Assigned Department</span>
                <span className="font-semibold text-slate-900">{departmentName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Official Job Title</span>
                <span className="text-slate-800 font-medium">{jobTitle}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Contract / Employment Type</span>
                <span className="text-slate-800 capitalize">{(staged.employmentType || 'fixed_term').replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Contract Start Date</span>
                <span className="text-slate-800">{staged.startDate || 'Immediate'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Reporting Supervisor</span>
                <span className="text-slate-800">{staged.supervisor || 'Executive Office'}</span>
              </div>
            </div>
          </div>

          {/* Access Scopes */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
              Approved Access Scopes
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Assigned Projects</span>
                <span className="text-slate-800 font-medium">
                  {(staged.allowedProjectIds || []).length > 0
                    ? (staged.allowedProjectIds || []).join(', ')
                    : 'Standard Department Scope'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Document Scopes</span>
                <span className="text-slate-800 font-medium">
                  {(staged.allowedDocScopes || []).length > 0
                    ? (staged.allowedDocScopes || []).join(', ')
                    : 'Standard Institutional Documentation'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* HR Remarks Card */}
        {staged.hrNotes && (
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-700">
            <span className="font-bold text-slate-800 block text-[11px] mb-1">HR Department Vetting Remarks:</span>
            <p className="italic text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">{staged.hrNotes}</p>
          </div>
        )}

        {/* Rejection form expand */}
        {showRejectForm && (
          <div className="space-y-2 p-3 bg-red-50/60 border border-red-200 rounded-lg text-xs animate-fadeIn">
            <label className="block font-semibold text-red-900">
              State Rejection Reason / Instructions:
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              className="w-full text-xs p-2 rounded border border-red-300 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Candidate not in staff records, invalid domain, etc..."
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div>
            {!showRejectForm ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
              >
                Reject Request
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="text-xs bg-red-600 text-white hover:bg-red-700 border-transparent"
                >
                  Confirm Rejection
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowRejectForm(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-xs">
              Close
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="text-xs flex items-center gap-2 bg-[#D68904] hover:bg-[#b86e03] shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Authorizing...' : 'Authorize & Activate Access'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
