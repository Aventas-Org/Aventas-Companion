import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { TopNav } from './components/TopNav';
import { CommandPalette } from './components/CommandPalette';
import { OverviewPage } from './pages/OverviewPage';
import { LiveTrackerPage } from './pages/LiveTrackerPage';
import { PlayerDirectoryPage } from './pages/PlayerDirectoryPage';
import { AccountProvider } from './platform/AccountContext';
import { ProfilePage } from './pages/ProfilePage';
import { TrackerProfilePage } from './pages/TrackerProfilePage';
import { TournamentsPage } from './pages/TournamentsPage';
import { GamingUtilitiesPage } from './pages/GamingUtilitiesPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { PerformancePage } from './pages/PerformancePage';
import { BenchmarkPage } from './pages/BenchmarkPage';
import { InsightsPage } from './pages/InsightsPage';
import { LiveMatchPage } from './pages/LiveMatchPage';
import { SettingsPage } from './pages/SettingsPage';
import { NAV_ITEMS, type NavId } from './components/nav';
import './App.css';

type PageProps = { onNavigate?: (id: NavId) => void };
const PAGES: Record<NavId, ComponentType<PageProps>> = {
  overview: OverviewPage, live: LiveTrackerPage, directory: PlayerDirectoryPage,
  performance: PerformancePage, benchmark: BenchmarkPage, insights: InsightsPage,
  matches: TrackerProfilePage, tournaments: TournamentsPage, utilities: GamingUtilitiesPage,
  profile: ProfilePage, livematch: LiveMatchPage, statistics: StatisticsPage, settings: SettingsPage,
};

function Workbench() {
  const [active, setActive] = useState<NavId>('overview');
  const [searchOpen, setSearchOpen] = useState(false);
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

  return <div className="app-shell flex h-screen w-screen min-w-[320px] flex-col overflow-hidden text-ink">
    <TopNav active={active} onNavigate={setActive} onSearch={() => setSearchOpen(true)}/>
    {isDemo && <div className="demo-ribbon" role="note">Practice lab uses sample data. Nothing here comes from your matches.</div>}
    <main key={active} className="app-main min-w-0 flex-1 overflow-y-auto" aria-label={item.label}>
      <div className="app-main-inner a-view-in">
        <Page onNavigate={setActive}/>
      </div>
    </main>
    <CommandPalette open={searchOpen} active={active} onClose={() => setSearchOpen(false)}
      onNavigate={page => { setActive(page); setSearchOpen(false); }}/>
  </div>;
}

function App() {
  return <AccountProvider><Workbench /></AccountProvider>;
}
export default App;
