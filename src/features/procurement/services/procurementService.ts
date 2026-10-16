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

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      vendor_code: vendorCode,
      business_name: input.businessName.trim(),
      category: input.category,
      contact_person: input.contactPerson.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      physical_address: input.physicalAddress.trim(),
      tin_number: input.tinNumber?.trim() || null,
      vrn_number: input.vrnNumber?.trim() || null,
      bank_name: input.bankName?.trim() || null,
      bank_account_number: input.bankAccountNumber?.trim() || null,
      is_compliant: true,
      rating_score: 5.0,
    })
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
    isCompliant: data.is_compliant,
    totalOrdersCount: 0,
    ratingScore: Number(data.rating_score),
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

export async function getProcurementKpis(): Promise<ProcurementKpis> {
  if (!isSupabaseConfigured) {
    return {
      totalOrdersCount: 0,
      activeOrdersAmount: 0,
      deliveredOrdersCount: 0,
      registeredVendorsCount: 0,
      lowStockItemsCount: 0,
    };
  }

  const [ordersRes, vendorsRes, invRes] = await Promise.all([
    supabase.from('purchase_orders').select('status, total_amount'),
    supabase.from('vendors').select('id', { count: 'exact' }),
    supabase.from('inventory_items').select('status'),
  ]);

  const orders = ordersRes.data || [];
  const activeAmount = orders
    .filter((o: any) => o.status === 'ordered' || o.status === 'pending_approval' || o.status === 'approved')
    .reduce((sum: number, o: any) => sum + Number(o.total_amount), 0);

  const deliveredCount = orders.filter((o: any) => o.status === 'delivered').length;
  const inventory = invRes.data || [];
  const lowStockCount = inventory.filter((i: any) => i.status === 'low_stock' || i.status === 'out_of_stock').length;

  return {
    totalOrdersCount: orders.length,
    activeOrdersAmount: activeAmount,
    deliveredOrdersCount: deliveredCount,
    registeredVendorsCount: vendorsRes.count || (vendorsRes.data?.length ?? 0),
    lowStockItemsCount: lowStockCount,
  };
}
