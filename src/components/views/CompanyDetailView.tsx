import { useState, useMemo } from 'react';
import { Company, Contact, Activity, Deal, NavPage, User, Quote, Order, PaymentMilestone } from '../../types';
import { companiesService } from '../../services/companiesService';
import { contactsService } from '../../services/contactsService';
import { activitiesService } from '../../services/activitiesService';
import { dealsService } from '../../services/dealsService';
import { quotesService } from '../../services/quotesService';
import { ordersService } from '../../services/ordersService';
import { paymentsService } from '../../services/paymentsService';
import { authService } from '../../services/authService';
import { currencyService } from '../../services/currencyService';
import { Tabs, TabItem } from '../common/Tabs';
import { StatusIndicator, TypeIndicator, Tag } from '../common/Tag';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  PhoneCall,
  MapPin,
  ExternalLink,
  Mail,
  Phone,
  MessageSquare,
  Globe,
  DollarSign,
  CreditCard,
  UserCheck,
  Building,
  Calendar,
  Clock,
  Users,
  FileText,
  Kanban,
  Package,
  PackageCheck,
  Receipt,
  Eye,
} from 'lucide-react';

interface CompanyDetailViewProps {
  companyId: string;
  onNavigate: (page: NavPage, params?: { dealId?: string; companyId?: string; orderId?: string; search?: string }) => void;
  onEditCompany: (company: Company) => void;
  onOpenAddContact: (companyId: string) => void;
  onEditContact: (contact: Contact) => void;
  onOpenLogActivity: (companyId: string, contactId?: string) => void;
  onOpenAddDeal?: (companyId: string) => void;
  currentUser: User;
  onRefresh: () => void;
}


