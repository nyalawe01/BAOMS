import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RegisterVendorInput, VendorCategory } from '../types/procurement';

interface RegisterVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: RegisterVendorInput) => Promise<void>;
}

export const RegisterVendorModal: React.FC<RegisterVendorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('stationery_printing');
  const [customCategory, setCustomCategory] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!businessName.trim() || !contactPerson.trim() || !phone.trim() || !physicalAddress.trim()) {
      setError('Please fill all required vendor details (Business name, contact person, phone, and address).');
      return;
    }

    if (category === 'other' && !customCategory.trim()) {
      setError('Please specify the vendor custom category.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        businessName: businessName.trim(),
        category: category === 'other' ? customCategory.trim() : category,
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        physicalAddress: physicalAddress.trim(),
        tinNumber: tinNumber.trim() || undefined,
        bankName: bankName.trim() || undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register vendor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Register Approved Vendor">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Business / Enterprise Name *"
            placeholder="e.g. Dar Office Essentials Ltd"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
              Vendor Primary Category *
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as VendorCategory)}
              className="text-xs w-full"
            >
              <option value="stationery_printing">Stationery & Printing</option>
              <option value="theater_art_supplies">Theater & Art Materials</option>
              <option value="venue_catering">Venue & Catering Services</option>
              <option value="transport_logistics">Transport & Passenger Logistics</option>
              <option value="it_hardware">ICT & Hardware Supplies</option>
              <option value="general_services">General Facilities & Services</option>
              <option value="other">Other (Category not listed)...</option>
            </Select>
            {category === 'other' && (
              <div className="mt-2">
                <Input
                  label="Specify Custom Category *"
                  placeholder="e.g. Media, Photography & Audio"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Key Contact Person *"
            placeholder="e.g. Salim M. Nassor"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            required
          />

          <Input
            type="email"
            label="Official Email Address"
            placeholder="orders@vendor.co.tz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Phone Number *"
            placeholder="+255 754 000 000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <Input
          label="Physical Premises / Ward Address *"
          placeholder="e.g. Plot 42, Gerezani St, Kariakoo, Dar es Salaam"
          value={physicalAddress}
          onChange={(e) => setPhysicalAddress(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="TIN Number (Tax Compliance)"
            placeholder="e.g. 104-998-123"
            value={tinNumber}
            onChange={(e) => setTinNumber(e.target.value)}
          />

          <Input
            label="Settlement Bank Name"
            placeholder="e.g. CRDB Bank / NMB"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />

          <Input
            label="Bank Account Number"
            placeholder="e.g. 0150244455500"
            value={bankAccountNumber}
            onChange={(e) => setBankAccountNumber(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-[#D68904] hover:bg-[#b45309]">
            Register Vendor
          </Button>
        </div>
      </form>
    </Modal>
  );
};
