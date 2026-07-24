import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Package } from 'lucide-react';
import Swal from 'sweetalert2';

// ============================================================================
// 8. PM RESOURCES VIEW (categorized per-project)
// ============================================================================
export function PMResourcesView() {
  const { projects } = useProject();
  const [selectedProjId, setSelectedProjId] = useState(projects[0]?.id || '');

  // State for inventory list grouped/allocated to projects
  const [resources, setResources] = useState([
    { id: 'r1', name: 'NGO Toyota Hilux 4x4', category: 'Vehicle', status: 'Available', owner: 'Mombasa Outpost', projectId: projects[0]?.id || '' },
    { id: 'r2', name: 'Dell XPS Project laptop', category: 'Computer', status: 'Assigned', owner: 'Paul Manager', projectId: projects[0]?.id || '' },
    { id: 'r3', name: 'Epson LCD Projector v3', category: 'Equipment', status: 'Maintenance', owner: 'Logistics Unit', projectId: projects[1]?.id || '' },
    { id: 'r4', name: 'PA System Speakers Kit', category: 'Equipment', status: 'Available', owner: 'Nairobi Office', projectId: projects[1]?.id || '' }
  ]);

  const activeProj = projects.find(p => p.id === selectedProjId);
  const projResources = resources.filter(r => r.projectId === selectedProjId);

  const handleUpdateStatus = (id, newStatus) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    Swal.fire('Inventory Synced', 'Resource availability status updated.', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-normal text-slate-800">Resource Inventory & Logistics</h2>
          <p className="text-xs text-slate-400 font-normal">Track and assign shared equipment and materials categorized per project.</p>
        </div>

        {/* Project Selector */}
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

      {/* Resource Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="font-normal text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
          <Package size={16} className="text-slate-400" />
          <span>Active Logistics Equipment Register ({activeProj ? activeProj.name : 'Selected Project'})</span>
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                <th className="p-3">Resource Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned Owner</th>
                <th className="p-3 text-right">Toggle Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-normal">
              {projResources.map(res => (
                <tr key={res.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-normal text-slate-808">{res.name}</td>
                  <td className="p-3 text-slate-500 font-normal">{res.category}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[8px] font-normal uppercase border bg-slate-50 text-slate-655 border-slate-200">
                      {res.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-normal">{res.owner}</td>
                  <td className="p-3 text-right">
                    <select
                      value={res.status}
                      onChange={(e) => handleUpdateStatus(res.id, e.target.value)}
                      className="border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none text-xs font-normal"
                    >
                      <option value="Available">Available</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </td>
                </tr>
              ))}
              {projResources.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-400 italic font-normal">No resources allocated to this project workspace.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
