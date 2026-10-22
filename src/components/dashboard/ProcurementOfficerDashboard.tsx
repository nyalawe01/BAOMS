import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  Building2,
  ArrowRight,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  FileText,
  Activity,
  FileSpreadsheet,
  Truck,
  Receipt,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { KPICard } from '@/components/ui/KPICard';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { AnalyticsVisualizer, AnalyticsDataPoint } from '@/components/ui/AnalyticsVisualizer';
import {
  getPurchaseOrders,
  getInventoryItems,
  getVendors,
  getProcurementKpis,
  getPurchaseRequests,
  getDeliveries,
  getInvoicesForHandover,
} from '@/features/procurement/services/procurementService';
import {
  PurchaseOrderRecord,
  InventoryItemRecord,
  VendorRecord,
  ProcurementKpis,
  PurchaseRequestRecord,
  DeliveryRecord,
  ProcurementInvoiceRecord,
} from '@/features/procurement/types/procurement';

export const ProcurementOfficerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState<ProcurementKpis | null>(null);
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItemRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [requests, setRequests] = useState<PurchaseRequestRecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [invoices, setInvoices] = useState<ProcurementInvoiceRecord[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const loadData = async () => {
    try {
      const [kpiData, oList, iList, vList, rList, dList, invList] = await Promise.all([
        getProcurementKpis(),
        getPurchaseOrders(),
        getInventoryItems(),
        getVendors(),
        getPurchaseRequests(),
        getDeliveries(),
        getInvoicesForHandover(),
      ]);
      setKpis(kpiData);
      setOrders(oList);
      setInventory(iList);
      setVendors(vList);
      setRequests(rList);
      setDeliveries(dList);
      setInvoices(invList);
    } catch (e) {
      console.error('Failed loading procurement dashboard data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const lowStockItems = inventory.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock');
  const pendingOrders = orders.filter((o) => o.status === 'pending_approval');
  const orderedInProgress = orders.filter((o) => o.status === 'ordered');

  // Filtered orders for table
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !searchQuery.trim() ||
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Procurement Pipeline Data for AnalyticsVisualizer
  const pipelineData: AnalyticsDataPoint[] = useMemo(() => {
    return [
      {
        label: '1. Requisition Submitted',
        value: requests.filter((r) => r.status === 'submitted').length,
        description: 'New purchase requests awaiting review',
      },
      {
        label: '2. Under Review / Approved',
        value: requests.filter((r) => r.status === 'under_review' || r.status === 'approved').length,
        description: 'Approved requests ready for procurement',
      },
      {
        label: '3. Quotations & Evaluation',
        value: kpis?.pendingQuotationsCount || 0,
        description: 'Proforma quotations being compared',
      },
      {
        label: '4. Purchase Orders Issued',
        value: orders.filter((o) => o.status === 'approved' || o.status === 'ordered').length,
        description: 'Authorized LPOs dispatched to suppliers',
      },
      {
        label: '5. In Transit / Pending Delivery',
        value: orderedInProgress.length,
        description: 'Orders awaiting physical delivery in store',
      },
      {
        label: '6. Verified & Handed to Finance',
        value: invoices.length,
        description: 'Verified invoices handed over for payment',
      },
    ];
  }, [requests, orders, orderedInProgress, invoices, kpis]);

  return (
    <div className="space-y-6">
      {/* Top Header - AdminCN Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('procurement.dashboardTitle', 'Procurement Dashboard')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Purchase requisition tracking, quotation evaluations, purchase orders pipeline, and financial handovers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/procurement/requests')}>
            <FileText className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
            Purchase Requests
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/procurement/vendors/new')}>
            <Building2 className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
            Register Vendor
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/procurement/orders/new')}
            className="bg-[#D68904] hover:bg-[#b45309] text-white font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5 text-white" />
            Issue Purchase Order
          </Button>
        </div>
      </div>

      {/* Row 1: The 6 Required KPI Cards (AdminCN Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard
          label="Pending Requests"
          value={kpis?.pendingPurchaseRequestsCount || 0}
          change={{
            value: (kpis?.pendingPurchaseRequestsCount || 0) > 0 ? 'Awaiting Action' : 'Clear',
            isPositive: (kpis?.pendingPurchaseRequestsCount || 0) === 0,
            label: 'requisitions submitted',
          }}
          icon={FileText}
          onClick={() => navigate('/procurement/requests')}
        />

        <KPICard
          label="Active Processes"
          value={kpis?.activeProcurementCount || 0}
          change={{
            value: 'In Progress',
            isPositive: true,
            label: 'across pipeline',
          }}
          icon={Activity}
          onClick={() => navigate('/procurement/orders')}
        />

        <KPICard
          label="Pending Quotations"
          value={kpis?.pendingQuotationsCount || 0}
          change={{
            value: 'Evaluation',
            isPositive: true,
            label: 'supplier bids',
          }}
          icon={FileSpreadsheet}
          onClick={() => navigate('/procurement/quotations')}
        />

        <KPICard
          label="Orders in Progress"
          value={kpis?.purchaseOrdersInProgressCount || 0}
          change={{
            value: `${orders.filter((o) => o.status === 'ordered').length} Dispatched`,
            isPositive: true,
            label: 'committed LPOs',
          }}
          icon={ShoppingCart}
          onClick={() => navigate('/procurement/orders')}
        />

        <KPICard
          label="Pending Deliveries"
          value={kpis?.pendingDeliveriesCount || 0}
          change={{
            value: (kpis?.pendingDeliveriesCount || 0) > 0 ? 'Expected in Stores' : 'Cleared',
            isPositive: true,
            label: 'awaiting verification',
          }}
          icon={Truck}
          onClick={() => navigate('/procurement/receiving')}
        />

        <KPICard
          label="Invoices for Handover"
          value={kpis?.invoicesAwaitingHandoverCount || 0}
          change={{
            value: (kpis?.invoicesAwaitingHandoverCount || 0) > 0 ? 'Ready for Finance' : 'None',
            isPositive: true,
            label: 'verified for payment',
          }}
          icon={Receipt}
          onClick={() => navigate('/procurement/invoices')}
        />
      </div>

      {/* Row 2: Action Queue & Procurement Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Action Queue: Procurement Tasks Requiring Attention */}
        <div className="bg-white border border-slate-200/80 rounded-lg overflow-hidden shadow-xs lg:col-span-1">
          <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#374151]" />
                Procurement Action Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tasks requiring procurement verification or processing
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Action Item 1: Pending Requests */}
            <div
              onClick={() => navigate('/procurement/requests')}
              className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Purchase Requisitions
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {requests.filter((r) => r.status === 'submitted').length} awaiting review
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>

            {/* Action Item 2: Pending Order Approvals */}
            <div
              onClick={() => navigate('/procurement/approvals')}
              className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-4 w-4 text-slate-500 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Purchase Orders Awaiting Approval
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {pendingOrders.length} draft/pending LPOs
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>

            {/* Action Item 3: Deliveries to Verify */}
            <div
              onClick={() => navigate('/procurement/receiving')}
              className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-slate-500 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Deliveries Awaiting Stores Intake
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {orderedInProgress.length} expected orders in transit
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>

            {/* Action Item 4: Critical Stock Items */}
            <div
              onClick={() => navigate('/procurement/inventory')}
              className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Low Inventory Items
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lowStockItems.length} items below reorder threshold
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>

            {/* Action Item 5: Invoices Ready for Finance Handover */}
            <div
              onClick={() => navigate('/procurement/invoices')}
              className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Receipt className="h-4 w-4 text-slate-500 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Invoice Handover to Finance
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {invoices.length} verified invoices ready for payment
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Procurement Pipeline Visualizer */}
        <div className="lg:col-span-2">
          <AnalyticsVisualizer
            title="Procurement Workflow Pipeline"
            description="Live distribution of procurement activities across standard procedural stages"
            data={pipelineData}
            defaultMode="bar"
            availableModes={['bar', 'line', 'table']}
            height={240}
          />
        </div>
      </div>

      {/* Row 3: Purchase Orders in Pipeline Table */}
      <div className="bg-white border border-slate-200/80 rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4 text-[#374151]" />
              Purchase Orders Register
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live orders, supplier dispatch status, and expected delivery commitments
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1.5 px-2.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
            >
              <option value="all">All Statuses</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="ordered">Ordered</option>
              <option value="delivered">Delivered</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => navigate('/procurement/orders')}>
              All Orders <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>

        <Table.ScrollContainer>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">PO Number & Description</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4 text-right">Order Total</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No purchase orders matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{o.title}</div>
                      <div className="text-[11px] font-mono text-slate-500">{o.orderNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {o.vendorName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {o.expectedDeliveryDate || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {o.currency} {o.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <StatusIndicator status={o.status} label={o.status.toUpperCase()} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Table.ScrollContainer>

        {/* Table Pagination Bar */}
        <div className="px-4 py-3 border-t border-slate-200/80 bg-white">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            size="sm"
          />
        </div>
      </div>

      {/* Row 4: Compliant Vendors & Critical Inventory Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Compliant Vendors Panel */}
        <div className="bg-white border border-slate-200/80 rounded-lg overflow-hidden flex flex-col shadow-xs">
          <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-[#374151]" />
                Approved Suppliers & Vendors
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compliant commercial partners with active documentation
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/procurement/vendors')}>
              Vendors <ArrowRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[260px]">
            {vendors.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No vendors currently registered.
              </div>
            ) : (
              vendors.slice(0, 5).map((v) => (
                <div key={v.id} className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{v.businessName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {v.vendorCode} • {v.category.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Attention Panel */}
        <div className="bg-white border border-slate-200/80 rounded-lg overflow-hidden flex flex-col shadow-xs">
          <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Critical Inventory & Reorder Alerts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Supplies approaching minimum reorder threshold
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/procurement/inventory')}>
              Inventory <ArrowRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[260px]">
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                All inventory materials are currently adequately stocked.
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{item.name}</div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      SKU: {item.sku} • Location: {item.location}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-amber-600">
                      {item.quantityOnHand} {item.unitOfMeasure}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      Reorder: {item.reorderPoint}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
