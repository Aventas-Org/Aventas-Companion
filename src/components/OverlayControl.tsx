import { useState } from 'react';
import { isDesktopShell, setOverlayClickThrough, setOverlayVisible } from '../services/overlayWindow';

export function OverlayControl() {
  const desktop = isDesktopShell();
  const [acknowledged, setAcknowledged] = useState(false);
  const [visible, setVisible] = useState(false);
  const [clickThrough, setClickThrough] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggleVisible(show: boolean) {
    if (busy || !desktop) return;
    setBusy(true); setMessage(null);
    try {
      const changed = await setOverlayVisible(show);
      if (!changed) { setMessage('Windows could not change the overlay.'); return; }
      if (show) {
        // Keep game input safe by failing closed if click-through cannot be set.
        const safe = await setOverlayClickThrough(true);
        if (!safe) {
          await setOverlayVisible(false);
          setVisible(false);
          setClickThrough(true);
          setMessage('Overlay hidden: click-through could not be enabled.');
          return;
        }
        setClickThrough(true);
      }
      setVisible(show);
    } finally { setBusy(false); }
  }

  async function toggleClickThrough(value: boolean) {
    if (busy || !visible || !desktop) return;
    setBusy(true); setMessage(null);
    try {
      if (!await setOverlayClickThrough(value)) {
        setMessage('Unable to change overlay input mode.'); return;
      }
      setClickThrough(value);
      setMessage(value ? 'Clicks will pass through to the game.' : 'Overlay is interactive. Restore click-through before returning to the game.');
    } finally { setBusy(false); }
  }

  return <section className="a-panel space-y-4 p-5" aria-labelledby="overlay-controls-title">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 id="overlay-controls-title" className="font-display text-[17px] font-semibold text-ink">Practice overlay</h3>
        <p className="mt-1 text-[11px] text-ink-muted">Windows-only preview with clearly labeled demo data</p>
      </div>
      <span className="a-chip" data-tone={visible ? 'live' : 'neutral'}>{visible ? 'Visible' : 'Hidden'}</span>
    </div>
    <p className="text-[12px] leading-6 text-ink-muted">
      Shows your own sample post-match analysis. It does not reveal opponent intel, read game memory, or provide a competitive advantage.
    </p>
    {!desktop && <div className="a-empty !p-4">The overlay controls work only inside the installed Windows desktop app.</div>}
    <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-line bg-app/55 p-3 text-[12px] leading-6 text-ink-muted">
      <input type="checkbox" checked={acknowledged} disabled={busy} onChange={event => {
        const enabled = event.target.checked;
        setAcknowledged(enabled);
        if (!enabled && visible) void toggleVisible(false);
      }} className="mt-1 accent-accent"/>
      <span>I understand this preview contains simulated personal history, not a live Riot data feed.</span>
    </label>
    <div className="flex flex-wrap gap-2">
      <button type="button" className="a-button a-button-primary" disabled={!desktop || busy || (!acknowledged && !visible)}
        onClick={() => void toggleVisible(!visible)}>
        {busy ? 'Updating…' : visible ? 'Hide preview' : 'Show preview'}
      </button>
      <button type="button" className="a-button" disabled={!desktop || busy || !visible}
        onClick={() => void toggleClickThrough(!clickThrough)}>
        Click-through {clickThrough ? 'on' : 'off'}
      </button>
    </div>
    {message && <p className="text-[11px] leading-6 text-amber-300" role="status">{message}</p>}
    <p className="border-t border-line pt-4 text-[11px] leading-5 text-ink-muted">
      Click-through is enabled automatically when the overlay opens. If the system cannot enable it, the overlay is closed.
    </p>
  </section>;
}
