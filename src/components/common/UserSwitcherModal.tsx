import { User } from '../../types';
import { DEMO_USERS } from '../../services/seedData';
import { Modal } from './Modal';
import { ShieldCheck, User as UserIcon } from 'lucide-react';

interface UserSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSelectUser: (user: User) => void;
}

export function UserSwitcherModal({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
}: UserSwitcherModalProps) {
  const roleDescriptions: Record<string, string> = {
    CEO: 'Full unrestricted access to all CRM operations, reports, exports, and company deletions.',
    Sales: 'Access to Dashboard, Companies, Contacts, and Activity logs for trading and sales pipelines.',
    Procurement: 'Access to Dashboard, Companies, Contacts, and Activity logs for sourcing and spinning mills.',
    Accounts: 'Focused on financial terms, LCs, payments, and company profiles.',
    Warehouse: 'Focused on shipping, container movements, yard logistics, and inspection activity logs.',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Switch Demo User & Role"
      subtitle="Experience the CRM interface from the perspective of different company departments."
      maxWidth="md"
    >
      <div className="space-y-2.5">
        {DEMO_USERS.map((user) => {
          const isSelected = user.id === currentUser.id;
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                onSelectUser(user);
                onClose();
              }}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3.5 ${
                isSelected
                  ? 'border-blue-900 bg-blue-50/70 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  isSelected ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {user.avatar || <UserIcon className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {user.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium border ${
                      user.role === 'CEO'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : user.role === 'Sales'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : user.role === 'Procurement'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : user.role === 'Accounts'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">{user.title}</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {roleDescriptions[user.role]}
                </p>
              </div>
              {isSelected && (
                <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0 self-center" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Tip: You can switch roles at any time from the top bar or profile button.
        </p>
      </div>
    </Modal>
  );
}
