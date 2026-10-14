import { useState } from 'react';
import type { ComponentType } from 'react';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { ProfilePage } from './pages/ProfilePage';
import { MatchHistoryPage } from './pages/MatchHistoryPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { PerformancePage } from './pages/PerformancePage';
import { BenchmarkPage } from './pages/BenchmarkPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import type { NavId } from './components/nav';

import './App.css';

/** Every navigable section maps to exactly one page component. */
const PAGES: Record<NavId, ComponentType> = {
  overview: OverviewPage,
  performance: PerformancePage,
  benchmark: BenchmarkPage,
  insights: InsightsPage,
  matches: MatchHistoryPage,
  profile: ProfilePage,
  statistics: StatisticsPage,
  settings: SettingsPage,
};

function App() {
  const [activeNav, setActiveNav] = useState<NavId>('overview');
  const Page = PAGES[activeNav];

  return (
    // `app-shell` paints the active preset's artwork behind the panels.
    <div className="app-shell flex h-screen w-screen overflow-hidden text-ink">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />
      <main className="flex-1 overflow-y-auto">
        <Page />
      </main>
    </div>
  );
}

export default App;
