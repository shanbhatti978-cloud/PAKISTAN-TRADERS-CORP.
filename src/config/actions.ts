import {
  Plus,
  Receipt,
  PackageCheck,
  UserPlus,
  BookOpen,
  FileSpreadsheet,
  Download,
  Upload,
  Lock,
  LucideIcon,
} from 'lucide-react';
import { PermissionAction } from '../types';

export type ActionId =
  | 'new_agreement'
  | 'collect_payment'
  | 'receive_stock'
  | 'new_customer'
  | 'add_expense'
  | 'business_report'
  | 'export_backup'
  | 'import_backup'
  | 'lock_app';

export interface AppActionConfig {
  id: ActionId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  permission?: PermissionAction;
}

export const APP_ACTIONS: AppActionConfig[] = [
  {
    id: 'new_agreement',
    label: 'New Sale Agreement',
    shortLabel: 'New Agreement',
    description: 'Book new installment sale & generate contract',
    icon: Plus,
    permission: 'ADD_AGREEMENT',
  },
  {
    id: 'collect_payment',
    label: 'Collect Installment',
    shortLabel: 'Collect Payment',
    description: 'Record customer payment & issue slip',
    icon: Receipt,
    permission: 'ADD_RECOVERY',
  },
  {
    id: 'receive_stock',
    label: 'Receive Warehouse Stock',
    shortLabel: 'Receive Stock',
    description: 'Log supplier delivery & serial numbers',
    icon: PackageCheck,
    permission: 'ADD_ITEM',
  },
  {
    id: 'new_customer',
    label: 'Register New Customer',
    shortLabel: 'New Customer',
    description: 'Create customer profile & CNIC record',
    icon: UserPlus,
    permission: 'ADD_AGREEMENT',
  },
  {
    id: 'add_expense',
    label: 'Add Cashbook Entry',
    shortLabel: 'Add Expense',
    description: 'Record shop expense or cash inflow',
    icon: BookOpen,
    permission: 'ADD_RELATED_ENTRIES',
  },
  {
    id: 'business_report',
    label: 'Business Audit & PnL Report',
    shortLabel: 'Audit Report',
    description: 'Generate financial profit analysis & audit PDFs',
    icon: FileSpreadsheet,
    permission: 'VIEW_SCREENS_REPORTS',
  },
  {
    id: 'export_backup',
    label: 'Export Data Backup',
    shortLabel: 'Export Backup',
    description: 'Download offline encrypted JSON backup',
    icon: Download,
    permission: 'MANAGE_USERS',
  },
  {
    id: 'import_backup',
    label: 'Import Data Backup',
    shortLabel: 'Import Backup',
    description: 'Restore database from JSON file',
    icon: Upload,
    permission: 'MANAGE_USERS',
  },
  {
    id: 'lock_app',
    label: 'Lock Terminal Screen',
    shortLabel: 'Lock Screen',
    description: 'Require PIN authorization to resume',
    icon: Lock,
  },
];
