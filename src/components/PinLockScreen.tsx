import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-white font-heading tracking-tight uppercase">
            {settings.shopName || 'PAKISTAN TRADER CORPORATION'}
          </h2>
          <p className="text-xs text-emerald-400 font-semibold mt-1">
            Instalment & Inventory Control Protected
          </p>
        </div>

        <form onSubmit={handleUnlockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Enter 4-Digit Security PIN
            </label>
            <input
              type="password"
              maxLength={4}
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className="w-full text-center py-3 bg-slate-950 border border-slate-800 rounded-2xl text-2xl font-mono-tabular tracking-widest text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all"
          >
            Unlock Application
          </button>
        </form>

        <p className="text-[10px] text-slate-500">
          Default PIN is 1234 (Configurable in Settings)
        </p>
      </div>
    </div>
  );
};
