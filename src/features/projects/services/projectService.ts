/**
 * Project Management Service
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Provides unified access to projects, assignments, activities,
 * tasks, reports, and budget tracking with dual-mode support (Live Supabase & Mock In-Memory).
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  ProjectRecord,
  ProjectMemberRecord,
  ActivityRecord,
  ActivityDocumentRecord,
  TaskRecord,
  ProjectReportRecord,
  ProjectBudgetRecord,
  ProjectFilterParams,
  CreateProjectInput,
  UpdateProjectInput,
  CreateActivityInput,
  ReviewActivityInput,
  CreateTaskInput,
  UpdateTaskInput,
  AssignMemberInput,
} from '../types/project';
import {
  INITIAL_MOCK_PROJECTS,
  INITIAL_MOCK_ACTIVITIES,
  INITIAL_MOCK_TASKS,
  INITIAL_MOCK_REPORTS,
  INITIAL_MOCK_BUDGETS,
} from '../data/mockProjects';
import { getPersistentItem, setPersistentItem } from '@/lib/storageSync';

const PROJECT_STORAGE_KEYS = {
  PROJECTS: 'baoms_projects',
  ACTIVITIES: 'baoms_project_activities',
  TASKS: 'baoms_project_tasks',
  REPORTS: 'baoms_project_reports',
  BUDGETS: 'baoms_project_budgets',
};

// In-memory persistent state for offline/demo operation
let inMemoryProjects: ProjectRecord[] = getPersistentItem(PROJECT_STORAGE_KEYS.PROJECTS, () =>
  JSON.parse(JSON.stringify(INITIAL_MOCK_PROJECTS))
);
let inMemoryActivities: ActivityRecord[] = getPersistentItem(PROJECT_STORAGE_KEYS.ACTIVITIES, () =>
  JSON.parse(JSON.stringify(INITIAL_MOCK_ACTIVITIES))
);
let inMemoryTasks: TaskRecord[] = getPersistentItem(PROJECT_STORAGE_KEYS.TASKS, () =>
  JSON.parse(JSON.stringify(INITIAL_MOCK_TASKS))
);
let inMemoryReports: ProjectReportRecord[] = getPersistentItem(PROJECT_STORAGE_KEYS.REPORTS, () =>
  JSON.parse(JSON.stringify(INITIAL_MOCK_REPORTS))
);
let inMemoryBudgets: ProjectBudgetRecord[] = getPersistentItem(PROJECT_STORAGE_KEYS.BUDGETS, () =>
  JSON.parse(JSON.stringify(INITIAL_MOCK_BUDGETS))
);

export function resetMockProjectState(): void {
  inMemoryProjects = JSON.parse(JSON.stringify(INITIAL_MOCK_PROJECTS));
  inMemoryActivities = JSON.parse(JSON.stringify(INITIAL_MOCK_ACTIVITIES));
  inMemoryTasks = JSON.parse(JSON.stringify(INITIAL_MOCK_TASKS));
  inMemoryReports = JSON.parse(JSON.stringify(INITIAL_MOCK_REPORTS));
  inMemoryBudgets = JSON.parse(JSON.stringify(INITIAL_MOCK_BUDGETS));
  setPersistentItem(PROJECT_STORAGE_KEYS.PROJECTS, inMemoryProjects);
  setPersistentItem(PROJECT_STORAGE_KEYS.ACTIVITIES, inMemoryActivities);
  setPersistentItem(PROJECT_STORAGE_KEYS.TASKS, inMemoryTasks);
  setPersistentItem(PROJECT_STORAGE_KEYS.REPORTS, inMemoryReports);
  setPersistentItem(PROJECT_STORAGE_KEYS.BUDGETS, inMemoryBudgets);
}

const syncProjectState = (): void => {
  setPersistentItem(PROJECT_STORAGE_KEYS.PROJECTS, inMemoryProjects);
  setPersistentItem(PROJECT_STORAGE_KEYS.ACTIVITIES, inMemoryActivities);
  setPersistentItem(PROJECT_STORAGE_KEYS.TASKS, inMemoryTasks);
  setPersistentItem(PROJECT_STORAGE_KEYS.REPORTS, inMemoryReports);
  setPersistentItem(PROJECT_STORAGE_KEYS.BUDGETS, inMemoryBudgets);
};

interface SupabaseProjectRow {
  id: string;
  project_code: string;
  name: string;
  description: string | null;
  funder: string;
  start_date: string;
  end_date: string;
  status: import('../types/project').ProjectStatus;
  currency: string;
  total_budget: number | string;
  department_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  project_members?: Array<{
    id: string;
    project_id: string;
    user_id: string;
    project_role: import('../types/project').ProjectRole;
    assigned_at: string;
    assigned_by: string | null;
  }>;
  project_budgets?: Array<{
    id: string;
    currency: string;
    total_allocated: number | string;
    total_spent: number | string;
    total_committed: number | string;
    last_reviewed_at: string;
    last_reviewed_by: string | null;
  }>;
  departments?: { name_en: string } | null;
}

interface SupabaseActivityRow {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  activity_date: string;
  location: string | null;
  participants_count: number;
  progress: string;
  challenges: string | null;
  follow_up_actions: string | null;
  submission_status: import('../types/project').ActivitySubmissionStatus;
  submitted_by: string;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  created_at: string;
  updated_at: string;
  activity_documents?: Array<{
    id: string;
    activity_id: string;
    document_id: string;
    attached_at: string;
    attached_by: string | null;
    documents?: {
      title: string;
      document_reference: string;
      file_type?: string;
      file_size?: number;
      storage_path?: string;
    } | null;
  }>;
}

interface SupabaseTaskRow {
  id: string;
  project_id: string;
  activity_id: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  priority: import('../types/project').TaskPriority;
  status: import('../types/project').TaskStatus;
  completed_at: string | null;
  completed_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  activities?: { title: string } | null;
}

interface SupabaseReportRow {
  id: string;
  project_id: string;
  report_type: import('../types/project').ProjectReportType;
  title: string;
  reporting_period_start: string;
  reporting_period_end: string;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  recommendations: string | null;
  status: import('../types/project').ProjectReportStatus;
  submitted_by: string;
  submitted_at: string | null;
  document_id: string | null;
  created_at: string;
  updated_at: string;
  documents?: { title: string } | null;
}

function getUserInfo(userId: string): { name: string; email: string } {
  return { name: 'Assigned Staff', email: 'staff@babawatoto.or.tz' };
}

/**
 * Fetch projects with filtering and optional user authorization scope
 */
