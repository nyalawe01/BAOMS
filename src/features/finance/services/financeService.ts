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
  IncomeRecord,
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

  let query = supabase
    .from('budgets')
    .select('*, project:projects(name)')
    .order('created_at', { ascending: false });

  if (filters?.projectId !== undefined && filters.projectId !== null) {
    query = query.eq('project_id', filters.projectId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const [budgetsRes, requestsRes] = await Promise.all([
    query,
    supabase.from('financial_requests').select('budget_id, total_amount, paid_amount, status'),
  ]);

  if (budgetsRes.error || !budgetsRes.data) return [];
  const allReqs = requestsRes.data || [];

  return budgetsRes.data.map((b: any) => {
    const allocated = Number(b.allocated_amount || 0);
    const relatedReqs = allReqs.filter((r: any) => r.budget_id === b.id);
    const spent = relatedReqs.reduce((sum: number, r: any) => sum + Number(r.paid_amount || 0), 0);
    const committed = relatedReqs
      .filter((r: any) => r.status === 'approved')
      .reduce((sum: number, r: any) => sum + Math.max(0, Number(r.total_amount || 0) - Number(r.paid_amount || 0)), 0);
    const available = Math.max(0, allocated - (spent + committed));
    const utilization = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;

    return {
      id: b.id,
      projectId: b.project_id,
      projectName: b.project?.name,
      fiscalYear: b.fiscal_year,
      code: b.code,
      name: b.name,
      category: b.category,
      allocatedAmount: allocated,
      currency: b.currency || 'TZS',
      status: b.status,
      notes: b.notes,
      totalCommitted: committed,
      totalSpent: spent,
      availableBalance: available,
      utilizationPercentage: utilization,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    };
  });
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
      pendingRequestsAmount: 0,
      pendingDisbursementCount: 0,
      pendingDisbursementAmount: 0,
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
  const pendingRequests = requests.filter((r: any) => r.status === 'submitted' || r.status === 'under_review');
  const pendingRequestsCount = pendingRequests.length;
  const pendingRequestsAmount = pendingRequests.reduce((sum: number, r: any) => sum + Number(r.total_amount || 0), 0);

  const pendingDisbursements = requests.filter((r: any) => r.status === 'approved' || r.status === 'partially_paid');
  const pendingDisbursementCount = pendingDisbursements.length;
  const pendingDisbursementAmount = pendingDisbursements.reduce(
    (sum: number, r: any) => sum + Math.max(0, Number(r.total_amount || 0) - Number(r.paid_amount || 0)),
    0
  );

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
    recordedIncome: totalBudget,
    pendingRequestsCount,
    pendingRequestsAmount,
    pendingApprovalsCount: pendingRequestsCount,
    pendingDisbursementCount,
    pendingDisbursementAmount,
    outstandingPaymentsAmount: pendingDisbursementAmount,
    outstandingPaymentsCount: pendingDisbursementCount,
  };
};

/**
 * Retrieve all income and grant receipts directly from budgets and grant allocations.
 */
