/**
 * Theme catalog.
 *
 * Every preset is a complete palette rather than a diff on top of the default,
 * so adding a preset can never accidentally inherit a colour from another one.
 * Colours are stored as hex here for readability and converted to the
 * "R G B" channel form the CSS variables expect when a preset is applied.
 */

/** Look-and-feel variants that decorate panels on top of any palette. */
export type ThemeStyle = 'flat' | '3d' | 'shine';

export const THEME_STYLES: ReadonlyArray<{ value: ThemeStyle; label: string }> = [
  { value: 'flat', label: 'Flat' },
  { value: '3d', label: '3D' },
  { value: 'shine', label: 'Shine' },
];

/** What the All / Dark / Light filter matches. */
export type PresetKind = 'auto' | 'dark' | 'light';

export interface ThemePalette {
  /** Window backdrop behind every panel. */
  app: string;
  /** Raised surfaces: cards, sidebar, forms. */
  panel: string;
  /** Hairline borders and dividers. */
  line: string;
  /** Primary text. */
  ink: string;
  /** Secondary text and labels. */
  inkMuted: string;
  /** Single brand accent, used for active state and focus rings. */
  accent: string;
  /** Background artwork for the app shell (a CSS `background-image` value). */
  background: string;
  /** Drives the native `color-scheme`, so scrollbars match the palette. */
  scheme: 'dark' | 'light';
}

export type PresetId =
  | 'auto'
  | 'dark'
  | 'light'
  | 'og-shine'
  | 'alpine'
  | 'dune'
  | 'tide'
  | 'blossom'
  | 'orbit'
  | 'after-rain'
  | 'ember'
  | 'kanagawa';

export interface ThemePreset {
  id: PresetId;
  label: string;
  /** One-line description shown on the card tooltip. */
  description: string;
  kind: PresetKind;
  /** Palette used when the preset is fixed, or when Auto resolves to dark. */
  dark: ThemePalette;
  /** Only present on Auto, which resolves against the OS setting. */
  light?: ThemePalette;
}

/** Harks back to the original charcoal-and-red build. */
const DARK: ThemePalette = {
  app: '#0B0C0E',
  panel: '#16181C',
  line: '#24272D',
  ink: '#F3F4F6',
  inkMuted: '#9CA3AF',
  accent: '#FF4655',
  background: 'none',
  scheme: 'dark',
};

