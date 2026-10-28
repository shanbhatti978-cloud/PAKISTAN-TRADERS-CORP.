import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, ShieldAlert } from 'lucide-react';
import { ShopSettings } from '../types';
import { hashPassword, verifyPassword, generateSecureSalt } from '../utils/activityLogger';

interface PinLockScreenProps {
  settings: ShopSettings;
  onUnlock: () => void;
  onUpdateSettings?: (updater: (prev: ShopSettings) => ShopSettings) => void;
}

const LOCKOUT_KEY = 'qistflow_pin_lockout_v1';

const getStoredLockout = (): { failedAttempts: number; lockoutUntil: number } => {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.failedAttempts === 'number' && typeof parsed.lockoutUntil === 'number') {
        return parsed;
      }
    }
  } catch {}
  return { failedAttempts: 0, lockoutUntil: 0 };
};

const saveLockout = (failedAttempts: number, lockoutUntil: number) => {
  try {
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ failedAttempts, lockoutUntil }));
  } catch {}
};

const clearLockout = () => {
  try {
    localStorage.removeItem(LOCKOUT_KEY);
  } catch {}
};

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  settings,
  onUnlock,
  onUpdateSettings,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // Is current PIN known to be factory default?
  const isFactoryDefault = settings.pinCode === '1234' || (!settings.pinCode && !settings.pinHash);

  // Read stored lockout state on mount and survive app restarts
  useEffect(() => {
    const stored = getStoredLockout();
    if (stored.lockoutUntil > Date.now()) {
      const remainingSecs = Math.ceil((stored.lockoutUntil - Date.now()) / 1000);
      setLockoutRemaining(remainingSecs);
      setFailedAttempts(stored.failedAttempts);
      setErrorMsg(`Security lockout active. Please wait ${remainingSecs}s.`);
    } else if (stored.failedAttempts > 0) {
      setFailedAttempts(stored.failedAttempts);
    }
  }, []);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
          return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0 || isVerifying) return;

    if (!pinInput || pinInput.length !== 4) {
      setErrorMsg('Please enter a valid 4-digit PIN.');
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMsg('');

      let isMatch = false;

      // 1. Verify against salted hash if present
      if (settings.pinHash && settings.pinSalt) {
        isMatch = await verifyPassword(pinInput, settings.pinSalt, settings.pinHash);
      } else if (settings.pinCode) {
        // Plaintext legacy PIN
        isMatch = pinInput === settings.pinCode;
      } else {
        // Fallback to factory default only if neither is configured
        isMatch = pinInput === '1234';
      }

      if (isMatch) {
        // Clear stored lockout on success
        clearLockout();
        setFailedAttempts(0);
        setErrorMsg('');

        // Migrate plaintext PIN to salted hash on first successful unlock
        if (!settings.pinHash || settings.pinCode) {
          try {
            const newSalt = generateSecureSalt();
            const newHash = await hashPassword(pinInput, newSalt);
            onUpdateSettings?.((prev) => ({
              ...prev,
              pinHash: newHash,
              pinSalt: newSalt,
              pinCode: undefined, // remove plaintext PIN
              isLocked: false,
            }));
          } catch {
            // If migration fails, proceed to unlock
          }
        }

        onUnlock();
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        setPinInput('');

        let lockDurationSecs = 0;
        if (newAttempts >= 15) {
          lockDurationSecs = 600; // 10 minutes
        } else if (newAttempts >= 10) {
          lockDurationSecs = 120; // 2 minutes
        } else if (newAttempts >= 5) {
          lockDurationSecs = 30; // 30 seconds
        }

        if (lockDurationSecs > 0) {
          const lockoutUntil = Date.now() + lockDurationSecs * 1000;
          saveLockout(newAttempts, lockoutUntil);
          setLockoutRemaining(lockDurationSecs);
          setErrorMsg(`Security lockout: ${newAttempts} incorrect attempts. Please wait ${lockDurationSecs} seconds.`);
        } else {
          saveLockout(newAttempts, 0);
          setErrorMsg(`Incorrect PIN code. (${5 - (newAttempts % 5)} attempt(s) remaining before lockout)`);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-scrim backdrop-blur-md flex items-center justify-center p-4"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="w-full max-w-sm bg-surface border border-border rounded-3xl p-8 text-center space-y-6 shadow-3 relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary mx-auto flex items-center justify-center shadow-2">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-text font-heading tracking-tight uppercase">
            {settings.shopName || 'Pakistan Trader Corporation'}
          </h2>
          <p className="text-xs text-primary font-semibold mt-1">
            Instalment & Inventory Control Protected
          </p>
        </div>

        <form onSubmit={handleUnlockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-2">
              Enter 4-Digit Security PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              disabled={lockoutRemaining > 0 || isVerifying}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center py-3 bg-surface-input border border-border rounded-2xl text-2xl font-mono-tabular tracking-widest text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:opacity-50"
            />
          </div>

          {lockoutRemaining > 0 && (
            <div className="p-3 rounded-2xl bg-danger-container text-on-danger-container border border-border text-xs font-bold flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-danger" />
              <span>
                Lockout Active: Wait <strong className="font-mono">{lockoutRemaining}s</strong>
              </span>
            </div>
          )}

          {errorMsg && lockoutRemaining <= 0 && (
            <div className="p-2.5 rounded-xl bg-danger/10 text-danger border border-danger/20 text-xs font-medium flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={lockoutRemaining > 0 || pinInput.length !== 4 || isVerifying}
            className="m3-btn-base m3-btn-filled w-full py-3 text-body-sm font-bold disabled:opacity-50"
          >
            {isVerifying ? 'Verifying...' : 'Unlock System'}
          </button>
        </form>

        {isFactoryDefault && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-700 dark:text-amber-400">
            Factory Default PIN is <strong className="font-mono">1234</strong>. Please change it in Settings under Shop Profile.
          </div>
        )}
      </div>
    </div>
  );
};
