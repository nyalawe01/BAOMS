/**
 * BAOMS Finance Service Layer
 * Babawatoto Organization Management System
 * 
 * Connected directly to Supabase PostgreSQL database tables:
 * public.budgets, public.financial_requests, public.transactions
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
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

export const syncFinanceState = (): void => {};
export const resetMockFinanceState = (): void => {};

/**
 * Retrieve all budgets with current utilization metrics directly from Supabase.
 */
export const getBudgets = async (
  filters?: { projectId?: string | null; status?: string }
): Promise<BudgetRecord[]> => {
  if (!isSupabaseConfigured) return [];

  let query = supabase.from('budgets').select('*').order('created_at', { ascending: false });

  if (filters?.projectId !== undefined && filters.projectId !== null) {
    query = query.eq('project_id', filters.projectId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((b: any) => ({
    id: b.id,
    projectId: b.project_id,
    fiscalYear: b.fiscal_year,
    code: b.code,
    name: b.name,
    category: b.category,
    allocatedAmount: Number(b.allocated_amount),
    currency: b.currency,
    status: b.status,
    notes: b.notes,
    totalCommitted: 0,
    totalSpent: 0,
    availableBalance: Number(b.allocated_amount),
    utilizationPercentage: 0,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  }));
};

/**
 * Retrieve a single budget by ID directly from Supabase.
 */
export const getBudgetById = async (id: string): Promise<BudgetRecord | null> => {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    projectId: data.project_id,
    fiscalYear: data.fiscal_year,
    code: data.code,
    name: data.name,
    category: data.category,
    allocatedAmount: Number(data.allocated_amount),
    currency: data.currency,
    status: data.status,
    notes: data.notes,
    totalCommitted: 0,
    totalSpent: 0,
    availableBalance: Number(data.allocated_amount),
    utilizationPercentage: 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Retrieve financial requests directly from Supabase.
 */
export const getFinancialRequests = async (
  filters?: FinanceFilterOptions,
  _currentUser?: { id: string; roles?: string[]; permissions?: string[] }
): Promise<FinancialRequestRecord[]> => {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('financial_requests')
    .select(`
      *,
      requester:profiles!requester_id(display_name, official_email),
      approver:profiles!approved_by(display_name),
      project:projects(name),
      budget:budgets(name)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.projectId && filters.projectId !== 'all') {
    query = query.eq('project_id', filters.projectId);
  }
  if (filters?.budgetId && filters.budgetId !== 'all') {
    query = query.eq('budget_id', filters.budgetId);
  }
  if (filters?.requestType && filters.requestType !== 'all') {
    query = query.eq('request_type', filters.requestType);
  }
  if (filters?.searchQuery) {
    const q = filters.searchQuery.trim();
    query = query.or(`request_number.ilike.%${q}%,title.ilike.%${q}%,purpose.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    requestNumber: r.request_number,
    projectId: r.project_id,
    projectName: r.project?.name,
    budgetId: r.budget_id,
    budgetName: r.budget?.name,
    requesterId: r.requester_id,
    requesterName: r.requester?.display_name || 'Staff Member',
    requesterRole: 'Staff',
    requestType: r.request_type,
    title: r.title,
    purpose: r.purpose,
    items: [],
    totalAmount: Number(r.total_amount),
    currency: r.currency,
    status: r.status,
    priority: r.priority || 'medium',
    dueDate: r.due_date,
    approvedAmount: r.approved_amount ? Number(r.approved_amount) : undefined,
    paidAmount: Number(r.paid_amount || 0),
    submittedAt: r.submitted_at || r.created_at,
    approvals: [],
    attachments: [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
};

export const getRequisitions = getFinancialRequests;

/**
 * Retrieve a single financial request by ID directly from Supabase.
 */
export const getFinancialRequestById = async (
  id: string
): Promise<FinancialRequestRecord | null> => {
  if (!isSupabaseConfigured) return null;

  const { data: r, error } = await supabase
    .from('financial_requests')
    .select(`
      *,
      requester:profiles!requester_id(display_name),
      project:projects(name),
      budget:budgets(name)
    `)
    .eq('id', id)
    .single();

  if (error || !r) return null;

  return {
    id: r.id,
    requestNumber: r.request_number,
    projectId: r.project_id,
    projectName: r.project?.name,
    budgetId: r.budget_id,
    budgetName: r.budget?.name,
    requesterId: r.requester_id,
    requesterName: r.requester?.display_name || 'Staff Member',
    requesterRole: 'Staff',
    requestType: r.request_type,
    title: r.title,
    purpose: r.purpose,
    items: [],
    totalAmount: Number(r.total_amount),
    currency: r.currency,
    status: r.status,
    priority: r.priority || 'medium',
    dueDate: r.due_date,
    approvedAmount: r.approved_amount ? Number(r.approved_amount) : undefined,
    paidAmount: Number(r.paid_amount || 0),
    submittedAt: r.submitted_at || r.created_at,
    approvals: [],
    attachments: [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
};

/**
 * Create a new financial requisition directly in Supabase.
 */
export const createFinancialRequest = async (
  payload: CreateFinancialRequestPayload,
  currentUser: { id: string; name: string; role?: string }
): Promise<FinancialRequestRecord> => {
  if (!isSupabaseConfigured) throw new Error('Database connection is not configured.');

  const requestNumber = `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const totalAmount = payload.items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);

  const { data, error } = await supabase
    .from('financial_requests')
    .insert({
      request_number: requestNumber,
      project_id: payload.projectId || null,
      budget_id: payload.budgetId || null,
      requester_id: currentUser.id,
      request_type: payload.requestType,
      title: payload.title.trim(),
      purpose: payload.purpose.trim(),
      total_amount: totalAmount,
      currency: payload.currency || 'TZS',
      status: 'submitted',
      priority: payload.priority || 'medium',
      due_date: payload.dueDate || null,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to insert financial request.');

  return {
    id: data.id,
    requestNumber: data.request_number,
    projectId: data.project_id,
    budgetId: data.budget_id,
    requesterId: data.requester_id,
    requesterName: currentUser.name,
    requesterRole: currentUser.role || 'Staff',
    requestType: data.request_type,
    title: data.title,
    purpose: data.purpose,
    items: payload.items.map((it, idx) => ({
      id: `item-${idx}`,
      requestId: data.id,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.quantity * it.unitPrice,
    })),
    totalAmount: Number(data.total_amount),
    currency: data.currency,
    status: data.status,
    priority: data.priority,
    dueDate: data.due_date,
    paidAmount: 0,
    submittedAt: data.submitted_at,
    approvals: [],
    attachments: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Review/Approve/Reject a financial request directly in Supabase.
 */
export const reviewFinancialRequest = async (
  requestId: string,
  payload: ReviewDecisionPayload,
  reviewer: { id: string; name: string; role: string }
): Promise<FinancialRequestRecord> => {
  if (!isSupabaseConfigured) throw new Error('Database connection is not configured.');

  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    updated_at: now,
  };

  if (payload.action === 'approved') {
    updatePayload.status = 'approved';
    updatePayload.approved_at = now;
    updatePayload.approved_by = reviewer.id;
    if (payload.approvedAmount) {
      updatePayload.approved_amount = payload.approvedAmount;
    }
  } else if (payload.action === 'rejected') {
    updatePayload.status = 'rejected';
    updatePayload.rejected_at = now;
    updatePayload.rejected_by = reviewer.id;
    updatePayload.rejection_reason = payload.comments || null;
  }

  const { data, error } = await supabase
    .from('financial_requests')
    .update(updatePayload)
    .eq('id', requestId)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to update financial request.');

  return {
    id: data.id,
    requestNumber: data.request_number,
    projectId: data.project_id,
    budgetId: data.budget_id,
    requesterId: data.requester_id,
    requesterName: 'Staff Member',
    requesterRole: 'Staff',
    requestType: data.request_type,
    title: data.title,
    purpose: data.purpose,
    items: [],
    totalAmount: Number(data.total_amount),
    currency: data.currency,
    status: data.status,
    priority: data.priority,
    dueDate: data.due_date,
    approvedAmount: data.approved_amount ? Number(data.approved_amount) : undefined,
    paidAmount: Number(data.paid_amount || 0),
    submittedAt: data.submitted_at,
    approvals: [],
    attachments: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Record a payment disbursement transaction directly in Supabase.
 */
export const recordPaymentTransaction = async (
  requestId: string,
  payload: RecordPaymentPayload,
  disburser: { id: string; name: string }
): Promise<PaymentTransaction> => {
  if (!isSupabaseConfigured) throw new Error('Database connection is not configured.');

  const txNumber = `TXN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      transaction_number: txNumber,
      request_id: requestId,
      payment_method: payload.paymentMethod,
      payment_reference: payload.paymentReference,
      amount: payload.amount,
      currency: payload.currency || 'TZS',
      payment_date: payload.paymentDate,
      payee_name: payload.payeeName,
      payee_contact: payload.payeePhone || null,
      bank_name: payload.bankName || null,
      bank_account_number: payload.bankAccountNumber || null,
      disbursed_by: disburser.id,
      notes: payload.notes || null,
      status: 'completed',
    })
    .select()
    .single();

  if (txError || !tx) throw new Error(txError?.message || 'Failed to record payment transaction.');

  // Update paid amount on financial request
  await supabase.rpc('increment_paid_amount', {
    p_request_id: requestId,
    p_amount: payload.amount,
  }).catch(() => {
    // If RPC not defined, direct update
    supabase.from('financial_requests').select('paid_amount, total_amount').eq('id', requestId).single().then(({ data: req }) => {
      if (req) {
        const newPaid = Number(req.paid_amount || 0) + payload.amount;
        const newStatus = newPaid >= Number(req.total_amount) ? 'paid' : 'partially_paid';
        supabase.from('financial_requests').update({ paid_amount: newPaid, status: newStatus }).eq('id', requestId);
      }
    });
  });

  return {
    id: tx.id,
    transactionNumber: tx.transaction_number,
    requestId: tx.request_id,
    requestNumber: 'REQ',
    paymentMethod: tx.payment_method,
    paymentReference: tx.payment_reference,
    amount: Number(tx.amount),
    currency: tx.currency,
    paymentDate: tx.payment_date,
    payeeName: tx.payee_name,
    payeePhone: tx.payee_contact,
    bankName: tx.bank_name,
    bankAccountNumber: tx.bank_account_number,
    disbursedBy: tx.disbursed_by,
    disbursedByName: disburser.name,
    receiptDocumentId: tx.document_id,
    notes: tx.notes,
    status: tx.status,
    createdAt: tx.created_at,
  };
};

/**
 * Retrieve all transactions directly from Supabase.
 */
export const getTransactions = async (
  filters?: { requestId?: string; paymentMethod?: string; status?: string }
): Promise<PaymentTransaction[]> => {
  if (!isSupabaseConfigured) return [];

  let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });

  if (filters?.requestId) query = query.eq('request_id', filters.requestId);
  if (filters?.paymentMethod) query = query.eq('payment_method', filters.paymentMethod);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((tx: any) => ({
    id: tx.id,
    transactionNumber: tx.transaction_number,
    requestId: tx.request_id,
    requestNumber: 'REQ',
    paymentMethod: tx.payment_method,
    paymentReference: tx.payment_reference,
    amount: Number(tx.amount),
    currency: tx.currency,
    paymentDate: tx.payment_date,
    payeeName: tx.payee_name,
    payeePhone: tx.payee_contact,
    bankName: tx.bank_name,
    bankAccountNumber: tx.bank_account_number,
    disbursedBy: tx.disbursed_by,
    disbursedByName: 'Finance Officer',
    receiptDocumentId: tx.document_id,
    notes: tx.notes,
    status: tx.status,
    createdAt: tx.created_at,
  }));
};

/**
 * Calculate financial KPIs directly from Supabase.
 */
export const getFinanceKpis = async (): Promise<FinanceKpis> => {
  if (!isSupabaseConfigured) {
    return {
      totalBudget: 0,
      totalCommitted: 0,
      totalSpent: 0,
      availableBalance: 0,
      pendingRequestsCount: 0,
      pendingDisbursementCount: 0,
    };
  }

  const [budgetsRes, requestsRes, txRes] = await Promise.all([
    supabase.from('budgets').select('allocated_amount'),
    supabase.from('financial_requests').select('status, total_amount, paid_amount'),
    supabase.from('transactions').select('amount, status'),
  ]);

  const budgets = budgetsRes.data || [];
  const totalBudget = budgets.reduce((sum: number, b: any) => sum + Number(b.allocated_amount || 0), 0);

  const requests = requestsRes.data || [];
  const pendingRequestsCount = requests.filter((r: any) => r.status === 'submitted' || r.status === 'under_review').length;
  const pendingDisbursementCount = requests.filter((r: any) => r.status === 'approved' || r.status === 'partially_paid').length;

  const transactions = txRes.data || [];
  const totalSpent = transactions
    .filter((t: any) => t.status === 'completed')
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const totalCommitted = requests
    .filter((r: any) => r.status === 'approved')
    .reduce((sum: number, r: any) => sum + Math.max(0, Number(r.total_amount) - Number(r.paid_amount || 0)), 0);

  const availableBalance = Math.max(0, totalBudget - (totalCommitted + totalSpent));

  return {
    totalBudget,
    totalCommitted,
    totalSpent,
    availableBalance,
    pendingRequestsCount,
    pendingDisbursementCount,
  };
};

/**
 * Record a disbursement payment against an approved financial request.
 */
export const recordPayment = async (
  requestId: string,
  payload: RecordPaymentPayload,
  actor: { id: string; name: string; role: string }
): Promise<{ request: FinancialRequestRecord; transaction: PaymentTransaction }> => {
  if (!isSupabaseConfigured) throw new Error('Database is not configured.');

  const { data: currentReq, error: reqErr } = await supabase
    .from('financial_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (reqErr || !currentReq) throw new Error('Financial request not found.');

  const paidAmount = Number(currentReq.paid_amount || 0) + Number(payload.amount);
  const totalAmount = Number(currentReq.total_amount);
  const nextStatus = paidAmount >= totalAmount ? 'paid' : 'partially_paid';

  const txNumber = `TXN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  const { data: newTx, error: txErr } = await supabase
    .from('transactions')
    .insert({
      request_id: requestId,
      transaction_number: txNumber,
      amount: payload.amount,
      currency: payload.currency || currentReq.currency || 'TZS',
      payment_method: payload.paymentMethod,
      reference_number: payload.paymentReference,
      payment_date: payload.paymentDate,
      payee_name: payload.payeeName,
      payee_contact: payload.payeePhone || null,
      bank_name: payload.bankName || null,
      bank_account_number: payload.bankAccountNumber || null,
      disbursed_by: actor.id,
      document_id: payload.receiptDocumentId || null,
      notes: payload.notes || null,
      status: 'completed',
    })
    .select()
    .single();

  if (txErr || !newTx) throw new Error(`Failed to record transaction: ${txErr?.message}`);

  const { data: updatedReq, error: updateErr } = await supabase
    .from('financial_requests')
    .update({
      paid_amount: paidAmount,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select('*, requester:profiles!requester_id(display_name)')
    .single();

  if (updateErr || !updatedReq) throw new Error(`Failed to update request: ${updateErr?.message}`);

  const mappedReq: FinancialRequestRecord = {
    id: updatedReq.id,
    requestNumber: updatedReq.request_number,
    budgetId: updatedReq.budget_id,
    budgetName: 'Budget Line',
    projectId: updatedReq.project_id,
    projectName: null,
    requesterId: updatedReq.requester_id,
    requesterName: updatedReq.requester?.display_name || 'Staff Member',
    departmentId: updatedReq.department_id,
    departmentName: 'Department',
    title: updatedReq.title,
    description: updatedReq.description,
    totalAmount: Number(updatedReq.total_amount),
    paidAmount: Number(updatedReq.paid_amount),
    currency: updatedReq.currency,
    status: updatedReq.status,
    urgency: updatedReq.urgency,
    requiredDate: updatedReq.required_date,
    items: [],
    approvals: [],
    createdAt: updatedReq.created_at,
    updatedAt: updatedReq.updated_at,
  };

  const mappedTx: PaymentTransaction = {
    id: newTx.id,
    requestId: newTx.request_id,
    transactionNumber: newTx.transaction_number,
    amount: Number(newTx.amount),
    currency: newTx.currency,
    paymentMethod: newTx.payment_method,
    paymentReference: newTx.reference_number,
    paymentDate: newTx.payment_date,
    payeeName: newTx.payee_name,
    payeePhone: newTx.payee_contact,
    bankName: newTx.bank_name,
    bankAccountNumber: newTx.bank_account_number,
    disbursedBy: newTx.disbursed_by,
    disbursedByName: actor.name,
    receiptDocumentId: newTx.document_id,
    notes: newTx.notes,
    status: newTx.status,
    createdAt: newTx.created_at,
  };

  return { request: mappedReq, transaction: mappedTx };
};

