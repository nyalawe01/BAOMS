import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Search,
  Filter,
  Calendar,
  FileCheck,
  ChevronRight,
  Download,
  Check,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/ui/KPICard';
import { Badge } from '@/components/ui/Badge';
import { AnalyticsVisualizer, AnalyticsDataPoint } from '@/components/ui/AnalyticsVisualizer';
import { getProjects } from '@/features/projects/services/projectService';
import { ProjectRecord } from '@/features/projects/types/project';
import { useAuth } from '@/features/auth/useAuth';
import Swal from 'sweetalert2';
import { showSuccess, showError } from '@/lib/sweetAlert';

interface IndicatorRecord {
  id: string;
  code: string;
  name: string;
  projectCode: string;
  projectName: string;
  type: 'Output' | 'Outcome' | 'Impact';
  unit: string;
  baseline: number;
  target: number;
  actual: number;
  achievementPercentage: number;
  period: string;
  status: 'on_target' | 'below_target' | 'exceeded';
  verificationStatus: 'verified' | 'pending_verification' | 'rejected';
}

interface ActivityResultReport {
  id: string;
  reportingPeriod: string;
  projectName: string;
  projectCode: string;
  indicatorName: string;
  target: number;
  actual: number;
  unit: string;
  submissionDate: string;
  submittedBy: string;
  verificationStatus: 'verified' | 'pending_verification' | 'returned_for_correction';
  reviewerComments?: string;
}

const INITIAL_INDICATORS: IndicatorRecord[] = [
  {
    id: 'ind-01',
    code: 'IND-ACT-001',
    name: 'Vulnerable children and youth enrolled in arts and life skills programs',
    projectCode: 'PRJ-2026-001',
    projectName: 'Youth Empowerment & Community Arts',
    type: 'Outcome',
    unit: 'Children/Youth',
    baseline: 150,
    target: 1200,
    actual: 1045,
    achievementPercentage: 87,
    period: '2026 Q1-Q3',
    status: 'on_target',
    verificationStatus: 'verified',
  },
  {
    id: 'ind-02',
    code: 'IND-PROT-002',
    name: 'Community child protection outreach dialogues conducted',
    projectCode: 'PRJ-2026-001',
    projectName: 'Youth Empowerment & Community Arts',
    type: 'Output',
    unit: 'Sessions',
    baseline: 12,
    target: 48,
    actual: 42,
    achievementPercentage: 88,
    period: '2026 Q3',
    status: 'on_target',
    verificationStatus: 'verified',
  },
  {
    id: 'ind-03',
    code: 'IND-LEAD-003',
    name: 'Young creative leaders completing certified peer facilitator training',
    projectCode: 'PRJ-2026-002',
    projectName: 'Safe Spaces for Urban Street Youth',
    type: 'Outcome',
    unit: 'Leaders',
    baseline: 20,
    target: 100,
    actual: 62,
    achievementPercentage: 62,
    period: '2026 Q3',
    status: 'below_target',
    verificationStatus: 'pending_verification',
  },
  {
    id: 'ind-04',
    code: 'IND-FOS-004',
    name: 'Children safely reunited with verified family caregivers or guardians',
    projectCode: 'PRJ-2026-002',
    projectName: 'Safe Spaces for Urban Street Youth',
    type: 'Impact',
    unit: 'Reunifications',
    baseline: 5,
    target: 60,
    actual: 54,
    achievementPercentage: 90,
    period: '2026 Q1-Q3',
    status: 'on_target',
    verificationStatus: 'verified',
  },
  {
    id: 'ind-05',
    code: 'IND-VOC-005',
    name: 'Youth equipped with micro-business start-up toolkits',
    projectCode: 'PRJ-2026-003',
    projectName: 'Vocational Toolkits for Teenage Mothers',
    type: 'Output',
    unit: 'Toolkits',
    baseline: 0,
    target: 200,
    actual: 115,
    achievementPercentage: 58,
    period: '2026 Q3',
    status: 'below_target',
    verificationStatus: 'pending_verification',
  },
];

