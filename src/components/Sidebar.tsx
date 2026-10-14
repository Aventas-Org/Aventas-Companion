import { BrandLogo } from './BrandLogo';
import { OverlayControl } from './OverlayControl';
import { NAV_ITEMS, type NavId } from './nav';
import {
  BenchmarkIcon,
  InsightsIcon,
  MatchesIcon,
  OverviewIcon,
  PerformanceIcon,
  SettingsIcon,
  StatisticsIcon,
  UserIcon,
} from './icons';

const NAV_ICONS: Record<NavId, typeof OverviewIcon> = {
  overview: OverviewIcon,
  performance: PerformanceIcon,
  benchmark: BenchmarkIcon,
  insights: InsightsIcon,
  profile: UserIcon,
  matches: MatchesIcon,
  statistics: StatisticsIcon,
  settings: SettingsIcon,
};

interface SidebarProps {
  active: NavId;
  onNavigate: (id: NavId) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside
      className="flex w-60 shrink-0 flex-col border-r border-line bg-panel px-4 py-6"
      aria-label="Primary navigation"
    >
      <div className="px-2">
        <BrandLogo />
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-1" aria-label="Sections">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.id];
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              disabled={!item.enabled}
              aria-current={isActive ? 'page' : undefined}
              title={item.enabled ? item.label : `${item.label} — coming soon`}
              className={[
                'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                isActive
                  ? 'bg-line text-ink'
                  : item.enabled
                    ? 'text-ink-muted hover:bg-line hover:text-ink'
                    : 'cursor-not-allowed text-ink-muted',
              ].join(' ')}
            >
              {/* Sharp accent rule on the absolute left edge marks the active item. */}
              {isActive && (
                <span
                  className="absolute bottom-1 left-0 top-1 w-[3px] bg-accent"
                  aria-hidden="true"
                />
              )}
              <Icon className={isActive ? 'text-accent' : 'text-ink-muted group-hover:text-ink'} />
              <span>{item.label}</span>
              {!item.enabled && (
                <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 flex flex-col gap-3">
        <OverlayControl />
        <div className="rounded-lg border border-line bg-panel px-3 py-3">
          <p className="text-xs font-medium text-ink-muted">Development Build</p>
          <p className="mt-0.5 text-[11px] text-ink-muted">v0.1.0</p>
        </div>
      </div>
    </aside>
  );
}
