import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useAppActions } from '../context/AppActionsContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppActions();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 pointer-events-none flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => {
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className={`pointer-events-auto max-w-md w-full sm:w-auto px-4 py-3 rounded-2xl border shadow-3 flex items-center justify-between gap-3 text-xs font-bold backdrop-blur-xl ${
                toast.type === 'error'
                  ? 'bg-danger-container text-on-danger-container border-danger/40'
                  : toast.type === 'success'
                  ? 'bg-success-container text-on-success-container border-success/40'
                  : 'bg-surface-2 text-text border-border'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-danger shrink-0" />}
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                {toast.type === 'info' && <Info className="w-4 h-4 text-primary shrink-0" />}
                <span>{toast.message}</span>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-black/10 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
