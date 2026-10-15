import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  Building2,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('procurement.dashboardTitle', 'Procurement & Supply Chain Management')}
        subtitle={t(
          'procurement.dashboardSubtitle',
          'Purchase order pipeline, vendor compliance ratings, inventory stock levels, and supply replenishment.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('procurement.console', 'Procurement Command') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/procurement')}>
              <Building2 className="h-4 w-4 mr-1.5" />
              {t('procurement.vendors', 'Vendor Registry')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/procurement')}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('procurement.newOrder', 'Create Purchase Order')}
            </Button>
          </div>
        }
      />

      {/* Procurement KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Active Purchase Orders
            </span>
            <div className="text-[28px] font-bold text-charcoal-900 leading-tight font-mono tabular-nums">
              {orders.length}
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Supply orders in pipeline
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Active Orders Value
            </span>
            <div className="text-[28px] font-bold text-charcoal-900 leading-tight font-mono tabular-nums">
              {((kpis?.activeOrdersAmount || 0) / 1000000).toFixed(1)}M
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              TZS contracted commitments
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Low Stock Alert Items
            </span>
            <div className={`text-[28px] font-bold leading-tight font-mono tabular-nums ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-charcoal-900'}`}>
              {lowStockItems.length}
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Supplies at or below reorder threshold
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block truncate">
              Compliant Vendors
            </span>
            <div className="text-[28px] font-bold text-charcoal-900 leading-tight font-mono tabular-nums">
              {vendors.length}
            </div>
            <span className="text-xs text-charcoal-muted block truncate">
              Active TIN & VRN verified suppliers
            </span>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Operational Queues: PO Pipeline & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Orders Pipeline */}
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-forest-700" />
                Purchase Orders Pipeline
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Current requisitions and approved delivery commitments
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/procurement')}>
              {t('common.viewAll', 'View All')}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-3">Order Ref & Title</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {orders.slice(0, 5).map((po) => (
                  <tr
                    key={po.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/procurement')}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-charcoal-900 line-clamp-1">{po.title}</div>
                      <div className="text-xs font-mono text-charcoal-muted">{po.orderNumber} • Delivery: {po.expectedDeliveryDate}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-charcoal-700 whitespace-nowrap">
                      {po.vendorName}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-charcoal-900 whitespace-nowrap">
                      {po.currency} {po.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <StatusIndicator status={po.status} label={po.status.replace('_', ' ').toUpperCase()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Inventory Alerts */}
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                Inventory Stock & Reorder Watchlist
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Supplies requiring replenishment for community activities
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/procurement')}>
              {t('common.viewAll', 'View All')}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-3">SKU & Item Name</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3 text-right">On Hand / Min</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {inventory.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-charcoal-900">{item.name}</div>
                      <div className="text-xs font-mono text-charcoal-muted">{item.sku}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-charcoal-700 whitespace-nowrap">
                      {item.location}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs whitespace-nowrap">
                      <span className={item.quantityOnHand <= item.reorderPoint ? 'font-bold text-rose-700' : 'text-charcoal-900'}>
                        {item.quantityOnHand} {item.unitOfMeasure}
                      </span>
                      <span className="text-charcoal-muted"> / {item.reorderPoint}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <StatusIndicator status={item.status} label={item.status.replace('_', ' ').toUpperCase()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
