import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Filter,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Download,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Package,
  ShieldAlert,
  ArrowRight,
  DollarSign,
  X,
  Edit,
  Trash2,
  Shield,
} from 'lucide-react';
import { Agreement, Customer, StockItem, ShopSettings, User } from '../types';
import { generateAgreementContractPDF } from '../utils/pdfGenerator';
import { formatDateDDMMYYYY } from '../utils/formatters';
import { ExpandableSearch } from './ExpandableSearch';

interface AgreementsViewProps {
  agreements: Agreement[];
  customers: Customer[];
  stock: StockItem[];
  currentUser?: User;
  settings: ShopSettings;
  searchQuery: string;
  setSearchQuery?: (query: string) => void;
  onOpenNewAgreement: () => void;
  onOpenCollectPayment: (agreementId: string, installmentNum?: number) => void;
  onUpdateAgreement?: (id: string, updates: Partial<Agreement>) => void;
  onDeleteAgreement?: (id: string) => void;
}

export const AgreementsView: React.FC<AgreementsViewProps> = ({
  agreements,
  customers,
  stock,
  currentUser,
  settings,
  searchQuery,
  setSearchQuery,
  onOpenNewAgreement,
  onOpenCollectPayment,
  onUpdateAgreement,
  onDeleteAgreement,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'defaulter'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(25);

  // Edit Agreement State (Admin Only)
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null);
  const [editDeliveryDate, setEditDeliveryDate] = useState('');
  const [editDueDay, setEditDueDay] = useState<number>(5);
  const [editStatus, setEditStatus] = useState<'active' | 'completed' | 'cancelled' | 'defaulter'>('active');
  const [editNotes, setEditNotes] = useState('');

  // Delete Agreement Confirmation State (Admin Only)
  const [agreementToDelete, setAgreementToDelete] = useState<Agreement | null>(null);

  const handleStartEditAgreement = (agr: Agreement) => {
    setEditingAgreement(agr);
    setEditDeliveryDate(agr.deliveryDate || agr.startDate || '');
    setEditDueDay(agr.dueDayOfMonth || 5);
    setEditStatus(agr.status);
    setEditNotes(agr.notes || '');
  };

  const handleSaveEditAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgreement || !onUpdateAgreement) return;

    onUpdateAgreement(editingAgreement.id, {
      deliveryDate: editDeliveryDate,
      dueDayOfMonth: editDueDay,
      status: editStatus,
      notes: editNotes.trim(),
    });

    setEditingAgreement(null);
  };

  const handleConfirmDeleteAgreement = () => {
    if (!agreementToDelete || !onDeleteAgreement) return;
    onDeleteAgreement(agreementToDelete.id);
    setAgreementToDelete(null);
  };

  // Filter logic
  const filtered = agreements.filter((a) => {
    const cust = customers.find((c) => c.id === a.customerId);
    const matchesSearch =
      a.agreementNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.itemSerial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cust?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cust?.cnic || '').includes(searchQuery) ||
      (cust?.phone || '').includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="m3-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-heading font-bold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
            <FileText className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
            Dispatches & Sale Agreements
          </h1>
          <p className="text-caption font-medium text-text-muted mt-1">
            Total {agreements.length} customer finance contracts & delivery dispatches • Advance collected & remaining balance.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <ExpandableSearch
            value={searchQuery}
            onChange={(val) => setSearchQuery?.(val)}
            placeholder="Search agreements"
            resultCount={{ current: filtered.length, total: agreements.length }}
            recentKey="agreements"
            shortcut="/"
            chipLabelPrefix="Agreement"
          />

          <button
            onClick={onOpenNewAgreement}
            className="m3-btn-base m3-btn-filled text-body-sm py-2.5 px-4 font-bold shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">New Sale Agreement</span>
            <span className="sm:hidden">New Agreement</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b pb-2.5 overflow-x-auto no-scrollbar" style={{ borderColor: 'var(--theme-surface-border)' }}>
        {(['all', 'active', 'completed', 'defaulter'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className="px-4 py-2 text-caption font-bold rounded-full capitalize transition-all whitespace-nowrap border"
            style={{
              backgroundColor: statusFilter === st ? 'var(--theme-tonal-bg)' : 'transparent',
              color: statusFilter === st ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
              borderColor: statusFilter === st ? 'var(--theme-primary)' : 'transparent',
            }}
          >
            {st === 'all' ? 'All Agreements' : st} ({agreements.filter((a) => st === 'all' || a.status === st).length})
          </button>
        ))}
      </div>

      {/* Agreements List */}
      {filtered.length === 0 ? (
        <div className="m3-card p-12 text-center text-text-muted">
          <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--theme-primary)' }} />
          <h3 className="text-title font-bold" style={{ color: 'var(--theme-text-primary)' }}>No Agreements Found</h3>
          <p className="text-caption text-text-muted mt-1 max-w-sm mx-auto font-medium">
            {searchQuery
              ? `No match. Try name, CNIC, phone or serial.`
              : 'Try adjusting your filter criteria or create a new instalment booking.'}
          </p>
          {searchQuery && (
            <div className="pt-2">
              <button
                onClick={() => setSearchQuery?.('')}
                className="m3-btn-base m3-btn-tonal text-caption py-2 px-4 font-bold"
              >
                Clear Search Query
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.slice(0, pageSize).map((agreement) => {
            const customer = customers.find((c) => c.id === agreement.customerId);
            const isExpanded = expandedId === agreement.id;

            const totalPaid = agreement.schedule.reduce((sum, s) => sum + s.paidAmount, 0);
            const progressPercent = Math.min(100, Math.round((totalPaid / (agreement.totalInstalmentPrice - agreement.downPayment)) * 100));

            return (
              <div
                key={agreement.id}
                className="m3-card overflow-hidden transition-all"
              >
                {/* Main Card Summary */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Left Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-title font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                        {agreement.agreementNumber}
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-caption font-bold uppercase tracking-wider border font-mono-tabular"
                        style={{
                          backgroundColor: 'var(--theme-tonal-bg)',
                          color: 'var(--theme-primary)',
                          borderColor: 'var(--theme-tonal-border)',
                        }}
                      >
                        {agreement.status}
                      </span>
                      <span className="text-body-sm text-text-muted font-mono-tabular font-medium">· Delivered: {formatDateDDMMYYYY(agreement.deliveryDate || agreement.startDate)}</span>
                    </div>

                    <h3 className="text-title font-bold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                      <UserIcon className="w-5 h-5 text-text-muted" />
                      {customer?.fullName || 'Customer'}
                      <span className="text-body-sm text-text-muted font-mono-tabular font-medium">({customer?.cnic})</span>
                    </h3>

                    <p className="text-body-sm flex items-center gap-2 pt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                      <Package className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                      <span className="font-semibold text-text">{agreement.itemName}</span>
                      <span className="text-text-muted font-mono-tabular">[{agreement.itemSerial}]</span>
                    </p>
                  </div>

                  {/* Financials & Progress */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0" style={{ borderColor: 'var(--theme-surface-border)' }}>
                    <div className="text-left sm:text-right space-y-0.5">
                      <div className="text-caption text-text-muted uppercase font-bold tracking-wider">Remaining Balance</div>
                      <div className="text-display font-extrabold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                        {settings.currencySymbol} {agreement.remainingBalance.toLocaleString()}
                      </div>
                      <div className="text-caption text-text-muted font-medium">
                        Monthly: <strong className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{settings.currencySymbol} {agreement.monthlyInstalment.toLocaleString()}</strong> x {agreement.monthDuration}m
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          if (customer) {
                            generateAgreementContractPDF(agreement, customer, settings);
                          } else {
                            alert('Customer details not found for this agreement.');
                          }
                        }}
                        className="m3-btn-base m3-btn-outlined text-body-sm py-2.5 px-3.5 font-bold"
                        title="Download Contract PDF"
                      >
                        <Download className="w-4 h-4" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => onOpenCollectPayment(agreement.id)}
                        className="m3-btn-base m3-btn-filled text-body-sm py-2.5 px-4 font-bold"
                      >
                        <span>Collect</span>
                      </button>

                      {/* EDIT & DELETE ONLY FOR ADMIN */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditAgreement(agreement)}
                            className="p-2.5 rounded-full border border-border bg-surface-2 hover:bg-surface-3 text-primary transition-all cursor-pointer"
                            title="Edit Agreement (Admin Only)"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAgreementToDelete(agreement)}
                            className="p-2.5 rounded-full border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-red-600 dark:text-red-400 transition-all cursor-pointer"
                            title="Delete Agreement (Admin Only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : agreement.id)}
                        className="p-2.5 rounded-full border text-text-muted hover:text-text"
                        style={{ borderColor: 'var(--theme-surface-border)', backgroundColor: 'var(--theme-surface-input)' }}
                        title="Toggle Schedule"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Progress Bar */}
                <div className="w-full bg-surface-2 h-2 overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${progressPercent}%`, backgroundColor: 'var(--theme-primary)' }}
                  />
                </div>

                {/* Expanded Instalment Schedule Table */}
                {isExpanded && (
                  <div className="p-4 border-t space-y-3" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                    <div className="flex items-center justify-between text-body-sm">
                      <h4 className="font-bold flex items-center gap-2 font-heading" style={{ color: 'var(--theme-text-primary)' }}>
                        <Calendar className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                        Instalment Repayment Schedule ({agreement.monthDuration} Months)
                      </h4>
                      <span className="text-caption font-bold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                        {progressPercent}% Paid Total
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-body-sm">
                        <thead>
                          <tr className="border-b text-caption font-bold text-text-muted uppercase tracking-wider" style={{ borderColor: 'var(--theme-surface-border)' }}>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Due Date</th>
                            <th className="py-2.5 px-3 text-right">Amount</th>
                            <th className="py-2.5 px-3 text-right">Paid</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--theme-surface-border)' }}>
                          {agreement.schedule.map((slot) => {
                            const isPaid = slot.status === 'paid';
                            const isOverdue = slot.status === 'overdue';

                            return (
                              <tr key={slot.installmentNumber} className="hover:bg-primary/5 transition-colors">
                                <td className="py-3 px-3 font-bold font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
                                  Instalment #{slot.installmentNumber}
                                </td>
                                <td className="py-3 px-3 font-mono-tabular text-text-muted font-medium">
                                  {formatDateDDMMYYYY(slot.dueDate)}
                                </td>
                                <td className="py-3 px-3 text-right font-bold font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
                                  {settings.currencySymbol} {slot.amount.toLocaleString()}
                                </td>
                                <td className="py-3 px-3 text-right font-bold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                                  {settings.currencySymbol} {slot.paidAmount.toLocaleString()}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span
                                    className="px-2.5 py-0.5 rounded-full text-caption font-bold uppercase tracking-wider border font-mono-tabular"
                                    style={{
                                      backgroundColor: 'var(--theme-tonal-bg)',
                                      color: 'var(--theme-primary)',
                                      borderColor: 'var(--theme-tonal-border)',
                                    }}
                                  >
                                    {slot.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  {!isPaid && (
                                    <button
                                      onClick={() => onOpenCollectPayment(agreement.id, slot.installmentNumber)}
                                      className="m3-btn-base m3-btn-filled text-caption py-1.5 px-3 font-bold"
                                    >
                                      Collect #{slot.installmentNumber}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length > pageSize && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={() => setPageSize((prev) => prev + 25)}
                className="m3-btn-base m3-btn-tonal text-body-sm py-2.5 px-5 font-bold inline-flex items-center gap-2"
              >
                <span>Load More ({filtered.length - pageSize} remaining)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* EDIT AGREEMENT MODAL (ADMIN ONLY) */}
      {isAdmin && editingAgreement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditAgreement}
            className="m3-card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 m3-animate-in"
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Admin Authority</span>
                <h2 className="text-title sm:text-heading font-bold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                  <Edit className="w-5 h-5 text-primary" />
                  Edit Contract: {editingAgreement.agreementNumber}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingAgreement(null)}
                className="p-1.5 text-text-muted hover:text-text rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-surface-2 border border-border text-body-sm space-y-1">
              <div>Item: <strong className="text-text">{editingAgreement.itemName}</strong> <span className="text-text-muted font-mono-tabular">[{editingAgreement.itemSerial}]</span></div>
              <div>Customer Code: <strong className="text-text font-mono-tabular">{editingAgreement.customerCode}</strong></div>
              <div>Remaining Balance: <strong className="text-primary font-mono-tabular">{settings.currencySymbol} {editingAgreement.remainingBalance.toLocaleString()}</strong></div>
            </div>

            <div className="space-y-3.5 text-body-sm">
              <div>
                <label className="block font-bold mb-1 text-text">Contract Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="m3-input text-body font-bold"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed (Paid Off)</option>
                  <option value="defaulter">Defaulter (Overdue Non-Payment)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-text">Delivery / Start Date</label>
                <input
                  type="date"
                  value={editDeliveryDate}
                  onChange={(e) => setEditDeliveryDate(e.target.value)}
                  className="m3-input text-body font-mono-tabular"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-text">Monthly Due Day of Month (1 - 30)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={editDueDay}
                  onChange={(e) => setEditDueDay(Number(e.target.value))}
                  className="m3-input text-body font-mono-tabular font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-text">Contract Remarks & Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="m3-input text-body"
                  placeholder="Additional agreement notes or guarantor remarks..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <button
                type="button"
                onClick={() => setEditingAgreement(null)}
                className="m3-btn-base m3-btn-outlined text-body-sm py-2.5 px-4 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="m3-btn-base m3-btn-filled text-body-sm py-2.5 px-5 font-bold"
              >
                Save Agreement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE AGREEMENT CONFIRMATION DIALOG (ADMIN ONLY) */}
      {isAdmin && agreementToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="m3-card max-w-md w-full p-6 space-y-4 m3-animate-in border border-rose-500/30">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-title font-bold font-heading text-text">Delete Sale Agreement</h3>
                <p className="text-caption text-text-muted">Admin Authority Required</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-2 border border-border text-body-sm space-y-1.5">
              <div className="font-bold text-text font-mono-tabular">{agreementToDelete.agreementNumber}</div>
              <div className="text-caption text-text-muted">Item: {agreementToDelete.itemName} [{agreementToDelete.itemSerial}]</div>
              <div className="text-caption text-text-muted">Total Contract Price: {settings.currencySymbol} {agreementToDelete.totalInstalmentPrice.toLocaleString()}</div>
              <div className="text-caption font-bold text-primary font-mono-tabular">Remaining: {settings.currencySymbol} {agreementToDelete.remainingBalance.toLocaleString()}</div>
            </div>

            <p className="text-caption text-text-muted leading-relaxed">
              Are you sure you want to permanently delete this agreement? The assigned item unit will automatically be returned to available stock inventory.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setAgreementToDelete(null)}
                className="m3-btn-base m3-btn-outlined text-body-sm py-2.5 px-4 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAgreement}
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
