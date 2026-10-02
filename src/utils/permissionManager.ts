import { UserRole, PermissionAction } from '../types';

/**
 * Central Permission Matrix for Pakistan Traders Corp Enterprise App
 *
 * PERMISSION RULES:
 * 1. ADMIN:
 *    - CAN: Add items, change recovery amounts, add recoveries, change agreements, add agreements, add related entries, view everything, export reports.
 *    - CANNOT: Modify Audit Report or any report (all reports are strictly read-only for EVERY role).
 *
 * 2. SUPERVISOR (add-only):
 *    - CAN: Add recoveries, add agreements, add related entries, view everything, export reports.
 *    - CANNOT: Edit or delete existing records, add items, change recovery amounts, change agreements, or modify reports.
 *
 * 3. VIEWER (read-only):
 *    - CAN: View reports, audit report, and all data; export reports.
 *    - CANNOT: Add, edit, or delete anything.
 */
export class PermissionManager {
  static can(role: UserRole, action: PermissionAction): boolean {
    // Audit Reports and Reports are strictly READ-ONLY for ALL roles without exception
    if (action === 'MODIFY_AUDIT_REPORT') {
      return false;
    }

    switch (role) {
      case 'ADMIN':
        return true;

      case 'SUPERVISOR':
        switch (action) {
          case 'VIEW_SCREENS_REPORTS':
          case 'ADD_RECOVERY':
          case 'ADD_AGREEMENT':
          case 'ADD_RELATED_ENTRIES':
          case 'EXPORT_REPORTS':
            return true;
          case 'MANAGE_USERS':
          case 'ADD_ITEM':
          case 'EDIT_ITEM':
          case 'DELETE_ITEM':
          case 'CHANGE_RECOVERY_AMOUNT':
          case 'CHANGE_AGREEMENT':
          case 'DELETE_AGREEMENT':
          case 'REVERSE_PAYMENT':
            return false;
          default:
            return false;
        }

      case 'VIEWER':
        switch (action) {
          case 'VIEW_SCREENS_REPORTS':
          case 'EXPORT_REPORTS':
            return true;
          default:
            return false;
        }

      default:
        return false;
    }
  }

  static getRoleBadgeStyle(role: UserRole): { label: string; badgeClass: string; dotColor: string } {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'ADMIN',
          badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
          dotColor: 'bg-red-500',
        };
      case 'SUPERVISOR':
        return {
          label: 'SUPERVISOR',
          badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30',
          dotColor: 'bg-amber-500',
        };
      case 'VIEWER':
        return {
          label: 'VIEWER',
          badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
          dotColor: 'bg-blue-500',
        };
      default:
        return {
          label: role,
          badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30',
          dotColor: 'bg-slate-500',
        };
    }
  }
}
