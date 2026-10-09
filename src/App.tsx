import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { ProfilePage } from './pages/ProfilePage';
import type { NavId } from './components/nav';

import './App.css';

function App() {
  const [activeNav, setActiveNav] = useState<NavId>('overview');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f0f12] text-slate-200">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />
      <main className="flex-1 overflow-y-auto">
        {activeNav === 'overview' && <OverviewPage />}
        {activeNav === 'profile' && <ProfilePage />}
        {activeNav !== 'overview' && activeNav !== 'profile' && (
          <div className="flex h-full items-center justify-center p-6">
            <div className="max-w-md text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
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
              <h2 className="text-lg font-semibold text-white">
                {activeNav.charAt(0).toUpperCase() + activeNav.slice(1)}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                This section is coming soon. Overview and Profile are the only active views in this
                build.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
