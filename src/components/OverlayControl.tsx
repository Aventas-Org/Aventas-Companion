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
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3">
      <p className="text-xs font-medium text-slate-400">In-game overlay</p>

      {!desktop && (
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Desktop app only. Open <code className="text-slate-400">?view=overlay</code> to preview
          the HUD here.
        </p>
      )}

      <label className="mt-2 flex cursor-pointer items-start gap-2 text-[11px] leading-relaxed text-slate-500">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
          className="mt-0.5 accent-purple-500"
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
          className="rounded-md bg-purple-500/20 px-2.5 py-1.5 text-[11px] font-medium text-purple-200 hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-600"
        >
          {visible ? 'Hide overlay' : 'Show overlay'}
        </button>
        <button
          type="button"
          disabled={!desktop || !visible}
          onClick={() => void toggleClickThrough(!clickThrough)}
          className="rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:text-slate-600"
        >
          Click-through: {clickThrough ? 'on' : 'off'}
        </button>
      </div>

      {message && <p className="mt-2 text-[10px] leading-relaxed text-amber-300">{message}</p>}
    </div>
  );
}
