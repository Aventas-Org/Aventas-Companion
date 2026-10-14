import { invoke } from '@tauri-apps/api/core';

/**
 * Bridge to the native overlay window.
 *
 * The overlay is a second, transparent, always-on-top WebView that the Rust side
 * owns. Everything here degrades gracefully when the frontend is running in a
 * plain browser (the web dashboard / dev preview), so the same code path works
 * in both shells.
 */

/** True when running inside the Tauri desktop shell. */
export function isDesktopShell(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Which surface this window should render. */
export type AppView = 'dashboard' | 'overlay';

/**
 * Decides whether the current window is the in-game overlay.
 *
 * The overlay window is opened with `?view=overlay`, which works in both the
 * desktop shell and a browser; the window label is also checked as a fallback so
 * the overlay still resolves correctly if the query string is ever dropped.
 */
export function detectAppView(): AppView {
  if (typeof window === 'undefined') return 'dashboard';

  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'overlay') return 'overlay';

  const internals = (
    window as unknown as {
      __TAURI_INTERNALS__?: { metadata?: { currentWebview?: { label?: string } } };
    }
  ).__TAURI_INTERNALS__;
  if (internals?.metadata?.currentWebview?.label === 'overlay') return 'overlay';

  return 'dashboard';
}

/**
 * Shows or hides the overlay window.
 * Returns false when unavailable (browser) or when the native call fails.
 */
export async function setOverlayVisible(visible: boolean): Promise<boolean> {
  if (!isDesktopShell()) return false;
  try {
    await invoke('set_overlay_visible', { visible });
    return true;
  } catch {
    return false;
  }
}

/**
 * Toggles whether the overlay passes mouse clicks through to the game.
 *
 * When enabled the entire overlay window ignores the cursor, so clicks land in
 * VALORANT as if the overlay were not there. Turn it off to interact with the
 * overlay's own controls.
 * Returns false when unavailable (browser) or when the native call fails.
 */
export async function setOverlayClickThrough(clickThrough: boolean): Promise<boolean> {
  if (!isDesktopShell()) return false;
  try {
    await invoke('set_overlay_click_through', { clickThrough });
    return true;
  } catch {
    return false;
  }
}
