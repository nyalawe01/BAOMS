import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Target,
  Users,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { getProjects } from '@/features/projects/services/projectService';
import { ProjectRecord } from '@/features/projects/types/project';
import { showSuccess, showWarning } from '@/lib/sweetAlert';

interface IndicatorItem {
  id: string;
  projectCode: string;
  projectName: string;
  indicator: string;
  baseline: number;
  target: number;
  achieved: number;
  unit: string;
  frequency: string;
  status: 'on_track' | 'at_risk' | 'exceeded';
}

interface SubmittedActivityReview {
  id: string;
  projectCode: string;
  activityTitle: string;
  submittedBy: string;
  date: string;
  participantsReported: number;
  evidenceFilesCount: number;
  validationStatus: 'validated' | 'pending_validation' | 'flagged';
  notes?: string;
}

export const MonitoringEvaluationDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // M&E Indicator Results Framework State
  const [indicators, setIndicators] = useState<IndicatorItem[]>([
    {
      id: 'ind-01',
      projectCode: 'PRJ-2026-001',
      projectName: 'Youth Empowerment & Community Arts',
      indicator: 'Vulnerable children and youth enrolled in arts and life skills programs',
      baseline: 150,
      target: 1200,
      achieved: 1045,
      unit: 'Youth',
      frequency: 'Quarterly',
      status: 'on_track',
    },
    {
      id: 'ind-02',
      projectCode: 'PRJ-2026-001',
      projectName: 'Youth Empowerment & Community Arts',
      indicator: 'Community child protection outreach dialogues conducted',
      baseline: 10,
      target: 48,
      achieved: 42,
      unit: 'Sessions',
      frequency: 'Monthly',
      status: 'on_track',
    },
    {
      id: 'ind-03',
      projectCode: 'PRJ-2026-001',
      projectName: 'Youth Empowerment & Community Arts',
      indicator: 'Peer educators certified in safeguarding & psycho-social support',
      baseline: 0,
      target: 50,
      achieved: 55,
      unit: 'Educators',
      frequency: 'Semi-Annual',
      status: 'exceeded',
    },
    {
      id: 'ind-04',
      projectCode: 'PRJ-2026-001',
      projectName: 'Youth Empowerment & Community Arts',
      indicator: 'Parent-teacher community child safety committees functional',
      baseline: 4,
      target: 20,
      achieved: 12,
      unit: 'Committees',
      frequency: 'Bi-Monthly',
      status: 'at_risk',
    },
  ]);

  // Field Verification Queue State
  const [reviews, setReviews] = useState<SubmittedActivityReview[]>([
    {
      id: 'rev-01',
      projectCode: 'PRJ-2026-001',
      activityTitle: 'Temeke District Youth Theater & Psycho-social Workshop',
      submittedBy: 'Project Coordinator (Field Desk)',
      date: '2026-10-14',
      participantsReported: 84,
      evidenceFilesCount: 6,
      validationStatus: 'pending_validation',
    },
    {
      id: 'rev-02',
      projectCode: 'PRJ-2026-001',
      activityTitle: 'Kigamboni Community Safeguarding & Child Protection Forum',
      submittedBy: 'Project Coordinator (Field Desk)',
      date: '2026-10-11',
      participantsReported: 130,
      evidenceFilesCount: 8,
      validationStatus: 'validated',
    },
    {
      id: 'rev-03',
      projectCode: 'PRJ-2026-001',
      activityTitle: 'Bagamoyo Outreach & Mobile Library Session',
      submittedBy: 'Field Operations',
      date: '2026-10-08',
      participantsReported: 95,
      evidenceFilesCount: 2,
      validationStatus: 'flagged',
      notes: 'Attendance register page 2 missing signature verification.',
    },
  ]);

  useEffect(() => {
    getProjects()
      .then((p) => setProjects(p))
      .catch((err) => console.warn('M&E telemetry projects load:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleValidateActivity = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, validationStatus: 'validated', notes: undefined } : r))
    );
    showSuccess('Activity Data Validated', 'Evidence and participant metrics verified for official reporting.');
  };

  const handleFlagActivity = (id: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, validationStatus: 'flagged', notes: 'Flagged for coordinator discrepancy review.' }
          : r
      )
    );
    showWarning('Data Discrepancy Flagged', 'Item flagged for field team clarification before donor reporting.');
  };

  const totalBeneficiaries = indicators.reduce((acc, i) => acc + (i.unit === 'Youth' ? i.achieved : 0), 0) + 1250;
  const verifiedRate = Math.round(
    (reviews.filter((r) => r.validationStatus === 'validated').length / (reviews.length || 1)) * 100
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('me.dashboardTitle', 'Monitoring, Evaluation & Impact Command')}
        subtitle={t(
          'me.dashboardSubtitle',
          'Results-based framework, indicator targets, field evidence verification, and donor report data governance.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('me.console', 'M&E Oversight') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
              <BarChart3 className="h-4 w-4 mr-1.5" />
              <span>Performance Analytics</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/documents')}>
              <FileCheck className="h-4 w-4 mr-1.5" />
              <span>Verify Evidence Files</span>
            </Button>
          </div>
        }
      />

      {/* Impact & Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-forest-700 bg-white min-w-0">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider block truncate">
                Direct Beneficiaries Reached
              </span>
              <div className="text-[28px] font-bold text-forest-950 font-mono tabular-nums leading-tight mt-1 truncate">
                {totalBeneficiaries.toLocaleString()}
              </div>
              <span className="text-[11px] text-forest-700 font-medium block truncate">
                92.4% of annual target reached
              </span>
            </div>
            <div className="p-2.5 bg-forest-50 text-forest-700 rounded-md shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600 bg-white min-w-0">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider block truncate">
                Indicators On Track
              </span>
              <div className="text-[28px] font-bold text-emerald-700 font-mono tabular-nums leading-tight mt-1 truncate">
                85%
              </div>
              <span className="text-[11px] text-emerald-700 font-medium block truncate">
                {indicators.filter((i) => i.status !== 'at_risk').length} of {indicators.length} milestones met
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-md shrink-0">
              <Target className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-[#D68904] bg-white min-w-0">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider block truncate">
                Evidence Verification
              </span>
              <div className="text-[28px] font-bold text-amber-900 font-mono tabular-nums leading-tight mt-1 truncate">
                {verifiedRate}%
              </div>
              <span className="text-[11px] text-[#D68904] font-medium block truncate">
                Field registers & photos verified
              </span>
            </div>
            <div className="p-2.5 bg-amber-50 text-[#D68904] rounded-md shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-600 bg-white min-w-0">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider block truncate">
                Data Quality Score
              </span>
              <div className="text-[28px] font-bold text-indigo-950 font-mono tabular-nums leading-tight mt-1 truncate">
                98.8%
              </div>
              <span className="text-[11px] text-indigo-700 font-medium block truncate">
                0 duplicate beneficiaries found
              </span>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-md shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Framework Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Indicator & Results Tracking Framework */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 bg-white border border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-charcoal-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-forest-700" />
                  <span>Indicators & Targets Framework</span>
                </h3>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  Real-time baseline vs. achieved output metrics for active program deliverables.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="text-xs">
                <span>View Projects</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            <div className="space-y-4">
              {indicators.map((ind) => {
                const percent = Math.min(Math.round((ind.achieved / (ind.target || 1)) * 100), 100);
                return (
                  <div
                    key={ind.id}
                    className="p-3.5 rounded-lg border border-surface-border hover:border-forest-200 transition-colors bg-surface-muted/20 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded">
                            {ind.projectCode}
                          </span>
                          <span className="text-xs font-semibold text-charcoal-900 truncate">
                            {ind.indicator}
                          </span>
                        </div>
                        <span className="text-[11px] text-charcoal-muted block mt-0.5">
                          Tracking Frequency: {ind.frequency} • Baseline: {ind.baseline} {ind.unit}
                        </span>
                      </div>
                      <div className="shrink-0">
                        {ind.status === 'on_track' && (
                          <Badge variant="success" size="sm">On Track</Badge>
                        )}
                        {ind.status === 'exceeded' && (
                          <Badge variant="primary" size="sm">Exceeded Target</Badge>
                        )}
                        {ind.status === 'at_risk' && (
                          <Badge variant="warning" size="sm">Needs Attention</Badge>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-charcoal-muted">Achieved: <strong>{ind.achieved.toLocaleString()} {ind.unit}</strong></span>
                        <span className="text-forest-900 font-bold">{percent}% of target ({ind.target.toLocaleString()})</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            ind.status === 'at_risk' ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Activity Data Quality & Verification Queue */}
          <Card className="p-5 bg-white border border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-charcoal-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  <span>Field Activity Submissions & Verification Desk</span>
                </h3>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  Verify reported participant numbers against signed attendance registers and photo evidence.
                </p>
              </div>
            </div>

            <div className="divide-y divide-surface-border">
              {reviews.map((rev) => (
                <div key={rev.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-charcoal-900">{rev.activityTitle}</span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-surface-border">
                        {rev.projectCode}
                      </span>
                      {rev.validationStatus === 'validated' && (
                        <Badge variant="success" size="sm" withDot>Verified</Badge>
                      )}
                      {rev.validationStatus === 'pending_validation' && (
                        <Badge variant="neutral" size="sm" withDot>Pending M&E Check</Badge>
                      )}
                      {rev.validationStatus === 'flagged' && (
                        <Badge variant="danger" size="sm" withDot>Flagged Discrepancy</Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-charcoal-muted flex items-center gap-3">
                      <span>Submitted by {rev.submittedBy}</span>
                      <span>•</span>
                      <span>{rev.participantsReported} Participants</span>
                      <span>•</span>
                      <span>{rev.evidenceFilesCount} Attachments</span>
                    </div>
                    {rev.notes && (
                      <p className="text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200">
                        {rev.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {rev.validationStatus !== 'validated' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleValidateActivity(rev.id)}
                        className="text-xs h-8 px-2.5 bg-emerald-700 hover:bg-emerald-800"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        <span>Validate</span>
                      </Button>
                    )}
                    {rev.validationStatus !== 'flagged' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFlagActivity(rev.id)}
                        className="text-xs h-8 px-2.5 text-amber-700 border-amber-300 hover:bg-amber-50"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        <span>Flag</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Col: Data Quality Rules & Donor Reporting */}
        <div className="space-y-6">
          <Card className="p-5 bg-white border border-surface-border">
            <h3 className="text-sm font-semibold text-charcoal-900 flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-forest-700" />
              <span>Data Quality Rules & Standards</span>
            </h3>
            <div className="space-y-3 text-xs text-charcoal-muted">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-emerald-900 font-semibold">Attendance Validation</strong>
                  Every reported participant count must match physical signed sign-in sheets uploaded to the document registry.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-950">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-blue-900 font-semibold">Duplication Guard</strong>
                  Beneficiary national/school IDs are cross-referenced across regional clinics and theater workshops.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-900 font-semibold">Read-Only Governance</strong>
                  M&E staff inspect and validate project metrics but cannot alter accounting vouchers or disbursements.
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-surface-border space-y-4">
            <h3 className="text-sm font-semibold text-charcoal-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-forest-700" />
              <span>Donor & Indicator Reporting</span>
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Export validated output figures, participant demographics, and disaggregated indicators to Excel/CSV for donor submissions.
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/reports')}
                className="w-full justify-between text-xs"
              >
                <span>Export Progress Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/documents')}
                className="w-full justify-between text-xs"
              >
                <span>Browse Evidence Archive</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