export async function getProjects(
  params?: ProjectFilterParams,
  currentUser?: { id: string; role?: string }
): Promise<ProjectRecord[]> {
  if (!isSupabaseConfigured) {
    let results = [...inMemoryProjects];

    // Filter by user membership if user is not admin, director, or finance
    if (currentUser?.id && currentUser?.role) {
      const isPrivileged = ['system_admin', 'executive_director', 'finance_officer'].includes(
        currentUser.role
      );
      if (!isPrivileged) {
        results = results.filter((p) =>
          p.members.some((m) => m.userId === currentUser.id) || p.createdBy === currentUser.id
        );
      }
    }

    if (params?.searchQuery) {
      const query = params.searchQuery.toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.projectCode.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query) ||
          p.funder.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    if (params?.status && params.status !== 'all') {
      results = results.filter((p) => p.status === params.status);
    }

    if (params?.funder) {
      results = results.filter((p) =>
        p.funder.toLowerCase().includes(params.funder!.toLowerCase())
      );
    }

    if (params?.departmentId) {
      results = results.filter((p) => p.departmentId === params.departmentId);
    }

    if (params?.assignedUserId) {
      results = results.filter((p) =>
        p.members.some((m) => m.userId === params.assignedUserId)
      );
    }

    // Attach latest counts and budget summary
    return results.map((p) => {
      const acts = inMemoryActivities.filter((a) => a.projectId === p.id);
      const tsks = inMemoryTasks.filter((t) => t.projectId === p.id);
      const bdg = inMemoryBudgets.find((b) => b.projectId === p.id);
      return {
        ...p,
        activityCount: acts.length,
        taskCount: tsks.length,
        completedTaskCount: tsks.filter((t) => t.status === 'completed').length,
        budgetSummary: bdg || p.budgetSummary,
      };
    });
  }

  try {
    let query = supabase
      .from('projects')
      .select('*, project_members(*), project_budgets(*), departments(name_en)')
      .order('created_at', { ascending: false });

    if (params?.searchQuery) {
      const q = params.searchQuery.trim();
      query = query.or(`project_code.ilike.%${q}%,name.ilike.%${q}%,funder.ilike.%${q}%`);
    }

    if (params?.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    if (params?.funder) {
      query = query.ilike('funder', `%${params.funder}%`);
    }

    if (params?.departmentId) {
      query = query.eq('department_id', params.departmentId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase projects query failed, returning cached projects:', error);
      return inMemoryProjects;
    }

    return (data || []).map((row: SupabaseProjectRow) => {
      const members: ProjectMemberRecord[] = (row.project_members || []).map((m) => {
        const u = getUserInfo(m.user_id);
        return {
          id: m.id,
          projectId: m.project_id,
          userId: m.user_id,
          userName: u.name,
          userEmail: u.email,
          projectRole: m.project_role,
          assignedAt: m.assigned_at,
          assignedBy: m.assigned_by,
        };
      });

      const budget = row.project_budgets?.[0]
        ? {
            id: row.project_budgets[0].id,
            projectId: row.id,
            currency: row.project_budgets[0].currency,
            totalAllocated: Number(row.project_budgets[0].total_allocated),
            totalSpent: Number(row.project_budgets[0].total_spent),
            totalCommitted: Number(row.project_budgets[0].total_committed),
            balance:
              Number(row.project_budgets[0].total_allocated) -
              (Number(row.project_budgets[0].total_spent) +
                Number(row.project_budgets[0].total_committed)),
            burnRatePercent:
              Number(row.project_budgets[0].total_allocated) > 0
                ? (Number(row.project_budgets[0].total_spent) /
                    Number(row.project_budgets[0].total_allocated)) *
                  100
                : 0,
            lastReviewedAt: row.project_budgets[0].last_reviewed_at,
            lastReviewedBy: row.project_budgets[0].last_reviewed_by,
          }
        : undefined;

      return {
        id: row.id,
        projectCode: row.project_code,
        name: row.name,
        description: row.description,
        funder: row.funder,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        currency: row.currency,
        totalBudget: Number(row.total_budget),
        departmentId: row.department_id,
        departmentName: row.departments?.name_en || 'Projects & Programs',
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        members,
        budgetSummary: budget,
        activityCount: 0,
        taskCount: 0,
        completedTaskCount: 0,
      };
    });
  } catch (err) {
    console.warn('Projects exception, returning cached projects:', err);
    return inMemoryProjects;
  }
}

/**
 * Fetch a single project by ID with members, budget, and metrics
 */
export async function getProjectById(
  id: string,
  currentUser?: { id: string; role?: string }
): Promise<ProjectRecord | null> {
  const projects = await getProjects(undefined, currentUser);
  const project = projects.find((p) => p.id === id);
  if (!project) return null;

  const activities = await getProjectActivities(id);
  const tasks = await getProjectTasks(id);
  const budget = await getProjectBudget(id);

  return {
    ...project,
    activityCount: activities.length,
    taskCount: tasks.length,
    completedTaskCount: tasks.filter((t) => t.status === 'completed').length,
    budgetSummary: budget || project.budgetSummary,
  };
}

/**
 * Create a new project with unique code, manager assignment, and budget allocation
 */
export async function createProject(
  input: CreateProjectInput,
  user: { id: string; name: string }
): Promise<ProjectRecord> {
  const exists = inMemoryProjects.some(
    (p) => p.projectCode.toUpperCase() === input.projectCode.trim().toUpperCase()
  );
  if (exists) {
    throw new Error(`Project code "${input.projectCode}" is already in use.`);
  }

  const projectId = 'proj-' + Date.now();
  const now = new Date().toISOString();
  const managerInfo = getUserInfo(input.managerId);

  const members: ProjectMemberRecord[] = [
    {
      id: 'pm-mem-' + Date.now() + '-1',
      projectId,
      userId: input.managerId,
      userName: managerInfo.name,
      userEmail: managerInfo.email,
      projectRole: 'manager',
      assignedAt: now,
      assignedBy: user.id,
    },
  ];

  if (input.coordinatorId && input.coordinatorId !== input.managerId) {
    const coordInfo = getUserInfo(input.coordinatorId);
    members.push({
      id: 'pm-mem-' + Date.now() + '-2',
      projectId,
      userId: input.coordinatorId,
      userName: coordInfo.name,
      userEmail: coordInfo.email,
      projectRole: 'coordinator',
      assignedAt: now,
      assignedBy: user.id,
    });
  }

  const initialBudget: ProjectBudgetRecord = {
    id: 'budget-' + Date.now(),
    projectId,
    currency: input.currency || 'TZS',
    totalAllocated: input.totalBudget,
    totalSpent: 0,
    totalCommitted: 0,
    balance: input.totalBudget,
    burnRatePercent: 0,
    lastReviewedAt: now,
    lastReviewedBy: user.id,
  };

  const newProject: ProjectRecord = {
    id: projectId,
    projectCode: input.projectCode.trim().toUpperCase(),
    name: input.name.trim(),
    description: input.description || null,
    funder: input.funder.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    status: 'planning',
    currency: input.currency || 'TZS',
    totalBudget: input.totalBudget,
    departmentId: input.departmentId || 'dept-prj',
    departmentName: 'Projects & Programs',
    createdBy: user.id,
    createdAt: now,
    updatedAt: now,
    members,
    budgetSummary: initialBudget,
    activityCount: 0,
    taskCount: 0,
    completedTaskCount: 0,
  };

  inMemoryProjects.unshift(newProject);
  inMemoryBudgets.push(initialBudget);
  syncProjectState();

  if (isSupabaseConfigured) {
    try {
      const { data: dbProj, error: prjErr } = await supabase
        .from('projects')
        .insert({
          project_code: newProject.projectCode,
          name: newProject.name,
          description: newProject.description,
          funder: newProject.funder,
          start_date: newProject.startDate,
          end_date: newProject.endDate,
          status: newProject.status,
          currency: newProject.currency,
          total_budget: newProject.totalBudget,
          department_id: input.departmentId || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (!prjErr && dbProj) {
        newProject.id = dbProj.id;
        // Insert members
        for (const m of members) {
          await supabase.from('project_members').insert({
            project_id: dbProj.id,
            user_id: m.userId,
            project_role: m.projectRole,
            assigned_by: user.id,
          });
        }
        // Insert budget
        await supabase.from('project_budgets').insert({
          project_id: dbProj.id,
          currency: newProject.currency,
          total_allocated: newProject.totalBudget,
          total_spent: 0,
          total_committed: 0,
        });
      }
    } catch (e) {
      console.warn('Failed to insert project into live Supabase, using mock memory:', e);
    }
  }

  return newProject;
}

/**
 * Update project details
 */
export async function updateProject(
  id: string,
  input: UpdateProjectInput,
  _user: { id: string }
): Promise<ProjectRecord> {
  const projectIndex = inMemoryProjects.findIndex((p) => p.id === id);
  if (projectIndex === -1) {
    throw new Error('Project not found');
  }

  const existing = inMemoryProjects[projectIndex];
  if (!existing) {
    throw new Error('Project not found');
  }
  const updated: ProjectRecord = {
    ...existing,
    name: input.name ?? existing.name,
    description: input.description !== undefined ? input.description : existing.description,
    funder: input.funder ?? existing.funder,
    startDate: input.startDate ?? existing.startDate,
    endDate: input.endDate ?? existing.endDate,
    status: input.status ?? existing.status,
    totalBudget: input.totalBudget ?? existing.totalBudget,
    updatedAt: new Date().toISOString(),
  };

  inMemoryProjects[projectIndex] = updated;
  syncProjectState();

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('projects')
        .update({
          name: updated.name,
          description: updated.description,
          funder: updated.funder,
          start_date: updated.startDate,
          end_date: updated.endDate,
          status: updated.status,
          total_budget: updated.totalBudget,
          updated_at: updated.updatedAt,
        })
        .eq('id', id);
    } catch (e) {
      console.warn('Failed updating project in Supabase:', e);
    }
  }

  return updated;
}

/**
 * Get activities for a specific project
 */
export async function getProjectActivities(projectId: string): Promise<ActivityRecord[]> {
  if (!isSupabaseConfigured) {
    return inMemoryActivities.filter((a) => a.projectId === projectId);
  }

  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*, activity_documents(*, documents(title, document_reference, file_type, file_size, storage_path))')
      .eq('project_id', projectId)
      .order('activity_date', { ascending: false });

    if (error) {
      console.warn('Error fetching activities from Supabase:', error);
      return inMemoryActivities.filter((a) => a.projectId === projectId);
    }

    return (data || []).map((row: SupabaseActivityRow) => {
      const submitter = getUserInfo(row.submitted_by);
      const reviewer = row.reviewed_by ? getUserInfo(row.reviewed_by) : undefined;
      const evidence: ActivityDocumentRecord[] = (row.activity_documents || []).map((ad) => ({
        id: ad.id,
        activityId: ad.activity_id,
        documentId: ad.document_id,
        documentTitle: ad.documents?.title || 'Evidence File',
        documentReference: ad.documents?.document_reference || 'REF',
        fileType: ad.documents?.file_type,
        fileSize: ad.documents?.file_size,
        storagePath: ad.documents?.storage_path,
        attachedAt: ad.attached_at,
        attachedBy: ad.attached_by,
      }));

      return {
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        description: row.description,
        activityDate: row.activity_date,
        location: row.location,
        participantsCount: row.participants_count || 0,
        progress: row.progress,
        challenges: row.challenges,
        followUpActions: row.follow_up_actions,
        submissionStatus: row.submission_status,
        submittedBy: row.submitted_by,
        submittedByName: submitter.name,
        submittedAt: row.submitted_at,
        reviewedBy: row.reviewed_by,
        reviewedByName: reviewer?.name,
        reviewedAt: row.reviewed_at,
        reviewComments: row.review_comments,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        evidenceDocuments: evidence,
      };
    });
  } catch (err) {
    console.warn('Activity fetch exception:', err);
    return inMemoryActivities.filter((a) => a.projectId === projectId);
  }
}

/**
 * Record a new field activity report with optional immediate submission and evidence
 */
export async function createActivity(
  input: CreateActivityInput,
  user?: { id: string; name: string }
): Promise<ActivityRecord> {
  const author = user || { id: 'user-field-1', name: 'Juma K. Mwangi' };
  const activityId = 'act-' + Date.now();
  const now = new Date().toISOString();
  const status = input.submitImmediately ? 'submitted' : 'draft';

  const evidenceDocs: ActivityDocumentRecord[] = [];
  if (input.evidenceFiles && input.evidenceFiles.length > 0) {
    for (let i = 0; i < input.evidenceFiles.length; i++) {
      const ef = input.evidenceFiles[i];
      if (!ef) continue;
      evidenceDocs.push({
        id: 'ev-' + Date.now() + '-' + i,
        activityId,
        documentId: 'doc-ev-' + Date.now() + '-' + i,
        documentTitle: ef.title || ef.file.name,
        documentReference: `BAO/EVD/${new Date().getFullYear()}/${100 + i}`,
        fileType: ef.file.type,
        fileSize: ef.file.size,
        storagePath: `evidence/${ef.file.name}`,
        attachedAt: now,
        attachedBy: author.id,
      });
    }
  }

  const newActivity: ActivityRecord = {
    id: activityId,
    projectId: input.projectId,
    title: input.title.trim(),
    description: input.description || null,
    activityDate: input.activityDate,
    location: input.location || null,
    participantsCount: input.participantsCount || 0,
    progress: (input.progress || '').trim(),
    challenges: input.challenges || input.operationalChallenges || null,
    operationalChallenges: input.operationalChallenges || input.challenges || null,
    followUpActions: input.followUpActions || input.recommendations || null,
    recommendations: input.recommendations || input.followUpActions || null,
    submissionStatus: status,
    submittedBy: author.id,
    submittedByName: author.name,
    submittedAt: input.submitImmediately ? now : null,
    reviewedBy: null,
    reviewedByName: undefined,
    reviewedAt: null,
    reviewComments: null,
    createdAt: now,
    updatedAt: now,
    evidenceDocuments: evidenceDocs,
    backgroundContext: input.backgroundContext || null,
    methodology: input.methodology || null,
    sessionNarrative: input.sessionNarrative || null,
    keyFindings: input.keyFindings || null,
    qualitativeFindings: input.qualitativeFindings || null,
    participantQuotes: input.participantQuotes || null,
    demographicBreakdown: input.demographicBreakdown || undefined,
    budgetAllocated: input.budgetAllocated ?? null,
    budgetSpent: input.budgetSpent ?? null,
    beneficiarySatisfactionScore: input.beneficiarySatisfactionScore ?? null,
  };

  inMemoryActivities.unshift(newActivity);
  syncProjectState();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          project_id: input.projectId,
          title: newActivity.title,
          description: newActivity.description,
          activity_date: newActivity.activityDate,
          location: newActivity.location,
          participants_count: newActivity.participantsCount,
          progress: newActivity.progress,
          challenges: newActivity.challenges,
          follow_up_actions: newActivity.followUpActions,
          submission_status: status,
          submitted_by: author.id,
          submitted_at: newActivity.submittedAt,
        })
        .select()
        .single();

      if (!error && data) {
        newActivity.id = data.id;
      }
    } catch (e) {
      console.warn('Failed inserting activity in Supabase:', e);
    }
  }

  return newActivity;
}

