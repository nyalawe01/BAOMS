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

  // HR Administrators and System Admins share final authorization rights with the Executive Director.
  // Only block the modal for roles that have NO authorization access (e.g. project coordinators, finance, etc.).
  const canAuthorize =
    hasRole('executive_director') ||
    hasRole('hr_administrator') ||
    hasRole('system_admin') ||
    isAdmin();
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
        message: `${staged.fullName || user.displayName} has been approved as ${assignedRoleCode.replace(/_/g, ' ')} in ${departmentName}. Full system permissions active.`,
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
      showToast({ title: 'Reason Required', message: 'Please provide a reason for rejection.', variant: 'error' });
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

      showToast({
        title: 'Registration Rejected',
        message: 'The candidate registration has been denied.',
        variant: 'warning',
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      showToast({
        title: 'Rejection Failed',
        message: err instanceof Error ? err.message : 'Could not reject candidate.',
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
      description="Final executive clearance to provision staff role, department, and workspace access."
      size="lg"
    >
      <div className="space-y-6">
        <div className="p-3.5 rounded-lg bg-surface-muted/50 border border-surface-border text-xs text-charcoal-800 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-charcoal-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-charcoal-900">Executive Clearance Gate</h4>
            <p className="mt-1 text-charcoal-muted leading-relaxed">
              Human Resources has vetted this staff registration and submitted the recommended role and access scopes.
              Granting approval will activate the user's login and provision their respective dashboard.
            </p>
          </div>
        </div>

        {/* Dossier Overview Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-500 block text-[11px]">Staff Name</span>
            <span className="font-bold text-slate-900 text-sm">{staged.fullName || user.displayName}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Official Email</span>
            <span className="font-mono text-slate-800">{user.email}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Assigned Role</span>
            <Badge variant="info" className="mt-0.5 font-semibold">
              {assignedRoleCode.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Department</span>
            <span className="font-semibold text-slate-900">{departmentName}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Official Job Title</span>
            <span className="text-slate-800">{jobTitle}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Phone Number</span>
            <span className="text-slate-800">{staged.phone || user.phoneNumber || 'N/A'}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Assigned Projects</span>
            <span className="text-slate-800 font-medium">
              {(staged.allowedProjectIds || []).length > 0
                ? (staged.allowedProjectIds || []).join(', ')
                : 'General Organization Scopes'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Documentation Scopes</span>
            <span className="text-slate-800 font-medium">
              {(staged.allowedDocScopes || []).length > 0
                ? (staged.allowedDocScopes || []).join(', ')
                : 'All standard department documentation'}
            </span>
          </div>
        </div>

        {staged.hrNotes && (
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
            <span className="font-bold text-slate-800 block text-[11px] mb-1">HR Remarks:</span>
            <p className="italic text-slate-600">{staged.hrNotes}</p>
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
