import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Company,
  Contact,
  Activity,
  Product,
  Deal,
  NavPage,
  DealType,
  Quote,
  Order,
} from './types';
import { authService } from './services/authService';
import { companiesService } from './services/companiesService';
import { contactsService } from './services/contactsService';
import { activitiesService } from './services/activitiesService';
import { productsService } from './services/productsService';
import { dealsService } from './services/dealsService';
import { quotesService } from './services/quotesService';
import { ordersService } from './services/ordersService';
import { paymentsService } from './services/paymentsService';
import { settingsService } from './services/settingsService';
import { STORAGE_KEYS } from './services/storageKeys';
import {
  INITIAL_COMPANIES,
  INITIAL_CONTACTS,
  INITIAL_ACTIVITIES,
  INITIAL_PRODUCTS,
  INITIAL_DEALS,
  INITIAL_QUOTES,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_PAYMENT_RECORDS,
  DEFAULT_COMPANY_SETTINGS,
} from './services/seedData';

// Context
import { ToastProvider, useToast } from './context/ToastContext';

// Layout
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomTabBar } from './components/layout/BottomTabBar';
import { MobileFloatingActivityButton } from './components/layout/MobileFloatingActivityButton';

// Modals
import { UserSwitcherModal } from './components/common/UserSwitcherModal';
import { CompanyFormModal } from './components/companies/CompanyFormModal';
import { ContactFormModal } from './components/contacts/ContactFormModal';
import { ActivityFormModal } from './components/activities/ActivityFormModal';
import { ProductFormModal } from './components/products/ProductFormModal';
import { DealFormModal } from './components/deals/DealFormModal';
import { ConfirmDialog } from './components/common/ConfirmDialog';

// Views
import { DashboardView } from './components/views/DashboardView';
import { CompaniesListView } from './components/views/CompaniesListView';
import { CompanyDetailView } from './components/views/CompanyDetailView';
import { ContactsListView } from './components/views/ContactsListView';
import { ProductsListView } from './components/views/ProductsListView';
import { DealsPipelineView } from './components/views/DealsPipelineView';
import { DealDetailView } from './components/views/DealDetailView';
import { ActivitiesListView } from './components/views/ActivitiesListView';
import QuotesListView from './components/views/QuotesListView';
import OrdersListView from './components/views/OrdersListView';
import OrderDetailView from './components/views/OrderDetailView';
import PaymentsListView from './components/views/PaymentsListView';
import SettingsView from './components/views/SettingsView';
import { LoginView } from './components/views/LoginView';

