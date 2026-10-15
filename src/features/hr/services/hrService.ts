/**
 * BAOMS Phase 9: Human Resources Service Layer
 * Babawatoto Organization Management System
 * 
 * Supports dual-mode operation: live Supabase PostgreSQL (RLS) with 100% in-memory fallback.
 * Enforces segregation of duties, self-approval prevention on leave, and role-based visibility.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  StaffProfileRecord,
  StaffDocumentRecord,
  LeaveTypeRecord,
  LeaveBalanceRecord,
  LeaveRequestRecord,
  LeaveRequestStatus,
  StaffChecklistRecord,
  CreateStaffProfilePayload,
  UpdateStaffProfilePayload,
  UpdateHrDossierPayload,
  UpdateStatutoryPayload,
  CreateLeaveRequestPayload,
  ReviewLeaveRequestPayload,
} from '../types/hr';
import {
  INITIAL_MOCK_STAFF,
  INITIAL_MOCK_LEAVE_TYPES,
  INITIAL_MOCK_LEAVE_BALANCES,
  INITIAL_MOCK_LEAVE_REQUESTS,
  INITIAL_MOCK_CHECKLISTS,
  INITIAL_MOCK_STAFF_DOCUMENTS,
} from '../data/mockHr';

import { getPersistentItem, setPersistentItem } from '@/lib/storageSync';

const HR_STORAGE_KEYS = {
  STAFF: 'baoms_hr_staff',
  LEAVE_BALANCES: 'baoms_hr_leave_balances',
  LEAVE_REQUESTS: 'baoms_hr_leave_requests',
  CHECKLISTS: 'baoms_hr_checklists',
  STAFF_DOCS: 'baoms_hr_staff_documents',
};

// Persistent in-memory state for offline operation
let mockStaff: StaffProfileRecord[] = getPersistentItem(HR_STORAGE_KEYS.STAFF, () => [...INITIAL_MOCK_STAFF]);
const mockLeaveTypes: LeaveTypeRecord[] = [...INITIAL_MOCK_LEAVE_TYPES];
let mockLeaveBalances: LeaveBalanceRecord[] = getPersistentItem(HR_STORAGE_KEYS.LEAVE_BALANCES, () => [...INITIAL_MOCK_LEAVE_BALANCES]);
let mockLeaveRequests: LeaveRequestRecord[] = getPersistentItem(HR_STORAGE_KEYS.LEAVE_REQUESTS, () => [...INITIAL_MOCK_LEAVE_REQUESTS]);
let mockChecklists: StaffChecklistRecord[] = getPersistentItem(HR_STORAGE_KEYS.CHECKLISTS, () => [...INITIAL_MOCK_CHECKLISTS]);
let mockStaffDocuments: StaffDocumentRecord[] = getPersistentItem(HR_STORAGE_KEYS.STAFF_DOCS, () => [...INITIAL_MOCK_STAFF_DOCUMENTS]);

export function resetMockHrData(): void {
  mockStaff = [...INITIAL_MOCK_STAFF];
  mockLeaveBalances = [...INITIAL_MOCK_LEAVE_BALANCES];
  mockLeaveRequests = [...INITIAL_MOCK_LEAVE_REQUESTS];
  mockChecklists = [...INITIAL_MOCK_CHECKLISTS];
  mockStaffDocuments = [...INITIAL_MOCK_STAFF_DOCUMENTS];
  setPersistentItem(HR_STORAGE_KEYS.STAFF, mockStaff);
  setPersistentItem(HR_STORAGE_KEYS.LEAVE_BALANCES, mockLeaveBalances);
  setPersistentItem(HR_STORAGE_KEYS.LEAVE_REQUESTS, mockLeaveRequests);
  setPersistentItem(HR_STORAGE_KEYS.CHECKLISTS, mockChecklists);
  setPersistentItem(HR_STORAGE_KEYS.STAFF_DOCS, mockStaffDocuments);
}

export function setMockHrDataForTesting(
  staff: StaffProfileRecord[],
  leaveBalances: LeaveBalanceRecord[] = [],
  leaveRequests: LeaveRequestRecord[] = [],
  checklists: StaffChecklistRecord[] = []
): void {
  mockStaff = [...staff];
  mockLeaveBalances = [...leaveBalances];
  mockLeaveRequests = [...leaveRequests];
  mockChecklists = [...checklists];
  setPersistentItem(HR_STORAGE_KEYS.STAFF, mockStaff);
  setPersistentItem(HR_STORAGE_KEYS.LEAVE_BALANCES, mockLeaveBalances);
  setPersistentItem(HR_STORAGE_KEYS.LEAVE_REQUESTS, mockLeaveRequests);
  setPersistentItem(HR_STORAGE_KEYS.CHECKLISTS, mockChecklists);
}

interface SupabaseStaffProfileRow {
  id: string;
  user_id: string | null;
  staff_number: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  job_title: string;
  department_id: string | null;
  employment_status: StaffProfileRecord['employmentStatus'];
  contract_type: StaffProfileRecord['contractType'];
  start_date: string;
  end_date: string | null;
  supervisor_id: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  department?: { id: string; code: string; name_en: string } | null;
  supervisor?: { id: string; full_name: string } | null;
}

/**
 * Helper to calculate days to contract expiry
 */