export function CompanyDetailView({
  companyId,
  onNavigate,
  onEditCompany,
  onOpenAddContact,
  onEditContact,
  onOpenLogActivity,
  onOpenAddDeal,
  currentUser,
  onRefresh,
}: CompanyDetailViewProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'deals' | 'quotes' | 'orders' | 'payments' | 'activity'>('overview');

  // Deletion confirmations
  const [confirmDeleteCompany, setConfirmDeleteCompany] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);

  const canEdit = authService.canEditCompanies(currentUser.role);
  const canDelete = authService.canDeleteCompanies(currentUser.role);
  const canLog = authService.canLogActivity(currentUser.role);
  const canManageDeals = authService.canManageDeals(currentUser.role);
  const canViewPrices = authService.canViewPrices(currentUser.role);

  const company = useMemo(() => {
    return companiesService.getCompanyById(companyId);
  }, [companyId]);

  const contacts = useMemo(() => {
    return contactsService.getContacts(companyId);
  }, [companyId]);

  const activities = useMemo(() => {
    return activitiesService.getActivities(companyId);
  }, [companyId]);

  const companyDeals = useMemo(() => {
    return dealsService.getDeals({ companyId }, currentUser.role);
  }, [companyId, currentUser.role]);

  const companyQuotes = useMemo(() => {
    return quotesService.getQuotes({ companyId });
  }, [companyId]);

  const companyOrders = useMemo(() => {
    return ordersService.getOrders({ companyId });
  }, [companyId]);

  const companyPayments = useMemo(() => {
    if (!companyOrders.length) return [];
    return paymentsService.getMilestones().filter(m =>
      companyOrders.some(o => o.id === m.orderId)
    );
  }, [companyOrders]);

  if (!company) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Company Record Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          This company might have been deleted or removed from the system.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('companies')}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-950"
        >
          Return to Companies
        </button>
      </div>
    );
  }

  const handleDeleteCompany = () => {
    try {
      companiesService.deleteCompany(company.id);
      showToast(`Company "${company.name}" has been removed.`, 'success', 'Deleted');
      onRefresh();
      onNavigate('companies');
    } catch {
      showToast('Error removing company record.', 'error');
    }
  };

  const handleDeleteContact = () => {
    if (!contactToDelete) return;
    try {
      contactsService.deleteContact(contactToDelete.id);
      showToast(`Removed contact ${contactToDelete.name}.`, 'success', 'Contact Deleted');
      setContactToDelete(null);
      onRefresh();
    } catch {
      showToast('Error removing contact.', 'error');
    }
  };

  const handleDeleteActivity = () => {
    if (!activityToDelete) return;
    try {
      activitiesService.deleteActivity(activityToDelete.id);
      showToast('Activity record removed.', 'success', 'Activity Deleted');
      setActivityToDelete(null);
      onRefresh();
    } catch {
      showToast('Error removing activity record.', 'error');
    }
  };

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'contacts', label: 'Contacts', count: contacts.length },
    { id: 'deals', label: 'Deals', count: companyDeals.length },
    { id: 'quotes', label: 'Quotes', count: companyQuotes.length },
    { id: 'orders', label: 'Orders', count: companyOrders.length },
    ...(canViewPrices ? [{ id: 'payments', label: 'Payments', count: companyPayments.length }] : []),
    { id: 'activity', label: 'Activity Timeline', count: activities.length },
  ];


  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4 text-blue-700" />;
      case 'email':
        return <Mail className="w-4 h-4 text-purple-700" />;
      case 'meeting':
        return <Users className="w-4 h-4 text-emerald-700" />;
      default:
        return <FileText className="w-4 h-4 text-slate-700" />;
    }
  };

  const cleanPhoneForWhatsApp = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
  };

  return (
    <div className="space-y-5">
      {/* Back button & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('companies')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Companies</span>
        </button>

        <div className="flex items-center gap-2">
          {canLog && (
            <button
              type="button"
              onClick={() => onOpenLogActivity(company.id)}
              className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Log Activity</span>
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => onEditCompany(company)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Company</span>
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirmDeleteCompany(true)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
              title="Delete company"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Company Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {company.name}
              </h1>
              <TypeIndicator type={company.type} />
              <StatusIndicator status={company.status} />
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-medium text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {company.city}, {company.country}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Trade Currency:{' '}
                <strong className="font-mono text-slate-900">{company.currency}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Owner: <strong className="text-slate-800">{company.assignedOwner}</strong>
              </span>
              {company.website && (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 hover:underline flex items-center gap-0.5"
                  >
                    <span>{company.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="mt-5">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as any)}
          />
        </div>
      </div>

      {/* Tab 1: Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main trading parameters */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Trading Profile & Products
              </h3>

              {/* Products of Interest */}
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Products & Fibers of Interest (Click to view in catalog)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {company.productsOfInterest.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onNavigate('products', { search: p })}
                      className="group text-left"
                      title={`Find "${p}" in catalog`}
                    >
                      <Tag key={p} label={p} variant="blue" />
                    </button>
                  ))}
                  {company.productsOfInterest.length === 0 && (
                    <span className="text-xs text-slate-400">None specified yet.</span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">
                  Mill Capacity, Specs & Internal Trading Notes
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  {company.notes || 'No internal notes recorded yet.'}
                </p>
              </div>

              {/* Address */}
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">
                  Physical / Port Address
                </span>
                <p className="text-xs text-slate-700">
                  {company.address || 'Address not registered.'}
                </p>
              </div>
            </div>
          </div>

          {/* Commercial & Contract Terms */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Financial & Trade Terms
              </h3>

              <div className="flex items-start gap-2.5">
                <CreditCard className="w-4 h-4 text-blue-900 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 block">Payment Terms</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900">
                    {company.paymentTerms || 'Terms Under Negotiation'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <DollarSign className="w-4 h-4 text-blue-900 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 block">Settlement Currency</span>
                  <span className="text-xs sm:text-sm font-mono font-semibold text-slate-900">
                    {company.currency}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-blue-900 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 block">Internal Account Manager</span>
                  <span className="text-xs sm:text-sm font-medium text-slate-900">
                    {company.assignedOwner}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-blue-900 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 block">Record Created</span>
                  <span className="text-xs font-mono tabular-nums text-slate-700">
                    {new Date(company.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick contact teaser */}
            <div className="bg-blue-50/60 rounded-xl border border-blue-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-950">Key Contacts</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('contacts')}
                  className="text-xs text-blue-800 hover:underline font-semibold"
                >
                  View all ({contacts.length})
                </button>
              </div>
              <p className="text-xs text-slate-600">
                {contacts.length > 0
                  ? `Primary: ${contacts.find((c) => c.isPrimary)?.name || contacts[0].name} (${contacts[0].position})`
                  : 'No contacts added for this mill yet.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Contacts Tab */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Company Key Contacts ({contacts.length})
              </h3>
              <p className="text-xs text-slate-500">
                Authorized buyers, sourcing directors, and quality lab officers.
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => onOpenAddContact(company.id)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            )}
          </div>

          {contacts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">No contacts added yet</h4>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Add purchasing directors or plant managers to facilitate trading negotiations.
              </p>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onOpenAddContact(company.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  Add First Contact
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{contact.name}</span>
                        {contact.isPrimary && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-900 border border-blue-200">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{contact.position}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onEditContact(contact)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                          title="Edit contact"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setContactToDelete(contact)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Delete contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-blue-700 hover:underline truncate"
                      >
                        {contact.email}
                      </a>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-800">{contact.phone}</span>
                      </div>
                      <a
                        href={`https://wa.me/${cleanPhoneForWhatsApp(contact.phone)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded hover:bg-emerald-100"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Preferred Language: {contact.preferredLanguage || 'English'}</span>
                    </div>
                  </div>

                  {contact.notes && (
                    <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 leading-relaxed italic">
                      &ldquo;{contact.notes}&rdquo;
                    </p>
                  )}

                  {/* Quick log activity with this contact */}
                  {canLog && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onOpenLogActivity(company.id, contact.id)}
                        className="text-xs font-semibold text-blue-900 hover:underline inline-flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Log call with {contact.name.split(' ')[0]}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Deals Tab */}
      {activeTab === 'deals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Company Deals Pipeline ({companyDeals.length})
              </h3>
              <p className="text-xs text-slate-500">
                Active inquiries, price quotes, sample dispatches, and confirmed contracts.
              </p>
            </div>
            {canManageDeals && onOpenAddDeal && (
              <button
                type="button"
                onClick={() => onOpenAddDeal(company.id)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Deal</span>
              </button>
            )}
          </div>

          {companyDeals.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Kanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">No deals registered for this partner</h4>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Create a sales quote or purchase contract to start tracking stages.
              </p>
              {canManageDeals && onOpenAddDeal && (
                <button
                  type="button"
                  onClick={() => onOpenAddDeal(company.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  Create First Deal
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {companyDeals.map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => onNavigate('deal-detail', { dealId: deal.id })}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2 cursor-pointer hover:border-blue-400 hover:shadow-xs transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                            deal.dealType === 'Sale'
                              ? 'bg-blue-50 text-blue-900 border-blue-200'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          }`}
                        >
                          {deal.dealType}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 hover:text-blue-900">
                          {deal.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{deal.quantity} {deal.unit}</span>
                        <span aria-hidden="true">·</span>
                        <span>{deal.incoterm} · {deal.destinationPort}</span>
                        <span aria-hidden="true">·</span>
                        <span>Close: {deal.expectedCloseDate}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-slate-900">
                        {currencyService.formatAmount(deal.totalValue, deal.currency)}
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border mt-1 ${
                          deal.stage === 'Order Confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : deal.stage === 'Lost'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : deal.stage === 'Negotiation'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-900 border-blue-200'
                        }`}
                      >
                        {deal.stage}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Activity Timeline Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Trade Activity & Audit Trail ({activities.length})
              </h3>
              <p className="text-xs text-slate-500">
                Log of quotes, test batches, WhatsApp discussions, and LC verification.
              </p>
            </div>
            {canLog && (
              <button
                type="button"
                onClick={() => onOpenLogActivity(company.id)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Activity</span>
              </button>
            )}
          </div>

          {activities.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">No activity recorded yet</h4>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Log your first call, mill visit, or sample quotation for this partner.
              </p>
              {canLog && (
                <button
                  type="button"
                  onClick={() => onOpenLogActivity(company.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  Log First Activity
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => {
                const contact = contacts.find((c) => c.id === act.contactId);
                return (
                  <div
                    key={act.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2 relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-md bg-slate-100 shrink-0 mt-0.5">
                          {getActivityIcon(act.type)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{act.title}</h4>
                            {act.outcome && (
                              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                                {act.outcome}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 mt-0.5">
                            <span className="font-mono tabular-nums">
                              {new Date(act.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>Logged by {act.loggedBy}</span>
                            {contact && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>with {contact.name} ({contact.position})</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setActivityToDelete(act)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Delete activity record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-8">
                      {act.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Quotes */}
      {activeTab === 'quotes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quotations & Proformas ({companyQuotes.length})
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('quotes', { companyId: company.id })}
              className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Manage Quotes</span>
            </button>
          </div>

          {companyQuotes.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No quotations or proforma invoices generated for this company yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {companyQuotes.map((q) => (
                <div key={q.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-900">{q.quoteNumber}</span>
                      <span className="text-[11px] text-slate-500 font-medium">({q.type})</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {q.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Date: {q.date} • Valid until: {q.validityDate} • Incoterm: {q.incoterm}
                    </p>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    {canViewPrices ? (
                      <span className="font-mono font-bold text-slate-900">
                        {q.currency} {q.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-slate-400">Hidden</span>
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigate('quotes', { companyId: company.id })}
                      className="text-xs text-blue-700 hover:underline font-semibold"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sales & Purchase Orders ({companyOrders.length})
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('orders', { companyId: company.id })}
              className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1.5"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>View All Orders</span>
            </button>
          </div>

          {companyOrders.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No orders recorded for this company yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {companyOrders.map((o) => (
                <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('order-detail', { orderId: o.id })}
                        className="font-mono font-bold text-blue-900 hover:underline"
                      >
                        {o.orderNumber}
                      </button>
                      <span className="text-[11px] font-semibold text-slate-600">({o.orderType})</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-800">
                        {o.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Shipment Date: {o.expectedShipmentDate} • Port: {o.destinationPort}
                    </p>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    {canViewPrices ? (
                      <span className="font-mono font-bold text-slate-900">
                        {o.currency} {o.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-slate-400">Hidden</span>
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigate('order-detail', { orderId: o.id })}
                      className="text-xs text-blue-700 hover:underline font-semibold"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Payments */}
      {activeTab === 'payments' && canViewPrices && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Payment Milestones & Collections ({companyPayments.length})
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('payments', { companyId: company.id })}
              className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payments Page</span>
            </button>
          </div>

          {companyPayments.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No payment milestones on record for this company.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {companyPayments.map((m) => {
                const rem = Math.max(0, m.amount - (m.paidAmount || 0));
                return (
                  <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{m.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Due Date: {m.dueDate} • Method: {m.method}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-900">
                        {m.currency} {m.amount.toLocaleString()}
                      </p>
                      <p className="text-[11px] mt-0.5">
                        {rem > 0 ? (
                          <span className={m.status === 'Overdue' ? 'text-red-700 font-bold' : 'text-slate-600'}>
                            Remaining: {m.currency} {rem.toLocaleString()} ({m.status})
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">Fully Paid</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* Delete Company Dialog */}
      <ConfirmDialog
        isOpen={confirmDeleteCompany}
        onClose={() => setConfirmDeleteCompany(false)}
        onConfirm={handleDeleteCompany}
        title="Delete Company Record"
        message={`Are you sure you want to delete ${company.name}? This will remove all associated contacts and activity records.`}
        confirmText="Delete Company"
        isDestructive={true}
      />

      {/* Delete Contact Dialog */}
      <ConfirmDialog
        isOpen={Boolean(contactToDelete)}
        onClose={() => setContactToDelete(null)}
        onConfirm={handleDeleteContact}
        title="Delete Contact"
        message={`Are you sure you want to delete ${contactToDelete?.name}?`}
        confirmText="Delete Contact"
        isDestructive={true}
      />

      {/* Delete Activity Dialog */}
      <ConfirmDialog
        isOpen={Boolean(activityToDelete)}
        onClose={() => setActivityToDelete(null)}
        onConfirm={handleDeleteActivity}
        title="Delete Activity"
        message={`Are you sure you want to delete "${activityToDelete?.title}"?`}
        confirmText="Delete Activity"
        isDestructive={true}
      />
    </div>
  );
}
