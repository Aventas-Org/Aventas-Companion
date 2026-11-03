import { useState } from 'react';
import { ThemePreview } from '../components/ThemePreview';
import { CheckIcon } from '../components/icons';
import { useTheme } from '../hooks/useTheme';
import {
  ACCENT_OPTIONS, THEME_PRESETS, THEME_STYLES,
  type ThemeStyle,
} from '../services/themePresets';

type Filter = 'all' | 'dark' | 'light';
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All themes' }, { value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' },
];

export function SettingsPage() {
  const theme = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const current = THEME_PRESETS.find(preset => preset.id === theme.presetId);
  const visible = THEME_PRESETS.filter(preset =>
    filter === 'all' || preset.kind === 'auto' || preset.kind === filter
  );

  return <section className="page-stage space-y-7">
    <header>
      <p className="page-kicker">Aventas / Preferences</p>
      <h1 className="page-heading mt-2">Make it yours.</h1>
      <p className="page-description mt-3">Fine-tune the Companion workspace. Your appearance choices stay on this device, even when offline.</p>
    </header>

    <section className="a-panel overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-5">
        <div><h2 className="font-display text-[19px] font-semibold text-ink">Appearance</h2>
          <p className="mt-1 text-[11px] text-ink-muted">The same theme applies to both the main window and the optional overlay.</p></div>
        <button type="button" className="a-button" onClick={theme.resetTheme}>Reset appearance</button>
      </div>
      <div className="grid gap-7 p-6 lg:grid-cols-[minmax(240px,1fr)_minmax(0,1.35fr)]">
        <div className="min-w-0">
          <div className="relative h-[205px] overflow-hidden rounded-[9px] border border-line">
            <ThemePreview palette={theme.palette} style={theme.style}/>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-[16px] font-semibold text-ink">{current?.label || 'Custom theme'}</h3>
              <p className="mt-1 text-[11px] text-ink-muted">{current?.description || 'Personalized appearance'}</p>
            </div>
            <span className="a-chip">{theme.palette.scheme === 'dark' ? 'Dark scheme' : 'Light scheme'}</span>
          </div>
          <div className="mt-6 flex gap-2">
            {[
              ['Background', theme.palette.app],
              ['Panels', theme.palette.panel],
              ['Borders', theme.palette.line],
              ['Text', theme.palette.ink],
              ['Accent', theme.palette.accent],
            ].map(([name,color]) => <span key={name} title={name + ' / ' + color}
              className="size-7 rounded-[5px] border border-line" style={{ backgroundColor: color }}/>)}
          </div>
        </div>
        <div>
          <p className="a-eyebrow">Surface treatment</p>
          <p className="mt-1 text-[12px] leading-6 text-ink-muted">Change the amount of depth without losing readability.</p>
          <div className="a-segment mt-4" role="group" aria-label="Panel depth">
            {THEME_STYLES.map(style => <button type="button" key={style.value}
              aria-selected={theme.style === style.value} aria-pressed={theme.style === style.value}
              onClick={() => theme.setStyle(style.value as ThemeStyle)}>{style.label}</button>)}
          </div>

          <p className="a-eyebrow mt-8">Signal color</p>
          <p className="mt-1 text-[12px] leading-6 text-ink-muted">One accent is enough. Choose the tone used for selection and meaningful status.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ACCENT_OPTIONS.map(option => {
              const selected = theme.accentOverride === option.value;
              return <button key={option.id} type="button" onClick={() => theme.setAccentOverride(option.value)}
                aria-pressed={selected} title={option.label}
                className={'flex items-center gap-2 rounded-[7px] border px-3 py-2 text-[11px] transition-colors ' +
                  (selected ? 'border-accent text-ink' : 'border-line text-ink-muted hover:border-ink-muted/60 hover:text-ink')}>
                <span className="size-3 rounded-full border border-line" style={{ backgroundColor: option.value ?? theme.palette.accent }}/>
                {option.label}
              </button>;
            })}
          </div>
          <p className="mt-6 border-t border-line pt-5 text-[11px] leading-5 text-ink-muted">
            Your theme settings are saved locally. Account passwords and Riot API credentials are never part of appearance preferences.
          </p>
        </div>
      </div>
    </section>

    <section className="a-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-[19px] font-semibold text-ink">Theme library</h2>
          <p className="mt-1 text-[11px] text-ink-muted">Purposeful alternatives to the default control-desk palette.</p></div>
        <div className="a-segment" role="group" aria-label="Theme brightness">
          {filters.map(item => <button type="button" key={item.value}
            aria-selected={filter === item.value} aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}>{item.label}</button>)}
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {visible.map(preset => {
          const chosen = preset.id === theme.presetId;
          const palette = preset.kind === 'auto'
            ? theme.systemPrefersDark ? preset.dark : (preset.light ?? preset.dark)
            : preset.dark;
          return <button key={preset.id} type="button" aria-pressed={chosen}
            title={preset.description} onClick={() => theme.setPreset(preset.id)}
            className={'group min-w-0 overflow-hidden rounded-[9px] border p-2 text-left transition-colors ' +
              (chosen ? 'border-accent bg-accent/[0.06]' : 'border-line bg-app/45 hover:border-ink-muted/60')}>
            <span className="relative block h-[125px] overflow-hidden rounded-[6px] border border-line">
              <ThemePreview palette={palette} style={theme.style}/>
              {chosen && <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-accent text-white">
                <CheckIcon width={13} height={13}/>
              </span>}
            </span>
            <span className="block px-1 pb-1 pt-3">
              <span className="block text-[12px] font-semibold text-ink">{preset.label}</span>
              <span className="mt-1 block truncate text-[10px] text-ink-muted">{preset.kind === 'auto' ? 'Follows Windows appearance' : preset.kind + ' palette'}</span>
            </span>
          </button>;
        })}
      </div>
    </section>

    <div className="a-panel-soft p-5 text-[12px] leading-6 text-ink-muted">
      <strong className="font-semibold text-ink">Privacy note.</strong> The appearance theme is local to the device. Website account sessions are held in the native process memory, while actual Riot tracking needs separate authorized access. Theme changes never trigger network requests.
    </div>
  </section>;
}
