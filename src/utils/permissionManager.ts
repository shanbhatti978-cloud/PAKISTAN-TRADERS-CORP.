import { UserRole, PermissionAction } from '../types';

/**
 * Central Permission Matrix for Pakistan Traders Corp Enterprise App
 *
 * PERMISSION RULES:
 * 1. ADMIN:
 *    - CAN: All actions (including user management, backup restore, database reset, item management).
 *    - CANNOT: Modify Audit Report (audit reports are strictly read-only for EVERY role).
 *
 * 2. SUPERVISOR (add-only):
 *    - CAN: Add recoveries, add agreements, add related entries, view screens/reports, export reports.
 *    - CANNOT: Add items, edit items, delete items, change recovery amounts, change agreements,
 *              delete agreements, reverse payments, manage users, restore backup, reset database, modify audit report.
 *
 * 3. VIEWER (read-only):
 *    - CAN: View screens/reports, export reports.
 *    - CANNOT: Add, edit, delete, modify, restore, or reset anything.
 */

export const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<PermissionAction>> = {
  ADMIN: new Set<PermissionAction>([
    'VIEW_SCREENS_REPORTS',
    'ADD_ITEM',
    'EDIT_ITEM',
    'DELETE_ITEM',
    'CHANGE_RECOVERY_AMOUNT',
    'ADD_RECOVERY',
    'CHANGE_AGREEMENT',
    'DELETE_AGREEMENT',
    'ADD_AGREEMENT',
    'ADD_RELATED_ENTRIES',
    'REVERSE_PAYMENT',
    'EXPORT_REPORTS',
    'MANAGE_USERS',
    'RESTORE_BACKUP',
    'RESET_DATABASE',
  ]),
  SUPERVISOR: new Set<PermissionAction>([
    'VIEW_SCREENS_REPORTS',
    'ADD_RECOVERY',
    'ADD_AGREEMENT',
    'ADD_RELATED_ENTRIES',
    'EXPORT_REPORTS',
  ]),
  VIEWER: new Set<PermissionAction>([
    'VIEW_SCREENS_REPORTS',
    'EXPORT_REPORTS',
  ]),
};

export class PermissionManager {
  static can(role: UserRole, action: PermissionAction): boolean {
    // Audit Reports and Reports are strictly READ-ONLY for ALL roles without exception
    if (action === 'MODIFY_AUDIT_REPORT') {
      return false;
    }

    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) {
      return false;
    }

    return permissions.has(action);
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
          badgeClass: 'bg-surface-2 text-text border-border',
          dotColor: 'bg-text-subtle',
        };
    }
  }
}
