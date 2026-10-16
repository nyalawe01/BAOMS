/**
 * BAOMS Phase 10: Correspondence & Meetings Service Layer
 * Babawatoto Organization Management System
 * 
 * Strict Database-Driven Architecture:
 * All correspondence, meetings, attendees, decisions, and action items
 * are queried and persisted exclusively via Supabase PostgreSQL.
 * No mock data or offline fallbacks.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  CorrespondenceRecord,
  CorrespondenceDirection,
  CorrespondenceCategory,
  CorrespondenceStatus,
  MeetingRecord,
  MeetingAttendeeRecord,
  MeetingDecisionRecord,
  MeetingActionRecord,
  CreateCorrespondencePayload,
  CreateMeetingPayload,
  CreateMeetingDecisionPayload,
  CreateMeetingActionPayload,
  UpdateMeetingActionPayload,
} from '../types/correspondence';

export const syncCorrespondenceState = (): void => {};
export const resetMockCorrespondenceData = (): void => {};

/**
 * Helper to compute whether an action item is overdue
 */
function isActionOverdue(dueDate: string, status: string): boolean {
  if (['completed', 'cancelled'].includes(status)) return false;
  const today = new Date().toISOString().split('T')[0] ?? '';
  return dueDate < today;
}

/**
 * Fetch correspondence records with scoping and filtering
 */
export async function getCorrespondence(
  filters?: {
    direction?: CorrespondenceDirection | 'all';
    category?: CorrespondenceCategory | 'all';
    status?: CorrespondenceStatus | 'all';
    projectId?: string | 'all';
    search?: string;
  },
  currentUser?: { id: string; roles: string[] }
): Promise<CorrespondenceRecord[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase.from('correspondence').select(`
    *,
    project:projects(name),
    document:documents(title, reference_number),
    registrar:profiles!registered_by(display_name)
  `).order('correspondence_date', { ascending: false });

  if (filters?.direction && filters.direction !== 'all') {
    query = query.eq('direction', filters.direction);
  }
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.projectId && filters.projectId !== 'all') {
    query = query.eq('project_id', filters.projectId);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error('[correspondenceService] Failed to fetch correspondence:', error);
    return [];
  }

  let results: CorrespondenceRecord[] = data.map((item: any) => ({
    id: item.id,
    referenceNumber: item.reference_number,
    direction: item.direction,
    sender: item.sender,
    recipient: item.recipient,
    subject: item.subject,
    correspondenceDate: item.correspondence_date,
    category: item.category,
    projectId: item.project_id,
    projectName: item.project?.name || null,
    documentId: item.document_id,
    documentTitle: item.document?.title || null,
    documentNumber: item.document?.reference_number || null,
    status: item.status,
    confidentialityLevel: item.confidentiality_level,
    notes: item.notes,
    registeredBy: item.registered_by,
    registeredByName: item.registrar?.display_name || 'Staff Member',
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));

  // Confidentiality scoping
  if (currentUser) {
    const isLeadership = currentUser.roles.some((r) =>
      ['system_admin', 'executive_director'].includes(r)
    );
    if (!isLeadership) {
      results = results.filter(
        (c) =>
          c.confidentialityLevel !== 'confidential' ||
          c.registeredBy === currentUser.id
      );
    }
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    results = results.filter(
      (c) =>
        c.referenceNumber.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.sender.toLowerCase().includes(q) ||
        c.recipient.toLowerCase().includes(q)
    );
  }

  return results;
}

/**
 * Fetch single correspondence by ID
 */
