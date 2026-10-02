import React, { useState } from 'react';
import {
  X,
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  Lock,
} from 'lucide-react';
import { User } from '../types';

interface UserLoginModalProps {
  users: User[];
  currentUser: User;
  hasRealAdmin?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onLogin: (
    username: string,
    passwordAttempt: string
  ) => Promise<{ success: boolean; message: string; mustChangePassword?: boolean }> | { success: boolean; message: string; mustChangePassword?: boolean };
  onChangeOwnPassword?: (oldPass: string, newPass: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  isLight?: boolean;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({
  users,
  currentUser,
  hasRealAdmin = false,
  isOpen,
  onClose,
  onLogin,
  onChangeOwnPassword,
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Forced Password Change state if account has mustChangePassword
  const [mustChangeMode, setMustChangeMode] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setUsername('');
    setPassword('');
    setErrorMsg('');
    setSuccessMsg('');
    setMustChangeMode(false);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await onLogin(username.trim(), password);
      
      if (res.success) {
        if (res.mustChangePassword) {
          setMustChangeMode(true);
          setSuccessMsg('Temporary password verified. Please set a new permanent password to continue.');
        } else {
          setSuccessMsg(`Welcome, ${username.trim()}`);
          setTimeout(() => {
            handleClose();
          }, 600);
        }
      } else {
        setErrorMsg(res.message || 'Invalid username or password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForcePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (!/\d/.test(newPassword)) {
      setErrorMsg('Password must contain at least one number (0-9).');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!onChangeOwnPassword) {
      setErrorMsg('Password update handler not available.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await onChangeOwnPassword(password, newPassword);
      if (res.success) {
        setSuccessMsg('Password updated successfully! Redirecting...');
        setTimeout(() => {
          handleClose();
        }, 800);
      } else {
        setErrorMsg(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred updating password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-scrim backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl border border-border shadow-3 overflow-hidden p-6 space-y-6 relative bg-surface text-text">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary-container text-on-primary-container border border-border">
              <KeyRound className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight font-heading text-text">
                {mustChangeMode ? 'Update Temporary Password' : 'Account Login'}
              </h2>
              <p className="text-xs font-semibold text-text-muted">
                {mustChangeMode ? 'Password change required before proceeding' : 'Enter your credentials to sign in'}
              </p>
            </div>
          </div>

          {!mustChangeMode && (
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl text-text-subtle hover:text-text transition-all border border-border bg-surface-2"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Subtle Demo Mode Badge (Only while demo accounts exist) */}
        {!hasRealAdmin && !mustChangeMode && (
          <div className="p-3 rounded-2xl bg-warning-container text-on-warning-container border border-border text-xs font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <Shield className="w-4 h-4 text-warning" />
              Demo mode active
            </span>
            <span className="text-[10px] font-mono bg-surface/50 px-2 py-0.5 rounded-full font-bold">
              Default users enabled
            </span>
          </div>
        )}

        {/* FORCED PASSWORD CHANGE FORM */}
        {mustChangeMode ? (
          <form onSubmit={handleForcePasswordChangeSubmit} className="space-y-4">
            <div className="p-3 rounded-2xl bg-info-container text-on-info-container border border-border text-xs font-medium">
              You logged in with a temporary password or admin reset. Please set a new password (min 8 chars, 1 digit).
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars with 1 number..."
                  className="m3-input pr-10 font-mono text-sm"
                  required
                  minLength={8}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted">
                Confirm New Password
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password..."
                className="m3-input font-mono text-sm"
                required
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-danger-container text-on-danger-container border border-border text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-2xl bg-success-container text-on-success-container border border-border text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="m3-btn-base m3-btn-filled w-full text-xs py-3 shadow-2 active:scale-98 cursor-pointer justify-center"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Updating...' : 'Save New Password & Continue'}</span>
            </button>
          </form>
        ) : (
          /* STANDARD LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="m3-input text-sm font-medium"
                required
                autoFocus
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="m3-input pr-10 text-sm font-medium"
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-danger-container text-on-danger-container border border-border text-xs font-bold flex items-center gap-2 animate-in shake duration-150">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-2xl bg-success-container text-on-success-container border border-border text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="m3-btn-base m3-btn-outlined text-xs py-2.5 px-4"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="m3-btn-base m3-btn-filled text-xs py-2.5 px-6 shadow-2 active:scale-95 transition-transform cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