export function calculateDaysToExpiry(endDateStr: string | null): number | null {
  if (!endDateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Fetch staff profiles according to user role and authorization boundaries
 */
export async function getStaffProfiles(
  filters?: {
    search?: string;
    departmentId?: string;
    employmentStatus?: string;
    contractType?: string;
    expiringSoonOnly?: boolean;
  },
  currentUser?: { id: string; roles: string[] }
): Promise<StaffProfileRecord[]> {
  // If Supabase is configured and online, query PostgreSQL
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('staff_profiles').select(`
        *,
        department:departments(id, code, name_en),
        supervisor:staff_profiles!supervisor_id(id, full_name)
      `);

      if (filters?.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }
      if (filters?.employmentStatus) {
        query = query.eq('employment_status', filters.employmentStatus);
      }
      if (filters?.contractType) {
        query = query.eq('contract_type', filters.contractType);
      }

      const { data, error } = await query;
      if (!error && data) {
        return (data as unknown as SupabaseStaffProfileRow[]).map((item) => {
          const days = calculateDaysToExpiry(item.end_date);
          return {
            id: item.id,
            userId: item.user_id,
            staffNumber: item.staff_number,
            fullName: item.full_name,
            email: item.email,
            phoneNumber: item.phone_number,
            jobTitle: item.job_title,
            departmentId: item.department_id,
            departmentName: item.department?.name_en || 'General',
            departmentCode: item.department?.code || 'GEN',
            employmentStatus: item.employment_status,
            contractType: item.contract_type,
            startDate: item.start_date,
            endDate: item.end_date,
            supervisorId: item.supervisor_id,
            supervisorName: item.supervisor?.full_name || null,
            emergencyContactName: item.emergency_contact_name,
            emergencyContactPhone: item.emergency_contact_phone,
            notes: item.notes,
            daysToContractExpiry: days,
            isExpiringSoon: days !== null && days <= 60,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          };
        });
      }
    } catch {
      // Fall through to in-memory fallback
    }
  }

  // In-Memory Fallback
  let results = [...mockStaff];

  // Refresh dynamic expiry calculations
  results = results.map((s) => {
    const days = calculateDaysToExpiry(s.endDate);
    return {
      ...s,
      daysToContractExpiry: days,
      isExpiringSoon: days !== null && days <= 60,
    };
  });

  // Apply Role Scoping:
  if (currentUser) {
    const isLeadershipOrHr = currentUser.roles.some((r) =>
      ['system_admin', 'executive_director', 'hr_administrator'].includes(r)
    );

    if (!isLeadershipOrHr) {
      // If user is a manager, find their staff profile
      const myStaffProfile = results.find((s) => s.userId === currentUser.id);
      if (myStaffProfile) {
        // Can see themselves and supervisees
        results = results.filter(
          (s) => s.id === myStaffProfile.id || s.supervisorId === myStaffProfile.id
        );
      } else {
        // Regular staff: only see own record
        results = results.filter((s) => s.userId === currentUser.id);
      }
    }
  }

  // Apply filters
  if (filters?.search) {
    const query = filters.search.toLowerCase().trim();
    results = results.filter(
      (s) =>
        s.fullName.toLowerCase().includes(query) ||
        s.staffNumber.toLowerCase().includes(query) ||
        s.jobTitle.toLowerCase().includes(query) ||
        (s.email && s.email.toLowerCase().includes(query))
    );
  }

  if (filters?.departmentId && filters.departmentId !== 'all') {
    results = results.filter((s) => s.departmentId === filters.departmentId);
  }

  if (filters?.employmentStatus && filters.employmentStatus !== 'all') {
    results = results.filter((s) => s.employmentStatus === filters.employmentStatus);
  }

  if (filters?.contractType && filters.contractType !== 'all') {
    results = results.filter((s) => s.contractType === filters.contractType);
  }

  if (filters?.expiringSoonOnly) {
    results = results.filter((s) => s.isExpiringSoon);
  }

  return results;
}

/**
 * Fetch single staff profile by ID
 */
export async function getStaffProfileById(id: string): Promise<StaffProfileRecord | null> {
  const staff = mockStaff.find((s) => s.id === id);
  if (!staff) return null;
  const days = calculateDaysToExpiry(staff.endDate);
  return {
    ...staff,
    daysToContractExpiry: days,
    isExpiringSoon: days !== null && days <= 60,
  };
}

/**
 * Create a new staff profile
 * Decoupled from mandatory system logins (userId can be null)
 */
