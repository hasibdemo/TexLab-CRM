import React, { useState, useEffect } from 'react';
import { Activity, ActivityType, Company, Contact } from '../../types';
import { activitiesService } from '../../services/activitiesService';
import { companiesService } from '../../services/companiesService';
import { contactsService } from '../../services/contactsService';
import { authService } from '../../services/authService';
import { Modal } from '../common/Modal';
import { Phone, Mail, Users, FileText } from 'lucide-react';

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: Activity) => void;
  initialData?: Activity | null;
  defaultCompanyId?: string;
  defaultContactId?: string;
  defaultDealId?: string;
}

const COMMON_OUTCOMES = [
  'Price quoted',
  'Sample sent',
  'Follow up next week',
  'Order confirmed',
  'LC terms agreed',
  'Price counter-offered',
  'Inspection scheduled',
  'Information exchanged',
  'Issue resolved',
];

export function ActivityFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultCompanyId,
  defaultContactId,
  defaultDealId,
}: ActivityFormModalProps) {
  const isEditing = Boolean(initialData);
  const currentUser = authService.getCurrentUser();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [type, setType] = useState<ActivityType>('call');
  const [companyId, setCompanyId] = useState(defaultCompanyId || '');
  const [contactId, setContactId] = useState(defaultContactId || '');
  const [dealId, setDealId] = useState(defaultDealId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [outcome, setOutcome] = useState('Price quoted');
  const [loggedBy, setLoggedBy] = useState(currentUser.name);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const allComps = companiesService.getCompanies({ sortBy: 'name', sortOrder: 'asc' });
      setCompanies(allComps);

      const targetCompany = defaultCompanyId || initialData?.companyId || allComps[0]?.id || '';
      setCompanyId(targetCompany);
    }
  }, [isOpen, defaultCompanyId, initialData]);

  // Update contacts dropdown whenever companyId changes
  useEffect(() => {
    if (companyId) {
      const compContacts = contactsService.getContacts(companyId);
      setContacts(compContacts);
      if (!isEditing && !defaultContactId) {
        const primary = compContacts.find((c) => c.isPrimary);
        setContactId(primary?.id || (compContacts[0]?.id ?? ''));
      }
    } else {
      setContacts([]);
      setContactId('');
    }
  }, [companyId, isEditing, defaultContactId]);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setCompanyId(initialData.companyId);
      setContactId(initialData.contactId || '');
      setDealId(initialData.dealId || '');
      setTitle(initialData.title);
      setDescription(initialData.description);
      setDate(
        initialData.date
          ? new Date(initialData.date).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16)
      );
      setOutcome(initialData.outcome || 'Information exchanged');
      setLoggedBy(initialData.loggedBy || currentUser.name);
    } else {
      setType('call');
      setDealId(defaultDealId || '');
      setTitle('');
      setDescription('');
      setDate(new Date().toISOString().slice(0, 16));
      setOutcome('Price quoted');
      setLoggedBy(currentUser.name);
    }
    setErrors({});
  }, [initialData, isOpen, currentUser.name, defaultDealId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!companyId) newErrors.companyId = 'Please select a company';
    if (!title.trim()) newErrors.title = 'Title / Subject is required';
    if (!description.trim()) newErrors.description = 'Activity notes are required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      companyId,
      contactId: contactId || undefined,
      dealId: dealId || undefined,
      type,
      title: title.trim(),
      description: description.trim(),
      date: new Date(date).toISOString(),
      loggedBy,
      outcome,
    };

    if (isEditing && initialData) {
      const updated = activitiesService.updateActivity(initialData.id, payload);
      onSave(updated);
    } else {
      const created = activitiesService.createActivity(payload);
      onSave(created);
    }
    onClose();
  };

  const activityTypeButtons = [
    { type: 'call' as ActivityType, label: 'Call / WhatsApp', icon: <Phone className="w-3.5 h-3.5" /> },
    { type: 'email' as ActivityType, label: 'Email', icon: <Mail className="w-3.5 h-3.5" /> },
    { type: 'meeting' as ActivityType, label: 'Meeting / Visit', icon: <Users className="w-3.5 h-3.5" /> },
    { type: 'note' as ActivityType, label: 'Internal Note', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Activity Record' : 'Log Trade Activity'}
      subtitle="Track trade negotiations, quality audits, quotes, and container logistics."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Activity Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Activity Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {activityTypeButtons.map((btn) => {
              const active = type === btn.type;
              return (
                <button
                  key={btn.type}
                  type="button"
                  onClick={() => setType(btn.type)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {btn.icon}
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Company and Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.companyId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
            >
              <option value="">-- Select Company --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.country})
                </option>
              ))}
            </select>
            {errors.companyId && (
              <span className="text-xs text-rose-600 mt-0.5 block">{errors.companyId}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Contact Person (Optional)
            </label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="">-- General / No Specific Person --</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.position}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Subject / Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors({ ...errors, title: '' });
            }}
            placeholder="e.g. Quoted $1.20/kg CIF Izmir for 200 MT Comber Noil"
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
            } focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
          />
          {errors.title && <span className="text-xs text-rose-600 mt-0.5 block">{errors.title}</span>}
        </div>

        {/* Date and Outcome */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Commercial Outcome / Status
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              {COMMON_OUTCOMES.map((oc) => (
                <option key={oc} value={oc}>
                  {oc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes / Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Discussion Details & Next Steps <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors({ ...errors, description: '' });
            }}
            placeholder="Key discussion points, pricing terms, moisture/trash feedback, shipping timelines..."
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.description ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
            } focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
          />
          {errors.description && (
            <span className="text-xs text-rose-600 mt-0.5 block">{errors.description}</span>
          )}
        </div>

        {/* Logged by */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Logging as: <strong className="text-slate-800 font-medium">{loggedBy}</strong>
          </span>
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
            {isEditing ? 'Save Activity' : 'Log Activity'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
