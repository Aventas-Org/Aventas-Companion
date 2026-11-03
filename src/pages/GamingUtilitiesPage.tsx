import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useValorantStatus } from '../hooks/useValorantStatus';
import { OverlayControl } from '../components/OverlayControl';
import { GamepadIcon, PerformanceIcon, SettingsIcon } from '../components/icons';

interface SystemMetrics {
  cpuPercent: number | null;
  memoryPercent: number;
  totalMemoryBytes: number;
  usedMemoryBytes: number;
}
interface Sample { cpu: number | null; memory: number }
const percent = (number: number | null | undefined) =>
  typeof number === 'number' && Number.isFinite(number) ? number.toFixed(1) + '%' : '—';
const gib = (number: number | null | undefined) =>
  typeof number === 'number' && Number.isFinite(number) ? (number / 1024 ** 3).toFixed(1) + ' GiB' : '—';

function LiveSparkline({ samples, kind }: { samples: Sample[]; kind: 'cpu' | 'memory' }) {
  const good = samples.map((s, i) => ({ x: i, y: s[kind] })).filter(p => typeof p.y === 'number' && Number.isFinite(p.y));
  if (good.length < 2) return <div className="flex h-[100px] items-center justify-center text-[11px] text-ink-muted">Collecting system samples…</div>;
  const denominator = Math.max(samples.length - 1, 1);
  const points = good.map(p => {
    const y = Math.max(4, Math.min(60, 64 - (p.y as number) * .6));
    return { x: 220 * p.x / denominator, y };
  });
  const line = points.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
  const fill = line + ' L ' + points[points.length - 1].x.toFixed(1) + ' 64 L ' + points[0].x.toFixed(1) + ' 64 Z';
  const stroke = kind === 'cpu' ? 'rgb(var(--color-accent))' : '#64bea9';
  return <svg role="img" aria-label={kind === 'cpu' ? 'CPU usage history from actual Windows samples' : 'Physical RAM usage history from actual Windows samples'}
    className="h-[100px] w-full" viewBox="0 0 220 64" preserveAspectRatio="none">
    <title>{kind === 'cpu' ? 'CPU usage' : 'RAM usage'} over recent five-second intervals</title>
    <path d="M0 16H220M0 32H220M0 48H220" stroke="rgb(var(--color-line))" strokeWidth=".5" strokeDasharray="3 5"/>
    <path d={fill} fill={kind === 'cpu' ? 'rgb(var(--color-accent) / .12)' : 'rgba(100,190,169,.10)'}/>
    <path d={line} stroke={stroke} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>;
}

