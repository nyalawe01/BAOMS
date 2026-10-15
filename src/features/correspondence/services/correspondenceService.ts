/**
 * BAOMS Phase 10: Correspondence & Meetings Service Layer
 * Babawatoto Organization Management System
 * 
 * Supports dual-mode architecture: live Supabase PostgreSQL (RLS) with 100% in-memory fallback.
 * Enforces role-based scoping, confidentiality controls, sequential reference generation,
 * and meeting follow-up task tracking.
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
import {
  INITIAL_MOCK_CORRESPONDENCE,
  INITIAL_MOCK_MEETINGS,
  INITIAL_MOCK_ATTENDEES,
  INITIAL_MOCK_DECISIONS,
  INITIAL_MOCK_ACTIONS,
} from '../data/mockCorrespondence';
import { getPersistentItem, setPersistentItem } from '@/lib/storageSync';

const CORR_STORAGE_KEYS = {
  CORRESPONDENCE: 'baoms_correspondence',
  MEETINGS: 'baoms_meetings',
  ATTENDEES: 'baoms_meeting_attendees',
  DECISIONS: 'baoms_meeting_decisions',
  ACTIONS: 'baoms_meeting_actions',
};

// In-Memory persistent state
let mockCorrespondence: CorrespondenceRecord[] = getPersistentItem(CORR_STORAGE_KEYS.CORRESPONDENCE, () => [
  ...INITIAL_MOCK_CORRESPONDENCE,
]);
let mockMeetings: MeetingRecord[] = getPersistentItem(CORR_STORAGE_KEYS.MEETINGS, () => [
  ...INITIAL_MOCK_MEETINGS,
]);
let mockAttendees: MeetingAttendeeRecord[] = getPersistentItem(CORR_STORAGE_KEYS.ATTENDEES, () => [
  ...INITIAL_MOCK_ATTENDEES,
]);
let mockDecisions: MeetingDecisionRecord[] = getPersistentItem(CORR_STORAGE_KEYS.DECISIONS, () => [
  ...INITIAL_MOCK_DECISIONS,
]);
let mockActions: MeetingActionRecord[] = getPersistentItem(CORR_STORAGE_KEYS.ACTIONS, () => [
  ...INITIAL_MOCK_ACTIONS,
]);

const syncCorrespondenceState = (): void => {
  setPersistentItem(CORR_STORAGE_KEYS.CORRESPONDENCE, mockCorrespondence);
  setPersistentItem(CORR_STORAGE_KEYS.MEETINGS, mockMeetings);
  setPersistentItem(CORR_STORAGE_KEYS.ATTENDEES, mockAttendees);
  setPersistentItem(CORR_STORAGE_KEYS.DECISIONS, mockDecisions);
  setPersistentItem(CORR_STORAGE_KEYS.ACTIONS, mockActions);
};

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
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('correspondence').select(`
        *,
        project:projects(name),
        document:documents(title, reference_number)
      `);

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
      if (!error && data) {
        return data.map((item: any) => ({
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
          registeredByName: null,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));
      }
    } catch {
      // Fall through to in-memory fallback
    }
  }

  // In-Memory Fallback
  let results = [...mockCorrespondence];

  // Confidentiality scoping:
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

  // Filters:
  if (filters?.direction && filters.direction !== 'all') {
    results = results.filter((c) => c.direction === filters.direction);
  }
  if (filters?.category && filters.category !== 'all') {
    results = results.filter((c) => c.category === filters.category);
  }
  if (filters?.status && filters.status !== 'all') {
    results = results.filter((c) => c.status === filters.status);
  }
  if (filters?.projectId && filters.projectId !== 'all') {
    results = results.filter((c) => c.projectId === filters.projectId);
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

  return results.sort(
    (a, b) =>
      new Date(b.correspondenceDate).getTime() -
      new Date(a.correspondenceDate).getTime()
  );
}

/**
 * Fetch single correspondence by ID
 */
export async function getCorrespondenceById(
  id: string
): Promise<CorrespondenceRecord | null> {
  const item = mockCorrespondence.find((c) => c.id === id);
  return item || null;
}

/**
 * Register new incoming or outgoing correspondence
 */
