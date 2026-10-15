/**
 * BAOMS Phase 9: Human Resources Domain Types
 * Babawatoto Organization Management System
 */

export type EmploymentStatus = 'active' | 'probation' | 'on_leave' | 'suspended' | 'terminated';

export type ContractType = 'permanent' | 'fixed_term' | 'consultant' | 'volunteer' | 'intern';

export type StaffDocumentType =
  | 'contract'
  | 'id_copy'
  | 'cv'
  | 'certificate'
  | 'job_description'
  | 'performance_review'
  | 'other';

export type LeaveRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

export type ChecklistType = 'onboarding' | 'offboarding';

export type LoanBoardStatus = 'not_applicable' | 'deducting' | 'cleared';

export type OnboardingStatus = 'pending_hr' | 'pending_finance' | 'completed';

export interface StaffCertification {
  id: string;
  name: string;
  institution: string;
  year: number;
  documentUrl?: string;
  verified?: boolean;
}

export interface StaffProfileRecord {
  id: string;
  userId: string | null;
  staffNumber: string;
  fullName: string;
  email: string | null; // Personal email
  personalEmail?: string | null;
  officialEmail?: string | null; // Official office email (@babawatoto.org)
  phoneNumber: string | null;
  jobTitle: string;
  departmentId: string | null;
  departmentName: string;
  departmentCode: string;
  employmentStatus: EmploymentStatus;
  contractType: ContractType;
  startDate: string;
  endDate: string | null;
  supervisorId: string | null;
  supervisorName: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  notes: string | null;
  daysToContractExpiry: number | null;
  isExpiringSoon: boolean;
  createdAt: string;
  updatedAt: string;

  // HR Dossier additions
  dateOfBirth?: string | null;
  nidaNumber?: string | null;
  tinNumber?: string | null;
  loanBoardStatus?: LoanBoardStatus | null;
  loanBoardDetails?: string | null;
  basicSalary?: number | null;
  grossSalary?: number | null;
  cvName?: string | null;
  cvUrl?: string | null;
  certifications?: StaffCertification[];

  // Finance & Statutory additions
  cwtNumber?: string | null;
  nssfNumber?: string | null;
  pssfNumber?: string | null;
  nhifNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankBranch?: string | null;

  // Onboarding workflow lifecycle
  onboardingStatus?: OnboardingStatus;
  onboardingStep?: number; // 1: User access granted, 2: HR pending, 3: Finance pending, 4: Fully onboarded
}

export interface StaffDocumentRecord {
  id: string;
  staffId: string;
  documentId: string;
  documentTitle: string;
  documentNumber: string;
  documentType: StaffDocumentType;
  notes: string | null;
  verifiedBy: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface LeaveTypeRecord {
  id: string;
  code: string;
  nameEn: string;
  nameSw: string;
  descriptionEn: string | null;
  descriptionSw: string | null;
  daysAllowedPerYear: number;
  requiresAttachment: boolean;
  isActive: boolean;
}

export interface LeaveBalanceRecord {
  id: string;
  staffId: string;
  leaveTypeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface LeaveRequestRecord {
  id: string;
  requestNumber: string;
  staffId: string;
  staffName: string;
  staffNumber: string;
  staffDepartment: string;
  leaveTypeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  handoverStaffId: string | null;
  handoverStaffName: string | null;
  status: LeaveRequestStatus;
  decisionBy: string | null;
  decisionByName: string | null;
  decisionAt: string | null;
  decisionNotes: string | null;
  attachmentDocId: string | null;
  attachmentDocTitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffChecklistRecord {
  id: string;
  staffId: string;
  checklistType: ChecklistType;
  itemKey: string;
  titleEn: string;
  titleSw: string;
  isCompleted: boolean;
  completedAt: string | null;
  completedBy: string | null;
  completedByName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateStaffProfilePayload {
  staffNumber?: string;
  fullName: string;
  email?: string | null;
  personalEmail?: string | null;
  officialEmail?: string | null;
  phoneNumber?: string | null;
  jobTitle: string;
  departmentId?: string | null;
  employmentStatus: EmploymentStatus;
  contractType: ContractType;
  startDate: string;
  endDate?: string | null;
  supervisorId?: string | null;
  userId?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
  dateOfBirth?: string | null;
  nidaNumber?: string | null;
  tinNumber?: string | null;
  loanBoardStatus?: LoanBoardStatus | null;
  loanBoardDetails?: string | null;
  basicSalary?: number | null;
  grossSalary?: number | null;
  cwtNumber?: string | null;
  nssfNumber?: string | null;
  pssfNumber?: string | null;
  nhifNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankBranch?: string | null;
  cvName?: string | null;
  cvUrl?: string | null;
  certifications?: StaffCertification[];
  onboardingStatus?: OnboardingStatus;
  onboardingStep?: number;
}

export interface UpdateStaffProfilePayload {
  fullName?: string;
  email?: string | null;
  personalEmail?: string | null;
  officialEmail?: string | null;
  phoneNumber?: string | null;
  jobTitle?: string;
  departmentId?: string | null;
  employmentStatus?: EmploymentStatus;
  contractType?: ContractType;
  startDate?: string;
  endDate?: string | null;
  supervisorId?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
}

export interface UpdateHrDossierPayload {
  dateOfBirth?: string | null;
  nidaNumber?: string | null;
  tinNumber?: string | null;
  loanBoardStatus?: LoanBoardStatus | null;
  loanBoardDetails?: string | null;
  basicSalary?: number | null;
  grossSalary?: number | null;
  cvName?: string | null;
  cvUrl?: string | null;
  certifications?: StaffCertification[];
}

export interface UpdateStatutoryPayload {
  cwtNumber?: string | null;
  nssfNumber?: string | null;
  pssfNumber?: string | null;
  nhifNumber?: string | null;
  loanBoardStatus?: LoanBoardStatus | null;
  loanBoardDetails?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankBranch?: string | null;
}

export interface CreateLeaveRequestPayload {
  staffId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status?: 'draft' | 'pending';
  handoverStaffId?: string | null;
  attachmentDocId?: string | null;
}

export interface ReviewLeaveRequestPayload {
  requestId: string;
  decision: 'approved' | 'rejected';
  decisionNotes?: string;
}