/**
 * Submit an existing draft activity for manager review
 */
export async function submitActivity(
  activityId: string,
  user: { id: string }
): Promise<ActivityRecord> {
  const index = inMemoryActivities.findIndex((a) => a.id === activityId);
  if (index === -1) throw new Error('Activity not found');

  const act = inMemoryActivities[index];
  if (!act) throw new Error('Activity not found');
  const now = new Date().toISOString();

  const updated: ActivityRecord = {
    ...act,
    submissionStatus: 'submitted',
    submittedAt: now,
    submittedBy: user.id,
    updatedAt: now,
  };

  inMemoryActivities[index] = updated;
  syncProjectState();

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('activities')
        .update({
          submission_status: 'submitted',
          submitted_at: now,
          updated_at: now,
        })
        .eq('id', activityId);
    } catch (e) {
      console.warn('Failed submitting activity in Supabase:', e);
    }
  }

  return updated;
}

/**
 * Review an activity (Approve or Return for Correction)
 */
export async function reviewActivity(
  input: ReviewActivityInput,
  reviewer: { id: string; name: string }
): Promise<ActivityRecord> {
  const index = inMemoryActivities.findIndex((a) => a.id === input.activityId);
  if (index === -1) throw new Error('Activity not found');

  const act = inMemoryActivities[index];
  if (!act) throw new Error('Activity not found');
  const now = new Date().toISOString();
  const nextStatus = input.decision === 'approve' ? 'approved' : 'returned_for_correction';

  const updated: ActivityRecord = {
    ...act,
    submissionStatus: nextStatus,
    reviewedBy: reviewer.id,
    reviewedByName: reviewer.name,
    reviewedAt: now,
    reviewComments: input.comments.trim(),
    updatedAt: now,
  };

  inMemoryActivities[index] = updated;
  syncProjectState();

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('activities')
        .update({
          submission_status: nextStatus,
          reviewed_by: reviewer.id,
          reviewed_at: now,
          review_comments: updated.reviewComments,
          updated_at: now,
        })
        .eq('id', input.activityId);
    } catch (e) {
      console.warn('Failed reviewing activity in Supabase:', e);
    }
  }

  return updated;
}

