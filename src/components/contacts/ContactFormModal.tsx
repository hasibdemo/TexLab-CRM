import React, { useState, useEffect } from 'react';
import { Contact, Company } from '../../types';
import { contactsService } from '../../services/contactsService';
import { companiesService } from '../../services/companiesService';
import { Modal } from '../common/Modal';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => void;
  initialData?: Contact | null;
  defaultCompanyId?: string;
}

const COMMON_LANGUAGES = [
  'English',
  'Turkish',
  'Hindi',
  'Bengali',
  'Italian',
  'Mandarin',
  'Arabic',
  'Urdu',
  'Spanish',
  'French',
  'German',
];

export function ContactFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultCompanyId,
}: ContactFormModalProps) {
  const isEditing = Boolean(initialData);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [companyId, setCompanyId] = useState(defaultCompanyId || '');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setCompanies(companiesService.getCompanies({ sortBy: 'name', sortOrder: 'asc' }));
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setCompanyId(initialData.companyId);
      setName(initialData.name);
      setPosition(initialData.position);
      setEmail(initialData.email);
      setPhone(initialData.phone);
      setPreferredLanguage(initialData.preferredLanguage || 'English');
      setIsPrimary(Boolean(initialData.isPrimary));
      setNotes(initialData.notes || '');
    } else {
      setCompanyId(defaultCompanyId || (companies[0]?.id ?? ''));
      setName('');
      setPosition('');
      setEmail('');
      setPhone('');
      setPreferredLanguage('English');
      setIsPrimary(false);
      setNotes('');
    }
    setErrors({});
  }, [initialData, defaultCompanyId, isOpen, companies]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!companyId) newErrors.companyId = 'Please select a company';
    if (!name.trim()) newErrors.name = 'Contact name is required';
    if (!position.trim()) newErrors.position = 'Position/Title is required';
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!phone.trim()) newErrors.phone = 'Phone/WhatsApp number is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      companyId,
      name: name.trim(),
      position: position.trim(),
      email: email.trim(),
      phone: phone.trim(),
      preferredLanguage,
      isPrimary,
      notes: notes.trim(),
    };

    if (isEditing && initialData) {
      const updated = contactsService.updateContact(initialData.id, payload);
      onSave(updated);
    } else {
      const created = contactsService.createContact(payload);
      onSave(created);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Contact' : 'Add New Contact'}
      subtitle="Associate trading decision-makers and mill managers with their company."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Company <span className="text-rose-500">*</span>
          </label>
          <select
            value={companyId}
            onChange={(e) => {
              setCompanyId(e.target.value);
              if (errors.companyId) setErrors({ ...errors, companyId: '' });
            }}
            disabled={Boolean(defaultCompanyId && !isEditing)}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.companyId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
            } bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 disabled:bg-slate-50`}
          >
            <option value="">-- Select Company --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.country})
              </option>
            ))}
          </select>
          {errors.companyId && <span className="text-xs text-rose-600 mt-0.5 block">{errors.companyId}</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="e.g. Cemre Aydin"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
            />
            {errors.name && <span className="text-xs text-rose-600 mt-0.5 block">{errors.name}</span>}
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Position / Role <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={position}
              onChange={(e) => {
                setPosition(e.target.value);
                if (errors.position) setErrors({ ...errors, position: '' });
              }}
              placeholder="e.g. Sourcing Director, Mill GM..."
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.position ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
            />
            {errors.position && <span className="text-xs text-rose-600 mt-0.5 block">{errors.position}</span>}
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Preferred Language
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              {COMMON_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              placeholder="name@company.com"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
            />
            {errors.email && <span className="text-xs text-rose-600 mt-0.5 block">{errors.email}</span>}
          </div>

          {/* Phone / WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Phone / WhatsApp <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              placeholder="+90 532 000 0000"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
            />
            {errors.phone && <span className="text-xs text-rose-600 mt-0.5 block">{errors.phone}</span>}
          </div>

          {/* Primary contact checkbox */}
          <div className="sm:col-span-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
              />
              <span>Set as primary commercial contact for this company</span>
            </label>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Communication Notes & Working Hours
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Best contacted via WhatsApp morning times, handles LC confirmation approvals..."
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
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors shadow-xs"
          >
            {isEditing ? 'Save Contact' : 'Create Contact'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
