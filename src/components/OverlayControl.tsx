import { useState } from 'react';
import { isDesktopShell, setOverlayVisible } from '../services/overlayWindow';

/**
 * The practice HUD is demo-only and always click-through. No interactive
 * overlay control should take focus or mouse input away from VALORANT.
 */
export function OverlayControl() {
  const desktop = isDesktopShell();
  const [acknowledged, setAcknowledged] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggle(show: boolean) {
    if (busy || !desktop) return;
    setBusy(true);
    setMessage(null);
    try {
      // Rust applies click-through *before* showing the overlay.
      const changed = await setOverlayVisible(show);
      if (!changed) {
        setMessage('The Windows overlay could not be updated. It remains hidden if click-through is unavailable.');
        if (show) setVisible(false);
        return;
      }
      setVisible(show);
    } catch {
      setMessage('The Windows overlay could not be updated.');
      setVisible(false);
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-display text-[16px] font-semibold text-ink">Practice overlay</p>
        <p className="mt-1 text-[11px] text-ink-muted">
          Sample personal post-match analysis only. Not official Riot data.
        </p>
      </div>
      <span className="a-chip" data-tone={visible ? 'live' : 'neutral'}>
        {visible ? 'Visible' : 'Hidden'}
      </span>
    </div>
    {!desktop && <div className="a-empty !p-4">Install the Windows desktop app to use the overlay. Browser previews cannot control native game windows.</div>}
    <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-line bg-app/45 p-4 text-[12px] leading-6 text-ink-muted">
      <input type="checkbox" checked={acknowledged} disabled={busy}
        onChange={event => {
          const checked=event.target.checked;
          setAcknowledged(checked);
          if (!checked && visible) void toggle(false);
        }} className="mt-1 accent-accent"/>
      <span>I understand this overlay shows simulated historical statistics, not my verified VALORANT history or live match information.</span>
    </label>
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="a-button a-button-primary"
        disabled={!desktop || busy || (!acknowledged && !visible)}
        onClick={() => void toggle(!visible)}>
        {busy ? 'Updating…' : visible ? 'Hide preview overlay' : 'Show preview overlay'}
      </button>
      <p className="text-[11px] text-ink-muted">Mouse input always passes through to the game.</p>
    </div>
    {message && <p role="status" className="text-[11px] leading-5 text-amber-300">{message}</p>}
    <p className="border-t border-line pt-4 text-[11px] leading-5 text-ink-muted">
      If Windows cannot enable click-through, the overlay will not open. This build never reads process memory, provides live opponent information, or changes gameplay inputs.
    </p>
  </div>;
}
