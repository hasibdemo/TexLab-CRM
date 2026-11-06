import React, { useState } from 'react';
import { CompanySettings, User, CurrencyCode, Incoterm } from '../../types';
import { settingsService } from '../../services/settingsService';
import { authService } from '../../services/authService';
import {
  Settings,
  Building,
  Landmark,
  Hash,
  Coins,
  FileText,
  Save,
  RotateCcw,
  CheckCircle,
  Lock,
} from 'lucide-react';

interface SettingsViewProps {
  currentUser: User;
}

export default function SettingsView({ currentUser }: SettingsViewProps) {
  const isCEO = currentUser.role === 'CEO';
  const [settings, setSettings] = useState<CompanySettings>(() => settingsService.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field: keyof CompanySettings, value: any) => {
    if (!isCEO) return;
    setSettings(prev => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  const handleRateChange = (curr: CurrencyCode, rate: number) => {
    if (!isCEO) return;
    setSettings(prev => ({
      ...prev,
      exchangeRates: {
        ...prev.exchangeRates,
        [curr]: rate,
      },
    }));
    setSavedSuccess(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCEO) return;
    settingsService.updateSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleReset = () => {
    if (!isCEO) return;
    if (confirm('Are you sure you want to restore default company configuration?')) {
      const def = settingsService.resetToDefaults();
      setSettings(def);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-700" />
            Global Company Settings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure enterprise profile, banking details, auto-numbering prefixes, exchange rates, and terms
          </p>
        </div>

        {isCEO ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            Read-Only (CEO Authorization Required to Edit)
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg flex items-center gap-2 text-xs font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Settings successfully updated and saved to localStorage.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Company Profile */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Building className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              1. Trading Entity Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                disabled={!isCEO}
                value={settings.companyName}
                onChange={e => handleChange('companyName', e.target.value)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Tagline / Business Description
              </label>
              <input
                type="text"
                disabled={!isCEO}
                value={settings.tagline}
                onChange={e => handleChange('tagline', e.target.value)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                disabled={!isCEO}
                value={settings.addressLine1}
                onChange={e => handleChange('addressLine1', e.target.value)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Address Line 2 (District / Area)
              </label>
              <input
                type="text"
                disabled={!isCEO}
                value={settings.addressLine2}
                onChange={e => handleChange('addressLine2', e.target.value)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  City
                </label>
                <input
                  type="text"
                  disabled={!isCEO}
                  value={settings.city}
                  onChange={e => handleChange('city', e.target.value)}
                  className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Country
                </label>
                <input
                  type="text"
                  disabled={!isCEO}
                  value={settings.country}
                  onChange={e => handleChange('country', e.target.value)}
                  className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Tax / VAT / TRN Number
                </label>
                <input
                  type="text"
                  disabled={!isCEO}
                  value={settings.taxId}
                  onChange={e => handleChange('taxId', e.target.value)}
                  className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  disabled={!isCEO}
                  value={settings.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Official Email
              </label>
              <input
                type="email"
                disabled={!isCEO}
                value={settings.email}
                onChange={e => handleChange('email', e.target.value)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Corporate Website
              </label>
              <input
                type="text"
                disabled={!isCEO}
                value={settings.website}
                onChange={e => handleChange('website', e.target.value)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Official Bank Wire Instructions */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Landmark className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              2. Official Bank Account & Wire Routing
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Bank Name
              </label>
              <input
                type="text"
                disabled={!isCEO}
                value={settings.bankName}
                onChange={e => handleChange('bankName', e.target.value)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Account Title / Beneficiary Name
              </label>
              <input
                type="text"
                disabled={!isCEO}
                value={settings.accountName}
                onChange={e => handleChange('accountName', e.target.value)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                IBAN Number
              </label>
              <input
                type="text"
                disabled={!isCEO}
                value={settings.iban}
                onChange={e => handleChange('iban', e.target.value)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50 font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                SWIFT / BIC Code
              </label>
              <input
                type="text"
                disabled={!isCEO}
                value={settings.swiftBic}
                onChange={e => handleChange('swiftBic', e.target.value)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50 font-mono font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Prefixes & Document Numbering */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Hash className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              3. Document Auto-Numbering Prefixes
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Quotation Prefix
              </label>
              <input
                type="text"
                disabled={!isCEO}
                value={settings.quotePrefix}
                onChange={e => handleChange('quotePrefix', e.target.value)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50 font-mono"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">e.g. {settings.quotePrefix}2026-0001</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Sales Order Prefix
              </label>
              <input
                type="text"
                disabled={!isCEO}
                value={settings.salesOrderPrefix}
                onChange={e => handleChange('salesOrderPrefix', e.target.value)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50 font-mono"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">e.g. {settings.salesOrderPrefix}2026-0001</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Purchase Order Prefix
              </label>
              <input
                type="text"
                disabled={!isCEO}
                value={settings.purchaseOrderPrefix}
                onChange={e => handleChange('purchaseOrderPrefix', e.target.value)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50 font-mono"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">e.g. {settings.purchaseOrderPrefix}2026-0001</span>
            </div>
          </div>
        </div>

        {/* Section 4: Currency & Exchange Rates */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Coins className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              4. Default Currency & Multi-Currency Exchange Rates (Base: USD)
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {(['USD', 'EUR', 'TRY', 'INR', 'CNY', 'AED', 'GBP'] as CurrencyCode[]).map(curr => (
              <div key={curr} className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                <span className="text-xs font-bold text-gray-700 block mb-1">
                  1 {curr} =
                </span>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  disabled={!isCEO || curr === 'USD'}
                  value={settings.exchangeRates[curr] ?? 1.0}
                  onChange={e => handleRateChange(curr, parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono font-bold text-right rounded border border-gray-300 px-2 py-1 bg-white disabled:bg-gray-100"
                />
                <span className="text-[10px] text-gray-400 block text-right mt-0.5">USD</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Standard Terms */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <FileText className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              5. Standard Quotation Terms & Incoterms
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Default Incoterm
              </label>
              <select
                disabled={!isCEO}
                value={settings.defaultIncoterm}
                onChange={e => handleChange('defaultIncoterm', e.target.value as Incoterm)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50"
              >
                <option value="CIF">CIF</option>
                <option value="CFR">CFR</option>
                <option value="FOB">FOB</option>
                <option value="EXW">EXW</option>
                <option value="DAP">DAP</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Quote Validity (Days)
              </label>
              <input
                type="number"
                disabled={!isCEO}
                value={settings.defaultQuoteValidityDays}
                onChange={e => handleChange('defaultQuoteValidityDays', parseInt(e.target.value, 10) || 15)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Default Payment Terms
              </label>
              <input
                type="text"
                disabled={!isCEO}
                value={settings.defaultPaymentTerms}
                onChange={e => handleChange('defaultPaymentTerms', e.target.value)}
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Standard Quote Legal & Trading Terms
            </label>
            <textarea
              rows={5}
              disabled={!isCEO}
              value={settings.standardQuoteTerms}
              onChange={e => handleChange('standardQuoteTerms', e.target.value)}
              className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-50 font-mono leading-relaxed"
            />
          </div>
        </div>

        {isCEO && (
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save All Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