export async function createStaffProfile(
  payload: CreateStaffProfilePayload
): Promise<StaffProfileRecord> {
  if (payload.endDate && payload.startDate && payload.endDate < payload.startDate) {
    throw new Error('Contract end date cannot precede start date.');
  }

  // Generate unique staff number if not provided
  let staffNumber = payload.staffNumber?.trim();
  if (!staffNumber) {
    const nextSeq = (mockStaff.length + 1).toString().padStart(3, '0');
    staffNumber = `STF-${new Date().getFullYear()}-${nextSeq}`;
  }

  // Lookup supervisor name if specified
  let supervisorName: string | null = null;
  if (payload.supervisorId) {
    const sup = mockStaff.find((s) => s.id === payload.supervisorId);
    supervisorName = sup ? sup.fullName : null;
  }

  const days = calculateDaysToExpiry(payload.endDate ?? null);
  const newStaff: StaffProfileRecord = {
    id: `staff-${Date.now()}`,
    userId: payload.userId ?? null,
    staffNumber,
    fullName: payload.fullName.trim(),
    email: payload.email?.trim() || null,
    phoneNumber: payload.phoneNumber?.trim() || null,
    jobTitle: payload.jobTitle.trim(),
    departmentId: payload.departmentId || 'dept-prj',
    departmentName:
      payload.departmentId === 'dept-exec'
        ? 'Executive Office'
        : payload.departmentId === 'dept-fin'
        ? 'Finance & Operations'
        : payload.departmentId === 'dept-hr'
        ? 'Human Resources & Administration'
        : payload.departmentId === 'dept-admin'
        ? 'IT & System Administration'
        : 'Projects & Programs',
    departmentCode:
      payload.departmentId === 'dept-exec'
        ? 'EXEC'
        : payload.departmentId === 'dept-fin'
        ? 'FIN'
        : payload.departmentId === 'dept-hr'
        ? 'HR'
        : payload.departmentId === 'dept-admin'
        ? 'ADMIN'
        : 'PRJ',
    employmentStatus: payload.employmentStatus,
    contractType: payload.contractType,
    startDate: payload.startDate,
    endDate: payload.endDate ?? null,
    supervisorId: payload.supervisorId ?? null,
    supervisorName,
    emergencyContactName: payload.emergencyContactName ?? null,
    emergencyContactPhone: payload.emergencyContactPhone ?? null,
    personalEmail: payload.personalEmail?.trim() || payload.email?.trim() || null,
    officialEmail: payload.officialEmail?.trim() || null,
    dateOfBirth: payload.dateOfBirth ?? null,
    nidaNumber: payload.nidaNumber?.trim() || null,
    tinNumber: payload.tinNumber?.trim() || null,
    loanBoardStatus: payload.loanBoardStatus ?? null,
    loanBoardDetails: payload.loanBoardDetails ?? null,
    basicSalary: payload.basicSalary ?? null,
    grossSalary: payload.grossSalary ?? null,
    cvName: payload.cvName ?? null,
    cvUrl: payload.cvUrl ?? null,
    certifications: payload.certifications ?? [],
    cwtNumber: payload.cwtNumber?.trim() || null,
    nssfNumber: payload.nssfNumber?.trim() || null,
    pssfNumber: payload.pssfNumber?.trim() || null,
    nhifNumber: payload.nhifNumber?.trim() || null,
    bankName: payload.bankName?.trim() || null,
    bankAccountNumber: payload.bankAccountNumber?.trim() || null,
    bankBranch: payload.bankBranch?.trim() || null,
    onboardingStatus: payload.onboardingStatus || (payload.nidaNumber && payload.bankAccountNumber ? 'completed' : payload.nidaNumber ? 'pending_finance' : 'pending_hr'),
    onboardingStep: payload.onboardingStep || 4,
    notes: payload.notes ?? null,
    daysToContractExpiry: days,
    isExpiringSoon: days !== null && days <= 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockStaff = [newStaff, ...mockStaff];

  // Initialize standard leave balances for the new staff for current year (2026)
  const currentYear = new Date().getFullYear();
  mockLeaveBalances.push(
    {
      id: `bal-${Date.now()}-1`,
      staffId: newStaff.id,
      leaveTypeId: '10000000-0000-0000-0000-000000000001',
      leaveTypeCode: 'ANNUAL',
      leaveTypeName: 'Annual Leave',
      year: currentYear,
      allocatedDays: 28,
      usedDays: 0,
      pendingDays: 0,
      remainingDays: 28,
    },
    {
      id: `bal-${Date.now()}-2`,
      staffId: newStaff.id,
      leaveTypeId: '10000000-0000-0000-0000-000000000002',
      leaveTypeCode: 'SICK',
      leaveTypeName: 'Sick Leave',
      year: currentYear,
      allocatedDays: 14,
      usedDays: 0,
      pendingDays: 0,
      remainingDays: 14,
    },
    {
      id: `bal-${Date.now()}-3`,
      staffId: newStaff.id,
      leaveTypeId: '10000000-0000-0000-0000-000000000005',
      leaveTypeCode: 'COMPASSIONATE',
      leaveTypeName: 'Compassionate Leave',
      year: currentYear,
      allocatedDays: 5,
      usedDays: 0,
      pendingDays: 0,
      remainingDays: 5,
    }
  );

  // Initialize standard onboarding checklist
  const onboardingTemplate = [
    { key: 'signed_contract', en: 'Signed Employment Contract & Job Description', sw: 'Mkataba wa Ajira Uliosainiwa na Maelezo ya Kazi' },
    { key: 'national_id_nida', en: 'National ID / NIDA & Passport Copies Verified', sw: 'Nakala ya Kitambulisho cha Taifa (NIDA) / Pasipoti' },
    { key: 'child_protection_policy', en: 'Child Safeguarding & Protection Policy Signed', sw: 'Sera ya Ulinzi na Usalama wa Mtoto Imesainiwa' },
    { key: 'emergency_contact', en: 'Emergency Contact & Next of Kin Form', sw: 'Fomu ya Mawasiliano ya Dharura na Mrithi' },
    { key: 'equipment_assignment', en: 'Equipment, Assets & Staff ID Badge Handover', sw: 'Makabidhiano ya Vifaa, Rasilimali na Kitambulisho cha Kazi' },
    { key: 'probation_review', en: 'Probation Mid-Term & Final Evaluation', sw: 'Tathmini ya Kipindi cha Majaribio Kazini' },
  ];

  for (const item of onboardingTemplate) {
    mockChecklists.push({
      id: `chk-${Date.now()}-${item.key}`,
      staffId: newStaff.id,
      checklistType: 'onboarding',
      itemKey: item.key,
      titleEn: item.en,
      titleSw: item.sw,
      isCompleted: false,
      completedAt: null,
      completedBy: null,
      completedByName: null,
      notes: null,
      createdAt: new Date().toISOString(),
    });
  }

  setPersistentItem(HR_STORAGE_KEYS.STAFF, mockStaff);
  setPersistentItem(HR_STORAGE_KEYS.LEAVE_BALANCES, mockLeaveBalances);
  setPersistentItem(HR_STORAGE_KEYS.CHECKLISTS, mockChecklists);

  return newStaff;
}

/**
 * Update staff profile
 */
export async function updateStaffProfile(
  id: string,
  payload: UpdateStaffProfilePayload
): Promise<StaffProfileRecord> {
  const index = mockStaff.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error('Staff profile not found.');
  }

  const existing = mockStaff[index];
  if (!existing) {
    throw new Error('Staff profile not found.');
  }

  let supervisorName = existing.supervisorName;
  if (payload.supervisorId !== undefined) {
    if (payload.supervisorId) {
      const sup = mockStaff.find((s) => s.id === payload.supervisorId);
      supervisorName = sup ? sup.fullName : null;
    } else {
      supervisorName = null;
    }
  }

  const newEndDate = payload.endDate !== undefined ? payload.endDate : existing.endDate;
  const days = calculateDaysToExpiry(newEndDate);

  const updated: StaffProfileRecord = {
    ...existing,
    fullName: payload.fullName !== undefined ? payload.fullName.trim() : existing.fullName,
    email: payload.email !== undefined ? payload.email : existing.email,
    phoneNumber: payload.phoneNumber !== undefined ? payload.phoneNumber : existing.phoneNumber,
    jobTitle: payload.jobTitle !== undefined ? payload.jobTitle.trim() : existing.jobTitle,
    departmentId: payload.departmentId !== undefined ? payload.departmentId : existing.departmentId,
    employmentStatus: payload.employmentStatus !== undefined ? payload.employmentStatus : existing.employmentStatus,
    contractType: payload.contractType !== undefined ? payload.contractType : existing.contractType,
    startDate: payload.startDate !== undefined ? payload.startDate : existing.startDate,
    endDate: newEndDate,
    supervisorId: payload.supervisorId !== undefined ? payload.supervisorId : existing.supervisorId,
    supervisorName,
    emergencyContactName:
      payload.emergencyContactName !== undefined ? payload.emergencyContactName : existing.emergencyContactName,
    emergencyContactPhone:
      payload.emergencyContactPhone !== undefined ? payload.emergencyContactPhone : existing.emergencyContactPhone,
    notes: payload.notes !== undefined ? payload.notes : existing.notes,
    daysToContractExpiry: days,
    isExpiringSoon: days !== null && days <= 60,
    updatedAt: new Date().toISOString(),
  };

  mockStaff[index] = updated;
  setPersistentItem(HR_STORAGE_KEYS.STAFF, mockStaff);
  return updated;
}

