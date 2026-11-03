import { useEffect, useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { useAventasAccount } from '../platform/AccountContext';
import { NAV_ITEMS, type NavId } from './nav';
import {
  BenchmarkIcon, InsightsIcon, MatchesIcon, OverviewIcon, PerformanceIcon,
  SettingsIcon, StatisticsIcon, UserIcon, TrophyIcon, GamepadIcon, CrosshairIcon,
} from './icons';

const icons: Record<NavId, typeof OverviewIcon> = {
  overview: OverviewIcon,
  live: CrosshairIcon,
  directory: UserIcon,
  performance: PerformanceIcon,
  benchmark: BenchmarkIcon,
  insights: InsightsIcon,
  profile: UserIcon,
  matches: MatchesIcon,
  tournaments: TrophyIcon,
  utilities: GamepadIcon,
  statistics: StatisticsIcon,
  settings: SettingsIcon,
};
const menu = new Map(NAV_ITEMS.map(item => [item.id, item]));
const labIds: NavId[] = ['performance','benchmark','insights','matches','profile','statistics'];
const groups: { label: string; ids: NavId[] }[] = [
  { label: 'Workspace', ids: ['overview'] },
  { label: 'Compete', ids: ['live','tournaments','directory'] },
  { label: 'System', ids: ['utilities'] },
];

interface SidebarProps { active: NavId; onNavigate: (id: NavId) => void; onSearch?: () => void }

function NavButton({ id, active, onNavigate }: { id: NavId; active: boolean; onNavigate: (id: NavId) => void }) {
  const item = menu.get(id)!;
  const Icon = icons[id];
  const label = item.label.startsWith('Demo: ') ? item.label.replace('Demo: ', '') : item.label;
  return <button type="button" onClick={() => onNavigate(id)} disabled={!item.enabled}
    title={item.label} aria-label={item.label} aria-current={active ? 'page' : undefined}
    className={[
      'group relative flex min-h-[39px] w-full items-center gap-3 rounded-[7px] px-2.5 text-left text-[12px] font-medium',
      'transition-colors duration-150 focus-visible:outline-offset-0',
      active ? 'bg-accent/10 text-ink' : 'text-ink-muted hover:bg-line/55 hover:text-ink',
    ].join(' ')}>
    {active && <span className="absolute bottom-[8px] left-0 top-[8px] w-[2px] rounded-r bg-accent" aria-hidden="true"/>}
    <Icon className={'shrink-0 ' + (active ? 'text-accent' : 'text-ink-muted group-hover:text-ink')} width={17} height={17}/>
    <span className="hidden truncate xl:block">{label}</span>
    {id === 'live' && <span className="ml-auto hidden rounded bg-line/80 px-1.5 py-0.5 text-[9px] text-ink-muted xl:inline">BETA</span>}
  </button>;
}

export function Sidebar({ active, onNavigate, onSearch }: SidebarProps) {
  const [labExpanded, setLabExpanded] = useState(() => labIds.includes(active));
  const { phase, account } = useAventasAccount();
  useEffect(() => { if (labIds.includes(active)) setLabExpanded(true); }, [active]);

  return <aside aria-label="Primary navigation" className="app-sidebar flex h-full w-[74px] shrink-0 flex-col overflow-y-auto border-r px-3 py-5 xl:w-[252px] xl:px-4">
    <div className="mb-9 flex items-center justify-center xl:justify-start xl:px-1">
      <BrandLogo />
    </div>
    <button type="button" onClick={onSearch} title="Search pages (Ctrl+K)"
      aria-label="Search pages"
      className="mb-6 flex min-h-[39px] items-center gap-2 rounded-[8px] border border-line bg-app/50 px-2.5 text-ink-muted transition-colors hover:border-ink-muted/60 hover:text-ink">
      <svg viewBox="0 0 24 24" fill="none" width="17" height="17" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="10.8" cy="10.8" r="6.5"/><path d="M16 16l5 5"/>
      </svg>
      <span className="hidden flex-1 text-left text-[12px] xl:block">Find a page</span>
      <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[10px] xl:inline">Ctrl K</kbd>
    </button>
    <nav className="flex flex-col gap-6" aria-label="Companion sections">
      {groups.map(group => <div key={group.label}>
        <p className="mb-2 hidden px-3 text-[10px] font-semibold text-ink-muted/70 xl:block">{group.label}</p>
        <div className="flex flex-col gap-1">
          {group.ids.map(id => <NavButton key={id} id={id} active={active === id} onNavigate={onNavigate}/>)}
        </div>
      </div>)}
      <div>
        <button type="button" aria-expanded={labExpanded} aria-controls="practice-lab-nav"
          onClick={() => setLabExpanded(expanded => !expanded)}
          title="Practice lab — simulated data" aria-label="Toggle practice lab"
          className="flex min-h-[39px] w-full items-center gap-3 rounded-[7px] px-2.5 text-[12px] font-medium text-ink-muted hover:bg-line/55 hover:text-ink">
          <BenchmarkIcon width={17} height={17} className="shrink-0"/>
          <span className="hidden flex-1 text-left xl:block">Practice lab</span>
          <svg className={'hidden transition-transform xl:block ' + (labExpanded ? 'rotate-180' : '')} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        {labExpanded && <div id="practice-lab-nav" className="mt-1 space-y-1 border-l border-line/80 pl-1.5 xl:ml-[18px] xl:pl-2">
          {labIds.map(id => <NavButton key={id} id={id} active={active === id} onNavigate={onNavigate}/>)}
          <p className="hidden px-3 pt-1 text-[10px] text-ink-muted xl:block">Sample performance data</p>
        </div>}
      </div>
    </nav>

    <div className="mt-auto space-y-3 border-t border-line/80 pt-4">
      <NavButton id="settings" active={active === 'settings'} onNavigate={onNavigate}/>
      <button type="button" onClick={() => onNavigate('live')}
        className="group flex w-full items-center gap-2 rounded-[8px] bg-app/70 p-2 text-left hover:bg-line/50 xl:p-3"
        title={account ? 'View connected Aventas account' : 'Connect Aventas account'}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] border border-line bg-panel font-display text-[13px] font-semibold text-ink">
          {account?.name?.slice(0,1).toUpperCase() || 'A'}
        </span>
        <span className="hidden min-w-0 flex-1 xl:block">
          <span className="block truncate text-[11px] font-medium text-ink">{account?.name || 'Guest workspace'}</span>
          <span className="mt-0.5 block text-[10px] text-ink-muted">{phase === 'signed-in' ? 'Website connected' : 'Connect account'}</span>
        </span>
        <span className={'a-status-dot ml-auto hidden xl:inline-block ' + (phase === 'signed-in' ? 'text-emerald-400' : 'text-ink-muted')} aria-hidden="true"/>
      </button>
      <div className="hidden items-center justify-between px-1 text-[10px] text-ink-muted/80 xl:flex">
        <span>Companion preview</span><span>v0.1.0</span>
      </div>
    </div>
  </aside>;
}
