import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  PurchaseOrderRecord,
  VendorRecord,
  InventoryItemRecord,
  ProcurementKpis,
  CreatePurchaseOrderInput,
  RegisterVendorInput,
  UpdateInventoryInput,
  PurchaseOrderStatus,
  PurchaseRequestRecord,
  ProcurementPlanRecord,
  QuotationRecord,
  DeliveryRecord,
  ProcurementInvoiceRecord,
} from '../types/procurement';

export async function getPurchaseOrders(params?: {
  status?: string;
  vendorId?: string;
  searchQuery?: string;
}): Promise<PurchaseOrderRecord[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('purchase_orders')
    .select('*, vendor:vendors(business_name), requester:profiles!requested_by(display_name), approver:profiles!approved_by(display_name)')
    .order('created_at', { ascending: false });

  if (params?.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params?.vendorId && params.vendorId !== 'all') {
    query = query.eq('vendor_id', params.vendorId);
  }
  if (params?.searchQuery) {
    const q = params.searchQuery.trim();
    query = query.or(`order_number.ilike.%${q}%,title.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    orderNumber: row.order_number,
    projectId: row.project_id,
    vendorId: row.vendor_id,
    vendorName: row.vendor?.business_name || 'Vendor',
    title: row.title,
    status: row.status as PurchaseOrderStatus,
    requestedBy: row.requested_by || '',
    requestedByName: row.requester?.display_name || 'Staff Member',
    approvedBy: row.approved_by,
    approvedByName: row.approver?.display_name,
    orderDate: row.order_date,
    expectedDeliveryDate: row.expected_delivery_date,
    deliveredDate: row.delivered_date,
    currency: row.currency,
    totalAmount: Number(row.total_amount),
    items: [],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput,
  currentUser?: { id: string; name: string }
): Promise<PurchaseOrderRecord> {
  if (!isSupabaseConfigured) throw new Error('Database connection is not configured.');

  const orderNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const totalAmount = input.items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);

  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({
      order_number: orderNumber,
      project_id: input.projectId || null,
      vendor_id: input.vendorId,
      title: input.title.trim(),
      status: 'pending_approval',
      requested_by: currentUser?.id || null,
      order_date: new Date().toISOString().slice(0, 10),
      expected_delivery_date: input.expectedDeliveryDate,
      currency: input.currency || 'TZS',
      total_amount: totalAmount,
      notes: input.notes || null,
    })
    .select('*, vendor:vendors(business_name)')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create purchase order in database.');
  }

  // Insert items
  if (input.items.length > 0) {
    await supabase.from('purchase_order_items').insert(
      input.items.map((it) => ({
        order_id: data.id,
        description: it.description,
        quantity: it.quantity,
        unit_of_measure: it.unitOfMeasure,
        unit_price: it.unitPrice,
        total_price: it.quantity * it.unitPrice,
      }))
    );
  }

  return {
    id: data.id,
    orderNumber: data.order_number,
    projectId: data.project_id,
    vendorId: data.vendor_id,
    vendorName: data.vendor?.business_name || 'Vendor',
    title: data.title,
    status: data.status,
    requestedBy: data.requested_by,
    requestedByName: currentUser?.name || 'Staff Member',
    orderDate: data.order_date,
    expectedDeliveryDate: data.expected_delivery_date,
    currency: data.currency,
    totalAmount: Number(data.total_amount),
    items: input.items.map((it, idx) => ({
      id: `item-${idx}`,
      orderId: data.id,
      description: it.description,
      quantity: it.quantity,
      unitOfMeasure: it.unitOfMeasure,
      unitPrice: it.unitPrice,
      totalPrice: it.quantity * it.unitPrice,
    })),
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updatePurchaseOrderStatus(
  orderId: string,
  newStatus: PurchaseOrderStatus,
  approver?: { id: string; name: string }
): Promise<PurchaseOrderRecord> {
  if (!isSupabaseConfigured) throw new Error('Database connection is not configured.');

  const updatePayload: Record<string, any> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'approved' && approver) {
    updatePayload.approved_by = approver.id;
  }
  if (newStatus === 'delivered') {
    updatePayload.delivered_date = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .update(updatePayload)
    .eq('id', orderId)
    .select('*, vendor:vendors(business_name)')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to update order status.');

  return {
    id: data.id,
    orderNumber: data.order_number,
    projectId: data.project_id,
    vendorId: data.vendor_id,
    vendorName: data.vendor?.business_name || 'Vendor',
    title: data.title,
    status: data.status,
    requestedBy: data.requested_by,
    requestedByName: 'Staff Member',
    approvedBy: data.approved_by,
    approvedByName: approver?.name,
    orderDate: data.order_date,
    expectedDeliveryDate: data.expected_delivery_date,
    deliveredDate: data.delivered_date,
    currency: data.currency,
    totalAmount: Number(data.total_amount),
    items: [],
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getVendors(params?: {
  category?: string;
  searchQuery?: string;
}): Promise<VendorRecord[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('vendors')
    .select('*')
    .order('business_name', { ascending: true });

  if (params?.category && params.category !== 'all') {
    query = query.eq('category', params.category);
  }
  if (params?.searchQuery) {
    const q = params.searchQuery.trim();
    query = query.or(`business_name.ilike.%${q}%,contact_person.ilike.%${q}%,vendor_code.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((v: any) => ({
    id: v.id,
    vendorCode: v.vendor_code,
    businessName: v.business_name,
    category: v.category,
    contactPerson: v.contact_person,
    email: v.email,
    phone: v.phone,
    physicalAddress: v.physical_address,
    tinNumber: v.tin_number,
    vrnNumber: v.vrn_number,
    bankName: v.bank_name,
    bankAccountNumber: v.bank_account_number,
    isCompliant: v.is_compliant,
    totalOrdersCount: 0,
    ratingScore: Number(v.rating_score),
    createdAt: v.created_at,
  }));
}

export async function registerVendor(input: RegisterVendorInput): Promise<VendorRecord> {
  if (!isSupabaseConfigured) throw new Error('Database connection is not configured.');

  const vendorCode = `VND-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const primaryPhone = input.phones?.find((p) => p.isPrimary)?.number || input.phone || '';
  const primaryEmail = input.emails?.find((e) => e.isPrimary)?.email || input.email || '';
  const primaryAddress = input.addresses?.find((a) => a.isPrimary)?.address || input.physicalAddress || '';
  const primaryBank = input.bankAccounts?.find((b) => b.isPrimary);

  const metaPayload = {
    phones: input.phones || [],
    emails: input.emails || [],
    addresses: input.addresses || [],
    bankAccounts: input.bankAccounts || [],
    supportingDocuments: input.supportingDocuments || [],
    paymentTerms: input.paymentTerms || '30_days_net',
  };

  const insertPayload: Record<string, any> = {
    vendor_code: vendorCode,
    business_name: input.businessName.trim(),
    category: input.category,
    contact_person: input.contactPerson.trim(),
    email: primaryEmail.trim(),
    phone: primaryPhone.trim(),
    physical_address: primaryAddress.trim(),
    tin_number: input.tinNumber?.trim() || null,
    vrn_number: input.vrnNumber?.trim() || null,
    bank_name: primaryBank?.bankName || input.bankName?.trim() || null,
    bank_account_number: primaryBank?.accountNumber || input.bankAccountNumber?.trim() || null,
    is_compliant: true,
    rating_score: 5.0,
    notes: JSON.stringify(metaPayload),
  };

  const { data, error } = await supabase
    .from('vendors')
    .insert(insertPayload)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to register vendor.');

  return {
    id: data.id,
    vendorCode: data.vendor_code,
    businessName: data.business_name,
    category: data.category,
    contactPerson: data.contact_person,
    email: data.email,
    phone: data.phone,
    physicalAddress: data.physical_address,
    tinNumber: data.tin_number,
    vrnNumber: data.vrn_number,
    bankName: data.bank_name,
    bankAccountNumber: data.bank_account_number,
    phones: input.phones,
    emails: input.emails,
    addresses: input.addresses,
    bankAccounts: input.bankAccounts,
    supportingDocuments: input.supportingDocuments,
    paymentTerms: input.paymentTerms,
    isCompliant: data.is_compliant,
    totalOrdersCount: 0,
    ratingScore: Number(data.rating_score || 5.0),
    createdAt: data.created_at,
  };
}

export async function getInventoryItems(params?: {
  status?: string;
  category?: string;
  searchQuery?: string;
}): Promise<InventoryItemRecord[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('inventory_items')
    .select('*')
    .order('name', { ascending: true });

  if (params?.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params?.category && params.category !== 'all') {
    query = query.eq('category', params.category);
  }
  if (params?.searchQuery) {
    const q = params.searchQuery.trim();
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,location.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((i: any) => ({
    id: i.id,
    sku: i.sku,
    name: i.name,
    category: i.category,
    quantityOnHand: Number(i.quantity_on_hand),
    reorderPoint: Number(i.reorder_point),
    unitOfMeasure: i.unit_of_measure,
    unitCost: Number(i.unit_cost),
    location: i.location,
    status: i.status,
    lastRestockedAt: i.last_restocked_at,
  }));
}

export async function updateInventoryQuantity(
  input: UpdateInventoryInput
): Promise<InventoryItemRecord> {
  if (!isSupabaseConfigured) throw new Error('Database connection is not configured.');

  const { data: item, error: fetchErr } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', input.itemId)
    .single();

  if (fetchErr || !item) throw new Error('Inventory item not found.');

  const newQty = Math.max(0, Number(item.quantity_on_hand) + input.quantityChange);
  let status = 'in_stock';
  if (newQty === 0) status = 'out_of_stock';
  else if (newQty <= item.reorder_point) status = 'low_stock';

  const updatePayload: Record<string, any> = {
    quantity_on_hand: newQty,
    status,
    updated_at: new Date().toISOString(),
  };

  if (input.quantityChange > 0) {
    updatePayload.last_restocked_at = new Date().toISOString();
  }

  const { data: updated, error: updateErr } = await supabase
    .from('inventory_items')
    .update(updatePayload)
    .eq('id', input.itemId)
    .select()
    .single();

  if (updateErr || !updated) throw new Error(updateErr?.message || 'Failed to update inventory.');

  return {
    id: updated.id,
    sku: updated.sku,
    name: updated.name,
    category: updated.category,
    quantityOnHand: Number(updated.quantity_on_hand),
    reorderPoint: Number(updated.reorder_point),
    unitOfMeasure: updated.unit_of_measure,
    unitCost: Number(updated.unit_cost),
    location: updated.location,
    status: updated.status,
    lastRestockedAt: updated.last_restocked_at,
  };
}

export async function getPurchaseRequests(params?: {
  status?: string;
  projectId?: string;
  searchQuery?: string;
}): Promise<PurchaseRequestRecord[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('financial_requests')
    .select('*, requester:profiles!requester_id(display_name), project:projects(name)')
    .eq('request_type', 'procurement')
    .order('created_at', { ascending: false });

  if (params?.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params?.projectId && params.projectId !== 'all') {
    query = query.eq('project_id', params.projectId);
  }
  if (params?.searchQuery) {
    const q = params.searchQuery.trim();
    query = query.or(`request_number.ilike.%${q}%,title.ilike.%${q}%,purpose.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    requestNumber: r.request_number,
    projectId: r.project_id,
    projectName: r.project?.name,
    requesterId: r.requester_id,
    requesterName: r.requester?.display_name || 'Staff Member',
    title: r.title,
    purpose: r.purpose,
    totalAmount: Number(r.total_amount || 0),
    currency: r.currency || 'TZS',
    status: r.status,
    priority: (r.priority as 'low' | 'normal' | 'urgent') || 'normal',
    dueDate: r.due_date,
    itemsCount: 1,
    submittedAt: r.submitted_at || r.created_at,
    approvedAt: r.approved_at,
  }));
}

