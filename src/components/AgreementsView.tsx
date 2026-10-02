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
  User,
  Package,
  ShieldAlert,
  ArrowRight,
  DollarSign,
  X,
} from 'lucide-react';
import { Agreement, Customer, StockItem, ShopSettings } from '../types';
import { generateAgreementContractPDF } from '../utils/pdfGenerator';
import { formatDateDDMMYYYY } from '../utils/formatters';
import { ExpandableSearch } from './ExpandableSearch';

interface AgreementsViewProps {
  agreements: Agreement[];
  customers: Customer[];
  stock: StockItem[];
  settings: ShopSettings;
  searchQuery: string;
  setSearchQuery?: (query: string) => void;
  onOpenNewAgreement: () => void;
  onOpenCollectPayment: (agreementId: string, installmentNum?: number) => void;
}

export const AgreementsView: React.FC<AgreementsViewProps> = ({
  agreements,
  customers,
  stock,
  settings,
  searchQuery,
  setSearchQuery,
  onOpenNewAgreement,
  onOpenCollectPayment,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'defaulter'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(25);

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
                      <User className="w-5 h-5 text-text-muted" />
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

    </div>
  );
};