function CRMApp() {
  const { showToast } = useToast();

  // Current authenticated user
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());

  // Navigation state
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeCountryFilter, setActiveCountryFilter] = useState<string>('All');
  const [productCatalogSearch, setProductCatalogSearch] = useState<string>('');

  // Search in top bar
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state: Companies & Contacts
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [targetCompanyIdForContact, setTargetCompanyIdForContact] = useState<string | undefined>(undefined);

  // Modals state: Products & Deals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<Deal | null>(null);
  const [targetCompanyIdForDeal, setTargetCompanyIdForDeal] = useState<string | undefined>(undefined);
  const [targetProductIdForDeal, setTargetProductIdForDeal] = useState<string | undefined>(undefined);
  const [targetDealTypeForDeal, setTargetDealTypeForDeal] = useState<DealType>('Sale');

  // Modals state: Activities & Reset
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [targetCompanyIdForActivity, setTargetCompanyIdForActivity] = useState<string | undefined>(undefined);
  const [targetContactIdForActivity, setTargetContactIdForActivity] = useState<string | undefined>(undefined);
  const [targetDealIdForActivity, setTargetDealIdForActivity] = useState<string | undefined>(undefined);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Entities state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Refresh all entities from localStorage
  const refreshData = useCallback(() => {
    const comps = companiesService.getCompanies();
    const conts = contactsService.getContacts();
    const acts = activitiesService.getActivities();
    const prods = productsService.getProducts();
    const dls = dealsService.getDeals(undefined, currentUser?.role);
    const qts = quotesService.getQuotes();
    const ords = ordersService.getOrders();

    setCompanies(comps);
    setContacts(conts);
    setActivities(acts);
    setProducts(prods);
    setDeals(dls);
    setQuotes(qts);
    setOrders(ords);
  }, [currentUser?.role]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handle page navigation
  const handleNavigate = (
    page: NavPage,
    params?: { companyId?: string; dealId?: string; orderId?: string; countryFilter?: string; search?: string }
  ) => {
    if (params?.companyId) {
      setSelectedCompanyId(params.companyId);
    }
    if (params?.dealId) {
      setSelectedDealId(params.dealId);
    }
    if (params?.orderId) {
      setSelectedOrderId(params.orderId);
    }
    if (params?.countryFilter) {
      setActiveCountryFilter(params.countryFilter);
    }
    if (params?.search) {
      setProductCatalogSearch(params.search);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Convert Quote to Order handler
  const handleConvertToOrderFromQuote = (quote: Quote) => {
    if (!currentUser) return;
    try {
      const order = ordersService.createOrderFromQuote(quote.id, currentUser.name);
      showToast(`Order ${order.orderNumber} successfully registered from ${quote.quoteNumber}`, 'success', 'Order Created');
      refreshData();
      handleNavigate('order-detail', { orderId: order.id });
    } catch (err: any) {
      showToast(err.message || 'Failed to convert quote to order', 'error');
    }
  };

  // Switch User handler
  const handleSelectUser = (user: User) => {
    const updated = authService.switchUser(user.id);
    setCurrentUser(updated);
    showToast(`Switched account to ${updated.name} (${updated.role})`, 'info', 'Role Changed');

    // If current page is not accessible by this new role, redirect to dashboard
    if (!authService.canAccessPage(updated, currentPage)) {
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    showToast('Signed out of demo session', 'info');
  };

  // Reset demo data handler (Milestones 1, 2, and 3)
  const handleResetDemoData = () => {
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

    refreshData();
    setIsResetConfirmOpen(false);
    showToast('CRM reset with sample companies, quotes, orders, and payments', 'success', 'Data Restored');
  };

  // If user is logged out, show LoginView
  if (!currentUser) {
    return <LoginView onSelectUser={handleSelectUser} />;
  }

  // Quick Open Modal helpers
  const handleOpenAddCompany = () => {
    setCompanyToEdit(null);
    setIsCompanyModalOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setCompanyToEdit(company);
    setIsCompanyModalOpen(true);
  };

  const handleOpenAddContact = (companyId?: string) => {
    setContactToEdit(null);
    setTargetCompanyIdForContact(companyId);
    setIsContactModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setContactToEdit(contact);
    setTargetCompanyIdForContact(contact.companyId);
    setIsContactModalOpen(true);
  };

  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  const handleOpenAddDeal = (companyId?: string, productId?: string, dealType?: DealType) => {
    setDealToEdit(null);
    setTargetCompanyIdForDeal(companyId);
    setTargetProductIdForDeal(productId);
    setTargetDealTypeForDeal(dealType || (currentUser.role === 'Procurement' ? 'Purchase' : 'Sale'));
    setIsDealModalOpen(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setDealToEdit(deal);
    setTargetCompanyIdForDeal(deal.companyId);
    setTargetProductIdForDeal(deal.productId);
    setTargetDealTypeForDeal(deal.dealType);
    setIsDealModalOpen(true);
  };

  const handleOpenLogActivity = (companyId?: string, contactId?: string, dealId?: string) => {
    setTargetCompanyIdForActivity(companyId || selectedCompanyId || undefined);
    setTargetContactIdForActivity(contactId);
    setTargetDealIdForActivity(dealId);
    setIsActivityModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
        onResetData={() => setIsResetConfirmOpen(true)}
        onLogout={handleLogout}
        companyCount={companies.length}
        dealCount={deals.length}
        productCount={products.length}
        quoteCount={quotes.length}
        orderCount={orders.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Top Bar */}
        <TopBar
          currentUser={currentUser}
          onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
          onSearch={(query) => {
            setSearchQuery(query);
            if (
              query &&
              currentPage !== 'companies' &&
              currentPage !== 'deals' &&
              currentPage !== 'products' &&
              currentPage !== 'quotes' &&
              currentPage !== 'orders'
            ) {
              setCurrentPage('companies');
            }
          }}
          searchQuery={searchQuery}
          onNavigate={handleNavigate}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:p-6 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && (
              <DashboardView
                companies={companies}
                activities={activities}
                deals={deals}
                onNavigate={handleNavigate}
                onOpenAddCompany={handleOpenAddCompany}
                onOpenAddDeal={() => handleOpenAddDeal()}
                onOpenLogActivity={() => handleOpenLogActivity()}
                currentUser={currentUser}
              />
            )}

            {currentPage === 'deals' && (
              <DealsPipelineView
                deals={deals}
                companies={companies}
                products={products}
                onRefresh={refreshData}
                onNavigate={handleNavigate}
                onOpenAddDeal={() => handleOpenAddDeal()}
                onEditDeal={handleEditDeal}
                currentUser={currentUser}
              />
            )}

            {currentPage === 'deal-detail' && selectedDealId && (
              <DealDetailView
                dealId={selectedDealId}
                onNavigate={handleNavigate}
                onEditDeal={handleEditDeal}
                onOpenLogActivity={(cid, contactId, did) => handleOpenLogActivity(cid, contactId, did)}
                currentUser={currentUser}
                companies={companies}
                contacts={contacts}
                products={products}
                onRefresh={refreshData}
              />
            )}

            {currentPage === 'quotes' && (
              <QuotesListView
                currentUser={currentUser}
                onNavigateToCompany={(cid) => handleNavigate('company-detail', { companyId: cid })}
                onNavigateToOrder={(oid) => handleNavigate('order-detail', { orderId: oid })}
                onConvertToOrderRequest={handleConvertToOrderFromQuote}
              />
            )}

            {currentPage === 'orders' && (
              <OrdersListView
                currentUser={currentUser}
                onSelectOrder={(oid) => handleNavigate('order-detail', { orderId: oid })}
                onNavigateToCompany={(cid) => handleNavigate('company-detail', { companyId: cid })}
              />
            )}

            {currentPage === 'order-detail' && selectedOrderId && (
              <OrderDetailView
                orderId={selectedOrderId}
                currentUser={currentUser}
                onBack={() => handleNavigate('orders')}
                onNavigateToCompany={(cid) => handleNavigate('company-detail', { companyId: cid })}
                onNavigateToDeal={(did) => handleNavigate('deal-detail', { dealId: did })}
              />
            )}

            {currentPage === 'payments' && (
              <PaymentsListView
                currentUser={currentUser}
                onNavigateToOrder={(oid) => handleNavigate('order-detail', { orderId: oid })}
                onNavigateToCompany={(cid) => handleNavigate('company-detail', { companyId: cid })}
              />
            )}

            {currentPage === 'products' && (
              <ProductsListView
                products={products}
                onRefresh={refreshData}
                onOpenAddProduct={handleOpenAddProduct}
                onEditProduct={handleEditProduct}
                onNavigateToNewDealWithProduct={(prodId) => handleOpenAddDeal(undefined, prodId)}
                currentUser={currentUser}
              />
            )}

            {currentPage === 'companies' && (
              <CompaniesListView
                companies={companies}
                onRefresh={refreshData}
                onNavigate={handleNavigate}
                onOpenAddCompany={handleOpenAddCompany}
                onEditCompany={handleEditCompany}
                currentUser={currentUser}
                initialCountryFilter={activeCountryFilter}
              />
            )}

            {currentPage === 'company-detail' && selectedCompanyId && (
              <CompanyDetailView
                companyId={selectedCompanyId}
                onNavigate={handleNavigate}
                onEditCompany={handleEditCompany}
                onOpenAddContact={(cid) => handleOpenAddContact(cid)}
                onEditContact={handleEditContact}
                onOpenLogActivity={(cid, contactId) => handleOpenLogActivity(cid, contactId)}
                onOpenAddDeal={(cid) => handleOpenAddDeal(cid)}
                currentUser={currentUser}
                onRefresh={refreshData}
              />
            )}

            {currentPage === 'contacts' && (
              <ContactsListView
                contacts={contacts}
                companies={companies}
                onRefresh={refreshData}
                onNavigate={handleNavigate}
                onOpenAddContact={() => handleOpenAddContact()}
                onEditContact={handleEditContact}
                onOpenLogActivity={(cid, contactId) => handleOpenLogActivity(cid, contactId)}
                currentUser={currentUser}
              />
            )}

            {currentPage === 'activities' && (
              <ActivitiesListView
                activities={activities}
                companies={companies}
                contacts={contacts}
                onRefresh={refreshData}
                onNavigate={handleNavigate}
                onOpenLogActivity={() => handleOpenLogActivity()}
                currentUser={currentUser}
              />
            )}

            {currentPage === 'settings' && (
              <SettingsView currentUser={currentUser} />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        currentUser={currentUser}
      />

      {/* Mobile Floating Action Button to Quick Log Activity */}
      {authService.canLogActivity(currentUser.role) && (
        <MobileFloatingActivityButton onClick={() => handleOpenLogActivity()} />
      )}

      {/* Modals */}
      <UserSwitcherModal
        isOpen={isUserSwitcherOpen}
        onClose={() => setIsUserSwitcherOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
      />

      <CompanyFormModal
        isOpen={isCompanyModalOpen}
        onClose={() => {
          setIsCompanyModalOpen(false);
          setCompanyToEdit(null);
        }}
        initialData={companyToEdit}
        onSave={(saved) => {
          refreshData();
          showToast(
            `Company "${saved.name}" has been ${companyToEdit ? 'updated' : 'created'}.`,
            'success',
            companyToEdit ? 'Updated' : 'Created'
          );
        }}
      />

      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          setContactToEdit(null);
          setTargetCompanyIdForContact(undefined);
        }}
        initialData={contactToEdit}
        defaultCompanyId={targetCompanyIdForContact}
        onSave={(saved) => {
          refreshData();
          showToast(
            `Contact ${saved.name} has been saved.`,
            'success',
            'Contact Saved'
          );
        }}
      />

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        initialData={productToEdit}
        onSave={(saved) => {
          refreshData();
          showToast(
            `Product "${saved.name}" has been ${productToEdit ? 'updated' : 'added to catalog'}.`,
            'success',
            'Catalog Updated'
          );
        }}
      />

      {/* Deal Form Modal */}
      <DealFormModal
        isOpen={isDealModalOpen}
        onClose={() => {
          setIsDealModalOpen(false);
          setDealToEdit(null);
          setTargetCompanyIdForDeal(undefined);
          setTargetProductIdForDeal(undefined);
        }}
        initialData={dealToEdit}
        defaultCompanyId={targetCompanyIdForDeal}
        defaultProductId={targetProductIdForDeal}
        defaultDealType={targetDealTypeForDeal}
        userName={currentUser.name}
        onSave={(saved) => {
          refreshData();
          showToast(
            `Deal "${saved.title}" (${saved.currency} ${saved.totalValue.toLocaleString()}) saved.`,
            'success',
            dealToEdit ? 'Deal Updated' : 'Deal Created'
          );
        }}
      />

      {/* Activity Form Modal */}
      <ActivityFormModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setTargetCompanyIdForActivity(undefined);
          setTargetContactIdForActivity(undefined);
          setTargetDealIdForActivity(undefined);
        }}
        defaultCompanyId={targetCompanyIdForActivity}
        defaultContactId={targetContactIdForActivity}
        defaultDealId={targetDealIdForActivity}
        onSave={(saved) => {
          refreshData();
          showToast(`Logged ${saved.type}: "${saved.title}"`, 'success', 'Activity Logged');
        }}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetDemoData}
        title="Reset Demo Data to Initial Seeds"
        message="This will restore all preloaded companies, products, deals, quotes, orders, and payment records to clean realistic sample values. Any newly created records will be refreshed."
        confirmText="Reset CRM Data"
        isDestructive={false}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <CRMApp />
    </ToastProvider>
  );
}
