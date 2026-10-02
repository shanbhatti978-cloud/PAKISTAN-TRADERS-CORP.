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
import { ShopSettings, AuditLog, User as UserType, UserRole, DrawerSidePreference } from '../types';
import { M3_THEME_COLORS, normalizeThemeColor, M3ThemeColor } from '../theme/m3Theme';
import { GLASS_THEMES, GlassThemeId, migrateColorScheme } from '../theme/glassThemes';
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
            <h3 className="text-title font-bold font-heading flex items-center gap-2 text-text" style={{ color: 'var(--theme-text-primary)' }}>
              <User className="w-4 h-4 text-primary" />
              My Account Settings
            </h3>
            <p className="text-caption text-text-muted font-medium">
              Logged in as <strong className="text-primary uppercase font-mono">{currentUser?.username}</strong> ({currentUser?.role})
            </p>
          </div>

          {currentUser && (
            <span className={`px-3 py-1 rounded-full text-caption font-black uppercase border font-mono-tabular ${
              PermissionManager.getRoleBadgeStyle(currentUser.role).badgeClass
            }`}>
              {currentUser.role}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Display Name Update */}
          <form onSubmit={handleUpdateOwnProfile} className="space-y-3 p-4 rounded-2xl border bg-surface-2" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <h4 className="text-caption font-bold uppercase tracking-wider text-text-muted">Profile Details</h4>
            <div>
              <label className="block text-caption font-bold text-text-muted mb-1">Full Name</label>
              <input
                type="text"
                value={ownFullName}
                onChange={(e) => setOwnFullName(e.target.value)}
                className="m3-input text-body"
                required
              />
            </div>
            <button type="submit" className="m3-btn-base m3-btn-tonal text-body-sm font-bold py-2 px-4">
              Update Name
            </button>
          </form>

          {/* Change Own Password */}
          <form onSubmit={handleChangeOwnPassword} className="space-y-3 p-4 rounded-2xl border bg-surface-2" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <h4 className="text-caption font-bold uppercase tracking-wider text-text-muted">Change Password</h4>
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Current Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="m3-input text-body"
                required
              />
              <input
                type="password"
                placeholder="New Password (min 8 chars, 1 digit)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="m3-input text-body"
                required
                minLength={8}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="m3-input text-body"
                required
              />
            </div>

            {ownPasswordMsg && (
              <div className={`p-2 rounded-xl text-caption font-bold flex items-center gap-2 ${
                ownPasswordMsg.type === 'success' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
              }`}>
                {ownPasswordMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{ownPasswordMsg.message}</span>
              </div>
            )}

            <button type="submit" className="m3-btn-base m3-btn-filled text-body-sm font-bold py-2 px-4">
              Update Password
            </button>
          </form>
        </div>
      </div>

      {/* APPEARANCE & GLASS THEMES SYSTEM */}
      <div className="m3-card p-5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--theme-surface-border)' }}>
          <div>
            <h3 className="text-base font-bold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
              <Palette className="w-4 h-4 text-primary" />
              <span>Appearance & Glass Material Themes</span>
            </h3>
            <p className="text-xs text-text-subtle">
              8 hand-crafted materials with ambient blurred float orbs, translucent glass, and WCAG AA contrast.
            </p>
          </div>

          {/* Quick Mode & Preference Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mode Switch: Light / Dark */}
            <div className="flex items-center p-1 rounded-xl border border-border bg-surface-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  const root = document.documentElement;
                  root.classList.add('theme-transition');
                  setSettings((prev) => ({ ...prev, themeMode: 'light' }));
                  setTimeout(() => root.classList.remove('theme-transition'), 250);
                }}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  settings.themeMode === 'light'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const root = document.documentElement;
                  root.classList.add('theme-transition');
                  setSettings((prev) => ({ ...prev, themeMode: 'dark' }));
                  setTimeout(() => root.classList.remove('theme-transition'), 250);
                }}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  settings.themeMode !== 'light'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Controls Row: Drawer Side, Text Size, Lite Mode, Animated Blobs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl border border-border bg-surface-2/40 text-body-sm">
          {/* 1. Drawer Position */}
          <div className="space-y-1.5">
            <label className="font-bold text-caption uppercase tracking-wider text-text-muted block">
              Drawer Position
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface border border-border">
              {(['left', 'auto', 'right'] as DrawerSidePreference[]).map((pos) => {
                const isSelected = (settings.drawerSide || 'auto') === pos;
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => {
                      setSettings((prev) => ({ ...prev, drawerSide: pos }));
                      showStatus('success', `Drawer side set to ${pos.toUpperCase()}`);
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold uppercase text-caption transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'text-text-muted hover:bg-primary/10 hover:text-text'
                    }`}
                  >
                    {pos}
                  </button>
                );
              })}
            </div>
            <p className="text-caption text-text-muted font-medium">
              Auto opens from the same side as the button.
            </p>
          </div>

          {/* 2. Text Size Scaling */}
          <div className="space-y-1.5">
            <label className="font-bold text-caption uppercase tracking-wider text-text-muted block">
              Text Size
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface border border-border">
              {[
                { id: 'normal', label: 'Normal' },
                { id: 'large', label: 'Large' },
                { id: 'extra_large', label: 'Extra' },
              ].map((opt) => {
                const currentFontSize = settings.fontSize || 'normal';
                const isSelected = currentFontSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSettings((prev) => ({
                        ...prev,
                        fontSize: opt.id as any,
                      }));
                      showStatus('success', `Text size set to ${opt.label}`);
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold text-caption transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'text-text-muted hover:bg-primary/10 hover:text-text'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="text-caption text-text-muted font-medium">
              100% / 112% / 125% root font scale.
            </p>
          </div>

          {/* 3. Lite Mode Toggle */}
          <div className="space-y-1.5">
            <label className="font-bold text-caption uppercase tracking-wider text-text-muted block">
              Display Mode
            </label>
            <button
              type="button"
              onClick={() => {
                const next = !settings.liteMode;
                setSettings((prev) => ({ ...prev, liteMode: next }));
                showStatus(
                  'success',
                  next ? 'Lite mode enabled (solid surfaces, no blur)' : 'Glass materials enabled'
                );
              }}
              className={`w-full py-2 px-3 rounded-xl border font-bold text-caption flex items-center justify-between transition-all cursor-pointer h-10 ${
                settings.liteMode
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                  : 'bg-surface border-border text-text hover:border-primary'
              }`}
            >
              <span>Lite Mode</span>
              <span className="font-mono text-caption uppercase">
                {settings.liteMode ? 'ON' : 'OFF'}
              </span>
            </button>
            <p className="text-caption text-text-muted font-medium">
              Solid surfaces for low-end phones.
            </p>
          </div>

          {/* 4. Animated Background Toggle */}
          <div className="space-y-1.5">
            <label className="font-bold text-caption uppercase tracking-wider text-text-muted block">
              Ambient Orbs
            </label>
            <button
              type="button"
              onClick={() => {
                const next = settings.animatedBackground === false ? true : false;
                setSettings((prev) => ({ ...prev, animatedBackground: next }));
                showStatus(
                  'success',
                  next ? 'Ambient floating orbs active' : 'Ambient animation paused'
                );
              }}
              className={`w-full py-2 px-3 rounded-xl border font-bold text-caption flex items-center justify-between transition-all cursor-pointer h-10 ${
                settings.animatedBackground !== false
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-surface border-border text-text hover:border-primary'
              }`}
            >
              <span>Floating Blobs</span>
              <span className="font-mono text-caption uppercase">
                {settings.animatedBackground !== false ? 'ON' : 'PAUSED'}
              </span>
            </button>
            <p className="text-caption text-text-muted font-medium">
              Smooth floating glow animation.
            </p>
          </div>
        </div>

        {/* 8 Themes Material Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-caption uppercase tracking-wider text-text-muted">
              Choose Glass Material Palette
            </h4>
            <span className="text-caption text-text-muted font-mono">
              Live Apply (250ms Cross-Fade)
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(GLASS_THEMES).map((theme) => {
              const currentId = migrateColorScheme(settings.colorScheme);
              const isSelected = currentId === theme.id;
              const isLight = settings.themeMode === 'light';
              const variant = isLight ? theme.light : theme.dark;

              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    const root = document.documentElement;
                    root.classList.add('theme-transition');
                    setSettings((prev) => ({ ...prev, colorScheme: theme.id }));
                    setTimeout(() => root.classList.remove('theme-transition'), 250);
                  }}
                  className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer overflow-hidden group select-none flex flex-col justify-between h-44 ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/50 shadow-md bg-surface scale-[1.02]'
                      : 'border-border/80 bg-surface/60 hover:bg-surface hover:border-primary/50'
                  }`}
                >
                  {/* Miniature Glass Mockup Canvas */}
                  <div
                    className="relative w-full h-20 rounded-xl overflow-hidden border border-white/20 p-2 flex flex-col justify-between mb-2 shadow-inner"
                    style={{ background: variant.bgGradient }}
                  >
                    {/* Two Mini Blurred Ambient Blobs */}
                    <div
                      className="absolute -top-3 -left-3 w-12 h-12 rounded-full blur-[10px] opacity-70"
                      style={{ background: variant.blobA }}
                    />
                    <div
                      className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full blur-[10px] opacity-70"
                      style={{ background: variant.blobB }}
                    />

                    {/* Mini Glass Sample Card inside */}
                    <div
                      className="relative z-10 w-full h-10 rounded-lg border flex items-center justify-between px-2 text-[9px] font-bold shadow-2xs"
                      style={{
                        background: variant.glassFillStrong,
                        borderColor: variant.glassBorder,
                        color: variant.text,
                      }}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: variant.primary }}
                        />
                        <span className="truncate">{theme.name.split(' ')[0]}</span>
                      </div>
                      <span
                        className="px-1 py-0.5 rounded text-[7px] shrink-0 font-mono"
                        style={{
                          background: variant.primaryContainer,
                          color: variant.onPrimaryContainer,
                        }}
                      >
                        Sample
                      </span>
                    </div>

                    {/* Mini Bottom Dock Dot */}
                    <div className="relative z-10 mx-auto flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/20 bg-white/40 dark:bg-white/10">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: variant.primary }}
                      />
                      <span className="w-1 h-1 rounded-full bg-slate-400" />
                      <span className="w-1 h-1 rounded-full bg-slate-400" />
                    </div>
                  </div>

                  {/* Theme Info & Selection Check */}
                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-text truncate font-heading">
                        {theme.name}
                      </div>
                      <div className="text-[10px] text-text-subtle truncate">
                        {theme.subtitle}
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                        ✓
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-border shrink-0 group-hover:border-primary/50" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ADMIN: SYSTEM USER MANAGEMENT SECTION */}
      {currentUser?.role === 'ADMIN' && (
        <div className="m3-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
            <div>
              <h3 className="text-title font-bold font-heading flex items-center gap-2 text-text" style={{ color: 'var(--theme-text-primary)' }}>
                <Shield className="w-4 h-4 text-primary" />
                User Access Control & Role Management
              </h3>
              <p className="text-caption text-text-muted font-medium">
                Create & manage Supervisor & Viewer accounts. Passwords are securely hashed with per-user cryptographic salts.
              </p>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="m3-btn-base m3-btn-filled text-body-sm font-bold py-2 px-4"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User Account</span>
            </button>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-body-sm">
              <thead>
                <tr className="border-b text-caption text-text-muted uppercase font-bold" style={{ borderColor: 'var(--theme-surface-border)' }}>
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
                    <td colSpan={5} className="py-4 text-center text-text-muted font-semibold">
                      No additional accounts created yet. Click "Add User Account" to add Supervisors or Viewers.
                    </td>
                  </tr>
                ) : (
                  realUsersList.map((u) => {
                    const badge = PermissionManager.getRoleBadgeStyle(u.role);
                    const isLocked = u.lockoutUntil && new Date(u.lockoutUntil).getTime() > Date.now();
                    const isDisabled = u.isActive === false;

                    return (
                      <tr key={u.id} className="hover:bg-primary/5">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-text">{u.fullName}</div>
                          <div className="text-caption text-text-muted font-mono font-medium">@{u.username}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-caption font-black border uppercase font-mono-tabular ${badge.badgeClass}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {isDisabled ? (
                            <span className="text-danger font-bold bg-danger/10 px-2.5 py-0.5 rounded-full border border-danger/20 text-caption">Disabled</span>
                          ) : isLocked ? (
                            <span className="text-warning font-bold bg-warning/10 px-2.5 py-0.5 rounded-full border border-warning/20 text-caption">Locked Out</span>
                          ) : u.mustChangePassword ? (
                            <span className="text-warning font-bold bg-warning/10 px-2.5 py-0.5 rounded-full border border-warning/20 text-caption">Temp Password</span>
                          ) : (
                            <span className="text-success font-bold bg-success/10 px-2.5 py-0.5 rounded-full border border-success/20 text-caption">Active</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-text-muted font-mono text-caption font-medium">
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
                                className="px-2.5 py-1 rounded text-caption font-bold text-warning bg-warning/10 border border-warning/20 hover:bg-warning/20 flex items-center gap-1"
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
                              className="px-2.5 py-1 rounded text-caption font-bold text-text-muted hover:text-text bg-surface-2 border border-border hover:bg-border flex items-center gap-1"
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
                              className="px-2.5 py-1 rounded text-caption font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 flex items-center gap-1"
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
                                className={`px-2.5 py-1 rounded text-caption font-bold border flex items-center gap-1 ${
                                  isDisabled
                                    ? 'text-success bg-success/10 border-success/20 hover:bg-success/20'
                                    : 'text-danger bg-danger/10 border-danger/20 hover:bg-danger/20'
                                }`}
                              >
                                {isDisabled ? (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    Enable
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3.5 h-3.5" />
                                    Disable
                                  </>
                                )}
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
          <h3 className="text-title font-bold font-heading flex items-center gap-2 text-text" style={{ color: 'var(--theme-text-primary)' }}>
            <Store className="w-4 h-4 text-primary" />
            Shop & Business Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
            <div className="sm:col-span-2">
              <label className="block text-text-muted font-bold text-caption mb-1">Business / Shop Name</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="m3-input text-body"
              />
            </div>

            <div>
              <label className="block text-text-muted font-bold text-caption mb-1">Proprietor Name</label>
              <input
                type="text"
                required
                value={proprietorName}
                onChange={(e) => setProprietorName(e.target.value)}
                className="m3-input text-body"
              />
            </div>

            <div>
              <label className="block text-text-muted font-bold text-caption mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="m3-input font-mono-tabular text-body"
              />
            </div>

            <div>
              <label className="block text-text-muted font-bold text-caption mb-1">City / Location</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="m3-input text-body"
              />
            </div>

            <div>
              <label className="block text-text-muted font-bold text-caption mb-1">Registration / NTN #</label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                className="m3-input font-mono-tabular text-body"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-text-muted font-bold text-caption mb-1">Shop Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="m3-input text-body"
              />
            </div>

            <div>
              <label className="block text-text-muted font-bold text-caption mb-1">Security App Lock PIN (4 Digits)</label>
              <input
                type="password"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="m3-input font-mono-tabular tracking-widest text-center text-body"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {savedSuccess && (
              <span className="text-body-sm font-bold flex items-center gap-1 text-success">
                <Check className="w-4 h-4" />
                Settings Saved!
              </span>
            )}
            <button
              type="submit"
              className="m3-btn-base m3-btn-filled ml-auto text-body-sm font-bold py-2.5 px-5"
            >
              Save Profile
            </button>
          </div>
        </form>

        {/* DATABASE BACKUP & RESTORE */}
        <div className="m3-card p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-title font-bold font-heading flex items-center gap-2 text-text" style={{ color: 'var(--theme-text-primary)' }}>
              <Shield className="w-4 h-4 text-success" />
              Offline Database Backup & Restore
            </h3>
            <p className="text-caption text-text-muted font-medium">
              Your application operates completely offline without external server databases. Export backups regularly to preserve ledger entries and records.
            </p>

            <div className="p-4 rounded-xl border space-y-3 bg-surface-2" style={{ borderColor: 'var(--theme-surface-border)' }}>
              <button
                onClick={handleDownloadBackup}
                className="m3-btn-base m3-btn-tonal w-full py-2.5 text-body-sm font-bold"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON Database Backup</span>
              </button>

              <label className="m3-btn-base m3-btn-outlined w-full py-2.5 cursor-pointer text-body-sm font-bold justify-center">
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
            <div className="p-4 rounded-xl border space-y-2 bg-danger/10 border-danger/25">
              <h4 className="text-body-sm font-bold text-danger">Restore Demo Factory State</h4>
              <p className="text-caption text-text-muted font-medium">
                Resets customers, agreements, and stock items back to initial Pakistan Trader Corp demo data.
              </p>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to restore demo dataset? Current changes will be overwritten.')) {
                    onResetDemoData();
                  }
                }}
                className="m3-btn-base m3-btn-outlined text-body-sm font-bold py-1.5 text-danger border-danger/30"
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
                <label className="block text-text-muted font-bold text-caption mb-1">Unique Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g., aliraza"
                  className="m3-input font-mono text-body"
                  required
                />
              </div>

              <div>
                <label className="block text-text-muted font-bold text-caption mb-1">Account Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="m3-input font-bold text-body"
                >
                  <option value="SUPERVISOR">SUPERVISOR (Add-Only)</option>
                  <option value="VIEWER">VIEWER (Read-Only & Export)</option>
                  <option value="ADMIN">ADMIN (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-text-muted font-bold text-caption mb-1">Temporary Password</label>
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Temporary password (min 6 chars)"
                  className="m3-input font-mono text-body"
                  required
                  minLength={6}
                />
                <p className="text-caption text-warning mt-1 font-semibold">User will be required to change password upon first login.</p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="m3-btn-base m3-btn-outlined py-2 px-4 font-bold text-body-sm">
                  Cancel
                </button>
                <button type="submit" className="m3-btn-base m3-btn-filled py-2 px-6 font-bold text-body-sm">
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
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 space-y-4 text-text shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-title font-bold flex items-center gap-2 font-heading">
                <KeyRound className="w-5 h-5 text-primary" />
                Reset Password for @{resetTargetUser.username}
              </h3>
              <button onClick={() => setResetTargetUser(null)} className="text-text-muted hover:text-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-body-sm">
              <p className="text-text-muted font-medium">
                Enter a new temporary password for <strong className="text-text">{resetTargetUser.fullName}</strong>. The user will be required to update it at next login.
              </p>

              <div>
                <label className="block text-text-muted font-bold text-caption mb-1">New Temporary Password</label>
                <input
                  type="text"
                  value={adminTempPass}
                  onChange={(e) => setAdminTempPass(e.target.value)}
                  placeholder="Min 6 characters..."
                  className="m3-input font-mono text-body"
                  required
                  minLength={6}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setResetTargetUser(null)} className="m3-btn-base m3-btn-outlined py-2 px-4 font-bold text-body-sm">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteResetPassword}
                  className="m3-btn-base m3-btn-filled py-2 px-6 font-bold text-body-sm"
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
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 space-y-4 text-text shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-title font-bold flex items-center gap-2 font-heading">
                <Edit2 className="w-5 h-5 text-primary" />
                Edit User Details: @{editTargetUser.username}
              </h3>
              <button onClick={() => setEditTargetUser(null)} className="text-text-muted hover:text-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-body-sm">
              <div>
                <label className="block text-text-muted font-bold text-caption mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="m3-input text-body"
                />
              </div>

              <div>
                <label className="block text-text-muted font-bold text-caption mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="m3-input font-bold text-body"
                >
                  <option value="SUPERVISOR">SUPERVISOR (Add-Only)</option>
                  <option value="VIEWER">VIEWER (Read-Only)</option>
                  <option value="ADMIN">ADMIN (Full Control)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditTargetUser(null)} className="m3-btn-base m3-btn-outlined py-2 px-4 font-bold text-body-sm">
                  Cancel
                </button>
                <button type="button" onClick={handleExecuteEditUser} className="m3-btn-base m3-btn-filled py-2 px-6 font-bold text-body-sm">
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
          <div className="w-full max-w-sm bg-surface border border-border rounded-3xl p-6 space-y-4 text-text shadow-2xl">
            <div className="flex items-center gap-3 text-warning">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-title font-bold font-heading">{confirmActionModal.title}</h3>
            </div>

            <p className="text-body-sm text-text-muted font-medium">{confirmActionModal.message}</p>

            <div className="pt-2 flex justify-end gap-2 text-body-sm">
              <button
                onClick={() => setConfirmActionModal(null)}
                className="m3-btn-base m3-btn-outlined py-2 px-4 font-bold"
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
