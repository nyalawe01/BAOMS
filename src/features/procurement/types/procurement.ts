/**
 * BAOMS Procurement & Supply Chain Domain Types
 * Babawatoto Organization Management System
 */

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'ordered'
  | 'delivered'
  | 'cancelled';

export type VendorCategory =
  | 'stationery_printing'
  | 'theater_art_supplies'
  | 'venue_catering'
  | 'transport_logistics'
  | 'it_hardware'
  | 'general_services';

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrderRecord {
  id: string;
  orderNumber: string;
  projectId?: string | null;
  projectName?: string;
  vendorId: string;
  vendorName: string;
  title: string;
  status: PurchaseOrderStatus;
  requestedBy: string;
  requestedByName: string;
  approvedBy?: string | null;
  approvedByName?: string;
  orderDate: string;
  expectedDeliveryDate: string;
  deliveredDate?: string | null;
  currency: string;
  totalAmount: number;
  items: PurchaseOrderItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorRecord {
  id: string;
  vendorCode: string;
  businessName: string;
  category: VendorCategory;
  contactPerson: string;
  email: string;
  phone: string;
  physicalAddress: string;
  tinNumber?: string;
  vrnNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  isCompliant: boolean;
  totalOrdersCount: number;
  ratingScore: number; // 1-5
  createdAt: string;
}

export interface InventoryItemRecord {
  id: string;
  sku: string;
  name: string;
  category: VendorCategory;
  quantityOnHand: number;
  reorderPoint: number;
  unitOfMeasure: string;
  unitCost: number;
  location: string;
  status: InventoryStatus;
  lastRestockedAt?: string;
}

export interface ProcurementKpis {
  totalOrdersCount: number;
  activeOrdersAmount: number;
  deliveredOrdersCount: number;
  registeredVendorsCount: number;
  lowStockItemsCount: number;
}

export interface CreatePurchaseOrderInput {
  projectId?: string;
  vendorId: string;
  title: string;
  expectedDeliveryDate: string;
  currency?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitOfMeasure: string;
    unitPrice: number;
  }>;
  notes?: string;
}

export interface RegisterVendorInput {
  businessName: string;
  category: VendorCategory;
  contactPerson: string;
  email: string;
  phone: string;
  physicalAddress: string;
  tinNumber?: string;
  vrnNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
}

export interface UpdateInventoryInput {
  itemId: string;
  quantityChange: number; // positive to restock, negative to dispense
  reason: string;
  movementType?: 'received' | 'dispensed' | 'adjusted';
  updatedBy?: string;
}
