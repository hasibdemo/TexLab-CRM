import React from 'react';
import { NavPage, User } from '../../types';
import { authService } from '../../services/authService';
import { LayoutDashboard, Building2, Users2, Clock, Kanban, Package, PackageCheck, FileText, CreditCard } from 'lucide-react';

interface BottomTabBarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  currentUser: User;
}

export function BottomTabBar({ currentPage, onNavigate, currentUser }: BottomTabBarProps) {
  const allNavItems: {
    id: NavPage;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'deals',
      label: 'Deals',
      icon: <Kanban className="w-5 h-5" />,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <PackageCheck className="w-5 h-5" />,
    },
    {
      id: 'quotes',
      label: 'Quotes',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      id: 'companies',
      label: 'Companies',
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      id: 'products',
      label: 'Products',
      icon: <Package className="w-5 h-5" />,
    },
  ];

  const visibleNavItems = allNavItems.filter((item) =>
    authService.canAccessPage(currentUser, item.id)
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-1 pb-safe overflow-x-auto">
      <div className="flex items-center justify-around h-15 min-w-full">
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
              className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-blue-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                {item.icon}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-900" />
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
