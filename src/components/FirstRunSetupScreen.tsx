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
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';

interface FirstRunSetupScreenProps {
  onSetupRealAdmin: (data: {
    fullName: string;
    username: string;
    password: string;
    shopName?: string;
    proprietorName?: string;
    phone?: string;
    address?: string;
    city?: string;
    regNumber?: string;
    keepDemoData?: boolean;
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
  const [shopName, setShopName] = useState('Pakistan Trader Corporation');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [keepDemoData, setKeepDemoData] = useState(false);
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
        shopName: shopName.trim() || 'Pakistan Trader Corporation',
        proprietorName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        regNumber: regNumber.trim(),
        keepDemoData,
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
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans transition-colors bg-bg text-text"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-border shadow-3 p-6 sm:p-8 space-y-6 relative overflow-hidden backdrop-blur-xl bg-surface my-auto">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-24 bg-gradient-to-b from-primary/20 to-transparent blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-caption font-bold uppercase tracking-wider bg-primary-container text-on-primary-container border border-border">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>First-Run Owner Setup</span>
          </div>

          <h1 className="text-display font-black tracking-tight font-heading text-text">
            Create Your Owner Admin Account
          </h1>

          <p className="text-caption font-medium text-text-muted max-w-md mx-auto">
            Set up your permanent Master Admin credentials and enterprise business profile.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          
          {/* Shop Name & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-body-sm font-bold text-text flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Shop / Enterprise Name *</span>
              </label>
              <input
                type="text"
                placeholder="Pakistan Trader Corporation"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="m3-input text-body"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-body-sm font-bold text-text flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-primary" />
                <span>Shop Phone / Contact</span>
              </label>
              <input
                type="text"
                placeholder="e.g. +92 300 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="m3-input text-body font-mono"
              />
            </div>
          </div>

          {/* Location & NTN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-body-sm font-bold text-text flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Shop Address</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Main Market, Hall Road"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="m3-input text-body"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-body-sm font-bold text-text">City</label>
              <input
                type="text"
                placeholder="Lahore"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="m3-input text-body"
              />
            </div>
          </div>

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-body-sm font-bold text-text">
                Proprietor / Owner Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Muhammad Imran"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="m3-input text-body"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-body-sm font-bold text-text">
                Admin Username *
              </label>
              <input
                type="text"
                placeholder="e.g. owner_admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="m3-input text-body font-mono"
                required
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-body-sm font-bold text-text">
                Admin Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="m3-input text-body font-mono pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-body-sm font-bold text-text">
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="m3-input text-body font-mono"
                required
              />
            </div>
          </div>

          {/* Password Strength Rules Checklist */}
          <div className="p-3 rounded-2xl bg-surface-2 border border-border text-caption font-medium space-y-1">
            <div className="flex items-center gap-2">
              {hasMinLen ? <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-text-muted shrink-0" />}
              <span className={hasMinLen ? 'text-success font-bold' : 'text-text-muted'}>At least 8 characters long</span>
            </div>
            <div className="flex items-center gap-2">
              {hasDigit ? <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-text-muted shrink-0" />}
              <span className={hasDigit ? 'text-success font-bold' : 'text-text-muted'}>At least one numeric digit (0-9)</span>
            </div>
            <div className="flex items-center gap-2">
              {passwordsMatch ? <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-text-muted shrink-0" />}
              <span className={passwordsMatch ? 'text-success font-bold' : 'text-text-muted'}>Passwords match</span>
            </div>
          </div>

          {/* Dataset Option */}
          <div className="p-4 rounded-2xl border border-border bg-surface-2 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={keepDemoData}
                onChange={(e) => setKeepDemoData(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary mt-0.5"
              />
              <div className="space-y-0.5 text-body-sm">
                <span className="font-bold text-text block">Keep Pakistan Traders Corp sample demo dataset</span>
                <p className="text-caption text-text-muted leading-snug">
                  Uncheck (recommended for real shop) to start with a clean empty database.
                </p>
              </div>
            </label>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-body-sm font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isPasswordValid || isSubmitting}
            className="m3-btn-base m3-btn-filled w-full py-3.5 text-body font-bold flex items-center justify-center gap-2 shadow-2 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Creating Master Admin...' : 'Initialize Enterprise & Complete Setup'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
