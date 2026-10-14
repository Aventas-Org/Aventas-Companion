import { useState } from 'react';
import { SectionCard } from '../components/SectionCard';
import { SegmentedControl } from '../components/SegmentedControl';
import { ThemePreview } from '../components/ThemePreview';
import { CheckIcon } from '../components/icons';
import { useTheme } from '../hooks/useTheme';
import {
  ACCENT_OPTIONS,
  THEME_PRESETS,
  THEME_STYLES,
  hexToChannels,
  type ThemeStyle,
} from '../services/themePresets';

/** Filter shown next to the preset grid. */
type PresetFilter = 'all' | 'dark' | 'light';

const FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'light' as const, label: 'Light' },
];

/** Settings sections. Only Appearance is implemented in this build. */
const SETTINGS_SECTIONS = [
  { id: 'appearance', label: 'Appearance', enabled: true },
  { id: 'general', label: 'General', enabled: false },
  { id: 'notifications', label: 'Notifications', enabled: false },
  { id: 'advanced', label: 'Advanced', enabled: false },
];

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5" title={`${label} — ${color}`}>
      <span
        className="h-8 w-16 rounded-md border border-line"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</span>
    </div>
  );
}

export function SettingsPage() {
  const theme = useTheme();
  const [filter, setFilter] = useState<PresetFilter>('all');

  const activePreset = THEME_PRESETS.find((preset) => preset.id === theme.presetId);
  // Auto matches both filters: it can resolve either way, so hiding it would be
  // more confusing than leaving it visible under both.
  const visiblePresets = THEME_PRESETS.filter(
    (preset) => filter === 'all' || preset.kind === filter || preset.kind === 'auto',
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Settings</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Make Aventas Companion look and feel the way you want. Changes apply instantly and are
          remembered on this device.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav
          aria-label="Settings sections"
          className="flex shrink-0 flex-col gap-1 rounded-lg border border-line bg-panel p-2 lg:w-56"
        >
          {SETTINGS_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              disabled={!section.enabled}
              aria-current={section.enabled ? 'page' : undefined}
              className={[
                'flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                section.enabled
                  ? 'bg-line text-ink'
                  : 'cursor-not-allowed text-ink-muted opacity-70',
              ].join(' ')}
            >
              {section.label}
              {!section.enabled && (
                <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[10px] font-medium">
                  Soon
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <SectionCard
            title="Style"
            subtitle="How much depth panels get on top of the palette."
            action={
              <SegmentedControl<ThemeStyle>
                value={theme.style}
                options={THEME_STYLES}
                onChange={theme.setStyle}
                ariaLabel="Panel style"
              />
            }
          >
            <div className="flex flex-col gap-3">
              <div className="h-40 overflow-hidden rounded-lg border border-line">
                <ThemePreview palette={theme.palette} style={theme.style} />
              </div>
              <div className="flex flex-wrap gap-6">
                <Swatch color={theme.palette.app} label="App" />
                <Swatch color={theme.palette.panel} label="Panel" />
                <Swatch color={theme.palette.line} label="Line" />
                <Swatch color={theme.palette.ink} label="Ink" />
                <Swatch color={theme.palette.inkMuted} label="Muted" />
                <Swatch color={theme.palette.accent} label="Accent" />
              </div>
              <p className="text-[11px] leading-relaxed text-ink-muted">
                {activePreset?.label ?? theme.presetId} ·{' '}
                {theme.style === 'flat' ? 'Flat' : theme.style === '3d' ? '3D' : 'Shine'}
                {theme.presetId === 'auto' &&
                  ` · following your system (${theme.systemPrefersDark ? 'dark' : 'light'})`}
                {theme.accentOverride ? ` · accent ${theme.accentOverride}` : ''}
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title="Select a preset"
            subtitle="Twelve palettes, each with its own artwork behind the panels."
            action={
              <SegmentedControl<PresetFilter>
                value={filter}
                options={FILTER_OPTIONS}
                onChange={setFilter}
                ariaLabel="Filter presets by brightness"
              />
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {visiblePresets.map((preset) => {
                const selected = preset.id === theme.presetId;
                // Fixed presets store their palette in `dark`; Auto needs the
                // current OS setting to know which half to show.
                const palette =
                  preset.kind === 'auto'
                    ? theme.systemPrefersDark
                      ? preset.dark
                      : (preset.light ?? preset.dark)
                    : preset.dark;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => theme.setPreset(preset.id)}
                    aria-pressed={selected}
                    title={preset.description}
                    className={[
                      'group flex flex-col gap-2 rounded-lg border p-2 text-left transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                      selected
                        ? 'border-accent/60 bg-accent/[0.06]'
                        : 'border-line bg-panel hover:border-ink-muted/40',
                    ].join(' ')}
                  >
                    <span className="relative block h-24 overflow-hidden rounded-md border border-line">
                      <ThemePreview palette={palette} style={theme.style} />
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] text-white">
                          <CheckIcon width={12} height={12} strokeWidth={2.4} />
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 px-1 pb-1">
                      <span
                        className={selected ? 'text-xs font-semibold text-ink' : 'text-xs text-ink'}
                      >
                        {preset.label}
                      </span>
                      {preset.kind === 'auto' && (
                        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-ink-muted">
                          Auto
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Accent colour"
            subtitle="Overrides the accent from the preset. Everything else stays put."
          >
            <div className="flex flex-wrap gap-3">
              {ACCENT_OPTIONS.map((option) => {
                const selected = theme.accentOverride === option.value;
                const color = option.value ?? theme.palette.accent;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => theme.setAccentOverride(option.value)}
                    aria-pressed={selected}
                    className={[
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                      selected
                        ? 'border-accent/60 text-ink'
                        : 'border-line text-ink-muted hover:text-ink',
                    ].join(' ')}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-line"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <p className="text-[11px] leading-relaxed text-ink-muted">
                Stored locally as{' '}
                <code className="text-ink-muted">rgb({hexToChannels(theme.palette.accent)})</code> —
                no account or network needed.
              </p>
              <button
                type="button"
                onClick={theme.resetTheme}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-line focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                Reset appearance
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
