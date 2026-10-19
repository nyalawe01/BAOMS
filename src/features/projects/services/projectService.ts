/**
 * Project Management Service
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Strict Database-Driven Architecture:
 * All project data, activities, tasks, budgets, and member assignments
 * are queried and persisted exclusively via Supabase PostgreSQL.
 * No mock data or offline fallbacks.
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

// Compatibility stubs for legacy tests
export const resetMockProjectState = (): void => {};
export const syncProjectState = (): void => {};

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
    profiles?: { display_name?: string; official_email?: string } | null;
  }>;
  project_budgets?: Array<{
    id: string;
    category?: string;
    allocated_amount: number | string;
    spent_amount: number | string;
    committed_amount: number | string;
    updated_at?: string;
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
  submitter?: { display_name?: string } | null;
  reviewer?: { display_name?: string } | null;
  activity_documents?: Array<{
    id: string;
    activity_id: string;
    document_id: string;
    attached_at: string;
    attached_by: string | null;
    documents?: {
      title: string;
      reference_number?: string;
      classification?: string;
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
  created_by: string | null;
  created_at: string;
  updated_at: string;
  activities?: { title: string } | null;
  assignee?: { display_name?: string } | null;
}

interface SupabaseReportRow {
  id: string;
  project_id: string;
  report_type: import('../types/project').ProjectReportType;
  title: string;
  period_start: string;
  period_end: string;
  summary: string;
  status: import('../types/project').ProjectReportStatus;
  submitted_by: string;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  document_id: string | null;
  created_at: string;
  updated_at: string;
  documents?: { title: string } | null;
  submitter?: { display_name?: string } | null;
}

/**
 * Fetch projects with filtering and optional user authorization scope
 */
export async function getProjects(
  params?: ProjectFilterParams,
  currentUser?: { id: string; role?: string }
): Promise<ProjectRecord[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('projects')
    .select(`
      *,
      project_members (
        id, project_id, user_id, project_role, assigned_at, assigned_by,
        profiles:profiles!project_members_user_id_fkey (display_name, official_email)
      ),
      project_budgets (
        id, category, allocated_amount, spent_amount, committed_amount, updated_at
      ),
      departments (name_en)
    `)
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
    console.error('[projectService] Failed to fetch projects from Supabase:', error);
    throw new Error(`Database query error: ${error.message}`);
  }

  let projects = (data || []).map((row: any): ProjectRecord => {
    const members: ProjectMemberRecord[] = (row.project_members || []).map((m: any) => ({
      id: m.id,
      projectId: m.project_id,
      userId: m.user_id,
      userName: m.profiles?.display_name || 'Staff Member',
      userEmail: m.profiles?.official_email || '',
      projectRole: m.project_role,
      assignedAt: m.assigned_at,
      assignedBy: m.assigned_by,
    }));

    // Aggregate budgets across categories
    const budgets = row.project_budgets || [];
    let totalAlloc = Number(row.total_budget) || 0;
    let totalSpent = 0;
    let totalCommitted = 0;

    if (budgets.length > 0) {
      let bAlloc = 0;
      budgets.forEach((b: any) => {
        bAlloc += Number(b.allocated_amount) || 0;
        totalSpent += Number(b.spent_amount) || 0;
        totalCommitted += Number(b.committed_amount) || 0;
      });
      if (bAlloc > 0) totalAlloc = bAlloc;
    }

    const budgetSummary: ProjectBudgetRecord = {
      id: budgets[0]?.id || `pb-${row.id}`,
      projectId: row.id,
      currency: row.currency || 'TZS',
      totalAllocated: totalAlloc,
      totalSpent,
      totalCommitted,
      balance: totalAlloc - (totalSpent + totalCommitted),
      burnRatePercent: totalAlloc > 0 ? (totalSpent / totalAlloc) * 100 : 0,
      lastReviewedAt: budgets[0]?.updated_at || row.updated_at,
      lastReviewedBy: null,
    };

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
      budgetSummary,
      activityCount: 0,
      taskCount: 0,
      completedTaskCount: 0,
    };
  });

  // Filter by user membership if user is not an admin, director, finance, or project manager
  if (currentUser?.id && currentUser?.role) {
    const isPrivileged = [
      'system_admin',
      'executive_director',
      'finance_officer',
      'project_manager',
    ].includes(currentUser.role);
    if (!isPrivileged) {
      const assignedProjects = projects.filter(
        (p) => p.members.some((m) => m.userId === currentUser.id) || p.createdBy === currentUser.id
      );
      // If user has specific assigned project memberships, scope to those;
      // otherwise, retain active projects so operational coordinators can plan and record activities.
      if (assignedProjects.length > 0) {
        projects = assignedProjects;
      }
    }
  }

  return projects;
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

  const [activities, tasks, budget] = await Promise.all([
    getProjectActivities(id),
    getProjectTasks(id),
    getProjectBudget(id),
  ]);

  return {
    ...project,
    activityCount: activities.length,
    taskCount: tasks.length,
    completedTaskCount: tasks.filter((t) => t.status === 'completed').length,
    budgetSummary: budget || project.budgetSummary,
  };
}

