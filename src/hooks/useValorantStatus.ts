import { useEffect, useState } from 'react';
import { checkValorantProcess, type ValorantProcessResponse } from '../services/gameStatus';

/** Refresh interval in milliseconds (5 seconds). */
const REFRESH_INTERVAL_MS = 5000;

/** Internal state for the hook. */
type ValorantStatusState =
  { phase: 'loading' } | { phase: 'ready'; response: ValorantProcessResponse } | { phase: 'error' };

/**
 * Hook that periodically checks the VALORANT game process status.
 * - Runs an initial check on mount.
 * - Refreshes every 5 seconds while the component is mounted.
 * - Cleans up the interval on unmount.
 * - Returns a discriminated union for loading/ready/error states.
 */
export function useValorantStatus(): ValorantStatusState {
  const [state, setState] = useState<ValorantStatusState>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const runCheck = async () => {
      try {
        const response = await checkValorantProcess();
        if (!cancelled) {
          setState({ phase: 'ready', response });
        }
      } catch {
        if (!cancelled) {
          setState({ phase: 'error' });
        }
      }
    };

    // Initial check
    void runCheck();

    // Periodic refresh
    intervalId = window.setInterval(() => {
      void runCheck();
    }, REFRESH_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      cancelled = true;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  return state;
}