export async function getCorrespondenceById(
  id: string
): Promise<CorrespondenceRecord | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('correspondence')
    .select(`
      *,
      project:projects(name),
      document:documents(title, reference_number),
      registrar:profiles!registered_by(display_name)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    referenceNumber: data.reference_number,
    direction: data.direction,
    sender: data.sender,
    recipient: data.recipient,
    subject: data.subject,
    correspondenceDate: data.correspondence_date,
    category: data.category,
    projectId: data.project_id,
    projectName: data.project?.name || null,
    documentId: data.document_id,
    documentTitle: data.document?.title || null,
    documentNumber: data.document?.reference_number || null,
    status: data.status,
    confidentialityLevel: data.confidentiality_level,
    notes: data.notes,
    registeredBy: data.registered_by,
    registeredByName: data.registrar?.display_name || 'Staff Member',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Register new incoming or outgoing correspondence
 */
export async function createCorrespondence(
  payload: CreateCorrespondencePayload,
  currentUser?: { id: string; displayName?: string }
): Promise<CorrespondenceRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const currentYear = new Date().getFullYear();
  const dirPrefix = payload.direction === 'incoming' ? 'IN' : 'OUT';

  const { count } = await supabase
    .from('correspondence')
    .select('*', { count: 'exact', head: true })
    .eq('direction', payload.direction);

  const nextSeq = ((count || 0) + 1).toString().padStart(3, '0');
  const referenceNumber = `COR-${dirPrefix}-${currentYear}-${nextSeq}`;

  const { data, error } = await supabase
    .from('correspondence')
    .insert({
      reference_number: referenceNumber,
      direction: payload.direction,
      sender: payload.sender.trim(),
      recipient: payload.recipient.trim(),
      subject: payload.subject.trim(),
      correspondence_date: payload.correspondenceDate,
      category: payload.category,
      project_id: payload.projectId || null,
      document_id: payload.documentId || null,
      status: payload.direction === 'incoming' ? 'received' : 'draft',
      confidentiality_level: payload.confidentialityLevel || 'internal',
      notes: payload.notes?.trim() || null,
      registered_by: currentUser?.id || null,
    })
    .select(`
      *,
      project:projects(name),
      document:documents(title, reference_number),
      registrar:profiles!registered_by(display_name)
    `)
    .single();

  if (error || !data) {
    throw new Error(`Failed to create correspondence: ${error?.message}`);
  }

  return {
    id: data.id,
    referenceNumber: data.reference_number,
    direction: data.direction,
    sender: data.sender,
    recipient: data.recipient,
    subject: data.subject,
    correspondenceDate: data.correspondence_date,
    category: data.category,
    projectId: data.project_id,
    projectName: data.project?.name || null,
    documentId: data.document_id,
    documentTitle: data.document?.title || null,
    documentNumber: data.document?.reference_number || null,
    status: data.status,
    confidentialityLevel: data.confidentiality_level,
    notes: data.notes,
    registeredBy: data.registered_by,
    registeredByName: data.registrar?.display_name || currentUser?.displayName || 'Staff Member',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update correspondence review status or notes
 */
export async function updateCorrespondence(
  id: string,
  payload: Partial<CorrespondenceRecord>
): Promise<CorrespondenceRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const updateFields: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.status !== undefined) updateFields.status = payload.status;
  if (payload.notes !== undefined) updateFields.notes = payload.notes;
  if (payload.confidentialityLevel !== undefined) updateFields.confidentiality_level = payload.confidentialityLevel;
  if (payload.category !== undefined) updateFields.category = payload.category;
  if (payload.documentId !== undefined) updateFields.document_id = payload.documentId;

  const { data, error } = await supabase
    .from('correspondence')
    .update(updateFields)
    .eq('id', id)
    .select(`
      *,
      project:projects(name),
      document:documents(title, reference_number),
      registrar:profiles!registered_by(display_name)
    `)
    .single();

  if (error || !data) {
    throw new Error(`Failed to update correspondence: ${error?.message}`);
  }

  return {
    id: data.id,
    referenceNumber: data.reference_number,
    direction: data.direction,
    sender: data.sender,
    recipient: data.recipient,
    subject: data.subject,
    correspondenceDate: data.correspondence_date,
    category: data.category,
    projectId: data.project_id,
    projectName: data.project?.name || null,
    documentId: data.document_id,
    documentTitle: data.document?.title || null,
    documentNumber: data.document?.reference_number || null,
    status: data.status,
    confidentialityLevel: data.confidentiality_level,
    notes: data.notes,
    registeredBy: data.registered_by,
    registeredByName: data.registrar?.display_name || 'Staff Member',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Archive a correspondence record
 */
export async function archiveCorrespondence(
  id: string
): Promise<CorrespondenceRecord> {
  return updateCorrespondence(id, { status: 'archived' });
}

/**
 * Fetch formal meeting records
 */
export async function getMeetings(
  filters?: {
    meetingType?: string;
    status?: string;
    search?: string;
  },
  currentUser?: { id: string; roles: string[] }
): Promise<MeetingRecord[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase.from('meetings').select(`
    *,
    chairperson:profiles!chairperson_id(display_name),
    secretary:profiles!secretary_id(display_name),
    minutes_document:documents(title),
    meeting_attendees(id),
    meeting_decisions(id),
    meeting_actions(id)
  `).order('meeting_date', { ascending: false });

  if (filters?.meetingType && filters.meetingType !== 'all') {
    query = query.eq('meeting_type', filters.meetingType);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error('[correspondenceService] Failed to fetch meetings:', error);
    return [];
  }

  let list: MeetingRecord[] = data.map((m: any) => ({
    id: m.id,
    meetingNumber: m.meeting_number,
    title: m.title,
    meetingType: m.meeting_type,
    meetingDate: m.meeting_date,
    location: m.location,
    chairpersonId: m.chairperson_id,
    chairpersonName: m.chairperson?.display_name || null,
    secretaryId: m.secretary_id,
    secretaryName: m.secretary?.display_name || null,
    minutesDocumentId: m.minutes_document_id,
    minutesDocumentTitle: m.minutes_document?.title || null,
    status: m.status,
    confidentialityLevel: m.confidentiality_level,
    attendeesCount: m.meeting_attendees?.length || 0,
    decisionsCount: m.meeting_decisions?.length || 0,
    actionsCount: m.meeting_actions?.length || 0,
    createdBy: m.created_by,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  }));

  // Confidentiality scoping
  if (currentUser) {
    const isLeadership = currentUser.roles.some((r) =>
      ['system_admin', 'executive_director'].includes(r)
    );
    if (!isLeadership) {
      list = list.filter(
        (m) =>
          m.confidentialityLevel !== 'confidential' ||
          m.chairpersonId === currentUser.id ||
          m.secretaryId === currentUser.id ||
          m.createdBy === currentUser.id
      );
    }
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (m) =>
        m.meetingNumber.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q)
    );
  }

  return list;
}

/**
 * Fetch meeting details by ID
 */
export async function getMeetingById(id: string): Promise<MeetingRecord | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      chairperson:profiles!chairperson_id(display_name),
      secretary:profiles!secretary_id(display_name),
      minutes_document:documents(title),
      meeting_attendees(id),
      meeting_decisions(id),
      meeting_actions(id)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    meetingNumber: data.meeting_number,
    title: data.title,
    meetingType: data.meeting_type,
    meetingDate: data.meeting_date,
    location: data.location,
    chairpersonId: data.chairperson_id,
    chairpersonName: data.chairperson?.display_name || null,
    secretaryId: data.secretary_id,
    secretaryName: data.secretary?.display_name || null,
    minutesDocumentId: data.minutes_document_id,
    minutesDocumentTitle: data.minutes_document?.title || null,
    status: data.status,
    confidentialityLevel: data.confidentiality_level,
    attendeesCount: data.meeting_attendees?.length || 0,
    decisionsCount: data.meeting_decisions?.length || 0,
    actionsCount: data.meeting_actions?.length || 0,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Register a new meeting with attendees
 */
export async function createMeeting(
  payload: CreateMeetingPayload,
  currentUser?: { id: string; displayName?: string }
): Promise<MeetingRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const currentYear = new Date().getFullYear();
  const { count } = await supabase.from('meetings').select('*', { count: 'exact', head: true });
  const nextSeq = ((count || 0) + 1).toString().padStart(3, '0');
  const meetingNumber = `MTG-${currentYear}-${nextSeq}`;

  const { data: dbMeeting, error: meetErr } = await supabase
    .from('meetings')
    .insert({
      meeting_number: meetingNumber,
      title: payload.title.trim(),
      meeting_type: payload.meetingType,
      meeting_date: payload.meetingDate,
      location: payload.location.trim(),
      chairperson_id: payload.chairpersonId || null,
      secretary_id: payload.secretaryId || null,
      minutes_document_id: payload.minutesDocumentId || null,
      status: 'completed',
      confidentiality_level: payload.confidentialityLevel || 'internal',
      created_by: currentUser?.id || null,
    })
    .select(`
      *,
      chairperson:profiles!chairperson_id(display_name),
      secretary:profiles!secretary_id(display_name),
      minutes_document:documents(title)
    `)
    .single();

  if (meetErr || !dbMeeting) {
    throw new Error(`Failed to create meeting: ${meetErr?.message}`);
  }

  // Insert attendees if provided
  if (payload.attendees && payload.attendees.length > 0) {
    const attendeesToInsert = payload.attendees.map((att) => ({
      meeting_id: dbMeeting.id,
      user_id: att.userId || null,
      external_name: att.externalName || null,
      email: att.email || null,
      role: att.role || 'participant',
      attended: att.attended ?? true,
    }));
    await supabase.from('meeting_attendees').insert(attendeesToInsert);
  }

  return {
    id: dbMeeting.id,
    meetingNumber: dbMeeting.meeting_number,
    title: dbMeeting.title,
    meetingType: dbMeeting.meeting_type,
    meetingDate: dbMeeting.meeting_date,
    location: dbMeeting.location,
    chairpersonId: dbMeeting.chairperson_id,
    chairpersonName: dbMeeting.chairperson?.display_name || null,
    secretaryId: dbMeeting.secretary_id,
    secretaryName: dbMeeting.secretary?.display_name || null,
    minutesDocumentId: dbMeeting.minutes_document_id,
    minutesDocumentTitle: dbMeeting.minutes_document?.title || null,
    status: dbMeeting.status,
    confidentialityLevel: dbMeeting.confidentiality_level,
    attendeesCount: payload.attendees?.length || 0,
    decisionsCount: 0,
    actionsCount: 0,
    createdBy: dbMeeting.created_by,
    createdAt: dbMeeting.created_at,
    updatedAt: dbMeeting.updated_at,
  };
}

/**
 * Fetch attendees for a meeting
 */
export async function getMeetingAttendees(
  meetingId: string
): Promise<MeetingAttendeeRecord[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('meeting_attendees')
    .select('*, user:profiles(display_name)')
    .eq('meeting_id', meetingId);

  if (error || !data) return [];

  return data.map((a: any) => ({
    id: a.id,
    meetingId: a.meeting_id,
    userId: a.user_id,
    externalName: a.external_name,
    email: a.email,
    role: a.role,
    attended: a.attended,
    displayName: a.external_name || a.user?.display_name || 'Attendee',
  }));
}

/**
 * Fetch decisions logged for a meeting
 */
export async function getMeetingDecisions(
  meetingId: string
): Promise<MeetingDecisionRecord[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('meeting_decisions')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((d: any) => ({
    id: d.id,
    meetingId: d.meeting_id,
    decisionNumber: d.decision_number,
    title: d.title,
    description: d.description,
    category: d.category,
    createdAt: d.created_at,
  }));
}

/**
 * Log a new decision for a meeting
 */
export async function createMeetingDecision(
  payload: CreateMeetingDecisionPayload
): Promise<MeetingDecisionRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const currentYear = new Date().getFullYear();
  const { count } = await supabase.from('meeting_decisions').select('*', { count: 'exact', head: true });
  const nextSeq = ((count || 0) + 1).toString().padStart(3, '0');
  const decisionNumber = `DEC-${currentYear}-${nextSeq}`;

  const { data, error } = await supabase
    .from('meeting_decisions')
    .insert({
      meeting_id: payload.meetingId,
      decision_number: decisionNumber,
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category || 'operational',
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create meeting decision: ${error?.message}`);
  }

  return {
    id: data.id,
    meetingId: data.meeting_id,
    decisionNumber: data.decision_number,
    title: data.title,
    description: data.description,
    category: data.category,
    createdAt: data.created_at,
  };
}

