import { useEffect } from 'react';

/**
 * Hook to dismiss a local modal, popup, or sheet when the Android back button is pressed.
 * Prevents default event propagation so higher-level navigation does not occur.
 */
export function useBackDismiss(isActive: boolean, onDismiss: () => void) {
  useEffect(() => {
    if (!isActive) return;

    const handleBack = (e: Event) => {
      e.preventDefault();
      onDismiss();
    };

    window.addEventListener('app:back', handleBack);
    return () => {
      window.removeEventListener('app:back', handleBack);
    };
  }, [isActive, onDismiss]);
}
