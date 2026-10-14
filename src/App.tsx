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
import type { NavId } from './components/nav';

import './App.css';

/** Placeholder for navigation entries that are intentionally not built yet. */
function ComingSoonPage() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4l3 3" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-ink">Settings</h2>
        <p className="mt-1 text-sm text-ink-muted">
          This section is coming soon. Round Analysis, Rank Benchmark, Insights, Overview, Profile,
          Matches, and Statistics are the active views in this build.
        </p>
      </div>
    </div>
  );
}

/** Every navigable section maps to exactly one page component. */
const PAGES: Record<NavId, ComponentType> = {
  overview: OverviewPage,
  performance: PerformancePage,
  benchmark: BenchmarkPage,
  insights: InsightsPage,
  matches: MatchHistoryPage,
  profile: ProfilePage,
  statistics: StatisticsPage,
  settings: ComingSoonPage,
};

function App() {
  const [activeNav, setActiveNav] = useState<NavId>('overview');
  const Page = PAGES[activeNav];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-app text-ink">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />
      <main className="flex-1 overflow-y-auto">
        <Page />
      </main>
    </div>
  );
}

export default App;
