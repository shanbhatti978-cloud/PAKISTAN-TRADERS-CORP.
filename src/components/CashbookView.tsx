import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  DollarSign,
  X,
  FileSpreadsheet,
  AlertCircle,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { CashBookEntry, ShopSettings } from '../types';
import { formatDateDDMMYYYY } from '../utils/formatters';
import { ExpandableSearch } from './ExpandableSearch';

interface CashbookViewProps {
  cashbook: CashBookEntry[];
  settings: ShopSettings;
  onAddCashEntry: (entry: Omit<CashBookEntry, 'id'>) => void;
  onOpenBusinessReport?: () => void;
}

export const CashbookView: React.FC<CashbookViewProps> = ({
  cashbook,
  settings,
  onAddCashEntry,
  onOpenBusinessReport,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest'>('newest');
  const [pageSize, setPageSize] = useState<number>(25);

  // New Entry Form State
  const [type, setType] = useState<'in' | 'out'>('out');
  const [category, setCategory] = useState<CashBookEntry['category']>('Misc Expense');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [refNum, setRefNum] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalIn = cashbook.filter((e) => e.type === 'in').reduce((sum, e) => sum + e.amount, 0);
  const totalOut = cashbook.filter((e) => e.type === 'out').reduce((sum, e) => sum + e.amount, 0);
  const netCashInHand = totalIn - totalOut;

  // Filter & Sort
  const filteredEntries = useMemo(() => {
    return cashbook
      .filter((entry) => {
        const matchesType = typeFilter === 'all' || entry.type === typeFilter;
        const matchesCat = categoryFilter === 'all' || entry.category === categoryFilter;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          entry.description.toLowerCase().includes(q) ||
          entry.category.toLowerCase().includes(q) ||
          (entry.referenceNumber && entry.referenceNumber.toLowerCase().includes(q)) ||
          entry.amount.toString().includes(q);

        return matchesType && matchesCat && matchesSearch;
      })
      .sort((a, b) => {
        if (sortOrder === 'highest') return b.amount - a.amount;
        if (sortOrder === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [cashbook, searchQuery, typeFilter, categoryFilter, sortOrder]);

  const visibleEntries = useMemo(() => {
    return filteredEntries.slice(0, pageSize);
  }, [filteredEntries, pageSize]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (amount <= 0 || !description.trim()) {
      setValidationError('Please enter a valid amount and transaction description.');
      return;
    }

    onAddCashEntry({
      date: new Date().toISOString().split('T')[0],
      type,
      category,
      amount,
      referenceNumber: refNum || `EXP-${Date.now().toString().slice(-4)}`,
      description,
    });

    setShowAddModal(false);
    setAmount(0);
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="m3-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold font-heading flex items-center gap-2 text-text">
            <BookOpen className="w-5 h-5 text-primary" />
            Daily Cashbook & Expense Ledger
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Log shop expenses, rent, utility bills, and daily recovery inflows.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onOpenBusinessReport && (
            <button
              onClick={onOpenBusinessReport}
              className="m3-btn-base m3-btn-outlined text-xs py-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Full Audit Report</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="m3-btn-base m3-btn-filled text-xs py-2 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Record Expense / Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="m3-card p-4.5 bg-surface border border-border">
          <div className="text-xs font-bold text-text-subtle uppercase">Total Cash Inflows</div>
          <div className="text-2xl font-extrabold font-mono-tabular mt-1 text-primary">
            +{settings.currencySymbol} {totalIn.toLocaleString()}
          </div>
        </div>

        <div className="m3-card p-4.5 bg-surface border border-border">
          <div className="text-xs font-bold text-text-subtle uppercase">Total Cash Outflows</div>
          <div className="text-2xl font-extrabold font-mono-tabular mt-1 text-danger">
            -{settings.currencySymbol} {totalOut.toLocaleString()}
          </div>
        </div>

        <div className="m3-card p-4.5 bg-surface border border-border">
          <div className="text-xs font-bold text-text-subtle uppercase">Net Cash Balance</div>
          <div className="text-2xl font-extrabold font-mono-tabular mt-1 text-text">
            {settings.currencySymbol} {netCashInHand.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar (Sticky/Prominent on top of list) */}
      <div className="m3-card p-4 space-y-3 bg-surface border border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`m3-chip ${typeFilter === 'all' ? 'm3-chip-selected' : ''}`}
            >
              All Entries ({cashbook.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('in')}
              className={`m3-chip ${typeFilter === 'in' ? 'm3-chip-selected' : ''}`}
            >
              Cash IN (+)
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('out')}
              className={`m3-chip ${typeFilter === 'out' ? 'm3-chip-selected' : ''}`}
            >
              Cash OUT (-)
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end text-xs">
            {/* Sort Selector */}
            <div className="flex items-center gap-1">
              <span className="text-text-subtle text-[11px] font-semibold flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
              </span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="m3-input p-1.5 text-xs font-semibold rounded-lg"
              >
                <option value="newest">Date: Newest First</option>
                <option value="oldest">Date: Oldest First</option>
                <option value="highest">Amount: Highest First</option>
              </select>
            </div>

            {/* Expandable Search */}
            <ExpandableSearch
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              placeholder="Search cashbook"
              resultCount={{ current: visibleEntries.length, total: filteredEntries.length }}
              recentKey="cashbook"
              shortcut="/"
              chipLabelPrefix="Cashbook"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-[11px] text-text-subtle font-mono-tabular pt-1 border-t border-border">
          <span>
            Showing {visibleEntries.length} of {filteredEntries.length} transactions
          </span>
          <div className="flex items-center gap-1.5">
            <span>Per page:</span>
            {[25, 50, 100].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPageSize(size)}
                className={`px-1.5 py-0.5 rounded font-bold ${
                  pageSize === size ? 'bg-primary text-on-primary' : 'hover:bg-surface-2'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions List (Cards on Mobile, Table on Desktop) */}
      <div className="m3-card p-4 sm:p-5 space-y-3 bg-surface border border-border">
        {visibleEntries.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-surface-2/40 space-y-2">
            <BookOpen className="w-8 h-8 text-text-subtle mx-auto stroke-[1.5]" />
            <p className="font-bold text-sm text-text">No transactions matching filter</p>
            <p className="text-xs text-text-subtle">
              {searchQuery
                ? `No match. Try name, CNIC, phone or serial.`
                : 'Try adjusting your filter selection.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                }}
                className="m3-btn-base m3-btn-outlined text-xs py-1.5 px-3 mt-1"
              >
                Reset Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Cards (Screens < 768px) */}
            <div className="grid grid-cols-1 gap-2.5 md:hidden">
              {visibleEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-2xl border border-border bg-surface-input flex items-center justify-between gap-3 text-xs font-mono-tabular"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          entry.type === 'in'
                            ? 'bg-success/15 text-success border border-success/30'
                            : 'bg-danger/15 text-danger border border-danger/30'
                        }`}
                      >
                        {entry.type}
                      </span>
                      <span className="font-bold text-text truncate">{entry.category}</span>
                    </div>
                    <div className="text-xs text-text-muted truncate font-sans">
                      {entry.description}
                    </div>
                    <div className="text-[11px] text-text-subtle">
                      {formatDateDDMMYYYY(entry.date)} · Ref: {entry.referenceNumber}
                    </div>
                  </div>

                  <div
                    className={`font-extrabold text-sm shrink-0 ${
                      entry.type === 'in' ? 'text-primary' : 'text-danger'
                    }`}
                  >
                    {entry.type === 'in' ? '+' : '-'}
                    {settings.currencySymbol} {entry.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (Screens >= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b text-[10px] font-bold uppercase tracking-wider text-text-subtle border-border">
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Ref #</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono-tabular">
                  {visibleEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-2 transition-colors">
                      <td className="p-3 text-text-subtle">{formatDateDDMMYYYY(entry.date)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            entry.type === 'in'
                              ? 'bg-success/15 text-success border-success/30'
                              : 'bg-danger/15 text-danger border-danger/30'
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-text">{entry.category}</td>
                      <td className="p-3 text-text font-sans">{entry.description}</td>
                      <td className="p-3 text-text-subtle">{entry.referenceNumber}</td>
                      <td
                        className={`p-3 text-right font-extrabold ${
                          entry.type === 'in' ? 'text-primary' : 'text-danger'
                        }`}
                      >
                        {entry.type === 'in' ? '+' : '-'}
                        {settings.currencySymbol} {entry.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load More Button if more pages exist */}
            {filteredEntries.length > pageSize && (
              <div className="pt-3 text-center border-t border-border">
                <button
                  type="button"
                  onClick={() => setPageSize((prev) => prev + 25)}
                  className="m3-btn-base m3-btn-tonal text-xs py-2 px-5 inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Load More ({filteredEntries.length - pageSize} remaining)</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Record Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="m3-card max-w-md w-full p-6 space-y-4 bg-surface border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold font-heading text-text">Record Cashbook Entry</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-text-subtle hover:text-text rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationError && (
              <div className="p-3 rounded-xl border text-xs text-danger bg-danger/10 border-danger/20">
                {validationError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-text">Entry Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('in')}
                    className={`p-2.5 rounded-xl font-bold border text-center transition-all ${
                      type === 'in'
                        ? 'bg-primary-container text-on-primary-container border-primary'
                        : 'bg-surface border-border text-text hover:border-primary/50'
                    }`}
                  >
                    Cash IN (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('out')}
                    className={`p-2.5 rounded-xl font-bold border text-center transition-all ${
                      type === 'out'
                        ? 'bg-danger/15 text-danger border-danger'
                        : 'bg-surface border-border text-text hover:border-danger/50'
                    }`}
                  >
                    Cash OUT (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-text">Amount ({settings.currencySymbol}) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="m3-input p-2 text-base font-bold font-mono-tabular"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-text">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="m3-input p-2 text-xs font-semibold"
                >
                  <option value="Shop Rent">Shop Rent</option>
                  <option value="Electricity Bill">Electricity Bill</option>
                  <option value="Staff Salary">Staff Salary</option>
                  <option value="Tea & Refreshment">Tea & Refreshment</option>
                  <option value="Fuel / Travel">Fuel / Travel</option>
                  <option value="Supplier Payment">Supplier Payment</option>
                  <option value="Recovery Collection Inflow">Recovery Collection Inflow</option>
                  <option value="Misc Expense">Misc Expense</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-text">Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="m3-input p-2 text-xs"
                  placeholder="Reason / expense description..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-text">Invoice / Ref #</label>
                <input
                  type="text"
                  value={refNum}
                  onChange={(e) => setRefNum(e.target.value)}
                  className="m3-input p-2 font-mono-tabular text-xs"
                  placeholder="e.g. BILL-9842"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="m3-btn-base m3-btn-outlined text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="m3-btn-base m3-btn-filled text-xs py-2 px-5 shadow-sm"
              >
                Record Entry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