export async function createCorrespondence(
  payload: CreateCorrespondencePayload,
  currentUser?: { id: string; displayName?: string }
): Promise<CorrespondenceRecord> {
  const currentYear = new Date().getFullYear();
  const dirPrefix = payload.direction === 'incoming' ? 'IN' : 'OUT';
  const matchingDir = mockCorrespondence.filter(
    (c) => c.direction === payload.direction
  );
  const nextSeq = (matchingDir.length + 1).toString().padStart(3, '0');
  const referenceNumber = `COR-${dirPrefix}-${currentYear}-${nextSeq}`;

  const newRecord: CorrespondenceRecord = {
    id: `cor-${Date.now()}`,
    referenceNumber,
    direction: payload.direction,
    sender: payload.sender.trim(),
    recipient: payload.recipient.trim(),
    subject: payload.subject.trim(),
    correspondenceDate: payload.correspondenceDate,
    category: payload.category,
    projectId: payload.projectId || null,
    projectName: null,
    documentId: payload.documentId || null,
    documentTitle: null,
    documentNumber: null,
    status: payload.direction === 'incoming' ? 'received' : 'draft',
    confidentialityLevel: payload.confidentialityLevel || 'internal',
    notes: payload.notes?.trim() || null,
    registeredBy: currentUser?.id || 'sys-admin',
    registeredByName: currentUser?.displayName || 'System Admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockCorrespondence = [newRecord, ...mockCorrespondence];
  syncCorrespondenceState();
  return newRecord;
}

/**
 * Update correspondence review status or notes
 */
export async function updateCorrespondence(
  id: string,
  payload: Partial<CorrespondenceRecord>
): Promise<CorrespondenceRecord> {
  const index = mockCorrespondence.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error('Correspondence record not found.');
  }

  const existing = mockCorrespondence[index]!;
  const updated: CorrespondenceRecord = {
    ...existing,
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  mockCorrespondence[index] = updated;
  syncCorrespondenceState();
  return updated;
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
  let list = [...mockMeetings];

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

  if (filters?.meetingType && filters.meetingType !== 'all') {
    list = list.filter((m) => m.meetingType === filters.meetingType);
  }
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((m) => m.status === filters.status);
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

  return list.sort(
    (a, b) =>
      new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime()
  );
}

/**
 * Fetch meeting details by ID
 */
export async function getMeetingById(id: string): Promise<MeetingRecord | null> {
  const m = mockMeetings.find((item) => item.id === id);
  return m || null;
}

/**
 * Register a new meeting with attendees
 */
export async function createMeeting(
  payload: CreateMeetingPayload,
  currentUser?: { id: string; displayName?: string }
): Promise<MeetingRecord> {
  const currentYear = new Date().getFullYear();
  const nextSeq = (mockMeetings.length + 1).toString().padStart(3, '0');
  const meetingNumber = `MTG-${currentYear}-${nextSeq}`;

  const newMeeting: MeetingRecord = {
    id: `mtg-${Date.now()}`,
    meetingNumber,
    title: payload.title.trim(),
    meetingType: payload.meetingType,
    meetingDate: payload.meetingDate,
    location: payload.location.trim(),
    chairpersonId: payload.chairpersonId || null,
    chairpersonName: null,
    secretaryId: payload.secretaryId || null,
    secretaryName: null,
    minutesDocumentId: payload.minutesDocumentId || null,
    minutesDocumentTitle: null,
    status: 'completed',
    confidentialityLevel: payload.confidentialityLevel || 'internal',
    attendeesCount: payload.attendees?.length || 0,
    decisionsCount: 0,
    actionsCount: 0,
    createdBy: currentUser?.id || 'sys-admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockMeetings = [newMeeting, ...mockMeetings];

  // Add attendees if provided
  if (payload.attendees && payload.attendees.length > 0) {
    for (const att of payload.attendees) {
      mockAttendees.push({
        id: `att-${Date.now()}-${Math.random()}`,
        meetingId: newMeeting.id,
        userId: att.userId || null,
        externalName: att.externalName || null,
        email: att.email || null,
        role: att.role || 'participant',
        attended: att.attended ?? true,
        displayName: att.externalName || 'Attendee',
      });
    }
  }

  syncCorrespondenceState();
  return newMeeting;
}

/**
 * Fetch attendees for a meeting
 */
export async function getMeetingAttendees(
  meetingId: string
): Promise<MeetingAttendeeRecord[]> {
  return mockAttendees.filter((a) => a.meetingId === meetingId);
}

/**
 * Fetch decisions logged for a meeting
 */
export async function getMeetingDecisions(
  meetingId: string
): Promise<MeetingDecisionRecord[]> {
  return mockDecisions.filter((d) => d.meetingId === meetingId);
}

/**
 * Log a new decision for a meeting
 */
export async function createMeetingDecision(
  payload: CreateMeetingDecisionPayload
): Promise<MeetingDecisionRecord> {
  const meeting = mockMeetings.find((m) => m.id === payload.meetingId);
  if (!meeting) throw new Error('Meeting not found.');

  const currentYear = new Date().getFullYear();
  const nextSeq = (mockDecisions.length + 1).toString().padStart(3, '0');
  const decisionNumber = `DEC-${currentYear}-${nextSeq}`;

  const newDecision: MeetingDecisionRecord = {
    id: `dec-${Date.now()}`,
    meetingId: payload.meetingId,
    decisionNumber,
    title: payload.title.trim(),
    description: payload.description.trim(),
    category: payload.category || 'operational',
    createdAt: new Date().toISOString(),
  };

  mockDecisions.push(newDecision);
  meeting.decisionsCount += 1;
  syncCorrespondenceState();
  return newDecision;
}

/**
 * Fetch trackable follow-up action items with dynamic overdue flags
 */
export async function getMeetingActions(filters?: {
  meetingId?: string;
  assignedTo?: string;
  status?: string;
  overdueOnly?: boolean;
}): Promise<MeetingActionRecord[]> {
  let list = mockActions.map((act) => {
    const overdue = isActionOverdue(act.dueDate, act.status);
    return {
      ...act,
      isOverdue: overdue,
      status: overdue && act.status === 'pending' ? 'overdue' : act.status,
    };
  });

  if (filters?.meetingId && filters.meetingId !== 'all') {
    list = list.filter((a) => a.meetingId === filters.meetingId);
  }
  if (filters?.assignedTo && filters.assignedTo !== 'all') {
    list = list.filter((a) => a.assignedTo === filters.assignedTo);
  }
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((a) => a.status === filters.status);
  }
  if (filters?.overdueOnly) {
    list = list.filter((a) => a.isOverdue);
  }

  return list.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}

/**
 * Create a new follow-up action item
 */
export async function createMeetingAction(
  payload: CreateMeetingActionPayload
): Promise<MeetingActionRecord> {
  const meeting = mockMeetings.find((m) => m.id === payload.meetingId);
  if (!meeting) throw new Error('Meeting not found.');

  const currentYear = new Date().getFullYear();
  const nextSeq = (mockActions.length + 1).toString().padStart(3, '0');
  const actionNumber = `ACT-${currentYear}-${nextSeq}`;

  const overdue = isActionOverdue(payload.dueDate, 'pending');
  const newAction: MeetingActionRecord = {
    id: `act-${Date.now()}`,
    meetingId: payload.meetingId,
    meetingNumber: meeting.meetingNumber,
    meetingTitle: meeting.title,
    decisionId: payload.decisionId || null,
    actionNumber,
    taskDescription: payload.taskDescription.trim(),
    assignedTo: payload.assignedTo || null,
    assignedToName: payload.assignedToName || 'Assigned Officer',
    dueDate: payload.dueDate,
    status: overdue ? 'overdue' : 'pending',
    isOverdue: overdue,
    completionNotes: null,
    completedAt: null,
    completedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockActions.push(newAction);
  meeting.actionsCount += 1;
  syncCorrespondenceState();
  return newAction;
}

/**
 * Update status of an action item
 */
export async function updateMeetingAction(
  payload: UpdateMeetingActionPayload,
  currentUser?: { id: string; displayName?: string }
): Promise<MeetingActionRecord> {
  const index = mockActions.findIndex((a) => a.id === payload.actionId);
  if (index === -1) {
    throw new Error('Action item not found.');
  }

  const existing = mockActions[index]!;
  const isComplete = payload.status === 'completed';

  const updated: MeetingActionRecord = {
    ...existing,
    status: payload.status,
    completionNotes:
      payload.completionNotes !== undefined
        ? payload.completionNotes
        : existing.completionNotes,
    completedAt: isComplete ? new Date().toISOString() : existing.completedAt,
    completedBy: isComplete ? currentUser?.id || 'sys-admin' : existing.completedBy,
    updatedAt: new Date().toISOString(),
    isOverdue: !isComplete && isActionOverdue(existing.dueDate, payload.status),
  };

  mockActions[index] = updated;
  syncCorrespondenceState();
  return updated;
}

/**
 * Reset in-memory mock correspondence state (for test isolation)
 */
export function resetMockCorrespondenceData(): void {
  mockCorrespondence = [...INITIAL_MOCK_CORRESPONDENCE];
  mockMeetings = [...INITIAL_MOCK_MEETINGS];
  mockAttendees = [...INITIAL_MOCK_ATTENDEES];
  mockDecisions = [...INITIAL_MOCK_DECISIONS];
  mockActions = [...INITIAL_MOCK_ACTIONS];
  syncCorrespondenceState();
}