export function GamingUtilitiesPage() {
  const status = useValorantStatus();
  const running = status.phase === 'ready' && status.response.status === 'running';
  const [started, setStarted] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [metricsError, setMetricsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let fetching = false;
    async function sample() {
      if (fetching) return;
      fetching = true;
      try {
        const data = await invoke<SystemMetrics>('read_system_metrics');
        if (cancelled) return;
        setMetrics(data); setMetricsError(false);
        setSamples(values => [...values, {
          cpu: typeof data.cpuPercent === 'number' ? data.cpuPercent : null,
          memory: data.memoryPercent,
        }].slice(-24));
      } catch {
        if (!cancelled) { setMetricsError(true); setMetrics(null); }
      } finally { fetching = false; }
    }
    void sample();
    const timer = window.setInterval(() => void sample(), 5_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!running) { setStarted(null); setSeconds(0); return; }
    setStarted(value => value ?? Date.now());
  }, [running]);

  useEffect(() => {
    if (!running || !started) return;
    setSeconds(Math.floor((Date.now() - started) / 1_000));
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1_000)), 1_000);
    return () => window.clearInterval(timer);
  }, [running, started]);

  const sessionTime = [
    Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60,
  ].map(value => String(value).padStart(2, '0')).join(':');
  const statusTitle = status.phase === 'loading' ? 'Scanning for VALORANT…'
    : status.phase === 'error' ? 'Game detector unavailable' : running ? 'VALORANT detected'
    : status.response.status === 'not_running' ? 'VALORANT is not running' : 'Process status unavailable';

  return <section className="page-stage space-y-6">
    <header>
      <p className="page-kicker">Aventas / Local tools</p>
      <h1 className="page-heading mt-2">System desk.</h1>
      <p className="page-description mt-3">Useful read-only Windows diagnostics, game detection and a controlled historical overlay preview.</p>
    </header>

    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(250px,.7fr)]">
      <div className="a-hero flex min-h-[215px] flex-wrap items-center gap-7 p-7 sm:p-8">
        <div className={'flex size-[82px] shrink-0 items-center justify-center rounded-full border ' +
          (running ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-400' : 'border-line bg-app/80 text-accent')}>
          <GamepadIcon width={36} height={36}/>
        </div>
        <div className="min-w-0 flex-1">
          <span className="a-chip" data-tone={running ? 'live' : 'neutral'}>
            <span className="a-status-dot"/>{running ? 'Game active' : 'Local check'}
          </span>
          <h2 className="mt-4 font-display text-[23px] font-semibold tracking-[-.03em] text-ink">{statusTitle}</h2>
          <p className="mt-2 text-[12px] leading-6 text-ink-muted">
            {status.phase === 'ready' && status.response.processName
              ? 'Detected executable: ' + status.response.processName
              : 'Uses Windows process enumeration with no injection or game-memory access.'}
          </p>
          <p className="mt-2 text-[11px] text-ink-muted">Checks every five seconds while this page is open.</p>
        </div>
      </div>
      <div className="a-panel flex flex-col justify-between p-6">
        <span className="a-eyebrow">Current observation</span>
        <p className="a-number mt-7 text-[39px] leading-none text-ink">{running ? sessionTime : '00:00:00'}</p>
        <div className="mt-6 border-t border-line pt-4 text-[11px] leading-6 text-ink-muted">
          Time observed in this tab only. Not a lifetime playtime tracker, and resets when the game closes or this page is left.
        </div>
      </div>
    </div>

    <section className="a-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
        <div>
          <h2 className="font-display text-[19px] font-semibold text-ink">Windows performance</h2>
          <p className="mt-1 text-[11px] text-ink-muted">Total device usage, sampled using Windows system APIs</p>
        </div>
        <span className="a-chip" data-tone={metricsError ? 'warning' : 'neutral'}>
          <span className="a-status-dot"/>{metricsError ? 'Unavailable' : 'Read-only · 5s refresh'}
        </span>
      </div>
      {metricsError ? <div role="alert" className="a-empty m-5">
        Windows telemetry is unavailable. Try reopening Companion. No data is fabricated while monitoring is offline.
      </div> : <div className="grid gap-0 lg:grid-cols-2">
        <div className="border-b border-line p-6 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="a-eyebrow">Overall CPU utilization</p>
              <p className="a-number mt-2 text-[32px] text-ink">{percent(metrics?.cpuPercent)}</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-[7px] border border-line bg-app text-accent">
              <PerformanceIcon width={19} height={19}/>
            </span>
          </div>
          <div className="mt-5"><LiveSparkline samples={samples} kind="cpu"/></div>
          <p className="mt-3 text-[11px] text-ink-muted">Device-wide CPU load, not VALORANT FPS or game CPU utilization.</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="a-eyebrow">Physical memory in use</p>
              <p className="a-number mt-2 text-[32px] text-ink">{percent(metrics?.memoryPercent)}</p>
              <p className="mt-1 text-[11px] text-ink-muted">{gib(metrics?.usedMemoryBytes)} / {gib(metrics?.totalMemoryBytes)}</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-[7px] border border-line bg-app text-[#64bea9]">
              <SettingsIcon width={19} height={19}/>
            </span>
          </div>
          <div className="mt-5"><LiveSparkline samples={samples} kind="memory"/></div>
          <p className="mt-3 text-[11px] text-ink-muted">Memory sampling is local; no hardware telemetry is uploaded.</p>
        </div>
      </div>}
    </section>

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,.85fr)]">
      <OverlayControl/>
      <div className="a-panel p-5">
        <span className="a-chip">Privacy first</span>
        <h2 className="mt-4 font-display text-[18px] font-semibold text-ink">No invisible game hooks.</h2>
        <p className="mt-3 text-[12px] leading-7 text-ink-muted">
          Companion monitors the Windows process list and supported device counters. It does not capture opponents, alter the game, bypass Vanguard or inspect VALORANT's private memory.
        </p>
        <div className="mt-6 space-y-3 border-t border-line pt-5 text-[11px] text-ink-muted">
          <div className="flex items-center gap-2"><span className="a-status-dot text-emerald-400"/>Supported: Windows CPU and RAM</div>
          <div className="flex items-center gap-2"><span className="a-status-dot text-emerald-400"/>Supported: local VALORANT process detection</div>
          <div className="flex items-center gap-2"><span className="a-status-dot text-amber-300"/>Not included: GPU temperatures or true in-game FPS</div>
        </div>
      </div>
    </div>
  </section>;
}
