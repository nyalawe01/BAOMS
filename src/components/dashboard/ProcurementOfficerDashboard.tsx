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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/ui/KPICard';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import {
  getPurchaseOrders,
  getInventoryItems,
  getVendors,
  getProcurementKpis,
} from '@/features/procurement/services/procurementService';
import {
  PurchaseOrderRecord,
  InventoryItemRecord,
  VendorRecord,
  ProcurementKpis,
} from '@/features/procurement/types/procurement';

export const ProcurementOfficerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState<ProcurementKpis | null>(null);
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItemRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const loadData = async () => {
    try {
      const [kpiData, oList, iList, vList] = await Promise.all([
        getProcurementKpis(),
        getPurchaseOrders(),
        getInventoryItems(),
        getVendors(),
      ]);
      setKpis(kpiData);
      setOrders(oList);
      setInventory(iList);
      setVendors(vList);
    } catch (e) {
      console.error('Failed loading procurement telemetry:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const lowStockItems = inventory.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  // Filtered orders for table
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.title.toLowerCase().includes(q) ||
        o.vendorName.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Top Header - AdminCN Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('procurement.console', 'Procurement & Supplies')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Purchase order pipeline, vendor compliance ratings, inventory stock levels, and supply replenishment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/procurement')}>
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            {t('procurement.vendors', 'Vendors')}
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/procurement')}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t('procurement.newOrder', 'New Order')}
          </Button>
        </div>
      </div>

      {/* Row 1: Four Compact KPI Cards (AdminCN Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Purchase Orders"
          value={orders.length}
          change={{
            value: `${orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length} Active`,
            isPositive: true,
            label: 'in procurement pipeline',
          }}
          icon={ShoppingCart}
        />

        <KPICard
          label="Approved Vendors"
          value={vendors.length}
          change={{
            value: 'Compliant',
            isPositive: true,
            label: 'registered partners',
          }}
          icon={Building2}
        />

        <KPICard
          label="Low Stock Alerts"
          value={lowStockItems.length}
          change={{
            value: lowStockItems.length > 0 ? `${lowStockItems.length} Reorder Needed` : 'Sufficient',
            isPositive: lowStockItems.length === 0,
            label: lowStockItems.length > 0 ? 'critical inventory' : 'stock levels nominal',
          }}
          icon={AlertTriangle}
        />

        <KPICard
          label="Delivered Orders"
          value={deliveredOrders.length}
          change={{
            value: 'Completed',
            isPositive: true,
            label: 'inspected & cleared',
          }}
          icon={Package}
        />
      </div>

      {/* Row 2: Low Stock Alerts + Approved Vendors Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
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
            <Button variant="ghost" size="sm" onClick={() => navigate('/procurement')}>
              Inventory <ArrowRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[280px]">
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
                      SKU: {item.sku} • Location: {item.storageLocation}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-amber-600">
                      {item.quantityOnHand} {item.unitOfMeasure}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      Min: {item.reorderLevel}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Compliant Vendors Panel */}
        <div className="bg-white border border-slate-200/80 rounded-lg overflow-hidden flex flex-col shadow-xs">
          <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-slate-700" />
                Approved Enterprise Vendors
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compliant commercial partners with active contracts
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/procurement')}>
              Vendors <ArrowRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[280px]">
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
      </div>

      {/* Row 3: Purchase Orders in Pipeline (AdminCN Table Style) */}
      <div className="bg-white border border-slate-200/80 rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4 text-[#D68904]" />
              Purchase Orders Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live supply orders, vendor dispatch commitments, and expected delivery dates
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
            <Button variant="outline" size="sm" onClick={() => navigate('/procurement')}>
              All Orders <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-2.5 px-4">PO Number & Description</th>
                <th className="py-2.5 px-4">Supplier / Vendor</th>
                <th className="py-2.5 px-4">Expected Delivery</th>
                <th className="py-2.5 px-4 text-right">Order Total</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{o.title}</div>
                      <div className="text-[11px] font-mono text-slate-500">{o.orderNumber}</div>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-700">
                      {o.vendorName}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {o.expectedDeliveryDate || 'N/A'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {o.currency} {o.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <StatusIndicator status={o.status} label={o.status.toUpperCase()} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/80 bg-white text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredOrders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-semibold text-slate-800">{Math.min(currentPage * pageSize, filteredOrders.length)}</span> of{' '}
            <span className="font-semibold text-slate-800">{filteredOrders.length}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
                  pg === currentPage
                    ? 'bg-[#D68904] text-white font-semibold'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
