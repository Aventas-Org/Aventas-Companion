import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAventasAccount } from '../platform/AccountContext';
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
      description: `VALORANT process detected (${processName ?? 'VALORANT.exe'}). This is local process monitoring only; live round capture is not enabled.`,
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
  const { phase, account } = useAventasAccount();
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (phase !== 'signed-in' || !account) { setDashboard(null); return; }
    let cancelled = false;
    void invoke<Record<string, unknown>>('desktop_companion_data', { endpoint: 'dashboard' })
      .then(value => { if (!cancelled) setDashboard(value); })
      .catch(() => { if (!cancelled) setDashboard(null); });
    return () => { cancelled = true; };
  }, [phase, account?.id]);

  const values = dashboard?.statistics && typeof dashboard.statistics === 'object'
    ? dashboard.statistics as Record<string, unknown> : {};
  const rank = dashboard?.rank && typeof dashboard.rank === 'object'
    ? dashboard.rank as Record<string, unknown> : {};
  const currentRank = rank.current && typeof rank.current === 'object'
    ? rank.current as Record<string, unknown> : {};
  const recent = Array.isArray(dashboard?.recentMatches) ? dashboard.recentMatches : [];
  const latest = recent[0] && typeof recent[0] === 'object' ? recent[0] as Record<string, unknown> : null;
  const metric = (value: unknown, digits = 0, suffix = '') =>
    typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) + suffix : '--';
  const connected = phase === 'signed-in';

  return (
    <div className="flex flex-1 flex-col gap-5 p-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight text-ink">Welcome back</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Your Aventas website account and verified VALORANT history, when available.
        </p>
      </header>

      {/* Metric row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Matches Played" value={metric(values.games)} helper={connected ? 'Official website history' : 'Sign in to Live Tracker'} />
        <StatCard label="Win Rate" value={metric(values.winRate, 1, '%')} helper={connected ? 'Website-synchronized data' : 'Not connected'} />
        <StatCard label="Average ACS" value={metric(values.acs)} helper="Only verified match records" />
        <StatCard label="Current Rank" value={typeof currentRank.tier === 'string' && Number(values.games || 0) > 0 ? currentRank.tier : '--'} helper="Riot link required" tone="accent" />
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
            description={connected ? 'Rank is shown only when supported by the server-side match history.' : 'Sign in through Live Tracker to view your account rank.'}
            icon={<TrophyIcon />}
            tone="accent"
            footer={
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-muted">Rank: {currentRank.tier && Number(values.games || 0) > 0 ? String(currentRank.tier) : 'Unavailable'}</span>
                <span className="text-[11px] text-ink-muted">{typeof currentRank.rr === 'number' && Number(values.games || 0) > 0 ? String(currentRank.rr) + ' RR' : 'No verified RR'}</span>
              </div>
            }
          />
        </div>

        <div className="flex flex-col gap-4">
          <InfoCard
            title="Last Match"
            description={latest ? String(latest.map || 'Unknown map') + ' · ' + String(latest.result || 'Result unavailable') : 'No verified recent match is available.'}
            icon={<CrosshairIcon />}
            footer={
              <p className="text-[11px] text-ink-muted">
                Only historical match data the website has actually synchronized appears here.
              </p>
            }
          />
          <InfoCard
            title="Session Summary"
            description="Local process detection shows whether VALORANT is running. Playtime and real-time records are not automatically captured."
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
