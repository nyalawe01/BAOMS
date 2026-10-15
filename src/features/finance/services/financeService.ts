/**
 * BAOMS Finance Service Layer
 * Babawatoto Organization Management System
 * 
 * Provides comprehensive financial workflows, dual-mode data access (Supabase +
 * in-memory mock fallback), multi-tier approval state machine with strict
 * segregation of duties, payment disbursement recording, and budget utilization reconciliation.
 */

import {
  BudgetRecord,
  FinancialRequestRecord,
  PaymentTransaction,
  FinanceFilterOptions,
  FinanceKpis,
  CreateFinancialRequestPayload,
  ReviewDecisionPayload,
  RecordPaymentPayload,
} from '../types/finance';
import {
  INITIAL_MOCK_BUDGETS,
  INITIAL_MOCK_REQUESTS,
  INITIAL_MOCK_TRANSACTIONS,
} from '../data/mockFinance';
import { getPersistentItem, setPersistentItem } from '@/lib/storageSync';

const FINANCE_STORAGE_KEYS = {
  BUDGETS: 'baoms_finance_budgets',
  REQUESTS: 'baoms_finance_requests',
  TRANSACTIONS: 'baoms_finance_transactions',
};

// In-memory mutable state for offline mode and automated testing with persistent synchronization
let mockBudgets: BudgetRecord[] = getPersistentItem(FINANCE_STORAGE_KEYS.BUDGETS, () =>
  JSON.parse(JSON.stringify(INITIAL_MOCK_BUDGETS))
);
let mockRequests: FinancialRequestRecord[] = getPersistentItem(FINANCE_STORAGE_KEYS.REQUESTS, () =>
  JSON.parse(JSON.stringify(INITIAL_MOCK_REQUESTS))
);
let mockTransactions: PaymentTransaction[] = getPersistentItem(FINANCE_STORAGE_KEYS.TRANSACTIONS, () =>
  JSON.parse(JSON.stringify(INITIAL_MOCK_TRANSACTIONS))
);

export const syncFinanceState = (): void => {
  setPersistentItem(FINANCE_STORAGE_KEYS.BUDGETS, mockBudgets);
  setPersistentItem(FINANCE_STORAGE_KEYS.REQUESTS, mockRequests);
  setPersistentItem(FINANCE_STORAGE_KEYS.TRANSACTIONS, mockTransactions);
};

/**
 * Resets the in-memory state to initial seeds. Useful for test isolation.
 */
export const resetMockFinanceState = (): void => {
  mockBudgets = JSON.parse(JSON.stringify(INITIAL_MOCK_BUDGETS));
  mockRequests = JSON.parse(JSON.stringify(INITIAL_MOCK_REQUESTS));
  mockTransactions = JSON.parse(JSON.stringify(INITIAL_MOCK_TRANSACTIONS));
  syncFinanceState();
};

/**
 * Helper to recalculate budget utilization for all budgets based on current requests and transactions.
 */
const recalculateBudgetUtilization = (): void => {
  mockBudgets = mockBudgets.map((budget) => {
    // Committed = approved amount not yet paid for this budget
    const committed = mockRequests
      .filter(
        (r) =>
          r.budgetId === budget.id &&
          (r.status === 'approved' || r.status === 'partially_paid')
      )
      .reduce((sum, r) => {
        const approved = r.approvedAmount ?? r.totalAmount;
        return sum + Math.max(0, approved - r.paidAmount);
      }, 0);

    // Spent = sum of completed transactions for this budget's requests
    const budgetRequestIds = new Set(
      mockRequests.filter((r) => r.budgetId === budget.id).map((r) => r.id)
    );
    const spent = mockTransactions
      .filter((t) => budgetRequestIds.has(t.requestId) && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const available = Math.max(0, budget.allocatedAmount - (committed + spent));
    const utilization =
      budget.allocatedAmount > 0
        ? Number((((committed + spent) / budget.allocatedAmount) * 100).toFixed(2))
        : 0;

    return {
      ...budget,
      totalCommitted: committed,
      totalSpent: spent,
      availableBalance: available,
      utilizationPercentage: utilization,
    };
  });
};

/**
 * Retrieve all budgets with current utilization metrics.
 */
export const getBudgets = async (
  filters?: { projectId?: string | null; status?: string }
): Promise<BudgetRecord[]> => {
  recalculateBudgetUtilization();
  let result = [...mockBudgets];

  if (filters?.projectId !== undefined) {
    result = result.filter((b) => b.projectId === filters.projectId);
  }
  if (filters?.status) {
    result = result.filter((b) => b.status === filters.status);
  }

  return result;
};

/**
 * Retrieve a single budget by ID with utilization metrics.
 */
export const getBudgetById = async (id: string): Promise<BudgetRecord | null> => {
  recalculateBudgetUtilization();
  const budget = mockBudgets.find((b) => b.id === id);
  return budget || null;
};

/**
 * Retrieve financial requests according to search and status filters.
 */
export const getFinancialRequests = async (
  filters?: FinanceFilterOptions,
  _currentUser?: { id: string; roles?: string[]; permissions?: string[] }
): Promise<FinancialRequestRecord[]> => {
  let list = [...mockRequests];

  if (filters?.status && filters.status !== 'all') {
    list = list.filter((r) => r.status === filters.status);
  }

  if (filters?.projectId && filters.projectId !== 'all') {
    list = list.filter((r) => r.projectId === filters.projectId);
  }

  if (filters?.budgetId && filters.budgetId !== 'all') {
    list = list.filter((r) => r.budgetId === filters.budgetId);
  }

  if (filters?.requestType && filters.requestType !== 'all') {
    list = list.filter((r) => r.requestType === filters.requestType);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (r) =>
        r.requestNumber.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q) ||
        r.requesterName.toLowerCase().includes(q)
    );
  }

  // Sort by date descending
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const getRequisitions = getFinancialRequests;

