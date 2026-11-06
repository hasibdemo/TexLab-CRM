import { Contact } from '../types';
import { INITIAL_CONTACTS } from './seedData';
import { STORAGE_KEYS } from './storageKeys';

function initStorage(): void {
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!initialized || !localStorage.getItem(STORAGE_KEYS.CONTACTS)) {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(INITIAL_CONTACTS));
  }
}

export const contactsService = {
  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/contacts?companyId=...
  getContacts(companyId?: string): Contact[] {
    initStorage();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      const list: Contact[] = stored ? JSON.parse(stored) : [...INITIAL_CONTACTS];
      if (companyId) {
        return list.filter(c => c.companyId === companyId);
      }
      return list;
    } catch {
      return [...INITIAL_CONTACTS];
    }
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/contacts/:id
  getContactById(id: string): Contact | null {
    const list = this.getContacts();
    return list.find(c => c.id === id) || null;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/contacts
  createContact(data: Omit<Contact, 'id' | 'createdAt'>): Contact {
    const list = this.getContacts();
    const newContact: Contact = {
      ...data,
      id: `cont_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newContact, ...list];
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(updated));
    return newContact;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with PUT /api/contacts/:id
  updateContact(id: string, updates: Partial<Contact>): Contact {
    const list = this.getContacts();
    const index = list.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Contact not found');

    const updatedContact: Contact = {
      ...list[index],
      ...updates,
      id,
    };

    list[index] = updatedContact;
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(list));
    return updatedContact;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with DELETE /api/contacts/:id
  deleteContact(id: string): boolean {
    const list = this.getContacts();
    const filtered = list.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(filtered));
    return true;
  },
};
