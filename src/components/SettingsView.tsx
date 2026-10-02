import React, { useState } from 'react';
import {
  Settings,
  Store,
  Lock,
  Download,
  Upload,
  RotateCcw,
  Shield,
  FileText,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  Palette,
  Sun,
  Moon,
  UserPlus,
  KeyRound,
  UserCheck,
  Unlock,
  UserX,
  Edit2,
  User,
  ShieldAlert,
} from 'lucide-react';
import { ShopSettings, AuditLog, User as UserType, UserRole } from '../types';
import { M3_THEME_COLORS, normalizeThemeColor, M3ThemeColor } from '../theme/m3Theme';
import { PermissionManager } from '../utils/permissionManager';

interface SettingsViewProps {
  settings: ShopSettings;
  setSettings: React.Dispatch<React.SetStateAction<ShopSettings>>;
  auditLogs: AuditLog[];
  users?: UserType[];
  currentUser?: UserType;
  onCreateUser?: (params: { username: string; fullName: string; password: string; role: UserRole }) => Promise<UserType> | UserType;
  onEditUser?: (id: string, updates: { fullName?: string; role?: UserRole }) => void;
  onResetPassword?: (id: string, newTempPass: string) => Promise<void> | void;
  onToggleUserActive?: (id: string, isActive: boolean) => void;
  onUnlockUser?: (id: string) => void;
  onChangeOwnPassword?: (oldPass: string, newPass: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  onUpdateOwnDisplayName?: (fullName: string) => void;
  onExportJSON: () => string;
  onImportJSON: (jsonStr: string) => { success: boolean; error?: string };
  onResetDemoData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  setSettings,
  auditLogs,
  users = [],
  currentUser,
  onCreateUser,
  onEditUser,
  onResetPassword,
  onToggleUserActive,
  onUnlockUser,
  onChangeOwnPassword,
  onUpdateOwnDisplayName,
  onExportJSON,
  onImportJSON,
  onResetDemoData,
}) => {
  const [shopName, setShopName] = useState(settings.shopName);
  const [proprietorName, setProprietorName] = useState(settings.proprietorName);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [city, setCity] = useState(settings.city);
  const [regNumber, setRegNumber] = useState(settings.regNumber);
  const [pinCode, setPinCode] = useState(settings.pinCode);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusToast, setStatusToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // My Account (Own Profile) state
  const [ownFullName, setOwnFullName] = useState(currentUser?.fullName || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownPasswordMsg, setOwnPasswordMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Admin User Management Modals State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('SUPERVISOR');
  const [tempPassword, setTempPassword] = useState('');

  const [resetTargetUser, setResetTargetUser] = useState<UserType | null>(null);
  const [adminTempPass, setAdminTempPass] = useState('');

  const [editTargetUser, setEditTargetUser] = useState<UserType | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('SUPERVISOR');

  const [confirmActionModal, setConfirmActionModal] = useState<{
    title: string;
    message: string;
    actionType: 'role' | 'disable' | 'reset';
    onConfirm: () => void;
  } | null>(null);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatusToast({ type, message });
    setTimeout(() => setStatusToast(null), 4000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings((prev) => ({
      ...prev,
      shopName,
      proprietorName,
      phone,
      address,
      city,
      regNumber,
      pinCode,
    }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleUpdateOwnProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (ownFullName.trim() && onUpdateOwnDisplayName) {
      onUpdateOwnDisplayName(ownFullName.trim());
      showStatus('success', 'Profile name updated!');
    }
  };

  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnPasswordMsg(null);

    if (newPassword.length < 8) {
      setOwnPasswordMsg({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    if (!/\d/.test(newPassword)) {
      setOwnPasswordMsg({ type: 'error', message: 'New password must contain at least one number.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setOwnPasswordMsg({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    if (!onChangeOwnPassword) return;

    try {
      const res = await onChangeOwnPassword(oldPassword, newPassword);
      if (res.success) {
        setOwnPasswordMsg({ type: 'success', message: 'Your password was changed successfully.' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setOwnPasswordMsg({ type: 'error', message: res.message || 'Failed to change password.' });
      }
    } catch (err: any) {
      setOwnPasswordMsg({ type: 'error', message: err.message || 'An error occurred.' });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateUser) return;

    if (tempPassword.length < 6) {
      showStatus('error', 'Temporary password must be at least 6 characters.');
      return;
    }

    try {
      await onCreateUser({
        username: newUsername.trim(),
        fullName: newFullName.trim(),
        password: tempPassword,
        role: newRole,
      });
      showStatus('success', `User '${newUsername.trim()}' created! Must change password on first login.`);
      setShowAddUserModal(false);
      setNewUsername('');
      setNewFullName('');
      setTempPassword('');
      setNewRole('SUPERVISOR');
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to create user account.');
    }
  };

  const handleExecuteResetPassword = async () => {
    if (!resetTargetUser || !onResetPassword) return;
    if (adminTempPass.length < 6) {
      showStatus('error', 'Temporary password must be at least 6 characters.');
      return;
    }

    try {
      await onResetPassword(resetTargetUser.id, adminTempPass);
      showStatus('success', `Password reset for '${resetTargetUser.username}'. User must change password at next login.`);
      setResetTargetUser(null);
      setAdminTempPass('');
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to reset password.');
    }
  };

  const handleExecuteEditUser = () => {
    if (!editTargetUser || !onEditUser) return;
    try {
      onEditUser(editTargetUser.id, {
        fullName: editFullName.trim(),
        role: editRole,
      });
      showStatus('success', `Updated user account '${editTargetUser.username}'.`);
      setEditTargetUser(null);
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to update user.');
    }
  };

  const handleDownloadBackup = () => {
    const jsonStr = onExportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QistFlow_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = onImportJSON(content);
      if (res.success) {
        showStatus('success', 'Backup data successfully imported!');
      } else {
        showStatus('error', `Failed to import backup: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  // Filter out demo accounts from the user management list
  const realUsersList = users.filter((u) => !u.isDemo);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusToast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in ${
          statusToast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-rose-600 text-white border-rose-400'
        }`}>
          {statusToast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-xs font-bold">{statusToast.message}</span>
        </div>
      )}

      {/* MY ACCOUNT & PROFILE SECTION (EVERY USER) */}
      <div className="m3-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
          <div>
            <h3 className="text-base font-bold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
              <User className="w-4 h-4 text-blue-500" />
              My Account Settings
            </h3>
            <p className="text-xs text-slate-400">
              Logged in as <strong className="text-blue-400 uppercase font-mono">{currentUser?.username}</strong> ({currentUser?.role})
            </p>
          </div>

          {currentUser && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border font-mono-tabular ${
              PermissionManager.getRoleBadgeStyle(currentUser.role).badgeClass
            }`}>
              {currentUser.role}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Display Name Update */}
          <form onSubmit={handleUpdateOwnProfile} className="space-y-3 p-4 rounded-2xl border bg-slate-500/5" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Profile Details</h4>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                value={ownFullName}
                onChange={(e) => setOwnFullName(e.target.value)}
                className="m3-input text-xs"
                required
              />
            </div>
            <button type="submit" className="m3-btn-base m3-btn-tonal text-xs py-2 px-4">
              Update Name
            </button>
          </form>

          {/* Change Own Password */}
          <form onSubmit={handleChangeOwnPassword} className="space-y-3 p-4 rounded-2xl border bg-slate-500/5" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Change Password</h4>
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Current Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="m3-input text-xs"
                required
              />
              <input
                type="password"
                placeholder="New Password (min 8 chars, 1 digit)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="m3-input text-xs"
                required
                minLength={8}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="m3-input text-xs"
                required
              />
            </div>

            {ownPasswordMsg && (
              <div className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                ownPasswordMsg.type === 'success' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
              }`}>
                {ownPasswordMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{ownPasswordMsg.message}</span>
              </div>
            )}

            <button type="submit" className="m3-btn-base m3-btn-filled text-xs py-2 px-4">
              Update Password
            </button>
          </form>
        </div>
      </div>

      {/* ADMIN: SYSTEM USER MANAGEMENT SECTION */}
      {currentUser?.role === 'ADMIN' && (
        <div className="m3-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <div>
              <h3 className="text-base font-bold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                <Shield className="w-4 h-4 text-rose-500" />
                User Access Control & Role Management
              </h3>
              <p className="text-xs text-slate-400">
                Create & manage Supervisor & Viewer accounts. Passwords are securely hashed with per-user cryptographic salts.
              </p>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="m3-btn-base m3-btn-filled text-xs py-2 px-4"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User Account</span>
            </button>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b text-[10px] text-slate-400 uppercase font-bold" style={{ borderColor: 'var(--theme-surface-border)' }}>
                  <th className="py-2.5 px-3">Full Name / Username</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last Login</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--theme-surface-border)' }}>
                {realUsersList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      No additional accounts created yet. Click "Add User Account" to add Supervisors or Viewers.
                    </td>
                  </tr>
                ) : (
                  realUsersList.map((u) => {
                    const badge = PermissionManager.getRoleBadgeStyle(u.role);
                    const isLocked = u.lockoutUntil && new Date(u.lockoutUntil).getTime() > Date.now();
                    const isDisabled = u.isActive === false;

                    return (
                      <tr key={u.id} className="hover:bg-slate-500/5">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">{u.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase font-mono-tabular ${badge.badgeClass}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {isDisabled ? (
                            <span className="text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Disabled</span>
                          ) : isLocked ? (
                            <span className="text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Locked Out</span>
                          ) : u.mustChangePassword ? (
                            <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">Temp Password</span>
                          ) : (
                            <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Unlock button if locked out */}
                            {isLocked && onUnlockUser && (
                              <button
                                onClick={() => {
                                  onUnlockUser(u.id);
                                  showStatus('success', `Unlocked account @${u.username}`);
                                }}
                                className="px-2 py-1 rounded text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 flex items-center gap-1"
                              >
                                <Unlock className="w-3 h-3" />
                                Unlock
                              </button>
                            )}

                            {/* Edit Role/Details */}
                            <button
                              onClick={() => {
                                setEditTargetUser(u);
                                setEditFullName(u.fullName);
                                setEditRole(u.role);
                              }}
                              className="px-2 py-1 rounded text-[10px] font-bold text-slate-400 hover:text-white bg-slate-500/10 border border-slate-500/20 hover:bg-slate-500/20 flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => {
                                setResetTargetUser(u);
                                setAdminTempPass('');
                              }}
                              className="px-2 py-1 rounded text-[10px] font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 flex items-center gap-1"
                            >
                              <KeyRound className="w-3 h-3" />
                              Reset Pass
                            </button>

                            {/* Enable/Disable Toggle */}
                            {onToggleUserActive && (
                              <button
                                onClick={() => {
                                  const actionText = isDisabled ? 'Enable' : 'Disable';
                                  setConfirmActionModal({
                                    title: `${actionText} User Account`,
                                    message: `Are you sure you want to ${actionText.toLowerCase()} account for @${u.username}?`,
                                    actionType: 'disable',
                                    onConfirm: () => {
                                      try {
                                        onToggleUserActive(u.id, isDisabled);
                                        showStatus('success', `Account @${u.username} ${isDisabled ? 'enabled' : 'disabled'}.`);
                                      } catch (err: any) {
                                        showStatus('error', err.message || 'Cannot update account status.');
                                      }
                                      setConfirmActionModal(null);
                                    },
                                  });
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 ${
                                  isDisabled
                                    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                                    : 'text-rose-500 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20'
                                }`}
                              >
                                {isDisabled ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                {isDisabled ? 'Enable' : 'Disable'}
                              </button>
                            )}
                          </div>
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

      {/* SHOP SETTINGS FORM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleSaveSettings} className="m3-card p-5 space-y-4">
          <h3 className="text-base font-bold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
            <Store className="w-4 h-4 text-blue-500" />
            Shop & Business Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">Business / Shop Name</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="m3-input"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Proprietor Name</label>
              <input
                type="text"
                required
                value={proprietorName}
                onChange={(e) => setProprietorName(e.target.value)}
                className="m3-input"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="m3-input font-mono-tabular"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">City / Location</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="m3-input"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Registration / NTN #</label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                className="m3-input font-mono-tabular"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">Shop Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="m3-input"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Security App Lock PIN (4 Digits)</label>
              <input
                type="password"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="m3-input font-mono-tabular tracking-widest text-center"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {savedSuccess && (
              <span className="text-xs font-bold flex items-center gap-1 text-emerald-500">
                <Check className="w-4 h-4" />
                Settings Saved!
              </span>
            )}
            <button
              type="submit"
              className="m3-btn-base m3-btn-filled ml-auto text-xs py-2 px-4"
            >
              Save Profile
            </button>
          </div>
        </form>

        {/* DATABASE BACKUP & RESTORE */}
        <div className="m3-card p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
              <Shield className="w-4 h-4 text-emerald-500" />
              Offline Database Backup & Restore
            </h3>
            <p className="text-xs text-slate-400">
              Your application operates completely offline without external server databases. Export backups regularly to preserve ledger entries and records.
            </p>

            <div className="p-4 rounded-xl border space-y-3 bg-slate-500/5" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <button
                onClick={handleDownloadBackup}
                className="m3-btn-base m3-btn-tonal w-full py-2.5 text-xs"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON Database Backup</span>
              </button>

              <label className="m3-btn-base m3-btn-outlined w-full py-2.5 cursor-pointer text-xs justify-center">
                <Upload className="w-4 h-4" />
                <span>Import JSON Backup File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Danger Zone: Reset to Demo */}
          {currentUser?.role === 'ADMIN' && (
            <div className="p-4 rounded-xl border space-y-2 bg-rose-500/10 border-rose-500/25">
              <h4 className="text-xs font-bold text-rose-500">Restore Demo Factory State</h4>
              <p className="text-[11px] text-slate-400">
                Resets customers, agreements, and stock items back to initial Pakistan Trader Corp demo data.
              </p>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to restore demo dataset? Current changes will be overwritten.')) {
                    onResetDemoData();
                  }
                }}
                className="m3-btn-base m3-btn-outlined text-xs py-1.5 text-rose-500 border-rose-500/30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Demo Data</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD USER ACCOUNT */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                Create New User Account
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g., Ali Raza"
                  className="m3-input"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Unique Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g., aliraza"
                  className="m3-input font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Account Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="m3-input font-bold"
                >
                  <option value="SUPERVISOR">SUPERVISOR (Add-Only)</option>
                  <option value="VIEWER">VIEWER (Read-Only & Export)</option>
                  <option value="ADMIN">ADMIN (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Temporary Password</label>
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Temporary password (min 6 chars)"
                  className="m3-input font-mono"
                  required
                  minLength={6}
                />
                <p className="text-[10px] text-amber-400 mt-1">User will be required to change password upon first login.</p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="m3-btn-base m3-btn-outlined py-2 px-4">
                  Cancel
                </button>
                <button type="submit" className="m3-btn-base m3-btn-filled py-2 px-6">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-500" />
                Reset Password for @{resetTargetUser.username}
              </h3>
              <button onClick={() => setResetTargetUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Enter a new temporary password for <strong>{resetTargetUser.fullName}</strong>. The user will be required to update it at next login.
              </p>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">New Temporary Password</label>
                <input
                  type="text"
                  value={adminTempPass}
                  onChange={(e) => setAdminTempPass(e.target.value)}
                  placeholder="Min 6 characters..."
                  className="m3-input font-mono"
                  required
                  minLength={6}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setResetTargetUser(null)} className="m3-btn-base m3-btn-outlined py-2 px-4">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteResetPassword}
                  className="m3-btn-base m3-btn-filled py-2 px-6"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER DETAILS / ROLE */}
      {editTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-500" />
                Edit User Details: @{editTargetUser.username}
              </h3>
              <button onClick={() => setEditTargetUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="m3-input"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="m3-input font-bold"
                >
                  <option value="SUPERVISOR">SUPERVISOR (Add-Only)</option>
                  <option value="VIEWER">VIEWER (Read-Only)</option>
                  <option value="ADMIN">ADMIN (Full Control)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditTargetUser(null)} className="m3-btn-base m3-btn-outlined py-2 px-4">
                  Cancel
                </button>
                <button type="button" onClick={handleExecuteEditUser} className="m3-btn-base m3-btn-filled py-2 px-6">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmActionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center gap-3 text-amber-500">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold">{confirmActionModal.title}</h3>
            </div>

            <p className="text-xs text-slate-300">{confirmActionModal.message}</p>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setConfirmActionModal(null)}
                className="m3-btn-base m3-btn-outlined py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={confirmActionModal.onConfirm}
                className="m3-btn-base m3-btn-filled py-2 px-5 bg-rose-600 hover:bg-rose-500"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
