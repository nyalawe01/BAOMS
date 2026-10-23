import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { CreatePurchaseOrderInput, VendorRecord } from '../types/procurement';

interface OrderItemDraft {
  description: string;
  quantity: string;
  unitOfMeasure: string;
  unitPrice: string;
}

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: VendorRecord[];
  onSubmit: (input: CreatePurchaseOrderInput) => Promise<void>;
}

export const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  vendors,
  onSubmit,
}) => {
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [title, setTitle] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItemDraft[]>([
    { description: '', quantity: '1', unitOfMeasure: 'units', unitPrice: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: '', quantity: '1', unitOfMeasure: 'units', unitPrice: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof OrderItemDraft, value: string) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = copy[index];
      if (target) {
        copy[index] = { ...target, [field]: value };
      }
      return copy;
    });
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unitPrice) || 0;
      return sum + q * p;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Order title is required.');
      return;
    }

    if (!vendorId) {
      setError('Please select a registered vendor.');
      return;
    }

    const validItems = items.map((it) => ({
      description: it.description.trim(),
      quantity: parseFloat(it.quantity) || 0,
      unitOfMeasure: it.unitOfMeasure.trim() || 'units',
      unitPrice: parseFloat(it.unitPrice) || 0,
    }));

    if (validItems.some((it) => !it.description || it.quantity <= 0 || it.unitPrice <= 0)) {
      setError('Please specify description, valid quantity, and unit price for all items.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        vendorId,
        title: title.trim(),
        expectedDeliveryDate,
        currency: 'TZS',
        items: validItems,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Issue Purchase Order (PO)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
            {error}
          </div>
        )}

        <Input
          label="Purchase Order Title"
          placeholder="e.g. Workshop Stationery & Art Supplies"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
              Select Approved Vendor *
            </label>
            <Select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="text-xs w-full"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.businessName} ({v.vendorCode})
                </option>
              ))}
            </Select>
          </div>

          <DatePicker
            label="Expected Delivery Date"
            value={expectedDeliveryDate}
            onChange={(val) => setExpectedDeliveryDate(val)}
            required
          />
        </div>

        {/* Itemized Lines */}
        <div className="border border-slate-200 dark:border-neutral-700 rounded-xl p-3 bg-slate-50/50 dark:bg-neutral-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
              Procurement Line Items
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      placeholder="Item specification / description"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0.1"
                      step="any"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="text-xs text-right"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="UoM (e.g. set, ream)"
                      value={item.unitOfMeasure}
                      onChange={(e) => handleItemChange(idx, 'unitOfMeasure', e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Unit Price (TZS)"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      className="text-xs text-right"
                      required
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-red-600 disabled:opacity-20 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-neutral-700 flex justify-between items-center text-xs font-semibold">
            <span>Total Purchase Order Value:</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              TZS {calculateTotal().toLocaleString()}
            </span>
          </div>
        </div>

        <Textarea
          label="Procurement Notes & Delivery Instructions (Optional)"
          placeholder="Delivery contact person, storage location, or inspection requirements..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-[#D68904] hover:bg-[#b45309]">
            Submit Purchase Order
          </Button>
        </div>
      </form>
    </Modal>
  );
};
