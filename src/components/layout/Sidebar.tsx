import React from 'react';
import { NavPage, User } from '../../types';
import { authService } from '../../services/authService';
import {
  LayoutDashboard,
  Building2,
  Users2,
  Clock,
  RefreshCw,
  Layers,
  ChevronRight,
  LogOut,
  Users,
  Kanban,
  Package,
  FileText,
  PackageCheck,
  CreditCard,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  currentUser: User;
  onOpenUserSwitcher: () => void;
  onResetData: () => void;
  onLogout?: () => void;
  companyCount: number;
  dealCount?: number;
  productCount?: number;
  quoteCount?: number;
  orderCount?: number;
}

export function Sidebar({
  currentPage,
  onNavigate,
  currentUser,
  onOpenUserSwitcher,
  onResetData,
  onLogout,
  companyCount,
  dealCount = 0,
  productCount = 0,
  quoteCount = 0,
  orderCount = 0,
}: SidebarProps) {
  const allNavItems: {
    id: NavPage;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      description: 'Trade overview & analytics',
    },
    {
      id: 'deals',
      label: 'Deals Pipeline',
      icon: <Kanban className="w-4 h-4" />,
      description: 'Stages & contract pipeline',
    },
    {
      id: 'quotes',
      label: 'Quotations',
      icon: <FileText className="w-4 h-4" />,
      description: 'Commercial quotes & proformas',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <PackageCheck className="w-4 h-4" />,
      description: 'Sales and purchase orders',
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard className="w-4 h-4" />,
      description: 'Schedules, milestones & LC',
    },
    {
      id: 'companies',
      label: 'Companies',
      icon: <Building2 className="w-4 h-4" />,
      description: 'Buyers, suppliers & agents',
    },
    {
      id: 'products',
      label: 'Products',
      icon: <Package className="w-4 h-4" />,
      description: 'Commodity & fiber catalog',
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: <Users2 className="w-4 h-4" />,
      description: 'Mill managers & traders',
    },
    {
      id: 'activities',
      label: 'Activities',
      icon: <Clock className="w-4 h-4" />,
      description: 'Calls, visits & logs',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      description: 'Company, bank & terms',
    },
  ];

  // Filter nav items by role permissions
  const visibleNavItems = allNavItems.filter((item) =>
    authService.canAccessPage(currentUser, item.id)
  );


  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm tracking-wide shadow-md">
            TT
          </div>
          <div>
            <div className="font-bold text-white text-base tracking-tight leading-none">
              TexTrade CRM
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
              <span>Fiber & Waste</span>
              <span className="text-slate-600">/</span>
              <span>v1.2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Workspace Navigation
        </div>

        {visibleNavItems.map((item) => {
          const isActive =
            currentPage === item.id ||
            (currentPage === 'company-detail' && item.id === 'companies') ||
            (currentPage === 'deal-detail' && item.id === 'deals') ||
            (currentPage === 'order-detail' && item.id === 'orders');

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.id === 'companies' && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded font-mono tabular-nums ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {companyCount}
                </span>
              )}
              {item.id === 'deals' && dealCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded font-mono tabular-nums ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {dealCount}
                </span>
              )}
              {item.id === 'quotes' && quoteCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded font-mono tabular-nums ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {quoteCount}
                </span>
              )}
              {item.id === 'orders' && orderCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded font-mono tabular-nums ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {orderCount}
                </span>
              )}
              {item.id === 'products' && productCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded font-mono tabular-nums ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {productCount}
                </span>
              )}
            </button>
          );
        })}


        {/* Trade commodities highlight banner */}
        <div className="pt-6 px-1">
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Core Commodities</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Cotton Comber Noils · Denim Waste Clips · Recycled Polyester & Acrylic Yarn.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Area: User role card & Switch User button */}
      <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-900/60">
        <button
          type="button"
          onClick={onOpenUserSwitcher}
          className="w-full text-left p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.avatar || currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Role: <span className="text-blue-400">{currentUser.role}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
        </button>

        <div className="flex items-center gap-1 pt-1">
          <button
            type="button"
            onClick={onResetData}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Reload initial realistic 14 companies and contacts"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </button>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