export async function getProcurementPlans(): Promise<ProcurementPlanRecord[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('budgets')
    .select('*, project:projects(name)')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((b: any) => ({
    id: b.id,
    projectId: b.project_id || '',
    projectName: b.project?.name || 'Institutional / General',
    title: b.name,
    category: b.category,
    estimatedCost: Number(b.allocated_amount || 0),
    currency: b.currency || 'TZS',
    plannedQuarter: b.fiscal_year || 'FY2026',
    plannedDate: b.created_at?.slice(0, 10) || '',
    status: b.status === 'active' ? 'in_progress' : 'planned',
    responsibleOfficer: 'Procurement Specialist',
  }));
}

export async function getQuotations(): Promise<QuotationRecord[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('entity_supporting_documents')
    .select('*')
    .eq('document_tag', 'quote')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((doc: any, idx: number) => ({
    id: doc.id,
    quotationNumber: `QT-${new Date(doc.created_at).getFullYear()}-${String(idx + 1).padStart(3, '0')}`,
    vendorId: doc.entity_id,
    vendorName: doc.custom_name?.split('-')[0]?.trim() || 'Vendor Quote',
    requestTitle: doc.custom_name || doc.original_name,
    quotedAmount: Number(doc.file_size || 0),
    currency: 'TZS',
    submissionDate: doc.created_at?.slice(0, 10) || '',
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    status: 'under_evaluation',
    deliveryLeadDays: 7,
    notes: doc.notes || undefined,
    documentUrl: doc.storage_path,
  }));
}