/**
 * Get tasks for a specific project
 */
export async function getProjectTasks(projectId: string): Promise<TaskRecord[]> {
  if (!isSupabaseConfigured) {
    return inMemoryTasks.filter((t) => t.projectId === projectId);
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, activities(title)')
      .eq('project_id', projectId)
      .order('due_date', { ascending: true });

    if (error) {
      console.warn('Error fetching tasks from Supabase:', error);
      return inMemoryTasks.filter((t) => t.projectId === projectId);
    }

    return (data || []).map((row: SupabaseTaskRow) => {
      const assignee = row.assigned_to ? getUserInfo(row.assigned_to) : undefined;
      return {
        id: row.id,
        projectId: row.project_id,
        activityId: row.activity_id,
        activityTitle: row.activities?.title,
        title: row.title,
        description: row.description,
        assignedTo: row.assigned_to,
        assignedToName: assignee?.name,
        dueDate: row.due_date,
        priority: row.priority,
        status: row.status,
        completedAt: row.completed_at,
        completedBy: row.completed_by,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  } catch (err) {
    console.warn('Tasks exception:', err);
    return inMemoryTasks.filter((t) => t.projectId === projectId);
  }
}

/**
 * Create a new task
 */
export async function createTask(
  input: CreateTaskInput,
  user: { id: string; name: string }
): Promise<TaskRecord> {
  const taskId = 'task-' + Date.now();
  const now = new Date().toISOString();
  const assignee = input.assignedTo ? getUserInfo(input.assignedTo) : undefined;

  let activityTitle: string | undefined;
  if (input.activityId) {
    const act = inMemoryActivities.find((a) => a.id === input.activityId);
    if (act) activityTitle = act.title;
  }

  const newTask: TaskRecord = {
    id: taskId,
    projectId: input.projectId,
    activityId: input.activityId || null,
    activityTitle,
    title: input.title.trim(),
    description: input.description || null,
    assignedTo: input.assignedTo || null,
    assignedToName: assignee?.name,
    dueDate: input.dueDate || null,
    priority: input.priority,
    status: 'todo',
    completedAt: null,
    completedBy: null,
    createdBy: user.id,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryTasks.unshift(newTask);
  syncProjectState();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: input.projectId,
          activity_id: input.activityId || null,
          title: newTask.title,
          description: newTask.description,
          assigned_to: newTask.assignedTo,
          due_date: newTask.dueDate,
          priority: newTask.priority,
          status: 'todo',
          created_by: user.id,
        })
        .select()
        .single();

      if (!error && data) {
        newTask.id = data.id;
      }
    } catch (e) {
      console.warn('Failed inserting task in Supabase:', e);
    }
  }

  return newTask;
}

