import { BrandLogo } from './BrandLogo';
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
      className="flex w-60 shrink-0 flex-col border-r border-white/5 bg-[#141419] px-4 py-6"
      aria-label="Primary navigation"
    >
      <div className="px-2">
        <BrandLogo />
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-1" aria-label="Sections">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
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
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70',
                isActive
                  ? 'bg-purple-500/15 text-purple-200'
                  : item.enabled
                    ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    : 'cursor-not-allowed text-slate-600',
              ].join(' ')}
            >
              <Icon
                className={
                  isActive ? 'text-purple-300' : 'text-slate-500 group-hover:text-slate-300'
                }
              />
              <span>{item.label}</span>
              {!item.enabled && (
                <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3">
        <p className="text-xs font-medium text-slate-400">Development Build</p>
        <p className="mt-0.5 text-[11px] text-slate-600">v0.1.0</p>
      </div>
    </aside>
  );
}
