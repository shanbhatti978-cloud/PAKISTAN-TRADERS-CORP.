import React, { useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { User } from '../types';

interface ForcePasswordChangeModalProps {
  currentUser: User;
  isOpen: boolean;
  onChangePassword: (newPassword: string) => { success: boolean; message: string };
  isLight?: boolean;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({
  currentUser,
  isOpen,
  onChangePassword,
  isLight = false,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const hasMinLen = newPassword.length >= 8;
  const hasDigit = /\d/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isValid = hasMinLen && hasDigit && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!hasMinLen) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (!hasDigit) {
      setErrorMsg('Password must contain at least one number (0-9).');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    const res = onChangePassword(newPassword);
    if (res.success) {
      setSuccessMsg('Your password has been updated successfully!');
      setTimeout(() => {
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMsg('');
      }, 800);
    } else {
      setErrorMsg(res.message || 'Failed to update password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden ${
        isLight ? 'bg-surface border-border text-text' : 'bg-surface border-border text-text'
      }`}>
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 inline-flex">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>
          
          <h2 className="text-heading font-heading font-extrabold tracking-tight text-text">
            Mandatory Password Update
          </h2>

          <p className="text-caption font-medium text-text-muted">
            Welcome, <strong className="text-primary font-bold uppercase">{currentUser.username}</strong>! Your account was assigned a temporary password. You must set a new secure password before proceeding.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-body-sm font-bold text-text">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="m3-input text-body font-mono pr-10"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-body-sm font-bold text-text">
              Confirm New Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter new password..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="m3-input text-body font-mono"
              required
            />
          </div>

          {/* Validation Checklist */}
          <div className="p-3.5 rounded-2xl border text-caption space-y-2 bg-surface-2 border-border">
            <div className="text-caption font-bold uppercase tracking-wider text-text-muted">
              Security Checklist
            </div>
            <div className="space-y-1.5 text-caption font-semibold">
              <div className={`flex items-center gap-2 ${hasMinLen ? 'text-success font-bold' : 'text-text-muted'}`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-2 ${hasDigit ? 'text-success font-bold' : 'text-text-muted'}`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>At least 1 digit (0-9)</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-success font-bold' : 'text-text-muted'}`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Passwords match</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-caption font-bold flex items-center gap-2 animate-in shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-caption font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid}
            className="w-full m3-btn-base m3-btn-filled text-body-sm py-3.5 rounded-2xl shadow-xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Update Password & Continue</span>
          </button>
        </form>

      </div>
    </div>
  );
};