export async function getDeliveries(): Promise<DeliveryRecord[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, vendor:vendors(business_name)')
    .in('status', ['ordered', 'delivered'])
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((po: any) => ({
    id: po.id,
    orderId: po.id,
    orderNumber: po.order_number,
    vendorName: po.vendor?.business_name || 'Vendor',
    deliveryDate: po.delivered_date,
    expectedDate: po.expected_delivery_date || 'Pending',
    itemsDeliveredSummary: po.title,
    orderedQuantity: 1,
    deliveredQuantity: po.status === 'delivered' ? 1 : 0,
    verificationStatus: po.status === 'delivered' ? 'verified_complete' : 'pending',
    receivedBy: 'Procurement & Stores',
    notes: po.notes || undefined,
  }));
}

export async function getInvoicesForHandover(): Promise<ProcurementInvoiceRecord[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('financial_requests')
    .select('*, requester:profiles!requester_id(display_name)')
    .eq('request_type', 'procurement')
    .in('status', ['approved', 'partially_paid', 'paid'])
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    invoiceNumber: `INV-${r.request_number}`,
    orderNumber: r.request_number,
    vendorName: r.purpose?.slice(0, 30) || 'Approved Supplier',
    invoiceDate: r.submitted_at?.slice(0, 10) || r.created_at?.slice(0, 10),
    amount: Number(r.approved_amount || r.total_amount || 0),
    currency: r.currency || 'TZS',
    verificationStatus: 'verified',
    handoverStatus: r.status === 'paid' ? 'cleared' : (r.status === 'partially_paid' ? 'payment_scheduled' : 'awaiting_handover'),
    handedOverAt: r.approved_at,
    handedOverBy: r.approved_by,
  }));
}

