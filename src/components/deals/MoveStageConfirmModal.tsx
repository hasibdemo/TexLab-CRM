import { Deal, Company } from '../../types';
import { currencyService } from '../../services/currencyService';
import { Modal } from '../common/Modal';
import { CheckCircle2, ShieldCheck, DollarSign, Package } from 'lucide-react';

interface MoveStageConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  company?: Company | null;
  onConfirm: () => void;
}

export function MoveStageConfirmModal({
  isOpen,
  onClose,
  deal,
  company,
  onConfirm,
}: MoveStageConfirmModalProps) {
  if (!deal) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Order Execution"
      subtitle="Mark this trade deal as legally / commercially confirmed."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{deal.title}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-emerald-950 pt-1 border-t border-emerald-200/60 font-mono">
            <div>
              <span className="text-slate-500 font-sans block text-[11px]">Total Contract Value</span>
              <strong className="text-sm font-bold text-emerald-900">
                {currencyService.formatAmount(deal.totalValue, deal.currency)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 font-sans block text-[11px]">Quantity</span>
              <strong>{deal.quantity} {deal.unit}</strong>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-sans">
            <div><strong>Counterparty:</strong> {company ? company.name : 'Registered Partner'}</div>
            <div><strong>Incoterm:</strong> {deal.incoterm} · {deal.destinationPort}</div>
            <div><strong>Payment Terms:</strong> {deal.paymentTerms}</div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Confirming this order will set the deal probability to <strong>100%</strong> and log a milestone timestamp in the deal history.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Confirm Order</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
