import { CompanySettings } from '../types';
import { STORAGE_KEYS } from './storageKeys';
import { DEFAULT_COMPANY_SETTINGS } from './seedData';

export const settingsService = {
  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/settings/company
  getSettings(): CompanySettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        return { ...DEFAULT_COMPANY_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // fallback to defaults
    }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_COMPANY_SETTINGS));
    return DEFAULT_COMPANY_SETTINGS;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with PUT /api/settings/company
  updateSettings(partial: Partial<CompanySettings>): CompanySettings {
    const current = this.getSettings();
    const updated: CompanySettings = { ...current, ...partial };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/settings/reset
  resetToDefaults(): CompanySettings {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_COMPANY_SETTINGS));
    return DEFAULT_COMPANY_SETTINGS;
  },
};
