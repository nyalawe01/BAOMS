import { AccountSettingsPanel } from '@/components/shared/AccountSettingsPanel';

// ============================================================================
// 15. PM SETTINGS VIEW
// ============================================================================
export function PMSettingsView() {
  return (
    <div className="space-y-6 max-w-xl mx-auto animate-fadeIn">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">Account Settings</h2>
        <p className="text-sm text-slate-400">Manage appearance, password, and account access.</p>
      </div>
      <AccountSettingsPanel />
    </div>
  );
}
