import { InfoCard } from '../components/InfoCard';
import { NotificationCard, type NotificationTone } from '../components/NotificationCard';
import { StatCard } from '../components/StatCard';
import { CrosshairIcon, GamepadIcon, TrophyIcon } from '../components/icons';
import { useValorantStatus } from '../hooks/useValorantStatus';

type StatusState = ReturnType<typeof useValorantStatus>;

interface StatusView {
  tone: NotificationTone;
  title: string;
  description: string;
  statusLabel?: string;
  loading?: boolean;
}

/** Reduces the process-detection state into a single inline notification. */
function buildStatusView(state: StatusState): StatusView {
  if (state.phase === 'loading') {
    return {
      tone: 'neutral',
      title: 'Companion service',
      description: '',
      loading: true,
    };
  }

  if (state.phase === 'error') {
    return {
      tone: 'danger',
      title: 'Desktop companion offline',
      description:
        'Failed to communicate with the local companion service, so process detection is offline.',
      statusLabel: 'Error',
    };
  }

  const { status, processName } = state.response;

  if (status === 'running') {
    return {
      tone: 'success',
      title: 'VALORANT is running',
      description: `Monitoring your session (${processName ?? 'VALORANT.exe'}). Match context will be recorded as rounds complete.`,
      statusLabel: 'Active',
    };
  }

  if (status === 'not_running') {
    return {
      tone: 'neutral',
      title: 'VALORANT game status',
      description:
        'No game client detected right now. Launch VALORANT and this panel updates automatically.',
      statusLabel: 'Idle',
    };
  }

  return {
    tone: 'warning',
    title: 'Process detection unavailable',
    description: 'Detection needs the companion to run with appropriate permissions on Windows.',
    statusLabel: 'Warning',
  };
}

export function OverviewPage() {
  const valorantStatus = useValorantStatus();
  const status = buildStatusView(valorantStatus);

  return (
    <div className="flex flex-1 flex-col gap-5 p-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight text-ink">Welcome back</h2>
        <p className="mt-1 text-sm text-ink-muted">
          A summary of your VALORANT activity. Connect your Riot account to populate these stats.
        </p>
      </header>

      {/* Metric row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Matches Played" value="--" helper="No matches recorded yet" />
        <StatCard label="Win Rate" value="--" helper="No match data available" />
        <StatCard label="Average ACS" value="--" helper="Combat score pending" />
        <StatCard label="Current Rank" value="--" helper="Unranked" tone="accent" />
      </div>

      {/* Feed: notifications and context, not a sprawling centred block */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <NotificationCard
            tone={status.tone}
            title={status.title}
            description={status.description}
            statusLabel={status.statusLabel}
            loading={status.loading}
            icon={<GamepadIcon />}
          />
          <InfoCard
            title="Player Rank"
            description="You have not been placed in competitive yet. Play your placement matches to earn a rank."
            icon={<TrophyIcon />}
            tone="accent"
            footer={
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-muted">Rank: Unranked</span>
                <span className="text-[11px] text-ink-muted">0 placements remaining</span>
              </div>
            }
          />
        </div>

        <div className="flex flex-col gap-4">
          <InfoCard
            title="Last Match"
            description="No recent match found. History will appear here after your next game."
            icon={<CrosshairIcon />}
            footer={
              <p className="text-[11px] text-ink-muted">
                Kills, economy and round context load once a match completes.
              </p>
            }
          />
          <InfoCard
            title="Session Summary"
            description="Today's playtime and win/loss record will populate once game detection is active."
            icon={<GamepadIcon />}
            footer={
              <p className="text-[11px] text-ink-muted">
                Tracked automatically while VALORANT is running.
              </p>
            }
          />
        </div>
      </div>
    </div>
  );
}
