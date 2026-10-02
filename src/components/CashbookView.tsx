import React, { useState } from 'react';
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
} from 'lucide-react';
import { CashBookEntry, ShopSettings } from '../types';
import { formatDateDDMMYYYY } from '../utils/formatters';

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
  const [type, setType] = useState<'in' | 'out'>('out');
  const [category, setCategory] = useState<CashBookEntry['category']>('Misc Expense');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [refNum, setRefNum] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalIn = cashbook.filter((e) => e.type === 'in').reduce((sum, e) => sum + e.amount, 0);
  const totalOut = cashbook.filter((e) => e.type === 'out').reduce((sum, e) => sum + e.amount, 0);
  const netCashInHand = totalIn - totalOut;

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
          <h1 className="text-xl font-extrabold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
            <BookOpen className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
            Daily Cashbook & Expense Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
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
            className="m3-btn-base m3-btn-filled text-xs py-2"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Record Expense / Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="m3-card p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Cash Inflows</div>
          <div className="text-2xl font-extrabold font-mono-tabular mt-1" style={{ color: 'var(--theme-primary)' }}>
            +{settings.currencySymbol} {totalIn.toLocaleString()}
          </div>
        </div>

        <div className="m3-card p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Cash Outflows</div>
          <div className="text-2xl font-extrabold font-mono-tabular mt-1 text-rose-500">
            -{settings.currencySymbol} {totalOut.toLocaleString()}
          </div>
        </div>

        <div className="m3-card p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Net Balance</div>
          <div className="text-2xl font-extrabold font-mono-tabular mt-1" style={{ color: 'var(--theme-primary)' }}>
            {settings.currencySymbol} {netCashInHand.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="m3-card p-5 space-y-4">
        <h2 className="text-base font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>Recent Transactions</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ borderColor: 'var(--theme-surface-border)' }}>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Category</th>
                <th className="p-3">Description</th>
                <th className="p-3">Ref #</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono-tabular" style={{ borderColor: 'var(--theme-surface-border)' }}>
              {cashbook.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-500/5">
                  <td className="p-3 text-slate-400">{formatDateDDMMYYYY(entry.date)}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="p-3 font-bold" style={{ color: 'var(--theme-text-primary)' }}>{entry.category}</td>
                  <td className="p-3">{entry.description}</td>
                  <td className="p-3 text-slate-400">{entry.referenceNumber}</td>
                  <td className="p-3 text-right font-extrabold" style={{ color: entry.type === 'in' ? 'var(--theme-primary)' : '#DC2626' }}>
                    {entry.type === 'in' ? '+' : '-'}{settings.currencySymbol} {entry.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="m3-card max-w-md w-full p-6 space-y-4 m3-animate-in">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <h2 className="text-base font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>Record Cashbook Entry</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationError && (
              <div className="p-3 rounded-xl border text-xs text-rose-500 bg-rose-50 border-rose-200">
                {validationError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Entry Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('in')}
                    className="p-2 rounded-xl font-bold border text-center transition-all"
                    style={{
                      backgroundColor: type === 'in' ? 'var(--theme-tonal-bg)' : 'transparent',
                      color: type === 'in' ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
                      borderColor: type === 'in' ? 'var(--theme-primary)' : 'var(--theme-surface-border)',
                    }}
                  >
                    Cash IN (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('out')}
                    className="p-2 rounded-xl font-bold border text-center transition-all"
                    style={{
                      backgroundColor: type === 'out' ? 'rgba(220, 38, 38, 0.15)' : 'transparent',
                      color: type === 'out' ? '#DC2626' : 'var(--theme-text-secondary)',
                      borderColor: type === 'out' ? '#DC2626' : 'var(--theme-surface-border)',
                    }}
                  >
                    Cash OUT (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Amount ({settings.currencySymbol})</label>
                <input type="number" required value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className="m3-input" placeholder="0" />
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Description</label>
                <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} className="m3-input" placeholder="Reason / expense description..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <button type="button" onClick={() => setShowAddModal(false)} className="m3-btn-base m3-btn-outlined">Cancel</button>
              <button type="submit" className="m3-btn-base m3-btn-filled">Save Entry</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