const LIGHT: ThemePalette = {
  app: '#F5F6F8',
  panel: '#FFFFFF',
  line: '#E1E4EA',
  ink: '#15171B',
  inkMuted: '#6B7280',
  accent: '#E23A4B',
  background: 'none',
  scheme: 'light',
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'auto',
    label: 'Auto',
    description: 'Follows your operating system light/dark setting.',
    kind: 'auto',
    dark: DARK,
    light: LIGHT,
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Neutral charcoal with a VALORANT-red accent.',
    kind: 'dark',
    dark: DARK,
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Clean white surfaces for bright rooms.',
    kind: 'light',
    dark: LIGHT,
  },
  {
    id: 'og-shine',
    label: 'OG Shine',
    description: 'Near-black with an emerald accent and a diagonal sheen.',
    kind: 'dark',
    dark: {
      app: '#08090A',
      panel: '#101315',
      line: '#1E2225',
      ink: '#F5F7F7',
      inkMuted: '#8B9296',
      accent: '#34D399',
      background:
        'radial-gradient(120% 90% at 12% -10%, rgba(52, 211, 153, 0.16), transparent 55%), linear-gradient(160deg, #0B0D0E 0%, #08090A 55%, #101314 100%)',
      scheme: 'dark',
    },
  },
  {
    id: 'alpine',
    label: 'Alpine',
    description: 'Cold forest greens and a ridgeline horizon.',
    kind: 'dark',
    dark: {
      app: '#0D1412',
      panel: '#131C19',
      line: '#22302B',
      ink: '#EAF2EE',
      inkMuted: '#8FA79E',
      accent: '#4ADE80',
      background:
        'radial-gradient(90% 60% at 50% 110%, rgba(74, 222, 128, 0.18), transparent 60%), linear-gradient(180deg, #0F1A18 0%, #0D1412 45%, #0A100F 100%)',
      scheme: 'dark',
    },
  },
  {
    id: 'dune',
    label: 'Dune',
    description: 'Sun-bleached sand with a burnt-orange accent.',
    kind: 'light',
    dark: {
      app: '#EFE4D4',
      panel: '#FBF6EE',
      line: '#DFD0BA',
      ink: '#2B2118',
      inkMuted: '#7A6853',
      accent: '#C2410C',
      background:
        'radial-gradient(80% 60% at 80% -10%, rgba(194, 65, 12, 0.14), transparent 60%), linear-gradient(180deg, #F3E9DA 0%, #EFE4D4 60%, #E7D8C3 100%)',
      scheme: 'light',
    },
  },
  {
    id: 'tide',
    label: 'Tide',
    description: 'Deep water blues with a cyan accent.',
    kind: 'dark',
    dark: {
      app: '#04141B',
      panel: '#08222B',
      line: '#10333D',
      ink: '#E6F6F9',
      inkMuted: '#7FA8B4',
      accent: '#22D3EE',
      background:
        'radial-gradient(110% 70% at 50% 120%, rgba(34, 211, 238, 0.22), transparent 62%), linear-gradient(180deg, #06202A 0%, #04141B 55%, #031016 100%)',
      scheme: 'dark',
    },
  },
  {
    id: 'blossom',
    label: 'Blossom',
    description: 'Pale pink light theme with a rose accent.',
    kind: 'light',
    dark: {
      app: '#FDF1F4',
      panel: '#FFFFFF',
      line: '#F2D7DE',
      ink: '#2A1A20',
      inkMuted: '#8A6B74',
      accent: '#D6336C',
      background:
        'radial-gradient(80% 60% at 20% -10%, rgba(214, 51, 108, 0.12), transparent 60%), linear-gradient(180deg, #FEF5F7 0%, #FDF1F4 100%)',
      scheme: 'light',
    },
  },
  {
    id: 'orbit',
    label: 'Orbit',
    description: 'Indigo deep space with a violet accent.',
    kind: 'dark',
    dark: {
      app: '#070B1C',
      panel: '#0E1430',
      line: '#1B2450',
      ink: '#E8ECFF',
      inkMuted: '#8B93C8',
      accent: '#6366F1',
      background:
        'radial-gradient(60% 45% at 78% 8%, rgba(99, 102, 241, 0.28), transparent 60%), radial-gradient(50% 40% at 10% 92%, rgba(139, 92, 246, 0.22), transparent 62%), linear-gradient(180deg, #0A1029 0%, #070B1C 60%, #05070F 100%)',
      scheme: 'dark',
    },
  },
  {
    id: 'after-rain',
    label: 'After rain',
    description: 'Cool mist greys with a sky-blue accent.',
    kind: 'light',
    dark: {
      app: '#EEF1F4',
      panel: '#FFFFFF',
      line: '#DBE0E6',
      ink: '#1B2027',
      inkMuted: '#64707D',
      accent: '#0EA5E9',
      background:
        'radial-gradient(80% 60% at 15% -10%, rgba(14, 165, 233, 0.14), transparent 60%), linear-gradient(180deg, #F2F5F8 0%, #EEF1F4 55%, #E6EBF0 100%)',
      scheme: 'light',
    },
  },
  {
    id: 'ember',
    label: 'Ember',
    description: 'Charred warm darks with an orange accent.',
    kind: 'dark',
    dark: {
      app: '#140B09',
      panel: '#1F1210',
      line: '#33201C',
      ink: '#F6ECE7',
      inkMuted: '#B39A91',
      accent: '#F97316',
      background:
        'radial-gradient(90% 60% at 50% 120%, rgba(249, 115, 22, 0.24), transparent 60%), linear-gradient(180deg, #1B0F0C 0%, #140B09 55%, #100807 100%)',
      scheme: 'dark',
    },
  },
  {
    id: 'kanagawa',
    label: 'Kanagawa',
    description: 'Sumi-e indigo with a muted blue accent.',
    kind: 'dark',
    dark: {
      app: '#1F1F28',
      panel: '#2A2A37',
      line: '#363646',
      ink: '#DCD7BA',
      inkMuted: '#9C9AA7',
      accent: '#7E9CD8',
      background:
        'radial-gradient(85% 60% at 82% 0%, rgba(126, 156, 216, 0.18), transparent 62%), linear-gradient(180deg, #24242F 0%, #1F1F28 60%, #1A1A22 100%)',
      scheme: 'dark',
    },
  },
];

/** Accent overrides that sit on top of whichever preset is active. */
export interface AccentOption {
  id: string;
  label: string;
  /** `null` means "use the accent from the preset". */
  value: string | null;
}

export const ACCENT_OPTIONS: ReadonlyArray<AccentOption> = [
  { id: 'preset', label: 'Preset', value: null },
  { id: 'valorant', label: 'Valorant red', value: '#FF4655' },
  { id: 'violet', label: 'Violet', value: '#8B5CF6' },
  { id: 'cyan', label: 'Cyan', value: '#22D3EE' },
  { id: 'emerald', label: 'Emerald', value: '#34D399' },
  { id: 'amber', label: 'Amber', value: '#F59E0B' },
  { id: 'rose', label: 'Rose', value: '#F43F5E' },
];

export function getPreset(id: PresetId): ThemePreset {
  const found = THEME_PRESETS.find((preset) => preset.id === id);
  // The list is exhaustive and typed, so this only guards against bad storage.
  return found ?? THEME_PRESETS[1];
}

/**
 * Turns a preset into the concrete palette that should be painted right now.
 * `systemPrefersDark` only matters for the Auto preset.
 */
export function resolvePalette(preset: ThemePreset, systemPrefersDark: boolean): ThemePalette {
  if (preset.kind === 'auto') {
    return systemPrefersDark ? preset.dark : (preset.light ?? preset.dark);
  }
  return preset.dark;
}

/** `#RRGGBB` (or `#RGB`) to the "R G B" triplet CSS variables are written in. */
export function hexToChannels(hex: string): string {
  const value = hex.replace('#', '').trim();
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;

  const int = Number.parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(int)) return '0 0 0';

  return [(int >> 16) & 255, (int >> 8) & 255, int & 255].join(' ');
}
