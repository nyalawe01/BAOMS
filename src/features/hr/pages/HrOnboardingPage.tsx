import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserPlus,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Building,
  Mail,
  Phone,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { UserOnboardingReviewModal, PendingUserCandidate } from '@/features/users/components/UserOnboardingReviewModal';
import { CompleteHrOnboardingModal } from '../components/CompleteHrOnboardingModal';
import { CompleteStatutoryModal } from '../components/CompleteStatutoryModal';
import { StaffDetailModal } from '../components/StaffDetailModal';
import { getStaffProfiles } from '../services/hrService';
import { StaffProfileRecord } from '../types/hr';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface OnboardingTask {
  id: string;
  title: string;
  owner: string;
  category: 'hr' | 'finance' | 'it' | 'security';
  isComplete: boolean;
  dueDate: string;
}

export const HrOnboardingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'pending_vetting' | 'onboarding_tracker' | 'recent_inductions'>('pending_vetting');
  const [candidates, setCandidates] = useState<PendingUserCandidate[]>([]);
  const [staffList, setStaffList] = useState<StaffProfileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedCandidate, setSelectedCandidate] = useState<PendingUserCandidate | null>(null);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfileRecord | null>(null);
  const [isHrModalOpen, setIsHrModalOpen] = useState(false);
  const [isStatutoryModalOpen, setIsStatutoryModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allStaff = await getStaffProfiles();
      setStaffList(allStaff);

      if (isSupabaseConfigured) {
        const { data: pRows } = await supabase
          .from('profiles')
          .select(`
            id,
            display_name,
            official_email,
            phone_number,
            approval_status,
            staged_details,
            created_at
          `)
          .in('approval_status', ['pending_hr', 'pending_ed'])
          .order('created_at', { ascending: false });

        if (pRows) {
          setCandidates(
            pRows.map((r: any) => ({
              id: r.id,
              email: r.official_email || '',
              displayName: r.display_name || r.official_email?.split('@')[0] || 'Incoming Staff',
              phoneNumber: r.phone_number || '',
              approvalStatus: r.approval_status,
              createdAt: r.created_at,
              stagedDetails: r.staged_details || {},
            }))
          );
        }
      }
    } catch (e) {
      console.warn('Failed loading onboarding workspace:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Candidates awaiting HR vetting specifically
  const awaitingHr = candidates.filter((c) => c.approvalStatus === 'pending_hr');
  const awaitingEd = candidates.filter((c) => c.approvalStatus === 'pending_ed');

  // Staff in active onboarding (step < 4 or status != completed)
  const activeOnboardingStaff = staffList.filter(
    (s) => s.onboardingStatus === 'pending_hr' || s.onboardingStatus === 'pending_finance' || (s.onboardingStep && s.onboardingStep < 4)
  );

  // Completed inductees (recent 10)
  const completedInductees = staffList.filter(
    (s) => (!s.onboardingStatus || s.onboardingStatus === 'completed') && s.employmentStatus === 'active'
  ).slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment & Staff Onboarding Command"
        subtitle="Vetting applicant credentials, conducting HR clearances, managing statutory inductions, and tracking probation milestones."
        breadcrumbs={[
          { label: 'HR Dashboard', href: '/' },
          { label: 'Staff Directory', href: '/hr' },
          { label: 'Recruitment & Onboarding' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Sync Data
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/users')}>
              Manage Accounts & Roles
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/hr/staff/new')}>
              <UserPlus className="h-4 w-4 mr-1.5" />
              Register New Staff
            </Button>
          </div>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Awaiting HR Review</span>
            <Clock className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono tabular-nums leading-tight ${awaitingHr.length > 0 ? 'text-amber-600' : 'text-charcoal-900'}`}>
            {awaitingHr.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            New self-registered staff awaiting HR review
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Awaiting ED Sign-off</span>
            <ShieldCheck className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-900">
            {awaitingEd.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Vetted dossiers pending Executive approval
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>In-Progress Onboarding</span>
            <FileCheck className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-900">
            {activeOnboardingStaff.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Staff completing NIDA, bank & statutory files
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Recent Inductions</span>
            <CheckCircle2 className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-emerald-700">
            {completedInductees.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Fully certified personnel active in departments
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('pending_vetting')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'pending_vetting'
              ? 'border-charcoal-900 text-charcoal-900 font-bold'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Clock className="h-4 w-4 text-charcoal-700" />
          <span>Clearance Vetting Queue ({awaitingHr.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('onboarding_tracker')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'onboarding_tracker'
              ? 'border-charcoal-900 text-charcoal-900 font-bold'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <FileCheck className="h-4 w-4 text-charcoal-700" />
          <span>Induction & Checklist Tracker ({activeOnboardingStaff.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('recent_inductions')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'recent_inductions'
              ? 'border-charcoal-900 text-charcoal-900 font-bold'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-charcoal-700" />
          <span>Completed Staff Inductions ({completedInductees.length})</span>
        </button>
      </div>

      {/* TAB 1: Clearance Vetting Queue */}
      {activeTab === 'pending_vetting' && (
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">
                Staff Awaiting HR Clearance & Vetting ({awaitingHr.length})
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Staff members who registered through the portal. Review personal records, assign department and authorized roles, then submit to the Executive Director for authorization.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-4">Applicant Name</th>
                  <th className="py-2.5 px-4">Official Email</th>
                  <th className="py-2.5 px-4">Contact Phone</th>
                  <th className="py-2.5 px-4">Registration Date</th>
                  <th className="py-2.5 px-4">Vetting Stage</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {awaitingHr.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-charcoal-muted text-xs">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                      All applicant clearances are up to date. No pending candidates awaiting HR review.
                    </td>
                  </tr>
                ) : (
                  awaitingHr.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-charcoal-900">
                        {candidate.displayName}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-charcoal-700">
                        {candidate.email}
                      </td>
                      <td className="py-3 px-4 text-xs text-charcoal-600">
                        {candidate.phoneNumber || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-charcoal-500">
                        {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Pending HR Review
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setIsOnboardingModalOpen(true);
                          }}
                          className="bg-charcoal-900 hover:bg-black text-white text-xs py-1 px-3 h-auto"
                        >
                          Review & Onboard
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Induction & Checklist Tracker */}
      {activeTab === 'onboarding_tracker' && (
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-surface-border bg-surface-muted/20">
            <h3 className="text-sm font-bold text-charcoal-900">
              Active Induction Milestones & Statutory Checklists ({activeOnboardingStaff.length})
            </h3>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Track submission of national IDs (NIDA), tax numbers (TIN), statutory funds (NSSF/PSSSF), and bank accounts.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Department & Role</th>
                  <th className="py-2.5 px-4 text-center">NIDA</th>
                  <th className="py-2.5 px-4 text-center">Bank Account</th>
                  <th className="py-2.5 px-4 text-center">Statutory (NSSF)</th>
                  <th className="py-2.5 px-4">Onboarding Step</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {activeOnboardingStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-charcoal-muted text-xs">
                      All active staff have completed statutory documentation.
                    </td>
                  </tr>
                ) : (
                  activeOnboardingStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal-900">{staff.fullName}</div>
                        <div className="text-[11px] font-mono text-charcoal-muted">{staff.staffNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-charcoal-800">{staff.jobTitle}</div>
                        <div className="text-[11px] text-charcoal-muted">{staff.departmentName}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {staff.nidaNumber ? (
                          <span className="text-emerald-700 font-mono text-xs font-bold">✓ {staff.nidaNumber.substring(0, 8)}...</span>
                        ) : (
                          <span className="text-amber-600 text-xs italic">Missing</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {staff.bankAccountNumber ? (
                          <span className="text-emerald-700 font-mono text-xs font-bold">✓ {staff.bankName || 'Verified'}</span>
                        ) : (
                          <span className="text-amber-600 text-xs italic">Missing</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {staff.nssfNumber || staff.pssfNumber ? (
                          <span className="text-emerald-700 font-mono text-xs font-bold">✓ Filed</span>
                        ) : (
                          <span className="text-amber-600 text-xs italic">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-charcoal-800">
                          Step {staff.onboardingStep || 2} of 4
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaff(staff);
                              setIsHrModalOpen(true);
                            }}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-charcoal-800 hover:bg-slate-200"
                          >
                            Update Dossier
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaff(staff);
                              setIsStatutoryModalOpen(true);
                            }}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-charcoal-50 text-charcoal-800 hover:bg-charcoal-100"
                          >
                            Bank/Tax
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Completed Inductions */}
      {activeTab === 'recent_inductions' && (
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-surface-border bg-surface-muted/20">
            <h3 className="text-sm font-bold text-charcoal-900">
              Successfully Inducted Staff ({completedInductees.length})
            </h3>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Staff members with complete files, approved system roles, and statutory compliance.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Department & Role</th>
                  <th className="py-2.5 px-4">Employment Type</th>
                  <th className="py-2.5 px-4">Start Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {completedInductees.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-charcoal-900">{staff.fullName}</div>
                      <div className="text-[11px] font-mono text-charcoal-muted">{staff.staffNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-charcoal-800">{staff.jobTitle}</div>
                      <div className="text-[11px] text-charcoal-muted">{staff.departmentName}</div>
                    </td>
                    <td className="py-3 px-4 text-xs capitalize text-charcoal-700">
                      {staff.contractType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-charcoal-600">
                      {staff.startDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Fully Onboarded
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaff(staff);
                          setIsDetailModalOpen(true);
                        }}
                        className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-charcoal-800 hover:bg-slate-200"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stepper Onboarding Modal */}
      <UserOnboardingReviewModal
        isOpen={isOnboardingModalOpen}
        onClose={() => {
          setIsOnboardingModalOpen(false);
          setSelectedCandidate(null);
        }}
        user={selectedCandidate}
        onSuccess={loadData}
      />

      {/* Complete HR Dossier Modal */}
      <CompleteHrOnboardingModal
        isOpen={isHrModalOpen}
        onClose={() => {
          setIsHrModalOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
        onSuccess={loadData}
      />

      {/* Complete Statutory Details Modal */}
      <CompleteStatutoryModal
        isOpen={isStatutoryModalOpen}
        onClose={() => {
          setIsStatutoryModalOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
        onSuccess={loadData}
      />

      {/* Full Staff Dossier Detail Modal */}
      <StaffDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
        onStaffUpdated={loadData}
      />
    </div>
  );
};

export default HrOnboardingPage;