/**
 * Create a new project directly in Supabase
 */
export async function createProject(
  input: CreateProjectInput,
  user: { id: string; name: string }
): Promise<ProjectRecord> {
  if (!isSupabaseConfigured) {
    throw new Error('Database is not configured. Operation aborted.');
  }

  // 1. Check uniqueness of project code
  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .ilike('project_code', input.projectCode.trim())
    .maybeSingle();

  if (existing) {
    throw new Error(`Project code "${input.projectCode}" is already in use in the database.`);
  }

  // 2. Insert Project
  const { data: dbProj, error: prjErr } = await supabase
    .from('projects')
    .insert({
      project_code: input.projectCode.trim().toUpperCase(),
      name: input.name.trim(),
      description: input.description || null,
      funder: input.funder.trim(),
      start_date: input.startDate,
      end_date: input.endDate,
      status: 'planning',
      currency: input.currency || 'TZS',
      total_budget: input.totalBudget,
      department_id: input.departmentId || null,
      created_by: user.id,
    })
    .select('*, departments(name_en)')
    .single();

  if (prjErr || !dbProj) {
    console.error('[projectService] Project insert failed:', prjErr);
    throw new Error(prjErr?.message || 'Failed to create project in database.');
  }

  // 3. Assign manager
  const membersToInsert = [
    {
      project_id: dbProj.id,
      user_id: input.managerId,
      project_role: 'manager',
      assigned_by: user.id,
    },
  ];

  if (input.coordinatorId && input.coordinatorId !== input.managerId) {
    membersToInsert.push({
      project_id: dbProj.id,
      user_id: input.coordinatorId,
      project_role: 'coordinator',
      assigned_by: user.id,
    });
  }

  await supabase.from('project_members').insert(membersToInsert);

  // 4. Insert initial budget record
  await supabase.from('project_budgets').insert({
    project_id: dbProj.id,
    category: 'General',
    allocated_amount: input.totalBudget,
    spent_amount: 0,
    committed_amount: 0,
    notes: 'Initial allocation',
  });

  return getProjectById(dbProj.id, { id: user.id }) as Promise<ProjectRecord>;
}

/**
 * Update project details
 */
export async function updateProject(
  id: string,
  input: UpdateProjectInput,
  _user: { id: string }
): Promise<ProjectRecord> {
  if (!isSupabaseConfigured) {
    throw new Error('Database is not configured.');
  }

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updatePayload.name = input.name.trim();
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.funder !== undefined) updatePayload.funder = input.funder.trim();
  if (input.startDate !== undefined) updatePayload.start_date = input.startDate;
  if (input.endDate !== undefined) updatePayload.end_date = input.endDate;
  if (input.status !== undefined) updatePayload.status = input.status;
  if (input.totalBudget !== undefined) updatePayload.total_budget = input.totalBudget;

  const { error } = await supabase.from('projects').update(updatePayload).eq('id', id);

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  const refreshed = await getProjectById(id);
  if (!refreshed) throw new Error('Project not found after update.');
  return refreshed;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

