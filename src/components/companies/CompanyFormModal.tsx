import React, { useState, useEffect } from 'react';
import { Company, CompanyType, CompanyStatus } from '../../types';
import { companiesService } from '../../services/companiesService';
import { DEMO_USERS } from '../../services/seedData';
import { Modal } from '../common/Modal';
import { Tag } from '../common/Tag';
import { AlertTriangle, Plus } from 'lucide-react';

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Company) => void;
  initialData?: Company | null;
}

const COMMON_TEXTILE_PRODUCTS = [
  'Cotton Comber Noil',
  'Bleached Cotton Waste',
  'Denim Clips / Hard Waste',
  'Ring Spun Yarn Waste',
  'Polyester Filament Waste',
  '100% Acrylic Yarn Waste',
  'Carding Fly Waste',
  'Drop Waste',
  'Recycled Acrylic Yarn',
  'Flax Tow',
  'Nylon 6 Chips & Waste',
  'Knit Cotton Cuttings (White)',
];

const COMMON_COUNTRIES = [
  'Turkey',
  'India',
  'Bangladesh',
  'UAE',
  'Italy',
  'China',
  'Pakistan',
  'Vietnam',
  'Egypt',
  'Germany',
  'United States',
];

export function CompanyFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CompanyFormModalProps) {
  const isEditing = Boolean(initialData);

  const [name, setName] = useState('');
  const [type, setType] = useState<CompanyType>('Buyer');
  const [country, setCountry] = useState('Turkey');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'TRY' | 'INR' | 'CNY' | 'AED' | 'GBP'>('USD');
  const [paymentTerms, setPaymentTerms] = useState('100% LC at Sight');
  const [assignedOwner, setAssignedOwner] = useState(DEMO_USERS[1]?.name || 'Elena Rossi');
  const [status, setStatus] = useState<CompanyStatus>('Lead');
  const [notes, setNotes] = useState('');
  const [productsOfInterest, setProductsOfInterest] = useState<string[]>([]);
  const [customProductInput, setCustomProductInput] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [bypassDuplicate, setBypassDuplicate] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setCountry(initialData.country);
      setCity(initialData.city);
      setAddress(initialData.address || '');
      setWebsite(initialData.website || '');
      setCurrency(initialData.currency);
      setPaymentTerms(initialData.paymentTerms || '');
      setAssignedOwner(initialData.assignedOwner || DEMO_USERS[0].name);
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
      setProductsOfInterest(initialData.productsOfInterest || []);
    } else {
      // Reset defaults for add
      setName('');
      setType('Buyer');
      setCountry('Turkey');
      setCity('');
      setAddress('');
      setWebsite('');
      setCurrency('USD');
      setPaymentTerms('100% LC at Sight');
      setAssignedOwner(DEMO_USERS[1]?.name || 'Elena Rossi');
      setStatus('Lead');
      setNotes('');
      setProductsOfInterest(['Cotton Comber Noil']);
    }
    setErrors({});
    setDuplicateWarning(null);
    setBypassDuplicate(false);
  }, [initialData, isOpen]);

  // Check duplicate when name and country change
  useEffect(() => {
    if (!name.trim() || !country.trim()) {
      setDuplicateWarning(null);
      return;
    }
    const isDup = companiesService.checkDuplicate(name, country, initialData?.id);
    if (isDup) {
      setDuplicateWarning(
        `Notice: A company named "${name.trim()}" in ${country.trim()} already exists in your database.`
      );
    } else {
      setDuplicateWarning(null);
    }
  }, [name, country, initialData?.id]);

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !productsOfInterest.includes(trimmed)) {
      setProductsOfInterest([...productsOfInterest, trimmed]);
    }
    setCustomProductInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setProductsOfInterest(productsOfInterest.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Company name is required';
    if (!country.trim()) newErrors.country = 'Country is required';
    if (!city.trim()) newErrors.city = 'City is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (duplicateWarning && !bypassDuplicate) {
      // Prompt user to acknowledge duplicate
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      country: country.trim(),
      city: city.trim(),
      address: address.trim(),
      website: website.trim(),
      currency,
      paymentTerms: paymentTerms.trim(),
      assignedOwner,
      status,
      notes: notes.trim(),
      productsOfInterest,
    };

    if (isEditing && initialData) {
      const updated = companiesService.updateCompany(initialData.id, payload);
      onSave(updated);
    } else {
      const created = companiesService.createCompany(payload);
      onSave(created);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Company' : 'Add New Company'}
      subtitle="Keep textile trading partner information accurate and up to date."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Duplicate Warning Alert */}
        {duplicateWarning && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">{duplicateWarning}</span>
              <p className="mt-1 text-slate-600">
                Are you sure you want to save this record anyway?
              </p>
              <label className="flex items-center gap-2 mt-2 font-medium cursor-pointer text-amber-950">
                <input
                  type="checkbox"
                  checked={bypassDuplicate}
                  onChange={(e) => setBypassDuplicate(e.target.checked)}
                  className="rounded border-amber-400 text-blue-900 focus:ring-blue-900"
                />
                <span>I understand, save anyway</span>
              </label>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Company Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="e.g. Anadolu Geri Donusum Tekstil A.S."
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
            />
            {errors.name && <span className="text-xs text-rose-600 mt-0.5 block">{errors.name}</span>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Company Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CompanyType)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="Buyer">Buyer (Mill / Spinner / Recycler)</option>
              <option value="Supplier">Supplier (Ginning / Waste Collector)</option>
              <option value="Agent">Agent / Broker</option>
              <option value="Freight Forwarder">Freight Forwarder / Shipping</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Account Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CompanyStatus)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="Lead">Lead (Prospecting / Quoting)</option>
              <option value="Active">Active (Transacting)</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Country <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              list="countries-list"
              required
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                if (errors.country) setErrors({ ...errors, country: '' });
              }}
              placeholder="e.g. Turkey, India, Bangladesh..."
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.country ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
            />
            <datalist id="countries-list">
              {COMMON_COUNTRIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {errors.country && <span className="text-xs text-rose-600 mt-0.5 block">{errors.country}</span>}
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              City / Port <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (errors.city) setErrors({ ...errors, city: '' });
              }}
              placeholder="e.g. Izmir, Coimbatore, Chittagong..."
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.city ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
            />
            {errors.city && <span className="text-xs text-rose-600 mt-0.5 block">{errors.city}</span>}
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Trade Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="TRY">TRY (₺)</option>
              <option value="INR">INR (₹)</option>
              <option value="CNY">CNY (¥)</option>
              <option value="AED">AED (د.إ)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          {/* Payment Terms */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Terms
            </label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="e.g. 100% LC at Sight, 30% Adv + 70% BL..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          {/* Assigned Owner */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Assigned Account Owner
            </label>
            <select
              value={assignedOwner}
              onChange={(e) => setAssignedOwner(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              {DEMO_USERS.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Website
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Office / Mill Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Industrial zone, road, building number..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          {/* Products of interest tags */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Textile Products of Interest
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[44px]">
              {productsOfInterest.map((tag) => (
                <Tag
                  key={tag}
                  label={tag}
                  variant="blue"
                  onRemove={() => handleRemoveTag(tag)}
                />
              ))}
              {productsOfInterest.length === 0 && (
                <span className="text-xs text-slate-400 self-center">No products selected yet</span>
              )}
            </div>

            {/* Quick Suggestions & custom input */}
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={customProductInput}
                onChange={(e) => setCustomProductInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(customProductInput);
                  }
                }}
                placeholder="Type custom fiber/waste and press enter..."
                className="flex-1 px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
              />
              <button
                type="button"
                onClick={() => handleAddTag(customProductInput)}
                className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            <div className="mt-2">
              <span className="text-[11px] text-slate-500 block mb-1">Quick Suggestions:</span>
              <div className="flex flex-wrap gap-1">
                {COMMON_TEXTILE_PRODUCTS.filter((p) => !productsOfInterest.includes(p))
                  .slice(0, 6)
                  .map((product) => (
                    <button
                      key={product}
                      type="button"
                      onClick={() => handleAddTag(product)}
                      className="text-[11px] px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200 transition-colors"
                    >
                      + {product}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Internal Trading Notes & Quality Specs
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly requirement ~200 MT, moisture tolerance < 8%, required inspection certificates..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={Boolean(duplicateWarning && !bypassDuplicate)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? 'Save Changes' : 'Create Company'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
