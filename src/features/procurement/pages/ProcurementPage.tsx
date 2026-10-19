import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  Plus,
  Search,
  Filter,
  Building2,
  BarChart3,
  FileText,
  Calendar,
  FileSpreadsheet,
  Truck,
  Scale,
  ShieldCheck,
  Receipt,
  FolderOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { AnalyticsVisualizer, AnalyticsDataPoint } from '@/components/ui/AnalyticsVisualizer';
import { useAuth } from '@/features/auth/useAuth';
import { showSuccess, showError } from '@/lib/sweetAlert';
import {
  PurchaseOrderRecord,
  VendorRecord,
  InventoryItemRecord,
  ProcurementKpis,
  PurchaseOrderStatus,
  PurchaseRequestRecord,
  ProcurementPlanRecord,
  QuotationRecord,
  DeliveryRecord,
  ProcurementInvoiceRecord,
} from '../types/procurement';
import {
  getPurchaseOrders,
  updatePurchaseOrderStatus,
  getVendors,
  getInventoryItems,
  updateInventoryQuantity,
  getProcurementKpis,
  getPurchaseRequests,
  getProcurementPlans,
  getQuotations,
  getDeliveries,
  getInvoicesForHandover,
} from '../services/procurementService';
import { IssuePurchaseOrderPage } from './IssuePurchaseOrderPage';
import { RegisterVendorPage } from './RegisterVendorPage';
import { UpdateInventoryModal } from '../components/UpdateInventoryModal';

export type ProcurementTab =
  | 'requests'
  | 'plans'
  | 'quotations'
  | 'vendors'
  | 'orders'
  | 'receiving'
  | 'inventory'
  | 'evaluation'
  | 'approvals'
  | 'invoices'
  | 'documents'
  | 'reports';

interface ProcurementPageProps {
  initialTab?: ProcurementTab;
}