export const getIncomeRecords = async (): Promise<IncomeRecord[]> => {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('budgets')
    .select('*, project:projects(name)')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((b: any, idx: number) => ({
    id: b.id,
    referenceNumber: `INC-${b.fiscal_year || '2026'}-${String(idx + 1).padStart(3, '0')}`,
    source: b.category === 'operational' ? 'Institutional Funding' : 'Donor Grant Allocation',
    donorName: b.project?.name ? `${b.project.name} Partner` : 'General Operations Fund',
    projectId: b.project_id,
    projectName: b.project?.name || 'Institutional / General',
    amount: Number(b.allocated_amount || 0),
    currency: b.currency || 'TZS',
    date: b.created_at?.slice(0, 10) || '2026-01-01',
    status: b.status === 'active' ? 'confirmed' : 'pending',
    category: b.category,
    notes: b.notes || undefined,
  }));
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

export interface ProjectFinancialMetric {
  projectId: string;
  projectCode: string;
  projectName: string;
  funder: string;
  totalBudget: number;
  totalSpent: number;
  totalCommitted: number;
  availableBalance: number;
  utilizationRate: number;
  requisitionsCount: number;
}

/**
 * Retrieve project-scoped financial tracking metrics.
 */
export const getProjectFinancialTracking = async (): Promise<ProjectFinancialMetric[]> => {
  if (!isSupabaseConfigured) return [];

  const [projectsRes, budgetsRes, requestsRes] = await Promise.all([
    supabase.from('projects').select('id, project_code, name, funder, total_budget, status').order('created_at', { ascending: false }),
    supabase.from('budgets').select('id, project_id, allocated_amount'),
    supabase.from('financial_requests').select('id, project_id, total_amount, paid_amount, status'),
  ]);

  if (projectsRes.error || !projectsRes.data) return [];

  const projects = projectsRes.data;
  const budgets = budgetsRes.data || [];
  const requests = requestsRes.data || [];

  return projects.map((p: any) => {
    const projectBudgets = budgets.filter((b: any) => b.project_id === p.id);
    const allocated = projectBudgets.length > 0
      ? projectBudgets.reduce((sum: number, b: any) => sum + Number(b.allocated_amount || 0), 0)
      : Number(p.total_budget || 0);

    const projectReqs = requests.filter((r: any) => r.project_id === p.id);
    const spent = projectReqs.reduce((sum: number, r: any) => sum + Number(r.paid_amount || 0), 0);
    const committed = projectReqs
      .filter((r: any) => r.status === 'approved')
      .reduce((sum: number, r: any) => sum + Math.max(0, Number(r.total_amount || 0) - Number(r.paid_amount || 0)), 0);

    const available = Math.max(0, allocated - (spent + committed));
    const utilization = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;

    return {
      projectId: p.id,
      projectCode: p.project_code || 'PRJ',
      projectName: p.name,
      funder: p.funder || 'Babawatoto Core Fund',
      totalBudget: allocated,
      totalSpent: spent,
      totalCommitted: committed,
      availableBalance: available,
      utilizationRate: utilization,
      requisitionsCount: projectReqs.length,
    };
  });
};

export interface ProcurementFinancialHandoverItem {
  id: string;
  orderNumber: string;
  title: string;
  vendorName: string;
  totalAmount: number;
  currency: string;
  status: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  paidAmount: number;
  requestId?: string;
}

/**
 * Retrieve procurement orders and invoices for financial processing.
 */
export const getProcurementFinancialHandover = async (): Promise<ProcurementFinancialHandoverItem[]> => {
  if (!isSupabaseConfigured) return [];

  const [ordersRes, requestsRes] = await Promise.all([
    supabase.from('purchase_orders').select('*, vendor:vendors(business_name)').order('created_at', { ascending: false }),
    supabase.from('financial_requests').select('id, request_number, total_amount, paid_amount, status, title').eq('request_type', 'procurement'),
  ]);

  const orders = ordersRes.data || [];
  const procReqs = requestsRes.data || [];

  return orders.map((o: any) => {
    // Find matching financial requisition if any
    const matchedReq = procReqs.find((r: any) => r.title.includes(o.order_number) || r.request_number === o.order_number);
    const total = Number(o.total_amount || 0);
    const paid = matchedReq ? Number(matchedReq.paid_amount || 0) : (o.status === 'delivered' ? total : 0);
    const paymentStatus: 'unpaid' | 'partially_paid' | 'paid' = paid >= total && total > 0
      ? 'paid'
      : (paid > 0 ? 'partially_paid' : 'unpaid');

    return {
      id: o.id,
      orderNumber: o.order_number,
      title: o.title,
      vendorName: o.vendor?.business_name || 'Vendor',
      totalAmount: total,
      currency: o.currency || 'TZS',
      status: o.status,
      orderDate: o.order_date,
      expectedDeliveryDate: o.expected_delivery_date,
      paymentStatus,
      paidAmount: paid,
      requestId: matchedReq?.id,
    };
  });
};

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

/**
 * Retrieve all financial documents, vouchers, receipts, and supporting attachments.
 */
export const getFinancialDocuments = async (): Promise<FinancialDocumentItem[]> => {
  if (!isSupabaseConfigured) return [];

  const [txRes, docsRes] = await Promise.all([
    supabase.from('transactions').select('id, transaction_number, payment_reference, payee_name, payment_date, amount, currency, notes').order('created_at', { ascending: false }),
    supabase.from('request_documents').select('request_id, document_id, document_type, attached_at, document:documents(title, reference_number, description)').limit(50),
  ]);

  const items: FinancialDocumentItem[] = [];

  // Vouchers and receipts from transactions
  (txRes.data || []).forEach((t: any) => {
    items.push({
      id: t.id,
      title: `Disbursement Voucher - ${t.payee_name} (${t.currency} ${Number(t.amount).toLocaleString()})`,
      documentType: 'Payment Voucher',
      referenceNumber: t.payment_reference || t.transaction_number,
      relatedEntity: t.payee_name,
      uploadedAt: t.payment_date,
      source: 'transaction_receipt',
    });
  });

  // Attached request documents
  (docsRes.data || []).forEach((d: any) => {
    items.push({
      id: d.document_id,
      title: d.document?.title || 'Attached Evidence',
      documentType: d.document_type || 'Receipt / Invoice',
      referenceNumber: d.document?.reference_number || `DOC-${d.document_id.substring(0, 8).toUpperCase()}`,
      relatedEntity: 'Financial Requisition',
      fileSize: undefined,
      uploadedAt: d.attached_at,
      source: 'requisition_attachment',
    });
  });

  return items;
};


