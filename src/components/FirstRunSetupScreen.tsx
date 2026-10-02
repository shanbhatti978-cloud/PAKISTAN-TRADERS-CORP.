import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface FirstRunSetupScreenProps {
  onSetupRealAdmin: (data: {
    fullName: string;
    username: string;
    password: string;
    shopName?: string;
  }) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  isLight?: boolean;
}

export const FirstRunSetupScreen: React.FC<FirstRunSetupScreenProps> = ({
  onSetupRealAdmin,
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password validation: minimum 8 chars, at least one number
  const hasMinLen = password.length >= 8;
  const hasDigit = /\d/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = hasMinLen && hasDigit && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !username.trim()) {
      setErrorMsg('Please enter your full name and username.');
      return;
    }

    if (!hasMinLen) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (!hasDigit) {
      setErrorMsg('Password must contain at least one number (0-9).');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await onSetupRealAdmin({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        password,
        shopName: shopName.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.message || 'Failed to initialize Admin account.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during account setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans transition-colors bg-bg text-text">
      <div className="w-full max-w-lg rounded-3xl border border-border shadow-3 p-6 sm:p-8 space-y-6 relative overflow-hidden backdrop-blur-xl bg-surface">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-24 bg-gradient-to-b from-primary/20 to-transparent blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-container text-on-primary-container border border-border">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>First-Run Owner Setup</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading text-text">
            Create Your Owner Admin Account
          </h1>

          <p className="text-xs font-semibold text-text-muted max-w-md mx-auto">
            Set up your permanent Master Admin credentials. Creating your account permanently deletes all default demo credentials from the system.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          
          {/* Shop Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>Shop / Enterprise Name (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Pakistan Traders Corp"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="m3-input text-xs"
            />
          </div>

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="Proprietor Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="m3-input text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted">
                Admin Username *
              </label>
              <input
                type="text"
                placeholder="e.g. owner_admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="m3-input text-xs font-mono"
                required
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted">
                Admin Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="m3-input text-xs font-mono pr-8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted">
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="m3-input text-xs font-mono"
                required
              />
            </div>
          </div>

          {/* Password Strength Checklist */}
          <div className="p-3 rounded-2xl border text-xs space-y-1.5 bg-surface-2 border-border">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
              Security Requirements
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
              <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-success font-bold' : 'text-text-subtle'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>At least 8 characters</span>
              </div>

              <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-success font-bold' : 'text-text-subtle'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>At least 1 digit (0-9)</span>
              </div>

              <div className={`col-span-2 flex items-center gap-1.5 ${passwordsMatch ? 'text-success font-bold' : 'text-text-subtle'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Passwords match</span>
              </div>
            </div>
          </div>

          {/* Security Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-warning-container text-on-warning-container border border-border text-xs font-semibold flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="leading-snug">
              Creating your Master Admin account will permanently wipe all default demo credentials (<code className="font-mono bg-surface/50 px-1 py-0.5 rounded">admin123</code>, <code className="font-mono bg-surface/50 px-1 py-0.5 rounded">super123</code>, <code className="font-mono bg-surface/50 px-1 py-0.5 rounded">view123</code>). Demo logins can never be used again.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-danger-container text-on-danger-container border border-border text-xs font-bold flex items-center gap-2 animate-in shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isPasswordValid || !fullName.trim() || !username.trim() || isSubmitting}
            className="w-full m3-btn-base m3-btn-filled text-xs py-3.5 rounded-2xl shadow-2 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Initializing Master Admin...' : 'Create Account & Wipe Demo Credentials'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

      </div>
    </div>
  );
};
