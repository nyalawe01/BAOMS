/**
 * MultiContactFields — Reusable multi-entry contact panel
 * BAOMS | Babawatoto Organization Management System
 *
 * Supports: phone numbers, emails, physical addresses, and bank accounts.
 * Each entry can have a custom label (e.g. "WhatsApp", "Head Office", "CRDB Account").
 */

import React from 'react';
import { Plus, Trash2, Phone, Mail, MapPin, Landmark } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ContactType = 'phone' | 'email' | 'address' | 'bank_account';

export interface ContactEntry {
  id: string;                    // temp client-side key
  type: ContactType;
  label: string;                 // e.g. "Main Office", "WhatsApp", "CRDB"
  value: string;                 // the actual number / email / address / account no.
  // Bank-specific extras
  bankName?: string;
  swiftCode?: string;
  branchName?: string;
  isPrimary?: boolean;
}

export interface MultiContactFieldsProps {
  contacts: ContactEntry[];
  onChange: (updated: ContactEntry[]) => void;
  allowedTypes?: ContactType[];
  className?: string;
  /** Maximum entries across ALL types combined (default: unlimited) */
  maxTotal?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CONTACT_META: Record<
  ContactType,
  { icon: React.FC<{ className?: string }>; label: string; placeholder: string; valuePlaceholder: string }
> = {
  phone: {
    icon: Phone,
    label: 'Phone / Mobile',
    placeholder: 'e.g. Main Line, WhatsApp, Fax',
    valuePlaceholder: '+255 754 000 000',
  },
  email: {
    icon: Mail,
    label: 'Email Address',
    placeholder: 'e.g. Main Office, Orders, Accounts',
    valuePlaceholder: 'office@example.co.tz',
  },
  address: {
    icon: MapPin,
    label: 'Physical Address',
    placeholder: 'e.g. Head Office, Warehouse, Branch',
    valuePlaceholder: 'Plot 42, Gerezani St, Kariakoo, Dar es Salaam',
  },
  bank_account: {
    icon: Landmark,
    label: 'Bank Account',
    placeholder: 'e.g. CRDB Main Account, NMB Payroll',
    valuePlaceholder: 'Account number',
  },
};

function newEntry(type: ContactType): ContactEntry {
  return {
    id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    label: '',
    value: '',
    bankName: '',
    swiftCode: '',
    branchName: '',
    isPrimary: false,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export const MultiContactFields: React.FC<MultiContactFieldsProps> = ({
  contacts,
  onChange,
  allowedTypes = ['phone', 'email', 'address', 'bank_account'],
  className,
  maxTotal,
}) => {
  const canAdd = maxTotal === undefined || contacts.length < maxTotal;

  const update = (id: string, patch: Partial<ContactEntry>) => {
    onChange(contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const remove = (id: string) => {
    onChange(contacts.filter((c) => c.id !== id));
  };

  const add = (type: ContactType) => {
    if (!canAdd) return;
    onChange([...contacts, newEntry(type)]);
  };

  const setPrimary = (id: string) => {
    onChange(
      contacts.map((c) => ({
        ...c,
        isPrimary: c.id === id ? true : c.type === contacts.find((x) => x.id === id)?.type ? false : c.isPrimary,
      }))
    );
  };

  // Group by type for display
  const grouped = allowedTypes.map((type) => ({
    type,
    entries: contacts.filter((c) => c.type === type),
  }));

  return (
    <div className={cn('space-y-5', className)}>
      {grouped.map(({ type, entries }) => {
        const meta = CONTACT_META[type];
        const Icon = meta.icon;
        return (
          <div key={type} className="space-y-2">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-[#D68904]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {meta.label}
                </span>
                {entries.length > 0 && (
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                    {entries.length}
                  </span>
                )}
              </div>
              {canAdd && (
                <button
                  type="button"
                  onClick={() => add(type)}
                  className="flex items-center gap-1 text-[11px] text-[#D68904] hover:text-[#b86e03] font-semibold transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add {meta.label}
                </button>
              )}
            </div>

            {entries.length === 0 && (
              <p className="text-[11px] text-slate-400 italic px-1">
                No {meta.label.toLowerCase()} entries. Click "Add" to add one.
              </p>
            )}

            {entries.map((entry, idx) => (
              <div
                key={entry.id}
                className={cn(
                  'rounded-xl border bg-white p-3 space-y-3 transition-all',
                  entry.isPrimary ? 'border-[#D68904]/60 bg-amber-50/30' : 'border-slate-200'
                )}
              >
                {/* Row: label + primary toggle + remove */}
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <Input
                      label={`Label / Description ${idx === 0 ? '(e.g. Primary)' : ''}`}
                      placeholder={meta.placeholder}
                      value={entry.label}
                      onChange={(e) => update(entry.id, { label: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-5 shrink-0">
                    {/* Primary star */}
                    <button
                      type="button"
                      title={entry.isPrimary ? 'Primary contact' : 'Set as primary'}
                      onClick={() => setPrimary(entry.id)}
                      className={cn(
                        'text-xs px-2 py-1 rounded border font-medium transition-colors',
                        entry.isPrimary
                          ? 'bg-[#D68904] text-white border-[#D68904]'
                          : 'text-slate-400 border-slate-200 hover:text-[#D68904] hover:border-[#D68904]/40'
                      )}
                    >
                      {entry.isPrimary ? 'Primary' : 'Set Primary'}
                    </button>
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => remove(entry.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 rounded transition-colors"
                      title="Remove this entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Value field */}
                {type === 'address' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={entry.value}
                      onChange={(e) => update(entry.id, { value: e.target.value })}
                      placeholder={meta.valuePlaceholder}
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D68904]/40 focus:border-[#D68904] resize-none"
                    />
                  </div>
                ) : type === 'bank_account' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Bank Name *"
                      placeholder="e.g. CRDB Bank, NMB, Stanbic"
                      value={entry.bankName || ''}
                      onChange={(e) => update(entry.id, { bankName: e.target.value })}
                    />
                    <Input
                      label="Account Number *"
                      placeholder="e.g. 0150244455500"
                      value={entry.value}
                      onChange={(e) => update(entry.id, { value: e.target.value })}
                    />
                    <Input
                      label="Branch Name (Optional)"
                      placeholder="e.g. Kariakoo Branch"
                      value={entry.branchName || ''}
                      onChange={(e) => update(entry.id, { branchName: e.target.value })}
                    />
                    <Input
                      label="SWIFT / Sort Code (Optional)"
                      placeholder="e.g. CRDBTZTZ"
                      value={entry.swiftCode || ''}
                      onChange={(e) => update(entry.id, { swiftCode: e.target.value })}
                    />
                  </div>
                ) : (
                  <Input
                    label={`${meta.label} *`}
                    placeholder={meta.valuePlaceholder}
                    value={entry.value}
                    onChange={(e) => update(entry.id, { value: e.target.value })}
                    type={type === 'email' ? 'email' : 'text'}
                  />
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ─── Export helper to convert contacts to flat storage format ─────────────────

export function serializeContacts(contacts: ContactEntry[]): object[] {
  return contacts.map((c) => ({
    type: c.type,
    label: c.label || null,
    value: c.value,
    bank_name: c.bankName || null,
    swift_code: c.swiftCode || null,
    branch_name: c.branchName || null,
    is_primary: c.isPrimary || false,
  }));
}