const INITIAL_REPORTS: ActivityResultReport[] = [
  {
    id: 'rep-01',
    reportingPeriod: '2026 Q3 (Jul - Sep)',
    projectName: 'Youth Empowerment & Community Arts',
    projectCode: 'PRJ-2026-001',
    indicatorName: 'Children and youth enrolled in arts and life skills programs',
    target: 400,
    actual: 385,
    unit: 'Youth',
    submissionDate: '2026-10-05',
    submittedBy: 'Salome Kimaro (M&E Field Officer)',
    verificationStatus: 'verified',
    reviewerComments: 'Verified with signed attendance registers and photo evidence.',
  },
  {
    id: 'rep-02',
    reportingPeriod: '2026 Q3 (Jul - Sep)',
    projectName: 'Safe Spaces for Urban Street Youth',
    projectCode: 'PRJ-2026-002',
    indicatorName: 'Young creative leaders completing certified peer facilitator training',
    target: 35,
    actual: 22,
    unit: 'Leaders',
    submissionDate: '2026-10-12',
    submittedBy: 'Juma Selemani (Project Coordinator)',
    verificationStatus: 'pending_verification',
    reviewerComments: 'Awaiting submission of course completion assessments.',
  },
  {
    id: 'rep-03',
    reportingPeriod: '2026 Q3 (Jul - Sep)',
    projectName: 'Vocational Toolkits for Teenage Mothers',
    projectCode: 'PRJ-2026-003',
    indicatorName: 'Youth equipped with micro-business start-up toolkits',
    target: 75,
    actual: 40,
    unit: 'Toolkits',
    submissionDate: '2026-10-14',
    submittedBy: 'Beatrice Mlay (Vocational Trainer)',
    verificationStatus: 'returned_for_correction',
    reviewerComments: 'Returned: Beneficiary receipt acknowledgment signatures missing for 15 toolkits.',
  },
];

