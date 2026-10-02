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
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 inline-flex">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>
          
          <h2 className="text-xl font-black tracking-tight font-heading">
            Mandatory Password Update
          </h2>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Welcome, <strong className="text-blue-500 uppercase">{currentUser.username}</strong>! Your account was assigned a temporary password. You must set a new secure password before proceeding.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="m3-input text-xs font-mono pr-8"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Confirm New Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter new password..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="m3-input text-xs font-mono"
              required
            />
          </div>

          {/* Validation Checklist */}
          <div className="p-3 rounded-2xl border text-xs space-y-1.5 bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Security Checklist
            </div>
            <div className="space-y-1 text-[11px] font-semibold">
              <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>At least 1 digit (0-9)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Passwords match</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-in shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid}
            className="w-full m3-btn-base m3-btn-filled text-xs py-3 rounded-2xl shadow-xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Update Password & Continue</span>
          </button>
        </form>

      </div>
    </div>
  );
};
