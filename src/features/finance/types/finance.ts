/**
 * BAOMS Finance Feature Domain Types
 * Babawatoto Organization Management System
 */

export type FinancialRequestType =
  | 'activity_expense'
  | 'procurement'
  | 'travel_per_diem'
  | 'operational'
  | 'petty_cash'
  | 'consultancy';

export type FinancialRequestStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'partially_paid'
  | 'paid'
  | 'returned'
  | 'rejected'
  | 'cancelled';

export type FinancialRequestPriority = 'low' | 'normal' | 'urgent';

export type PaymentMethod = 'bank_transfer' | 'mobile_money' | 'cash' | 'cheque';

export interface FinancialRequestLine {
  id: string;
  requestId: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  budgetCategory?: string;
}

export interface PaymentTransaction {
  id: string;
  transactionNumber: string;
  requestId: string;
  requestNumber?: string;
  requestTitle?: string;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  amount: number;
  currency: string;
  paymentDate: string;
  payeeName: string;
  payeeContact?: string;
  bankName?: string;
  bankAccountNumber?: string;
  disbursedBy: string;
  disbursedByName?: string;
  documentId?: string;
  documentTitle?: string;
  notes?: string;
  status: 'completed' | 'cancelled';
  createdAt: string;
}

export interface ApprovalEventRecord {
  id: string;
  stepNumber: number;
  action: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'returned';
  actorId: string;
  actorName: string;
  actorRole: string;
  comments: string | null;
  createdAt: string;
}

export interface ProofDocumentRecord {
  id: string;
  name: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  storagePath?: string;
  dataUrl?: string;
  notes?: string;
}

export interface RequestAttachedDocument {
  id: string;
  documentId: string;
  title: string;
  fileName: string;
  fileSize: number;
  documentType: 'invoice' | 'receipt' | 'terms_of_reference' | 'quotation' | 'voucher' | 'other';
  attachedAt: string;
}

export interface FinancialRequestRecord {
  id: string;
  requestNumber: string;
  projectId: string | null;
  projectName?: string;
  budgetId: string | null;
  budgetName?: string;
  requesterId: string;
  requesterName: string;
  requesterRole?: string;
  requestType: FinancialRequestType;
  title: string;
  purpose: string;
  totalAmount: number;
  currency: string;
  status: FinancialRequestStatus;
  priority: FinancialRequestPriority;
  dueDate: string | null;
  approvedAmount: number | null;
  paidAmount: number;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  approvedByName?: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  lines: FinancialRequestLine[];
  events: ApprovalEventRecord[];
  transactions: PaymentTransaction[];
  documents: RequestAttachedDocument[];
  proofDocuments?: ProofDocumentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetRecord {
  id: string;
  projectId: string | null;
  projectName?: string;
  fiscalYear: string;
  code: string;
  name: string;
  category: string;
  allocatedAmount: number;
  currency: string;
  status: 'draft' | 'active' | 'closed' | 'archived';
  notes: string | null;
  totalCommitted: number;
  totalSpent: number;
  availableBalance: number;
  utilizationPercentage: number;
}

export interface FinancialDocumentItem {
  id: string;
  title: string;
  documentType: string;
  referenceNumber: string;
  relatedEntity: string;
  fileSize?: string;
  uploadedAt: string;
  source: 'transaction_receipt' | 'requisition_attachment' | 'supporting_doc';
}

export interface IncomeRecord {
  id: string;
  referenceNumber: string;
  source: string;
  donorName: string;
  projectId?: string | null;
  projectName?: string;
  amount: number;
  currency: string;
  date: string;
  status: 'confirmed' | 'reconciled' | 'pending';
  category: string;
  notes?: string;
}

export interface FinanceKpis {
  totalBudget: number;
  totalSpent: number;
  totalCommitted: number;
  availableBalance: number;
  recordedIncome?: number;
  pendingRequestsCount: number;
  pendingRequestsAmount: number;
  pendingApprovalsCount?: number;
  pendingDisbursementCount: number;
  pendingDisbursementAmount: number;
  outstandingPaymentsAmount?: number;
  outstandingPaymentsCount?: number;
}

export interface CreateFinancialRequestLineInput {
  description: string;
  quantity: number;
  unitCost: number;
  budgetCategory?: string;
}

export interface CreateFinancialRequestPayload {
  projectId?: string | null;
  budgetId?: string | null;
  requestType: FinancialRequestType;
  title: string;
  purpose: string;
  priority?: FinancialRequestPriority;
  dueDate?: string | null;
  currency?: string;
  lines: CreateFinancialRequestLineInput[];
  documentIds?: Array<{ documentId: string; documentType: string }>;
  proofDocuments?: Array<{
    name: string;
    fileSize: number;
    fileType: string;
    dataUrl?: string;
    notes?: string;
  }>;
}

export interface ReviewDecisionPayload {
  action: 'reviewed' | 'approved' | 'returned' | 'rejected';
  comments: string;
  approvedAmount?: number;
}

export interface RecordPaymentPayload {
  paymentMethod: PaymentMethod;
  paymentReference: string;
  amount: number;
  paymentDate: string;
  payeeName: string;
  payeeContact?: string;
  bankName?: string;
  bankAccountNumber?: string;
  documentId?: string;
  notes?: string;
  proofDocuments?: Array<{
    name: string;
    fileSize: number;
    fileType: string;
    dataUrl?: string;
  }>;
}

export interface FinanceFilterOptions {
  search?: string;
  status?: FinancialRequestStatus | 'all';
  projectId?: string | 'all';
  budgetId?: string | 'all';
  requestType?: FinancialRequestType | 'all';
  dateFrom?: string;
  dateTo?: string;
}
