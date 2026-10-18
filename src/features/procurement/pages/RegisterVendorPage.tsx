/**
 * RegisterVendorPage — Full-page stepper for registering approved organizational vendors
 * BAOMS | Babawatoto Organization Management System
 *
 * Steps:
 *   1. Business Identity   — Enterprise name, registration, category, contact person
 *   2. Contacts & Address  — Multi-phone, multi-email, multi-address
 *   3. Financial & Banking — Multi-bank accounts, Lipa Namba, payment terms
 *   4. Supporting Docs     — Upload documents with custom name renaming
 *   5. Review & Submit     — Complete verification summary
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Phone,
  CreditCard,
  FileStack,
  CheckCircle2,
  Briefcase,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { FullPageStepper, FullPageStep } from '@/components/ui/FullPageStepper';
import { DocumentUploadSection, UploadedDocument } from '@/components/ui/DocumentUploadSection';
import {
  MultiPhoneInput,
  MultiPhoneItem,
  MultiEmailInput,
  MultiEmailItem,
  MultiAddressInput,
  MultiAddressItem,
  MultiBankDetailsInput,
  MultiBankItem,
} from '@/components/ui/MultiContactAndBankFields';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/lib/ToastContext';
import { registerVendor } from '../services/procurementService';
import { VendorCategory, RegisterVendorInput } from '../types/procurement';

// ─── Steps Definition ────────────────────────────────────────────────────────

const STEPS: FullPageStep[] = [
  {
    id: 'identity',
    title: 'Business Identity',
    subtitle: 'Legal enterprise details & trade category',
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    id: 'contacts',
    title: 'Contacts & Addresses',
    subtitle: 'Multi-phone, multi-email & office locations',
    icon: <Phone className="w-4 h-4" />,
  },
  {
    id: 'banking',
    title: 'Financial & Settlement',
    subtitle: 'Bank accounts, mobile money & payment terms',
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    id: 'documents',
    title: 'Supporting Documents',
    subtitle: 'TIN, BRELA, business license (with custom names)',
    icon: <FileStack className="w-4 h-4" />,
  },
  {
    id: 'review',
    title: 'Review & Register',
    subtitle: 'Confirm information before onboarding',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface RegisterVendorPageProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const RegisterVendorPage: React.FC<RegisterVendorPageProps> = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Step 1: Identity
  const [businessName, setBusinessName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('stationery_printing');
  const [customCategory, setCustomCategory] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [vrnNumber, setVrnNumber] = useState('');
  const [brelaNumber, setBrelaNumber] = useState('');

  // Step 2: Contacts & Address
  const [phones, setPhones] = useState<MultiPhoneItem[]>([
    {
      id: 'phone-1',
      number: '',
      type: 'primary',
      isPrimary: true,
    },
  ]);
  const [emails, setEmails] = useState<MultiEmailItem[]>([
    {
      id: 'email-1',
      email: '',
      type: 'official',
      isPrimary: true,
    },
  ]);
  const [addresses, setAddresses] = useState<MultiAddressItem[]>([
    {
      id: 'addr-1',
      address: '',
      city: 'Dar es Salaam',
      region: 'Dar es Salaam',
      type: 'physical_hq',
      isPrimary: true,
    },
  ]);

  // Step 3: Financial & Settlement
  const [banks, setBanks] = useState<MultiBankItem[]>([
    {
      id: 'bank-1',
      bankName: 'CRDB Bank Plc',
      accountName: '',
      accountNumber: '',
      branch: '',
      currency: 'TZS',
      isPrimary: true,
    },
  ]);
  const [paymentTerms, setPaymentTerms] = useState('30_days_net');

  // Step 4: Documents
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  // Validation
  const validateCurrentStep = (): boolean => {
    setValidationError(null);

    if (currentStep === 0) {
      if (!businessName.trim()) {
        setValidationError('Business / Enterprise Name is required.');
        return false;
      }
      if (!contactPerson.trim()) {
        setValidationError('Primary Contact Person is required.');
        return false;
      }
      if (category === 'other' && !customCategory.trim()) {
        setValidationError('Please specify the custom category.');
        return false;
      }
    }

    if (currentStep === 1) {
      const validPhone = phones.some((p) => p.number.trim().length >= 8);
      if (!validPhone) {
        setValidationError('At least one valid phone number is required.');
        return false;
      }
      const validEmail = emails.some((e) => e.email.trim().includes('@'));
      if (!validEmail) {
        setValidationError('At least one valid email address is required.');
        return false;
      }
      const validAddress = addresses.some((a) => a.address.trim().length > 0);
      if (!validAddress) {
        setValidationError('At least one physical or postal address is required.');
        return false;
      }
    }

    if (currentStep === 2) {
      const validBank = banks.some((b) => b.accountNumber.trim().length > 0 && b.accountName.trim().length > 0);
      if (!validBank) {
        setValidationError('Please enter at least one bank account or payment settlement details.');
        return false;
      }
    }

    return true;
  };

  const handleStepChange = (nextStep: number) => {
    if (nextStep > currentStep) {
      if (!validateCurrentStep()) return;
    }
    setCurrentStep(nextStep);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const primaryPhone = phones.find((p) => p.isPrimary)?.number || phones[0]?.number || '';
      const primaryEmail = emails.find((e) => e.isPrimary)?.email || emails[0]?.email || '';
      const primaryAddress = addresses.find((a) => a.isPrimary)?.address || addresses[0]?.address || '';
      const primaryBank = banks.find((b) => b.isPrimary) || banks[0];

      const input: RegisterVendorInput = {
        businessName: businessName.trim(),
        category: category === 'other' ? (customCategory.trim() as VendorCategory) : category,
        contactPerson: contactPerson.trim(),
        phone: primaryPhone,
        email: primaryEmail,
        physicalAddress: primaryAddress,
        tinNumber: tinNumber.trim() || undefined,
        vrnNumber: vrnNumber.trim() || undefined,
        bankName: primaryBank?.bankName,
        bankAccountNumber: primaryBank?.accountNumber,
        phones: phones.filter((p) => p.number.trim().length > 0),
        emails: emails.filter((e) => e.email.trim().length > 0),
        addresses: addresses.filter((a) => a.address.trim().length > 0),
        bankAccounts: banks.filter((b) => b.accountNumber.trim().length > 0),
        supportingDocuments: documents.map((d) => ({
          id: d.id,
          name: d.file.name,
          customName: d.customName,
          tag: d.tag,
        })),
        paymentTerms,
      };

      await registerVendor(input);

      showToast({
        title: 'Vendor Registered',
        message: `${businessName} has been enrolled into approved vendors.`,
        type: 'success',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/procurement');
      }
    } catch (err: any) {
      setValidationError(err.message || 'Failed to register vendor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/procurement');
    }
  };

  return (
    <FullPageStepper
      title="Register Approved Vendor"
      subtitle="Complete supplier vetting, multiple contact records, multi-bank accounts, and compliance documents."
      steps={STEPS}
      currentStep={currentStep}
      onStepChange={handleStepChange}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitLabel="Enrol Vendor"
      isSubmitting={isSubmitting}
    >
      {validationError && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{validationError}</span>
        </div>
      )}

      {/* ── STEP 1: BUSINESS IDENTITY ────────────────────────────────────── */}
      {currentStep === 0 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#374151]" />
              Enterprise Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Registered Business Name *"
                placeholder="e.g. Dar Office Stationery & IT Supplies Ltd"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />

              <Input
                label="Trade Name / Doing Business As (DBA)"
                placeholder="e.g. Dar Office Supplies"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
              />

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Procurement Category *
                </label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VendorCategory)}
                  options={[
                    { value: 'stationery_printing', label: 'Stationery & Printing' },
                    { value: 'ict_electronics', label: 'ICT Equipment & Electronics' },
                    { value: 'food_catering', label: 'Catering & Food Supplies' },
                    { value: 'transport_logistics', label: 'Transport & Logistics' },
                    { value: 'consultancy_training', label: 'Consultancy & Training' },
                    { value: 'maintenance_repairs', label: 'Facility Maintenance & Repairs' },
                    { value: 'medical_hygiene', label: 'Medical & Hygiene Supplies' },
                    { value: 'other', label: 'Other Special Category...' },
                  ]}
                />
              </div>

              {category === 'other' ? (
                <Input
                  label="Specify Custom Category *"
                  placeholder="e.g. Solar Energy Installations"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
              ) : (
                <Input
                  label="Primary Contact Person *"
                  placeholder="Full name of representative"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  required
                />
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#374151]" />
              Statutory Registration & Tax Compliance
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="TIN Number (TRA)"
                placeholder="e.g. 123-456-789"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
              />

              <Input
                label="VRN Number (VAT Registered)"
                placeholder="e.g. 40-001234-X"
                value={vrnNumber}
                onChange={(e) => setVrnNumber(e.target.value)}
              />

              <Input
                label="BRELA Registration No"
                placeholder="e.g. 145982"
                value={brelaNumber}
                onChange={(e) => setBrelaNumber(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: CONTACTS & ADDRESSES (MULTI-FIELDS) ───────────────────── */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#374151]" />
                Multi-Channel Contact Numbers
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add multiple phone numbers (Mobile, WhatsApp for orders, Office Landline, Emergency).
              </p>
            </div>

            <MultiPhoneInput
              phones={phones}
              onChange={setPhones}
              required
            />
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#374151]" />
                Multi-Department Email Addresses
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add official sales, billing / accounting, and notification email addresses.
              </p>
            </div>

            <MultiEmailInput
              emails={emails}
              onChange={setEmails}
              required
            />
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#374151]" />
                Physical & Postal Addresses
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add physical office address, postal box, and any regional warehouse locations.
              </p>
            </div>

            <MultiAddressInput
              addresses={addresses}
              onChange={setAddresses}
              required
            />
          </div>
        </div>
      )}

      {/* ── STEP 3: FINANCIAL & SETTLEMENT (MULTI-BANK ACCOUNTS) ─────────── */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#374151]" />
                Banking & Payout Accounts (Multi-Bank Supported)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Register multiple bank accounts or mobile money settlement channels. Select which account is primary.
              </p>
            </div>

            <MultiBankDetailsInput
              banks={banks}
              onChange={setBanks}
              required
            />
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#374151]" />
              Commercial Payment Terms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Agreed Payment Terms
                </label>
                <Select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  options={[
                    { value: 'immediate_delivery', label: 'Payment Upon Delivery & Inspection' },
                    { value: '15_days_net', label: '15 Days Net (From Invoice Date)' },
                    { value: '30_days_net', label: '30 Days Net (Standard Institutional Terms)' },
                    { value: '50_advance_50_delivery', label: '50% Advance / 50% Final Delivery' },
                    { value: 'custom', label: 'Custom Written Agreement' },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: SUPPORTING DOCUMENTS (CUSTOM RENAMABLE) ──────────────── */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileStack className="w-4 h-4 text-[#374151]" />
                Compliance & Supporting Documents (Optional)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload files such as TIN certificates, business licenses, or bank letters. You can rename each file with a custom document title.
              </p>
            </div>

            <DocumentUploadSection
              documents={documents}
              onChange={setDocuments}
              title="Upload Vendor Files"
              hint="PDF, PNG, JPG, or Excel up to 25MB each. User can rename each document before submission."
            />
          </div>
        </div>
      )}

      {/* ── STEP 5: REVIEW & REGISTER ────────────────────────────────────── */}
      {currentStep === 4 && (
        <div className="space-y-6">
          {/* Identity Summary */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Business Identity
              </span>
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="text-xs font-semibold text-[#D68904] hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Business Name</span>
                <span className="font-semibold text-slate-900">{businessName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Category</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {category === 'other' ? customCategory : category.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Contact Person</span>
                <span className="font-semibold text-slate-900">{contactPerson}</span>
              </div>
              <div>
                <span className="text-slate-400 block">TIN / VRN</span>
                <span className="font-semibold text-slate-900">
                  {tinNumber || '—'} {vrnNumber ? `(${vrnNumber})` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Contacts Summary */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Multi-Contacts & Addresses ({phones.length} phones, {emails.length} emails, {addresses.length} locations)
              </span>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-semibold text-[#D68904] hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium mb-1">Phone Numbers:</span>
                <ul className="space-y-1">
                  {phones.map((p) => (
                    <li key={p.id} className="text-slate-800 flex items-center gap-1.5">
                      <span className="font-mono">{p.number}</span>
                      <span className="text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600 capitalize">
                        {p.type} {p.isPrimary && '★'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-1">Email Addresses:</span>
                <ul className="space-y-1">
                  {emails.map((e) => (
                    <li key={e.id} className="text-slate-800 flex items-center gap-1.5 truncate">
                      <span>{e.email}</span>
                      <span className="text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600 capitalize">
                        {e.type}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-1">Addresses:</span>
                <ul className="space-y-1">
                  {addresses.map((a) => (
                    <li key={a.id} className="text-slate-800">
                      <div>{a.address}, {a.city}</div>
                      <span className="text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600 capitalize">
                        {a.type.replace('_', ' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Banking Summary */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Registered Bank Accounts ({banks.length})
              </span>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs font-semibold text-[#D68904] hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {banks.map((b, idx) => (
                <div key={b.id} className="p-2.5 rounded bg-slate-50 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">{b.bankName}</div>
                    <div className="text-slate-600">A/C: {b.accountNumber} ({b.accountName})</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-slate-700">{b.currency}</span>
                    {b.isPrimary && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Primary
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supporting Documents */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                4. Supporting Documents ({documents.length} attached)
              </span>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs font-semibold text-[#D68904] hover:underline"
              >
                Edit
              </button>
            </div>
            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No supporting documents uploaded.</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between p-2 rounded bg-slate-50">
                    <div className="flex items-center gap-2">
                      <FileStack className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-800">{d.customName}</span>
                      <span className="text-slate-400">({d.file.name})</span>
                    </div>
                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 uppercase">
                      {d.tag}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </FullPageStepper>
  );
};
