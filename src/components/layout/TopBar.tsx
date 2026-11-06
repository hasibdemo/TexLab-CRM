import { useState, useRef, useEffect } from 'react';
import { User, NavPage } from '../../types';
import { Search, Bell, Users, ChevronDown, Check, Ship, DollarSign, FileCheck } from 'lucide-react';

interface TopBarProps {
  currentUser: User;
  onOpenUserSwitcher: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  onNavigate?: (page: NavPage) => void;
}

export function TopBar({
  currentUser,
  onOpenUserSwitcher,
  onSearch,
  searchQuery = '',
  onNavigate,
}: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    {
      id: 'n1',
      title: 'LC Maturity Approaching',
      desc: 'Ege Re-Spinning 100% LC at Sight documents verified by Bank of Mersin.',
      time: '25m ago',
      icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
      unread: true,
    },
    {
      id: 'n2',
      title: 'Container Dispatched',
      desc: 'Al-Barakah: 4x40ft HC loaded at Chittagong Port (Vessel: MSC LEANNE).',
      time: '2h ago',
      icon: <Ship className="w-4 h-4 text-blue-600" />,
      unread: true,
    },
    {
      id: 'n3',
      title: 'Lab Test Approved',
      desc: 'Zhejiang Hengyi GRS certificate validated for recycled polyester filament.',
      time: 'Yesterday',
      icon: <FileCheck className="w-4 h-4 text-purple-600" />,
      unread: false,
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-6 shadow-2xs">
      {/* Mobile brand title / Desktop contextual search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {/* Mobile brand mark */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-950 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
            TT
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight whitespace-nowrap">
            TexTrade
          </span>
        </div>

        {/* Global search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            placeholder="Search companies, fibers, cities, contacts..."
            className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200/90 rounded-lg placeholder-slate-400 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearch && onSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Right zone: Notifications & User profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) setUnreadCount(0);
            }}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Trade alerts & notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-700 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Trade Alerts & Status
                </span>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                  3 recent
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5"
                  >
                    <div className="p-1.5 bg-slate-100 rounded-md shrink-0 mt-0.5">
                      {notif.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        {notif.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-3 py-1.5 border-t border-slate-100 text-center bg-slate-50/50">
                <span className="text-[11px] text-slate-500">
                  Real-time container & banking webhooks active
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Current User & Role Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {currentUser.avatar || currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                <div className="mt-1">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200/60 uppercase">
                    Role: {currentUser.role}
                  </span>
                </div>
              </div>

              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenUserSwitcher();
                  }}
                  className="w-full text-left flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-blue-950 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Users className="w-4 h-4 text-blue-900" />
                  <span>Switch Demo User</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Switch User button for high visibility during evaluation */}
        <button
          type="button"
          onClick={onOpenUserSwitcher}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors whitespace-nowrap"
          title="Switch role for demo testing"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Switch User</span>
        </button>
      </div>
    </header>
  );
}