/**
 * Update an existing task (status, priority, assignee, due date)
 */
export async function updateTask(
  input: UpdateTaskInput,
  user: { id: string; name: string }
): Promise<TaskRecord> {
  const index = inMemoryTasks.findIndex((t) => t.id === input.taskId);
  if (index === -1) throw new Error('Task not found');

  const task = inMemoryTasks[index];
  if (!task) throw new Error('Task not found');
  const now = new Date().toISOString();

  let completedAt = task.completedAt;
  let completedBy = task.completedBy;

  if (input.status === 'completed' && task.status !== 'completed') {
    completedAt = now;
    completedBy = user.id;
  } else if (input.status && input.status !== 'completed') {
    completedAt = null;
    completedBy = null;
  }

  const assignee = input.assignedTo !== undefined
    ? (input.assignedTo ? getUserInfo(input.assignedTo) : undefined)
    : undefined;

  const updated: TaskRecord = {
    ...task,
    title: input.title !== undefined ? input.title.trim() : task.title,
    description: input.description !== undefined ? input.description : task.description,
    assignedTo: input.assignedTo !== undefined ? input.assignedTo : task.assignedTo,
    assignedToName: input.assignedTo !== undefined ? assignee?.name : task.assignedToName,
    dueDate: input.dueDate !== undefined ? input.dueDate : task.dueDate,
    priority: input.priority !== undefined ? input.priority : task.priority,
    status: input.status !== undefined ? input.status : task.status,
    completedAt,
    completedBy,
    updatedAt: now,
  };

  inMemoryTasks[index] = updated;
  syncProjectState();

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('tasks')
        .update({
          title: updated.title,
          description: updated.description,
          assigned_to: updated.assignedTo,
          due_date: updated.dueDate,
          priority: updated.priority,
          status: updated.status,
          completed_at: completedAt,
          completed_by: completedBy,
          updated_at: now,
        })
        .eq('id', input.taskId);
    } catch (e) {
      console.warn('Failed updating task in Supabase:', e);
    }
  }

  return updated;
}