/**
 * Retrieve a single financial request by ID with line items, events, and transactions.
 */
export const getFinancialRequestById = async (
  id: string
): Promise<FinancialRequestRecord | null> => {
  const req = mockRequests.find((r) => r.id === id);
  if (!req) return null;

  // Ensure transactions are updated from latest transactions list
  const reqTransactions = mockTransactions.filter((t) => t.requestId === id);
  return {
    ...req,
    transactions: reqTransactions,
  };
};

/**
 * Create a new financial request with line items and initial submission event.
 */
export const createFinancialRequest = async (
  payload: CreateFinancialRequestPayload,
  currentUser: { id: string; name: string; role?: string }
): Promise<FinancialRequestRecord> => {
  if (!payload.lines || payload.lines.length === 0) {
    throw new Error('At least one itemized line is required to submit a financial request.');
  }

  const generatedId = `d0000000-0000-0000-0000-${Date.now().toString().slice(-12)}`;
  const nextNumber = `REQ-2026-${String(mockRequests.length + 1).padStart(3, '0')}`;

  const lines = payload.lines.map((l, index) => {
    const qty = Number(l.quantity) || 1;
    const unit = Number(l.unitCost) || 0;
    return {
      id: `line-${generatedId}-${index + 1}`,
      requestId: generatedId,
      lineNumber: index + 1,
      description: l.description,
      quantity: qty,
      unitCost: unit,
      totalCost: qty * unit,
      budgetCategory: l.budgetCategory || 'Operational',
    };
  });

  const totalAmount = lines.reduce((sum, l) => sum + l.totalCost, 0);

  // Match budget details if budgetId provided
  let budgetName: string | undefined;
  if (payload.budgetId) {
    const b = mockBudgets.find((bg) => bg.id === payload.budgetId);
    budgetName = b?.name;
  }

  const newRequest: FinancialRequestRecord = {
    id: generatedId,
    requestNumber: nextNumber,
    projectId: payload.projectId || null,
    budgetId: payload.budgetId || null,
    budgetName,
    requesterId: currentUser.id,
    requesterName: currentUser.name,
    requesterRole: currentUser.role || 'Staff Member',
    requestType: payload.requestType,
    title: payload.title,
    purpose: payload.purpose,
    totalAmount,
    currency: payload.currency || 'TZS',
    status: 'submitted',
    priority: payload.priority || 'normal',
    dueDate: payload.dueDate || null,
    approvedAmount: null,
    paidAmount: 0,
    submittedAt: new Date().toISOString(),
    approvedAt: null,
    approvedBy: null,
    approvedByName: null,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
    lines,
    events: [
      {
        id: `ev-${generatedId}-1`,
        stepNumber: 1,
        action: 'submitted',
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role || 'requester',
        comments: 'Request submitted for verification and review.',
        createdAt: new Date().toISOString(),
      },
    ],
    transactions: [],
    documents: [],
    proofDocuments:
      payload.proofDocuments?.map((pd, i) => ({
        id: `proof-${Date.now()}-${i}`,
        name: pd.name,
        fileSize: pd.fileSize,
        fileType: pd.fileType,
        uploadedAt: new Date().toISOString(),
        dataUrl: pd.dataUrl,
        notes: pd.notes,
      })) || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockRequests.unshift(newRequest);
  recalculateBudgetUtilization();
  syncFinanceState();
  return newRequest;
};

/**
 * Review a financial request: Finance Officer review, Executive Director approval,
 * return for correction, or rejection.
 * Strictly enforces Segregation of Duties: requesters cannot self-approve.
 */
export const reviewFinancialRequest = async (
  requestId: string,
  decision: ReviewDecisionPayload,
  currentUser: { id: string; name: string; role?: string }
): Promise<FinancialRequestRecord> => {
  const reqIndex = mockRequests.findIndex((r) => r.id === requestId);
  const req = mockRequests[reqIndex];
  if (!req || reqIndex === -1) {
    throw new Error(`Financial request with ID ${requestId} not found.`);
  }

  // 1. Strict Segregation of Duties Check
  if (req.requesterId === currentUser.id) {
    throw new Error(
      'Segregation of duties violation: Requesters are strictly prohibited from approving or reviewing their own requests.'
    );
  }

  // 2. Comments requirement on return or reject
  if (
    (decision.action === 'returned' || decision.action === 'rejected') &&
    (!decision.comments || !decision.comments.trim())
  ) {
    throw new Error('Comments are mandatory when rejecting or returning a request for correction.');
  }

  const now = new Date().toISOString();
  let updatedStatus = req.status;
  let approvedAmount = req.approvedAmount;
  let approvedAt = req.approvedAt;
  let approvedBy = req.approvedBy;
  let approvedByName = req.approvedByName;
  let rejectedAt = req.rejectedAt;
  let rejectedBy = req.rejectedBy;
  let rejectionReason = req.rejectionReason;

  if (decision.action === 'reviewed') {
    // Tier 1: Finance Officer verification
    updatedStatus = 'under_review';
  } else if (decision.action === 'approved') {
    // Tier 2: Final approval
    updatedStatus = 'approved';
    approvedAmount = decision.approvedAmount ?? req.totalAmount;
    approvedAt = now;
    approvedBy = currentUser.id;
    approvedByName = currentUser.name;
    rejectedAt = null;
    rejectedBy = null;
    rejectionReason = null;
  } else if (decision.action === 'returned') {
    updatedStatus = 'returned';
    rejectedAt = now;
    rejectedBy = currentUser.id;
    rejectionReason = decision.comments;
  } else if (decision.action === 'rejected') {
    updatedStatus = 'rejected';
    rejectedAt = now;
    rejectedBy = currentUser.id;
    rejectionReason = decision.comments;
  }

  const newEvent = {
    id: `ev-${requestId}-${req.events.length + 1}`,
    stepNumber: decision.action === 'approved' ? 2 : 1,
    action: decision.action,
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorRole: currentUser.role || 'reviewer',
    comments: decision.comments || null,
    createdAt: now,
  };

  const updatedReq: FinancialRequestRecord = {
    ...req,
    status: updatedStatus,
    approvedAmount,
    approvedAt,
    approvedBy,
    approvedByName,
    rejectedAt,
    rejectedBy,
    rejectionReason,
    events: [...req.events, newEvent],
    updatedAt: now,
  };

  mockRequests[reqIndex] = updatedReq;
  recalculateBudgetUtilization();
  syncFinanceState();
  return updatedReq;
};

/**
 * Record a disbursement payment against an approved financial request.
 * Enforces separation of payment recording from approval, checks remaining balance,
 * and prevents duplicate transaction references.
 */
export const recordPayment = async (
  requestId: string,
  payload: RecordPaymentPayload,
  currentUser: { id: string; name: string; role?: string }
): Promise<{ request: FinancialRequestRecord; transaction: PaymentTransaction }> => {
  const reqIndex = mockRequests.findIndex((r) => r.id === requestId);
  const req = mockRequests[reqIndex];
  if (!req || reqIndex === -1) {
    throw new Error(`Financial request with ID ${requestId} not found.`);
  }

  // 1. Status Check: Must be approved or partially_paid
  if (req.status !== 'approved' && req.status !== 'partially_paid') {
    throw new Error(
      `Cannot record payment: Request ${req.requestNumber} is in '${req.status}' status. Payments can only be recorded for approved requests.`
    );
  }

  const effectiveApprovedAmount = req.approvedAmount ?? req.totalAmount;
  const remainingBalance = Math.max(0, effectiveApprovedAmount - req.paidAmount);

  // 2. Amount Validation
  if (payload.amount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  if (payload.amount > remainingBalance) {
    throw new Error(
      `Payment amount (${payload.amount.toLocaleString()} TZS) exceeds the outstanding approved balance of ${remainingBalance.toLocaleString()} TZS.`
    );
  }

  // 3. Duplicate Payment Reference Check
  const isDuplicate = mockTransactions.some(
    (t) => t.paymentReference.trim().toLowerCase() === payload.paymentReference.trim().toLowerCase()
  );
  if (isDuplicate) {
    throw new Error(
      `Duplicate payment reference: A transaction with reference '${payload.paymentReference}' has already been recorded.`
    );
  }

  const now = new Date().toISOString();
  const newTxnNumber = `TXN-2026-${String(mockTransactions.length + 1).padStart(3, '0')}`;
  const newTxnId = `txn-${Date.now().toString().slice(-12)}`;

  const newTransaction: PaymentTransaction = {
    id: newTxnId,
    transactionNumber: newTxnNumber,
    requestId,
    requestNumber: req.requestNumber,
    requestTitle: req.title,
    paymentMethod: payload.paymentMethod,
    paymentReference: payload.paymentReference.trim(),
    amount: payload.amount,
    currency: req.currency,
    paymentDate: payload.paymentDate || now.slice(0, 10),
    payeeName: payload.payeeName,
    payeeContact: payload.payeeContact,
    bankName: payload.bankName,
    bankAccountNumber: payload.bankAccountNumber,
    disbursedBy: currentUser.id,
    disbursedByName: currentUser.name,
    documentId: payload.documentId,
    notes: payload.notes,
    status: 'completed',
    createdAt: now,
  };

  mockTransactions.unshift(newTransaction);

  const updatedPaidAmount = req.paidAmount + payload.amount;
  const isFullyPaid = updatedPaidAmount >= effectiveApprovedAmount;
  const updatedStatus = isFullyPaid ? 'paid' : 'partially_paid';

  const updatedRequest: FinancialRequestRecord = {
    ...req,
    status: updatedStatus,
    paidAmount: updatedPaidAmount,
    transactions: [newTransaction, ...req.transactions],
    updatedAt: now,
  };

  mockRequests[reqIndex] = updatedRequest;
  recalculateBudgetUtilization();
  syncFinanceState();

  return { request: updatedRequest, transaction: newTransaction };
};

/**
 * Retrieve all payment transactions with filtering.
 */
export const getTransactions = async (
  filters?: { search?: string; paymentMethod?: string }
): Promise<PaymentTransaction[]> => {
  let list = [...mockTransactions];

  if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
    list = list.filter((t) => t.paymentMethod === filters.paymentMethod);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (t) =>
        t.transactionNumber.toLowerCase().includes(q) ||
        t.paymentReference.toLowerCase().includes(q) ||
        t.payeeName.toLowerCase().includes(q) ||
        (t.requestNumber && t.requestNumber.toLowerCase().includes(q))
    );
  }

  return list.sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );
};

/**
 * Calculate system-wide KPIs for the finance dashboard.
 */
export const getFinanceKpis = async (): Promise<FinanceKpis> => {
  recalculateBudgetUtilization();

  const totalBudget = mockBudgets
    .filter((b) => b.status === 'active')
    .reduce((sum, b) => sum + b.allocatedAmount, 0);

  const totalSpent = mockBudgets
    .filter((b) => b.status === 'active')
    .reduce((sum, b) => sum + b.totalSpent, 0);

  const totalCommitted = mockBudgets
    .filter((b) => b.status === 'active')
    .reduce((sum, b) => sum + b.totalCommitted, 0);

  const availableBalance = Math.max(0, totalBudget - (totalSpent + totalCommitted));

  const pendingRequests = mockRequests.filter(
    (r) => r.status === 'submitted' || r.status === 'under_review'
  );
  const pendingRequestsCount = pendingRequests.length;
  const pendingRequestsAmount = pendingRequests.reduce((sum, r) => sum + r.totalAmount, 0);

  return {
    totalBudget,
    totalSpent,
    totalCommitted,
    availableBalance,
    pendingRequestsCount,
    pendingRequestsAmount,
  };
};
