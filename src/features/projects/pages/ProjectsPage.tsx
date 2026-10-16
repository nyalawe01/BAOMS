/**
 * Projects Page (Project Register)
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Central register for organizational projects, grants, and programs.
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
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/lib/permissions';
import { ProjectRecord, ProjectStatus } from '../types/project';
import { getProjects, createProject } from '../services/projectService';
import { CreateProjectModal } from '../components/CreateProjectModal';

export const ProjectsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, roles, hasPermission } = useAuth();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
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
    roles.includes('executive_director') ||
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
    loadProjects();
  }, [loadProjects]);

  // Metric aggregates
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('projects.registerTitle', 'Project & Program Register')}
        subtitle={t(
          'projects.registerSubtitle',
          'Manage organizational projects, community initiatives, field activity reporting, and milestone tracking.'
        )}
        breadcrumbs={[
          { label: t('navigation.dashboard', 'Dashboard'), href: '/dashboard' },
          { label: t('navigation.projects', 'Projects') },
        ]}
        actions={
          canCreateProject && (
            <Button
              variant="primary"
              onClick={() => navigate('/projects/new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('projects.newProject', 'New Project')}</span>
            </Button>
          )
        }
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>{t('projects.metrics.totalProjects', 'Total Projects')}</span>
            <Briefcase className="w-4 h-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-charcoal-900 font-mono tabular-nums leading-tight">
            {metrics.total}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Registered donor initiatives
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>{t('projects.metrics.activeProjects', 'Active Programs')}</span>
            <TrendingUp className="w-4 h-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono tabular-nums leading-tight">
            {metrics.active}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            In active field execution
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>{t('projects.metrics.totalBudget', 'Allocated Funding')}</span>
            <Wallet className="w-4 h-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-charcoal-900 font-mono tabular-nums leading-tight" title={formatCurrency(metrics.totalBudget)}>
            {formatCurrency(metrics.totalBudget)}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Committed across all grants
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>{t('projects.metrics.loggedActivities', 'Field Activities')}</span>
            <Activity className="w-4 h-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-charcoal-900 font-mono tabular-nums leading-tight">
            {metrics.totalActivities}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Community workshops & sessions
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white shadow-none border border-surface-border space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('projects.searchPlaceholder', 'Search by code, title, funder...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-surface-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#D68904] focus:border-[#D68904] bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold uppercase text-charcoal-muted mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              {t('common.status', 'Status')}:
            </span>
            {(['all', 'active', 'planning', 'completed', 'on_hold'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-charcoal-900 text-white font-semibold'
                    : 'bg-surface-muted text-charcoal hover:bg-surface-border'
                }`}
              >
                {status === 'all'
                  ? t('common.all', 'All')
                  : t(`projects.status.${status}`, status)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Projects Register List */}
      {isLoading ? (
        <div className="p-12 text-center text-charcoal-muted">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-[#D68904] border-t-transparent rounded-full mb-3" />
          <p className="text-sm">{t('projects.loadingProjects', 'Loading projects...')}</p>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={t('projects.noProjectsFound', 'No Projects Found')}
          description={t(
            'projects.noProjectsDesc',
            'No projects match the current filter criteria or your assigned authorization.'
          )}
          action={
            canCreateProject
              ? {
                  label: t('projects.createFirstProject', 'Create New Project'),
                  onClick: () => navigate('/projects/new'),
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((project) => (
              <Card
                key={project.id}
                className="flex flex-col justify-between hover:border-charcoal-300 transition-colors border border-surface-border bg-white"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#D68904]">
                      {project.projectCode}
                    </span>
                    {getStatusBadge(project.status)}
                  </div>

                  <div>
                    <h3
                      className="font-semibold text-charcoal-900 text-base leading-snug hover:text-[#D68904] cursor-pointer line-clamp-2"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      {project.name}
                    </h3>
                    <p className="text-xs text-charcoal-muted mt-1 truncate">
                      <strong>{t('projects.fields.funder', 'Funder')}:</strong> {project.funder}
                    </p>
                  </div>

                  {project.description && (
                    <p className="text-xs text-charcoal line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-surface-border space-y-2 text-xs text-charcoal-muted">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {project.startDate} — {project.endDate}
                      </span>
                      <span className="font-semibold text-charcoal">
                        {formatCurrency(project.totalBudget, project.currency)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {(project.members || []).length} {t('projects.teamMembers', 'Team')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        {project.activityCount || 0} {t('projects.activitiesCount', 'Activities')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-surface-muted/30 border-t border-surface-border flex items-center justify-between">
                  <div className="text-xs text-charcoal-muted truncate max-w-[180px]">
                    {(project.members || []).find((m) => m.projectRole === 'manager')?.userName ||
                      t('projects.unassignedManager', 'Unassigned Manager')}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="text-charcoal-700 hover:text-[#D68904] text-xs font-semibold flex items-center gap-1 p-0 h-auto"
                  >
                    <span>{t('projects.openWorkspace', 'Workspace')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {projects.length > pageSize && (
            <Card className="p-0 border border-surface-border overflow-hidden bg-white">
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
  );
};
