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
import { Customer, Agreement, Payment, ShopSettings, CustomerRating } from '../types';
import { generateCustomerPaymentLedgerPDF } from '../utils/pdfGenerator';
import { formatDateDDMMYYYY } from '../utils/formatters';

interface CustomersViewProps {
  customers: Customer[];
  agreements: Agreement[];
  payments?: Payment[];
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
  settings = { currencySymbol: 'Rs.', shopName: 'Pakistan Traders Corp', proprietorName: '', phone: '', address: '', city: 'Lahore', regNumber: '', pinCode: '1234', isLocked: false },
  searchQuery,
  setSearchQuery,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onOpenNewAgreement,
  onOpenNewAgreementForCustomer,
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [ratingFilter, setRatingFilter] = useState<'all' | CustomerRating>('all');
  const [showAddModal, setShowAddModal] = useState(false);

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
          <h1 className="text-xl font-extrabold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
            <Users className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
            Customer Directory & Ledgers
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Total {customers.length} verified customer profiles with National ID, Phone & Guarantor records.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="m3-btn-base m3-btn-filled text-xs py-2.5 px-4"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* In-View Search & Filter Bar */}
      <div className="m3-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by Name, Phone, CNIC, City..."
            value={searchQuery}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            className="m3-input pl-9 pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery?.('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto justify-between sm:justify-end">
          <span>
            Showing <strong style={{ color: 'var(--theme-text-primary)' }}>{filtered.length}</strong> of {customers.length} customers
          </span>
        </div>
      </div>

      {/* Rating Filters */}
      <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto" style={{ borderColor: 'var(--theme-surface-border)' }}>
        {(['all', 'good', 'watch', 'defaulter'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRatingFilter(r)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-full capitalize transition-all border whitespace-nowrap"
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

      {/* Grid of Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer) => {
          const custAgreements = agreements.filter((a) => a.customerId === customer.id);
          const activeAgrCount = custAgreements.filter((a) => a.status === 'active' || a.status === 'defaulter').length;
          const totalBalance = custAgreements.reduce((sum, a) => sum + a.remainingBalance, 0);

          return (
            <div
              key={customer.id}
              className="m3-card p-4 flex flex-col justify-between space-y-4 hover:border-current transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono-tabular" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                    {customer.customerCode}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize border font-mono-tabular" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                    {customer.rating}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>
                    {customer.fullName}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono-tabular mt-0.5">
                    CNIC: {customer.cnic}
                  </div>
                </div>

                <div className="text-xs space-y-1 pt-1" style={{ color: 'var(--theme-text-secondary)' }}>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                    <span className="truncate">{customer.address}, {customer.city}</span>
                  </div>
                </div>

                <div className="pt-2 border-t text-xs flex items-center justify-between" style={{ borderColor: 'var(--theme-surface-border)' }}>
                  <span className="text-slate-400">{activeAgrCount} Active Sales</span>
                  <span className="font-extrabold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                    Bal: {settings.currencySymbol} {totalBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => onOpenNewAgreementForCustomer?.(customer)}
                  className="m3-btn-base m3-btn-tonal text-xs py-1.5 px-2 text-[11px]"
                  title="New Sale Agreement for this customer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Sale</span>
                </button>
                <button
                  onClick={() => handleDownloadPdf(customer)}
                  className="m3-btn-base m3-btn-outlined text-xs py-1.5 px-2 text-[11px]"
                  title="Export Payment Ledger PDF"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Ledger</span>
                </button>
                <button
                  onClick={() => setSelectedCustomer(customer)}
                  className="m3-btn-base m3-btn-filled text-xs py-1.5 px-2 text-[11px]"
                >
                  <span>Profile</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="m3-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 m3-animate-in">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <div>
                <h2 className="text-lg font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>
                  {selectedCustomer.fullName} ({selectedCustomer.customerCode})
                </h2>
                <p className="text-xs text-slate-400 font-mono-tabular">CNIC: {selectedCustomer.cnic} | Phone: {selectedCustomer.phone}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                <h4 className="font-bold text-sm font-heading" style={{ color: 'var(--theme-text-primary)' }}>Guarantor Profile 1</h4>
                <div>Name: <strong>{selectedCustomer.guarantor1.name}</strong> ({selectedCustomer.guarantor1.relation})</div>
                <div>CNIC: {selectedCustomer.guarantor1.cnic} | Phone: {selectedCustomer.guarantor1.phone}</div>
                <div>Address: {selectedCustomer.guarantor1.address}</div>
              </div>

              {selectedCustomer.guarantor2 && (
                <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                  <h4 className="font-bold text-sm font-heading" style={{ color: 'var(--theme-text-primary)' }}>Guarantor Profile 2</h4>
                  <div>Name: <strong>{selectedCustomer.guarantor2.name}</strong> ({selectedCustomer.guarantor2.relation})</div>
                  <div>CNIC: {selectedCustomer.guarantor2.cnic} | Phone: {selectedCustomer.guarantor2.phone}</div>
                  <div>Address: {selectedCustomer.guarantor2.address}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <button
                onClick={() => handleDownloadPdf(selectedCustomer)}
                className="m3-btn-base m3-btn-outlined"
              >
                <Download className="w-4 h-4" />
                <span>Download Ledger PDF</span>
              </button>
              <button onClick={() => setSelectedCustomer(null)} className="m3-btn-base m3-btn-filled">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateCustomerSubmit} className="m3-card max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 m3-animate-in">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <h2 className="text-lg font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>Register New Customer Profile</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {customerValidationError && (
              <div className="p-3 rounded-xl border text-xs text-rose-500 bg-rose-50 border-rose-200">
                {customerValidationError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Full Name *</label>
                <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className="m3-input" placeholder="e.g. Muhammad Kamran" />
              </div>
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>CNIC # *</label>
                <input type="text" required value={formCnic} onChange={(e) => setFormCnic(e.target.value)} className="m3-input" placeholder="35202-0000000-0" />
              </div>
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Phone # *</label>
                <input type="text" required value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="m3-input" placeholder="0300-1234567" />
              </div>
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>City</label>
                <input type="text" value={formCity} onChange={(e) => setFormCity(e.target.value)} className="m3-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Home Address</label>
                <input type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} className="m3-input" placeholder="House #, Street, Colony..." />
              </div>
            </div>

            <div className="pt-2 border-t space-y-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <h4 className="font-bold text-xs uppercase font-heading" style={{ color: 'var(--theme-primary)' }}>Guarantor 1 Details *</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Guarantor Name *</label>
                  <input type="text" required value={g1Name} onChange={(e) => setG1Name(e.target.value)} className="m3-input" placeholder="e.g. Tariq Mahmood" />
                </div>
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Guarantor CNIC *</label>
                  <input type="text" required value={g1Cnic} onChange={(e) => setG1Cnic(e.target.value)} className="m3-input" placeholder="35202-1111111-1" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <button type="button" onClick={() => setShowAddModal(false)} className="m3-btn-base m3-btn-outlined">Cancel</button>
              <button type="submit" className="m3-btn-base m3-btn-filled">Save Customer Profile</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
