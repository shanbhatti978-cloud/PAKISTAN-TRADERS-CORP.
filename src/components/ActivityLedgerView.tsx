import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { ActivityLedgerEntry, UserRole, LedgerActionType } from '../types';
import { ActivityLogger } from '../utils/activityLogger';
import { PermissionManager } from '../utils/permissionManager';

interface ActivityLedgerViewProps {
  entries: ActivityLedgerEntry[];
  isLight?: boolean;
}

export const ActivityLedgerView: React.FC<ActivityLedgerViewProps> = ({
  entries,
  isLight = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Integrity Check State
  const [isVerifying, setIsVerifying] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<{
    isValid: boolean;
    checkedCount: number;
    tamperedId?: string;
    reason?: string;
  } | null>(null);

  // Run Hash Chain Integrity Check
  const handleRunIntegrityCheck = async () => {
    setIsVerifying(true);
    setIntegrityResult(null);

    // Simulate cryptographic verification delay for tactile feedback
    setTimeout(async () => {
      const result = await ActivityLogger.verifyIntegrity(entries);
      setIntegrityResult(result);
      setIsVerifying(false);
    }, 400);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Timestamp',
      'Username',
      'Role',
      'ActionType',
      'Module',
      'RecordID',
      'OldValue',
      'NewValue',
      'Description',
      'PrevHash',
      'Hash',
    ];

    const rows = entries.map((e) => [
      e.id,
      e.timestamp,
      e.username,
      e.role,
      e.actionType,
      e.module,
      e.recordId || '',
      `"${(e.oldValue || '').replace(/"/g, '""')}"`,
      `"${(e.newValue || '').replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.prevHash,
      e.hash,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Activity_Ledger_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filteredEntries = entries.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      e.username.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.module.toLowerCase().includes(q) ||
      e.actionType.toLowerCase().includes(q) ||
      (e.recordId && e.recordId.toLowerCase().includes(q)) ||
      e.hash.toLowerCase().includes(q);

    const matchesRole = selectedRole === 'ALL' || e.role === selectedRole;
    const matchesAction = selectedAction === 'ALL' || e.actionType === selectedAction;
    const matchesModule = selectedModule === 'ALL' || e.module === selectedModule;

    return matchesSearch && matchesRole && matchesAction && matchesModule;
  });

  // Action badge color styling: Green = ADD, Blue = EDIT, Gray = VIEW, Red = DENIED, Purple = LOGIN/EXPORT
  const getActionBadgeStyle = (action: LedgerActionType) => {
    switch (action) {
      case 'ADD_ITEM':
      case 'ADD_AGREEMENT':
      case 'ADD_RECOVERY':
      case 'ADD_ENTRY':
        return {
          label: action.replace('_', ' '),
          bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };

      case 'EDIT_ITEM':
      case 'EDIT_AGREEMENT':
      case 'EDIT_RECOVERY_AMOUNT':
        return {
          label: action.replace('_', ' '),
          bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
          dot: 'bg-blue-500',
        };

      case 'VIEW_REPORT':
        return {
          label: 'VIEW REPORT',
          bg: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30',
          dot: 'bg-slate-500',
        };

      case 'DENIED':
        return {
          label: 'PERMISSION DENIED',
          bg: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
          dot: 'bg-red-500',
        };

      case 'LOGIN':
      case 'LOGOUT':
      case 'EXPORT':
        return {
          label: action,
          bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
          dot: 'bg-purple-500',
        };

      default:
        return {
          label: action.replace('_', ' '),
          bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
        };
    }
  };

  const modules = Array.from(new Set(entries.map((e) => e.module)));
  const actionTypes: LedgerActionType[] = [
    'ADD_ITEM',
    'ADD_AGREEMENT',
    'ADD_RECOVERY',
    'EDIT_AGREEMENT',
    'EDIT_RECOVERY_AMOUNT',
    'VIEW_REPORT',
    'EXPORT',
    'LOGIN',
    'DENIED',
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Lock className="w-3.5 h-3.5 text-blue-500" />
            <span>Cryptographic Hash Chain Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
            Enterprise Activity Ledger
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-xl">
            Append-only tamper-evident audit trail recording every user action, state modification, before/after values, and denied attempts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleRunIntegrityCheck}
            disabled={isVerifying}
            className="m3-btn-base m3-btn-filled text-xs py-2.5 px-4 shadow-md active:scale-95 transition-transform flex items-center gap-2 cursor-pointer"
          >
            {isVerifying ? (
              <Activity className="w-4 h-4 animate-spin text-white" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Verify Chain Integrity</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="m3-btn-base m3-btn-tonal text-xs py-2.5 px-4 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Integrity Banner Result */}
      {integrityResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md ${
            integrityResult.isValid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300 animate-in shake'
          }`}
        >
          <div className="flex items-center gap-3">
            {integrityResult.isValid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
            )}
            <div>
              <div className="font-extrabold text-sm">
                {integrityResult.isValid
                  ? 'Integrity Verified: Chain Intact'
                  : 'INTEGRITY BREACH DETECTED!'}
              </div>
              <div className="text-xs font-semibold opacity-90">
                {integrityResult.isValid
                  ? `Cryptographic hash chain validated across ${integrityResult.checkedCount} entries. Zero tampered or altered blocks.`
                  : integrityResult.reason}
              </div>
            </div>
          </div>

          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-black/10">
            {integrityResult.checkedCount} Blocks Checked
          </span>
        </motion.div>
      )}

      {/* Filter Bar */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search user, description, module, hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="m3-input pl-9 text-xs"
            />
          </div>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="m3-input text-xs w-full sm:w-40 font-bold"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
            <option value="VIEWER">VIEWER</option>
          </select>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="m3-input text-xs w-full sm:w-44 font-bold"
          >
            <option value="ALL">All Actions</option>
            {actionTypes.map((act) => (
              <option key={act} value={act}>
                {act.replace('_', ' ')}
              </option>
            ))}
          </select>

          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="m3-input text-xs w-full sm:w-40 font-bold"
          >
            <option value="ALL">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* Activity Entries List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
          <span>Displaying {filteredEntries.length} of {entries.length} Ledger Entries</span>
          <span className="font-mono text-[11px]">Append-Only Log</span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-500 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
            No activity ledger entries match your current search and filters.
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isExpanded = expandedEntryId === entry.id;
            const actBadge = getActionBadgeStyle(entry.actionType);
            const roleBadge = PermissionManager.getRoleBadgeStyle(entry.role);

            return (
              <div
                key={entry.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Entry Header */}
                <div
                  onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                  className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${actBadge.dot}`} />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${actBadge.bg}`}>
                          {actBadge.label}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${roleBadge.badgeClass}`}>
                          {entry.role}
                        </span>

                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {entry.username}
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono">
                          in <strong className="text-slate-700 dark:text-slate-300">{entry.module}</strong>
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {entry.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[11px] font-mono font-bold text-slate-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg border text-slate-400" style={{ borderColor: 'var(--theme-surface-border)' }}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details / Diff Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t p-4 bg-slate-50/50 dark:bg-slate-950/50 space-y-3 text-xs"
                      style={{ borderColor: 'var(--theme-surface-border)' }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Old Value */}
                        {entry.oldValue && (
                          <div className="p-3 rounded-xl border bg-rose-500/5 border-rose-500/20 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                              Before (Old Value)
                            </span>
                            <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap overflow-x-auto">
                              {entry.oldValue}
                            </pre>
                          </div>
                        )}

                        {/* New Value */}
                        {entry.newValue && (
                          <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                              After (New Value)
                            </span>
                            <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap overflow-x-auto">
                              {entry.newValue}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* Cryptographic Hashes */}
                      <div className="p-3 rounded-xl border bg-slate-900 text-slate-300 space-y-1 font-mono text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Block ID:</span>
                          <span className="text-blue-400">{entry.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Prev Hash:</span>
                          <span className="text-slate-400 truncate max-w-xs">{entry.prevHash}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Block Hash:</span>
                          <span className="text-emerald-400 truncate max-w-xs">{entry.hash}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
