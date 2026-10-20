/**
 * Project Workspace Page
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Deep multi-tab operational workspace for assigned projects:
 * Overview, Team & Assignments, Field Activities, Tasks, Budget Tracking, Documents, and Reports.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Activity,
  CheckSquare,
  Wallet,
  FileText,
  FileCheck,
  Calendar,
  AlertCircle,
  Plus,
  Paperclip,
  CheckCircle2,
  RotateCcw,
  UserPlus,
  Trash2,
  ExternalLink,
  Download,
  BarChart3,
  Sparkles,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnalyticsVisualizer, AnalyticsDataPoint } from '@/components/ui/AnalyticsVisualizer';
import { ActivityDetailModal } from '../components/ActivityDetailModal';
import { ExportDossierModal } from '../components/ExportDossierModal';
import { ActivityLifecycleWorkspaceModal } from '../components/ActivityLifecycleWorkspaceModal';
import { exportSingleActivityToWord, exportSingleActivityToExcel } from '../utils/exportProjectDossier';
import { useAuth } from '@/features/auth/useAuth';
import { confirmAction, showSuccess, showError } from '@/lib/sweetAlert';
import { PERMISSIONS } from '@/lib/permissions';
import { getProjectEngineData, type ProjectEngineData } from '../dynamic/service';
import { calculateIndicator } from '../dynamic/calculations';
import { ProjectEngineVisualizer } from '../dynamic/ProjectEngineVisualizer';
import {
  ProjectRecord,
  ActivityRecord,
  TaskRecord,
  ProjectReportRecord,
  ProjectBudgetRecord,
  TaskStatus,
} from '../types/project';
import {
  getProjectById,
  getProjectActivities,
  getProjectTasks,
  getProjectReports,
  getProjectBudget,
  createActivity,
  submitActivity,
  reviewActivity,
  createTask,
  updateTask,
  assignProjectMember,
  removeProjectMember,
} from '../services/projectService';
import { RecordActivityModal } from '../components/RecordActivityModal';
import { ReviewActivityModal } from '../components/ReviewActivityModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { AssignMemberModal } from '../components/AssignMemberModal';

export const ProjectWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile, roles, hasPermission } = useAuth();

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [reports, setReports] = useState<ProjectReportRecord[]>([]);
  const [budget, setBudget] = useState<ProjectBudgetRecord | null>(null);
  const [engineData, setEngineData] = useState<ProjectEngineData | null>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedActivityForReview, setSelectedActivityForReview] = useState<ActivityRecord | null>(null);
  const [selectedActivityForDetail, setSelectedActivityForDetail] = useState<ActivityRecord | null>(null);
  const [isExportDossierModalOpen, setIsExportDossierModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedActivityForLifecycle, setSelectedActivityForLifecycle] = useState<ActivityRecord | null>(null);

  // Field activities analytical reach data
  const activityReachData: AnalyticsDataPoint[] = useMemo(() => {
    return activities.map((a) => ({
      label: a.title.length > 20 ? a.title.slice(0, 18) + '…' : a.title,
      value: a.participantsCount || 0,
      description: `${a.activityDate} • ${a.location || 'Field'}`,
    }));
  }, [activities]);

  // Role permissions within this project
  const userMembership = useMemo(() => {
    if (!project || !user) return null;
    return project.members.find((m) => m.userId === user.id);
  }, [project, user]);

  const isSystemManagerOrAbove =
    roles.includes('system_admin') ||
    roles.includes('executive_director') ||
    roles.includes('project_manager') ||
    userMembership?.projectRole === 'manager';

  const canRecordActivity =
    isSystemManagerOrAbove ||
    userMembership?.projectRole === 'coordinator' ||
    userMembership?.projectRole === 'officer' ||
    hasPermission(PERMISSIONS.PROJECTS_REPORT);

  const canManageTasks =
    isSystemManagerOrAbove ||
    userMembership?.projectRole === 'coordinator' ||
    hasPermission(PERMISSIONS.PROJECTS_MANAGE);

  const canManageTeam =
    isSystemManagerOrAbove || hasPermission(PERMISSIONS.PROJECTS_MANAGE);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const proj = await getProjectById(
        id,
        user ? { id: user.id, role: roles[0] } : undefined
      );
      if (!proj) {
        setError('Project not found or you are not authorized to view this project.');
        return;
      }
      setProject(proj);

      const [acts, tsks, reps, bdg] = await Promise.all([
        getProjectActivities(id),
        getProjectTasks(id),
        getProjectReports(id),
        getProjectBudget(id),
      ]);

      setActivities(acts);
      setTasks(tsks);
      setReports(reps);
      setBudget(bdg);

      try {
        const engine = await getProjectEngineData(id);
        setEngineData(engine);
      } catch (engineErr) {
        console.warn('Could not load dynamic engine data for project workspace:', engineErr);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  }, [id, user, roles]);

  const indicatorResults = useMemo(() => {
    if (!engineData) return [];
    const versionsById = new Map(engineData.versions.map((v) => [v.id, v]));
    return engineData.indicators.map((indicator) => {
      const observations = engineData.submissions
        .filter((sub) => sub.status === 'verified')
        .flatMap((sub) => {
          const version = versionsById.get(sub.formVersionId);
          if (!version?.schema.fields.some((f) => f.key === indicator.sourceFieldKey)) return [];
          return [
            {
              value: sub.values[indicator.sourceFieldKey] as number | string | null,
              observedAt: sub.collectedOn,
              verifiedAt: sub.verifiedAt || sub.createdAt,
              recordId: sub.id,
              status: sub.status,
            },
          ];
        });
      return {
        indicator,
        result: calculateIndicator(
          {
            type: indicator.calculationType,
            target: indicator.target,
            aggregation: indicator.aggregation,
          },
          observations
        ),
      };
    });
  }, [engineData]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount: number, currency: string = 'TZS') => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const getActivityBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">{t('projects.activityStatus.approved', 'Approved')}</Badge>;
      case 'submitted':
        return <Badge variant="warning">{t('projects.activityStatus.submitted', 'Submitted (Pending Review)')}</Badge>;
      case 'returned_for_correction':
        return <Badge variant="danger">{t('projects.activityStatus.returned', 'Needs Correction')}</Badge>;
      case 'draft':
      default:
        return <Badge variant="default">{t('projects.activityStatus.draft', 'Draft')}</Badge>;
    }
  };

  const getTaskPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="danger">{t('projects.priority.urgent', 'Urgent')}</Badge>;
      case 'high':
        return <Badge variant="warning">{t('projects.priority.high', 'High')}</Badge>;
      case 'medium':
        return <Badge variant="info">{t('projects.priority.medium', 'Medium')}</Badge>;
      default:
        return <Badge variant="default">{t('projects.priority.low', 'Low')}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-charcoal-muted">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#D68904] border-t-transparent rounded-full mb-3" />
        <p className="text-sm">{t('projects.loadingWorkspace', 'Loading project workspace...')}</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={t('projects.workspace', 'Project Workspace')}
          breadcrumbs={[
            { label: t('navigation.projects', 'Projects'), href: '/projects' },
            { label: t('common.error', 'Error') },
          ]}
        />
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{t('projects.accessDeniedOrNotFound', 'Workspace Unavailable')}</span>
          </div>
          <p className="text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
            {t('projects.backToRegister', 'Return to Project Register')}
          </Button>
        </div>
      </div>
    );
  }

  // Collect all evidence documents across activities
  const allEvidenceDocuments = activities.flatMap((a) => a.evidenceDocuments || []);

  const tabsConfig = [
    { id: 'overview', label: t('projects.tabs.overview', 'Overview') },
    {
      id: 'team',
      label: t('projects.tabs.team', 'Team & Assignments'),
      count: project.members.length,
    },
    {
      id: 'activities',
      label: t('projects.tabs.activities', 'Field Activities'),
      count: activities.length,
    },
    {
      id: 'tasks',
      label: t('projects.tabs.tasks', 'Tasks & Progress'),
      count: tasks.filter((t) => t.status !== 'completed').length,
    },
    {
      id: 'budget',
      label: t('projects.tabs.budget', 'Budget Utilization'),
    },
    {
      id: 'documents',
      label: t('projects.tabs.documents', 'Evidence & Documents'),
      count: allEvidenceDocuments.length,
    },
    {
      id: 'reports',
      label: t('projects.tabs.reports', 'Progress Reports'),
      count: reports.length,
    },
    {
      id: 'dynamic-me',
      label: 'Dynamic M&E & KPIs',
      count: indicatorResults.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb and Header */}
      <PageHeader
        title={
          <div className="flex flex-wrap items-center gap-3">
            <span>{project.name}</span>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-forest-100 text-forest-800 font-semibold border border-forest-300">
              {project.projectCode}
            </span>
            <Badge variant={project.status === 'active' ? 'success' : 'info'}>
              {t(`projects.status.${project.status}`, project.status)}
            </Badge>
          </div>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-4 text-xs text-charcoal-muted mt-1">
            <span>
              <strong>{t('projects.fields.funder', 'Funder')}:</strong> {project.funder}
            </span>
            <span>•</span>
            <span>
              <strong>{t('projects.period', 'Period')}:</strong> {project.startDate} to {project.endDate}
            </span>
            <span>•</span>
            <span>
              <strong>{t('projects.fields.totalBudget', 'Budget')}:</strong>{' '}
              {formatCurrency(project.totalBudget, project.currency)}
            </span>
          </span>
        }
        breadcrumbs={[
          { label: t('navigation.projects', 'Projects'), href: '/projects' },
          { label: project.projectCode },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${project.id}/engine`)}
              className="flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dynamic M&amp;E</span>
            </Button>
            {canRecordActivity && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsActivityModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Activity className="w-4 h-4" />
                <span>{t('projects.recordActivity', 'Record Activity')}</span>
              </Button>
            )}

            {canManageTasks && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <CheckSquare className="w-4 h-4" />
                <span>{t('projects.addTask', 'Add Task')}</span>
              </Button>
            )}

            {canManageTeam && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssignModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('projects.assignMember', 'Assign Team')}</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs Navigation */}
      <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Details & Description */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-5 bg-white border border-surface-border">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-charcoal-muted mb-3">
                  {t('projects.aboutProgram', 'Program Scope & Core Objectives')}
                </h3>
                <p className="text-sm text-charcoal leading-relaxed">
                  {project.description ||
                    t(
                      'projects.noDescription',
                      'No formal narrative description recorded for this project.'
                    )}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-surface-border">
                  <div>
                    <span className="text-[11px] font-semibold text-charcoal-muted uppercase">
                      {t('projects.fields.startDate', 'Start Date')}
                    </span>
                    <p className="text-sm font-medium text-charcoal mt-0.5">{project.startDate}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-charcoal-muted uppercase">
                      {t('projects.fields.endDate', 'End Date')}
                    </span>
                    <p className="text-sm font-medium text-charcoal mt-0.5">{project.endDate}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-charcoal-muted uppercase">
                      {t('projects.fields.currency', 'Currency')}
                    </span>
                    <p className="text-sm font-medium text-charcoal mt-0.5">{project.currency}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-charcoal-muted uppercase">
                      {t('projects.fields.status', 'Status')}
                    </span>
                    <p className="text-sm font-medium text-charcoal mt-0.5 capitalize">
                      {project.status}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Dynamic M&E KPIs Highlight */}
              {indicatorResults.length > 0 && (
                <Card className="p-5 bg-white border border-forest-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-forest-700" />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-forest-950">
                        Dynamic M&amp;E Performance Indicators ({indicatorResults.length} KPIs)
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('dynamic-me')}
                      className="text-xs text-forest-700 p-0 font-semibold"
                    >
                      View All M&amp;E Analytics →
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {indicatorResults.slice(0, 4).map(({ indicator, result }) => {
                      const numVal = typeof result.value === 'number' ? result.value : null;
                      const target = indicator.target;
                      let pct = 0;
                      if (indicator.calculationType === 'percentage_of_target' && numVal != null) {
                        pct = Math.min(Math.max(numVal, 0), 100);
                      } else if (target && target > 0 && numVal != null) {
                        pct = Math.min(Math.max((numVal / target) * 100, 0), 100);
                      }

                      return (
                        <div
                          key={indicator.id}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5"
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-semibold text-xs text-slate-900 line-clamp-1">
                              {indicator.name}
                            </span>
                            <span className="font-mono text-[9px] bg-slate-200 text-slate-700 px-1 py-0.5 rounded">
                              {indicator.code}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between pt-1">
                            <span className="text-base font-bold text-slate-900">
                              {result.value != null
                                ? typeof result.value === 'number'
                                  ? result.value.toLocaleString(undefined, { maximumFractionDigits: 1 })
                                  : result.value
                                : '—'}
                              <span className="text-[10px] font-normal text-slate-500 ml-1">
                                {indicator.calculationType === 'percentage_of_target' ? '%' : indicator.unit}
                              </span>
                            </span>
                            {target != null && (
                              <span className="text-[11px] text-slate-500 font-medium">
                                Target: {target.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {target != null && target > 0 && (
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-forest-600 h-full rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Recent Field Activities */}
              <Card className="p-5 bg-white border border-surface-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-charcoal-muted flex items-center gap-2">
                    <Activity className="w-4 h-4 text-forest-700" />
                    <span>{t('projects.recentActivities', 'Recent Field Activities')}</span>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('activities')}
                    className="text-xs text-forest-700 p-0"
                  >
                    {t('common.viewAll', 'View all')} ({activities.length})
                  </Button>
                </div>

                {activities.length === 0 ? (
                  <p className="text-xs text-charcoal-muted italic py-3">
                    {t('projects.noActivitiesLogged', 'No activities recorded yet for this project.')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activities.slice(0, 3).map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-lg border border-surface-border bg-surface-muted/20 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-forest-950">
                            {act.title}
                          </span>
                          {getActivityBadge(act.submissionStatus)}
                        </div>
                        <p className="text-xs text-charcoal line-clamp-2">{act.progress}</p>
                        <div className="flex items-center justify-between text-[11px] text-charcoal-muted pt-1">
                          <span>
                            {act.activityDate} • {act.location || 'Location unspecified'}
                          </span>
                          <span>
                            {act.participantsCount} {t('projects.participants', 'participants')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Col: Budget & Team Snapshot */}
            <div className="space-y-6">
              {/* Budget Card */}
              {budget && (
                <Card className="p-5 bg-white border border-surface-border">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-charcoal-muted mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-forest-700" />
                    <span>{t('projects.budgetSnapshot', 'Budget Snapshot')}</span>
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-charcoal-muted">
                        <span>{t('projects.burnRate', 'Utilization / Burn Rate')}</span>
                        <span className="font-semibold text-charcoal">
                          {budget.burnRatePercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-surface-muted rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            budget.burnRatePercent > 90
                              ? 'bg-red-500'
                              : budget.burnRatePercent > 70
                              ? 'bg-amber-500'
                              : 'bg-forest-700'
                          }`}
                          style={{ width: `${Math.min(100, budget.burnRatePercent)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-surface-border space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-charcoal-muted">{t('projects.allocated', 'Allocated')}:</span>
                        <span className="font-semibold text-charcoal">
                          {formatCurrency(budget.totalAllocated, budget.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal-muted">{t('projects.spent', 'Spent')}:</span>
                        <span className="font-semibold text-emerald-700">
                          {formatCurrency(budget.totalSpent, budget.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal-muted">{t('projects.committed', 'Committed')}:</span>
                        <span className="font-semibold text-amber-700">
                          {formatCurrency(budget.totalCommitted, budget.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-surface-border">
                        <span className="font-semibold text-charcoal">{t('projects.balance', 'Remaining Balance')}:</span>
                        <span className="font-bold text-forest-900">
                          {formatCurrency(budget.balance, budget.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Team Roster Snapshot */}
              <Card className="p-5 bg-white border border-surface-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-charcoal-muted flex items-center gap-2">
                    <Users className="w-4 h-4 text-forest-700" />
                    <span>{t('projects.projectTeam', 'Assigned Team')}</span>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('team')}
                    className="text-xs text-forest-700 p-0"
                  >
                    {t('common.viewAll', 'View all')} ({project.members.length})
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {project.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-surface-border last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-charcoal">{m.userName}</p>
                        <p className="text-[11px] text-charcoal-muted">{m.userEmail}</p>
                      </div>
                      <Badge variant="default" className="capitalize text-[10px]">
                        {m.projectRole}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEAM & ASSIGNMENTS */}
      {activeTab === 'team' && (
        <Card className="p-6 bg-white border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-forest-950 text-base">
                {t('projects.teamManagement', 'Project Workspace Team & Delegations')}
              </h3>
              <p className="text-xs text-charcoal-muted">
                {t(
                  'projects.teamDescription',
                  'Staff members assigned to this project with role-based access to activities and budget details.'
                )}
              </p>
            </div>

            {canManageTeam && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAssignModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('projects.assignMember', 'Assign Member')}</span>
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted/50 text-charcoal-muted uppercase text-[11px] font-semibold border-y border-surface-border">
                <tr>
                  <th className="py-2.5 px-4">{t('projects.staffMember', 'Staff Member')}</th>
                  <th className="py-2.5 px-4">{t('projects.workspaceRole', 'Workspace Role')}</th>
                  <th className="py-2.5 px-4">{t('projects.assignedDate', 'Assigned Date')}</th>
                  {canManageTeam && (
                    <th className="py-2.5 px-4 text-right">{t('common.actions', 'Actions')}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {project.members.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-muted/20">
                    <td className="py-3 px-4">
                      <div className="font-medium text-charcoal">{m.userName}</div>
                      <div className="text-xs text-charcoal-muted">{m.userEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="default" className="capitalize">
                        {m.projectRole}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-muted">
                      {new Date(m.assignedAt).toLocaleDateString()}
                    </td>
                    {canManageTeam && (
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={m.projectRole === 'manager' && project.members.filter((x) => x.projectRole === 'manager').length === 1}
                          onClick={async () => {
                            const confirmed = await confirmAction({
                              title: t('projects.removeMemberTitle', 'Remove Project Member'),
                              text: t('projects.confirmRemoveMember', 'Remove this member from project?'),
                              confirmButtonText: t('common.remove', 'Remove'),
                              isDangerous: true,
                            });
                            if (confirmed) {
                              try {
                                await removeProjectMember(project.id, m.userId);
                                await loadData();
                                await showSuccess(t('projects.memberRemoved', 'Member removed from project.'));
                              } catch (err: unknown) {
                                await showError(t('common.error', 'Error'), (err as Error).message || 'Failed to remove member.');
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: ACTIVITIES */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          {/* Header & Global Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Field Activities & Output Intelligence
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Spacious room for comprehensive qualitative narratives, participant feedback, demographic analytics, and multi-format exports.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportDossierModalOpen(true)}
                className="flex items-center gap-1.5 text-xs text-[#D68904] border-[#D68904]/40 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                title="Export complete analytical dossier in Word, Excel, or PDF"
              >
                <Download className="w-4 h-4" />
                <span>Export Dossier (Word / Excel / PDF)</span>
              </Button>

              {canRecordActivity && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsActivityModalOpen(true)}
                  className="bg-[#D68904] hover:bg-[#b45309] text-white flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('projects.recordActivity', 'Record Field Activity')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Interactive Cross-Activity Analytics Engine */}
          {activities.length > 0 && (
            <AnalyticsVisualizer
              title="Field Activities Reach & Output Distribution"
              description="Analyze community participation across activities with instant switcher: Bar Chart, Line Graph, Donut Distribution, and Data Table"
              data={activityReachData}
              valueSuffix=" participants"
              defaultMode="bar"
              availableModes={['bar', 'line', 'pie', 'table']}
              height={260}
              showSummaryCards={true}
              summaryMetrics={[
                {
                  label: 'Total Activities',
                  value: activities.length,
                  helper: `${activities.filter((a) => a.submissionStatus === 'approved').length} verified & approved`,
                },
                {
                  label: 'Total Verified Footprint',
                  value: activities.reduce((sum, a) => sum + (a.participantsCount || 0), 0),
                  helper: 'Direct community attendees',
                },
                {
                  label: 'Average Engagement',
                  value: activities.length > 0 ? Math.round(activities.reduce((sum, a) => sum + (a.participantsCount || 0), 0) / activities.length) : 0,
                  helper: 'Per field intervention',
                },
                {
                  label: 'Operational Budget Spent',
                  value: `TZS ${activities.reduce((sum, a) => sum + (a.budgetSpent || 0), 0) >= 1000000 ? `${(activities.reduce((sum, a) => sum + (a.budgetSpent || 0), 0) / 1000000).toFixed(1)}M` : (activities.reduce((sum, a) => sum + (a.budgetSpent || 0), 0) / 1000).toFixed(0) + 'k'}`,
                  helper: 'Field expenditure logged',
                },
              ]}
            />
          )}

          {activities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title={t('projects.noActivities', 'No Field Activities Logged')}
              description={t(
                'projects.noActivitiesPrompt',
                'Begin by recording the first activity, workshop, or community engagement session.'
              )}
              action={
                canRecordActivity
                  ? {
                      label: t('projects.recordActivity', 'Record Field Activity'),
                      onClick: () => setIsActivityModalOpen(true),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {activities.map((act) => (
                <Card
                  key={act.id}
                  className="p-5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-neutral-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {act.activityCode && (
                          <span className="font-mono text-xs font-bold bg-[#D68904]/10 text-[#b45309] px-2 py-0.5 rounded border border-[#D68904]/30">
                            {act.activityCode}
                          </span>
                        )}
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">{act.title}</h4>
                        {getActivityBadge(act.submissionStatus)}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-neutral-400">
                        <Calendar className="w-3.5 h-3.5 inline mr-1 text-[#D68904]" />
                        {act.activityDate} • {act.wardLocation || act.location || t('projects.locationNotSet', 'Location not specified')} •{' '}
                        <strong className="text-slate-800 dark:text-neutral-200">{act.participantsCount}</strong> {t('projects.participants', 'participants reached')}
                      </p>

                      {/* Decoupled Lifecycle Status Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-700 font-medium border border-slate-200">
                          Req: <strong className="capitalize">{act.requestStatus?.replace('_', ' ') || 'Not Submitted'}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-700 font-medium border border-slate-200">
                          Proc: <strong className="capitalize">{act.procurementStatus?.replace('_', ' ') || 'Not Required'}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-700 font-medium border border-slate-200">
                          Impl: <strong className="capitalize">{act.implementationStatus?.replace('_', ' ') || 'Planned'}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-700 font-medium border border-slate-200">
                          M&amp;E: <strong className="capitalize">{act.meStatus?.replace('_', ' ') || 'Draft'}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-700 font-medium border border-slate-200">
                          Retire: <strong className="capitalize">{act.retirementStatus?.replace('_', ' ') || 'Not Started'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedActivityForLifecycle(act)}
                        className="bg-[#D68904] hover:bg-[#b45309] text-white text-xs flex items-center gap-1.5 font-semibold"
                        title="Open End-to-End Lifecycle: Request, Procurement, Attendance, M&E and Retirement"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Lifecycle Workspace</span>
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedActivityForDetail(act)}
                        className="bg-slate-900 dark:bg-neutral-800 hover:bg-slate-800 text-white text-xs flex items-center gap-1.5"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-[#F2A507]" />
                        <span>Full Narrative</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportSingleActivityToWord(act, project.name)}
                        className="text-xs text-blue-700 dark:text-blue-400 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        title="Download Word Document"
                      >
                        Word
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportSingleActivityToExcel(act, project.name)}
                        className="text-xs text-emerald-700 dark:text-emerald-400 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                        title="Download Excel Spreadsheet"
                      >
                        Excel
                      </Button>

                      {/* Coordinator action: Submit draft */}
                      {act.submissionStatus === 'draft' && canRecordActivity && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            await submitActivity(act.id, { id: user?.id || 'coord' });
                            await loadData();
                          }}
                          className="text-xs"
                        >
                          {t('projects.submitForReview', 'Submit for Review')}
                        </Button>
                      )}

                      {/* Manager action: Review & Decide */}
                      {act.submissionStatus === 'submitted' && isSystemManagerOrAbove && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedActivityForReview(act)}
                          className="text-xs flex items-center gap-1 bg-[#D68904] hover:bg-[#b45309]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('projects.reviewDecide', 'Review & Decide')}</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Background Context Banner if available */}
                  {act.backgroundContext && (
                    <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 text-xs text-slate-700 dark:text-neutral-300">
                      <span className="font-bold text-[#b45309] block uppercase text-[10px] tracking-wider mb-0.5">
                        Background Context & Problem Statement:
                      </span>
                      <p className="line-clamp-2">{act.backgroundContext}</p>
                    </div>
                  )}

                  {/* Narrative Preview */}
                  <div className="text-xs text-slate-700 dark:text-neutral-300 space-y-2">
                    <p className="line-clamp-3 text-justify leading-relaxed">
                      <strong className="text-slate-900 dark:text-white">Field Narrative & Output Summary:</strong>{' '}
                      {act.sessionNarrative || act.progress}
                    </p>
                  </div>

                  {/* Demographic Breakdown Chips */}
                  {act.demographicBreakdown && (
                    <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
                      <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Demographics:</span>
                      {act.demographicBreakdown.female !== undefined && (
                        <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-950/50 text-[#b45309] rounded-md font-medium">
                          Female: {act.demographicBreakdown.female}
                        </span>
                      )}
                      {act.demographicBreakdown.male !== undefined && (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/50 text-[#D68904] rounded-md font-medium">
                          Male: {act.demographicBreakdown.male}
                        </span>
                      )}
                      {act.demographicBreakdown.youth !== undefined && (
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded-md font-medium">
                          Youth: {act.demographicBreakdown.youth}
                        </span>
                      )}
                      {act.demographicBreakdown.adults !== undefined && (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 rounded-md font-medium">
                          Adults: {act.demographicBreakdown.adults}
                        </span>
                      )}
                      {act.demographicBreakdown.specialNeeds !== undefined && (
                        <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 rounded-md font-medium">
                          Special Needs: {act.demographicBreakdown.specialNeeds}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Participant Quote Preview */}
                  {act.participantQuotes && act.participantQuotes.length > 0 && act.participantQuotes[0] && (
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-neutral-800/40 border-l-3 border-[#F2A507] text-xs">
                      <p className="italic text-slate-800 dark:text-neutral-200">
                        "{act.participantQuotes[0].quote}"
                      </p>
                      <span className="text-[10px] text-[#b45309] font-semibold mt-1 block">
                        — {act.participantQuotes[0].speaker}
                      </span>
                    </div>
                  )}

                  {/* Operational Challenges & Follow-up */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {act.challenges && (
                      <div className="text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800/50">
                        <strong className="block text-[10px] uppercase font-bold text-amber-800 mb-0.5">Challenges:</strong>
                        <p className="line-clamp-2">{act.challenges}</p>
                      </div>
                    )}
                    {act.followUpActions && (
                      <div className="text-slate-800 dark:text-neutral-200 bg-slate-50 dark:bg-neutral-800/40 p-2 rounded border border-slate-200 dark:border-neutral-700">
                        <strong className="block text-[10px] uppercase font-bold text-slate-600 mb-0.5">Next Steps:</strong>
                        <p className="line-clamp-2">{act.followUpActions}</p>
                      </div>
                    )}
                  </div>

                  {/* Review Comments */}
                  {act.reviewComments && (
                    <div
                      className={`p-3 rounded text-xs border ${
                        act.submissionStatus === 'returned_for_correction'
                          ? 'bg-red-50 border-red-200 text-red-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1 mb-1">
                        {act.submissionStatus === 'returned_for_correction' ? (
                          <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        {t('projects.reviewFeedback', 'Manager Feedback')} ({act.reviewedByName || 'Reviewer'}):
                      </span>
                      <p>{act.reviewComments}</p>
                    </div>
                  )}

                  {/* Attached Evidence Files */}
                  {act.evidenceDocuments && act.evidenceDocuments.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-neutral-800">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1 mb-2">
                        <Paperclip className="w-3 h-3 text-[#D68904]" />
                        {t('projects.supportingEvidence', 'Attached Evidence Documents')} ({act.evidenceDocuments.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {act.evidenceDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-neutral-800 rounded text-xs text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 font-medium"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#D68904]" />
                            <span className="truncate max-w-[200px]">{doc.documentTitle}</span>
                            <span className="text-[10px] text-slate-400">({doc.documentReference})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-neutral-800">
                    <span>
                      {t('projects.recordedBy', 'Recorded by')}:{' '}
                      <strong className="text-slate-700 dark:text-neutral-300">{act.submittedByName || 'Coordinator'}</strong>
                    </span>
                    {act.submittedAt && (
                      <span>
                        {t('projects.submittedAt', 'Submitted')}:{' '}
                        {new Date(act.submittedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-forest-950 text-base">
                {t('projects.tasksRegister', 'Action Items & Task Tracking')}
              </h3>
              <p className="text-xs text-charcoal-muted">
                {t(
                  'projects.tasksDescription',
                  'Assign deliverables, establish milestones, and track execution status.'
                )}
              </p>
            </div>

            {canManageTasks && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{t('projects.addTask', 'Create New Task')}</span>
              </Button>
            )}
          </div>

          {tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title={t('projects.noTasks', 'No Tasks Scheduled')}
              description={t(
                'projects.noTasksPrompt',
                'Create tasks to delegate operational work to coordinators and officers.'
              )}
              action={
                canManageTasks
                  ? {
                      label: t('projects.addTask', 'Create New Task'),
                      onClick: () => setIsTaskModalOpen(true),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card
                  key={task.id}
                  className="p-4 bg-white border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={async (e) => {
                          const nextStatus: TaskStatus = e.target.checked ? 'completed' : 'in_progress';
                          await updateTask(
                            { taskId: task.id, status: nextStatus },
                            { id: user?.id || 'staff', name: profile?.display_name || 'Staff' }
                          );
                          await loadData();
                        }}
                        className="w-4 h-4 text-charcoal-900 rounded border-surface-border focus:ring-slate-400 cursor-pointer"
                      />
                      <h4
                        className={`text-sm font-semibold ${
                          task.status === 'completed'
                            ? 'line-through text-charcoal-muted'
                            : 'text-forest-950'
                        }`}
                      >
                        {task.title}
                      </h4>
                      {getTaskPriorityBadge(task.priority)}
                    </div>

                    {task.description && (
                      <p className="text-xs text-charcoal pl-6 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-charcoal-muted pl-6 pt-1">
                      {task.activityTitle && (
                        <span>
                          <strong>{t('projects.activity', 'Activity')}:</strong> {task.activityTitle}
                        </span>
                      )}
                      <span>
                        <strong>{t('projects.assignedTo', 'Assigned To')}:</strong>{' '}
                        {task.assignedToName || t('common.unassigned', 'Unassigned')}
                      </span>
                      {task.dueDate && (
                        <span>
                          <strong>{t('projects.dueDate', 'Due')}:</strong> {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <select
                      value={task.status}
                      onChange={async (e) => {
                        await updateTask(
                          { taskId: task.id, status: e.target.value as TaskStatus },
                          { id: user?.id || 'staff', name: profile?.display_name || 'Staff' }
                        );
                        await loadData();
                      }}
                      className="text-xs border border-surface-border rounded px-2.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
                    >
                      <option value="todo">{t('projects.taskStatus.todo', 'To Do')}</option>
                      <option value="in_progress">{t('projects.taskStatus.inProgress', 'In Progress')}</option>
                      <option value="completed">{t('projects.taskStatus.completed', 'Completed')}</option>
                    </select>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BUDGET */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          {budget ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-white border border-surface-border">
                  <span className="text-xs font-semibold uppercase text-charcoal-muted">
                    {t('projects.allocatedBudget', 'Allocated Budget')}
                  </span>
                  <p className="text-xl font-bold text-forest-950 mt-1">
                    {formatCurrency(budget.totalAllocated, budget.currency)}
                  </p>
                </Card>

                <Card className="p-4 bg-white border border-surface-border">
                  <span className="text-xs font-semibold uppercase text-charcoal-muted">
                    {t('projects.totalSpent', 'Total Expenditures')}
                  </span>
                  <p className="text-xl font-bold text-emerald-700 mt-1">
                    {formatCurrency(budget.totalSpent, budget.currency)}
                  </p>
                </Card>

                <Card className="p-4 bg-white border border-surface-border">
                  <span className="text-xs font-semibold uppercase text-charcoal-muted">
                    {t('projects.committedFunds', 'Committed Commitments')}
                  </span>
                  <p className="text-xl font-bold text-amber-700 mt-1">
                    {formatCurrency(budget.totalCommitted, budget.currency)}
                  </p>
                </Card>

                <Card className="p-4 bg-white border border-surface-border">
                  <span className="text-xs font-semibold uppercase text-charcoal-muted">
                    {t('projects.availableBalance', 'Remaining Balance')}
                  </span>
                  <p className="text-xl font-bold text-charcoal-900 mt-1">
                    {formatCurrency(budget.balance, budget.currency)}
                  </p>
                </Card>
              </div>

              <Card className="p-6 bg-white border border-surface-border space-y-4">
                <h3 className="font-semibold text-forest-950 text-base">
                  {t('projects.burnRateAnalysis', 'Budget Utilization Analysis')}
                </h3>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-charcoal">
                      {t('projects.burnRatePercent', 'Disbursed Burn Rate')}:
                    </span>
                    <span className="font-bold text-forest-900">
                      {budget.burnRatePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full h-4 bg-surface-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        budget.burnRatePercent > 90
                          ? 'bg-red-500'
                          : budget.burnRatePercent > 70
                          ? 'bg-amber-500'
                          : 'bg-forest-700'
                      }`}
                      style={{ width: `${Math.min(100, budget.burnRatePercent)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-surface-muted/30 border border-surface-border rounded-lg text-xs text-charcoal space-y-2">
                  <p className="font-semibold text-forest-950">
                    {t('projects.financialPolicyNote', 'Financial Governance Policy Note')}:
                  </p>
                  <p>
                    {t(
                      'projects.budgetNoteText',
                      'Project Coordinators may report activity expenses and draft requirements, but cannot modify approved budget allocations. Detailed disbursements and voucher requisitions are managed under Phase 8 Finance workflows.'
                    )}
                  </p>
                  <p className="text-[11px] text-charcoal-muted">
                    {t('projects.lastReviewed', 'Last reviewed on')}:{' '}
                    {new Date(budget.lastReviewedAt).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            </>
          ) : (
            <EmptyState
              icon={Wallet}
              title={t('projects.noBudgetRecord', 'No Budget Record Found')}
              description={t(
                'projects.noBudgetDesc',
                'No financial allocation record has been initialized for this project.'
              )}
            />
          )}
        </div>
      )}

      {/* TAB 6: DOCUMENTS & EVIDENCE */}
      {activeTab === 'documents' && (
        <Card className="p-6 bg-white border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-forest-950 text-base">
                {t('projects.supportingDocuments', 'Supporting Evidence & Field Documents')}
              </h3>
              <p className="text-xs text-charcoal-muted">
                {t(
                  'projects.documentsDesc',
                  'Attendance sheets, photographs, agreements, and M&E evidence files attached to this project.'
                )}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/documents')}
              className="text-xs flex items-center gap-1"
            >
              <span>{t('projects.openDocumentRegister', 'Full Document Repository')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>

          {allEvidenceDocuments.length === 0 ? (
            <p className="text-xs text-charcoal-muted italic py-6 text-center">
              {t(
                'projects.noEvidenceFound',
                'No supporting documents or photo evidence have been attached yet to activities in this project.'
              )}
            </p>
          ) : (
            <div className="divide-y divide-surface-border">
              {allEvidenceDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="py-3 flex items-center justify-between hover:bg-surface-muted/20 px-2 rounded"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-forest-50 text-forest-700 rounded">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-forest-950">
                        {doc.documentTitle}
                      </h4>
                      <p className="text-xs text-charcoal-muted">
                        {doc.documentReference} •{' '}
                        {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'PDF'} •{' '}
                        {new Date(doc.attachedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/documents')}
                    className="text-xs text-forest-700"
                  >
                    {t('common.view', 'View Record')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 7: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-forest-950 text-base">
                {t('projects.progressReports', 'Progress & Milestone Reports')}
              </h3>
              <p className="text-xs text-charcoal-muted">
                {t(
                  'projects.reportsDesc',
                  'Formal monthly, quarterly, and donor narrative progress submissions.'
                )}
              </p>
            </div>
          </div>

          {reports.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title={t('projects.noReports', 'No Reports Submitted')}
              description={t(
                'projects.noReportsDesc',
                'No quarterly or donor progress reports have been compiled yet for this program.'
              )}
            />
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => (
                <Card key={rep.id} className="p-5 bg-white border border-surface-border space-y-3">
                  <div className="flex items-center justify-between border-b border-surface-border pb-3">
                    <div>
                      <h4 className="font-bold text-forest-950 text-base">{rep.title}</h4>
                      <p className="text-xs text-charcoal-muted">
                        <span className="uppercase font-semibold text-forest-800">
                          {rep.reportType}
                        </span>{' '}
                        • {rep.reportingPeriodStart} to {rep.reportingPeriodEnd}
                      </p>
                    </div>
                    <Badge variant="success" className="capitalize">
                      {rep.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-charcoal leading-relaxed">
                    <strong>{t('projects.executiveSummary', 'Executive Summary')}:</strong>{' '}
                    {rep.summary}
                  </p>

                  {rep.achievements && (
                    <p className="text-xs text-charcoal leading-relaxed">
                      <strong className="text-emerald-800">
                        {t('projects.keyAchievements', 'Key Achievements')}:
                      </strong>{' '}
                      {rep.achievements}
                    </p>
                  )}

                  {rep.recommendations && (
                    <p className="text-xs text-charcoal leading-relaxed">
                      <strong className="text-forest-900">
                        {t('projects.recommendations', 'Recommendations')}:
                      </strong>{' '}
                      {rep.recommendations}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-charcoal-muted pt-2 border-t border-surface-border">
                    <span>
                      {t('projects.compiledBy', 'Compiled by')}:{' '}
                      <strong>{rep.submittedByName || 'Mariam M. Juma'}</strong>
                    </span>
                    {rep.documentTitle && (
                      <span className="flex items-center gap-1 text-forest-700">
                        <Paperclip className="w-3 h-3" />
                        {rep.documentTitle}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: DYNAMIC M&E & KPIS */}
      {activeTab === 'dynamic-me' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-forest-50 border border-forest-200 rounded-xl">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-forest-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-forest-700" />
                <span>Dynamic Data Collection &amp; Field Verification Engine</span>
              </h3>
              <p className="text-xs text-forest-800">
                Data forms and KPI indicators configured for this project. Field officers log observations; M&amp;E officers verify them.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/projects/${project.id}/engine`)}
              className="flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Open Data Collection &amp; Review Studio</span>
            </Button>
          </div>

          <ProjectEngineVisualizer
            indicators={indicatorResults}
            submissions={engineData?.submissions || []}
            projectName={project.name}
            projectCode={project.projectCode}
          />
        </div>
      )}

      {/* Record Activity Modal */}
      <RecordActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
        onSubmit={async (input) => {
          await createActivity(input, {
            id: user?.id || 'coord',
            name: profile?.display_name || 'Staff Member',
          });
          await loadData();
        }}
      />

      {/* Review Activity Modal */}
      <ReviewActivityModal
        isOpen={!!selectedActivityForReview}
        onClose={() => setSelectedActivityForReview(null)}
        activity={selectedActivityForReview}
        onSubmit={async (input) => {
          await reviewActivity(input, {
            id: user?.id || 'pm',
            name: profile?.display_name || 'Mariam M. Juma',
          });
          await loadData();
        }}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        projectId={project.id}
        activities={activities}
        members={project.members}
        onSubmit={async (input) => {
          await createTask(input, {
            id: user?.id || 'manager',
            name: profile?.display_name || 'Manager',
          });
          await loadData();
        }}
      />

      {/* Assign Member Modal */}
      <AssignMemberModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        projectId={project.id}
        existingUserIds={project.members.map((m) => m.userId)}
        onSubmit={async (input) => {
          await assignProjectMember(input, {
            id: user?.id || 'manager',
          });
          await loadData();
        }}
      />

      {/* Activity Full Analytical Detail Modal */}
      <ActivityDetailModal
        isOpen={!!selectedActivityForDetail}
        onClose={() => setSelectedActivityForDetail(null)}
        activity={selectedActivityForDetail}
        projectName={project.name}
      />

      {/* Activity End-to-End Lifecycle Workspace Modal */}
      <ActivityLifecycleWorkspaceModal
        isOpen={!!selectedActivityForLifecycle}
        onClose={() => setSelectedActivityForLifecycle(null)}
        activity={selectedActivityForLifecycle}
        projectName={project.name}
        currency={project.currency}
        isManagerOrAbove={isSystemManagerOrAbove}
        isFinanceOfficer={roles.includes('finance_manager') || roles.includes('finance_officer')}
        onActivityUpdated={async () => {
          await loadData();
          if (selectedActivityForLifecycle && project) {
            const updated = await getProjectActivities(project.id);
            const found = updated.find((a) => a.id === selectedActivityForLifecycle.id);
            if (found) setSelectedActivityForLifecycle(found);
          }
        }}
      />

      {/* Export Project Analytical Dossier Modal */}
      <ExportDossierModal
        isOpen={isExportDossierModalOpen}
        onClose={() => setIsExportDossierModalOpen(false)}
        project={project}
        activities={activities}
        tasks={tasks}
        reports={reports}
      />
    </div>
  );
};