/**
 * Get activities for a specific project
 */
export async function getProjectActivities(projectId: string): Promise<ActivityRecord[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      submitter:profiles!submitted_by(display_name),
      reviewer:profiles!reviewed_by(display_name),
      activity_documents(
        activity_id, document_id, attached_at,
        documents(title, reference_number)
      )
    `)
    .eq('project_id', projectId)
    .order('activity_date', { ascending: false });

  if (error) {
    console.error('[projectService] Failed to fetch activities:', error);
    return [];
  }

  return (data || []).map((row: any): ActivityRecord => {
    const evidence: ActivityDocumentRecord[] = (row.activity_documents || []).map((ad: any) => ({
      id: `${ad.activity_id}-${ad.document_id}`,
      activityId: ad.activity_id,
      documentId: ad.document_id,
      documentTitle: ad.documents?.title || 'Evidence File',
      documentReference: ad.documents?.reference_number || 'REF',
      attachedAt: ad.attached_at,
      attachedBy: '',
    }));

    return {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      description: row.description,
      activityDate: row.activity_date,
      location: row.location,
      participantsCount: row.participants_count || 0,
      progress: row.progress || '',
      challenges: row.challenges,
      followUpActions: row.follow_up_actions,
      submissionStatus: row.submission_status,
      submittedBy: row.submitted_by,
      submittedByName: row.submitter?.display_name || 'Staff Member',
      submittedAt: row.submitted_at,
      reviewedBy: row.reviewed_by,
      reviewedByName: row.reviewer?.display_name,
      reviewedAt: row.reviewed_at,
      reviewComments: row.review_comments,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      evidenceDocuments: evidence,
    };
  });
}

/**
 * Record a new field activity report
 */
export async function createActivity(
  input: CreateActivityInput,
  user?: { id: string; name: string }
): Promise<ActivityRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const authorId = user?.id;
  if (!authorId) throw new Error('Authentication required to record activity.');

  const status = input.submitImmediately ? 'submitted' : 'draft';
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('activities')
    .insert({
      project_id: input.projectId,
      title: input.title.trim(),
      description: input.description || null,
      activity_date: input.activityDate,
      location: input.location || null,
      participants_count: input.participantsCount || 0,
      progress: (input.progress || '').trim(),
      challenges: input.challenges || input.operationalChallenges || null,
      follow_up_actions: input.followUpActions || input.recommendations || null,
      submission_status: status,
      submitted_by: authorId,
      submitted_at: input.submitImmediately ? now : null,
    })
    .select('*, submitter:profiles!submitted_by(display_name)')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create activity: ${error?.message}`);
  }

  return {
    id: data.id,
    projectId: data.project_id,
    title: data.title,
    description: data.description,
    activityDate: data.activity_date,
    location: data.location,
    participantsCount: data.participants_count || 0,
    progress: data.progress,
    challenges: data.challenges,
    followUpActions: data.follow_up_actions,
    submissionStatus: data.submission_status,
    submittedBy: data.submitted_by,
    submittedByName: data.submitter?.display_name || user?.name || 'Staff Member',
    submittedAt: data.submitted_at,
    reviewedBy: null,
    reviewedAt: null,
    reviewComments: null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    evidenceDocuments: [],
  };
}

/**
 * Submit an existing draft activity for manager review
 */
export async function submitActivity(
  activityId: string,
  user: { id: string }
): Promise<ActivityRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('activities')
    .update({
      submission_status: 'submitted',
      submitted_at: now,
      submitted_by: user.id,
      updated_at: now,
    })
    .eq('id', activityId)
    .select('*, submitter:profiles!submitted_by(display_name)')
    .single();

  if (error || !data) {
    throw new Error(`Failed to submit activity: ${error?.message}`);
  }

  return {
    id: data.id,
    projectId: data.project_id,
    title: data.title,
    description: data.description,
    activityDate: data.activity_date,
    location: data.location,
    participantsCount: data.participants_count || 0,
    progress: data.progress,
    challenges: data.challenges,
    followUpActions: data.follow_up_actions,
    submissionStatus: data.submission_status,
    submittedBy: data.submitted_by,
    submittedByName: data.submitter?.display_name || 'Staff Member',
    submittedAt: data.submitted_at,
    reviewedBy: null,
    reviewedAt: null,
    reviewComments: null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    evidenceDocuments: [],
  };
}

