import { User } from '../../types';
import { DEMO_USERS } from '../../services/seedData';
import { ArrowRight, Layers, ShieldCheck, Check } from 'lucide-react';

interface LoginViewProps {
  onSelectUser: (user: User) => void;
}

export function LoginView({ onSelectUser }: LoginViewProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg tracking-wider mx-auto shadow-lg mb-3">
          TT
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          TexTrade CRM
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
          Internal trading portal for textile waste, comber noil, clips, and yarn.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700 mb-5">
            <div>
              <h2 className="text-sm font-bold text-white">Select Staff Account</h2>
              <p className="text-xs text-slate-400">
                Choose a demo profile to test role-based access permissions.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-blue-900/60 text-blue-300 border border-blue-700 px-2 py-0.5 rounded">
              Demo Access
            </span>
          </div>

          <div className="space-y-3">
            {DEMO_USERS.map((user) => {
              const roleColor = {
                CEO: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                Sales: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                Procurement: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                Accounts: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                Warehouse: 'bg-slate-700 text-slate-300 border-slate-600',
              }[user.role];

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onSelectUser(user)}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-750 hover:border-slate-500 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                      {user.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors truncate">
                          {user.name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.2 rounded font-medium border ${roleColor}`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{user.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>Accessible:</span>
                        <span className="text-slate-300">
                          {user.accessiblePages.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700 text-center">
            <p className="text-xs text-slate-400">
              CEO has full administrative privileges including company and record deletion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
