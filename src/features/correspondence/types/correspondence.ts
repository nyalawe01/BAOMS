/**
 * BAOMS Phase 10: Correspondence & Meetings Domain Types
 * Babawatoto Organization Management System
 */

export type CorrespondenceDirection = 'incoming' | 'outgoing';

export type CorrespondenceCategory =
  | 'donor'
  | 'government'
  | 'legal'
  | 'partner'
  | 'community'
  | 'general';

export type CorrespondenceStatus =
  | 'received'
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'dispatched'
  | 'archived';

export type ConfidentialityLevel = 'public' | 'internal' | 'confidential';

export type MeetingType =
  | 'board'
  | 'management'
  | 'staff'
  | 'project'
  | 'donor'
  | 'committee';

export type MeetingStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'adjourned'
  | 'cancelled';

export type ActionStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'overdue'
  | 'cancelled';

export interface CorrespondenceRecord {
  id: string;
  referenceNumber: string;
  direction: CorrespondenceDirection;
  sender: string;
  recipient: string;
  subject: string;
  correspondenceDate: string;
  category: CorrespondenceCategory;
  projectId: string | null;
  projectName: string | null;
  documentId: string | null;
  documentTitle: string | null;
  documentNumber: string | null;
  status: CorrespondenceStatus;
  confidentialityLevel: ConfidentialityLevel;
  notes: string | null;
  registeredBy: string | null;
  registeredByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingRecord {
  id: string;
  meetingNumber: string;
  title: string;
  meetingType: MeetingType;
  meetingDate: string;
  location: string;
  chairpersonId: string | null;
  chairpersonName: string | null;
  secretaryId: string | null;
  secretaryName: string | null;
  minutesDocumentId: string | null;
  minutesDocumentTitle: string | null;
  status: MeetingStatus;
  confidentialityLevel: ConfidentialityLevel;
  attendeesCount: number;
  decisionsCount: number;
  actionsCount: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingAttendeeRecord {
  id: string;
  meetingId: string;
  userId: string | null;
  externalName: string | null;
  email: string | null;
  role: string;
  attended: boolean;
  displayName: string;
}

export interface MeetingDecisionRecord {
  id: string;
  meetingId: string;
  decisionNumber: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
}

export interface MeetingActionRecord {
  id: string;
  meetingId: string;
  meetingNumber?: string;
  meetingTitle?: string;
  decisionId: string | null;
  actionNumber: string;
  taskDescription: string;
  assignedTo: string | null;
  assignedToName: string;
  dueDate: string;
  status: ActionStatus;
  isOverdue: boolean;
  completionNotes: string | null;
  completedAt: string | null;
  completedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCorrespondencePayload {
  direction: CorrespondenceDirection;
  sender: string;
  recipient: string;
  subject: string;
  correspondenceDate: string;
  category: CorrespondenceCategory;
  projectId?: string | null;
  documentId?: string | null;
  confidentialityLevel?: ConfidentialityLevel;
  notes?: string | null;
}

export interface CreateMeetingPayload {
  title: string;
  meetingType: MeetingType;
  meetingDate: string;
  location: string;
  chairpersonId?: string | null;
  secretaryId?: string | null;
  minutesDocumentId?: string | null;
  confidentialityLevel?: ConfidentialityLevel;
  attendees?: Array<{
    userId?: string | null;
    externalName?: string | null;
    email?: string | null;
    role?: string;
    attended?: boolean;
  }>;
}

export interface CreateMeetingDecisionPayload {
  meetingId: string;
  title: string;
  description: string;
  category?: string;
}

export interface CreateMeetingActionPayload {
  meetingId: string;
  decisionId?: string | null;
  taskDescription: string;
  assignedTo?: string | null;
  assignedToName?: string;
  dueDate: string;
}

export interface UpdateMeetingActionPayload {
  actionId: string;
  status: ActionStatus;
  completionNotes?: string | null;
}
