import React, { useState } from 'react';
import { Deal } from '../../types';
import { Modal } from '../common/Modal';
import { AlertCircle } from 'lucide-react';

interface MoveStageLostModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  onConfirm: (reason: string) => void;
}

const COMMON_LOST_REASONS = [
  'Competitor offered lower CIF price',
  'Buyer delayed / canceled seasonal spinning project',
  'Lab sample failed quality / tensile strength test',
  'Payment / LC terms rejected by bank',
  'Shipping / port freight rate surge made deal unfeasible',
  'Import quota / customs clearance permit denied',
];

export function MoveStageLostModal({
  isOpen,
  onClose,
  deal,
  onConfirm,
}: MoveStageLostModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!deal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for closing this deal as Lost.');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Deal as Lost"
      subtitle="Documenting lost reasons helps trade intelligence and future price renegotiations."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-900">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">{deal.title}</span>
            <span className="text-slate-600 mt-0.5 block">
              Moving this deal to Lost will set probability to 0% and record an entry in the deal audit trail.
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Reason for Loss <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="Specify why this trade deal was not concluded (e.g. price difference, test outcome, delivery timeline)..."
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              error ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
            } focus:outline-none focus:ring-1 focus:ring-blue-900`}
          />
          {error && <span className="text-xs text-rose-600 mt-1 block">{error}</span>}
        </div>

        <div>
          <span className="text-[11px] text-slate-500 block mb-1.5">Quick Suggestions:</span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_LOST_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setReason(r);
                  if (error) setError('');
                }}
                className="text-[11px] px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors text-left"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs"
          >
            Confirm as Lost
          </button>
        </div>
      </form>
    </Modal>
  );
}