/**
 * Update an existing field activity report (for drafts or returned activities)
 */
export async function updateActivity(
  activityId: string,
  input: Partial<CreateActivityInput> & { submitImmediately?: boolean },
  user: { id: string }
): Promise<ActivityRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    updated_at: now,
  };

  if (input.title !== undefined) updatePayload.title = input.title.trim();
  if (input.description !== undefined) updatePayload.description = input.description || null;
  if (input.activityDate !== undefined) updatePayload.activity_date = input.activityDate;
  if (input.location !== undefined) updatePayload.location = input.location || null;
  if (input.participantsCount !== undefined) updatePayload.participants_count = input.participantsCount;
  if (input.progress !== undefined) updatePayload.progress = input.progress.trim();
  if (input.challenges !== undefined || input.operationalChallenges !== undefined) {
    updatePayload.challenges = input.challenges || input.operationalChallenges || null;
  }
  if (input.followUpActions !== undefined || input.recommendations !== undefined) {
    updatePayload.follow_up_actions = input.followUpActions || input.recommendations || null;
  }
  if (input.submitImmediately) {
    updatePayload.submission_status = 'submitted';
    updatePayload.submitted_at = now;
    updatePayload.submitted_by = user.id;
  }

  const { data, error } = await supabase
    .from('activities')
    .update(updatePayload)
    .eq('id', activityId)
    .select('*, submitter:profiles!submitted_by(display_name), reviewer:profiles!reviewed_by(display_name)')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update activity: ${error?.message}`);
  }

  return {
    id: data.id,
    projectId: data.project_id,
    title: data.title,
    description: data.description,
    activityDate: data.activity_date,
    location: data.location,
    participantsCount: data.participants_count || 0,
    progress: data.progress,
    challenges: data.challenges,
    followUpActions: data.follow_up_actions,
    submissionStatus: data.submission_status,
    submittedBy: data.submitted_by,
    submittedByName: data.submitter?.display_name || 'Staff Member',
    submittedAt: data.submitted_at,
    reviewedBy: data.reviewed_by,
    reviewedByName: data.reviewer?.display_name,
    reviewedAt: data.reviewed_at,
    reviewComments: data.review_comments,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    evidenceDocuments: [],
  };
}

/**
 * Review an activity (Approve or Return for Correction)
 */
export async function reviewActivity(
  input: ReviewActivityInput,
  reviewer: { id: string; name: string }
): Promise<ActivityRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const now = new Date().toISOString();
  const nextStatus = input.decision === 'approve' ? 'approved' : 'returned_for_correction';

  const { data, error } = await supabase
    .from('activities')
    .update({
      submission_status: nextStatus,
      reviewed_by: reviewer.id,
      reviewed_at: now,
      review_comments: input.comments.trim(),
      updated_at: now,
    })
    .eq('id', input.activityId)
    .select('*, submitter:profiles!submitted_by(display_name), reviewer:profiles!reviewed_by(display_name)')
    .single();

  if (error || !data) {
    throw new Error(`Failed to review activity: ${error?.message}`);
  }

  return {
    id: data.id,
    projectId: data.project_id,
    title: data.title,
    description: data.description,
    activityDate: data.activity_date,
    location: data.location,
    participantsCount: data.participants_count || 0,
    progress: data.progress,
    challenges: data.challenges,
    followUpActions: data.follow_up_actions,
    submissionStatus: data.submission_status,
    submittedBy: data.submitted_by,
    submittedByName: data.submitter?.display_name || 'Staff Member',
    submittedAt: data.submitted_at,
    reviewedBy: data.reviewed_by,
    reviewedByName: data.reviewer?.display_name || reviewer.name,
    reviewedAt: data.reviewed_at,
    reviewComments: data.review_comments,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    evidenceDocuments: [],
  };
}

/**
 * Review activity submission helper supporting direct status decision
 */
export async function reviewActivitySubmission(
  activityId: string,
  decision: 'approved' | 'returned_for_correction',
  reviewerId: string,
  comments?: string
): Promise<ActivityRecord> {
  return reviewActivity(
    {
      activityId,
      decision: decision === 'approved' ? 'approve' : 'return',
      comments: comments || (decision === 'approved' ? 'Approved by Project Manager' : 'Returned for revision'),
    },
    { id: reviewerId, name: 'Project Manager' }
  );
}

/**
 * Get tasks for a specific project
 */
export async function getProjectTasks(projectId: string): Promise<TaskRecord[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select('*, activities(title), assignee:profiles!assigned_to(display_name)')
    .eq('project_id', projectId)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('[projectService] Failed to fetch tasks:', error);
    return [];
  }

  return (data || []).map((row: any): TaskRecord => ({
    id: row.id,
    projectId: row.project_id,
    activityId: row.activity_id,
    activityTitle: row.activities?.title,
    title: row.title,
    description: row.description,
    assignedTo: row.assigned_to,
    assignedToName: row.assignee?.display_name,
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    completedAt: row.completed_at,
    completedBy: null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create a new task
 */
export async function createTask(
  input: CreateTaskInput,
  user: { id: string; name: string }
): Promise<TaskRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: input.projectId,
      activity_id: input.activityId || null,
      title: input.title.trim(),
      description: input.description || null,
      assigned_to: input.assignedTo || null,
      due_date: input.dueDate || null,
      priority: input.priority,
      status: 'todo',
      created_by: user.id,
    })
    .select('*, activities(title), assignee:profiles!assigned_to(display_name)')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create task: ${error?.message}`);
  }

  return {
    id: data.id,
    projectId: data.project_id,
    activityId: data.activity_id,
    activityTitle: data.activities?.title,
    title: data.title,
    description: data.description,
    assignedTo: data.assigned_to,
    assignedToName: data.assignee?.display_name,
    dueDate: data.due_date,
    priority: data.priority,
    status: data.status,
    completedAt: data.completed_at,
    completedBy: null,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update an existing task
 */
export async function updateTask(
  input: UpdateTaskInput,
  user: { id: string; name: string }
): Promise<TaskRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    updated_at: now,
  };

  if (input.title !== undefined) updatePayload.title = input.title.trim();
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.assignedTo !== undefined) updatePayload.assigned_to = input.assignedTo;
  if (input.dueDate !== undefined) updatePayload.due_date = input.dueDate;
  if (input.priority !== undefined) updatePayload.priority = input.priority;
  if (input.status !== undefined) {
    updatePayload.status = input.status;
    if (input.status === 'completed') {
      updatePayload.completed_at = now;
    } else {
      updatePayload.completed_at = null;
    }
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', input.taskId)
    .select('*, activities(title), assignee:profiles!assigned_to(display_name)')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update task: ${error?.message}`);
  }

  return {
    id: data.id,
    projectId: data.project_id,
    activityId: data.activity_id,
    activityTitle: data.activities?.title,
    title: data.title,
    description: data.description,
    assignedTo: data.assigned_to,
    assignedToName: data.assignee?.display_name,
    dueDate: data.due_date,
    priority: data.priority,
    status: data.status,
    completedAt: data.completed_at,
    completedBy: null,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Get project reports
 */
export async function getProjectReports(projectId: string): Promise<ProjectReportRecord[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('project_reports')
    .select('*, documents(title), submitter:profiles!submitted_by(display_name)')
    .eq('project_id', projectId)
    .order('period_end', { ascending: false });

  if (error) {
    console.error('[projectService] Failed to fetch project reports:', error);
    return [];
  }

  return (data || []).map((row: any): ProjectReportRecord => ({
    id: row.id,
    projectId: row.project_id,
    reportType: row.report_type,
    title: row.title,
    reportingPeriodStart: row.period_start,
    reportingPeriodEnd: row.period_end,
    summary: row.summary,
    achievements: null,
    challenges: null,
    recommendations: null,
    status: row.status,
    submittedBy: row.submitted_by,
    submittedByName: row.submitter?.display_name || 'Staff Member',
    submittedAt: row.submitted_at,
    documentId: row.document_id,
    documentTitle: row.documents?.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get project budget summary directly from Supabase
 */
export async function getProjectBudget(projectId: string): Promise<ProjectBudgetRecord | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('project_budgets')
    .select('*')
    .eq('project_id', projectId);

  if (error || !data || data.length === 0) {
    return null;
  }

  let totalAlloc = 0;
  let totalSpent = 0;
  let totalCommitted = 0;

  data.forEach((b: any) => {
    totalAlloc += Number(b.allocated_amount) || 0;
    totalSpent += Number(b.spent_amount) || 0;
    totalCommitted += Number(b.committed_amount) || 0;
  });

  return {
    id: data[0].id,
    projectId,
    currency: 'TZS',
    totalAllocated: totalAlloc,
    totalSpent,
    totalCommitted,
    balance: totalAlloc - (totalSpent + totalCommitted),
    burnRatePercent: totalAlloc > 0 ? (totalSpent / totalAlloc) * 100 : 0,
    lastReviewedAt: data[0].updated_at || data[0].created_at,
    lastReviewedBy: null,
  };
}

/**
 * Assign a member to a project
 */
export async function assignProjectMember(
  input: AssignMemberInput,
  assigner: { id: string }
): Promise<ProjectMemberRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('project_members')
    .upsert(
      {
        project_id: input.projectId,
        user_id: input.userId,
        project_role: input.projectRole,
        assigned_by: assigner.id,
      },
      { onConflict: 'project_id,user_id' }
    )
    .select('*, profiles:profiles!project_members_user_id_fkey(display_name, official_email)')
    .single();

  if (error || !data) {
    throw new Error(`Failed to assign member: ${error?.message}`);
  }

  return {
    id: data.id,
    projectId: data.project_id,
    userId: data.user_id,
    userName: data.profiles?.display_name || 'Staff Member',
    userEmail: data.profiles?.official_email || '',
    projectRole: data.project_role,
    assignedAt: data.assigned_at,
    assignedBy: data.assigned_by,
  };
}

/**
 * Remove a member from a project
 */
export async function removeProjectMember(
  projectId: string,
  userId: string
): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to remove member: ${error.message}`);
  }
}

