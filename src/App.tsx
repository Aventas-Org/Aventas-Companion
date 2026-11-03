import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { OverviewPage } from './pages/OverviewPage';
import { LiveTrackerPage } from './pages/LiveTrackerPage';
import { PlayerDirectoryPage } from './pages/PlayerDirectoryPage';
import { AccountProvider, useAventasAccount } from './platform/AccountContext';
import { ProfilePage } from './pages/ProfilePage';
import { MatchHistoryPage } from './pages/MatchHistoryPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { GamingUtilitiesPage } from './pages/GamingUtilitiesPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { PerformancePage } from './pages/PerformancePage';
import { BenchmarkPage } from './pages/BenchmarkPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NAV_ITEMS, type NavId } from './components/nav';
import './App.css';

type PageProps = { onNavigate?: (id: NavId) => void };
const PAGES: Record<NavId, ComponentType<PageProps>> = {
  overview: OverviewPage, live: LiveTrackerPage, directory: PlayerDirectoryPage,
  performance: PerformancePage, benchmark: BenchmarkPage, insights: InsightsPage,
  matches: MatchHistoryPage, tournaments: TournamentsPage, utilities: GamingUtilitiesPage,
  profile: ProfilePage, statistics: StatisticsPage, settings: SettingsPage,
};

function Workbench() {
  const [active, setActive] = useState<NavId>('overview');
  const [searchOpen, setSearchOpen] = useState(false);
  const { phase } = useAventasAccount();
  const Page = PAGES[active];
  const item = NAV_ITEMS.find(entry => entry.id === active)!;
  const isDemo = item.label.startsWith('Demo:');

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(value => !value);
      } else if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);

  return <div className="app-shell flex h-screen w-screen min-w-[320px] overflow-hidden text-ink">
    <Sidebar active={active} onNavigate={setActive} onSearch={() => setSearchOpen(true)}/>
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header className="app-topbar z-20 flex h-[64px] shrink-0 items-center justify-between gap-4 px-5 xl:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden text-[12px] font-semibold text-ink-muted md:inline">Companion</span>
          <span className="hidden h-[13px] w-px bg-line md:inline" aria-hidden="true"/>
          <span className="truncate font-display text-[14px] font-semibold text-ink">
            {item.label.startsWith('Demo: ') ? item.label.replace('Demo: ', '') : item.label}
          </span>
          {isDemo && <span className="a-chip hidden border-amber-500/25 text-amber-300 md:inline-flex">Sample data</span>}
        </div>
        <div className="flex shrink-0 items-center gap-3 xl:gap-5">
          <span className="hidden items-center gap-2 text-[11px] text-ink-muted sm:flex">
            <span className={'a-status-dot ' + (phase === 'signed-in' ? 'text-emerald-400' : 'text-ink-muted')}/>
            {phase === 'signed-in' ? 'Account connected' : phase === 'checking' ? 'Connecting…' : 'Guest session'}
          </span>
          <span className="hidden h-5 w-px bg-line md:block"/>
          <button type="button" onClick={() => setSearchOpen(true)} className="a-button !px-3 !py-2" title="Find a page (Ctrl+K)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 5 5"/></svg>
            <span className="hidden sm:inline">Quick jump</span>
            <kbd className="ml-1 hidden font-mono text-[10px] text-ink-muted lg:inline">Ctrl K</kbd>
          </button>
        </div>
      </header>
      <main key={active} className="app-main min-w-0 flex-1 overflow-y-auto" aria-label={item.label}>
        <div className="app-main-inner a-view-in">
          <Page onNavigate={setActive}/>
        </div>
      </main>
    </div>
    <CommandPalette open={searchOpen} active={active} onClose={() => setSearchOpen(false)}
      onNavigate={page => { setActive(page); setSearchOpen(false); }}/>
  </div>;
}

function App() {
  return <AccountProvider><Workbench /></AccountProvider>;
}
export default App;
