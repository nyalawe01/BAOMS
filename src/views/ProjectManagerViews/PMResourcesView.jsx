import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Package } from 'lucide-react';

// ============================================================================
// 8. PM RESOURCES VIEW (categorized per-project)
// ============================================================================
export function PMResourcesView() {
  const { projects, assetsAndVendors, addAssetOrVendor, updateAssetOrVendor } = useProject();
  const [selectedProjId, setSelectedProjId] = useState(projects[0]?.id || '');

  // Asset register form state
  const [assetName, setAssetName] = useState('');
  const [assetCode, setAssetCode] = useState('');
  const [assetStatus, setAssetStatus] = useState('Available');

  // Resources are the real assetsAndVendors records (filtered to type 'asset')
  const resources = assetsAndVendors.filter(av => av.type === 'asset');

  const activeProj = projects.find(p => p.id === selectedProjId);

  const handleAddResource = (e) => {
    e.preventDefault();
    if (!assetName || !assetCode) return;
    addAssetOrVendor('asset', { name: assetName, assetCode, purchaseDate: new Date().toISOString().substring(0, 10), status: assetStatus });
    setAssetName('');
    setAssetCode('');
    setAssetStatus('Available');
  };

  const handleStatusChange = (registerId, newStatus) => {
    updateAssetOrVendor(registerId, { status: newStatus });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-normal text-slate-800">Resource Inventory & Logistics</h2>
          <p className="text-xs text-slate-400 font-normal">Register and track shared equipment and materials from the live asset database.</p>
        </div>

        {/* Project Selector (contextual reference only, resources are org-wide) */}
        <div className="text-xs font-normal">
          <select
            value={selectedProjId}
            onChange={(e) => setSelectedProjId(e.target.value)}
            className="border border-slate-200 rounded px-2.5 py-1.5 bg-white text-xs font-normal focus:outline-none"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Resource Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="font-normal text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
          <Package size={16} className="text-slate-400" />
          <span>Register New Resource</span>
        </h3>
        <form onSubmit={handleAddResource} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            required
            placeholder="Resource Name (e.g. Dell XPS Laptop)"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
          />
          <input
            type="text"
            required
            placeholder="Code (e.g. OMS-ASSET-05)"
            value={assetCode}
            onChange={(e) => setAssetCode(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
          />
          <select
            value={assetStatus}
            onChange={(e) => setAssetStatus(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
          >
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-1.5 rounded">Register Resource</button>
        </form>
      </div>

      {/* Resource Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="font-normal text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
          <Package size={16} className="text-slate-400" />
          <span>Active Logistics Equipment Register {activeProj ? `(viewing context: ${activeProj.name})` : ''}</span>
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                <th className="p-3">Resource Name</th>
                <th className="p-3">Asset Code</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Updated By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-normal">
              {resources.map(res => (
                <tr key={res.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-normal text-slate-808">{res.details?.name}</td>
                  <td className="p-3 text-slate-500 font-normal font-mono">{res.details?.assetCode || 'N/A'}</td>
                  <td className="p-3">
                    <select
                      value={res.details?.status || 'Available'}
                      onChange={(e) => handleStatusChange(res.id, e.target.value)}
                      className={`px-2 py-0.5 rounded text-[8px] font-normal uppercase border focus:outline-none ${
                        res.details?.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <option value="Available">Available</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </td>
                  <td className="p-3 text-slate-600 font-normal">{res.lastUpdatedBy || 'N/A'}</td>
                </tr>
              ))}
              {resources.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-slate-400 italic font-normal">No resources registered in the database yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
