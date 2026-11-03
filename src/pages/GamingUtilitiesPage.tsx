import { useEffect, useState } from 'react';
import { useValorantStatus } from '../hooks/useValorantStatus';
import { OverlayControl } from '../components/OverlayControl';

/** Local-only, permission-conscious game utilities.
 * This screen does not inject into VALORANT, inspect game memory, or scout opponents.
 */
export function GamingUtilitiesPage() {
  const status = useValorantStatus();
  const running = status.phase === 'ready' && status.response.status === 'running';
  const [started, setStarted] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) { setStarted(null); setSeconds(0); return; }
    setStarted((existing) => existing ?? Date.now());
  }, [running]);

  useEffect(() => {
    if (!started || !running) return;
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [running, started]);

  const title = status.phase === 'loading' ? 'Checking for VALORANT…'
    : status.phase === 'error' ? 'Local process service unavailable'
    : status.response.status === 'running' ? 'VALORANT detected'
    : status.response.status === 'not_running' ? 'VALORANT is not running'
    : 'Process status unavailable';

  const duration = Math.floor(seconds / 3600) + 'h ' + Math.floor(seconds % 3600 / 60) + 'm ' + seconds % 60 + 's';
  return <section className="flex flex-col gap-5 p-6">
    <header>
      <h2 className="text-2xl font-semibold text-ink">Gaming Utilities</h2>
      <p className="mt-1 text-sm text-ink-muted">Lightweight local system and in-game companion controls.</p>
    </header>
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-xl border border-line bg-panel p-5">
        <h3 className="text-sm font-semibold text-ink">Game process monitor</h3>
        <p className="mt-3 text-lg font-medium text-ink" role="status">{title}</p>
        {status.phase === 'ready' && <p className="mt-2 text-xs text-ink-muted">
          Process: {status.response.processName || 'Unavailable'}. Checks run every five seconds.
        </p>}
        <p className="mt-6 text-xs text-ink-muted">Uses a Windows process enumeration API. No game memory reads, DLL injection or opponent information.</p>
      </div>
      <div className="rounded-xl border border-line bg-panel p-5">
        <h3 className="text-sm font-semibold text-ink">Observation timer</h3>
        <p className="mt-3 text-2xl font-semibold text-ink">{running ? duration : '00:00:00'}</p>
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          Measures continuous detected runtime only while this Utilities page is open.
          It resets when VALORANT closes or you leave the screen. Not a full gameplay-hours counter.
        </p>
      </div>
      <div className="max-w-lg">
        <OverlayControl />
      </div>
      <div className="rounded-xl border border-line bg-panel p-5">
        <h3 className="text-sm font-semibold text-ink">Privacy and compatibility</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          The overlay should show historical or personal information only.
          No automated aim, opponent scouting, game-process injection, or unsupported
          real-time competitive assistance is enabled.
        </p>
      </div>
    </div>
  </section>;
}
