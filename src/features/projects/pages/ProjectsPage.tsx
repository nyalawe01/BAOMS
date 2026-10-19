/**
 * Projects Page (Project Register & Project Manager Portal)
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Central register for organizational projects, grants, and programs,
 * and unified portal for Project Planning, Work Plans, Teams, Beneficiaries,
 * Risks, Budgets, Reports, and Documents.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  Wallet,
  Activity,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileText,
  CalendarCheck,
  ShieldAlert,
  PieChart,
  ClipboardList,
  FolderOpen,
  CheckSquare,
  MapPin,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/lib/permissions';
import { ProjectRecord, ProjectStatus } from '../types/project';
import { getProjects, createProject } from '../services/projectService';
import { CreateProjectModal } from '../components/CreateProjectModal';

// Sub-views
import { ProjectPlanningView } from '../components/ProjectPlanningView';
import { WorkPlansActivitiesView } from '../components/WorkPlansActivitiesView';
import { ProjectTeamView } from '../components/ProjectTeamView';
import { BeneficiariesView } from '../components/BeneficiariesView';
import { ProjectRisksView } from '../components/ProjectRisksView';
import { ProjectBudgetsView } from '../components/ProjectBudgetsView';
import { ProjectReportsDeliverablesView } from '../components/ProjectReportsDeliverablesView';
import { ProjectDocumentsView } from '../components/ProjectDocumentsView';
import { CoordinatorTasksView } from '../components/CoordinatorTasksView';
import { FieldUpdatesView } from '../components/FieldUpdatesView';

export type ProjectPortalTab =
  | 'projects'
  | 'planning'
  | 'activities'
  | 'tasks'
  | 'field-updates'
  | 'team'
  | 'beneficiaries'
  | 'risks'
  | 'budgets'
  | 'reports'
  | 'documents';

interface ProjectsPageProps {
  initialTab?: ProjectPortalTab;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ initialTab = 'projects' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, roles, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<ProjectPortalTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for Projects Register
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const canCreateProject =
    hasPermission(PERMISSIONS.PROJECTS_CREATE) ||
    hasPermission(PERMISSIONS.PROJECTS_MANAGE) ||
    roles.includes('system_admin') ||
    roles.includes('project_manager');

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProjects(
        {
          searchQuery,
          status: statusFilter,
        },
        user ? { id: user.id, role: roles[0] } : undefined
      );
      setProjects(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, user, roles]);

  useEffect(() => {
    if (activeTab === 'projects') {
      loadProjects();
    }
  }, [loadProjects, activeTab]);

  // Metric aggregates for Projects
  const metrics = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === 'active').length;
    const totalBudget = projects.reduce((acc, p) => acc + (p.totalBudget || 0), 0);
    const totalActivities = projects.reduce((acc, p) => acc + (p.activityCount || 0), 0);
    return { total, active, totalBudget, totalActivities };
  }, [projects]);

  const formatCurrency = (amount?: number | null, currency: string = 'TZS') => {
    return `${currency || 'TZS'} ${(amount ?? 0).toLocaleString()}`;
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'active':
        return <StatusIndicator status="active" label={t('projects.status.active', 'Active')} />;
      case 'planning':
        return <StatusIndicator status="planning" label={t('projects.status.planning', 'Planning')} />;
      case 'completed':
        return <StatusIndicator status="completed" label={t('projects.status.completed', 'Completed')} />;
      case 'on_hold':
        return <StatusIndicator status="on_hold" label={t('projects.status.on_hold', 'On Hold')} />;
      case 'cancelled':
        return <StatusIndicator status="cancelled" label={t('projects.status.cancelled', 'Cancelled')} />;
      default:
        return <StatusIndicator status={status} label={status} />;
    }
  };

  const tabs: Array<{
    id: ProjectPortalTab;
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'projects', label: t('nav.myProjects', 'My Projects'), path: '/projects', icon: Briefcase },
    { id: 'planning', label: t('nav.projectPlanning', 'Project Planning'), path: '/projects/planning', icon: Calendar },
    { id: 'activities', label: t('nav.workPlansActivities', 'Work Plans & Activities'), path: '/projects/activities', icon: Activity },
    { id: 'tasks', label: t('nav.taskManagement', 'Task Management'), path: '/projects/tasks', icon: CheckSquare },
    { id: 'field-updates', label: t('nav.fieldUpdates', 'Field Updates'), path: '/projects/field-updates', icon: MapPin },
    { id: 'team', label: t('nav.projectTeam', 'Project Team'), path: '/projects/team', icon: Users },
    { id: 'beneficiaries', label: t('nav.beneficiariesParticipants', 'Beneficiaries & Participants'), path: '/projects/beneficiaries', icon: Users },
    { id: 'risks', label: t('nav.risksIssues', 'Risks & Issues'), path: '/projects/risks', icon: ShieldAlert },
    { id: 'budgets', label: t('nav.budgetsExpenditure', 'Budgets & Expenditure'), path: '/projects/budgets', icon: Wallet },
    { id: 'reports', label: t('nav.reportsDeliverables', 'Reports & Deliverables'), path: '/projects/reports', icon: ClipboardList },
    { id: 'documents', label: t('nav.projectDocuments', 'Project Documents'), path: '/projects/documents', icon: FolderOpen },
  ];

  const handleTabChange = (tabId: ProjectPortalTab, path: string) => {
    setActiveTab(tabId);
    navigate(path);
  };

  // Header Title & Subtitle based on active tab
  const getHeaderDetails = () => {
    switch (activeTab) {
      case 'planning':
        return {
          title: t('projects.planning.title', 'Project Planning & Timelines'),
          subtitle: t('projects.planning.subtitle', 'Strategic implementation phases, key milestones, dates, and coordinator allocations.'),
        };
      case 'activities':
        return {
          title: t('projects.activities.title', 'Work Plans & Field Activities'),
          subtitle: t('projects.activities.subtitle', 'Field activity logs, progress reports, coordinator reviews, and operational deadlines.'),
        };
      case 'tasks':
        return {
          title: t('projects.tasks.title', 'Workplan Tasks & Deliverables'),
          subtitle: t('projects.tasks.subtitle', 'Assigned implementation tasks, operational milestones, and deadline tracking.'),
        };
      case 'field-updates':
        return {
          title: t('projects.fieldUpdates.title', 'Field Updates & Observations'),
          subtitle: t('projects.fieldUpdates.subtitle', 'Site observations, community challenges, required support, and coordinator submissions.'),
        };
      case 'team':
        return {
          title: t('projects.team.title', 'Project Team & Staffing'),
          subtitle: t('projects.team.subtitle', 'Authorized Project Managers, Coordinators, Field Officers, and portfolio roles.'),
        };
      case 'beneficiaries':
        return {
          title: t('projects.beneficiaries.title', 'Beneficiaries & Community Reach'),
          subtitle: t('projects.beneficiaries.subtitle', 'Target population metrics, community participation records, and activity demographics.'),
        };
      case 'risks':
        return {
          title: t('projects.risks.title', 'Project Risks & Field Challenges'),
          subtitle: t('projects.risks.subtitle', 'Operational issues, implementation bottlenecks, and documented mitigation actions.'),
        };
      case 'budgets':
        return {
          title: t('projects.budgets.title', 'Project Budgets & Expenditure'),
          subtitle: t('projects.budgets.subtitle', 'Authorized financial allocations, recorded spend, commitments, and burn rates.'),
        };
      case 'reports':
        return {
          title: t('projects.reports.title', 'Project Reports & Deliverables'),
          subtitle: t('projects.reports.subtitle', 'Monthly progress reports, quarterly donor submissions, and verification deliverables.'),
        };
      case 'documents':
        return {
          title: t('projects.documents.title', 'Project Documents & Evidence'),
          subtitle: t('projects.documents.subtitle', 'Centralized register for project charters, grant contracts, and field verification files.'),
        };
      default:
        return {
          title: t('projects.registerTitle', 'Project & Program Register'),
          subtitle: t('projects.registerSubtitle', 'Manage organizational projects, community initiatives, field activity reporting, and milestone tracking.'),
        };
    }
  };

  const headerDetails = getHeaderDetails();

  return (
    <div className="space-y-6">
      <PageHeader
        title={headerDetails.title}
        subtitle={headerDetails.subtitle}
        breadcrumbs={[
          { label: t('navigation.dashboard', 'Dashboard'), href: '/dashboard' },
          { label: t('navigation.projects', 'Projects'), href: '/projects' },
          ...(activeTab !== 'projects' ? [{ label: tabs.find((t) => t.id === activeTab)?.label || '' }] : []),
        ]}
        actions={
          canCreateProject ? (
            <Button
              variant="primary"
              onClick={() => navigate('/projects/new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>{t('projects.newProject', 'New Project')}</span>
            </Button>
          ) : roles.includes('executive_director') ? (
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium border border-slate-200">
              Executive Read-Only Oversight
            </span>
          ) : null
        }
      />

      {/* AdminCN Inspired Horizontal Tab Strip */}
      <div className="border-b border-gray-200 bg-white px-2 rounded-t-lg shadow-2xs overflow-x-auto scrollbar-thin">
        <nav className="flex space-x-1" aria-label="Project Submodules">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id, tab.path)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#D68904] text-gray-900 bg-gray-50/70 font-bold'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab View Switching */}
      {activeTab === 'planning' && <ProjectPlanningView />}
      {activeTab === 'activities' && <WorkPlansActivitiesView />}
      {activeTab === 'tasks' && <CoordinatorTasksView />}
      {activeTab === 'field-updates' && <FieldUpdatesView />}
      {activeTab === 'team' && <ProjectTeamView />}
      {activeTab === 'beneficiaries' && <BeneficiariesView />}
      {activeTab === 'risks' && <ProjectRisksView />}
      {activeTab === 'budgets' && <ProjectBudgetsView />}
      {activeTab === 'reports' && <ProjectReportsDeliverablesView />}
      {activeTab === 'documents' && <ProjectDocumentsView />}

      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* KPI Metrics - 5 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span>{t('projects.metrics.totalProjects', 'Total Projects')}</span>
                <Briefcase className="w-4 h-4 text-[#374151]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight">
                {metrics.total}
              </div>
              <p className="mt-1 text-xs text-gray-500 truncate">Portfolio initiatives</p>
            </Card>

            <Card className="p-4 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span>{t('projects.metrics.activeProjects', 'Active Projects')}</span>
                <TrendingUp className="w-4 h-4 text-[#374151]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight">
                {metrics.active}
              </div>
              <p className="mt-1 text-xs text-gray-500 truncate">In field implementation</p>
            </Card>

            <Card className="p-4 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span>{t('projects.metrics.totalBudget', 'Portfolio Budget')}</span>
                <Wallet className="w-4 h-4 text-[#374151]" />
              </div>
              <div className="mt-2 text-xl font-bold text-gray-900 font-mono tabular-nums leading-tight truncate">
                {formatCurrency(metrics.totalBudget)}
              </div>
              <p className="mt-1 text-xs text-gray-500 truncate">Approved donor funding</p>
            </Card>

            <Card className="p-4 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span>{t('projects.metrics.totalActivities', 'Total Activities')}</span>
                <Activity className="w-4 h-4 text-[#374151]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight">
                {metrics.totalActivities}
              </div>
              <p className="mt-1 text-xs text-gray-500 truncate">Logged operational activities</p>
            </Card>
          </div>

          {/* Search and Filters Bar */}
          <Card className="p-4 bg-white border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t(
                    'projects.searchPlaceholder',
                    'Search projects by name, code, donor, or location...'
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D68904] focus:border-[#D68904]"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">{t('common.status', 'Status')}:</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                >
                  <option value="all">{t('common.all', 'All Statuses')}</option>
                  <option value="active">{t('projects.status.active', 'Active')}</option>
                  <option value="planning">{t('projects.status.planning', 'Planning')}</option>
                  <option value="completed">{t('projects.status.completed', 'Completed')}</option>
                  <option value="on_hold">{t('projects.status.on_hold', 'On Hold')}</option>
                  <option value="cancelled">{t('projects.status.cancelled', 'Cancelled')}</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Project Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12">
              <EmptyState
                title={t('projects.emptyTitle', 'No projects found')}
                description={t(
                  'projects.emptyDesc',
                  'No project records match the current filters. Adjust your search criteria or register a new project.'
                )}
                actionLabel={canCreateProject ? t('projects.newProject', 'New Project') : undefined}
                onAction={canCreateProject ? () => navigate('/projects/new') : undefined}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((project) => (
                  <Card
                    key={project.id}
                    className="flex flex-col justify-between border border-gray-200 hover:border-gray-400 transition-all duration-150 shadow-xs hover:shadow-sm overflow-hidden bg-white"
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                          {project.projectCode || 'BAOMS-PRJ'}
                        </span>
                        {getStatusBadge(project.status)}
                      </div>

                      <div>
                        <h3
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="font-bold text-gray-900 text-base leading-snug hover:text-[#D68904] cursor-pointer line-clamp-2"
                        >
                          {project.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          <strong>{t('projects.fields.funder', 'Funder')}:</strong> {project.funder}
                        </p>
                      </div>

                      {project.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                            {project.startDate} — {project.endDate}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(project.totalBudget, project.currency)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-gray-500" />
                            {(project.members || []).length} {t('projects.teamMembers', 'Team')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-gray-500" />
                            {project.activityCount || 0} {t('projects.activitiesCount', 'Activities')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-xs text-gray-600 truncate max-w-[180px]">
                        {(project.members || []).find((m) => m.projectRole === 'manager')?.userName ||
                          t('projects.unassignedManager', 'Unassigned Manager')}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="text-gray-800 hover:text-[#D68904] text-xs font-semibold flex items-center gap-1 p-0 h-auto"
                      >
                        <span>{t('projects.openWorkspace', 'Workspace')}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-800" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {projects.length > pageSize && (
                <Card className="p-0 border border-gray-200 overflow-hidden bg-white">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(projects.length / pageSize)}
                    totalItems={projects.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                  />
                </Card>
              )}
            </div>
          )}

          {/* Create Project Modal */}
          <CreateProjectModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={async (input) => {
              await createProject(input, {
                id: user?.id || 'admin',
                name: profile?.display_name || 'Admin',
              });
              await loadProjects();
            }}
          />
        </div>
      )}
    </div>
  );
};