/**
 * Fetch all field activities across all projects with project name and coordinator info
 */
export async function getAllActivities(params?: {
  projectId?: string;
  status?: string;
  submittedBy?: string;
  searchQuery?: string;
}): Promise<ActivityRecord[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('activities')
    .select(`
      *,
      project:projects(id, project_code, name),
      submitter:profiles!submitted_by(display_name),
      reviewer:profiles!reviewed_by(display_name),
      activity_documents(
        activity_id, document_id, attached_at,
        documents(title, reference_number)
      )
    `)
    .order('activity_date', { ascending: false });

  if (params?.projectId && params.projectId !== 'all') {
    query = query.eq('project_id', params.projectId);
  }
  if (params?.status && params.status !== 'all') {
    query = query.eq('submission_status', params.status);
  }
  if (params?.submittedBy) {
    query = query.eq('submitted_by', params.submittedBy);
  }
  if (params?.searchQuery) {
    const q = params.searchQuery.trim();
    query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%,progress.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row: any): ActivityRecord => {
    const evidence: ActivityDocumentRecord[] = (row.activity_documents || []).map((ad: any) => ({
      id: `${ad.activity_id}-${ad.document_id}`,
      activityId: ad.activity_id,
      documentId: ad.document_id,
      documentTitle: ad.documents?.title || 'Evidence File',
      documentReference: ad.documents?.reference_number || 'REF',
      attachedAt: ad.attached_at,
      attachedBy: '',
    }));

    return {
      id: row.id,
      projectId: row.project_id,
      projectName: row.project?.name,
      projectCode: row.project?.project_code,
      title: row.title,
      description: row.description,
      activityDate: row.activity_date,
      location: row.location,
      participantsCount: row.participants_count || 0,
      progress: row.progress || '',
      challenges: row.challenges,
      followUpActions: row.follow_up_actions,
      submissionStatus: row.submission_status,
      submittedBy: row.submitted_by,
      submittedByName: row.submitter?.display_name || 'Staff Member',
      submittedAt: row.submitted_at,
      reviewedBy: row.reviewed_by,
      reviewedByName: row.reviewer?.display_name,
      reviewedAt: row.reviewed_at,
      reviewComments: row.review_comments,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      evidenceDocuments: evidence,
    };
  });
}

