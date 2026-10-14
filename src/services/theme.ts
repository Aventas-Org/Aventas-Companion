/**
 * Runtime theming.
 *
 * The whole UI is painted from CSS variables, so switching a preset is a handful
 * of custom-property writes on <html> — no React re-render of the page tree and
 * no Tailwind rebuild. Settings live in localStorage so the choice survives a
 * restart and is picked up by the overlay window too.
 */
import {
  getPreset,
  hexToChannels,
  resolvePalette,
  type PresetId,
  type ThemePalette,
  type ThemeStyle,
} from './themePresets';

export interface ThemeSettings {
  presetId: PresetId;
  style: ThemeStyle;
  /** Hex accent that replaces the preset's own accent, or `null` to use it. */
  accentOverride: string | null;
}

export interface ThemeSnapshot extends ThemeSettings {
  /** The palette actually being painted (Auto already resolved). */
  palette: ThemePalette;
  /** Whether the OS is currently reporting a dark colour scheme. */
  systemPrefersDark: boolean;
}

const STORAGE_KEY = 'aventas.theme.v1';

export const DEFAULT_SETTINGS: ThemeSettings = {
  presetId: 'dark',
  style: 'flat',
  accentOverride: null,
};

const DARK_QUERY = '(prefers-color-scheme: dark)';

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia(DARK_QUERY).matches;
}

function readSettings(): ThemeSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ThemeSettings>;
    return {
      presetId: parsed.presetId ? getPreset(parsed.presetId).id : DEFAULT_SETTINGS.presetId,
      style:
        parsed.style === '3d' || parsed.style === 'shine' || parsed.style === 'flat'
          ? parsed.style
          : DEFAULT_SETTINGS.style,
      accentOverride: typeof parsed.accentOverride === 'string' ? parsed.accentOverride : null,
    };
  } catch {
    // Corrupt or unavailable storage must never stop the app from booting.
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings: ThemeSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be disabled; the session still keeps the choice in memory.
  }
}

function buildSnapshot(settings: ThemeSettings, prefersDark: boolean): ThemeSnapshot {
  const preset = getPreset(settings.presetId);
  const palette = resolvePalette(preset, prefersDark);
  return {
    ...settings,
    palette: settings.accentOverride ? { ...palette, accent: settings.accentOverride } : palette,
    systemPrefersDark: prefersDark,
  };
}

let snapshot: ThemeSnapshot = buildSnapshot(DEFAULT_SETTINGS, systemPrefersDark());
const listeners = new Set<() => void>();

/** Writes the palette to the document as CSS variables, style and scheme. */
function paint(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const { palette } = snapshot;

  root.style.setProperty('--color-app', hexToChannels(palette.app));
  root.style.setProperty('--color-panel', hexToChannels(palette.panel));
  root.style.setProperty('--color-line', hexToChannels(palette.line));
  root.style.setProperty('--color-ink', hexToChannels(palette.ink));
  root.style.setProperty('--color-ink-muted', hexToChannels(palette.inkMuted));
  root.style.setProperty('--color-accent', hexToChannels(palette.accent));
  root.style.setProperty('--app-background', palette.background);

  root.dataset.theme = snapshot.presetId;
  root.dataset.style = snapshot.style;
  root.dataset.scheme = palette.scheme;
  // Keeps native controls (scrollbars, checkboxes, selects) in the right family.
  root.style.colorScheme = palette.scheme;
}

function emit(): void {
  paint();
  listeners.forEach((listener) => listener());
}

function commit(settings: ThemeSettings): void {
  writeSettings(settings);
  snapshot = buildSnapshot(settings, systemPrefersDark());
  emit();
}

/** Applies the stored settings and starts tracking the OS colour scheme. */
export function initTheme(): void {
  if (typeof window === 'undefined') return;
  snapshot = buildSnapshot(readSettings(), systemPrefersDark());
  paint();

  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener('change', () => {
    // Only Auto cares about the OS, but the flag is kept current either way.
    snapshot = buildSnapshot(snapshot, media.matches);
    emit();
  });

  // The dashboard and the overlay are separate windows with separate memory:
  // re-read storage when one of them regains focus so they stay in step.
  const syncFromStorage = () => {
    const stored = readSettings();
    if (JSON.stringify(stored) === JSON.stringify(currentSettings())) return;
    snapshot = buildSnapshot(stored, systemPrefersDark());
    emit();
  };
  window.addEventListener('storage', syncFromStorage);
  window.addEventListener('focus', syncFromStorage);
}

function currentSettings(): ThemeSettings {
  return {
    presetId: snapshot.presetId,
    style: snapshot.style,
    accentOverride: snapshot.accentOverride,
  };
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Stable snapshot for `useSyncExternalStore`. */
export function getThemeSnapshot(): ThemeSnapshot {
  return snapshot;
}

export function setPreset(presetId: PresetId): void {
  commit({ ...currentSettings(), presetId });
}

export function setStyle(style: ThemeStyle): void {
  commit({ ...currentSettings(), style });
}

export function setAccentOverride(accentOverride: string | null): void {
  commit({ ...currentSettings(), accentOverride });
}

export function resetTheme(): void {
  commit({ ...DEFAULT_SETTINGS });
}
