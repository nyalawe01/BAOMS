import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Layers
} from 'lucide-react';

export function ProcurementView() {
  const { assetsAndVendors, orders, addAssetOrVendor, createOrder, updateOrderStatus } = useProject();
  
  // Assets Register State
  const [assetCode, setAssetCode] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetStatus, setAssetStatus] = useState('Operational');

  // Vendor Register State
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorCategory, setVendorCategory] = useState('IT Support');

  // Orders State
  const [orderType, setOrderType] = useState('Purchase');
  const [orderVendor, setOrderVendor] = useState('');
  const [orderItemDesc, setOrderItemDesc] = useState('');
  const [orderItemQty, setOrderItemQty] = useState('');
  const [orderItemPrice, setOrderItemPrice] = useState('');

  const vendors = assetsAndVendors.filter(av => av.type === 'vendor');
  const assets = assetsAndVendors.filter(av => av.type === 'asset');

  const handleAddAsset = (e) => {
    e.preventDefault();
    if (!assetCode || !assetName) return;
    addAssetOrVendor('asset', { assetCode, name: assetName, status: assetStatus });
    setAssetCode('');
    setAssetName('');
  };

  const handleAddVendor = (e) => {
    e.preventDefault();
    if (!vendorName || !vendorEmail) return;
    addAssetOrVendor('vendor', { vendorName, contactPerson: vendorContact, email: vendorEmail, category: vendorCategory });
    setVendorName('');
    setVendorContact('');
    setVendorEmail('');
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!orderVendor || !orderItemDesc || !orderItemQty || !orderItemPrice) return;
    
    const items = [{ description: orderItemDesc, quantity: parseInt(orderItemQty), unitPrice: parseFloat(orderItemPrice) }];
    const totalAmount = parseInt(orderItemQty) * parseFloat(orderItemPrice);

    createOrder(orderType, orderVendor, items, totalAmount);
    setOrderItemDesc('');
    setOrderItemQty('');
    setOrderItemPrice('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Layers className="text-indigo-400" />
          <span>Asset & Vendor Registry Command</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">Manage vendor databases, register physical enterprise assets, and execute Purchase, Buy, or Return order workflows.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Asset Register Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Physical Asset Registry</h3>
          <form onSubmit={handleAddAsset} className="grid grid-cols-3 gap-3">
            <input 
              type="text" 
              required
              placeholder="Code (e.g. OMS-ASSET)" 
              value={assetCode} 
              onChange={(e) => setAssetCode(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
            />
            <input 
              type="text" 
              required
              placeholder="Asset Name (e.g. Dell Monitor)" 
              value={assetName} 
              onChange={(e) => setAssetName(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
            />
            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-1.5 rounded">Register Asset</button>
          </form>

          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2">
            {assets.map(as => (
              <div key={as.id} className="p-2 bg-slate-50 border border-slate-150 rounded flex justify-between items-center text-xs">
                <span><strong>{as.details.assetCode}:</strong> {as.details.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  as.details.status === 'Operational' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {as.details.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor Register Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Vendor Registry Directory</h3>
          <form onSubmit={handleAddVendor} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input 
              type="text" 
              required 
              placeholder="Vendor Name" 
              value={vendorName} 
              onChange={(e) => setVendorName(e.target.value)}
              className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
            />
            <input 
              type="text" 
              placeholder="Contact Person" 
              value={vendorContact} 
              onChange={(e) => setVendorContact(e.target.value)}
              className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
            />
            <input 
              type="email" 
              required 
              placeholder="Email" 
              value={vendorEmail} 
              onChange={(e) => setVendorEmail(e.target.value)}
              className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-1.5 rounded">Register Vendor</button>
          </form>

          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2">
            {vendors.map(v => (
              <div key={v.id} className="p-2 bg-slate-50 border border-slate-150 rounded text-xs flex justify-between">
                <span><strong>{v.details.vendorName}</strong> ({v.details.contactPerson})</span>
                <span className="text-[11px] text-slate-400 font-mono">{v.details.email}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Workflow Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">Execute Order Workflow (Purchase / Buy / Return)</h3>
        
        <form onSubmit={handleCreateOrder} className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <select 
            value={orderType} 
            onChange={(e) => setOrderType(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
          >
            <option value="Purchase">Purchase Order</option>
            <option value="Buy">Buy Order</option>
            <option value="Return">Return Order</option>
          </select>
          <select 
            value={orderVendor} 
            onChange={(e) => setOrderVendor(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
          >
            <option value="">Select Vendor...</option>
            {vendors.map(v => (
              <option key={v.id} value={v.details.vendorName}>{v.details.vendorName}</option>
            ))}
          </select>
          <input 
            type="text" 
            required 
            placeholder="Item Description" 
            value={orderItemDesc} 
            onChange={(e) => setOrderItemDesc(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
          />
          <input 
            type="number" 
            required 
            placeholder="Qty" 
            value={orderItemQty} 
            onChange={(e) => setOrderItemQty(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
          />
          <input 
            type="number" 
            required 
            placeholder="Price (TZS)" 
            value={orderItemPrice} 
            onChange={(e) => setOrderItemPrice(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-1.5 rounded">Create Order</button>
        </form>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-150 text-[11px] font-bold text-slate-400 uppercase">
                <th className="pb-2">Order ID</th>
                <th className="pb-2">Order Type</th>
                <th className="pb-2">Vendor Name</th>
                <th className="pb-2">Item Description</th>
                <th className="pb-2">Total Amount</th>
                <th className="pb-2 px-3">Status</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orders.map(ord => (
                <tr key={ord.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 font-semibold text-slate-900">{ord.id}</td>
                  <td className="py-2.5">{ord.orderType}</td>
                  <td className="py-2.5 font-medium">{ord.vendorName}</td>
                  <td className="py-2.5">{ord.items?.[0]?.description} (x{ord.items?.[0]?.quantity})</td>
                  <td className="py-2.5 font-bold text-slate-900">TZS {ord.totalAmount.toLocaleString()}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                      ord.status === 'Ordered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    {ord.status === 'Draft' && (
                      <button 
                        onClick={() => updateOrderStatus(ord.id, 'Ordered')}
                        className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded hover:bg-slate-800"
                      >
                        Submit Order
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
