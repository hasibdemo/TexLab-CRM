import { useState, useMemo } from 'react';
import { Contact, Company, NavPage, User } from '../../types';
import { contactsService } from '../../services/contactsService';
import { companiesService } from '../../services/companiesService';
import { authService } from '../../services/authService';
import { DataTable, Column } from '../common/DataTable';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  Plus,
  Mail,
  Phone,
  MessageSquare,
  Building2,
  Edit2,
  Trash2,
  PhoneCall,
  RotateCcw,
} from 'lucide-react';

interface ContactsListViewProps {
  contacts: Contact[];
  companies: Company[];
  onRefresh: () => void;
  onNavigate: (page: NavPage, params?: { companyId?: string }) => void;
  onOpenAddContact: () => void;
  onEditContact: (contact: Contact) => void;
  onOpenLogActivity: (companyId: string, contactId?: string) => void;
  currentUser: User;
}

export function ContactsListView({
  contacts,
  companies,
  onRefresh,
  onNavigate,
  onOpenAddContact,
  onEditContact,
  onOpenLogActivity,
  currentUser,
}: ContactsListViewProps) {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('All');
  const [languageFilter, setLanguageFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const canEdit = authService.canEditCompanies(currentUser.role);
  const canDelete = authService.canDeleteCompanies(currentUser.role);
  const canLog = authService.canLogActivity(currentUser.role);

  const companyMap = useMemo(() => {
    const map = new Map<string, Company>();
    companies.forEach((c) => map.set(c.id, c));
    return map;
  }, [companies]);

  const uniqueLanguages = useMemo(() => {
    const langs = Array.from(new Set(contacts.map((c) => c.preferredLanguage || 'English'))).filter(
      Boolean
    );
    return langs.sort();
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    let list = [...contacts];

    if (companyFilter !== 'All') {
      list = list.filter((c) => c.companyId === companyFilter);
    }

    if (languageFilter !== 'All') {
      list = list.filter((c) => (c.preferredLanguage || 'English') === languageFilter);
    }

    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter((c) => {
        const comp = companyMap.get(c.companyId);
        return (
          c.name.toLowerCase().includes(query) ||
          c.position.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query) ||
          (comp && comp.name.toLowerCase().includes(query)) ||
          (comp && comp.country.toLowerCase().includes(query))
        );
      });
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, companyFilter, languageFilter, search, companyMap]);

  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContacts.slice(start, start + pageSize);
  }, [filteredContacts, currentPage]);

  const handleDeleteConfirm = () => {
    if (!contactToDelete) return;
    try {
      contactsService.deleteContact(contactToDelete.id);
      showToast(`Contact ${contactToDelete.name} removed.`, 'success', 'Deleted');
      setContactToDelete(null);
      onRefresh();
    } catch {
      showToast('Error removing contact', 'error');
    }
  };

  const cleanPhoneForWhatsApp = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
  };

  const columns: Column<Contact>[] = [
    {
      header: 'Contact Name',
      sortable: true,
      sortKey: 'name',
      render: (c) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900">{c.name}</span>
            {c.isPrimary && (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-900 border border-blue-200">
                Primary
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500">{c.position}</span>
        </div>
      ),
    },
    {
      header: 'Company / Mill',
      render: (c) => {
        const comp = companyMap.get(c.companyId);
        if (!comp) return <span className="text-xs text-slate-400">Unlinked</span>;
        return (
          <button
            type="button"
            onClick={() => onNavigate('company-detail', { companyId: comp.id })}
            className="text-left group flex items-start gap-1"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-900 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-900 underline-offset-2 hover:underline">
                {comp.name}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {comp.city}, {comp.country}
              </span>
            </div>
          </button>
        );
      },
    },
    {
      header: 'Communication Channels',
      render: (c) => (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-slate-400" />
            <a href={`mailto:${c.email}`} className="text-blue-700 hover:underline">
              {c.email}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3 text-slate-400" />
            <span className="font-mono text-slate-700">{c.phone}</span>
            <a
              href={`https://wa.me/${cleanPhoneForWhatsApp(c.phone)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded hover:bg-emerald-100"
              title="Chat on WhatsApp"
            >
              <MessageSquare className="w-2.5 h-2.5" />
              <span>WA</span>
            </a>
          </div>
        </div>
      ),
    },
    {
      header: 'Language',
      render: (c) => (
        <span className="text-xs text-slate-700">{c.preferredLanguage || 'English'}</span>
      ),
    },
    {
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          {canLog && (
            <button
              type="button"
              onClick={() => onOpenLogActivity(c.companyId, c.id)}
              className="p-1 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded"
              title="Log activity with this contact"
            >
              <PhoneCall className="w-4 h-4" />
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => onEditContact(c)}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Edit contact"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setContactToDelete(c)}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
              title="Delete contact"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Key Contacts Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Direct mill sourcing executives, factory GM contacts, and international trade brokers.
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={onOpenAddContact}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Search Contacts
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name, position, email, phone..."
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          {/* Filter by Company */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Company
            </label>
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="All">All Companies ({companies.length})</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Language */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Language
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={languageFilter}
                onChange={(e) => {
                  setLanguageFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
              >
                <option value="All">All Languages</option>
                {uniqueLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              {(search || companyFilter !== 'All' || languageFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setCompanyFilter('All');
                    setLanguageFilter('All');
                    setCurrentPage(1);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded border border-slate-200"
                  title="Clear filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 font-mono tabular-nums">
          Showing <strong>{filteredContacts.length}</strong> contacts
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={paginatedContacts}
          keyExtractor={(c) => c.id}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredContacts.length}
          onPageChange={setCurrentPage}
          emptyMessage="No contacts found"
          emptySubtext="Try clearing the search query or company filter."
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedContacts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <h4 className="text-sm font-semibold text-slate-800">No contacts found</h4>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          paginatedContacts.map((c) => {
            const comp = companyMap.get(c.companyId);
            return (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">{c.name}</span>
                      {c.isPrimary && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-900 border border-blue-200">
                          Primary
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 block">{c.position}</span>
                  </div>

                  {comp && (
                    <button
                      type="button"
                      onClick={() => onNavigate('company-detail', { companyId: comp.id })}
                      className="text-xs font-medium text-blue-900 px-2 py-0.5 rounded bg-blue-50"
                    >
                      {comp.name.slice(0, 15)}...
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <a href={`mailto:${c.email}`} className="text-blue-700 hover:underline">
                      {c.email}
                    </a>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-slate-800">{c.phone}</span>
                    </div>
                    <a
                      href={`https://wa.me/${cleanPhoneForWhatsApp(c.phone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Language: {c.preferredLanguage}</span>
                  <div className="flex items-center gap-2">
                    {canLog && comp && (
                      <button
                        type="button"
                        onClick={() => onOpenLogActivity(comp.id, c.id)}
                        className="text-xs font-semibold text-blue-900 px-2 py-1 rounded bg-blue-50"
                      >
                        Log Call
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onEditContact(c)}
                        className="text-xs font-medium text-slate-700 px-2 py-1 rounded bg-slate-100"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Contact Dialog */}
      <ConfirmDialog
        isOpen={Boolean(contactToDelete)}
        onClose={() => setContactToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Contact"
        message={`Are you sure you want to delete ${contactToDelete?.name}?`}
        confirmText="Delete Contact"
        isDestructive={true}
      />
    </div>
  );
}
