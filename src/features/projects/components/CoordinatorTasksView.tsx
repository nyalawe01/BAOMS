/**
 * Coordinator Tasks & Deliverables Management View
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Provides Project Coordinators with an operational register of assigned tasks,
 * workplan milestones, upcoming deadlines, and status update capabilities.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckSquare,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  ExternalLink,
  Briefcase,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Table } from '@/components/ui/Table';
import { Chip } from '@/components/ui/Chip';
import { getAllTasks, getProjects, updateTask } from '../services/projectService';
import { TaskRecord, ProjectRecord } from '../types/project';
import { useAuth } from '@/features/auth/useAuth';
import { showSuccess, showError } from '@/lib/sweetAlert';

export const CoordinatorTasksView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tList, pList] = await Promise.all([
        getAllTasks(),
        getProjects(),
      ]);
      setTasks(tList);
      setProjects(pList);
    } catch (err) {
      console.error('[CoordinatorTasksView] Error loading tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => {
      if (selectedProjectId !== 'all' && task.projectId !== selectedProjectId) return false;
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          task.title.toLowerCase().includes(q) ||
          (task.description && task.description.toLowerCase().includes(q)) ||
          (task.activityTitle && task.activityTitle.toLowerCase().includes(q)) ||
          (task.assignedToName && task.assignedToName.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [tasks, selectedProjectId, statusFilter, priorityFilter, searchQuery]);

  const paginatedTasks = useMemo(() => {
    const from = (currentPage - 1) * pageSize;
    return filteredTasks.slice(from, from + pageSize);
  }, [filteredTasks, currentPage]);

  // Quick Status Toggle: todo -> in_progress -> completed
  const handleStatusToggle = async (task: TaskRecord) => {
    let nextStatus: 'todo' | 'in_progress' | 'completed' = 'in_progress';
    if (task.status === 'in_progress') nextStatus = 'completed';
    else if (task.status === 'completed') nextStatus = 'todo';

    try {
      await updateTask(
        {
          taskId: task.id,
          status: nextStatus,
        },
        { id: user?.id || 'coord-user', name: 'Project Coordinator' }
      );
      showSuccess(`Task updated to ${nextStatus.replace('_', ' ')}`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg || 'Failed to update task status');
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const now = new Date();
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const overdue = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < now;
    }).length;

    return { total, inProgress, completed, overdue };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('projects.tasks.total', 'Assigned Tasks')}</span>
            <CheckSquare className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight">
            {metrics.total}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Workplan deliverables</p>
        </Card>

        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('projects.tasks.inProgress', 'In Execution')}</span>
            <Clock className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight">
            {metrics.inProgress}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Tasks active in field</p>
        </Card>

        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('projects.tasks.overdue', 'Overdue Deliverables')}</span>
            <AlertTriangle className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-700 font-mono tabular-nums leading-tight">
            {metrics.overdue}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Passed targeted deadline</p>
        </Card>

        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{t('projects.tasks.completed', 'Completed Tasks')}</span>
            <CheckCircle2 className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-800 font-mono tabular-nums leading-tight">
            {metrics.completed}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">Milestones verified</p>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4 bg-white border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('projects.tasks.searchPlaceholder', 'Search tasks by title, deliverable, or assignee...')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D68904] focus:border-[#D68904]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
            >
              <option value="all">{t('projects.allProjects', 'All Projects')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode ? `[${p.projectCode}] ` : ''}{p.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
            >
              <option value="all">{t('common.allStatus', 'All Statuses')}</option>
              <option value="todo">{t('projects.tasks.statusTodo', 'To Do')}</option>
              <option value="in_progress">{t('projects.tasks.statusInProgress', 'In Progress')}</option>
              <option value="completed">{t('projects.tasks.statusCompleted', 'Completed')}</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
            >
              <option value="all">{t('projects.tasks.allPriority', 'All Priorities')}</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tasks Table */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden bg-white">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-gray-300 border-t-[#D68904] rounded-full mb-2" />
            <p>{t('common.loading', 'Loading tasks & deliverables...')}</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title={t('projects.tasks.emptyTitle', 'No tasks found')}
              description={t('projects.tasks.emptyDesc', 'No workplan tasks match your current filters.')}
            />
          </div>
        ) : (
          <div>
            <Table.ScrollContainer>
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50/80 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3.5 w-10">Done</th>
                    <th className="px-4 py-3.5">{t('projects.tasks.colTitle', 'Deliverable & Activity')}</th>
                    <th className="px-4 py-3.5">{t('projects.tasks.colProject', 'Project')}</th>
                    <th className="px-4 py-3.5">{t('projects.tasks.colDue', 'Deadline')}</th>
                    <th className="px-4 py-3.5">{t('projects.tasks.colPriority', 'Priority')}</th>
                    <th className="px-4 py-3.5">{t('projects.tasks.colAssignee', 'Assignee')}</th>
                    <th className="px-4 py-3.5 text-right">{t('common.actions', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedTasks.map((task) => {
                    const isLate = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
                    const isDone = task.status === 'completed';

                    return (
                      <tr key={task.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleStatusToggle(task)}
                            className="rounded border-gray-300 text-[#D68904] focus:ring-[#D68904] w-4 h-4 cursor-pointer"
                          />
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`font-semibold block ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-xs text-gray-500 block line-clamp-1 mt-0.5">
                              {task.description}
                            </span>
                          )}
                          {task.activityTitle && (
                            <span className="text-[11px] text-gray-500 block mt-0.5">
                              Ref Activity: {task.activityTitle}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-xs text-gray-800">
                          <span className="font-medium block truncate max-w-[180px]">
                            {task.projectName || 'Assigned Project'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                          <span className={isLate ? 'text-rose-700 font-bold' : isDone ? 'text-gray-400' : 'text-gray-700'}>
                            {task.dueDate || 'No Date'}
                          </span>
                          {isLate && <span className="block text-[10px] text-rose-600 font-semibold uppercase">Overdue</span>}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Chip
                            color={
                              task.priority === 'urgent' || task.priority === 'high'
                                ? 'danger'
                                : task.priority === 'medium'
                                ? 'warning'
                                : 'default'
                            }
                            variant="soft"
                            size="sm"
                          >
                            {task.priority.toUpperCase()}
                          </Chip>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                          {task.assignedToName || 'Unassigned'}
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant={task.status === 'completed' ? 'secondary' : 'primary'}
                            onClick={() => handleStatusToggle(task)}
                          >
                            {task.status === 'completed'
                              ? 'Mark In Progress'
                              : task.status === 'in_progress'
                              ? 'Mark Completed'
                              : 'Start Task'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Table.ScrollContainer>

            {filteredTasks.length > pageSize && (
              <div className="p-4 border-t border-gray-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredTasks.length / pageSize)}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
