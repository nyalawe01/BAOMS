import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Award,
  CheckCircle2,
  Clock,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  Building,
  User,
  GraduationCap,
  Download,
  FileCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { getStaffProfiles } from '../services/hrService';
import { StaffProfileRecord } from '../types/hr';

interface PerformanceReview {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  reviewPeriod: string;
  reviewerName: string;
  reviewDate: string;
  ratingScore: number; // 1-5
  status: 'completed' | 'scheduled' | 'overdue';
  keyAccomplishments: string;
  areasForDevelopment: string;
}

interface TrainingSession {
  id: string;
  title: string;
  provider: string;
  category: string;
  trainingDate: string;
  durationHours: number;
  participantsCount: number;
  participants: string[];
  status: 'completed' | 'scheduled';
  certified: boolean;
}

const STATIC_PERFORMANCE_REVIEWS: PerformanceReview[] = [
  {
    id: 'rev-1',
    staffId: 'stf-001',
    staffName: 'Emmanuel S. Kimaro',
    department: 'Programs & Delivery',
    reviewPeriod: 'Q3 2026 Annual Appraisal',
    reviewerName: 'Rehema Mwenda (Executive Director)',
    reviewDate: '2026-09-28',
    ratingScore: 4.8,
    status: 'completed',
    keyAccomplishments: 'Successfully delivered Yombo Dovya Community Center Phase 2 milestones under budget.',
    areasForDevelopment: 'Deepen monitoring automation across field child safeguarding reports.',
  },
  {
    id: 'rev-2',
    staffId: 'stf-002',
    staffName: 'Amina Salum',
    department: 'Finance & Operations',
    reviewPeriod: 'Mid-Year Review 2026',
    reviewerName: 'Rehema Mwenda (Executive Director)',
    reviewDate: '2026-07-15',
    ratingScore: 4.9,
    status: 'completed',
    keyAccomplishments: 'Zero audit variance in external grant reconciliation for USAID & UNICEF partner funds.',
    areasForDevelopment: 'Transition petty cash reconciliations fully to mobile digital ledgers.',
  },
  {
    id: 'rev-3',
    staffId: 'stf-003',
    staffName: 'Geofrey M. Temba',
    department: 'Procurement & Logistics',
    reviewPeriod: 'Q3 2026 Performance Check',
    reviewerName: 'Amina Salum (Finance Officer)',
    reviewDate: '2026-10-05',
    ratingScore: 4.5,
    status: 'completed',
    keyAccomplishments: 'Streamlined quotation comparative evaluations and maintained 100% verified vendor dossiers.',
    areasForDevelopment: 'Speed up physical warehouse stock reconciliation cycle times.',
  },
  {
    id: 'rev-4',
    staffId: 'stf-004',
    staffName: 'Neema Mwita',
    department: 'Monitoring & Evaluation',
    reviewPeriod: 'Annual Staff Appraisal 2026',
    reviewerName: 'Rehema Mwenda (Executive Director)',
    reviewDate: '2026-10-25',
    ratingScore: 0,
    status: 'scheduled',
    keyAccomplishments: 'Pending formal review session.',
    areasForDevelopment: 'Pending formal review session.',
  },
];

const STATIC_TRAININGS: TrainingSession[] = [
  {
    id: 'trn-1',
    title: 'Child Safeguarding & Protection Policy Protocol (CSoP)',
    provider: 'Tanzania National Child Welfare Council',
    category: 'Safeguarding & Governance',
    trainingDate: '2026-08-14',
    durationHours: 16,
    participantsCount: 18,
    participants: ['Emmanuel S. Kimaro', 'Grace M. Mlay', 'Elinami Munuo', 'Peter J. Massawe'],
    status: 'completed',
    certified: true,
  },
  {
    id: 'trn-2',
    title: 'IPSAS Financial Grant Reporting & Donor Audit Readiness',
    provider: 'National Board of Accountants & Auditors (NBAA)',
    category: 'Finance & Compliance',
    trainingDate: '2026-09-02',
    durationHours: 24,
    participantsCount: 4,
    participants: ['Amina Salum', 'Faraja K. Mhando', 'Elinami Munuo'],
    status: 'completed',
    certified: true,
  },
  {
    id: 'trn-3',
    title: 'Public Procurement Act 2024 Compliance & Value for Money',
    provider: 'Procurement and Supplies Professionals and Technicians Board (PSPTB)',
    category: 'Procurement & Tenders',
    trainingDate: '2026-09-20',
    durationHours: 12,
    participantsCount: 3,
    participants: ['Geofrey M. Temba', 'Amina Salum'],
    status: 'completed',
    certified: true,
  },
  {
    id: 'trn-4',
    title: 'Modern HR Workforce Analytics & Statutory Compliance',
    provider: 'Association of Tanzania Employers (ATE)',
    category: 'Human Resources',
    trainingDate: '2026-11-10',
    durationHours: 16,
    participantsCount: 2,
    participants: ['Elinami Munuo'],
    status: 'scheduled',
    certified: true,
  },
];

