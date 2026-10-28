import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Shield,
  ShieldAlert,
  UserCheck,
  FileText,
  ChevronRight,
  Send,
  Edit,
  Trash2,
  X,
  Printer,
  Download,
  FileDown,
  Receipt,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  History,
  Layers,
} from 'lucide-react';
import { Customer, Agreement, Payment, ShopSettings, CustomerRating, User } from '../types';
import { generateCustomerPaymentLedgerPDF } from '../utils/pdfGenerator';
import { formatDateDDMMYYYY } from '../utils/formatters';
import { ExpandableSearch } from './ExpandableSearch';

interface CustomersViewProps {
  customers: Customer[];
  agreements: Agreement[];
  payments?: Payment[];
  currentUser?: User;
  settings?: ShopSettings;
  searchQuery: string;
  setSearchQuery?: (query: string) => void;
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'customerCode' | 'createdAt'>) => void;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
  onOpenNewAgreement?: () => void;
  onOpenNewAgreementForCustomer?: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  agreements,
  payments = [],
  currentUser,
  settings = { currencySymbol: 'Rs.', shopName: 'Pakistan Traders Corp', proprietorName: '', phone: '', address: '', city: 'Lahore', regNumber: '', pinCode: '1234', isLocked: false },
  searchQuery,
  setSearchQuery,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onOpenNewAgreement,
  onOpenNewAgreementForCustomer,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [ratingFilter, setRatingFilter] = useState<'all' | CustomerRating>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [pageSize, setPageSize] = useState<number>(25);

  // Edit Customer State (Admin Only)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustCnic, setEditCustCnic] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustAltPhone, setEditCustAltPhone] = useState('');
  const [editCustAddress, setEditCustAddress] = useState('');
  const [editCustCity, setEditCustCity] = useState('Lahore');
  const [editCustRating, setEditCustRating] = useState<CustomerRating>('good');
  const [editG1Name, setEditG1Name] = useState('');
  const [editG1Cnic, setEditG1Cnic] = useState('');
  const [editG1Phone, setEditG1Phone] = useState('');
  const [editG1Relation, setEditG1Relation] = useState('Brother');
  const [editG1Address, setEditG1Address] = useState('');
  const [editG2Name, setEditG2Name] = useState('');
  const [editG2Cnic, setEditG2Cnic] = useState('');
  const [editG2Phone, setEditG2Phone] = useState('');
  const [editG2Relation, setEditG2Relation] = useState('Friend');
  const [editG2Address, setEditG2Address] = useState('');
  const [editCustomerValidationError, setEditCustomerValidationError] = useState<string | null>(null);

  // Delete Customer State (Admin Only)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // New Customer Form State
  const [formName, setFormName] = useState('');
  const [formCnic, setFormCnic] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAltPhone, setFormAltPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Lahore');
  const [formRating, setFormRating] = useState<CustomerRating>('good');

  // Guarantor 1
  const [g1Name, setG1Name] = useState('');
  const [g1Cnic, setG1Cnic] = useState('');
  const [g1Phone, setG1Phone] = useState('');
  const [g1Relation, setG1Relation] = useState('Brother');
  const [g1Address, setG1Address] = useState('');

  // Guarantor 2
  const [g2Name, setG2Name] = useState('');
  const [g2Cnic, setG2Cnic] = useState('');
  const [g2Phone, setG2Phone] = useState('');
  const [g2Relation, setG2Relation] = useState('Friend');
  const [g2Address, setG2Address] = useState('');
  const [customerValidationError, setCustomerValidationError] = useState<string | null>(null);

  const handleStartEditCustomer = (cust: Customer) => {
    setEditingCustomer(cust);
    setEditCustName(cust.fullName);
    setEditCustCnic(cust.cnic);
    setEditCustPhone(cust.phone);
    setEditCustAltPhone(cust.altPhone || '');
    setEditCustAddress(cust.address);
    setEditCustCity(cust.city);
    setEditCustRating(cust.rating);
    setEditG1Name(cust.guarantor1.name);
    setEditG1Cnic(cust.guarantor1.cnic);
    setEditG1Phone(cust.guarantor1.phone);
    setEditG1Relation(cust.guarantor1.relation);
    setEditG1Address(cust.guarantor1.address);
    setEditG2Name(cust.guarantor2?.name || '');
    setEditG2Cnic(cust.guarantor2?.cnic || '');
    setEditG2Phone(cust.guarantor2?.phone || '');
    setEditG2Relation(cust.guarantor2?.relation || 'Friend');
    setEditG2Address(cust.guarantor2?.address || '');
    setEditCustomerValidationError(null);
  };

  const handleSaveCustomerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!editCustName.trim() || !editCustCnic.trim() || !editCustPhone.trim()) {
      setEditCustomerValidationError('Name, CNIC, and Phone are required.');
      return;
    }
    if (!editG1Name.trim() || !editG1Cnic.trim() || !editG1Phone.trim()) {
      setEditCustomerValidationError('Guarantor 1 details are required.');
      return;
    }

    onUpdateCustomer(editingCustomer.id, {
      fullName: editCustName.trim(),
      cnic: editCustCnic.trim(),
      phone: editCustPhone.trim(),
      altPhone: editCustAltPhone.trim() || undefined,
      address: editCustAddress.trim(),
      city: editCustCity.trim(),
      rating: editCustRating,
      guarantor1: {
        name: editG1Name.trim(),
        cnic: editG1Cnic.trim(),
        phone: editG1Phone.trim(),
        relation: editG1Relation.trim(),
        address: editG1Address.trim() || editCustAddress.trim(),
      },
      guarantor2: editG2Name.trim()
        ? {
            name: editG2Name.trim(),
            cnic: editG2Cnic.trim(),
            phone: editG2Phone.trim(),
            relation: editG2Relation.trim(),
            address: editG2Address.trim() || editCustAddress.trim(),
          }
        : undefined,
    });

    if (selectedCustomer && selectedCustomer.id === editingCustomer.id) {
      setSelectedCustomer({
        ...selectedCustomer,
        fullName: editCustName.trim(),
        cnic: editCustCnic.trim(),
        phone: editCustPhone.trim(),
        altPhone: editCustAltPhone.trim() || undefined,
        address: editCustAddress.trim(),
        city: editCustCity.trim(),
        rating: editCustRating,
        guarantor1: {
          name: editG1Name.trim(),
          cnic: editG1Cnic.trim(),
          phone: editG1Phone.trim(),
          relation: editG1Relation.trim(),
          address: editG1Address.trim() || editCustAddress.trim(),
        },
        guarantor2: editG2Name.trim()
          ? {
              name: editG2Name.trim(),
              cnic: editG2Cnic.trim(),
              phone: editG2Phone.trim(),
              relation: editG2Relation.trim(),
              address: editG2Address.trim() || editCustAddress.trim(),
            }
          : undefined,
      });
    }

    setEditingCustomer(null);
  };

  const handleConfirmDeleteCustomer = () => {
    if (!customerToDelete) return;
    onDeleteCustomer(customerToDelete.id);
    if (selectedCustomer && selectedCustomer.id === customerToDelete.id) {
      setSelectedCustomer(null);
    }
    setCustomerToDelete(null);
  };

  const normalizeSearch = searchQuery.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const handleDownloadPdf = (customer: Customer) => {
    generateCustomerPaymentLedgerPDF(customer, agreements, payments, settings);
  };

  const filtered = customers.filter((c) => {
    const normCnic = c.cnic.replace(/[^0-9]/g, '');
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cnic.includes(searchQuery) ||
      normCnic.includes(normalizeSearch) ||
      c.phone.includes(searchQuery) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating = ratingFilter === 'all' || c.rating === ratingFilter;

    return matchesSearch && matchesRating;
  });

  const existingCnicMatch = customers.find(
    (c) => c.cnic.replace(/[^0-9]/g, '') === formCnic.replace(/[^0-9]/g, '') && formCnic.trim().length > 5
  );

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerValidationError(null);
    if (!formName.trim() || !formCnic.trim() || !formPhone.trim() || !g1Name.trim() || !g1Cnic.trim()) {
      setCustomerValidationError('Please fill out all required fields (Name, CNIC, Phone, Guarantor 1 Info).');
      return;
    }

    onAddCustomer({
      fullName: formName,
      cnic: formCnic,
      phone: formPhone,
      altPhone: formAltPhone || undefined,
      address: formAddress,
      city: formCity,
      rating: formRating,
      guarantor1: {
        name: g1Name,
        cnic: g1Cnic,
        phone: g1Phone,
        relation: g1Relation,
        address: g1Address || formAddress,
      },
      guarantor2: g2Name
        ? {
            name: g2Name,
            cnic: g2Cnic,
            phone: g2Phone,
            relation: g2Relation,
            address: g2Address || formAddress,
          }
        : undefined,
    });

    setShowAddModal(false);
    setFormName('');
    setFormCnic('');
    setFormPhone('');
    setG1Name('');
    setG1Cnic('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="m3-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-heading font-extrabold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
            <Users className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
            Customer Directory & Ledgers
          </h1>
          <p className="text-caption font-medium text-text-muted mt-1">
            Total {customers.length} verified customer profiles with National ID, Phone & Guarantor records.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <ExpandableSearch
            value={searchQuery}
            onChange={(val) => setSearchQuery?.(val)}
            placeholder="Search customers"
            resultCount={{ current: filtered.length, total: customers.length }}
            recentKey="customers"
            shortcut="/"
            chipLabelPrefix="Customer"
          />

          <button
            onClick={() => setShowAddModal(true)}
            className="m3-btn-base m3-btn-filled text-body-sm py-2.5 px-4 font-bold shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add New Customer</span>
            <span className="sm:hidden">Add Customer</span>
          </button>
        </div>
      </div>

      {/* Rating Filters */}
      <div className="flex items-center gap-2 border-b pb-2.5 overflow-x-auto no-scrollbar" style={{ borderColor: 'var(--theme-surface-border)' }}>
        {(['all', 'good', 'watch', 'defaulter'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRatingFilter(r)}
            className="px-4 py-2 text-caption font-bold rounded-full capitalize transition-all border whitespace-nowrap"
            style={{
              backgroundColor: ratingFilter === r ? 'var(--theme-tonal-bg)' : 'transparent',
              color: ratingFilter === r ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
              borderColor: ratingFilter === r ? 'var(--theme-primary)' : 'transparent',
            }}
          >
            {r === 'all' ? 'All Customers' : `${r} Rating`} ({customers.filter((c) => r === 'all' || c.rating === r).length})
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="m3-card p-10 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center bg-surface-variant text-text-muted">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-title font-bold text-text">No match found</h3>
          <p className="text-body-sm text-text-muted max-w-md mx-auto">
            {searchQuery
              ? `No match. Try name, CNIC, phone or city.`
              : 'No customers available in this filter category.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery?.('')}
              className="m3-btn-base m3-btn-tonal text-caption py-2 px-4 font-bold"
            >
              Clear Search Query
            </button>
          )}
        </div>
      )}

      {/* Grid of Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.slice(0, pageSize).map((customer) => {
          const custAgreements = agreements.filter((a) => a.customerId === customer.id);
          const activeAgrCount = custAgreements.filter((a) => a.status === 'active' || a.status === 'defaulter').length;
          const totalBalance = custAgreements.reduce((sum, a) => sum + a.remainingBalance, 0);

          return (
            <div
              key={customer.id}
              className="m3-card p-4.5 flex flex-col justify-between space-y-4 hover:border-primary transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-bold px-2.5 py-0.5 rounded-full border font-mono-tabular" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                    {customer.customerCode}
                  </span>
                  <span className="text-caption font-bold px-2.5 py-0.5 rounded-full capitalize border font-mono-tabular" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                    {customer.rating}
                  </span>
                </div>

                <div>
                  <h3 className="text-title font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>
                    {customer.fullName}
                  </h3>
                  <div className="text-body-sm text-text-muted font-mono-tabular mt-0.5 font-medium">
                    CNIC: {customer.cnic}
                  </div>
                </div>

                <div className="text-body-sm space-y-1.5 pt-1" style={{ color: 'var(--theme-text-secondary)' }}>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-primary)' }} />
                    <span className="font-mono-tabular">{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-primary)' }} />
                    <span className="truncate">{customer.address}, {customer.city}</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t text-body-sm flex items-center justify-between" style={{ borderColor: 'var(--theme-surface-border)' }}>
                  <span className="text-text-muted font-medium">{activeAgrCount} Active Sales</span>
                  <span className="font-extrabold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                    Bal: {settings.currencySymbol} {totalBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2.5 border-t border-border">
                <button
                  onClick={() => onOpenNewAgreementForCustomer?.(customer)}
                  className="m3-btn-base m3-btn-tonal text-caption py-2 px-3 font-bold flex-1"
                  title="New Sale Agreement for this customer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Sale</span>
                </button>
                <button
                  onClick={() => handleDownloadPdf(customer)}
                  className="m3-btn-base m3-btn-outlined text-caption py-2 px-3 font-bold flex-1"
                  title="Export Payment Ledger PDF"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Ledger</span>
                </button>
                <button
                  onClick={() => setSelectedCustomer(customer)}
                  className="m3-btn-base m3-btn-filled text-caption py-2 px-3 font-bold flex-1"
                >
                  <span>Profile</span>
                </button>
                {/* EDIT & DELETE ONLY FOR ADMIN */}
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEditCustomer(customer)}
                      className="p-2 rounded-xl border border-border bg-surface-2 hover:bg-surface-3 text-primary transition-all cursor-pointer"
                      title="Edit Customer Profile (Admin Only)"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerToDelete(customer)}
                      className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-red-600 dark:text-red-400 transition-all cursor-pointer"
                      title="Delete Customer Profile (Admin Only)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > pageSize && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setPageSize((prev) => prev + 25)}
            className="m3-btn-base m3-btn-tonal text-body-sm py-2.5 px-5 inline-flex items-center gap-2 font-bold"
          >
            <span>Load More ({filtered.length - pageSize} remaining)</span>
          </button>
        </div>
      )}

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="m3-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 m3-animate-in">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <div>
                <h2 className="text-heading font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>
                  {selectedCustomer.fullName} ({selectedCustomer.customerCode})
                </h2>
                <p className="text-body-sm text-text-muted font-mono-tabular font-medium">CNIC: {selectedCustomer.cnic} | Phone: {selectedCustomer.phone}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1.5 text-text-muted hover:text-text rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-body-sm">
              <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                <h4 className="font-bold text-title font-heading" style={{ color: 'var(--theme-text-primary)' }}>Guarantor Profile 1</h4>
                <div>Name: <strong>{selectedCustomer.guarantor1.name}</strong> ({selectedCustomer.guarantor1.relation})</div>
                <div>CNIC: {selectedCustomer.guarantor1.cnic} | Phone: {selectedCustomer.guarantor1.phone}</div>
                <div>Address: {selectedCustomer.guarantor1.address}</div>
              </div>

              {selectedCustomer.guarantor2 && (
                <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                  <h4 className="font-bold text-title font-heading" style={{ color: 'var(--theme-text-primary)' }}>Guarantor Profile 2</h4>
                  <div>Name: <strong>{selectedCustomer.guarantor2.name}</strong> ({selectedCustomer.guarantor2.relation})</div>
                  <div>CNIC: {selectedCustomer.guarantor2.cnic} | Phone: {selectedCustomer.guarantor2.phone}</div>
                  <div>Address: {selectedCustomer.guarantor2.address}</div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: 'var(--theme-surface-border)' }}>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartEditCustomer(selectedCustomer)}
                    className="m3-btn-base m3-btn-tonal text-body-sm py-2 px-3.5 font-bold flex items-center gap-1.5"
                    title="Edit Customer Profile (Admin Only)"
                  >
                    <Edit className="w-4 h-4 text-primary" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerToDelete(selectedCustomer)}
                    className="m3-btn-base m3-btn-outlined border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-body-sm py-2 px-3.5 font-bold flex items-center gap-1.5"
                    title="Delete Customer Profile (Admin Only)"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => handleDownloadPdf(selectedCustomer)}
                  className="m3-btn-base m3-btn-outlined text-body-sm py-2.5 px-4 font-bold"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Ledger PDF</span>
                </button>
                <button onClick={() => setSelectedCustomer(null)} className="m3-btn-base m3-btn-filled text-body-sm py-2.5 px-5 font-bold">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateCustomerSubmit} className="m3-card max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 m3-animate-in">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <h2 className="text-title sm:text-heading font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>Register New Customer Profile</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1.5 text-text-muted hover:text-text rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {customerValidationError && (
              <div className="p-3.5 rounded-xl border text-caption font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900">
                {customerValidationError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-body-sm">
              <div>
                <label className="block font-bold mb-1 text-text">Full Name *</label>
                <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className="m3-input text-body" placeholder="e.g. Muhammad Kamran" />
              </div>
              <div>
                <label className="block font-bold mb-1 text-text">CNIC # *</label>
                <input type="text" required value={formCnic} onChange={(e) => setFormCnic(e.target.value)} className="m3-input text-body font-mono-tabular" placeholder="35202-0000000-0" />
              </div>
              <div>
                <label className="block font-bold mb-1 text-text">Phone # *</label>
                <input type="text" required value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="m3-input text-body font-mono-tabular" placeholder="0300-1234567" />
              </div>
              <div>
                <label className="block font-bold mb-1 text-text">City</label>
                <input type="text" value={formCity} onChange={(e) => setFormCity(e.target.value)} className="m3-input text-body" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1 text-text">Home Address</label>
                <input type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} className="m3-input text-body" placeholder="House #, Street, Colony..." />
              </div>
            </div>

            <div className="pt-2.5 border-t space-y-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <h4 className="font-bold text-caption uppercase tracking-wider font-heading text-primary">Guarantor 1 Details *</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-body-sm">
                <div>
                  <label className="block font-bold mb-1 text-text">Guarantor Name *</label>
                  <input type="text" required value={g1Name} onChange={(e) => setG1Name(e.target.value)} className="m3-input text-body" placeholder="e.g. Tariq Mahmood" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-text">Guarantor CNIC *</label>
                  <input type="text" required value={g1Cnic} onChange={(e) => setG1Cnic(e.target.value)} className="m3-input text-body font-mono-tabular" placeholder="35202-1111111-1" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <button type="button" onClick={() => setShowAddModal(false)} className="m3-btn-base m3-btn-outlined text-body-sm py-2.5 px-4 font-bold">Cancel</button>
              <button type="submit" className="m3-btn-base m3-btn-filled text-body-sm py-2.5 px-5 font-bold">Save Customer Profile</button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT CUSTOMER PROFILE MODAL (ADMIN ONLY) */}
      {isAdmin && editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveCustomerEdit} className="m3-card max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 m3-animate-in">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Admin Authority</span>
                <h2 className="text-title sm:text-heading font-bold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                  <Edit className="w-5 h-5 text-primary" />
                  Edit Customer: {editingCustomer.fullName} ({editingCustomer.customerCode})
                </h2>
              </div>
              <button type="button" onClick={() => setEditingCustomer(null)} className="p-1.5 text-text-muted hover:text-text rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editCustomerValidationError && (
              <div className="p-3.5 rounded-xl border text-caption font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900">
                {editCustomerValidationError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-body-sm">
              <div>
                <label className="block font-bold mb-1 text-text">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  className="m3-input text-body"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-text">CNIC # *</label>
                <input
                  type="text"
                  required
                  value={editCustCnic}
                  onChange={(e) => setEditCustCnic(e.target.value)}
                  className="m3-input text-body font-mono-tabular"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-text">Phone # *</label>
                <input
                  type="text"
                  required
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value)}
                  className="m3-input text-body font-mono-tabular"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-text">Alt Phone #</label>
                <input
                  type="text"
                  value={editCustAltPhone}
                  onChange={(e) => setEditCustAltPhone(e.target.value)}
                  className="m3-input text-body font-mono-tabular"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-text">City</label>
                <input
                  type="text"
                  value={editCustCity}
                  onChange={(e) => setEditCustCity(e.target.value)}
                  className="m3-input text-body"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-text">Rating Status</label>
                <select
                  value={editCustRating}
                  onChange={(e) => setEditCustRating(e.target.value as CustomerRating)}
                  className="m3-input text-body font-bold"
                >
                  <option value="good">Good (Normal)</option>
                  <option value="watch">Watch List</option>
                  <option value="defaulter">Defaulter</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1 text-text">Home Address</label>
                <input
                  type="text"
                  value={editCustAddress}
                  onChange={(e) => setEditCustAddress(e.target.value)}
                  className="m3-input text-body"
                />
              </div>
            </div>

            <div className="pt-2.5 border-t space-y-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <h4 className="font-bold text-caption uppercase tracking-wider font-heading text-primary">Guarantor 1 Details *</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-body-sm">
                <div>
                  <label className="block font-bold mb-1 text-text">Guarantor Name *</label>
                  <input
                    type="text"
                    required
                    value={editG1Name}
                    onChange={(e) => setEditG1Name(e.target.value)}
                    className="m3-input text-body"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-text">Guarantor CNIC *</label>
                  <input
                    type="text"
                    required
                    value={editG1Cnic}
                    onChange={(e) => setEditG1Cnic(e.target.value)}
                    className="m3-input text-body font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-text">Guarantor Phone</label>
                  <input
                    type="text"
                    value={editG1Phone}
                    onChange={(e) => setEditG1Phone(e.target.value)}
                    className="m3-input text-body font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-text">Relation</label>
                  <input
                    type="text"
                    value={editG1Relation}
                    onChange={(e) => setEditG1Relation(e.target.value)}
                    className="m3-input text-body"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t space-y-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <h4 className="font-bold text-caption uppercase tracking-wider font-heading text-text-muted">Guarantor 2 Details (Optional)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-body-sm">
                <div>
                  <label className="block font-bold mb-1 text-text">Guarantor 2 Name</label>
                  <input
                    type="text"
                    value={editG2Name}
                    onChange={(e) => setEditG2Name(e.target.value)}
                    className="m3-input text-body"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-text">Guarantor 2 CNIC</label>
                  <input
                    type="text"
                    value={editG2Cnic}
                    onChange={(e) => setEditG2Cnic(e.target.value)}
                    className="m3-input text-body font-mono-tabular"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="m3-btn-base m3-btn-outlined text-body-sm py-2.5 px-4 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="m3-btn-base m3-btn-filled text-body-sm py-2.5 px-5 font-bold"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CUSTOMER CONFIRMATION DIALOG (ADMIN ONLY) */}
      {isAdmin && customerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="m3-card max-w-md w-full p-6 space-y-4 m3-animate-in border border-rose-500/30">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-title font-bold font-heading text-text">Delete Customer Profile</h3>
                <p className="text-caption text-text-muted">Admin Authority Required</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-2 border border-border text-body-sm space-y-1.5">
              <div className="font-bold text-text">{customerToDelete.fullName} ({customerToDelete.customerCode})</div>
              <div className="text-caption text-text-muted font-mono-tabular">CNIC: {customerToDelete.cnic} | Phone: {customerToDelete.phone}</div>
              <div className="text-caption text-text-muted">{customerToDelete.address}, {customerToDelete.city}</div>
            </div>

            {(() => {
              const activeCount = agreements.filter(
                (a) => a.customerId === customerToDelete.id && a.status === 'active'
              ).length;

              return (
                <div>
                  {activeCount > 0 ? (
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-caption font-bold">
                      ⚠️ Caution: This customer has {activeCount} active sales agreement(s). Deleting will remove the profile record.
                    </div>
                  ) : (
                    <p className="text-caption text-text-muted leading-relaxed">
                      Are you sure you want to permanently delete this customer profile? This action cannot be reversed.
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="m3-btn-base m3-btn-outlined text-body-sm py-2.5 px-4 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCustomer}
                className="m3-btn-base bg-red-600 hover:bg-red-700 text-white text-body-sm py-2.5 px-5 font-bold rounded-full transition-all"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
