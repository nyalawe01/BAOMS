/**
 * BAOMS Project Management Domain Types
 * Babawatoto Organization Management System
 */

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectRole = 'manager' | 'coordinator' | 'officer' | 'viewer';
export type ActivitySubmissionStatus = 'draft' | 'submitted' | 'approved' | 'returned_for_correction';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type ProjectReportType = 'monthly' | 'quarterly' | 'annual' | 'donor' | 'milestone';
export type ProjectReportStatus = 'draft' | 'submitted' | 'approved';

// Decoupled Multi-Workflow Lifecycle Statuses
export type ActivityRequestStatus =
  | 'not_submitted'
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'returned'
  | 'approved'
  | 'rejected';

export type ProcurementStatus =
  | 'not_required'
  | 'not_started'
  | 'requisition'
  | 'quotations'
  | 'order_approved'
  | 'ordered'
  | 'partially_delivered'
  | 'delivered';

export type ImplementationStatus =
  | 'planned'
  | 'ready'
  | 'in_progress'
  | 'conducted_pending_verification'
  | 'verified';

export type MeStatus =
  | 'draft'
  | 'submitted'
  | 'pending_review'
  | 'verified'
  | 'returned_for_correction';

export type RetirementStatus =
  | 'not_started'
  | 'draft'
  | 'submitted'
  | 'finance_review'
  | 'returned'
  | 'approved'
  | 'closed';

