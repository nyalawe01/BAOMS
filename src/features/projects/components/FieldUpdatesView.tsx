/**
 * Field Updates & Observations Log View
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Provides Project Coordinators with a field update log to record site observations,
 * community challenges, required support, and submission for Project Manager review.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Search,
  Filter,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  Send,
  Eye,
  FileText,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { getAllActivities, getProjects, createActivity, updateActivity } from '../services/projectService';
import { ActivityRecord, ProjectRecord } from '../types/project';
import { useAuth } from '@/features/auth/useAuth';
import { showSuccess, showError } from '@/lib/sweetAlert';

export const FieldUpdatesView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal / Form state for new / edit field update
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityRecord | null>(null);
  const [formProjectId, setFormProjectId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formLocation, setFormLocation] = useState('');
  const [formParticipants, setFormParticipants] = useState(0);
  const [formProgress, setFormProgress] = useState('');
  const [formChallenges, setFormChallenges] = useState('');
  const [formFollowUp, setFormFollowUp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [aList, pList] = await Promise.all([
        getAllActivities(),
        getProjects(),
      ]);
      setActivities(aList);
      setProjects(pList);
      if (pList.length > 0 && !formProjectId) {
        setFormProjectId(pList[0].id);
      }
    } catch (err) {
      console.error('[FieldUpdatesView] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [formProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUpdates = useMemo(() => {
    return activities.filter((act) => {
      if (selectedProjectId !== 'all' && act.projectId !== selectedProjectId) return false;
      if (statusFilter !== 'all' && act.submissionStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          act.title.toLowerCase().includes(q) ||
          (act.location && act.location.toLowerCase().includes(q)) ||
          act.progress.toLowerCase().includes(q) ||
          (act.challenges && act.challenges.toLowerCase().includes(q)) ||
          (act.projectName && act.projectName.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [activities, selectedProjectId, statusFilter, searchQuery]);

  const paginatedUpdates = useMemo(() => {
    const from = (currentPage - 1) * pageSize;
    return filteredUpdates.slice(from, from + pageSize);
  }, [filteredUpdates, currentPage]);

  const openCreateModal = () => {
    setEditingActivity(null);
    setFormTitle('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormLocation('');
    setFormParticipants(0);
    setFormProgress('');
    setFormChallenges('');
    setFormFollowUp('');
    if (projects.length > 0) setFormProjectId(projects[0].id);
    setIsModalOpen(true);
  };

  const openEditModal = (act: ActivityRecord) => {
    setEditingActivity(act);
    setFormProjectId(act.projectId);
    setFormTitle(act.title);
    setFormDate(act.activityDate);
    setFormLocation(act.location || '');
    setFormParticipants(act.participantsCount);
    setFormProgress(act.progress);
    setFormChallenges(act.challenges || '');
    setFormFollowUp(act.followUpActions || '');
    setIsModalOpen(true);
  };

  const handleSave = async (submitImmediately: boolean) => {
    if (!formTitle.trim()) {
      showError('Please enter a title for this field update.');
      return;
    }
    if (!formProjectId) {
      showError('Please select an assigned project.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingActivity) {
        await updateActivity(
          editingActivity.id,
          {
            title: formTitle,
            projectId: formProjectId,
            activityDate: formDate,
            location: formLocation,
            participantsCount: formParticipants,
            progress: formProgress,
            challenges: formChallenges,
            followUpActions: formFollowUp,
            submitImmediately,
          },
          { id: user?.id || 'coord-user' }
        );
      } else {
        await createActivity(
          {
            projectId: formProjectId,
            title: formTitle,
            activityDate: formDate,
            location: formLocation,
            participantsCount: formParticipants,
            progress: formProgress,
            challenges: formChallenges,
            followUpActions: formFollowUp,
            submitImmediately,
          },
          { id: user?.id || 'coord-user', name: 'Project Coordinator' }
        );
      }

      showSuccess(
        submitImmediately
          ? t('projects.fieldUpdates.submittedMsg', 'Field update submitted to Project Manager for review.')
          : t('projects.fieldUpdates.savedDraftMsg', 'Field update saved as draft.')
      );

      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg || 'Failed to save field update');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <Card className="p-4 bg-white border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('projects.fieldUpdates.searchPlaceholder', 'Search field updates, observations, or locations...')}
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
              <option value="draft">Draft (Field Notes)</option>
              <option value="submitted">Submitted (In Review)</option>
              <option value="approved">Approved & Verified</option>
              <option value="returned_for_correction">Returned for Edit</option>
            </select>

            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-black" />
              {t('projects.fieldUpdates.newUpdate', 'New Field Update')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Field Updates List */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden bg-white">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-gray-300 border-t-[#D68904] rounded-full mb-2" />
            <p>{t('common.loading', 'Loading field updates...')}</p>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title={t('projects.fieldUpdates.emptyTitle', 'No field updates found')}
              description={t(
                'projects.fieldUpdates.emptyDesc',
                'No field observations match the current filters. Click "New Field Update" to log an update.'
              )}
              actionLabel={t('projects.fieldUpdates.newUpdate', 'New Field Update')}
              onAction={openCreateModal}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {paginatedUpdates.map((act) => {
              const isReturned = act.submissionStatus === 'returned_for_correction';
              const canEdit = act.submissionStatus === 'draft' || isReturned;

              return (
                <div key={act.id} className="p-5 hover:bg-gray-50/60 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-base">
                          {act.title}
                        </span>
                        <StatusIndicator status={act.submissionStatus} label={act.submissionStatus.toUpperCase()} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="font-medium text-gray-700">{act.projectName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {act.activityDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {act.location || 'Field Location'}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-gray-700">
                          {act.participantsCount} participants
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(act)}
                          className="text-xs border-gray-300 text-gray-700"
                        >
                          {isReturned ? 'Edit & Resubmit' : 'Edit Update'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress notes */}
                  <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {act.progress}
                  </p>

                  {/* Challenges if present */}
                  {act.challenges && (
                    <div className="text-xs bg-amber-50/60 border border-amber-200 p-3 rounded-lg text-amber-900">
                      <span className="font-semibold block mb-0.5">Reported Field Challenge:</span>
                      {act.challenges}
                    </div>
                  )}

                  {/* Returned reviewer comments */}
                  {isReturned && act.reviewComments && (
                    <div className="text-xs bg-red-50/70 border border-red-200 p-3 rounded-lg text-red-900">
                      <span className="font-semibold block mb-0.5">Project Manager Feedback (Action Required):</span>
                      {act.reviewComments}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredUpdates.length > pageSize && (
              <div className="p-4 border-t border-gray-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredUpdates.length / pageSize)}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Field Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">
                {editingActivity ? 'Edit Field Activity Update' : 'Record New Field Update'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs text-gray-700 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Associated Project *</label>
                <select
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode ? `[${p.projectCode}] ` : ''}{p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Activity / Observation Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Community Sensitization on Child Rights"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <DatePicker
                    label="Execution Date"
                    value={formDate}
                    onChange={(val) => setFormDate(val)}
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Participants Reached</label>
                  <input
                    type="number"
                    min={0}
                    value={formParticipants}
                    onChange={(e) => setFormParticipants(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Field Location / Ward</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g., Kigamboni Community Hall, Ward 4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Implementation Progress & Observations *</label>
                <textarea
                  rows={3}
                  value={formProgress}
                  onChange={(e) => setFormProgress(e.target.value)}
                  placeholder="Document activity milestones achieved, key findings, and community feedback..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Challenges & Bottlenecks</label>
                <textarea
                  rows={2}
                  value={formChallenges}
                  onChange={(e) => setFormChallenges(e.target.value)}
                  placeholder="Document field constraints, weather delays, or logistical issues..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Proposed Follow-Up Actions</label>
                <input
                  type="text"
                  value={formFollowUp}
                  onChange={(e) => setFormFollowUp(e.target.value)}
                  placeholder="e.g., Next outreach scheduled for next Tuesday"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-gray-600"
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => handleSave(false)}
                  className="text-xs border-gray-300 text-gray-700"
                >
                  Save as Draft
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => handleSave(true)}
                  className="text-xs font-bold"
                >
                  <Send className="w-3.5 h-3.5 mr-1 text-black" />
                  Submit to PM
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