export const ProcurementPage: React.FC<ProcurementPageProps> = ({ initialTab = 'orders' }) => {
  const { user, profile, hasRole } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ProcurementTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItemRecord[]>([]);
  const [requests, setRequests] = useState<PurchaseRequestRecord[]>([]);
  const [plans, setPlans] = useState<ProcurementPlanRecord[]>([]);
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [invoices, setInvoices] = useState<ProcurementInvoiceRecord[]>([]);
  const [kpis, setKpis] = useState<ProcurementKpis>({
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
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals & Stepper state
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItemRecord | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [pos, vends, invs, kpiStats, reqs, planList, quoteList, delivList, invList] = await Promise.all([
        getPurchaseOrders({ status: statusFilter, searchQuery }),
        getVendors({ searchQuery }),
        getInventoryItems({ searchQuery }),
        getProcurementKpis(),
        getPurchaseRequests({ status: statusFilter, searchQuery }),
        getProcurementPlans(),
        getQuotations(),
        getDeliveries(),
        getInvoicesForHandover(),
      ]);

      setOrders(pos);
      setVendors(vends);
      setInventory(invs);
      setKpis(kpiStats);
      setRequests(reqs);
      setPlans(planList);
      setQuotations(quoteList);
      setDeliveries(delivList);
      setInvoices(invList);
    } catch (err) {
      console.error('Failed to load procurement data:', err);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle PO status progression
  const handleUpdateStatus = async (orderId: string, nextStatus: PurchaseOrderStatus) => {
    try {
      await updatePurchaseOrderStatus(orderId, nextStatus, {
        id: user?.id || 'officer',
        name: profile?.display_name || user?.email || 'Procurement Specialist',
      });
      await loadData();
      await showSuccess('Order status updated successfully.');
    } catch (err) {
      await showError('Error', (err as Error).message || 'Failed to update order.');
    }
  };

  // Analytics data points by vendor expenditure
  const vendorExpenditureData: AnalyticsDataPoint[] = useMemo(() => {
    const totals: Record<string, number> = {};
    orders.forEach((o) => {
      totals[o.vendorName] = (totals[o.vendorName] || 0) + o.totalAmount;
    });
    return Object.entries(totals).map(([label, value]) => ({
      label: label.length > 20 ? label.slice(0, 18) + '…' : label,
      value,
      description: 'Disbursed and pending orders',
    }));
  }, [orders]);

  // Inventory distribution by category
  const inventoryCategoryData: AnalyticsDataPoint[] = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach((i) => {
      const cat = i.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      counts[cat] = (counts[cat] || 0) + i.quantityOnHand;
    });
    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
      description: 'Stock units stored',
    }));
  }, [inventory]);

  const tabs: Array<{ id: ProcurementTab; label: string; path: string; count?: number; icon: any }> = [
    { id: 'orders', label: 'Purchase Orders', path: '/procurement/orders', count: orders.length, icon: ShoppingCart },
    { id: 'requests', label: 'Purchase Requests', path: '/procurement/requests', count: requests.length, icon: FileText },
    { id: 'plans', label: 'Procurement Plans', path: '/procurement/plans', count: plans.length, icon: Calendar },
    { id: 'quotations', label: 'Quotations', path: '/procurement/quotations', count: quotations.length, icon: FileSpreadsheet },
    { id: 'vendors', label: 'Supplier Register', path: '/procurement/vendors', count: vendors.length, icon: Building2 },
    { id: 'receiving', label: 'Goods Receiving', path: '/procurement/receiving', count: deliveries.length, icon: Truck },
    { id: 'inventory', label: 'Inventory & Supplies', path: '/procurement/inventory', count: inventory.length, icon: Package },
    { id: 'evaluation', label: 'Evaluation', path: '/procurement/evaluation', count: quotations.length, icon: Scale },
    { id: 'approvals', label: 'Approvals', path: '/procurement/approvals', count: orders.filter((o) => o.status === 'pending_approval').length, icon: ShieldCheck },
    { id: 'invoices', label: 'Invoices & Handover', path: '/procurement/invoices', count: invoices.length, icon: Receipt },
    { id: 'documents', label: 'Documents', path: '/procurement/documents', icon: FolderOpen },
    { id: 'reports', label: 'Reports & Analytics', path: '/procurement/reports', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement & Supply Chain Operations"
        subtitle="End-to-end management of vendor partnerships, purchase orders, materials inventory, and financial handovers."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Procurement & Supply Chain' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVendorModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-slate-700"
            >
              <Building2 className="w-4 h-4 text-[#374151]" />
              <span>Register Vendor</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPOModalOpen(true)}
              className="bg-[#D68904] hover:bg-[#b45309] text-white flex items-center gap-1.5 text-xs font-semibold"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Issue Purchase Order</span>
            </Button>
          </div>
        }
      />

      {/* KPI Cards Row (AdminCN style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-lg p-3">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
            Purchase Requests
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5 truncate">
            {kpis.pendingPurchaseRequestsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            Awaiting action
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-lg p-3">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
            Active Orders
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5 truncate">
            {kpis.purchaseOrdersInProgressCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            In pipeline
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-lg p-3">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
            Pending Quotations
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5 truncate">
            {kpis.pendingQuotationsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            Under evaluation
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-lg p-3">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
            Pending Deliveries
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5 truncate">
            {kpis.pendingDeliveriesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            Expected in stores
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-lg p-3">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
            Approved Vendors
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5 truncate">
            {kpis.registeredVendorsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            Compliant partners
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-lg p-3">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
            Invoices for Handover
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5 truncate">
            {kpis.invoicesAwaitingHandoverCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            Ready for Finance
          </div>
        </div>
      </div>

      {/* Tab Navigation - Horizontal Scrolling Container */}
      <div className="border-b border-slate-200/80 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery('');
                  navigate(tab.path);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-all border-b-2 ${
                  isActive
                    ? 'border-[#D68904] text-[#D68904] bg-amber-500/10 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#111827]' : 'text-[#4B5563]'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-[#D68904] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PO#, vendor, description..."
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="ordered">Ordered / In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>

          <Card className="overflow-hidden bg-white border border-slate-200/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">PO Reference</th>
                    <th className="py-2.5 px-4">Order Title & Items</th>
                    <th className="py-2.5 px-4">Vendor Partner</th>
                    <th className="py-2.5 px-4 text-right">Order Total</th>
                    <th className="py-2.5 px-4 text-left w-[140px]">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No purchase orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    orders.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                          {po.orderNumber}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900">{po.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Expected: {po.expectedDeliveryDate || 'N/A'} • Req by: {po.requestedByName}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 font-medium">
                          {po.vendorName}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono whitespace-nowrap">
                          {po.currency} {po.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-left w-[140px] whitespace-nowrap">
                          <StatusIndicator status={po.status} label={po.status.toUpperCase()} />
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {po.status === 'pending_approval' && (
                              (hasRole('executive_director') || hasRole('system_admin')) ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(po.id, 'approved')}
                                  className="text-xs text-emerald-700 hover:bg-emerald-50 h-7 px-2"
                                >
                                  Approve
                                </Button>
                              ) : (
                                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  Awaiting Approval
                                </span>
                              )
                            )}

                            {po.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(po.id, 'ordered')}
                                className="text-xs text-blue-700 hover:bg-blue-50 h-7 px-2"
                              >
                                Mark Ordered
                              </Button>
                            )}

                            {po.status === 'ordered' && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleUpdateStatus(po.id, 'delivered')}
                                className="text-xs bg-[#D68904] hover:bg-[#b45309] text-white h-7 px-2"
                              >
                                Confirm Delivery
                              </Button>
                            )}

                            {po.status === 'delivered' && (
                              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                                Delivered & Verified
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: PURCHASE REQUESTS */}
      {activeTab === 'requests' && (
        <Card className="overflow-hidden bg-white border border-slate-200/80">
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Purchase Requisitions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Procurement requests submitted across departments and field projects</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/finance/requisitions/new')}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Requisition
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Request #</th>
                  <th className="py-2.5 px-4">Title & Purpose</th>
                  <th className="py-2.5 px-4">Requester</th>
                  <th className="py-2.5 px-4">Project</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No purchase requisitions recorded.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{r.requestNumber}</td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{r.title}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{r.purpose}</div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{r.requesterName}</td>
                      <td className="py-2.5 px-4 text-slate-600">{r.projectName || 'Institutional'}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {r.currency} {r.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <StatusIndicator status={r.status} label={r.status.toUpperCase()} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: PROCUREMENT PLANS */}
      {activeTab === 'plans' && (
        <Card className="overflow-hidden bg-white border border-slate-200/80">
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-900">Procurement Planning & Budget Allocations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Planned operational supplies, equipment procurements, and implementation schedules</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Project / Scope</th>
                  <th className="py-2.5 px-4">Procurement Item</th>
                  <th className="py-2.5 px-4">Fiscal Period</th>
                  <th className="py-2.5 px-4 text-right">Estimated Cost</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No procurement plans scheduled yet.
                    </td>
                  </tr>
                ) : (
                  plans.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{p.projectName}</td>
                      <td className="py-2.5 px-4 text-slate-700">{p.title}</td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono">{p.plannedQuarter}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {p.currency} {p.estimatedCost.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: QUOTATION MANAGEMENT */}
      {activeTab === 'quotations' && (
        <Card className="overflow-hidden bg-white border border-slate-200/80">
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Quotation Management & Comparisons</h3>
              <p className="text-xs text-slate-500 mt-0.5">Supplier bids, proforma invoices, pricing comparisons, and delivery timelines</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Quotation #</th>
                  <th className="py-2.5 px-4">Supplier / Vendor</th>
                  <th className="py-2.5 px-4">Description / Scope</th>
                  <th className="py-2.5 px-4">Validity</th>
                  <th className="py-2.5 px-4 text-right">Quoted Amount</th>
                  <th className="py-2.5 px-4 text-right">Evaluation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No quotation documents logged in repository.
                    </td>
                  </tr>
                ) : (
                  quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{q.quotationNumber}</td>
                      <td className="py-2.5 px-4 text-slate-800 font-medium">{q.vendorName}</td>
                      <td className="py-2.5 px-4 text-slate-600">{q.requestTitle}</td>
                      <td className="py-2.5 px-4 text-slate-500">{q.validUntil}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {q.currency} {q.quotedAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          {q.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 5: SUPPLIER REGISTER */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor name, code, contact..."
                className="pl-9 text-xs"
              />
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsVendorModalOpen(true)} className="bg-[#D68904] text-white">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Register New Vendor
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendors.length === 0 ? (
              <div className="col-span-2 p-8 text-center bg-white border border-slate-200/80 rounded-lg text-slate-400 text-xs">
                No vendors currently registered in database.
              </div>
            ) : (
              vendors.map((vend) => (
                <Card
                  key={vend.id}
                  className="p-4 bg-white border border-slate-200/80 space-y-3 hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#D68904]">
                        {vend.vendorCode}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">
                        {vend.businessName}
                      </h4>
                      <span className="text-[11px] text-slate-500 capitalize">
                        {vend.category.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Compliant & Verified
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Rating: <strong className="text-amber-500">★ {vend.ratingScore.toFixed(1)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600">
                    <p><strong>Contact Person:</strong> {vend.contactPerson}</p>
                    <p><strong>Phone:</strong> {vend.phone} • <strong>Email:</strong> {vend.email}</p>
                    <p><strong>Address:</strong> {vend.physicalAddress}</p>
                    {vend.bankName && (
                      <p className="text-[11px] text-slate-500">
                        <strong>Bank:</strong> {vend.bankName} ({vend.bankAccountNumber})
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
                    <span>Completed Orders: <strong>{vend.totalOrdersCount}</strong></span>
                    <span className="text-[#D68904] font-semibold">Active Supplier</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: GOODS & SERVICES RECEIVING */}
      {activeTab === 'receiving' && (
        <Card className="overflow-hidden bg-white border border-slate-200/80">
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-900">Goods & Services Receiving & Stores Inspection</h3>
            <p className="text-xs text-slate-500 mt-0.5">Physical store intake, delivery verification, item quality checks, and discrepancy tracking</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Order Reference</th>
                  <th className="py-2.5 px-4">Vendor</th>
                  <th className="py-2.5 px-4">Items / Description</th>
                  <th className="py-2.5 px-4">Expected Delivery</th>
                  <th className="py-2.5 px-4 text-right">Verification Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No active dispatches or deliveries awaiting verification.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{d.orderNumber}</td>
                      <td className="py-2.5 px-4 text-slate-800 font-medium">{d.vendorName}</td>
                      <td className="py-2.5 px-4 text-slate-600">{d.itemsDeliveredSummary}</td>
                      <td className="py-2.5 px-4 text-slate-500">{d.expectedDate}</td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                          d.verificationStatus === 'verified_complete'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {d.verificationStatus === 'verified_complete' ? 'VERIFIED' : 'PENDING VERIFICATION'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {d.verificationStatus !== 'verified_complete' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleUpdateStatus(d.orderId, 'delivered')}
                            className="text-xs bg-[#D68904] text-white h-7 px-2"
                          >
                            Verify Intake
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 7: INVENTORY & SUPPLIES */}
      {activeTab === 'inventory' && (
        <Card className="overflow-hidden bg-white border border-slate-200/80">
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Materials Inventory & Warehouse Supplies</h3>
              <p className="text-xs text-slate-500 mt-0.5">Physical inventory quantities, reorder alert levels, and warehouse movement</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">SKU</th>
                  <th className="py-2.5 px-4">Item Name & Category</th>
                  <th className="py-2.5 px-4">Warehouse Location</th>
                  <th className="py-2.5 px-4 text-right">Stock Level</th>
                  <th className="py-2.5 px-4 text-left w-[140px]">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No inventory materials catalogued.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                        {item.sku}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {item.category.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {item.location}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono">
                        {item.quantityOnHand} <span className="font-normal text-xs text-slate-500">{item.unitOfMeasure}</span>
                      </td>
                      <td className="py-2.5 px-4 text-left w-[140px]">
                        <StatusIndicator status={item.status} />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedInventoryItem(item)}
                          className="text-xs h-7 px-2.5 text-slate-700 hover:text-slate-900"
                        >
                          Adjust Stock
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 8: PROCUREMENT EVALUATION */}
      {activeTab === 'evaluation' && (
        <Card className="overflow-hidden bg-white border border-slate-200/80 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Procurement Quotation Evaluation & Comparison</h3>
            <p className="text-xs text-slate-500 mt-0.5">Objective criteria review, technical compliance, commercial scoring, and committee recommendations</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-800">Established Evaluation Process & Standards:</div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Minimum of 3 competitive supplier quotations required for standard procurement activities.</li>
              <li>Verification of TRA TIN, VAT Registration (VRN), and valid Tax Clearance Certificates.</li>
              <li>Price comparison with prevailing market rates and approved project budget allocations.</li>
              <li>Procurement Officer prepares the comparative evaluation matrix; Executive Director authorizes the award.</li>
            </ul>
          </div>
        </Card>
      )}

      {/* TAB 9: PROCUREMENT APPROVALS */}
      {activeTab === 'approvals' && (
        <Card className="overflow-hidden bg-white border border-slate-200/80">
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-900">Procurement Workflow Approvals</h3>
            <p className="text-xs text-slate-500 mt-0.5">Purchase orders and procurement requisitions currently undergoing review</p>
          </div>
          <div className="divide-y divide-slate-100">
            {orders.filter((o) => o.status === 'pending_approval').length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                All purchase orders have been processed. No pending approval actions.
              </div>
            ) : (
              orders.filter((o) => o.status === 'pending_approval').map((po) => (
                <div key={po.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60">
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{po.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      PO: {po.orderNumber} • Vendor: {po.vendorName} • Requested by: {po.requestedByName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900 mr-2">
                      {po.currency} {po.totalAmount.toLocaleString()}
                    </span>
                    {(hasRole('executive_director') || hasRole('system_admin')) && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateStatus(po.id, 'approved')}
                        className="text-xs bg-emerald-600 text-white"
                      >
                        Approve Order
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* TAB 10: INVOICES & PAYMENT HANDOVER */}
      {activeTab === 'invoices' && (
        <Card className="overflow-hidden bg-white border border-slate-200/80">
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-900">Supplier Invoices & Handover to Finance</h3>
            <p className="text-xs text-slate-500 mt-0.5">Procurement-verified delivery notes, supplier tax invoices, and formal disbursement handover</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Invoice / Ref</th>
                  <th className="py-2.5 px-4">Supplier</th>
                  <th className="py-2.5 px-4">Invoice Date</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-right">Verification Status</th>
                  <th className="py-2.5 px-4 text-right">Handover Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No verified supplier invoices pending financial handover.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-4 text-slate-800 font-medium">{inv.vendorName}</td>
                      <td className="py-2.5 px-4 text-slate-500">{inv.invoiceDate}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {inv.currency} {inv.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {inv.verificationStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {inv.handoverStatus.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 11: DOCUMENTS */}
      {activeTab === 'documents' && (
        <Card className="overflow-hidden bg-white border border-slate-200/80 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Procurement Documents & Official Contracts</h3>
            <p className="text-xs text-slate-500 mt-0.5">Secure storage of purchase orders, supplier registration files, delivery notes, and proformas</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-600">
            All procurement supporting documents are indexed through the central Document Registry and linked directly to their respective purchase orders and vendor profiles.
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/documents')}>
            <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
            Open Full Document Registry
          </Button>
        </Card>
      )}

      {/* TAB 12: REPORTS & ANALYTICS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <AnalyticsVisualizer
            title="Procurement Expenditure by Vendor Partner"
            description="Aggregated order expenditure across registered supplier network"
            data={vendorExpenditureData}
            valuePrefix="TZS "
            defaultMode="bar"
            availableModes={['bar', 'line', 'pie', 'table']}
            height={260}
          />

          <AnalyticsVisualizer
            title="Materials Inventory Stock Unit Breakdown"
            description="Stored supplies distribution across functional operational categories"
            data={inventoryCategoryData}
            valueSuffix=" units"
            defaultMode="pie"
            availableModes={['bar', 'line', 'pie', 'table']}
            height={260}
          />
        </div>
      )}

      {/* Full-Page Stepper: Issue Purchase Order */}
      {isPOModalOpen && (
        <IssuePurchaseOrderPage
          vendors={vendors}
          onSuccess={async () => {
            setIsPOModalOpen(false);
            await loadData();
            await showSuccess('Purchase Order issued successfully.');
          }}
          onCancel={() => setIsPOModalOpen(false)}
        />
      )}

      {/* Full-Page Stepper: Register Vendor */}
      {isVendorModalOpen && (
        <RegisterVendorPage
          onSuccess={async () => {
            setIsVendorModalOpen(false);
            await loadData();
            await showSuccess('Vendor successfully registered.');
          }}
          onCancel={() => setIsVendorModalOpen(false)}
        />
      )}

      {/* Stock Adjustment Modal */}
      <UpdateInventoryModal
        isOpen={!!selectedInventoryItem}
        onClose={() => setSelectedInventoryItem(null)}
        item={selectedInventoryItem}
        onSubmit={async (input) => {
          await updateInventoryQuantity(input);
          await loadData();
          await showSuccess('Inventory stock adjusted successfully.');
        }}
      />
    </div>
  );
};
