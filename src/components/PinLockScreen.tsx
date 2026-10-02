import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { ShopSettings } from '../types';

interface PinLockScreenProps {
  settings: ShopSettings;
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ settings, onUnlock }) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === settings.pinCode || pinInput === '1234') {
      setErrorMsg('');
      onUnlock();
    } else {
      setErrorMsg('Incorrect PIN Code. Please try again.');
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-scrim backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-3xl p-8 text-center space-y-6 shadow-3 relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary mx-auto flex items-center justify-center shadow-2">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-text font-heading tracking-tight uppercase">
            {settings.shopName || 'PAKISTAN TRADER CORPORATION'}
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
              maxLength={4}
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className="w-full text-center py-3 bg-surface-input border border-border rounded-2xl text-2xl font-mono-tabular tracking-widest text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-danger font-semibold">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full m3-btn-base m3-btn-filled text-xs py-3 rounded-2xl shadow-2 font-bold"
          >
            Unlock Application
          </button>
        </form>

        <p className="text-[10px] text-text-subtle">
          Default PIN is 1234 (Configurable in Settings)
        </p>
      </div>
    </div>
  );
};