export const MonitoringEvaluationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasRole, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'indicators' | 'results' | 'beneficiaries' | 'calendar'>('indicators');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [indicators, setIndicators] = useState<IndicatorRecord[]>(INITIAL_INDICATORS);
  const [resultsReports, setResultsReports] = useState<ActivityResultReport[]>(INITIAL_REPORTS);

  const isDirectorOrAdmin = hasRole('executive_director') || isAdmin() || hasRole('me_officer');

  // KPI calculations
  const activeIndicatorsCount = indicators.length;
  const onTargetCount = indicators.filter((i) => i.status === 'on_target' || i.status === 'exceeded').length;
  const belowTargetCount = indicators.filter((i) => i.status === 'below_target').length;
  const reportingCompletionRate = 89; // percentage
  const verifiedBeneficiariesReached = 2650;
  const reportsDueOrOverdue = 2;

  // Filtered Indicators
  const filteredIndicators = useMemo(() => {
    return indicators.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.projectName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indicators, typeFilter, statusFilter, searchQuery]);

  // Chart data: Target vs Actual
  const chartData: AnalyticsDataPoint[] = useMemo(() => {
    return indicators.map((ind) => ({
      label: ind.code,
      value: ind.achievementPercentage,
      description: `${ind.name.substring(0, 24)}... (${ind.actual}/${ind.target} ${ind.unit})`,
    }));
  }, [indicators]);

  // Handle Verify Result Action
  const handleVerifyResult = async (report: ActivityResultReport) => {
    const result = await Swal.fire({
      title: 'Verify & Authorize M&E Result?',
      text: `Approve verified actual achievement of ${report.actual} ${report.unit} for "${report.indicatorName}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Verify & Clear',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      setResultsReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? { ...r, verificationStatus: 'verified', reviewerComments: 'Verified and signed off by Executive Directorate.' }
            : r
        )
      );
      showSuccess('Result Verified', 'M&E report marked as verified official data.');
    }
  };

  // Handle Return for Correction
  const handleReturnForCorrection = async (report: ActivityResultReport) => {
    const { value: comments } = await Swal.fire({
      title: 'Return Result for Correction',
      input: 'textarea',
      inputLabel: 'Correction Remarks',
      inputPlaceholder: 'Detail required corrections, missing evidence files, or participant reconciliation...',
      inputValidator: (val) => {
        if (!val || val.trim().length < 5) return 'Correction remarks are required.';
      },
      showCancelButton: true,
      confirmButtonColor: '#D68904',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Return for Correction',
    });

    if (comments) {
      setResultsReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? { ...r, verificationStatus: 'returned_for_correction', reviewerComments: comments }
            : r
        )
      );
      showSuccess('Report Returned', 'Result has been returned to field officer for correction.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="M&E & Impact"
        subtitle="Track organizational indicators, verify target achievements, inspect beneficiary reach, and review M&E reports."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'M&E & Impact' },
        ]}
      />

      {/* KPI Cards Strip (Strict monochrome unboxed icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <KPICard
          label="Active Indicators"
          value={activeIndicatorsCount}
          icon={Target}
        />
        <KPICard
          label="On Target"
          value={onTargetCount}
          icon={CheckCircle2}
        />
        <KPICard
          label="Below Target"
          value={belowTargetCount}
          icon={AlertTriangle}
        />
        <KPICard
          label="Reporting Rate"
          value={`${reportingCompletionRate}%`}
          icon={TrendingUp}
        />
        <KPICard
          label="Verified Beneficiaries"
          value={verifiedBeneficiariesReached.toLocaleString()}
          icon={Users}
        />
        <KPICard
          label="Reports Due"
          value={reportsDueOrOverdue}
          icon={Calendar}
        />
      </div>

      {/* Target Achievement Analytics Chart */}
      <div className="bg-white border border-surface-border rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-charcoal-900">Indicator Target vs. Actual Achievement</h2>
            <p className="text-xs text-charcoal-muted mt-0.5">Performance index across active strategic indicators (%)</p>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
            Overall Portfolio Performance: 77%
          </span>
        </div>

        <AnalyticsVisualizer
          data={chartData}
          valueSuffix="%"
          defaultMode="bar"
          availableModes={['bar', 'line', 'table']}
          height={200}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-surface-border">
        <nav className="flex space-x-6">
          {[
            { id: 'indicators', label: 'Indicator Register' },
            { id: 'results', label: 'Results & Field Reports' },
            { id: 'beneficiaries', label: 'Beneficiary & Impact Summary' },
            { id: 'calendar', label: 'Reporting Calendar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-[#D68904] text-charcoal-900 font-semibold'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: INDICATOR REGISTER */}
      {activeTab === 'indicators' && (
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden shadow-xs">
          {/* Toolbar */}
          <div className="p-3.5 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#374151]" />
              <input
                type="text"
                placeholder="Search indicator name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 text-xs bg-white text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-md border border-slate-200 py-1.5 px-3 text-xs bg-white text-charcoal-700 focus:outline-none"
              >
                <option value="all">All Levels</option>
                <option value="Output">Output</option>
                <option value="Outcome">Outcome</option>
                <option value="Impact">Impact</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-slate-200 py-1.5 px-3 text-xs bg-white text-charcoal-700 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="on_target">On Target</option>
                <option value="below_target">Below Target</option>
              </select>
            </div>
          </div>

          {/* Table (AdminCN layout) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Indicator Code & Name</th>
                  <th className="py-3 px-4">Project / Program</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4 text-right">Baseline</th>
                  <th className="py-3 px-4 text-right">Target</th>
                  <th className="py-3 px-4 text-right">Actual</th>
                  <th className="py-3 px-4 text-center">Achievement</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredIndicators.map((ind) => (
                  <tr key={ind.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-bold text-charcoal-900 leading-snug">{ind.name}</div>
                      <div className="text-[11px] font-mono text-charcoal-muted mt-0.5">{ind.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-charcoal-800">{ind.projectName}</span>
                      <span className="text-[11px] font-mono text-charcoal-muted block">{ind.projectCode}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                        {ind.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-charcoal-600">
                      {ind.baseline}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-charcoal-900">
                      {ind.target.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#D68904]">
                      {ind.actual.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-mono font-bold text-xs">{ind.achievementPercentage}%</span>
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            ind.achievementPercentage >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-charcoal-muted">
                      {ind.period}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={ind.verificationStatus === 'verified' ? 'success' : 'warning'}>
                        {ind.verificationStatus === 'verified' ? 'Verified' : 'Under Review'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RESULTS & FIELD REPORTS */}
      {activeTab === 'results' && (
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden shadow-xs">
          <div className="p-4 border-b border-surface-border bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-charcoal-900">M&E Activity Result Submissions</h2>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Periodic results filed by project coordinators and M&E field officers awaiting verification
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Indicator Reported</th>
                  <th className="py-3 px-4 text-right">Target</th>
                  <th className="py-3 px-4 text-right">Reported Actual</th>
                  <th className="py-3 px-4">Submitted By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                  {isDirectorOrAdmin && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {resultsReports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono whitespace-nowrap text-charcoal-900">
                      {rep.reportingPeriod}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-charcoal-900">{rep.projectName}</div>
                      <div className="text-[10px] font-mono text-charcoal-muted">{rep.projectCode}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-charcoal-800">
                      {rep.indicatorName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-charcoal-600">
                      {rep.target} {rep.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-charcoal-900">
                      {rep.actual} {rep.unit}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-charcoal-800 block">{rep.submittedBy}</span>
                      <span className="text-[10px] text-charcoal-muted font-mono">{rep.submissionDate}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          rep.verificationStatus === 'verified'
                            ? 'success'
                            : rep.verificationStatus === 'returned_for_correction'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {rep.verificationStatus.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-charcoal-muted max-w-xs truncate">
                      {rep.reviewerComments || '—'}
                    </td>
                    {isDirectorOrAdmin && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {rep.verificationStatus === 'pending_verification' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleReturnForCorrection(rep)}
                              className="text-[#374151]"
                            >
                              <RotateCcw className="h-3 w-3 mr-1 text-[#374151]" />
                              Return
                            </Button>
                            <Button
                              size="xs"
                              variant="primary"
                              onClick={() => handleVerifyResult(rep)}
                            >
                              <Check className="h-3 w-3 mr-1 text-[#111827]" />
                              Verify
                            </Button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BENEFICIARY & IMPACT SUMMARY */}
      {activeTab === 'beneficiaries' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-lg border border-surface-border bg-white shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-900 mb-3">
              Total Verified Reach (Demographics)
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Children (Ages 5 - 14):</span>
                  <strong className="font-mono">1,420 (54%)</strong>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-[#D68904] h-full" style={{ width: '54%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Youth (Ages 15 - 24):</span>
                  <strong className="font-mono">890 (34%)</strong>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-[#D68904] h-full" style={{ width: '34%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Parents & Caregivers:</span>
                  <strong className="font-mono">340 (12%)</strong>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-[#D68904] h-full" style={{ width: '12%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg border border-surface-border bg-white shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-900 mb-3">
              Geographic Coverage
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-charcoal-700">Ilala District (Kariakoo, Vingunguti):</span>
                <span className="font-mono font-bold">1,120</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-charcoal-700">Kinondoni (Tandale, Manzese):</span>
                <span className="font-mono font-bold">850</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-charcoal-700">Temeke (Mbagala):</span>
                <span className="font-mono font-bold">680</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg border border-surface-border bg-white shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-900 mb-3">
              Quality Assurance Rules
            </h3>
            <ul className="text-xs text-charcoal-muted space-y-2 list-disc pl-4">
              <li>Individual unique beneficiaries deduplicated by NIDA/Birth Certificate.</li>
              <li>Attendance sheets required for all group community outreach sessions.</li>
              <li>Quarterly randomized spot checks conducted by M&E Lead.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: REPORTING CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden shadow-xs">
          <div className="p-4 border-b border-surface-border bg-slate-50/50 font-semibold text-xs text-charcoal-900">
            Upcoming Operational & Donor M&E Deadlines
          </div>
          <div className="divide-y divide-surface-border">
            {[
              {
                title: 'Q3 Comprehensive Indicator Verification Report',
                date: '2026-10-31',
                responsible: 'M&E Specialist (Amina Rashid)',
                status: 'In Progress',
              },
              {
                title: 'Annual Youth Empowerment Impact Evaluation Brief',
                date: '2026-11-15',
                responsible: 'Head of Programs (Grace Mchome)',
                status: 'Upcoming',
              },
              {
                title: 'Quarterly Child Protection Case Closure Review',
                date: '2026-11-30',
                responsible: 'Child Protection Officer',
                status: 'Upcoming',
              },
            ].map((ev, i) => (
              <div key={i} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-[#374151]" />
                  <div>
                    <strong className="text-charcoal-900 block">{ev.title}</strong>
                    <span className="text-charcoal-muted text-[11px]">Responsible: {ev.responsible}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-charcoal-900">{ev.date}</span>
                  <Badge variant="info">{ev.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringEvaluationPage;
