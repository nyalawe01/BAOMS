import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingCart,
  Package,
  Plus,
  Search,
  Filter,
  Building2,
  BarChart3,
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
} from '../types/procurement';
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  getVendors,
  registerVendor,
  getInventoryItems,
  updateInventoryQuantity,
  getProcurementKpis,
} from '../services/procurementService';
import { CreatePurchaseOrderModal } from '../components/CreatePurchaseOrderModal';
import { RegisterVendorModal } from '../components/RegisterVendorModal';
import { UpdateInventoryModal } from '../components/UpdateInventoryModal';

export const ProcurementPage: React.FC = () => {
  const { user, profile, hasRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'orders' | 'vendors' | 'inventory' | 'analytics'>('orders');

  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItemRecord[]>([]);
  const [kpis, setKpis] = useState<ProcurementKpis>({
    totalOrdersCount: 0,
    activeOrdersAmount: 0,
    deliveredOrdersCount: 0,
    registeredVendorsCount: 0,
    lowStockItemsCount: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItemRecord | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [pos, vends, invs, kpiStats] = await Promise.all([
        getPurchaseOrders({ status: statusFilter, searchQuery }),
        getVendors({ searchQuery }),
        getInventoryItems({ searchQuery }),
        getProcurementKpis(),
      ]);

      setOrders(pos);
      setVendors(vends);
      setInventory(invs);
      setKpis(kpiStats);
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
      description: `Disbursed and pending orders`,
    }));
  }, [orders]);

  // Inventory distribution by category
  const inventoryCategoryData: AnalyticsDataPoint[] = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach((i) => {
      const cat = i.category.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      counts[cat] = (counts[cat] || 0) + i.quantityOnHand;
    });
    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
      description: `Stock units stored`,
    }));
  }, [inventory]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement & Supply Chain Specialist Dashboard"
        subtitle="End-to-end management of vendor partnerships, purchase orders, materials inventory, and supply operations."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Procurement & Supply Chain' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVendorModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-neutral-300"
            >
              <Building2 className="w-4 h-4 text-[#D68904]" />
              <span>Register Vendor</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPOModalOpen(true)}
              className="bg-[#D68904] hover:bg-[#b45309] text-white flex items-center gap-1.5 text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Purchase Order</span>
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-surface-border rounded-lg p-3 sm:p-3.5">
          <div className="text-xs font-medium text-charcoal-500 uppercase tracking-wider truncate">
            Total Purchase Orders
          </div>
          <div className="text-xl font-bold text-charcoal-900 font-mono tabular-nums mt-0.5 truncate">
            {kpis.totalOrdersCount}
          </div>
          <div className="text-xs text-charcoal-muted mt-0.5 truncate">
            Lifetime logged
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-3 sm:p-3.5">
          <div className="text-xs font-medium text-charcoal-500 uppercase tracking-wider truncate">
            Active Commitments
          </div>
          <div className="text-xl font-bold text-charcoal-900 font-mono tabular-nums mt-0.5 truncate">
            TZS {(kpis.activeOrdersAmount / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-charcoal-muted mt-0.5 truncate">
            Pending or in transit
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-3 sm:p-3.5">
          <div className="text-xs font-medium text-charcoal-500 uppercase tracking-wider truncate">
            Delivered Orders
          </div>
          <div className="text-xl font-bold text-charcoal-900 font-mono tabular-nums mt-0.5 truncate">
            {kpis.deliveredOrdersCount}
          </div>
          <div className="text-xs text-charcoal-muted mt-0.5 truncate">
            Inspected & cleared
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-3 sm:p-3.5">
          <div className="text-xs font-medium text-charcoal-500 uppercase tracking-wider truncate">
            Approved Vendors
          </div>
          <div className="text-xl font-bold text-charcoal-900 font-mono tabular-nums mt-0.5 truncate">
            {kpis.registeredVendorsCount}
          </div>
          <div className="text-xs text-charcoal-muted mt-0.5 truncate">
            Compliant partners
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-3 sm:p-3.5">
          <div className="text-xs font-medium text-charcoal-500 uppercase tracking-wider truncate">
            Low Stock Alerts
          </div>
          <div className={`text-xl font-bold font-mono tabular-nums mt-0.5 truncate ${kpis.lowStockItemsCount > 0 ? 'text-rose-600' : 'text-charcoal-900'}`}>
            {kpis.lowStockItemsCount}
          </div>
          <div className="text-xs mt-0.5 truncate">
            {kpis.lowStockItemsCount > 0 ? (
              <span className="text-rose-600 font-medium">Reorder needed</span>
            ) : (
              <span className="text-charcoal-muted">Stock adequate</span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-surface-border">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'border-charcoal-900 text-charcoal-900'
              : 'border-transparent text-charcoal-muted hover:text-charcoal-900'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Purchase Orders ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vendors')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'vendors'
              ? 'border-charcoal-900 text-charcoal-900'
              : 'border-transparent text-charcoal-muted hover:text-charcoal-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Approved Vendors ({vendors.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'border-charcoal-900 text-charcoal-900'
              : 'border-transparent text-charcoal-muted hover:text-charcoal-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Inventory & Materials ({inventory.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'border-[#D68904] text-[#D68904]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Supply Chain Analytics</span>
        </button>
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

          <Card className="overflow-hidden bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-neutral-800/80 border-b border-slate-200 dark:border-neutral-800 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Order Title & Details</th>
                    <th className="py-3 px-4">Vendor Partner</th>
                    <th className="py-3 px-4 text-right">Total (TZS)</th>
                    <th className="py-3 px-4 text-left w-[140px]">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                  {orders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {po.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-neutral-100">{po.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {po.items.length} items • Delivery: {po.expectedDeliveryDate}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-neutral-300">
                        {po.vendorName}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white font-mono">
                        {po.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-left w-[140px]">
                        <StatusIndicator status={po.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {po.status === 'pending_approval' && (
                            (hasRole('executive_director') || hasRole('system_admin')) && po.createdBy !== user?.id ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(po.id, 'approved')}
                                className="text-xs text-emerald-700 hover:bg-emerald-50 h-7 px-2"
                              >
                                Approve
                              </Button>
                            ) : (
                              <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Awaiting Exec Approval
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: VENDORS */}
      {activeTab === 'vendors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map((vend) => (
            <Card
              key={vend.id}
              className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-3 hover:shadow-xs transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-neutral-800 pb-2.5">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#D68904]">
                    {vend.vendorCode}
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                    {vend.businessName}
                  </h4>
                  <span className="text-[11px] text-slate-500 capitalize">
                    {vend.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-right">
                  <span className="inline-block text-[10px] font-semibold text-emerald-700">
                    Compliant & Verified
                  </span>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Rating: <strong className="text-amber-500">★ {vend.ratingScore.toFixed(1)}</strong>
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-1 text-slate-600 dark:text-neutral-400">
                <p><strong>Contact Person:</strong> {vend.contactPerson}</p>
                <p><strong>Phone:</strong> {vend.phone} • <strong>Email:</strong> {vend.email}</p>
                <p><strong>Address:</strong> {vend.physicalAddress}</p>
                {vend.bankName && (
                  <p className="text-[11px] text-slate-400">
                    <strong>Bank:</strong> {vend.bankName} ({vend.bankAccountNumber})
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex justify-between items-center text-[11px] text-slate-500">
                <span>Completed Orders: <strong>{vend.totalOrdersCount}</strong></span>
                <span className="text-[#D68904] font-semibold">Active Supplier</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 3: INVENTORY */}
      {activeTab === 'inventory' && (
        <Card className="overflow-hidden bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-neutral-800/80 border-b border-slate-200 dark:border-neutral-800 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Item Name & Category</th>
                  <th className="py-3 px-4">Warehouse Location</th>
                  <th className="py-3 px-4 text-right">Stock Level</th>
                  <th className="py-3 px-4 text-left w-[140px]">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-neutral-300">
                      {item.sku}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {item.category.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-neutral-400">
                      {item.location}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white font-mono">
                      {item.quantityOnHand} <span className="font-normal text-xs text-slate-500">{item.unitOfMeasure}</span>
                    </td>
                    <td className="py-3 px-4 text-left w-[140px]">
                      <StatusIndicator status={item.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
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
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <AnalyticsVisualizer
            title="Procurement Expenditure by Vendor Partner"
            description="Aggregated order expenditure across registered supplier network (toggle between Bar, Line, Distribution, Table)"
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

      {/* Modals */}
      <CreatePurchaseOrderModal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        vendors={vendors}
        onSubmit={async (input) => {
          await createPurchaseOrder(input, {
            id: user?.id || 'officer',
            name: profile?.display_name || user?.email || 'Bakari H. Mhando',
          });
          await loadData();
          await showSuccess('Purchase Order issued successfully.');
        }}
      />

      <RegisterVendorModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        onSubmit={async (input) => {
          await registerVendor(input);
          await loadData();
          await showSuccess('Vendor successfully registered.');
        }}
      />

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
