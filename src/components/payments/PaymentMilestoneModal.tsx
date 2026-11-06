import React, { useState, useEffect } from 'react';
import { PaymentMilestone, PaymentMethod, CurrencyCode } from '../../types';
import { paymentsService } from '../../services/paymentsService';
import Modal from '../common/Modal';

interface PaymentMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderTotal: number;
  currency: CurrencyCode;
  milestoneToEdit?: PaymentMilestone | null;
  onSaved: (milestone: PaymentMilestone) => void;
}

export default function PaymentMilestoneModal({
  isOpen,
  onClose,
  orderId,
  orderTotal,
  currency,
  milestoneToEdit,
  onSaved,
}: PaymentMilestoneModalProps) {
  const [name, setName] = useState(milestoneToEdit?.name || 'Advance (30%)');
  const [percentage, setPercentage] = useState<number>(milestoneToEdit?.percentage || 30);
  const [amount, setAmount] = useState<number>(
    milestoneToEdit?.amount || Math.round(orderTotal * 0.3)
  );
  const [dueDate, setDueDate] = useState<string>(
    milestoneToEdit?.dueDate ||
      new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [method, setMethod] = useState<PaymentMethod>(milestoneToEdit?.method || 'TT');
  const [notes, setNotes] = useState<string>(milestoneToEdit?.notes || '');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (milestoneToEdit) {
        setName(milestoneToEdit.name);
        setPercentage(milestoneToEdit.percentage || 0);
        setAmount(milestoneToEdit.amount);
        setDueDate(milestoneToEdit.dueDate);
        setMethod(milestoneToEdit.method);
        setNotes(milestoneToEdit.notes || '');
      } else {
        setName('Advance (30%)');
        setPercentage(30);
        setAmount(Math.round(orderTotal * 0.3));
        setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
        setMethod('TT');
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, milestoneToEdit, orderTotal]);

  const handlePercentageChange = (pct: number) => {
    setPercentage(pct);
    if (orderTotal > 0 && pct >= 0) {
      setAmount(Math.round((orderTotal * pct) / 100));
    }
  };

  const handleAmountChange = (amt: number) => {
    setAmount(amt);
    if (orderTotal > 0 && amt >= 0) {
      setPercentage(Math.round((amt / orderTotal) * 100));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Milestone name is required');
      return;
    }
    if (!amount || amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!dueDate) {
      setError('Due date is required');
      return;
    }

    if (milestoneToEdit) {
      const updated = paymentsService.updateMilestone(milestoneToEdit.id, {
        name: name.trim(),
        percentage: Number(percentage) || undefined,
        amount: Number(amount),
        dueDate,
        method,
        notes: notes.trim() || undefined,
      });
      onSaved(updated);
    } else {
      const created = paymentsService.createMilestone({
        orderId,
        name: name.trim(),
        percentage: Number(percentage) || undefined,
        amount: Number(amount),
        currency,
        dueDate,
        method,
        notes: notes.trim() || undefined,
      });
      onSaved(created);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={milestoneToEdit ? 'Edit Payment Milestone' : 'Add Payment Milestone'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Milestone Name *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Advance (30%) or Against B/L Documents (70%)"
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
              required
            />
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {['Advance (30%)', 'Against Documents (70%)', 'Balance (50%)', 'Full Payment (100%)'].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setName(preset);
                  const m = preset.match(/(\d+)%/);
                  if (m) handlePercentageChange(parseInt(m[1], 10));
                }}
                className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded transition"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Percentage of Order (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={percentage}
              onChange={e => handlePercentageChange(Number(e.target.value) || 0)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Amount ({currency}) *
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              value={amount}
              onChange={e => handleAmountChange(Number(e.target.value) || 0)}
              className="w-full text-sm font-bold font-mono text-right rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Due Date *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Expected Method *
            </label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as PaymentMethod)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="TT">T/T (Telegraphic Transfer)</option>
              <option value="LC at sight">LC at sight</option>
              <option value="Usance LC">Usance LC</option>
              <option value="CAD">CAD (Cash Against Docs)</option>
              <option value="Cash">Cash / Cheque</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Notes / Milestones Instructions
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Due 5 days after non-negotiable B/L copy emailed to buyer."
            className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            {milestoneToEdit ? 'Save Milestone' : 'Add Milestone'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