/**
 * Fetch trackable follow-up action items
 */
export async function getMeetingActions(filters?: {
  meetingId?: string;
  assignedTo?: string;
  status?: string;
  overdueOnly?: boolean;
}): Promise<MeetingActionRecord[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase.from('meeting_actions').select(`
    *,
    meeting:meetings(meeting_number, title),
    assignee:profiles!assigned_to(display_name)
  `).order('due_date', { ascending: true });

  if (filters?.meetingId && filters.meetingId !== 'all') {
    query = query.eq('meeting_id', filters.meetingId);
  }
  if (filters?.assignedTo && filters.assignedTo !== 'all') {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  let list: MeetingActionRecord[] = data.map((act: any) => {
    const overdue = isActionOverdue(act.due_date, act.status);
    return {
      id: act.id,
      meetingId: act.meeting_id,
      meetingNumber: act.meeting?.meeting_number || 'MTG',
      meetingTitle: act.meeting?.title || 'Meeting',
      decisionId: act.decision_id,
      actionNumber: act.action_number,
      taskDescription: act.task_description,
      assignedTo: act.assigned_to,
      assignedToName: act.assigned_to_name || act.assignee?.display_name || 'Assigned Officer',
      dueDate: act.due_date,
      status: overdue && act.status === 'pending' ? 'overdue' : act.status,
      isOverdue: overdue,
      completionNotes: act.completion_notes,
      completedAt: act.completed_at,
      completedBy: act.completed_by,
      createdAt: act.created_at,
      updatedAt: act.updated_at,
    };
  });

  if (filters?.overdueOnly) {
    list = list.filter((a) => a.isOverdue);
  }

  return list;
}

/**
 * Create a new follow-up action item
 */
export async function createMeetingAction(
  payload: CreateMeetingActionPayload
): Promise<MeetingActionRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const currentYear = new Date().getFullYear();
  const { count } = await supabase.from('meeting_actions').select('*', { count: 'exact', head: true });
  const nextSeq = ((count || 0) + 1).toString().padStart(3, '0');
  const actionNumber = `ACT-${currentYear}-${nextSeq}`;

  const { data, error } = await supabase
    .from('meeting_actions')
    .insert({
      meeting_id: payload.meetingId,
      decision_id: payload.decisionId || null,
      action_number: actionNumber,
      task_description: payload.taskDescription.trim(),
      assigned_to: payload.assignedTo || null,
      assigned_to_name: payload.assignedToName || null,
      due_date: payload.dueDate,
      status: 'pending',
    })
    .select(`
      *,
      meeting:meetings(meeting_number, title),
      assignee:profiles!assigned_to(display_name)
    `)
    .single();

  if (error || !data) {
    throw new Error(`Failed to create meeting action: ${error?.message}`);
  }

  const overdue = isActionOverdue(data.due_date, data.status);
  return {
    id: data.id,
    meetingId: data.meeting_id,
    meetingNumber: data.meeting?.meeting_number || 'MTG',
    meetingTitle: data.meeting?.title || 'Meeting',
    decisionId: data.decision_id,
    actionNumber: data.action_number,
    taskDescription: data.task_description,
    assignedTo: data.assigned_to,
    assignedToName: data.assigned_to_name || data.assignee?.display_name || 'Assigned Officer',
    dueDate: data.due_date,
    status: overdue ? 'overdue' : data.status,
    isOverdue: overdue,
    completionNotes: null,
    completedAt: null,
    completedBy: null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update status of an action item
 */
export async function updateMeetingAction(
  payload: UpdateMeetingActionPayload,
  currentUser?: { id: string; displayName?: string }
): Promise<MeetingActionRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const isComplete = payload.status === 'completed';
  const now = new Date().toISOString();

  const updateFields: Record<string, any> = {
    status: payload.status,
    updated_at: now,
  };

  if (payload.completionNotes !== undefined) {
    updateFields.completion_notes = payload.completionNotes;
  }
  if (isComplete) {
    updateFields.completed_at = now;
    updateFields.completed_by = currentUser?.id || null;
  }

  const { data, error } = await supabase
    .from('meeting_actions')
    .update(updateFields)
    .eq('id', payload.actionId)
    .select(`
      *,
      meeting:meetings(meeting_number, title),
      assignee:profiles!assigned_to(display_name)
    `)
    .single();

  if (error || !data) {
    throw new Error(`Failed to update action item: ${error?.message}`);
  }

  const overdue = !isComplete && isActionOverdue(data.due_date, data.status);
  return {
    id: data.id,
    meetingId: data.meeting_id,
    meetingNumber: data.meeting?.meeting_number || 'MTG',
    meetingTitle: data.meeting?.title || 'Meeting',
    decisionId: data.decision_id,
    actionNumber: data.action_number,
    taskDescription: data.task_description,
    assignedTo: data.assigned_to,
    assignedToName: data.assigned_to_name || data.assignee?.display_name || 'Assigned Officer',
    dueDate: data.due_date,
    status: overdue ? 'overdue' : data.status,
    isOverdue: overdue,
    completionNotes: data.completion_notes,
    completedAt: data.completed_at,
    completedBy: data.completed_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
