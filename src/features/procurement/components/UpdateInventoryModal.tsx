import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { InventoryItemRecord, UpdateInventoryInput } from '../types/procurement';

interface UpdateInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItemRecord | null;
  onSubmit: (input: UpdateInventoryInput) => Promise<void>;
}

export const UpdateInventoryModal: React.FC<UpdateInventoryModalProps> = ({
  isOpen,
  onClose,
  item,
  onSubmit,
}) => {
  const [actionType, setActionType] = useState<'restock' | 'dispense'>('restock');
  const [amount, setAmount] = useState('10');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const delta = parseInt(amount, 10);
    if (isNaN(delta) || delta <= 0) {
      setError('Please provide a positive quantity count.');
      return;
    }

    if (actionType === 'dispense' && delta > item.quantityOnHand) {
      setError(`Cannot dispense ${delta} items. Only ${item.quantityOnHand} currently in stock.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        itemId: item.id,
        quantityChange: actionType === 'restock' ? delta : -delta,
        reason: reason.trim() || (actionType === 'restock' ? 'Warehouse replenishment' : 'Dispatched to field activity'),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update inventory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title={`Update Stock: ${item.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
            {error}
          </div>
        )}

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700 text-xs flex justify-between items-center">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">SKU: {item.sku}</span>
            <span className="font-semibold text-slate-900 dark:text-white">{item.name}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase">Current Balance</span>
            <span className="text-base font-bold text-[#D68904]">
              {item.quantityOnHand} {item.unitOfMeasure}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
              Operation Type
            </label>
            <Select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as 'restock' | 'dispense')}
              className="text-xs w-full"
            >
              <option value="restock">+ Restock / Receive Supplies</option>
              <option value="dispense">- Dispense to Field Activity</option>
            </Select>
          </div>

          <Input
            type="number"
            min="1"
            label="Quantity Units"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <Input
          label="Reason / Dispatch Reference"
          placeholder="e.g. Dispatched for Kigamboni Session 2 or Received Delivery PO-001"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-[#D68904] hover:bg-[#b45309]">
            Confirm Stock Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
