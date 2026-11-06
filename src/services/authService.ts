import { User, UserRole, NavPage, DealType, OrderType } from '../types';
import { DEMO_USERS } from './seedData';
import { STORAGE_KEYS } from './storageKeys';

export const authService = {
  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/auth/users
  getAvailableUsers(): User[] {
    return DEMO_USERS;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/auth/me or JWT session token decode
  getCurrentUser(): User {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        const match = DEMO_USERS.find(u => u.id === parsed.id);
        if (match) return match;
      }
    } catch {
      // fallback
    }
    // Default to CEO Tariq Al-Mansoor for seamless rich demo
    const defaultUser = DEMO_USERS[0];
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultUser));
    return defaultUser;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/auth/switch-user or token refresh
  switchUser(userId: string): User {
    const user = DEMO_USERS.find(u => u.id === userId) || DEMO_USERS[0];
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/auth/logout
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // Permission check based on user role
  canAccessPage(user: User, page: NavPage): boolean {
    if (user.role === 'CEO') return true;
    if (page === 'company-detail') {
      return user.accessiblePages.includes('companies');
    }
    if (page === 'deal-detail') {
      return user.accessiblePages.includes('deals');
    }
    if (page === 'order-detail') {
      return user.accessiblePages.includes('orders');
    }
    if (page === 'shipment-detail') {
      return user.accessiblePages.includes('shipments');
    }
    return user.accessiblePages.includes(page as any);
  },

  // Warehouse role must not see any prices, freight costs, or financial amounts
  canViewPrices(role: UserRole): boolean {
    return role !== 'Warehouse';
  },

  canViewFreightCosts(role: UserRole): boolean {
    return role !== 'Warehouse';
  },

  canEditCompanies(role: UserRole): boolean {
    return role === 'CEO' || role === 'Sales' || role === 'Procurement';
  },

  canDeleteCompanies(role: UserRole): boolean {
    return role === 'CEO';
  },

  canEditProducts(role: UserRole): boolean {
    return role === 'CEO' || role === 'Sales' || role === 'Procurement';
  },

  canDeleteProducts(role: UserRole): boolean {
    return role === 'CEO';
  },

  // Deal permissions:
  // Role rules: Sales and CEO see all deals; Procurement sees Purchase deals only; Accounts and Warehouse get read-only access.
  canManageDeals(role: UserRole, dealType?: DealType): boolean {
    if (role === 'CEO' || role === 'Sales') return true;
    if (role === 'Procurement') {
      return dealType === undefined || dealType === 'Purchase';
    }
    return false; // Accounts and Warehouse are read-only
  },

  canDeleteDeals(role: UserRole): boolean {
    return role === 'CEO';
  },

  // Quote permissions:
  // Sales and CEO can manage quotes; Accounts and Procurement have read-only; Warehouse cannot access.
  canManageQuotes(role: UserRole): boolean {
    return role === 'CEO' || role === 'Sales' || role === 'Procurement';
  },

  canDeleteQuotes(role: UserRole): boolean {
    return role === 'CEO';
  },

  // Order permissions:
  // Sales can manage sales orders, Procurement can manage purchase orders, CEO all, Warehouse can only update status, Accounts read-only
  canManageOrders(role: UserRole, orderType?: OrderType): boolean {
    if (role === 'CEO') return true;
    if (role === 'Sales') return orderType === undefined || orderType === 'Sales Order';
    if (role === 'Procurement') return orderType === undefined || orderType === 'Purchase Order';
    return false;
  },

  canUpdateOrderStatus(role: UserRole): boolean {
    return role === 'CEO' || role === 'Sales' || role === 'Procurement' || role === 'Warehouse';
  },

  canDeleteOrders(role: UserRole): boolean {
    return role === 'CEO';
  },

  // Payment permissions:
  // Accounts and CEO full; Sales and Procurement read-only; Warehouse no access
  canManagePayments(role: UserRole): boolean {
    return role === 'CEO' || role === 'Accounts';
  },

  // Milestone 4: Inventory & Warehouse permissions
  canManageInventory(role: UserRole): boolean {
    return role === 'CEO' || role === 'Warehouse';
  },

  canCreateLots(role: UserRole): boolean {
    return role === 'CEO' || role === 'Warehouse' || role === 'Procurement';
  },

  canAdjustStock(role: UserRole): boolean {
    return role === 'CEO' || role === 'Warehouse';
  },

  canManageInspections(role: UserRole): boolean {
    return role === 'CEO' || role === 'Warehouse';
  },

  canManageWeightTickets(role: UserRole): boolean {
    return role === 'CEO' || role === 'Warehouse';
  },

  canReserveStock(role: UserRole): boolean {
    return role === 'CEO' || role === 'Sales' || role === 'Warehouse';
  },

  // Milestone 4: Shipment permissions
  // CEO: full; Procurement: inbound / import; Warehouse: read-only (stuffing allowed); Sales & Accounts: read-only
  canManageShipments(role: UserRole, shipmentType?: 'Export' | 'Import'): boolean {
    if (role === 'CEO') return true;
    if (role === 'Procurement') return shipmentType === undefined || shipmentType === 'Import';
    return false;
  },

  canStuffContainers(role: UserRole): boolean {
    return role === 'CEO' || role === 'Warehouse';
  },

  canUpdateShipmentStatus(role: UserRole): boolean {
    return role === 'CEO' || role === 'Warehouse' || role === 'Procurement' || role === 'Sales';
  },

  canDeleteShipments(role: UserRole): boolean {
    return role === 'CEO';
  },

  // Settings permissions:
  // Only CEO can edit company settings; others read-only
  canEditSettings(role: UserRole): boolean {
    return role === 'CEO';
  },

  canLogActivity(role: UserRole): boolean {
    return role === 'CEO' || role === 'Sales' || role === 'Procurement' || role === 'Warehouse';
  },
};

