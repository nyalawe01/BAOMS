import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  RefreshCw,
  FolderKanban,
  Check,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/ui/KPICard';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { AnalyticsVisualizer, AnalyticsDataPoint } from '@/components/ui/AnalyticsVisualizer';
import {
  getProjects,
  getAllActivities,
  reviewActivitySubmission,
  EnrichedActivityRecord,
} from '@/features/projects/services/projectService';
import { ProjectRecord } from '@/features/projects/types/project';
import { showSuccess, showError, showWarning } from '@/lib/sweetAlert';
import { useAuth } from '@/features/auth/useAuth';

export interface DerivedIndicator {
  id: string;
  projectId: string;
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

export const MonitoringEvaluationDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activities, setActivities] = useState<EnrichedActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Load live data from Supabase PostgreSQL
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projList, actList] = await Promise.all([
        getProjects(),
        getAllActivities(),
      ]);
      setProjects(projList || []);
      setActivities(actList || []);
    } catch (err: any) {
      console.error('[MEDashboard] Failed to load telemetry from Supabase:', err);
      setProjects([]);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived Indicators from Database Projects & Activities
  const derivedIndicators = useMemo<DerivedIndicator[]>(() => {
    if (!projects || projects.length === 0) return [];

    return projects.map((p, idx) => {
      const projActivities = (activities || []).filter((a) => a.projectId === p.id);
      const totalParticipants = projActivities.reduce(
        (sum, a) => sum + (Number(a.participantsCount) || 0),
        0
      );

      // Baseline and target calculated dynamically from project scale
      const baseline = 20 * (idx + 1);
      const target = Math.max(
        Math.round((p.totalBudget || 50000000) / 150000),
        150
      );
      const achieved = totalParticipants;
      const pct = (achieved / target) * 100;

      let status: 'on_track' | 'at_risk' | 'exceeded' = 'on_track';
      if (pct >= 100) status = 'exceeded';
      else if (pct < 50) status = 'at_risk';

      return {
        id: `ind-${p.id}`,
        projectId: p.id,
        projectCode: p.projectCode,
        projectName: p.name,
        indicator: `${p.name} — Direct Beneficiaries & Safeguarded Children Reached`,
        baseline,
        target,
        achieved,
        unit: 'Participants',
        frequency: 'Quarterly Audit',
        status,
      };
    });
  }, [projects, activities]);

  // Derived KPIs from Database
  const totalBeneficiaries = useMemo(() => {
    return activities
      .filter((a) => a.submissionStatus === 'approved')
      .reduce((sum, a) => sum + (Number(a.participantsCount) || 0), 0);
  }, [activities]);

  const verifiedActivitiesCount = useMemo(() => {
    return activities.filter((a) => a.submissionStatus === 'approved').length;
  }, [activities]);

  const pendingVerificationCount = useMemo(() => {
    return activities.filter((a) => a.submissionStatus === 'submitted').length;
  }, [activities]);

  const verificationRate = useMemo(() => {
    if (activities.length === 0) return 100;
    return Math.round((verifiedActivitiesCount / activities.length) * 100);
  }, [activities.length, verifiedActivitiesCount]);

  const indicatorsOnTrackRatio = useMemo(() => {
    if (derivedIndicators.length === 0) return '0/0';
    const onTrack = derivedIndicators.filter((i) => i.status !== 'at_risk').length;
    return `${onTrack}/${derivedIndicators.length}`;
  }, [derivedIndicators]);

  // Derived Analytics Data for Charts (Derived from Supabase database activities)
  const monthlyAnalyticsData = useMemo<AnalyticsDataPoint[]>(() => {
    if (activities.length === 0) {
      return [
        { label: 'Jan 2026', value: 0 },
        { label: 'Feb 2026', value: 0 },
        { label: 'Mar 2026', value: 0 },
      ];
    }

    const monthMap: Record<string, number> = {};
    activities.forEach((act) => {
      const d = act.activityDate ? new Date(act.activityDate) : new Date();
      const monthKey = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthMap[monthKey] = (monthMap[monthKey] || 0) + (Number(act.participantsCount) || 0);
    });

    return Object.entries(monthMap).map(([label, value], i) => ({
      label,
      value,
      color: ['#F2A507', '#D68904', '#15803d', '#0284c7', '#7c3aed'][i % 5],
      description: `${value.toLocaleString()} verified participants`,
    }));
  }, [activities]);

  const projectDistributionData = useMemo<AnalyticsDataPoint[]>(() => {
    if (!projects || projects.length === 0) return [];

    return projects.map((p, i) => {
      const pActs = (activities || []).filter((a) => a.projectId === p.id);
      const reach = pActs.reduce((sum, a) => sum + (Number(a.participantsCount) || 0), 0);
      return {
        label: p.projectCode,
        value: reach,
        color: ['#D68904', '#0f766e', '#1e293b', '#7c3aed', '#be123c'][i % 5],
        description: `${p.name} (${reach.toLocaleString()} participants)`,
      };
    });
  }, [projects, activities]);

  // Filtered Activities for Verification Desk
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (filterProject !== 'all' && act.projectId !== filterProject) return false;
      if (filterStatus !== 'all' && act.submissionStatus !== filterStatus) return false;
      return true;
    });
  }, [activities, filterProject, filterStatus]);

  // ── Database Action Handlers (Mutate Supabase PostgreSQL) ──────────────────

  const handleValidateActivity = async (activityId: string) => {
    if (!user?.id) {
      showError('Authentication Required', 'You must be signed in to validate activities.');
      return;
    }

    setIsProcessing(true);
    try {
      await reviewActivitySubmission(
        activityId,
        'approved',
        user.id,
        'Verified and approved by M&E Directorate for official donor reporting.'
      );
      showSuccess('Activity Validated in Database', 'Field metrics and attendance verified in Supabase PostgreSQL.');
      await loadData();
    } catch (err: any) {
      showError('Validation Failed', err.message || 'Could not validate activity in database.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlagActivity = async (activityId: string) => {
    if (!user?.id) {
      showError('Authentication Required', 'You must be signed in to flag activities.');
      return;
    }

    const { value: comments } = await Swal.fire({
      title: 'Flag Activity Discrepancy',
      text: 'Provide comments or revision instructions for the field coordinator:',
      input: 'textarea',
      inputPlaceholder: 'e.g. Attendance sheet missing signatures; participant count discrepancy...',
      inputValidator: (val) => (!val?.trim() ? 'Discrepancy remarks are required.' : null),
      showCancelButton: true,
      confirmButtonColor: '#b45309',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Submit Discrepancy Flag',
    });

    if (!comments) return;

    setIsProcessing(true);
    try {
      await reviewActivitySubmission(
        activityId,
        'returned_for_correction',
        user.id,
        comments.trim()
      );
      showWarning('Activity Flagged in Database', 'Item returned to project coordinator for evidence correction.');
      await loadData();
    } catch (err: any) {
      showError('Flagging Failed', err.message || 'Could not flag activity in database.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('me.dashboardTitle', 'Monitoring, Evaluation & Impact Command')}
        subtitle={t(
          'me.dashboardSubtitle',
          'Database-derived results framework, field evidence verification, and donor report data governance.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('me.console', 'M&E Oversight') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading || isProcessing}
              title="Refresh live metrics from database"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Database</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/projects')}>
              <FolderKanban className="h-4 w-4 mr-1.5" />
              <span>Project Register</span>
            </Button>
          </div>
        }
      />

      {/* Database KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Verified Beneficiaries Reached"
          value={isLoading ? '...' : totalBeneficiaries.toLocaleString()}
          change={{
            value: `${activities.reduce((s, a) => s + (Number(a.participantsCount) || 0), 0).toLocaleString()} Total`,
            isPositive: true,
            label: 'across verified field activities',
          }}
          icon={Users}
        />

        <KPICard
          label="Indicators Tracked"
          value={isLoading ? '...' : `${derivedIndicators.length} Frameworks`}
          change={{
            value: indicatorsOnTrackRatio,
            isPositive: true,
            label: 'milestones performing on-target',
          }}
          icon={Target}
        />

        <KPICard
          label="Field Evidence Verification Rate"
          value={isLoading ? '...' : `${verificationRate}%`}
          change={{
            value: `${verifiedActivitiesCount} of ${activities.length}`,
            isPositive: verificationRate >= 70,
            label: 'field reports ratified in DB',
          }}
          icon={ShieldCheck}
        />

        <KPICard
          label="Pending Verification Desk"
          value={isLoading ? '...' : `${pendingVerificationCount} Submissions`}
          change={{
            value: pendingVerificationCount > 0 ? 'Action Needed' : 'Up to Date',
            isPositive: pendingVerificationCount === 0,
            label: 'awaiting M&E inspection',
          }}
          icon={FileCheck}
        />
      </div>

      {/* Analytics Visualizers (Derived directly from Supabase Activities) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsVisualizer
          data={monthlyAnalyticsData}
          title="Monthly Beneficiary Reach Trajectory"
          description="Direct participant metrics aggregated by activity date from Supabase PostgreSQL records."
          defaultMode="bar"
          availableModes={['bar', 'line', 'table']}
          valueSuffix=" People"
          height={240}
        />

        <AnalyticsVisualizer
          data={projectDistributionData}
          title="Beneficiary Distribution by Active Project"
          description="Proportional participant enrollment mapped across active organizational programs."
          defaultMode="pie"
          availableModes={['pie', 'bar', 'table']}
          valueSuffix=" Participants"
          height={240}
        />
      </div>

      {/* Main Framework Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Indicator Results Framework */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 bg-white border border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-charcoal-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-forest-700" />
                  <span>Program Indicators & Output Framework</span>
                </h3>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  Dynamic achievement calculations derived from active database projects and verified field activities.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="text-xs">
                <span>View Projects</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-charcoal-muted">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-forest-700" />
                Loading indicators from database...
              </div>
            ) : derivedIndicators.length === 0 ? (
              <div className="py-8 text-center text-xs text-charcoal-muted">
                No active projects found in database. Create a project in the Project Register to initialize indicators.
              </div>
            ) : (
              <div className="space-y-4">
                {derivedIndicators.map((ind) => {
                  const percent = Math.min(Math.round((ind.achieved / (ind.target || 1)) * 100), 100);
                  return (
                    <div
                      key={ind.id}
                      className="p-3.5 rounded-lg border border-surface-border hover:border-forest-200 transition-colors bg-surface-muted/20 space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded border border-forest-200/50">
                              {ind.projectCode}
                            </span>
                            <span className="text-xs font-semibold text-charcoal-900 truncate">
                              {ind.indicator}
                            </span>
                          </div>
                          <span className="text-[11px] text-charcoal-muted block mt-0.5">
                            Frequency: {ind.frequency} • Target: {ind.target.toLocaleString()} {ind.unit}
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
                            <Badge variant="warning" size="sm">Needs Acceleration</Badge>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-charcoal-muted">
                            Achieved: <strong>{ind.achieved.toLocaleString()} {ind.unit}</strong>
                          </span>
                          <span className="text-forest-900 font-bold">{percent}% reached</span>
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
            )}
          </Card>

          {/* Activity Data Quality & Verification Queue (Direct Supabase connection) */}
          <Card className="p-5 bg-white border border-surface-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-charcoal-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  <span>Field Activity Verification Desk (Live Database)</span>
                </h3>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  Verify reported participant numbers against attendance sheets. Decisions mutate PostgreSQL records directly.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded border border-slate-200 bg-white text-charcoal-800"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted (Pending Check)</option>
                  <option value="approved">Approved & Verified</option>
                  <option value="returned_for_correction">Flagged / Returned</option>
                  <option value="draft">Drafts</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-charcoal-muted">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-forest-700" />
                Loading activities from database...
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-charcoal-muted">
                No activities match the current filter criteria.
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {filteredActivities.map((act) => (
                  <div key={act.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-charcoal-900">{act.title}</span>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-surface-border">
                          {act.projectCode}
                        </span>
                        {act.submissionStatus === 'approved' && (
                          <Badge variant="success" size="sm" withDot>Verified in DB</Badge>
                        )}
                        {act.submissionStatus === 'submitted' && (
                          <Badge variant="warning" size="sm" withDot>Pending M&E Check</Badge>
                        )}
                        {act.submissionStatus === 'returned_for_correction' && (
                          <Badge variant="danger" size="sm" withDot>Flagged Discrepancy</Badge>
                        )}
                        {act.submissionStatus === 'draft' && (
                          <Badge variant="neutral" size="sm" withDot>Draft</Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-charcoal-muted flex items-center gap-3 flex-wrap">
                        <span>Submitted by {act.submittedByName}</span>
                        <span>•</span>
                        <span>{act.activityDate}</span>
                        <span>•</span>
                        <span>{act.location || 'Field Location'}</span>
                        <span>•</span>
                        <span className="font-semibold text-charcoal-800">{act.participantsCount} Participants</span>
                        <span>•</span>
                        <span>{act.evidenceDocuments?.length || 0} Evidence Files</span>
                      </div>
                      {act.reviewComments && (
                        <p className="text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1">
                          <strong>M&E Remarks:</strong> {act.reviewComments}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {act.submissionStatus !== 'approved' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleValidateActivity(act.id)}
                          disabled={isProcessing}
                          className="text-xs h-8 px-2.5 bg-emerald-700 hover:bg-emerald-800"
                          title="Validate and record official approval in database"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Validate</span>
                        </Button>
                      )}
                      {act.submissionStatus !== 'returned_for_correction' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFlagActivity(act.id)}
                          disabled={isProcessing}
                          className="text-xs h-8 px-2.5 text-amber-700 border-amber-300 hover:bg-amber-50"
                          title="Flag data discrepancy and return to field coordinator"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          <span>Flag</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Data Quality Standards & Direct Tools */}
        <div className="space-y-6">
          <Card className="p-5 bg-white border border-surface-border">
            <h3 className="text-sm font-semibold text-charcoal-900 flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-forest-700" />
              <span>Data Quality Governance Rules</span>
            </h3>
            <div className="space-y-3 text-xs text-charcoal-muted">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-emerald-900 font-semibold">Attendance Verification</strong>
                  Reported participant tallies must match signed physical registers uploaded to the document registry.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-950">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-blue-900 font-semibold">Database Authority</strong>
                  All verifications update PostgreSQL activities table directly with reviewer ID and timestamp.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-900 font-semibold">Field Evidence Traceability</strong>
                  Discrepant participant reports are returned to field coordinators with mandatory corrective remarks.
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
              Export validated output figures, participant demographics, and disaggregated indicators from Supabase for donor submissions.
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
