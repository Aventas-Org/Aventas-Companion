import { StatCard } from '../components/StatCard';
import { InfoCard } from '../components/InfoCard';
import { CrosshairIcon, GamepadIcon, TrophyIcon } from '../components/icons';

export function OverviewPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Welcome header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h2>
        <p className="mt-1 text-sm text-slate-400">
          A summary of your VALORANT activity. Connect your Riot account to populate these stats.
        </p>
      </div>

      {/* Top summary cards — realistic empty states */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Matches Played"
          value="—"
          helper="No matches recorded yet"
          accent="slate"
        />
        <StatCard label="Win Rate" value="—" helper="No match data available" accent="slate" />
        <StatCard label="Average ACS" value="—" helper="Combat score pending" accent="slate" />
        <StatCard label="Current Rank" value="—" helper="Unranked" accent="purple" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* VALORANT game-status card — takes 2 columns */}
        <div className="xl:col-span-2">
          <InfoCard
            title="VALORANT Game Status"
            description="Aventas Companion monitors your VALORANT session and surfaces match context. No game client detected right now."
            icon={<GamepadIcon />}
            accent="purple"
            footer={
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-slate-600" />
                  Game client not running
                </span>
                <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-400">
                  v0.1.0
                </span>
              </div>
            }
          />
        </div>

        {/* Last match card — empty state */}
        <InfoCard
          title="Last Match"
          description="No recent match found."
          icon={<CrosshairIcon />}
          accent="slate"
          footer={
            <p className="text-[11px] text-slate-500">
              Match history will appear here after your next game.
            </p>
          }
        />
      </div>

      {/* Player rank card — empty state */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfoCard
          title="Player Rank"
          description="You have not been placed in competitive yet. Play placement matches to earn a rank."
          icon={<TrophyIcon />}
          accent="purple"
          footer={
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Rank: Unranked</span>
              <span className="text-[11px] text-slate-600">0 placements remaining</span>
            </div>
          }
        />
        <InfoCard
          title="Session Summary"
          description="A summary of today's activity will populate once game detection is active."
          icon={<GamepadIcon />}
          accent="slate"
          footer={
            <p className="text-[11px] text-slate-500">
              Playtime and win/loss stats will be tracked here.
            </p>
          }
        />
      </div>
    </div>
  );
}
