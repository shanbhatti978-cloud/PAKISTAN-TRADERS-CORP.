import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Download,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { ActivityLedgerEntry, LedgerActionType } from '../types';
import { ActivityLogger } from '../utils/activityLogger';
import { PermissionManager } from '../utils/permissionManager';
import { ExpandableSearch } from './ExpandableSearch';

interface ActivityLedgerViewProps {
  entries: ActivityLedgerEntry[];
  isLight?: boolean;
}

export const ActivityLedgerView: React.FC<ActivityLedgerViewProps> = ({
  entries,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(25);

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

  // Action badge color styling using token containers for AA contrast
  const getActionBadgeStyle = (action: LedgerActionType) => {
    switch (action) {
      case 'ADD_ITEM':
      case 'ADD_AGREEMENT':
      case 'ADD_RECOVERY':
      case 'ADD_ENTRY':
        return {
          label: action.replace('_', ' '),
          bg: 'bg-success-container text-on-success-container border-border',
          dot: 'bg-success',
        };

      case 'EDIT_ITEM':
      case 'EDIT_AGREEMENT':
      case 'EDIT_RECOVERY_AMOUNT':
        return {
          label: action.replace('_', ' '),
          bg: 'bg-info-container text-on-info-container border-border',
          dot: 'bg-info',
        };

      case 'VIEW_REPORT':
        return {
          label: 'VIEW REPORT',
          bg: 'bg-surface-2 text-text-muted border-border',
          dot: 'bg-text-subtle',
        };

      case 'DENIED':
        return {
          label: 'PERMISSION DENIED',
          bg: 'bg-danger-container text-on-danger-container border-border',
          dot: 'bg-danger',
        };

      case 'LOGIN':
      case 'LOGOUT':
      case 'EXPORT':
        return {
          label: action,
          bg: 'bg-primary-container text-on-primary-container border-border',
          dot: 'bg-primary',
        };

      default:
        return {
          label: action.replace('_', ' '),
          bg: 'bg-warning-container text-on-warning-container border-border',
          dot: 'bg-warning',
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
      <div className="p-6 rounded-3xl border border-border shadow-2 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors bg-surface text-text">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-caption font-bold bg-primary-container text-on-primary-container border border-border">
            <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Cryptographic Hash Chain Ledger</span>
          </div>
          <h1 className="text-display font-extrabold tracking-tight font-heading text-text">
            Enterprise Activity Ledger
          </h1>
          <p className="text-caption font-medium text-text-muted max-w-xl">
            Append-only tamper-evident audit trail recording every user action, state modification, before/after values, and denied attempts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleRunIntegrityCheck}
            disabled={isVerifying}
            className="m3-btn-base m3-btn-filled text-body-sm py-2.5 px-4 font-bold shadow-1 active:scale-95 transition-transform flex items-center gap-2 cursor-pointer"
          >
            {isVerifying ? (
              <Activity className="w-4 h-4 animate-spin text-on-primary" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Verify Chain Integrity</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="m3-btn-base m3-btn-tonal text-body-sm py-2.5 px-4 font-bold flex items-center gap-2 cursor-pointer"
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
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-1 ${
            integrityResult.isValid
              ? 'bg-success-container text-on-success-container border-border'
              : 'bg-danger-container text-on-danger-container border-border animate-in shake'
          }`}
        >
          <div className="flex items-center gap-3">
            {integrityResult.isValid ? (
              <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-danger shrink-0" />
            )}
            <div>
              <div className="font-extrabold text-title">
                {integrityResult.isValid
                  ? 'Integrity Verified: Chain Intact'
                  : 'INTEGRITY BREACH DETECTED!'}
              </div>
              <div className="text-caption font-semibold opacity-90">
                {integrityResult.isValid
                  ? `Cryptographic hash chain validated across ${integrityResult.checkedCount} entries. Zero tampered or altered blocks.`
                  : integrityResult.reason}
              </div>
            </div>
          </div>

          <span className="font-mono text-caption font-bold px-3 py-1 rounded-lg bg-surface/50">
            {integrityResult.checkedCount} Blocks Checked
          </span>
        </motion.div>
      )}

      {/* Filter Bar */}
      <div className="m3-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="m3-input text-body-sm w-full sm:w-40 font-bold"
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
              className="m3-input text-body-sm w-full sm:w-44 font-bold"
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
              className="m3-input text-body-sm w-full sm:w-40 font-bold"
            >
              <option value="ALL">All Modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Expandable Search Icon */}
          <div className="shrink-0 w-full sm:w-auto flex justify-end">
            <ExpandableSearch
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              placeholder="Search activity"
              resultCount={{ current: filteredEntries.length, total: entries.length }}
              recentKey="activity"
              shortcut="/"
              chipLabelPrefix="Audit"
            />
          </div>

        </div>
      </div>

      {/* Activity Entries List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-body-sm font-bold text-text-muted px-1">
          <span>Displaying {Math.min(pageSize, filteredEntries.length)} of {filteredEntries.length} Ledger Entries</span>
          <div className="flex items-center gap-2">
            <span className="text-caption text-text-muted font-mono">Per page:</span>
            {[25, 50, 100].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPageSize(size)}
                className={`px-2.5 py-1 rounded-lg text-caption font-bold ${
                  pageSize === size ? 'bg-primary text-on-primary' : 'bg-surface-2 text-text hover:bg-surface'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-body-sm font-bold text-text-muted rounded-3xl border border-dashed border-border bg-surface">
            {searchQuery
              ? `No match. Try name, CNIC, phone or serial.`
              : 'No activity ledger entries match your current filters.'}
          </div>
        ) : (
          filteredEntries.slice(0, pageSize).map((entry) => {
            const isExpanded = expandedEntryId === entry.id;
            const actBadge = getActionBadgeStyle(entry.actionType);
            const roleBadge = PermissionManager.getRoleBadgeStyle(entry.role);

            return (
              <div
                key={entry.id}
                className="m3-card overflow-hidden transition-all"
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
                        <span className={`px-2.5 py-0.5 rounded-full text-caption font-bold border uppercase ${actBadge.bg}`}>
                          {actBadge.label}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-caption font-bold border uppercase ${roleBadge.badgeClass}`}>
                          {entry.role}
                        </span>

                        <span className="text-body-sm font-extrabold text-text">
                          {entry.username}
                        </span>

                        <span className="text-caption text-text-muted font-mono">
                          in <strong className="text-text">{entry.module}</strong>
                        </span>
                      </div>

                      <p className="text-body-sm font-medium text-text-muted">
                        {entry.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-caption font-mono font-bold text-text">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-caption font-mono text-text-muted">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg border border-border bg-surface-2 text-text-muted">
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
                      className="border-t border-border p-4 bg-surface-2 space-y-3 text-caption"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Old Value */}
                        {entry.oldValue && (
                          <div className="p-3 rounded-xl border bg-danger-container/40 border-border text-on-danger-container space-y-1">
                            <span className="text-caption font-bold uppercase tracking-wider text-danger">
                              Before (Old Value)
                            </span>
                            <pre className="font-mono text-caption text-text whitespace-pre-wrap overflow-x-auto">
                              {entry.oldValue}
                            </pre>
                          </div>
                        )}

                        {/* New Value */}
                        {entry.newValue && (
                          <div className="p-3 rounded-xl border bg-success-container/40 border-border text-on-success-container space-y-1">
                            <span className="text-caption font-bold uppercase tracking-wider text-success">
                              After (New Value)
                            </span>
                            <pre className="font-mono text-caption text-text whitespace-pre-wrap overflow-x-auto">
                              {entry.newValue}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* Cryptographic Hashes */}
                      <div className="p-3 rounded-xl border border-border bg-surface text-text space-y-1 font-mono text-caption">
                        <div className="flex justify-between">
                          <span className="text-text-muted font-bold">Block ID:</span>
                          <span className="text-primary font-bold">{entry.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted font-bold">Prev Hash:</span>
                          <span className="text-text-muted truncate max-w-xs">{entry.prevHash}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted font-bold">Block Hash:</span>
                          <span className="text-success truncate max-w-xs font-bold">{entry.hash}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })
        )}

        {filteredEntries.length > pageSize && (
          <div className="pt-3 text-center">
            <button
              type="button"
              onClick={() => setPageSize((prev) => prev + 25)}
              className="m3-btn-base m3-btn-tonal text-body-sm py-2.5 px-5 font-bold inline-flex items-center gap-2"
            >
              <span>Load More ({filteredEntries.length - pageSize} remaining)</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
