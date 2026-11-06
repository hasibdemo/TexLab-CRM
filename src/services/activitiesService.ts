import { Activity } from '../types';
import {
  INITIAL_ACTIVITIES,
  INITIAL_COMPANIES,
  INITIAL_CONTACTS,
  INITIAL_PRODUCTS,
  INITIAL_DEALS,
  INITIAL_QUOTES,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_PAYMENT_RECORDS,
  DEFAULT_COMPANY_SETTINGS,
  INITIAL_WAREHOUSES,
  INITIAL_LOTS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_INSPECTIONS,
  INITIAL_WEIGHT_TICKETS,
  INITIAL_SHIPMENTS,
} from './seedData';
import { STORAGE_KEYS } from './storageKeys';

function initStorage(): void {
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!initialized || !localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
}

export const activitiesService = {
  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/activities?companyId=...&dealId=...
  getActivities(companyId?: string, dealId?: string): Activity[] {
    initStorage();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      let list: Activity[] = stored ? JSON.parse(stored) : [...INITIAL_ACTIVITIES];

      if (dealId) {
        list = list.filter(a => a.dealId === dealId);
      } else if (companyId) {
        list = list.filter(a => a.companyId === companyId);
      }

      // Sort by activity date descending (most recent first)
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch {
      return [...INITIAL_ACTIVITIES];
    }
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/activities/:id
  getActivityById(id: string): Activity | null {
    const list = this.getActivities();
    return list.find(a => a.id === id) || null;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/activities
  createActivity(data: Omit<Activity, 'id' | 'createdAt'>): Activity {
    const list = this.getActivities();
    const newActivity: Activity = {
      ...data,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newActivity, ...list];
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
    return newActivity;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with PUT /api/activities/:id
  updateActivity(id: string, updates: Partial<Activity>): Activity {
    const list = this.getActivities();
    const index = list.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Activity not found');

    const updatedActivity: Activity = {
      ...list[index],
      ...updates,
      id,
    };

    list[index] = updatedActivity;
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(list));
    return updatedActivity;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with DELETE /api/activities/:id
  deleteActivity(id: string): boolean {
    const list = this.getActivities();
    const filtered = list.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(filtered));
    return true;
  },

  // Reset all CRM data back to initial seed data including M2, M3, and M4 data
  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED_M2);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED_M3);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED_M4);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(INITIAL_COMPANIES));
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(INITIAL_CONTACTS));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(INITIAL_DEALS));
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(INITIAL_QUOTES));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    localStorage.setItem(STORAGE_KEYS.PAYMENT_RECORDS, JSON.stringify(INITIAL_PAYMENT_RECORDS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_COMPANY_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(INITIAL_WAREHOUSES));
    localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(INITIAL_LOTS));
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(INITIAL_STOCK_MOVEMENTS));
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(INITIAL_INSPECTIONS));
    localStorage.setItem(STORAGE_KEYS.WEIGHT_TICKETS, JSON.stringify(INITIAL_WEIGHT_TICKETS));
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(INITIAL_SHIPMENTS));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.INITIALIZED_M2, 'true');
    localStorage.setItem(STORAGE_KEYS.INITIALIZED_M3, 'true');
    localStorage.setItem(STORAGE_KEYS.INITIALIZED_M4, 'true');
  },
};
