import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, ShoppingCart, CreditCard, Filter, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  getProcurementFinancialHandover,
  ProcurementFinancialHandoverItem,
} from '../services/financeService';

export const ProcurementPaymentsView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProcurementFinancialHandoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partially_paid' | 'paid'>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getProcurementFinancialHandover();
        setItems(data);
      } catch (err) {
        console.error('Failed to load procurement financial handover:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        item.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || item.paymentStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, searchQuery, statusFilter]);

  const unpaidCount = items.filter((i) => i.paymentStatus === 'unpaid').length;
  const unpaidTotal = items
    .filter((i) => i.paymentStatus !== 'paid')
    .reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Procurement Commitment Volume
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            TZS {(items.reduce((s, i) => s + i.totalAmount, 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Across {items.length} verified purchase orders</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Outstanding Procurement Invoices
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-800">
            TZS {(unpaidTotal / 1000000).toFixed(1)}M
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">{unpaidCount} orders awaiting disbursement</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Settled Supplier Disbursements
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-800">
            TZS {(items.reduce((s, i) => s + i.paidAmount, 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">
            {items.filter((i) => i.paymentStatus === 'paid').length} fully cleared orders
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#374151] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by PO number, supplier name, or deliverable..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="h-3.5 w-3.5 text-[#374151]" />
            <span>Payment Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          >
            <option value="all">All Settlements</option>
            <option value="unpaid">Unpaid Orders</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Fully Cleared</option>
          </select>
        </div>
      </div>

      {/* Procurement Invoices Handover Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">PO Reference & Title</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4 text-right">Order Total</th>
                <th className="py-3 px-4 text-right">Disbursed Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Settlement Status</th>
                <th className="py-3 px-4 text-right">Finance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading procurement handover records...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No procurement payment handover records found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const balanceDue = Math.max(0, item.totalAmount - item.paidAmount);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <ShoppingCart className="h-3.5 w-3.5 text-[#374151] shrink-0" />
                          <span className="font-mono">{item.orderNumber}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                          {item.title}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {item.vendorName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {item.currency} {item.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                        {item.currency} {item.paidAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-800 whitespace-nowrap">
                        {item.currency} {balanceDue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Cleared
                          </span>
                        ) : item.paymentStatus === 'partially_paid' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                            <Clock className="h-3 w-3 text-blue-600" /> Partially Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                            <Clock className="h-3 w-3 text-amber-600" /> Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.paymentStatus !== 'paid' ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => navigate(`/finance/payments/new?vendor=${encodeURIComponent(item.vendorName)}&po=${encodeURIComponent(item.orderNumber)}`)}
                            className="text-xs h-7 px-2.5"
                          >
                            <CreditCard className="h-3 w-3 mr-1 text-white" /> Disburse Payment
                          </Button>
                        ) : (
                          <span className="text-2xs text-slate-400 font-medium">Reconciled</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
