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
  | 'general_services'
  | 'other'
  | (string & {});

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
  phones?: Array<{ id: string; number: string; type: string; isPrimary?: boolean }>;
  emails?: Array<{ id: string; email: string; type: string; isPrimary?: boolean }>;
  addresses?: Array<{ id: string; address: string; city: string; region?: string; type: string; isPrimary?: boolean }>;
  bankAccounts?: Array<{ id: string; bankName: string; accountName: string; accountNumber: string; branch: string; currency: string; isPrimary?: boolean }>;
  supportingDocuments?: Array<{ id: string; name: string; tag?: string; customName?: string; url?: string; size?: string }>;
  paymentTerms?: string;
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

export interface PurchaseRequestRecord {
  id: string;
  requestNumber: string;
  projectId?: string | null;
  projectName?: string;
  requesterId: string;
  requesterName: string;
  title: string;
  purpose: string;
  totalAmount: number;
  currency: string;
  status: string;
  priority: 'low' | 'normal' | 'urgent';
  dueDate?: string | null;
  itemsCount: number;
  submittedAt: string;
  approvedAt?: string | null;
}

export interface ProcurementPlanRecord {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  category: string;
  estimatedCost: number;
  currency: string;
  plannedQuarter: string;
  plannedDate: string;
  status: 'planned' | 'in_progress' | 'completed' | 'deferred';
  responsibleOfficer: string;
}

export interface QuotationRecord {
  id: string;
  quotationNumber: string;
  vendorId: string;
  vendorName: string;
  requestTitle: string;
  quotedAmount: number;
  currency: string;
  submissionDate: string;
  validUntil: string;
  status: 'pending_review' | 'under_evaluation' | 'recommended' | 'rejected' | 'accepted';
  deliveryLeadDays: number;
  notes?: string;
  documentUrl?: string;
}

export interface DeliveryRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  vendorName: string;
  deliveryDate?: string | null;
  expectedDate: string;
  itemsDeliveredSummary: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  verificationStatus: 'pending' | 'verified_complete' | 'discrepancy_noted' | 'rejected';
  receivedBy: string;
  notes?: string;
}

export interface ProcurementInvoiceRecord {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  vendorName: string;
  invoiceDate: string;
  amount: number;
  currency: string;
  verificationStatus: 'verified' | 'pending_verification' | 'disputed';
  handoverStatus: 'awaiting_handover' | 'handed_to_finance' | 'payment_scheduled' | 'cleared';
  handedOverAt?: string;
  handedOverBy?: string;
}

export interface ProcurementDashboardKpis {
  pendingPurchaseRequestsCount: number;
  activeProcurementCount: number;
  pendingQuotationsCount: number;
  purchaseOrdersInProgressCount: number;
  pendingDeliveriesCount: number;
  invoicesAwaitingHandoverCount: number;
}

export interface ProcurementKpis extends ProcurementDashboardKpis {
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
  supportingDocuments?: Array<{ id: string; name: string; customName?: string; tag?: string }>;
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
  phones?: Array<{ id: string; number: string; type: string; isPrimary?: boolean }>;
  emails?: Array<{ id: string; email: string; type: string; isPrimary?: boolean }>;
  addresses?: Array<{ id: string; address: string; city: string; region?: string; type: string; isPrimary?: boolean }>;
  bankAccounts?: Array<{ id: string; bankName: string; accountName: string; accountNumber: string; branch: string; currency: string; isPrimary?: boolean }>;
  supportingDocuments?: Array<{ id: string; name: string; customName?: string; tag?: string }>;
  paymentTerms?: string;
}

export interface UpdateInventoryInput {
  itemId: string;
  quantityChange: number; // positive to restock, negative to dispense
  reason: string;
  movementType?: 'received' | 'dispensed' | 'adjusted';
  updatedBy?: string;
}

