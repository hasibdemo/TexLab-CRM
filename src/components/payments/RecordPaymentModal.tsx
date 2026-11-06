import React, { useState, useEffect } from 'react';
import { PaymentMilestone, PaymentRecord, PaymentMethod, CurrencyCode } from '../../types';
import { ordersService } from '../../services/ordersService';
import { paymentsService } from '../../services/paymentsService';
import Modal from '../common/Modal';
import { CreditCard, DollarSign } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: PaymentMilestone | null;
  onPaymentRecorded: (record: PaymentRecord) => void;
  currentUserName: string;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  milestone,
  onPaymentRecorded,
  currentUserName,
}: RecordPaymentModalProps) {
  if (!milestone) return null;

  const order = ordersService.getOrderById(milestone.orderId);
  const remaining = Math.max(0, milestone.amount - (milestone.paidAmount || 0));

  const [amount, setAmount] = useState<number>(remaining);
  const [currency, setCurrency] = useState<CurrencyCode>(milestone.currency);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>(milestone.method || 'TT');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && milestone) {
      const rem = Math.max(0, milestone.amount - (milestone.paidAmount || 0));
      setAmount(rem);
      setCurrency(milestone.currency);
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setReferenceNumber('');
      setMethod(milestone.method || 'TT');
      setNotes('');
      setError('');
    }
  }, [isOpen, milestone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }
    if (!referenceNumber.trim()) {
      setError('A bank reference number, SWIFT advice, or voucher ID is required.');
      return;
    }

    const record = paymentsService.recordPayment({
      milestoneId: milestone.id,
      orderId: milestone.orderId,
      amount: Number(amount),
      currency,
      paymentDate,
      referenceNumber: referenceNumber.trim(),
      method,
      notes: notes.trim() || undefined,
      recordedBy: currentUserName,
    });

    onPaymentRecorded(record);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment / Remittance" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Milestone info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 space-y-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">
                {order ? `${order.orderNumber} • ${order.orderType}` : 'Order Payment'}
              </p>
              <p className="text-sm font-bold text-blue-950 mt-0.5">{milestone.name}</p>
            </div>
            <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800">
              Total: {milestone.currency} {milestone.amount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 pt-1 border-t border-blue-100">
            <span>Already Paid: {milestone.currency} {(milestone.paidAmount || 0).toLocaleString()}</span>
            <span className="font-bold text-blue-900">
              Remaining: {milestone.currency} {remaining.toLocaleString()}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        {/* Amount & Currency */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Payment Amount *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                max={milestone.amount * 1.5}
                value={amount}
                onChange={e => setAmount(Number(e.target.value) || 0)}
                className="w-full text-sm font-mono font-bold rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border text-right pr-4"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Currency
            </label>
            <input
              type="text"
              value={currency}
              disabled
              className="w-full text-sm font-mono rounded-lg border-gray-200 bg-gray-100 px-3 py-2 border text-gray-600"
            />
          </div>
        </div>

        {/* Date and Method */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Method *
            </label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as PaymentMethod)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="TT">T/T (Telegraphic Transfer)</option>
              <option value="LC at sight">LC at sight</option>
              <option value="Usance LC">Usance LC</option>
              <option value="CAD">CAD (Cash Against Documents)</option>
              <option value="Cash">Cash / Cheque</option>
            </select>
          </div>
        </div>

        {/* Bank Reference */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Bank Transaction / SWIFT Reference *
          </label>
          <input
            type="text"
            value={referenceNumber}
            onChange={e => setReferenceNumber(e.target.value)}
            placeholder="e.g. SWIFT-ENBD-8891023 or UTR #10928374"
            className="w-full text-sm font-mono rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Notes / Bank Account Details
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Credited into Emirates NBD AED account, standard bank charges deducted."
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
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            Record Payment Receipt
          </button>
        </div>
      </form>
    </Modal>
  );
}
