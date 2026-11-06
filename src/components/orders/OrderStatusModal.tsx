import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import Modal from '../common/Modal';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, note?: string, cancelReason?: string) => void;
  currentUserName: string;
}

const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  'Confirmed',
  'In Production/Preparation',
  'Ready to Ship',
  'Shipped',
  'Delivered',
  'Completed',
];

export default function OrderStatusModal({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
  currentUserName,
}: OrderStatusModalProps) {
  if (!order) return null;

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState('');

  const isCurrentStatusCancelled = order.status === 'Cancelled';
  const isTargetCancelled = selectedStatus === 'Cancelled';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTargetCancelled && !cancelReason.trim()) {
      setError('Please provide a specific cancellation reason.');
      return;
    }

    onUpdateStatus(
      order.id,
      selectedStatus,
      note.trim() || undefined,
      isTargetCancelled ? cancelReason.trim() : undefined
    );
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Order Status - ${order.orderNumber}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current status display */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Current Status</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{order.status}</p>
          </div>
          <span className="text-xs font-mono text-gray-500">{order.orderType}</span>
        </div>

        {/* Status choices */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Select New Status *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ORDER_STATUS_SEQUENCE.map(st => {
              const isSelected = selectedStatus === st;
              const isCurrent = order.status === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(st);
                    setError('');
                  }}
                  className={`text-left p-2.5 rounded-lg border text-xs font-medium transition flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{st}</span>
                  {isCurrent && <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">Active</span>}
                </button>
              );
            })}

            {/* Cancelled option */}
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('Cancelled');
                setError('');
              }}
              className={`text-left p-2.5 rounded-lg border text-xs font-medium transition col-span-2 flex items-center justify-between ${
                selectedStatus === 'Cancelled'
                  ? 'border-red-600 bg-red-50 text-red-900 shadow-xs'
                  : 'border-red-200 bg-white text-red-700 hover:bg-red-50'
              }`}
            >
              <span className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                Cancel Order
              </span>
              {order.status === 'Cancelled' && (
                <span className="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded">Active</span>
              )}
            </button>
          </div>
        </div>

        {/* If Cancelled, require reason */}
        {isTargetCancelled && (
          <div className="bg-red-50/70 p-3.5 rounded-lg border border-red-200 space-y-2">
            <label className="block text-xs font-bold text-red-900 uppercase tracking-wider">
              Cancellation Reason * (Required)
            </label>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={e => {
                setCancelReason(e.target.value);
                setError('');
              }}
              placeholder="e.g. Moisture test exceeded threshold, buyer failed to open operative LC, freight cost hike..."
              className="w-full text-xs rounded border border-red-300 p-2 focus:ring-red-500 focus:border-red-500 bg-white"
              required
            />
            {error && <p className="text-red-700 text-xs font-semibold">{error}</p>}
          </div>
        )}

        {/* Status transition log note */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Status Update Note (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Stuffed into 40ft containers, seal #889211 applied."
            className="w-full text-xs rounded-lg border border-gray-300 p-2 bg-white"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Logged under: <span className="font-medium text-gray-700">{currentUserName}</span>
          </p>
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
            className={`px-4 py-2 text-white rounded-lg text-sm font-semibold shadow-xs transition ${
              isTargetCancelled ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            {isTargetCancelled ? 'Confirm Cancellation' : 'Update Order Status'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
