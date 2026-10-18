/**
 * MultiContactAndBankFields — Reusable multi-value inputs for contact and banking details
 * BAOMS | Babawatoto Organization Management System
 *
 * Supports adding multiple:
 * 1. Phone numbers (with labels/types: Primary, WhatsApp, Work/Landline, Emergency)
 * 2. Email addresses (with labels/types: Official/Work, Personal, Billing/Invoices)
 * 3. Addresses (Physical HQ, Postal P.O. Box, Branch/Site)
 * 4. Bank details / Accounts (Bank name, Account name, Account number, Branch, SWIFT, Currency)
 */

import React from 'react';
import { Plus, Trash2, Phone, Mail, MapPin, Building2, Check, Star } from 'lucide-react';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { cn } from '@/lib/utils';

// ─── 1. Phone Number Multi-Input ─────────────────────────────────────────────

export interface MultiPhoneItem {
  id: string;
  number: string;
  type: 'primary' | 'whatsapp' | 'work' | 'personal' | 'emergency';
  isPrimary?: boolean;
}

interface MultiPhoneInputProps {
  label?: string;
  phones: MultiPhoneItem[];
  onChange: (phones: MultiPhoneItem[]) => void;
  className?: string;
  required?: boolean;
}

export const MultiPhoneInput: React.FC<MultiPhoneInputProps> = ({
  label = 'Phone Numbers',
  phones,
  onChange,
  className,
  required,
}) => {
  const addPhone = () => {
    onChange([
      ...phones,
      {
        id: `phone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        number: '',
        type: phones.length === 0 ? 'primary' : 'whatsapp',
        isPrimary: phones.length === 0,
      },
    ]);
  };

  const removePhone = (id: string) => {
    const updated = phones.filter((p) => p.id !== id);
    if (updated.length > 0 && !updated.some((p) => p.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const updatePhone = (id: string, patch: Partial<MultiPhoneItem>) => {
    onChange(
      phones.map((p) => {
        if (p.id === id) {
          const item = { ...p, ...patch };
          return item;
        }
        if (patch.isPrimary) {
          return { ...p, isPrimary: false };
        }
        return p;
      })
    );
  };

  // Ensure at least one item if empty and required
  React.useEffect(() => {
    if (required && phones.length === 0) {
      addPhone();
    }
  }, [required, phones.length]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-[#374151]" />
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={addPhone}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#D68904] hover:text-[#B57403] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Phone</span>
        </button>
      </div>

      <div className="space-y-2">
        {phones.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800"
          >
            <div className="w-32 shrink-0">
              <Select
                value={item.type}
                onChange={(e) => updatePhone(item.id, { type: e.target.value as MultiPhoneItem['type'] })}
                options={[
                  { value: 'primary', label: 'Primary' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'work', label: 'Work / Office' },
                  { value: 'personal', label: 'Personal' },
                  { value: 'emergency', label: 'Emergency' },
                ]}
              />
            </div>

            <div className="flex-1 min-w-0">
              <Input
                placeholder="e.g. +255 712 345 678"
                value={item.number}
                onChange={(e) => updatePhone(item.id, { number: e.target.value })}
                required={required && idx === 0}
              />
            </div>

            <button
              type="button"
              onClick={() => updatePhone(item.id, { isPrimary: true })}
              title={item.isPrimary ? 'Primary phone number' : 'Set as primary'}
              className={cn(
                'p-1.5 rounded text-xs transition-colors',
                item.isPrimary
                  ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <Star className={cn('w-4 h-4', item.isPrimary && 'fill-amber-500 text-amber-500')} />
            </button>

            {phones.length > 1 && (
              <button
                type="button"
                onClick={() => removePhone(item.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                title="Remove phone number"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── 2. Email Address Multi-Input ───────────────────────────────────────────

export interface MultiEmailItem {
  id: string;
  email: string;
  type: 'official' | 'personal' | 'billing' | 'notifications';
  isPrimary?: boolean;
}

interface MultiEmailInputProps {
  label?: string;
  emails: MultiEmailItem[];
  onChange: (emails: MultiEmailItem[]) => void;
  className?: string;
  required?: boolean;
}

export const MultiEmailInput: React.FC<MultiEmailInputProps> = ({
  label = 'Email Addresses',
  emails,
  onChange,
  className,
  required,
}) => {
  const addEmail = () => {
    onChange([
      ...emails,
      {
        id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        email: '',
        type: emails.length === 0 ? 'official' : 'personal',
        isPrimary: emails.length === 0,
      },
    ]);
  };

  const removeEmail = (id: string) => {
    const updated = emails.filter((e) => e.id !== id);
    if (updated.length > 0 && !updated.some((e) => e.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const updateEmail = (id: string, patch: Partial<MultiEmailItem>) => {
    onChange(
      emails.map((e) => {
        if (e.id === id) {
          return { ...e, ...patch };
        }
        if (patch.isPrimary) {
          return { ...e, isPrimary: false };
        }
        return e;
      })
    );
  };

  React.useEffect(() => {
    if (required && emails.length === 0) {
      addEmail();
    }
  }, [required, emails.length]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-[#374151]" />
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={addEmail}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#D68904] hover:text-[#B57403] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Email</span>
        </button>
      </div>

      <div className="space-y-2">
        {emails.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800"
          >
            <div className="w-32 shrink-0">
              <Select
                value={item.type}
                onChange={(e) => updateEmail(item.id, { type: e.target.value as MultiEmailItem['type'] })}
                options={[
                  { value: 'official', label: 'Official / Work' },
                  { value: 'personal', label: 'Personal' },
                  { value: 'billing', label: 'Billing / Invoices' },
                  { value: 'notifications', label: 'Alerts' },
                ]}
              />
            </div>

            <div className="flex-1 min-w-0">
              <Input
                type="email"
                placeholder="e.g. info@vendor.co.tz"
                value={item.email}
                onChange={(e) => updateEmail(item.id, { email: e.target.value })}
                required={required && idx === 0}
              />
            </div>

            <button
              type="button"
              onClick={() => updateEmail(item.id, { isPrimary: true })}
              title={item.isPrimary ? 'Primary email' : 'Set as primary'}
              className={cn(
                'p-1.5 rounded text-xs transition-colors',
                item.isPrimary
                  ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <Star className={cn('w-4 h-4', item.isPrimary && 'fill-amber-500 text-amber-500')} />
            </button>

            {emails.length > 1 && (
              <button
                type="button"
                onClick={() => removeEmail(item.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                title="Remove email"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── 3. Address Multi-Input ──────────────────────────────────────────────────

export interface MultiAddressItem {
  id: string;
  address: string;
  city: string;
  region?: string;
  type: 'physical_hq' | 'postal' | 'branch' | 'site';
  isPrimary?: boolean;
}

interface MultiAddressInputProps {
  label?: string;
  addresses: MultiAddressItem[];
  onChange: (addresses: MultiAddressItem[]) => void;
  className?: string;
  required?: boolean;
}

export const MultiAddressInput: React.FC<MultiAddressInputProps> = ({
  label = 'Addresses & Locations',
  addresses,
  onChange,
  className,
  required,
}) => {
  const addAddress = () => {
    onChange([
      ...addresses,
      {
        id: `addr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        address: '',
        city: 'Dar es Salaam',
        region: 'Dar es Salaam',
        type: addresses.length === 0 ? 'physical_hq' : 'postal',
        isPrimary: addresses.length === 0,
      },
    ]);
  };

  const removeAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    if (updated.length > 0 && !updated.some((a) => a.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const updateAddress = (id: string, patch: Partial<MultiAddressItem>) => {
    onChange(
      addresses.map((a) => {
        if (a.id === id) {
          return { ...a, ...patch };
        }
        if (patch.isPrimary) {
          return { ...a, isPrimary: false };
        }
        return a;
      })
    );
  };

  React.useEffect(() => {
    if (required && addresses.length === 0) {
      addAddress();
    }
  }, [required, addresses.length]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#374151]" />
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={addAddress}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#D68904] hover:text-[#B57403] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Address</span>
        </button>
      </div>

      <div className="space-y-2.5">
        {addresses.map((item, idx) => (
          <div
            key={item.id}
            className="p-3 rounded-lg bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="w-40">
                <Select
                  value={item.type}
                  onChange={(e) => updateAddress(item.id, { type: e.target.value as MultiAddressItem['type'] })}
                  options={[
                    { value: 'physical_hq', label: 'Physical HQ / Office' },
                    { value: 'postal', label: 'Postal (P.O. Box)' },
                    { value: 'branch', label: 'Branch / Warehouse' },
                    { value: 'site', label: 'Field Site' },
                  ]}
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateAddress(item.id, { isPrimary: true })}
                  className={cn(
                    'px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors',
                    item.isPrimary
                      ? 'text-amber-700 bg-amber-100 dark:bg-amber-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-700'
                  )}
                >
                  <Star className={cn('w-3.5 h-3.5', item.isPrimary && 'fill-amber-500 text-amber-500')} />
                  <span>{item.isPrimary ? 'Primary Location' : 'Set as Primary'}</span>
                </button>

                {addresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAddress(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <Input
                  placeholder="Street / Building / Plot No / P.O. Box"
                  value={item.address}
                  onChange={(e) => updateAddress(item.id, { address: e.target.value })}
                  required={required && idx === 0}
                />
              </div>
              <div>
                <Input
                  placeholder="City / District"
                  value={item.city}
                  onChange={(e) => updateAddress(item.id, { city: e.target.value })}
                  required={required && idx === 0}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── 4. Bank Details Multi-Input ─────────────────────────────────────────────

export interface MultiBankItem {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swiftCode?: string;
  currency: 'TZS' | 'USD' | 'EUR' | 'GBP';
  isPrimary?: boolean;
}

interface MultiBankDetailsInputProps {
  label?: string;
  banks: MultiBankItem[];
  onChange: (banks: MultiBankItem[]) => void;
  className?: string;
  required?: boolean;
}

export const COMMON_TANZANIAN_BANKS = [
  'CRDB Bank Plc',
  'NMB Bank Plc',
  'National Bank of Commerce (NBC)',
  'Standard Chartered Bank Tanzania',
  'Stanbic Bank Tanzania',
  'Absa Bank Tanzania',
  'Exim Bank Tanzania',
  'Diamond Trust Bank (DTB)',
  'KCB Bank Tanzania',
  'Equity Bank Tanzania',
  'Azania Bank',
  'Bank of Africa (BOA)',
  'Tanzania Postal Bank (TPB)',
  'Amana Bank',
  'M-Pesa / Vodacom Lipa Namba',
  'Tigo Pesa / Airtel Money',
  'Other Bank / Institution',
];

export const MultiBankDetailsInput: React.FC<MultiBankDetailsInputProps> = ({
  label = 'Bank Accounts & Settlement Details',
  banks,
  onChange,
  className,
  required,
}) => {
  const addBank = () => {
    onChange([
      ...banks,
      {
        id: `bank-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        bankName: 'CRDB Bank Plc',
        accountName: '',
        accountNumber: '',
        branch: '',
        swiftCode: '',
        currency: 'TZS',
        isPrimary: banks.length === 0,
      },
    ]);
  };

  const removeBank = (id: string) => {
    const updated = banks.filter((b) => b.id !== id);
    if (updated.length > 0 && !updated.some((b) => b.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const updateBank = (id: string, patch: Partial<MultiBankItem>) => {
    onChange(
      banks.map((b) => {
        if (b.id === id) {
          return { ...b, ...patch };
        }
        if (patch.isPrimary) {
          return { ...b, isPrimary: false };
        }
        return b;
      })
    );
  };

  React.useEffect(() => {
    if (required && banks.length === 0) {
      addBank();
    }
  }, [required, banks.length]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-[#374151]" />
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={addBank}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#D68904] hover:text-[#B57403] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Bank Account</span>
        </button>
      </div>

      <div className="space-y-3">
        {banks.map((item, idx) => (
          <div
            key={item.id}
            className="p-3.5 rounded-lg bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                  Account #{idx + 1}
                </span>
                {item.isPrimary && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Primary Settlement
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateBank(item.id, { isPrimary: true })}
                  className={cn(
                    'px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors',
                    item.isPrimary
                      ? 'text-amber-700 bg-amber-50 font-semibold'
                      : 'text-slate-400 hover:text-slate-700'
                  )}
                >
                  <Star className={cn('w-3.5 h-3.5', item.isPrimary && 'fill-amber-500 text-amber-500')} />
                  <span>{item.isPrimary ? 'Default Account' : 'Set as Default'}</span>
                </button>

                {banks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBank(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  Bank / Financial Institution *
                </label>
                <input
                  list={`bank-options-${item.id}`}
                  value={item.bankName}
                  onChange={(e) => updateBank(item.id, { bankName: e.target.value })}
                  placeholder="Select or enter bank name"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 focus:outline-hidden focus:ring-2 focus:ring-[#D68904]"
                />
                <datalist id={`bank-options-${item.id}`}>
                  {COMMON_TANZANIAN_BANKS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  Account Name / Holder *
                </label>
                <Input
                  placeholder="Account holder registered name"
                  value={item.accountName}
                  onChange={(e) => updateBank(item.id, { accountName: e.target.value })}
                  required={required && idx === 0}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  Account Number / IBAN *
                </label>
                <Input
                  placeholder="Account / Till / Paybill number"
                  value={item.accountNumber}
                  onChange={(e) => updateBank(item.id, { accountNumber: e.target.value })}
                  required={required && idx === 0}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    Branch / SWIFT
                  </label>
                  <Input
                    placeholder="e.g. Tower Branch / SWIFT"
                    value={item.branch}
                    onChange={(e) => updateBank(item.id, { branch: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    Currency
                  </label>
                  <Select
                    value={item.currency}
                    onChange={(e) => updateBank(item.id, { currency: e.target.value as MultiBankItem['currency'] })}
                    options={[
                      { value: 'TZS', label: 'TZS' },
                      { value: 'USD', label: 'USD' },
                      { value: 'EUR', label: 'EUR' },
                      { value: 'GBP', label: 'GBP' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Serialization & Migration Helpers ───────────────────────────────────────

export function serializeMultiValues<T>(items: T[]): string {
  return JSON.stringify(items);
}

export function parseMultiValues<T>(data: unknown, fallback: T[] = []): T[] {
  if (!data) return fallback;
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not JSON string
    }
  }
  return fallback;
}
