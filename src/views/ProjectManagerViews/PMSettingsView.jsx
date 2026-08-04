import React from 'react';

// ============================================================================
// 15. PM SETTINGS VIEW
// ============================================================================
export function PMSettingsView() {
  return (
    <div className="space-y-6 animate-fadeIn font-normal text-sm text-slate-700">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-normal text-slate-805">Project Manager Settings</h2>
        <p className="text-sm text-slate-400 font-normal">Configure program pillars, location lists, donor databases, and task statuses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto select-none font-normal">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-normal text-slate-400 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">Project Classification</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-400 block mb-1">Pillar Programs</span>
              <span className="font-normal text-slate-700 block bg-slate-50 p-2.5 rounded border border-slate-200">Education Pillar, Nutrition Program, Environmental Pillar</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Donor Sponsorships</span>
              <span className="font-normal text-slate-700 block bg-slate-50 p-2.5 rounded border border-slate-200">UNICEF, Red Cross, USAID, Gates Foundation</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-normal text-slate-400 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">Work Locations</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-400 block mb-1">Configured Location Hubs</span>
              <span className="font-normal text-slate-700 block bg-slate-50 p-2.5 rounded border border-slate-200">Dar es Salaam HQ, Mwanza Hub, Zanzibar Outpost, Dodoma Field Office</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
