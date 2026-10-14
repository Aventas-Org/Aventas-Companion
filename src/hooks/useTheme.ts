import { useSyncExternalStore } from 'react';
import {
  getThemeSnapshot,
  resetTheme,
  setAccentOverride,
  setPreset,
  setStyle,
  subscribe,
} from '../services/theme';

/**
 * Reads the live theme and exposes the setters.
 *
 * The store writes straight to the DOM, so subscribing here only tells React
 * when to re-render the controls that display the current selection.
 */
export function useTheme() {
  const snapshot = useSyncExternalStore(subscribe, getThemeSnapshot, getThemeSnapshot);

  return {
    ...snapshot,
    setPreset,
    setStyle,
    setAccentOverride,
    resetTheme,
  };
}
