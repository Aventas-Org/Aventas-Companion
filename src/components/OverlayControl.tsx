import { useState } from 'react';
import {
  isDesktopShell,
  setOverlayClickThrough,
  setOverlayVisible,
} from '../services/overlayWindow';

/**
 * Controls for the native overlay window.
 *
 * These live in the dashboard rather than in the overlay itself, because a
 * click-through overlay cannot receive clicks — the whole point of click-through
 * is that input passes straight to the game. So the overlay is pure display and
 * every control sits here.
 */
export function OverlayControl() {
  const desktop = isDesktopShell();
  const [acknowledged, setAcknowledged] = useState(false);
  const [visible, setVisible] = useState(false);
  const [clickThrough, setClickThrough] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const toggleVisible = async (next: boolean) => {
    const ok = await setOverlayVisible(next);
    if (!ok) {
      setMessage('Overlay is only available in the Windows desktop app.');
      return;
    }
    setVisible(next);
    if (next) {
      // Overlays ship click-through by default so input always reaches the game.
      const clickOk = await setOverlayClickThrough(clickThrough);
      setMessage(clickOk ? null : 'Shown, but click-through could not be set.');
    } else {
      setMessage(null);
    }
  };

  const toggleClickThrough = async (next: boolean) => {
    const ok = await setOverlayClickThrough(next);
    if (!ok) {
      setMessage('Click-through is only available in the Windows desktop app.');
      return;
    }
    setClickThrough(next);
    setMessage(next ? 'Clicks now pass through to VALORANT.' : 'Overlay is interactive.');
  };

  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-3">
      <p className="text-xs font-medium text-ink-muted">In-game overlay</p>

      {!desktop && (
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
          Desktop app only. Open <code className="text-ink-muted">?view=overlay</code> to preview
          the HUD here.
        </p>
      )}

      <label className="mt-2 flex cursor-pointer items-start gap-2 text-[11px] leading-relaxed text-ink-muted">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
          className="mt-0.5 accent-accent"
        />
        <span>
          Historical stats only — no live or opponent information, per Riot’s third-party policy.
        </span>
      </label>

      <div className="mt-2 flex flex-col gap-1.5">
        <button
          type="button"
          disabled={!desktop || !acknowledged}
          onClick={() => void toggleVisible(!visible)}
          className="rounded-md bg-accent/15 px-2.5 py-1.5 text-[11px] font-medium text-ink hover:bg-accent/20 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-muted"
        >
          {visible ? 'Hide overlay' : 'Show overlay'}
        </button>
        <button
          type="button"
          disabled={!desktop || !visible}
          onClick={() => void toggleClickThrough(!clickThrough)}
          className="rounded-md border border-line px-2.5 py-1.5 text-[11px] font-medium text-ink hover:bg-line disabled:cursor-not-allowed disabled:text-ink-muted"
        >
          Click-through: {clickThrough ? 'on' : 'off'}
        </button>
      </div>

      {message && <p className="mt-2 text-[10px] leading-relaxed text-amber-300">{message}</p>}
    </div>
  );
}