export interface ProjectOutcomeRecord {
  id: string;
  projectId: string;
  outcomeCode: string;
  title: string;
  description: string | null;
  targetIndicator?: string | null;
  sortOrder: number;
  outputs?: ProjectOutputRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectOutputRecord {
  id: string;
  outcomeId: string;
  projectId: string;
  outputCode: string;
  title: string;
  description: string | null;
  targetQuantity: number;
  targetUnit: string;
  sortOrder: number;
  activities?: ActivityRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityParticipantRecord {
  id: string;
  activityId: string;
  projectId: string;
  fullName: string;
  gender?: 'male' | 'female' | 'other';
  ageGroup?: 'children_0_12' | 'youth_13_24' | 'adults_25_59' | 'elderly_60_plus' | 'unknown';
  phoneNumber?: string | null;
  disabilityStatus?: string;
  ward?: string | null;
  attendanceConfirmed: boolean;
  perDiemReceived: number;
  verifiedByMe: boolean;
  createdAt: string;
}

export interface ProjectBudgetRecord {
  id: string;
  projectId: string;
  currency: string;
  totalAllocated: number;
  totalSpent: number;
  totalCommitted: number;
  balance: number;
  burnRatePercent: number;
  lastReviewedAt: string;
  lastReviewedBy: string | null;
}

export interface ProjectMemberRecord {
  id: string;
  projectId: string;
  projectName?: string;
  projectCode?: string;
  userId: string;
  userName: string;
  userEmail: string;
  projectRole: ProjectRole;
  assignedAt: string;
  assignedBy: string | null;
}

export interface ActivityDocumentRecord {
  id: string;
  activityId: string;
  documentId: string;
  documentTitle: string;
  documentReference: string;
  fileType?: string;
  fileSize?: number;
  storagePath?: string;
  attachedAt: string;
  attachedBy: string | null;
}

export interface ParticipantQuote {
  quote: string;
  speaker: string;
  affiliation?: string;
}

export interface ActivityDemographicBreakdown {
  male?: number;
  female?: number;
  youth?: number;
  adults?: number;
  specialNeeds?: number;
  [key: string]: number | undefined;
}

export interface ActivityRecord {
  id: string;
  projectId: string;
  projectName?: string;
  projectCode?: string;
  title: string;
  description: string | null;
  activityDate: string;
  location: string | null;
  participantsCount: number;
  progress: string;
  challenges: string | null;
  operationalChallenges?: string | null;
  followUpActions: string | null;
  recommendations?: string | null;
  submissionStatus: ActivitySubmissionStatus;
  submittedBy: string;
  submittedByName?: string;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedByName?: string;
  reviewedAt: string | null;
  reviewComments: string | null;
  createdAt: string;
  updatedAt: string;
  evidenceDocuments?: ActivityDocumentRecord[];
  // Deep analytical narrative fields
  backgroundContext?: string | null;
  methodology?: string | null;
  sessionNarrative?: string | null;
  keyFindings?: string[] | null;
  qualitativeFindings?: string | null;
  participantQuotes?: ParticipantQuote[] | null;
  demographicBreakdown?: ActivityDemographicBreakdown;
  budgetAllocated?: number | null;
  budgetSpent?: number | null;
  beneficiarySatisfactionScore?: number | null;
  // End-to-End Activity Lifecycle & Results Framework Fields
  activityCode?: string;
  outcomeId?: string | null;
  outcomeTitle?: string | null;
  outputId?: string | null;
  outputTitle?: string | null;
  targetParticipants?: number;
  budgetEstimated?: number;
  wardLocation?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  requestStatus?: ActivityRequestStatus;
  procurementStatus?: ProcurementStatus;
  implementationStatus?: ImplementationStatus;
  meStatus?: MeStatus;
  retirementStatus?: RetirementStatus;
  // Pre-implementation Request & Authorization
  requestTitle?: string | null;
  requestDescription?: string | null;
  requestedDate?: string | null;
  torDocumentId?: string | null;
  authorizedBy?: string | null;
  authorizedByName?: string | null;
  authorizedAt?: string | null;
  authorizationComments?: string | null;
  // Financial Retirement Details
  retiredAmount?: number;
  retirementVariance?: number;
  retirementReceiptsCount?: number;
  retiredBy?: string | null;
  retiredByName?: string | null;
  retiredAt?: string | null;
  retirementApprovedBy?: string | null;
  retirementApprovedByName?: string | null;
  retirementApprovedAt?: string | null;
}

export interface TaskRecord {
  id: string;
  projectId: string;
  projectName?: string;
  projectCode?: string;
  activityId: string | null;
  activityTitle?: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  assignedToName?: string;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt: string | null;
  completedBy: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectReportRecord {
  id: string;
  projectId: string;
  projectName?: string;
  projectCode?: string;
  reportType: ProjectReportType;
  title: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  recommendations: string | null;
  status: ProjectReportStatus;
  submittedBy: string;
  submittedByName?: string;
  submittedAt: string | null;
  documentId: string | null;
  documentTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRecord {
  id: string;
  projectCode: string;
  name: string;
  description: string | null;
  funder: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  currency: string;
  totalBudget: number;
  departmentId: string | null;
  departmentName?: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  members: ProjectMemberRecord[];
  budgetSummary?: ProjectBudgetRecord;
  activityCount: number;
  taskCount: number;
  completedTaskCount: number;
}

export interface ProjectFilterParams {
  searchQuery?: string;
  status?: ProjectStatus | 'all';
  funder?: string;
  departmentId?: string;
  assignedUserId?: string;
}

export interface CreateProjectInput {
  projectCode: string;
  name: string;
  description?: string;
  funder: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  currency?: string;
  departmentId?: string;
  managerId: string;
  coordinatorId?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  funder?: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
  totalBudget?: number;
}

export interface CreateActivityInput {
  projectId: string;
  title: string;
  description?: string;
  activityDate: string;
  location?: string;
  participantsCount?: number;
  progress?: string;
  challenges?: string;
  operationalChallenges?: string;
  followUpActions?: string;
  recommendations?: string;
  submitImmediately?: boolean;
  backgroundContext?: string;
  methodology?: string;
  sessionNarrative?: string;
  keyFindings?: string[];
  qualitativeFindings?: string;
  participantQuotes?: ParticipantQuote[];
  demographicBreakdown?: ActivityDemographicBreakdown;
  budgetAllocated?: number;
  budgetSpent?: number;
  beneficiarySatisfactionScore?: number;
  evidenceFiles?: Array<{
    title: string;
    file: File;
  }>;
}

export interface ReviewActivityInput {
  activityId: string;
  decision: 'approve' | 'return_for_correction';
  comments: string;
}

export interface CreateTaskInput {
  projectId: string;
  activityId?: string;
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  priority: TaskPriority;
}

export interface UpdateTaskInput {
  taskId: string;
  title?: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface AssignMemberInput {
  projectId: string;
  userId: string;
  projectRole: ProjectRole;
}
