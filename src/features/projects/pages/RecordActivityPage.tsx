/**
 * Record Activity Page
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Full-page form for Project Coordinators and Officers to document field activities,
 * participant demographics, operational progress, and evidence files.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Calendar,
  MapPin,
  Users,
  Wallet,
  Paperclip,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  UploadCloud,
  FileText,
  Save,
  Send,
  Building,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/features/auth/useAuth';
import { getProjectById, getProjects, createActivity } from '../services/projectService';
import { ProjectRecord, CreateActivityInput } from '../types/project';
import { showSuccess, showError } from '@/lib/sweetAlert';

export const RecordActivityPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: routeProjectId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryProjectId = searchParams.get('projectId');
  const targetProjectId = routeProjectId || queryProjectId || '';

  const { user, roles } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [availableProjects, setAvailableProjects] = useState<ProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(targetProjectId);
  const [isLoadingProject, setIsLoadingProject] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activityDate, setActivityDate] = useState(
    searchParams.get('date') || new Date().toISOString().slice(0, 10)
  );
  const [location, setLocation] = useState('');
  const [participantsCount, setParticipantsCount] = useState('');
  const [femaleCount, setFemaleCount] = useState('');
  const [maleCount, setMaleCount] = useState('');
  const [youthCount, setYouthCount] = useState('');
  const [progress, setProgress] = useState('');
  const [challenges, setChallenges] = useState('');
  const [followUpActions, setFollowUpActions] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [quoteSpeaker, setQuoteSpeaker] = useState('');
  const [budgetAllocated, setBudgetAllocated] = useState('');
  const [budgetSpent, setBudgetSpent] = useState('');

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load project or list of user-accessible projects
  useEffect(() => {
    async function init() {
      setIsLoadingProject(true);
      try {
        if (targetProjectId) {
          const proj = await getProjectById(
            targetProjectId,
            user ? { id: user.id, role: roles[0] } : undefined
          );
          if (proj) {
            setProject(proj);
            setSelectedProjectId(proj.id);
          }
        }

        const all = await getProjects(
          { status: 'active' },
          user ? { id: user.id, role: roles[0] } : undefined
        );
        setAvailableProjects(all);

        if (!targetProjectId && all.length > 0 && all[0]) {
          setSelectedProjectId(all[0].id);
          setProject(all[0]);
        }
      } catch (err: unknown) {
        console.error('Failed to load project details for activity recording:', err);
      } finally {
        setIsLoadingProject(false);
      }
    }
    init();
  }, [targetProjectId, user, roles]);

  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    const found = availableProjects.find((p) => p.id === projId);
    if (found) setProject(found);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (submitImmediately: boolean) => {
    setErrorMessage(null);

    const activeProjId = selectedProjectId || project?.id;
    if (!activeProjId) {
      setErrorMessage(t('projects.errors.selectProject', 'Please select an authorized project.'));
      return;
    }

    if (!title.trim()) {
      setErrorMessage(t('projects.errors.activityTitleRequired', 'Activity title is required.'));
      return;
    }

    if (!progress.trim()) {
      setErrorMessage(t('projects.errors.progressRequired', 'Progress and key outputs summary is required.'));
      return;
    }

    const participants = parseInt(participantsCount, 10);
    const quotes = quoteText.trim()
      ? [
          {
            quote: quoteText.trim(),
            speaker: quoteSpeaker.trim() || 'Community Participant',
          },
        ]
      : undefined;

    const demographicBreakdown =
      femaleCount || maleCount || youthCount
        ? {
            female: femaleCount ? parseInt(femaleCount, 10) : undefined,
            male: maleCount ? parseInt(maleCount, 10) : undefined,
            youth: youthCount ? parseInt(youthCount, 10) : undefined,
          }
        : undefined;

    const payload: CreateActivityInput = {
      projectId: activeProjId,
      title: title.trim(),
      description: description.trim() || undefined,
      activityDate,
      location: location.trim() || undefined,
      participantsCount: isNaN(participants) ? 0 : participants,
      progress: progress.trim(),
      challenges: challenges.trim() || undefined,
      followUpActions: followUpActions.trim() || undefined,
      submitImmediately,
      participantQuotes: quotes,
      demographicBreakdown,
      budgetAllocated: budgetAllocated ? parseFloat(budgetAllocated) : undefined,
      budgetSpent: budgetSpent ? parseFloat(budgetSpent) : undefined,
      evidenceFiles: attachedFiles.map((f) => ({
        title: f.name,
        file: f,
      })),
    };

    setIsSubmitting(true);
    try {
      await createActivity(payload, user?.id || 'demo-user');
      showSuccess(
        submitImmediately ? 'Activity Submitted!' : 'Draft Saved!',
        submitImmediately
          ? 'Field activity has been recorded and submitted for manager verification.'
          : 'Activity saved as draft in your workspace.'
      );
      if (activeProjId) {
        navigate(`/projects/${activeProjId}`);
      } else {
        navigate('/projects');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Failed to record activity.');
      showError('Error Recording Activity', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <PageHeader
        title={t('projects.recordActivityPageTitle', 'Record Field Activity')}
        subtitle={
          project
            ? `Document field activity implementation, beneficiaries, and verifications for ${project.name}`
            : 'Document field activity implementation, participants, and evidence files.'
        }
        breadcrumbs={[
          { label: t('navigation.dashboard', 'Dashboard'), href: '/dashboard' },
          { label: t('navigation.projects', 'Projects'), href: '/projects' },
          ...(project ? [{ label: project.name, href: `/projects/${project.id}` }] : []),
          { label: t('projects.recordActivity', 'Record Activity') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (project) navigate(`/projects/${project.id}`);
                else navigate('/projects');
              }}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>{t('common.cancel', 'Cancel & Return')}</span>
            </Button>
            <Button
              variant="outline"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="flex items-center gap-1.5 border-slate-300"
            >
              <Save className="w-4 h-4 text-slate-600" />
              <span>{t('projects.saveDraft', 'Save as Draft')}</span>
            </Button>
            <Button
              variant="primary"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>{t('projects.submitActivity', 'Submit for Verification')}</span>
            </Button>
          </div>
        }
      />

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">{t('common.attentionRequired', 'Attention Required')}</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Project Selector / Banner */}
      <Card className="p-5 bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#D68904]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                {t('projects.fields.associatedProject', 'Associated Project & Grant')}
              </label>
              {availableProjects.length > 0 ? (
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  className="font-semibold text-slate-900 text-base bg-transparent border-0 border-b border-slate-200 focus:ring-0 focus:border-[#D68904] py-1 pl-0 pr-8 cursor-pointer"
                >
                  {availableProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.projectCode || 'PRJ'})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-semibold text-slate-900 text-base">
                  {project?.name || 'Loading project...'}
                </span>
              )}
            </div>
          </div>

          {project && (
            <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <span><strong>Funder:</strong> {project.funder}</span>
              <span>•</span>
              <span className="capitalize font-medium text-emerald-700">Status: {project.status}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Main Form Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Core Activity & Results (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Card 1: Activity Details */}
          <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity className="w-5 h-5 text-[#D68904]" />
              <h3 className="font-semibold text-slate-900 text-base">
                1. Activity Information
              </h3>
            </div>

            <div className="space-y-4">
              <Input
                label={t('projects.fields.activityTitle', 'Activity Title *')}
                placeholder="e.g., Community Forum & Child Safeguarding Workshop"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DatePicker
                  label={t('projects.fields.activityDate', 'Activity Date *')}
                  value={activityDate}
                  onChange={(date) => setActivityDate(date || '')}
                  required
                />
                <Input
                  label={t('projects.fields.location', 'Field Location / Venue')}
                  placeholder="e.g., Yombo Dovya Ward Hall"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  startIcon={<MapPin className="w-4 h-4 text-slate-400" />}
                />
              </div>

              <Textarea
                label={t('projects.fields.description', 'Brief Summary & Objective')}
                placeholder="Briefly state the goal, target group, and context of this session..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </Card>

          {/* Card 2: Implementation Results & Findings */}
          <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CheckCircle2 className="w-5 h-5 text-[#D68904]" />
              <h3 className="font-semibold text-slate-900 text-base">
                2. Outputs, Achievements & Findings
              </h3>
            </div>

            <div className="space-y-4">
              <Textarea
                label={t('projects.fields.progressOutputs', 'Progress & Key Achievements *')}
                placeholder="Detail what was accomplished, outputs delivered, topics trained, and participant engagement..."
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                rows={4}
                required
              />

              <Textarea
                label={t('projects.fields.challenges', 'Operational Challenges & Mitigation (Optional)')}
                placeholder="Bottlenecks encountered during execution and how your field team handled them..."
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                rows={2}
              />

              <Textarea
                label={t('projects.fields.followUpActions', 'Follow-up Actions & Next Steps (Optional)')}
                placeholder="Upcoming visits, report compilation, equipment returns, or referrals..."
                value={followUpActions}
                onChange={(e) => setFollowUpActions(e.target.value)}
                rows={2}
              />
            </div>
          </Card>

          {/* Card 3: Qualitative Testimonials (Optional) */}
          <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-[#D68904]" />
              <h3 className="font-semibold text-slate-900 text-base">
                3. Participant Testimonial (Optional)
              </h3>
            </div>

            <div className="space-y-3">
              <Textarea
                label="Community Voice / Participant Quote"
                placeholder="Direct verbatim statement from a participant or leader regarding this activity..."
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                rows={2}
              />
              <Input
                label="Speaker Identity / Attribution"
                placeholder="e.g., Mariam J., Local Youth Leader or Parent"
                value={quoteSpeaker}
                onChange={(e) => setQuoteSpeaker(e.target.value)}
              />
            </div>
          </Card>
        </div>

        {/* Right Column: Demographics, Budget & Evidence (1 col) */}
        <div className="space-y-6">
          {/* Participation Demographics */}
          <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="w-5 h-5 text-[#D68904]" />
              <h3 className="font-semibold text-slate-900 text-sm">
                Participants & Reach
              </h3>
            </div>

            <div className="space-y-3">
              <Input
                type="number"
                min="0"
                label={t('projects.fields.participantsCount', 'Total Attendance Count *')}
                placeholder="0"
                value={participantsCount}
                onChange={(e) => setParticipantsCount(e.target.value)}
                required
              />

              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  min="0"
                  label="Female"
                  placeholder="0"
                  value={femaleCount}
                  onChange={(e) => setFemaleCount(e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  label="Male"
                  placeholder="0"
                  value={maleCount}
                  onChange={(e) => setMaleCount(e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  label="Youth"
                  placeholder="0"
                  value={youthCount}
                  onChange={(e) => setYouthCount(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Activity Financial Spend */}
          <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Wallet className="w-5 h-5 text-[#D68904]" />
              <h3 className="font-semibold text-slate-900 text-sm">
                Budget & Expenditures (TZS)
              </h3>
            </div>

            <div className="space-y-3">
              <Input
                type="number"
                min="0"
                step="any"
                label="Budget Allocated"
                placeholder="e.g., 250000"
                value={budgetAllocated}
                onChange={(e) => setBudgetAllocated(e.target.value)}
              />
              <Input
                type="number"
                min="0"
                step="any"
                label="Actual Spent"
                placeholder="e.g., 230000"
                value={budgetSpent}
                onChange={(e) => setBudgetSpent(e.target.value)}
              />
            </div>
          </Card>

          {/* Evidence Attachments */}
          <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Paperclip className="w-5 h-5 text-[#D68904]" />
              <h3 className="font-semibold text-slate-900 text-sm">
                Evidence & Documentation
              </h3>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#D68904] rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-amber-50/30"
            >
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-700">
                Click to attach evidence files
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sign-in sheets, photos, workshop agenda (PDF, JPG, PNG)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {attachedFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                <p className="text-xs font-semibold text-slate-600">
                  {attachedFiles.length} file(s) attached:
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-slate-100 p-2 rounded-lg text-slate-700"
                    >
                      <span className="truncate max-w-[200px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