/**
 * Get project reports
 */
export async function getProjectReports(projectId: string): Promise<ProjectReportRecord[]> {
  if (!isSupabaseConfigured) {
    return inMemoryReports.filter((r) => r.projectId === projectId);
  }

  try {
    const { data, error } = await supabase
      .from('project_reports')
      .select('*, documents(title)')
      .eq('project_id', projectId)
      .order('reporting_period_end', { ascending: false });

    if (error) {
      console.warn('Error fetching reports from Supabase:', error);
      return inMemoryReports.filter((r) => r.projectId === projectId);
    }

    return (data || []).map((row: SupabaseReportRow) => {
      const submitter = getUserInfo(row.submitted_by);
      return {
        id: row.id,
        projectId: row.project_id,
        reportType: row.report_type,
        title: row.title,
        reportingPeriodStart: row.reporting_period_start,
        reportingPeriodEnd: row.reporting_period_end,
        summary: row.summary,
        achievements: row.achievements,
        challenges: row.challenges,
        recommendations: row.recommendations,
        status: row.status,
        submittedBy: row.submitted_by,
        submittedByName: submitter.name,
        submittedAt: row.submitted_at,
        documentId: row.document_id,
        documentTitle: row.documents?.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  } catch (err) {
    console.warn('Reports exception:', err);
    return inMemoryReports.filter((r) => r.projectId === projectId);
  }
}

/**
 * Get project budget summary
 */
export async function getProjectBudget(projectId: string): Promise<ProjectBudgetRecord | null> {
  if (!isSupabaseConfigured) {
    const b = inMemoryBudgets.find((bg) => bg.projectId === projectId);
    return b || null;
  }

  try {
    const { data, error } = await supabase
      .from('project_budgets')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error || !data) {
      return inMemoryBudgets.find((bg) => bg.projectId === projectId) || null;
    }

    const allocated = Number(data.total_allocated);
    const spent = Number(data.total_spent);
    const committed = Number(data.total_committed);

    return {
      id: data.id,
      projectId: data.project_id,
      currency: data.currency,
      totalAllocated: allocated,
      totalSpent: spent,
      totalCommitted: committed,
      balance: allocated - (spent + committed),
      burnRatePercent: allocated > 0 ? (spent / allocated) * 100 : 0,
      lastReviewedAt: data.last_reviewed_at,
      lastReviewedBy: data.last_reviewed_by,
    };
  } catch (err) {
    console.warn('Budget exception:', err);
    return inMemoryBudgets.find((bg) => bg.projectId === projectId) || null;
  }
}

/**
 * Assign a member to a project
 */
export async function assignProjectMember(
  input: AssignMemberInput,
  assigner: { id: string }
): Promise<ProjectMemberRecord> {
  const project = inMemoryProjects.find((p) => p.id === input.projectId);
  if (!project) throw new Error('Project not found');

  const existingIndex = project.members.findIndex((m) => m.userId === input.userId);
  const userInfo = getUserInfo(input.userId);
  const now = new Date().toISOString();

  let memberRecord: ProjectMemberRecord;

  if (existingIndex >= 0) {
    const existing = project.members[existingIndex];
    if (!existing) throw new Error('Member not found');
    memberRecord = {
      ...existing,
      projectRole: input.projectRole,
    };
    project.members[existingIndex] = memberRecord;
  } else {
    memberRecord = {
      id: 'mem-' + Date.now(),
      projectId: input.projectId,
      userId: input.userId,
      userName: userInfo.name,
      userEmail: userInfo.email,
      projectRole: input.projectRole,
      assignedAt: now,
      assignedBy: assigner.id,
    };
    project.members.push(memberRecord);
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('project_members').upsert({
        project_id: input.projectId,
        user_id: input.userId,
        project_role: input.projectRole,
        assigned_by: assigner.id,
      });
    } catch (e) {
      console.warn('Failed assigning member in Supabase:', e);
    }
  }

  return memberRecord;
}

/**
 * Remove a member from a project
 */
export async function removeProjectMember(
  projectId: string,
  userId: string
): Promise<void> {
  const project = inMemoryProjects.find((p) => p.id === projectId);
  if (!project) throw new Error('Project not found');

  project.members = project.members.filter((m) => m.userId !== userId);

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);
    } catch (e) {
      console.warn('Failed removing member in Supabase:', e);
    }
  }
}