export const HrPerformancePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'appraisals' | 'trainings'>('appraisals');
  const [reviews, setReviews] = useState<PerformanceReview[]>(STATIC_PERFORMANCE_REVIEWS);
  const [trainings, setTrainings] = useState<TrainingSession[]>(STATIC_TRAININGS);
  const [staffList, setStaffList] = useState<StaffProfileRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [isReviewDetailOpen, setIsReviewDetailOpen] = useState(false);
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);
  const [isAddTrainingOpen, setIsAddTrainingOpen] = useState(false);

  // New review form
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [reviewPeriod, setReviewPeriod] = useState('Annual Appraisal 2026');
  const [reviewerName, setReviewerName] = useState('Elinami Munuo (HR Administrator)');
  const [ratingScore, setRatingScore] = useState(4.5);
  const [accomplishments, setAccomplishments] = useState('');
  const [improvements, setImprovements] = useState('');

  // New training form
  const [trainingTitle, setTrainingTitle] = useState('');
  const [trainingProvider, setTrainingProvider] = useState('');
  const [trainingCategory, setTrainingCategory] = useState('General Staff Development');
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().split('T')[0]);
  const [trainingHours, setTrainingHours] = useState(16);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await getStaffProfiles();
      setStaffList(records);
    } catch (e) {
      console.warn('Performance telemetry notice:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(
      (r) =>
        r.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reviewPeriod.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [reviews, searchQuery]);

  const filteredTrainings = useMemo(() => {
    return trainings.filter(
      (t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [trainings, searchQuery]);

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    const stf = staffList.find((s) => s.id === selectedStaffId) || staffList[0];
    const newRev: PerformanceReview = {
      id: `rev-${Date.now()}`,
      staffId: stf?.id || 'stf-new',
      staffName: stf?.fullName || 'Staff Member',
      department: stf?.departmentName || 'General',
      reviewPeriod,
      reviewerName,
      reviewDate: new Date().toISOString().split('T')[0],
      ratingScore,
      status: 'completed',
      keyAccomplishments: accomplishments || 'Met all established objectives.',
      areasForDevelopment: improvements || 'Continue professional certifications.',
    };

    setReviews([newRev, ...reviews]);
    setIsAddReviewOpen(false);
    Swal.fire({
      title: 'Appraisal Logged',
      text: `Performance appraisal recorded for ${newRev.staffName}.`,
      icon: 'success',
      confirmButtonColor: '#D68904',
    });
  };

  const handleCreateTraining = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrn: TrainingSession = {
      id: `trn-${Date.now()}`,
      title: trainingTitle,
      provider: trainingProvider,
      category: trainingCategory,
      trainingDate,
      durationHours: trainingHours,
      participantsCount: 5,
      participants: ['General Staff Cohort'],
      status: 'scheduled',
      certified: true,
    };

    setTrainings([newTrn, ...trainings]);
    setIsAddTrainingOpen(false);
    Swal.fire({
      title: 'Training Program Scheduled',
      text: `${newTrn.title} added to institutional capacity development calendar.`,
      icon: 'success',
      confirmButtonColor: '#D68904',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Governance & Staff Training"
        subtitle="Manage employee appraisals, track institutional competencies, record professional training, and administer development milestones."
        breadcrumbs={[
          { label: 'HR Dashboard', href: '/' },
          { label: 'Staff Directory', href: '/hr' },
          { label: 'Performance & Training' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddTrainingOpen(true)}>
              <GraduationCap className="h-4 w-4 mr-1.5" />
              Schedule Training
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsAddReviewOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Record Appraisal
            </Button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Completed Appraisals</span>
            <CheckCircle2 className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-emerald-700">
            {reviews.filter((r) => r.status === 'completed').length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Formal staff reviews documented this year
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Average Appraisal Score</span>
            <Award className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-900">
            4.7 <span className="text-xs font-normal text-charcoal-muted">/ 5.0</span>
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Workforce competence rating index
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Completed Training Cohorts</span>
            <GraduationCap className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-900">
            {trainings.filter((t) => t.status === 'completed').length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Workforce programs delivered with certificates
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Staff Trained</span>
            <FileCheck className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-900">
            27
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Unique attendees in statutory & child protection
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 w-fit text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('appraisals')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'appraisals'
              ? 'bg-white dark:bg-slate-900 text-charcoal-900 dark:text-white font-semibold shadow-xs'
              : 'text-charcoal-muted hover:text-charcoal-800'
          }`}
        >
          <Award className="h-4 w-4 text-charcoal-600" />
          <span>Staff Performance Appraisals ({reviews.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trainings')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'trainings'
              ? 'bg-white dark:bg-slate-900 text-charcoal-900 dark:text-white font-semibold shadow-xs'
              : 'text-charcoal-muted hover:text-charcoal-800'
          }`}
        >
          <GraduationCap className="h-4 w-4 text-charcoal-600" />
          <span>Capacity Building & Training Sessions ({trainings.length})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-surface-border rounded-lg p-3 flex items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="h-3.5 w-3.5 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records, staff, modules..."
            className="pl-9 pr-3 py-1.5 text-xs rounded border border-surface-border bg-white focus:outline-none focus:ring-1 focus:ring-charcoal-500 w-full"
          />
        </div>
        <div className="text-xs text-charcoal-muted">
          Showing {activeTab === 'appraisals' ? filteredReviews.length : filteredTrainings.length} records
        </div>
      </div>

      {/* TAB 1: Appraisals Table */}
      {activeTab === 'appraisals' && (
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Review Cycle</th>
                  <th className="py-2.5 px-4">Reviewer</th>
                  <th className="py-2.5 px-4 text-center">Score</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-charcoal-900 text-xs">
                      {rev.staffName}
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-700">
                      {rev.department}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-charcoal-800">
                      {rev.reviewPeriod}
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-600">
                      {rev.reviewerName}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-xs text-charcoal-900">
                      {rev.ratingScore > 0 ? `${rev.ratingScore} / 5.0` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {rev.status === 'completed' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Scheduled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReview(rev);
                          setIsReviewDetailOpen(true);
                        }}
                        className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-charcoal-800 hover:bg-slate-200"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Summary
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Trainings Table */}
      {activeTab === 'trainings' && (
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-4">Training Program Title</th>
                  <th className="py-2.5 px-4">Provider / Facilitator</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Session Date</th>
                  <th className="py-2.5 px-4 text-center">Attendees</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredTrainings.map((trn) => (
                  <tr key={trn.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-charcoal-900 text-xs">
                      {trn.title}
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-700">
                      {trn.provider}
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-600">
                      {trn.category}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-charcoal-600">
                      {trn.trainingDate} ({trn.durationHours}h)
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-xs text-charcoal-900">
                      {trn.participantsCount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {trn.status === 'completed' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Certified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-charcoal-700">
                          Upcoming
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Detail Modal */}
      <Modal
        isOpen={isReviewDetailOpen}
        onClose={() => {
          setIsReviewDetailOpen(false);
          setSelectedReview(null);
        }}
        title={selectedReview ? `Staff Appraisal — ${selectedReview.staffName}` : 'Performance Review'}
        description="Official evaluation score, achievements record, and development trajectory."
        footer={
          <Button variant="secondary" size="sm" onClick={() => setIsReviewDetailOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedReview && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex justify-between">
                <span>Employee: <strong>{selectedReview.staffName}</strong></span>
                <span>Department: <strong>{selectedReview.department}</strong></span>
              </div>
              <div className="flex justify-between">
                <span>Review Cycle: <strong>{selectedReview.reviewPeriod}</strong></span>
                <span>Overall Rating: <strong>{selectedReview.ratingScore} / 5.0</strong></span>
              </div>
              <div className="text-charcoal-600 pt-1">
                Conducted by: {selectedReview.reviewerName} on {selectedReview.reviewDate}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-charcoal-900 mb-1">Key Operational Accomplishments:</h4>
              <p className="text-charcoal-700 p-2.5 bg-white border border-surface-border rounded">
                {selectedReview.keyAccomplishments}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-charcoal-900 mb-1">Target Areas for Professional Development:</h4>
              <p className="text-charcoal-700 p-2.5 bg-white border border-surface-border rounded">
                {selectedReview.areasForDevelopment}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Review Modal */}
      <Modal
        isOpen={isAddReviewOpen}
        onClose={() => setIsAddReviewOpen(false)}
        title="Record Performance Appraisal"
        description="Formal performance evaluation session entry for staff dossier."
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsAddReviewOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateReview}>
              Save Appraisal
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateReview} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-charcoal-700 mb-1">Select Staff Member</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full p-2 border border-surface-border rounded bg-white text-xs"
              required
            >
              <option value="">Select an employee...</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.staffNumber} • {s.departmentName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-charcoal-700 mb-1">Appraisal Period</label>
              <input
                type="text"
                value={reviewPeriod}
                onChange={(e) => setReviewPeriod(e.target.value)}
                className="w-full p-2 border border-surface-border rounded bg-white text-xs"
                placeholder="e.g. Q4 2026 Annual Appraisal"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal-700 mb-1">Performance Rating (1.0 - 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={ratingScore}
                onChange={(e) => setRatingScore(parseFloat(e.target.value))}
                className="w-full p-2 border border-surface-border rounded bg-white text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-charcoal-700 mb-1">Reviewing Authority</label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full p-2 border border-surface-border rounded bg-white text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-charcoal-700 mb-1">Key Deliverables & Accomplishments</label>
            <textarea
              value={accomplishments}
              onChange={(e) => setAccomplishments(e.target.value)}
              rows={2}
              className="w-full p-2 border border-surface-border rounded bg-white text-xs"
              placeholder="Highlight major project milestones, accuracy, attendance, or leadership demonstrated..."
            />
          </div>

          <div>
            <label className="block font-medium text-charcoal-700 mb-1">Target Development Areas</label>
            <textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              rows={2}
              className="w-full p-2 border border-surface-border rounded bg-white text-xs"
              placeholder="Training recommendations or process enhancements for the upcoming period..."
            />
          </div>
        </form>
      </Modal>

      {/* Add Training Modal */}
      <Modal
        isOpen={isAddTrainingOpen}
        onClose={() => setIsAddTrainingOpen(false)}
        title="Schedule Capacity Building Program"
        description="Add a training program or professional certification course to the workforce calendar."
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsAddTrainingOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateTraining}>
              Schedule Program
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateTraining} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-charcoal-700 mb-1">Program Title</label>
            <input
              type="text"
              value={trainingTitle}
              onChange={(e) => setTrainingTitle(e.target.value)}
              className="w-full p-2 border border-surface-border rounded bg-white text-xs"
              placeholder="e.g. Safeguarding Children from Exploitation"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-charcoal-700 mb-1">Facilitator / Institution</label>
              <input
                type="text"
                value={trainingProvider}
                onChange={(e) => setTrainingProvider(e.target.value)}
                className="w-full p-2 border border-surface-border rounded bg-white text-xs"
                placeholder="e.g. UNICEF Tanzania / ATE"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal-700 mb-1">Training Category</label>
              <select
                value={trainingCategory}
                onChange={(e) => setTrainingCategory(e.target.value)}
                className="w-full p-2 border border-surface-border rounded bg-white text-xs"
              >
                <option value="Safeguarding & Governance">Safeguarding & Governance</option>
                <option value="Finance & Compliance">Finance & Compliance</option>
                <option value="Procurement & Tenders">Procurement & Tenders</option>
                <option value="Field Delivery & First Aid">Field Delivery & First Aid</option>
                <option value="Human Resources">Human Resources</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <DatePicker
                label="Session Date"
                value={trainingDate}
                onChange={(val) => setTrainingDate(val)}
                required
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal-700 mb-1">Duration (Hours)</label>
              <input
                type="number"
                value={trainingHours}
                onChange={(e) => setTrainingHours(parseInt(e.target.value) || 8)}
                className="w-full p-2 border border-surface-border rounded bg-white text-xs"
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HrPerformancePage;
