import { getPersistentItem, setPersistentItem } from '@/lib/storageSync';
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
import {
  INITIAL_MOCK_PURCHASE_ORDERS,
  INITIAL_MOCK_VENDORS,
  INITIAL_MOCK_INVENTORY,
} from '../data/mockProcurement';

const STORAGE_KEYS = {
  PURCHASE_ORDERS: 'baoms_procurement_po',
  VENDORS: 'baoms_procurement_vendors',
  INVENTORY: 'baoms_procurement_inventory',
};

let mockPOs: PurchaseOrderRecord[] = getPersistentItem(
  STORAGE_KEYS.PURCHASE_ORDERS,
  () => JSON.parse(JSON.stringify(INITIAL_MOCK_PURCHASE_ORDERS))
);

let mockVendors: VendorRecord[] = getPersistentItem(
  STORAGE_KEYS.VENDORS,
  () => JSON.parse(JSON.stringify(INITIAL_MOCK_VENDORS))
);

let mockInventory: InventoryItemRecord[] = getPersistentItem(
  STORAGE_KEYS.INVENTORY,
  () => JSON.parse(JSON.stringify(INITIAL_MOCK_INVENTORY))
);

const syncState = () => {
  setPersistentItem(STORAGE_KEYS.PURCHASE_ORDERS, mockPOs);
  setPersistentItem(STORAGE_KEYS.VENDORS, mockVendors);
  setPersistentItem(STORAGE_KEYS.INVENTORY, mockInventory);
};

export async function getPurchaseOrders(params?: {
  status?: string;
  vendorId?: string;
  searchQuery?: string;
}): Promise<PurchaseOrderRecord[]> {
  let list = [...mockPOs];

  if (params?.status && params.status !== 'all') {
    list = list.filter((p) => p.status === params.status);
  }

  if (params?.vendorId && params.vendorId !== 'all') {
    list = list.filter((p) => p.vendorId === params.vendorId);
  }

  if (params?.searchQuery) {
    const q = params.searchQuery.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.orderNumber.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput,
  currentUser?: { id: string; name: string }
): Promise<PurchaseOrderRecord> {
  const vendor = mockVendors.find((v) => v.id === input.vendorId);
  if (!vendor) throw new Error('Selected vendor was not found in register.');

  const author = currentUser || { id: 'procurement-officer', name: 'Bakari H. Mhando' };
  const poId = `po-${Date.now()}`;
  const orderNumber = `PO-${new Date().getFullYear()}-${String(mockPOs.length + 1).padStart(3, '0')}`;

  const items = input.items.map((it, idx) => ({
    id: `poi-${Date.now()}-${idx + 1}`,
    orderId: poId,
    description: it.description,
    quantity: it.quantity,
    unitOfMeasure: it.unitOfMeasure,
    unitPrice: it.unitPrice,
    totalPrice: it.quantity * it.unitPrice,
  }));

  const totalAmount = items.reduce((sum, it) => sum + it.totalPrice, 0);

  const newPO: PurchaseOrderRecord = {
    id: poId,
    orderNumber,
    projectId: input.projectId || null,
    vendorId: vendor.id,
    vendorName: vendor.businessName,
    title: input.title.trim(),
    status: 'pending_approval',
    requestedBy: author.id,
    requestedByName: author.name,
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: input.expectedDeliveryDate,
    currency: input.currency || 'TZS',
    totalAmount,
    items,
    notes: input.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockPOs.unshift(newPO);
  vendor.totalOrdersCount += 1;
  syncState();
  return newPO;
}

export async function updatePurchaseOrderStatus(
  orderId: string,
  newStatus: PurchaseOrderStatus,
  approver?: { id: string; name: string }
): Promise<PurchaseOrderRecord> {
  const po = mockPOs.find((p) => p.id === orderId);
  if (!po) throw new Error('Purchase order not found.');

  po.status = newStatus;
  po.updatedAt = new Date().toISOString();

  if (newStatus === 'approved' && approver) {
    po.approvedBy = approver.id;
    po.approvedByName = approver.name;
  }

  if (newStatus === 'delivered') {
    po.deliveredDate = new Date().toISOString();
  }

  syncState();
  return po;
}

export async function getVendors(params?: {
  category?: string;
  searchQuery?: string;
}): Promise<VendorRecord[]> {
  let list = [...mockVendors];

  if (params?.category && params.category !== 'all') {
    list = list.filter((v) => v.category === params.category);
  }

  if (params?.searchQuery) {
    const q = params.searchQuery.toLowerCase().trim();
    list = list.filter(
      (v) =>
        v.businessName.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q) ||
        v.vendorCode.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function registerVendor(input: RegisterVendorInput): Promise<VendorRecord> {
  const vendorId = `ven-${Date.now()}`;
  const vendorCode = `VND-${new Date().getFullYear()}-${String(mockVendors.length + 1).padStart(3, '0')}`;

  const newVendor: VendorRecord = {
    id: vendorId,
    vendorCode,
    businessName: input.businessName.trim(),
    category: input.category,
    contactPerson: input.contactPerson.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    physicalAddress: input.physicalAddress.trim(),
    tinNumber: input.tinNumber?.trim(),
    vrnNumber: input.vrnNumber?.trim(),
    bankName: input.bankName?.trim(),
    bankAccountNumber: input.bankAccountNumber?.trim(),
    isCompliant: true,
    totalOrdersCount: 0,
    ratingScore: 5.0,
    createdAt: new Date().toISOString(),
  };

  mockVendors.unshift(newVendor);
  syncState();
  return newVendor;
}

export async function getInventoryItems(params?: {
  status?: string;
  category?: string;
  searchQuery?: string;
}): Promise<InventoryItemRecord[]> {
  let list = [...mockInventory];

  if (params?.status && params.status !== 'all') {
    list = list.filter((i) => i.status === params.status);
  }

  if (params?.category && params.category !== 'all') {
    list = list.filter((i) => i.category === params.category);
  }

  if (params?.searchQuery) {
    const q = params.searchQuery.toLowerCase().trim();
    list = list.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function updateInventoryQuantity(
  input: UpdateInventoryInput
): Promise<InventoryItemRecord> {
  const item = mockInventory.find((i) => i.id === input.itemId);
  if (!item) throw new Error('Inventory item not found.');

  item.quantityOnHand = Math.max(0, item.quantityOnHand + input.quantityChange);

  if (item.quantityOnHand === 0) {
    item.status = 'out_of_stock';
  } else if (item.quantityOnHand <= item.reorderPoint) {
    item.status = 'low_stock';
  } else {
    item.status = 'in_stock';
  }

  if (input.quantityChange > 0) {
    item.lastRestockedAt = new Date().toISOString().slice(0, 10);
  }

  syncState();
  return item;
}

export async function getProcurementKpis(): Promise<ProcurementKpis> {
  const activeOrdersAmount = mockPOs
    .filter((p) => p.status === 'ordered' || p.status === 'pending_approval' || p.status === 'approved')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const deliveredOrdersCount = mockPOs.filter((p) => p.status === 'delivered').length;
  const lowStockItemsCount = mockInventory.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock').length;

  return {
    totalOrdersCount: mockPOs.length,
    activeOrdersAmount,
    deliveredOrdersCount,
    registeredVendorsCount: mockVendors.length,
    lowStockItemsCount,
  };
}