export async function getProcurementKpis(): Promise<ProcurementKpis> {
  if (!isSupabaseConfigured) {
    return {
      totalOrdersCount: 0,
      activeOrdersAmount: 0,
      deliveredOrdersCount: 0,
      registeredVendorsCount: 0,
      lowStockItemsCount: 0,
      pendingPurchaseRequestsCount: 0,
      activeProcurementCount: 0,
      pendingQuotationsCount: 0,
      purchaseOrdersInProgressCount: 0,
      pendingDeliveriesCount: 0,
      invoicesAwaitingHandoverCount: 0,
    };
  }

  const [ordersRes, vendorsRes, invRes, reqsRes, docsRes] = await Promise.all([
    supabase.from('purchase_orders').select('status, total_amount'),
    supabase.from('vendors').select('id', { count: 'exact' }),
    supabase.from('inventory_items').select('status'),
    supabase.from('financial_requests').select('status, request_type, total_amount'),
    supabase.from('entity_supporting_documents').select('id, document_tag'),
  ]);

  const orders = ordersRes.data || [];
  const activeOrders = orders.filter((o: any) => o.status === 'ordered' || o.status === 'pending_approval' || o.status === 'approved');
  const activeAmount = activeOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
  const deliveredCount = orders.filter((o: any) => o.status === 'delivered').length;
  const inProgressPOCount = activeOrders.length;
  const pendingDeliveriesCount = orders.filter((o: any) => o.status === 'ordered').length;

  const inventory = invRes.data || [];
  const lowStockCount = inventory.filter((i: any) => i.status === 'low_stock' || i.status === 'out_of_stock').length;

  const reqs = reqsRes.data || [];
  const procurementReqs = reqs.filter((r: any) => r.request_type === 'procurement');
  const pendingReqsCount = procurementReqs.filter((r: any) => r.status === 'submitted' || r.status === 'under_review').length;
  const invoicesAwaitingCount = procurementReqs.filter((r: any) => r.status === 'approved').length;

  const docs = docsRes.data || [];
  const quotesCount = docs.filter((d: any) => d.document_tag === 'quote').length;

  return {
    totalOrdersCount: orders.length,
    activeOrdersAmount: activeAmount,
    deliveredOrdersCount: deliveredCount,
    registeredVendorsCount: vendorsRes.count || (vendorsRes.data?.length ?? 0),
    lowStockItemsCount: lowStockCount,
    pendingPurchaseRequestsCount: pendingReqsCount,
    activeProcurementCount: inProgressPOCount + pendingReqsCount,
    pendingQuotationsCount: quotesCount,
    purchaseOrdersInProgressCount: inProgressPOCount,
    pendingDeliveriesCount: pendingDeliveriesCount,
    invoicesAwaitingHandoverCount: invoicesAwaitingCount,
  };
}