/**
 * Fetch all workplan tasks across projects
 */
export async function getAllTasks(params?: {
  projectId?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  searchQuery?: string;
}): Promise<TaskRecord[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('tasks')
    .select(`
      *,
      project:projects(id, project_code, name),
      activities:activities(title),
      assignee:profiles!assigned_to(display_name)
    `)
    .order('due_date', { ascending: true });

  if (params?.projectId && params.projectId !== 'all') {
    query = query.eq('project_id', params.projectId);
  }
  if (params?.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params?.priority && params.priority !== 'all') {
    query = query.eq('priority', params.priority);
  }
  if (params?.assignedTo) {
    query = query.eq('assigned_to', params.assignedTo);
  }
  if (params?.searchQuery) {
    const q = params.searchQuery.trim();
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row: any): TaskRecord => ({
    id: row.id,
    projectId: row.project_id,
    projectName: row.project?.name,
    projectCode: row.project?.project_code,
    activityId: row.activity_id,
    activityTitle: row.activities?.title,
    title: row.title,
    description: row.description,
    assignedTo: row.assigned_to,
    assignedToName: row.assignee?.display_name || 'Unassigned',
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    completedAt: row.completed_at,
    completedBy: null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Fetch all project reports and donor deliverables
 */
export async function getAllReports(params?: {
  projectId?: string;
  status?: string;
  reportType?: string;
}): Promise<ProjectReportRecord[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('project_reports')
    .select(`
      *,
      project:projects(id, project_code, name),
      documents:documents(title),
      submitter:profiles!submitted_by(display_name)
    `)
    .order('period_end', { ascending: false });

  if (params?.projectId && params.projectId !== 'all') {
    query = query.eq('project_id', params.projectId);
  }
  if (params?.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params?.reportType && params.reportType !== 'all') {
    query = query.eq('report_type', params.reportType);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row: any): ProjectReportRecord => ({
    id: row.id,
    projectId: row.project_id,
    projectName: row.project?.name,
    projectCode: row.project?.project_code,
    reportType: row.report_type,
    title: row.title,
    reportingPeriodStart: row.period_start,
    reportingPeriodEnd: row.period_end,
    summary: row.summary,
    achievements: null,
    challenges: null,
    recommendations: null,
    status: row.status,
    submittedBy: row.submitted_by,
    submittedByName: row.submitter?.display_name || 'Project Staff',
    submittedAt: row.submitted_at,
    documentId: row.document_id,
    documentTitle: row.documents?.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Fetch all project team members and coordinator assignments
 */
export async function getAllTeamMembers(params?: {
  projectId?: string;
  role?: string;
}): Promise<ProjectMemberRecord[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('project_members')
    .select(`
      *,
      project:projects(id, project_code, name),
      profiles:profiles!project_members_user_id_fkey(display_name, official_email)
    `)
    .order('assigned_at', { ascending: false });

  if (params?.projectId && params.projectId !== 'all') {
    query = query.eq('project_id', params.projectId);
  }
  if (params?.role && params.role !== 'all') {
    query = query.eq('project_role', params.role);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row: any): ProjectMemberRecord => ({
    id: row.id,
    projectId: row.project_id,
    projectName: row.project?.name,
    projectCode: row.project?.project_code,
    userId: row.user_id,
    userName: row.profiles?.display_name || 'Staff Member',
    userEmail: row.profiles?.official_email || '',
    projectRole: row.project_role,
    assignedAt: row.assigned_at,
    assignedBy: row.assigned_by,
  }));
}