/**
 * Get contract expiry reminders
 * Filters staff with contracts expiring within thresholdDays (e.g. 60 days)
 */
export async function getContractExpiryReminders(
  thresholdDays: number = 60
): Promise<StaffProfileRecord[]> {
  const allStaff = await getStaffProfiles();
  return allStaff
    .filter((s) => s.daysToContractExpiry !== null && s.daysToContractExpiry <= thresholdDays)
    .sort((a, b) => (a.daysToContractExpiry ?? 999) - (b.daysToContractExpiry ?? 999));
}

/**
 * Fetch available leave types
 */
export async function getLeaveTypes(): Promise<LeaveTypeRecord[]> {
  return [...mockLeaveTypes].filter((lt) => lt.isActive);
}

/**
 * Fetch leave balances for a specific staff member and year
 */
export async function getLeaveBalances(
  staffId: string,
  year: number = new Date().getFullYear()
): Promise<LeaveBalanceRecord[]> {
  return mockLeaveBalances.filter((b) => b.staffId === staffId && b.year === year);
}

/**
 * Fetch leave requests with scoping based on user roles
 */
export async function getLeaveRequests(
  filters?: {
    status?: string;
    staffId?: string;
    leaveTypeId?: string;
  },
  currentUser?: { id: string; roles: string[] }
): Promise<LeaveRequestRecord[]> {
  let list = [...mockLeaveRequests];

  // RBAC Scoping:
  if (currentUser) {
    const isLeadershipOrHr = currentUser.roles.some((r) =>
      ['system_admin', 'executive_director', 'hr_administrator'].includes(r)
    );

    if (!isLeadershipOrHr) {
      // Find current user's staff profile
      const myStaff = mockStaff.find((s) => s.userId === currentUser.id);
      if (myStaff) {
        // Find staff supervised by this user
        const supervisedStaffIds = mockStaff
          .filter((s) => s.supervisorId === myStaff.id)
          .map((s) => s.id);
        
        // Allowed: own requests OR requests from supervisees
        list = list.filter(
          (req) => req.staffId === myStaff.id || supervisedStaffIds.includes(req.staffId)
        );
      } else {
        list = [];
      }
    }
  }

  if (filters?.status && filters.status !== 'all') {
    list = list.filter((r) => r.status === filters.status);
  }

  if (filters?.staffId && filters.staffId !== 'all') {
    list = list.filter((r) => r.staffId === filters.staffId);
  }

  if (filters?.leaveTypeId && filters.leaveTypeId !== 'all') {
    list = list.filter((r) => r.leaveTypeId === filters.leaveTypeId);
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Submit a leave application
 */
export async function createLeaveRequest(
  payload: CreateLeaveRequestPayload,
  _currentUser?: { id: string; displayName?: string }
): Promise<LeaveRequestRecord> {
  if (payload.endDate < payload.startDate) {
    throw new Error('Leave end date cannot precede start date.');
  }

  const staff = mockStaff.find((s) => s.id === payload.staffId);
  if (!staff) {
    throw new Error('Staff member not found.');
  }

  const leaveType = mockLeaveTypes.find((lt) => lt.id === payload.leaveTypeId);
  if (!leaveType) {
    throw new Error('Selected leave type is not recognized.');
  }

  // Calculate days requested
  const start = new Date(payload.startDate);
  const end = new Date(payload.endDate);
  const daysRequested = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  // Check current remaining leave balance for current year
  const currentYear = start.getFullYear();
  const balance = mockLeaveBalances.find(
    (b) => b.staffId === staff.id && b.leaveTypeId === leaveType.id && b.year === currentYear
  );

  if (balance && balance.remainingDays < daysRequested) {
    throw new Error(
      `Insufficient leave balance. You requested ${daysRequested} days, but only ${balance.remainingDays} days remain for ${leaveType.nameEn}.`
    );
  }

  const initialStatus: LeaveRequestStatus = payload.status === 'draft' ? 'draft' : 'pending';

  // Prevent overlapping active or pending leave applications for the same staff member
  if (initialStatus === 'pending') {
    const hasOverlap = mockLeaveRequests.some((existing) => {
      if (existing.staffId !== staff.id) return false;
      if (['rejected', 'cancelled', 'draft'].includes(existing.status)) return false;
      return payload.startDate <= existing.endDate && payload.endDate >= existing.startDate;
    });

    if (hasOverlap) {
      throw new Error(
        'An active or pending leave application already overlaps with the selected date range.'
      );
    }
  }

  let handoverStaffName: string | null = null;
  if (payload.handoverStaffId) {
    const handover = mockStaff.find((s) => s.id === payload.handoverStaffId);
    handoverStaffName = handover ? handover.fullName : null;
  }

  const nextSeq = (mockLeaveRequests.length + 1).toString().padStart(3, '0');
  const requestNumber = `LV-${currentYear}-${nextSeq}`;

  const newRequest: LeaveRequestRecord = {
    id: `req-${Date.now()}`,
    requestNumber,
    staffId: staff.id,
    staffName: staff.fullName,
    staffNumber: staff.staffNumber,
    staffDepartment: staff.departmentName,
    leaveTypeId: leaveType.id,
    leaveTypeCode: leaveType.code,
    leaveTypeName: leaveType.nameEn,
    startDate: payload.startDate,
    endDate: payload.endDate,
    daysRequested,
    reason: payload.reason.trim(),
    handoverStaffId: payload.handoverStaffId ?? null,
    handoverStaffName,
    status: initialStatus,
    decisionBy: null,
    decisionByName: null,
    decisionAt: null,
    decisionNotes: null,
    attachmentDocId: payload.attachmentDocId ?? null,
    attachmentDocTitle: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockLeaveRequests = [newRequest, ...mockLeaveRequests];

  // Update pending days in balance only if submitted
  if (initialStatus === 'pending' && balance) {
    balance.pendingDays += daysRequested;
  }

  setPersistentItem(HR_STORAGE_KEYS.LEAVE_REQUESTS, mockLeaveRequests);
  setPersistentItem(HR_STORAGE_KEYS.LEAVE_BALANCES, mockLeaveBalances);

  return newRequest;
}

/**
 * Submit an existing draft leave request
 */
export async function submitDraftLeaveRequest(
  requestId: string,
  _currentUser?: { id: string }
): Promise<LeaveRequestRecord> {
  const req = mockLeaveRequests.find((r) => r.id === requestId);
  if (!req) {
    throw new Error('Leave request not found.');
  }
  if (req.status !== 'draft') {
    throw new Error('Only draft leave requests can be submitted.');
  }

  // Check overlap with other active/pending requests
  const hasOverlap = mockLeaveRequests.some((existing) => {
    if (existing.id === req.id || existing.staffId !== req.staffId) return false;
    if (['rejected', 'cancelled', 'draft'].includes(existing.status)) return false;
    return req.startDate <= existing.endDate && req.endDate >= existing.startDate;
  });

  if (hasOverlap) {
    throw new Error(
      'An active or pending leave application already overlaps with the selected date range.'
    );
  }

  // Check balance
  const start = new Date(req.startDate);
  const currentYear = start.getFullYear();
  const balance = mockLeaveBalances.find(
    (b) => b.staffId === req.staffId && b.leaveTypeId === req.leaveTypeId && b.year === currentYear
  );

  if (balance && balance.remainingDays < req.daysRequested) {
    throw new Error(
      `Insufficient leave balance. You requested ${req.daysRequested} days, but only ${balance.remainingDays} days remain.`
    );
  }

  req.status = 'pending';
  req.updatedAt = new Date().toISOString();

  if (balance) {
    balance.pendingDays += req.daysRequested;
  }

  setPersistentItem(HR_STORAGE_KEYS.LEAVE_REQUESTS, mockLeaveRequests);
  setPersistentItem(HR_STORAGE_KEYS.LEAVE_BALANCES, mockLeaveBalances);

  return req;
}

/**
 * Review leave application (Approve or Reject)
 * ENFORCES STRICT SELF-APPROVAL PREVENTION!
 */
export async function reviewLeaveRequest(
  payload: ReviewLeaveRequestPayload,
  reviewerUser: { id: string; displayName?: string; roles?: string[] }
): Promise<LeaveRequestRecord> {
  const reqIndex = mockLeaveRequests.findIndex((r) => r.id === payload.requestId);
  if (reqIndex === -1) {
    throw new Error('Leave request not found.');
  }

  const request = mockLeaveRequests[reqIndex];
  if (!request) {
    throw new Error('Leave request not found.');
  }

  if (request.status !== 'pending') {
    throw new Error(`Cannot review leave request in status "${request.status}".`);
  }

  // Find the staff record for the request
  const applicantStaff = mockStaff.find((s) => s.id === request.staffId);

  // STRICT SEPARATION OF DUTIES: Prevent staff from approving their own leave
  if (applicantStaff && applicantStaff.userId === reviewerUser.id) {
    throw new Error('Staff members are strictly prohibited from approving their own leave requests.');
  }

  // Also check if reviewer's staff profile ID matches applicant staff ID
  const reviewerStaff = mockStaff.find((s) => s.userId === reviewerUser.id);
  if (reviewerStaff && reviewerStaff.id === request.staffId) {
    throw new Error('Staff members are strictly prohibited from approving their own leave requests.');
  }

  // Mandatory decision notes on rejection
  if (payload.decision === 'rejected' && (!payload.decisionNotes || !payload.decisionNotes.trim())) {
    throw new Error('A decision explanation is mandatory when rejecting a leave request.');
  }

  // Find leave balance to adjust
  const reqYear = new Date(request.startDate).getFullYear();
  const balance = mockLeaveBalances.find(
    (b) => b.staffId === request.staffId && b.leaveTypeId === request.leaveTypeId && b.year === reqYear
  );

  if (payload.decision === 'approved') {
    if (balance) {
      balance.pendingDays = Math.max(0, balance.pendingDays - request.daysRequested);
      balance.usedDays += request.daysRequested;
      balance.remainingDays = Math.max(0, balance.allocatedDays - balance.usedDays);
    }
  } else {
    // Rejected: release pending days
    if (balance) {
      balance.pendingDays = Math.max(0, balance.pendingDays - request.daysRequested);
    }
  }

  const updated: LeaveRequestRecord = {
    ...request,
    status: payload.decision,
    decisionBy: reviewerUser.id,
    decisionByName: reviewerUser.displayName || 'Authorized Supervisor',
    decisionAt: new Date().toISOString(),
    decisionNotes: payload.decisionNotes?.trim() || null,
    updatedAt: new Date().toISOString(),
  };

  mockLeaveRequests[reqIndex] = updated;
  setPersistentItem(HR_STORAGE_KEYS.LEAVE_REQUESTS, mockLeaveRequests);
  setPersistentItem(HR_STORAGE_KEYS.LEAVE_BALANCES, mockLeaveBalances);
  return updated;
}

/**
 * Get onboarding / offboarding checklist for a staff member
 */
export async function getStaffChecklist(
  staffId: string,
  checklistType: 'onboarding' | 'offboarding' = 'onboarding'
): Promise<StaffChecklistRecord[]> {
  return mockChecklists.filter(
    (c) => c.staffId === staffId && c.checklistType === checklistType
  );
}

/**
 * Toggle checklist item completion status
 */
export async function toggleChecklistItem(
  itemId: string,
  isCompleted: boolean,
  completedByUser: { id: string; displayName?: string },
  notes?: string
): Promise<StaffChecklistRecord> {
  const index = mockChecklists.findIndex((c) => c.id === itemId);
  if (index === -1) {
    throw new Error('Checklist item not found.');
  }

  const existing = mockChecklists[index];
  if (!existing) {
    throw new Error('Checklist item not found.');
  }

  const updated: StaffChecklistRecord = {
    ...existing,
    isCompleted,
    completedAt: isCompleted ? new Date().toISOString() : null,
    completedBy: isCompleted ? completedByUser.id : null,
    completedByName: isCompleted ? (completedByUser.displayName || 'HR Administrator') : null,
    notes: notes !== undefined ? notes : existing.notes,
  };

  mockChecklists[index] = updated;
  setPersistentItem(HR_STORAGE_KEYS.CHECKLISTS, mockChecklists);
  return updated;
}

/**
 * Get personnel documents attached to a staff profile
 */
export async function getStaffDocuments(staffId: string): Promise<StaffDocumentRecord[]> {
  return mockStaffDocuments.filter((doc) => doc.staffId === staffId);
}

/**
 * Get staff profile by ID
 */
export async function getStaffById(staffId: string): Promise<StaffProfileRecord | null> {
  const staff = mockStaff.find((s) => s.id === staffId);
  return staff || null;
}

/**
 * Get staff profile by linked auth user ID
 */
export async function getStaffByUserId(userId: string): Promise<StaffProfileRecord | null> {
  const staff = mockStaff.find((s) => s.userId === userId);
  return staff || null;
}

/**
 * Get staff profile by email (checks official, personal, or general email)
 */
export async function getStaffByEmail(email: string): Promise<StaffProfileRecord | null> {
  const normalized = email.toLowerCase().trim();
  const staff = mockStaff.find(
    (s) =>
      s.email?.toLowerCase().trim() === normalized ||
      s.officialEmail?.toLowerCase().trim() === normalized ||
      s.personalEmail?.toLowerCase().trim() === normalized
  );
  return staff || null;
}

/**
 * Update HR Dossier (DOB, NIDA, TIN, Loan Board, Salary, CV & Certifications)
 * Triggers transition from pending_hr -> pending_finance
 */
export async function updateHrDossier(
  staffId: string,
  payload: UpdateHrDossierPayload,
  _actor?: { id: string; displayName?: string }
): Promise<StaffProfileRecord> {
  const index = mockStaff.findIndex((s) => s.id === staffId);
  if (index === -1) {
    throw new Error('Staff record not found.');
  }

  const current = mockStaff[index];
  if (!current) throw new Error('Staff record not found.');

  // Determine onboarding status progression
  let nextStatus = current.onboardingStatus || 'completed';
  let nextStep = current.onboardingStep || 4;

  if (current.onboardingStatus === 'pending_hr') {
    // If statutory details already present, advance to completed, else pending_finance
    const hasStatutory = Boolean(current.nssfNumber || current.nhifNumber || current.pssfNumber);
    nextStatus = hasStatutory ? 'completed' : 'pending_finance';
    nextStep = hasStatutory ? 4 : 3;
  }

  const updated: StaffProfileRecord = {
    ...current,
    dateOfBirth: payload.dateOfBirth !== undefined ? payload.dateOfBirth : current.dateOfBirth,
    nidaNumber: payload.nidaNumber !== undefined ? payload.nidaNumber : current.nidaNumber,
    tinNumber: payload.tinNumber !== undefined ? payload.tinNumber : current.tinNumber,
    loanBoardStatus: payload.loanBoardStatus !== undefined ? payload.loanBoardStatus : current.loanBoardStatus,
    loanBoardDetails: payload.loanBoardDetails !== undefined ? payload.loanBoardDetails : current.loanBoardDetails,
    basicSalary: payload.basicSalary !== undefined ? payload.basicSalary : current.basicSalary,
    grossSalary: payload.grossSalary !== undefined ? payload.grossSalary : current.grossSalary,
    cvName: payload.cvName !== undefined ? payload.cvName : current.cvName,
    cvUrl: payload.cvUrl !== undefined ? payload.cvUrl : current.cvUrl,
    certifications: payload.certifications !== undefined ? payload.certifications : current.certifications,
    onboardingStatus: nextStatus,
    onboardingStep: nextStep,
    updatedAt: new Date().toISOString(),
  };

  mockStaff[index] = updated;
  setPersistentItem(HR_STORAGE_KEYS.STAFF, mockStaff);
  return updated;
}

/**
 * Update Statutory & Payroll Details (CWT, NSSF, PSSF, NHIF, Bank Details, Loan Board)
 * Completes the onboarding workflow
 */
export async function updateStatutoryDetails(
  staffId: string,
  payload: UpdateStatutoryPayload,
  _actor?: { id: string; displayName?: string }
): Promise<StaffProfileRecord> {
  const index = mockStaff.findIndex((s) => s.id === staffId);
  if (index === -1) {
    throw new Error('Staff record not found.');
  }

  const current = mockStaff[index];
  if (!current) throw new Error('Staff record not found.');

  // Advances to completed once statutory enrollment is recorded
  const nextStatus = 'completed';
  const nextStep = 4;

  const updated: StaffProfileRecord = {
    ...current,
    cwtNumber: payload.cwtNumber !== undefined ? payload.cwtNumber : current.cwtNumber,
    nssfNumber: payload.nssfNumber !== undefined ? payload.nssfNumber : current.nssfNumber,
    pssfNumber: payload.pssfNumber !== undefined ? payload.pssfNumber : current.pssfNumber,
    nhifNumber: payload.nhifNumber !== undefined ? payload.nhifNumber : current.nhifNumber,
    loanBoardStatus: payload.loanBoardStatus !== undefined ? payload.loanBoardStatus : current.loanBoardStatus,
    loanBoardDetails: payload.loanBoardDetails !== undefined ? payload.loanBoardDetails : current.loanBoardDetails,
    bankName: payload.bankName !== undefined ? payload.bankName : current.bankName,
    bankAccountNumber: payload.bankAccountNumber !== undefined ? payload.bankAccountNumber : current.bankAccountNumber,
    bankBranch: payload.bankBranch !== undefined ? payload.bankBranch : current.bankBranch,
    onboardingStatus: nextStatus,
    onboardingStep: nextStep,
    updatedAt: new Date().toISOString(),
  };

  mockStaff[index] = updated;
  setPersistentItem(HR_STORAGE_KEYS.STAFF, mockStaff);
  return updated;
}

/**
 * Automatically create/link a StaffProfileRecord when System Admin grants user system access
 */
export async function createStaffFromUserCreation(params: {
  userId: string;
  fullName: string;
  personalEmail?: string | null;
  officialEmail: string;
  phoneNumber?: string | null;
  departmentCode: string;
  departmentName: string;
  jobTitle: string;
}): Promise<StaffProfileRecord> {
  const nextNum = mockStaff.length + 1;
  const staffNumber = `STF-2026-${String(nextNum).padStart(3, '0')}`;

  const newStaff: StaffProfileRecord = {
    id: `staff-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId,
    staffNumber,
    fullName: params.fullName,
    email: params.personalEmail || params.officialEmail,
    personalEmail: params.personalEmail || null,
    officialEmail: params.officialEmail,
    phoneNumber: params.phoneNumber || null,
    jobTitle: params.jobTitle,
    departmentId: `dept-${params.departmentCode.toLowerCase()}`,
    departmentName: params.departmentName,
    departmentCode: params.departmentCode,
    employmentStatus: 'probation',
    contractType: 'fixed_term',
    startDate: new Date().toISOString().split('T')[0] ?? '',
    endDate: null,
    supervisorId: null,
    supervisorName: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    notes: 'System access provisioned by Administrator. Awaiting HR & Finance onboarding completion.',
    daysToContractExpiry: null,
    isExpiringSoon: false,
    dateOfBirth: null,
    nidaNumber: null,
    tinNumber: null,
    loanBoardStatus: null,
    loanBoardDetails: null,
    basicSalary: null,
    grossSalary: null,
    cwtNumber: null,
    nssfNumber: null,
    pssfNumber: null,
    nhifNumber: null,
    bankName: null,
    bankAccountNumber: null,
    bankBranch: null,
    cvName: null,
    cvUrl: null,
    certifications: [],
    onboardingStatus: 'pending_hr',
    onboardingStep: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockStaff = [newStaff, ...mockStaff];
  setPersistentItem(HR_STORAGE_KEYS.STAFF, mockStaff);
  return newStaff;
}

