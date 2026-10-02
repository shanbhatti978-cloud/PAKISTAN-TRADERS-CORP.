import React, { useState } from 'react';
import {
  BadgeDollarSign,
  Search,
  Filter,
  Send,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Phone,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Receipt,
  Lock,
  History,
  Shield,
} from 'lucide-react';
import { Agreement, Customer, Payment, ShopSettings, User } from '../types';
import { formatDateDDMMYYYY } from '../utils/formatters';
import { PermissionManager } from '../utils/permissionManager';

interface RecoveryViewProps {
  agreements: Agreement[];
  customers: Customer[];
  payments?: Payment[];
  currentUser?: User;
  settings: ShopSettings;
  searchQuery: string;
  setSearchQuery?: (query: string) => void;
  onOpenCollectPayment: (agreementId: string, installmentNum?: number) => void;
  onOpenReversePayment?: (payment: Payment) => void;
  onAttemptRestrictedAction?: (msg?: string) => void;
  onSendWhatsApp: (customer: Customer, agreement: Agreement, amount: number, dueDate: string) => void;
}

export const RecoveryView: React.FC<RecoveryViewProps> = ({
  agreements,
  customers,
  payments = [],
  currentUser,
  settings,
  searchQuery,
  setSearchQuery,
  onOpenCollectPayment,
  onOpenReversePayment,
  onAttemptRestrictedAction,
  onSendWhatsApp,
}) => {
  const [activeTab, setActiveTab] = useState<'pending_schedule' | 'collected_history'>('pending_schedule');
  const [filterMode, setFilterMode] = useState<'overdue' | 'due_today' | 'upcoming' | 'all'>('overdue');
  const [sortOrder, setSortOrder] = useState<'soonest' | 'latest'>('soonest');

  const todayStr = '2026-09-28';
  const todayDate = new Date(todayStr);

  const canReversePayments = currentUser ? PermissionManager.can(currentUser.role, 'REVERSE_PAYMENT') : false;

  // Compile flat recovery schedule slots across active agreements
  const recoverySlots: {
    agreement: Agreement;
    customer?: Customer;
    slot: any;
    daysLate: number;
    isDueToday: boolean;
  }[] = [];

  agreements.forEach((agr) => {
    if (agr.status === 'completed' || agr.status === 'cancelled') return;
    const cust = customers.find((c) => c.id === agr.customerId);

    agr.schedule.forEach((slot) => {
      if (slot.status === 'paid') return; // skip paid slots

      const due = new Date(slot.dueDate);
      const isDueToday = slot.dueDate === todayStr;
      const daysLate = Math.floor((todayDate.getTime() - due.getTime()) / (1000 * 3600 * 24));

      recoverySlots.push({
        agreement: agr,
        customer: cust,
        slot,
        daysLate: daysLate > 0 ? daysLate : 0,
        isDueToday,
      });
    });
  });

  // Filter pending slots
  const filteredSlots = recoverySlots.filter((item) => {
    const cust = item.customer;
    const matchesSearch =
      (cust?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cust?.phone || '').includes(searchQuery) ||
      (cust?.cnic || '').includes(searchQuery) ||
      item.agreement.agreementNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.agreement.itemName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'overdue') return item.daysLate > 0;
    if (filterMode === 'due_today') return item.isDueToday;
    if (filterMode === 'upcoming') return item.daysLate === 0 && !item.isDueToday;
    return true; // all
  });

  // Sort slots by deadline
  const sortedSlots = [...filteredSlots].sort((a, b) => {
    const timeA = new Date(a.slot.dueDate).getTime();
    const timeB = new Date(b.slot.dueDate).getTime();
    return sortOrder === 'soonest' ? timeA - timeB : timeB - timeA;
  });

  // Filter collected payments history
  const filteredPayments = payments.filter((p) => {
    const custName = (p.customerName || '').toLowerCase();
    const receiptNum = (p.receiptNumber || '').toLowerCase();
    const search = searchQuery.toLowerCase();
    return custName.includes(search) || receiptNum.includes(search) || p.date.includes(search);
  });

  const totalFilteredAmount = sortedSlots.reduce(
    (sum, item) => sum + (item.slot.amount - item.slot.paidAmount),
    0
  );

  const totalRecoveredAmount = payments
    .filter((p) => !p.isReversed)
    .reduce((sum, p) => sum + p.amountPaid, 0);

  const handleAttemptReverse = (payment: Payment) => {
    if (canReversePayments) {
      onOpenReversePayment?.(payment);
    } else {
      onAttemptRestrictedAction?.("You don't have permission to change or reverse recovered payments. Admin authority required.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Recovery Hub Header */}
      <div className="m3-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold font-heading flex items-center gap-2 text-text">
            <BadgeDollarSign className="w-5 h-5 text-primary" />
            Installment Recovery & Payment Control Hub
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Collect installments, monitor overdue schedules, and manage recovered payment transactions. (Modifications restricted to ADMIN).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl border border-border bg-surface-input text-right">
            <div className="text-[10px] font-semibold text-text-subtle uppercase">Total Recovered</div>
            <div className="text-lg font-extrabold font-mono-tabular text-emerald-500">
              {settings.currencySymbol} {totalRecoveredAmount.toLocaleString()}
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl border border-border bg-surface-input text-right">
            <div className="text-[10px] font-semibold text-text-subtle uppercase">Pending Due</div>
            <div className="text-lg font-extrabold font-mono-tabular text-primary">
              {settings.currencySymbol} {totalFilteredAmount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Bar: Pending Schedule vs Collected Payments */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab('pending_schedule')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
            activeTab === 'pending_schedule'
              ? 'bg-primary text-on-primary border-primary shadow-md'
              : 'bg-transparent text-text-muted border-transparent hover:text-text hover:bg-surface-2'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Recovery Schedule ({recoverySlots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('collected_history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
            activeTab === 'collected_history'
              ? 'bg-primary text-on-primary border-primary shadow-md'
              : 'bg-transparent text-text-muted border-transparent hover:text-text hover:bg-surface-2'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Collected Recoveries Ledger ({payments.length})</span>
        </button>
      </div>

      {/* In-View Search & Filter Bar */}
      <div className="m3-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
          <input
            type="text"
            placeholder={activeTab === 'pending_schedule' ? "Search overdue by Customer, Phone, CNIC..." : "Search collections by Customer, Receipt #..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            className="m3-input pl-9 pr-8 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery?.('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-subtle hover:text-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {activeTab === 'pending_schedule' ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-surface-input">
              <span className="text-[10px] uppercase font-semibold text-text-subtle px-1.5 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                <span>Sort:</span>
              </span>
              <button
                type="button"
                onClick={() => setSortOrder('soonest')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all border ${
                  sortOrder === 'soonest' ? 'bg-primary text-on-primary border-primary' : 'text-text-muted border-transparent hover:text-text'
                }`}
              >
                <ArrowUp className="w-3 h-3" />
                <span>Soonest</span>
              </button>

              <button
                type="button"
                onClick={() => setSortOrder('latest')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all border ${
                  sortOrder === 'latest' ? 'bg-primary text-on-primary border-primary' : 'text-text-muted border-transparent hover:text-text'
                }`}
              >
                <ArrowDown className="w-3 h-3" />
                <span>Latest</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-text-muted flex items-center gap-2">
            <Shield className="w-4 h-4 text-danger" />
            <span>Only <strong>ADMIN</strong> can alter or reverse recovered payments</span>
          </div>
        )}
      </div>

      {/* TAB 1: PENDING RECOVERY SCHEDULE */}
      {activeTab === 'pending_schedule' && (
        <div className="space-y-4">
          {/* Filter Chips */}
          <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
            <button
              onClick={() => setFilterMode('overdue')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all border flex items-center gap-1.5 whitespace-nowrap ${
                filterMode === 'overdue' ? 'bg-danger-container text-on-danger-container border-border font-bold' : 'text-text-muted border-transparent hover:text-text'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Overdue Only ({recoverySlots.filter((s) => s.daysLate > 0).length})</span>
            </button>

            <button
              onClick={() => setFilterMode('due_today')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all border flex items-center gap-1.5 whitespace-nowrap ${
                filterMode === 'due_today' ? 'bg-warning-container text-on-warning-container border-border font-bold' : 'text-text-muted border-transparent hover:text-text'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Due Today ({recoverySlots.filter((s) => s.isDueToday).length})</span>
            </button>

            <button
              onClick={() => setFilterMode('upcoming')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all border flex items-center gap-1.5 whitespace-nowrap ${
                filterMode === 'upcoming' ? 'bg-primary-container text-on-primary-container border-border font-bold' : 'text-text-muted border-transparent hover:text-text'
              }`}
            >
              <span>Upcoming Schedule</span>
            </button>

            <button
              onClick={() => setFilterMode('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all border flex items-center gap-1.5 whitespace-nowrap ${
                filterMode === 'all' ? 'bg-surface-2 text-text border-border font-bold' : 'text-text-muted border-transparent hover:text-text'
              }`}
            >
              <span>All Unpaid ({recoverySlots.length})</span>
            </button>
          </div>

          {/* Table */}
          {sortedSlots.length === 0 ? (
            <div className="m3-card p-12 text-center text-text-muted">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-success" />
              <h3 className="text-base font-bold text-text">No Recovery Follow-Ups Found</h3>
              <p className="text-xs text-text-subtle mt-1 max-w-sm mx-auto">
                No pending installment due dates match your current filter mode.
              </p>
            </div>
          ) : (
            <div className="m3-card p-4 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold text-text-subtle uppercase tracking-wider">
                      <th className="py-2.5 px-3">Customer Profile</th>
                      <th className="py-2.5 px-3">Item / Agreement #</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Amount Due</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedSlots.map(({ agreement, customer, slot, daysLate, isDueToday }, idx) => {
                      const dueAmt = slot.amount - slot.paidAmount;

                      return (
                        <tr key={`${agreement.id}-${slot.installmentNumber}-${idx}`} className="hover:bg-surface-2/50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-sm text-text">{customer?.fullName || 'Customer'}</div>
                            <div className="text-[11px] text-text-subtle flex items-center gap-1.5 mt-0.5 font-mono-tabular">
                              <Phone className="w-3 h-3 text-text-subtle" />
                              <span>{customer?.phone || 'No phone'}</span>
                              <span>·</span>
                              <span>CNIC: {customer?.cnic || 'N/A'}</span>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-medium truncate max-w-[180px] text-text">{agreement.itemName}</div>
                            <div className="text-[10px] text-text-subtle font-mono-tabular">
                              AGR: {agreement.agreementNumber} | Ins #{slot.installmentNumber}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-mono-tabular font-semibold text-xs text-text">
                              {formatDateDDMMYYYY(slot.dueDate)}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-extrabold font-mono-tabular text-sm text-primary">
                            {settings.currencySymbol} {dueAmt.toLocaleString()}
                          </td>

                          <td className="py-3 px-3 text-center">
                            {daysLate > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono-tabular bg-danger-container text-on-danger-container border-border">
                                {daysLate} Days Late
                              </span>
                            ) : isDueToday ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono-tabular bg-warning-container text-on-warning-container border-border">
                                Due Today
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-text-subtle border border-border font-mono-tabular bg-surface-2">
                                Upcoming
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right space-x-1">
                            {customer && (
                              <button
                                onClick={() => onSendWhatsApp(customer, agreement, dueAmt, slot.dueDate)}
                                title="Send 1-Click WhatsApp Reminder"
                                className="p-2 rounded-xl border border-border transition-all inline-flex items-center gap-1 text-xs font-semibold bg-success-container text-on-success-container hover:brightness-105"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">WhatsApp</span>
                              </button>
                            )}
                            <button
                              onClick={() => onOpenCollectPayment(agreement.id, slot.installmentNumber)}
                              className="m3-btn-base m3-btn-filled text-xs py-1.5 px-3 shadow-md"
                            >
                              Collect
                            </button>
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
      )}

      {/* TAB 2: COLLECTED RECOVERIES LEDGER (ADMIN ONLY REVERSAL/MODIFICATION) */}
      {activeTab === 'collected_history' && (
        <div className="m3-card p-4 overflow-hidden space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-text flex items-center gap-2">
                <Receipt className="w-4 h-4 text-success" />
                <span>Recovered Payments Ledger</span>
              </h3>
              <p className="text-xs text-text-muted">
                All collected recovery payments. Changing or reversing payments is strictly restricted to ADMIN.
              </p>
            </div>

            {canReversePayments ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-danger-container text-on-danger-container border border-border flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                ADMIN REVERSAL AUTHORIZED
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-2 text-text-muted border border-border flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-warning" />
                READ-ONLY FOR {currentUser?.role || 'NON-ADMIN'}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-text-subtle uppercase tracking-wider">
                  <th className="py-2.5 px-3">Receipt #</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Payment Method</th>
                  <th className="py-2.5 px-3 text-right">Amount Recovered</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Authority Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-subtle">
                      No recovered payment records found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const isReversed = p.isReversed;

                    return (
                      <tr key={p.id} className="hover:bg-surface-2/50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-primary">
                          {p.receiptNumber}
                        </td>
                        <td className="py-3 px-3 font-bold text-text">
                          {p.customerName || 'Customer'}
                        </td>
                        <td className="py-3 px-3 font-mono text-text-muted">
                          {p.date}
                        </td>
                        <td className="py-3 px-3 uppercase text-[11px] font-semibold text-text-subtle">
                          {p.paymentMethod}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold font-mono-tabular text-sm text-success">
                          {settings.currencySymbol} {p.amountPaid.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isReversed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-danger-container text-on-danger-container border border-border">
                              Reversed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-success-container text-on-success-container border border-border">
                              Valid Recovered
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {!isReversed && (
                            <button
                              onClick={() => handleAttemptReverse(p)}
                              title={canReversePayments ? "Reverse / Change this payment" : "Admin permission required"}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ml-auto cursor-pointer ${
                                canReversePayments
                                  ? 'bg-danger text-on-danger border-danger shadow-sm hover:brightness-110'
                                  : 'bg-surface-2 text-text-muted border-border hover:bg-border'
                              }`}
                            >
                              {canReversePayments ? (
                                <RotateCcw className="w-3.5 h-3.5" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-warning" />
                              )}
                              <span>Change / Reverse</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
