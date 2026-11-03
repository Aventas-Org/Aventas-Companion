import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { validTournament, validBracket } from '../services/tournamentContract.mjs';
import type { Tournament, Match, Bracket } from '../services/tournamentContract.mjs';
import { TrophyIcon, MatchesIcon } from '../components/icons';

type ListState = { status: 'loading' | 'ready' | 'error'; rows: Tournament[] };
type DetailState = { status: 'loading' | 'ready' | 'error'; value: Bracket | null };
type EventFilter = 'all' | 'live' | 'upcoming' | 'completed';
const filters: { value: EventFilter; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'live', label: 'Live' },
  { value: 'upcoming', label: 'Upcoming' }, { value: 'completed', label: 'Completed' },
];
const officialLink = (slug: string) => 'https://aventasgaming.com/tournaments/' + encodeURIComponent(slug);
const humanDate = (date?: number): string =>
  typeof date === 'number' && date > 0 && Number.isFinite(date)
    ? new Date(date).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : 'Schedule to be announced';
const stage = (round: number, finalRound: number) =>
  round === finalRound ? 'Grand final' : round === finalRound - 1 ? 'Semifinals' :
  round === finalRound - 2 ? 'Quarterfinals' : 'Round ' + round;
const statusLabel = (value: string) => value === 'live' ? 'Live' : value === 'completed' ? 'Finished' : 'Upcoming';

function MatchCard({ match, active, onSelect }: { match: Match; active: boolean; onSelect: () => void }) {
  const showScore = match.status === 'completed' || match.status === 'live';
  const scoreA = showScore ? match.scoreA : null;
  const scoreB = showScore ? match.scoreB : null;
  const winA = match.status === 'completed' && scoreA !== null && scoreB !== null && scoreA > scoreB;
  const winB = match.status === 'completed' && scoreA !== null && scoreB !== null && scoreB > scoreA;

  return <button type="button" onClick={onSelect} aria-pressed={active}
    aria-label={`Match ${match.slot + 1}: ${match.teamA || 'TBD'} versus ${match.teamB || 'TBD'}; ${statusLabel(match.status)}`}
    className={'group block h-[104px] w-[238px] overflow-hidden rounded-[9px] border text-left transition-[border-color,background] duration-150 ' +
      (active ? 'border-accent bg-accent/[0.065]' : 'border-line bg-panel hover:border-ink-muted/50')}>
    <div className="flex h-[39px] items-center justify-between gap-3 border-b border-line/60 px-3">
      <span className={'min-w-0 truncate text-[12px] ' + (winA ? 'font-bold text-ink' : 'font-medium text-ink-muted')}>
        {match.teamA || 'To be decided'}
      </span>
      <span className={'a-number text-[16px] ' + (winA ? 'text-emerald-400' : 'text-ink')}>
        {scoreA ?? '—'}
      </span>
    </div>
    <div className="flex h-[39px] items-center justify-between gap-3 border-b border-line/60 px-3">
      <span className={'min-w-0 truncate text-[12px] ' + (winB ? 'font-bold text-ink' : 'font-medium text-ink-muted')}>
        {match.teamB || 'To be decided'}
      </span>
      <span className={'a-number text-[16px] ' + (winB ? 'text-emerald-400' : 'text-ink')}>
        {scoreB ?? '—'}
      </span>
    </div>
    <div className="flex h-[26px] items-center justify-between px-3 text-[10px]">
      <span className={'font-semibold ' + (match.status === 'live' ? 'text-emerald-400' : 'text-ink-muted')}>
        {match.status === 'live' ? '● Live' : match.status === 'completed' ? 'Final' : 'Awaiting play'}
      </span>
      <span className="text-ink-muted">Match {match.slot + 1}</span>
    </div>
  </button>;
}

/** Single elimination from official (round, slot). Connectors are derived from
 * parent slots only for display. The app never generates a matchup or score. */
export function BracketBoard({ bracket }: { bracket: Bracket }) {
  const [selected, setSelected] = useState<string | null>(null);
  if (bracket.tournament.format && bracket.tournament.format !== 'single_elimination') {
    return <div className="a-empty">
      <p className="font-semibold text-ink">This bracket format is not yet supported</p>
      <p className="mt-1">Companion can display single-elimination trees. Use the official website for other competition formats.</p>
    </div>;
  }
  if (!bracket.matches.length) return <div className="a-empty">
    <p className="font-semibold text-ink">Bracket not published</p>
    <p className="mt-1">The organizer will populate official pairings on the website. This screen updates when they do.</p>
  </div>;

  const finalRound = Math.max(...bracket.matches.map(m => m.round));
  const rounds = Array.from(new Set(bracket.matches.map(m => m.round))).sort((a, b) => a - b);
  const boardWidth = rounds.length * 238 + Math.max(0, rounds.length - 1) * 86;
  const unit = 144;
  const cardHeight = 104;
  const columnWidth = 324;
  const topFor = (round: number, slot: number) =>
    (Math.pow(2, round - 1) - 1) * unit / 2 + slot * Math.pow(2, round - 1) * unit + 55;
  const boardHeight = Math.max(280, ...bracket.matches.map(m => topFor(m.round, m.slot) + cardHeight + 28));
  const ordered = [...bracket.matches].sort((a, b) => a.round - b.round || a.slot - b.slot);
  const bySlot = new Map(bracket.matches.map(m => [m.round + ':' + m.slot, m]));
  const details = bracket.matches.find(m => m.id === selected) ??
    bracket.matches.find(m => m.status === 'live') ??
    bracket.matches.find(m => m.round === finalRound);

  return <section className="space-y-4" aria-label="Official tournament bracket">
    <div className="a-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h3 className="font-display text-[17px] font-semibold text-ink">Official bracket</h3>
          <p className="mt-1 text-[11px] text-ink-muted">Website pairings · Scroll horizontally to follow the path to the final</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-muted">
          <span>{rounds.length} round{rounds.length === 1 ? '' : 's'}</span>
          <span className="h-3 w-px bg-line" aria-hidden="true"/>
          <span>{bracket.matches.length} match{bracket.matches.length === 1 ? '' : 'es'}</span>
        </div>
      </div>
      <div className="overflow-x-auto px-5 pb-5">
        <div className="relative mt-5" style={{ width: boardWidth, height: boardHeight }}>
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0" width={boardWidth} height={boardHeight} fill="none">
            {ordered.filter(m => bySlot.has((m.round + 1) + ':' + Math.floor(m.slot / 2))).map(m => {
              const fromX = (rounds.indexOf(m.round)) * columnWidth + 238;
              const toX = (rounds.indexOf(m.round + 1)) * columnWidth;
              const startY = topFor(m.round, m.slot) + cardHeight / 2;
              const endY = topFor(m.round + 1, Math.floor(m.slot / 2)) + cardHeight / 2;
              return <path key={m.id} d={`M ${fromX} ${startY} H ${fromX + 28} V ${endY} H ${toX}`}
                stroke="currentColor" strokeWidth="1.5" className="text-ink-muted/35"/>;
            })}
          </svg>
          {rounds.map((round, index) => <div key={round} className="absolute top-0" style={{ left: index * columnWidth, width: 238 }}>
            <div className="flex h-[38px] items-baseline justify-between border-b border-line">
              <h4 className="font-display text-[13px] font-semibold text-ink">{stage(round, finalRound)}</h4>
              <span className="font-mono text-[10px] text-ink-muted">{String(round).padStart(2, '0')}</span>
            </div>
          </div>)}
          {ordered.map(m => <div key={m.id} className="absolute"
            style={{ left: rounds.indexOf(m.round) * columnWidth, top: topFor(m.round, m.slot) }}>
            <MatchCard match={m} active={details?.id === m.id} onSelect={() => setSelected(m.id)}/>
          </div>)}
        </div>
      </div>
    </div>

    {details && <div className="a-panel grid items-center gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto]">
      <div>
        <p className="a-eyebrow">Selected match / {stage(details.round, finalRound)}</p>
        <p className="mt-2 font-display text-[18px] font-semibold text-ink">
          {details.teamA || 'TBD'} <span className="mx-1 text-ink-muted">vs</span> {details.teamB || 'TBD'}
        </p>
        <p className="mt-2 text-[12px] text-ink-muted">
          {humanDate(details.scheduledAt)} · Best of {details.bestOf || '—'} · {statusLabel(details.status)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="a-chip" data-tone={details.status === 'live' ? 'live' : 'neutral'}>{statusLabel(details.status)}</span>
        <span className="a-number text-[21px] text-ink">
          {details.status === 'completed' || details.status === 'live'
            ? details.scoreA + ' : ' + details.scoreB : '— : —'}
        </span>
      </div>
    </div>}
  </section>;
}

export function TournamentsPage() {
  const [list, setList] = useState<ListState>({ status: 'loading', rows: [] });
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailState>({ status: 'loading', value: null });
  const [filter, setFilter] = useState<EventFilter>('all');
  const [search, setSearch] = useState('');
  const [revision, setRevision] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [openError, setOpenError] = useState('');
  const listRevision = useRef(0);

  const refreshList = useCallback(async () => {
    const requestId = ++listRevision.current;
    try {
      const payload = await invoke<{ tournaments: unknown[] }>('fetch_public_tournaments');
      if (!Array.isArray(payload?.tournaments)) throw new Error('Invalid list');
      const rows = payload.tournaments.filter(validTournament).sort((a, b) => {
        const priority = (t: Tournament) => t.status === 'live' ? 0 : t.status === 'upcoming' ? 1 : 2;
        return priority(a) - priority(b) || (a.startsAt || 0) - (b.startsAt || 0);
      });
      if (listRevision.current !== requestId) return;
      setList({ status: 'ready', rows });
      setLastSync(Date.now());
      setSelected(current => current && rows.some(t => t.slug === current) ? current : rows[0]?.slug || null);
    } catch {
      if (listRevision.current === requestId) setList(previous => ({ status: 'error', rows: previous.rows }));
    }
  }, []);

  useEffect(() => {
    void refreshList();
    const timer = window.setInterval(() => void refreshList(), 60_000);
    return () => { ++listRevision.current; window.clearInterval(timer); };
  }, [refreshList, revision]);

  useEffect(() => {
    if (!selected) { setDetail({ status: 'ready', value: null }); return; }
    const slug = selected;
    let cancelled = false, newest = 0;
    setDetail({ status: 'loading', value: null });
    const load = async () => {
      const requestId = ++newest;
      try {
        const payload = await invoke<unknown>('fetch_public_tournament_detail', { slug });
        if (!validBracket(payload, slug)) throw new Error('Invalid official bracket');
        if (!cancelled && requestId === newest) setDetail({ status: 'ready', value: payload });
      } catch {
        if (!cancelled && requestId === newest) setDetail({ status: 'error', value: null });
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [selected, revision]);

  const visible = useMemo(() => list.rows.filter(event =>
    (filter === 'all' || event.status === filter) &&
    (!search.trim() || (event.name + ' ' + event.game + ' ' + event.region)
      .toLowerCase().includes(search.trim().toLowerCase()))
  ), [list.rows, search, filter]);
  const tournament = detail.value?.tournament;

  async function openEvent(slug: string) {
    setOpenError('');
    try { await invoke('open_official_tournament', { slug }); }
    catch { setOpenError('Could not open your default browser. You can visit ' + officialLink(slug)); }
  }

  return <section className="page-stage space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="page-kicker">Aventas / Competition</p>
        <h1 className="page-heading mt-2">Tournament circuit.</h1>
        <p className="page-description mt-3">Browse official Aventas events and follow the bracket as results are published.</p>
      </div>
      <button className="a-button" type="button" onClick={() => setRevision(n => n + 1)}>
        <svg aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M5 10a7.5 7.5 0 0 1 13-3m1 7a7.5 7.5 0 0 1-13 3"/></svg>
        Refresh events
      </button>
    </header>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="a-segment" role="tablist" aria-label="Tournament status">
        {filters.map(item => <button type="button" role="tab" key={item.value}
          aria-selected={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}
      </div>
      <span className="text-[11px] text-ink-muted">
        {list.status === 'error' ? 'Website unreachable · results may be outdated'
          : lastSync ? 'Website checked ' + new Date(lastSync).toLocaleTimeString() : 'Connecting to website'}
      </span>
    </div>

    <div className="grid items-start gap-5 xl:grid-cols-[286px_minmax(0,1fr)]">
      <aside className="a-panel min-w-0 overflow-hidden" aria-label="Tournament selector">
        <div className="border-b border-line p-3">
          <label htmlFor="event-search" className="sr-only">Search official tournaments</label>
          <input id="event-search" className="a-input !min-h-[38px] !text-[12px]" value={search}
            placeholder="Search competitions…" onChange={e => setSearch(e.target.value)}/>
        </div>
        {list.status === 'loading' && !list.rows.length && <p role="status" className="p-5 text-[12px] text-ink-muted">Loading Aventas events…</p>}
        {list.status === 'error' && !list.rows.length && <div className="a-empty m-3">Can't reach the tournament service. Check your connection and refresh.</div>}
        {list.status === 'ready' && !visible.length && <div className="a-empty m-3">No events match these filters. Try another status or search.</div>}
        <div className="max-h-[680px] divide-y divide-line/70 overflow-y-auto">
          {visible.map(event => <button key={event.slug} type="button"
            aria-pressed={selected === event.slug} onClick={() => setSelected(event.slug)}
            className={'a-pressable flex w-full gap-3 border-l-[2px] px-4 py-4 text-left ' +
              (selected === event.slug ? 'border-l-accent bg-accent/[0.055]' : 'border-l-transparent')}>
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[7px] border border-line bg-app text-accent">
              <TrophyIcon width={18} height={18}/>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[13px] font-semibold text-ink">{event.name}</span>
              <span className="mt-1 block text-[11px] text-ink-muted">{event.game || 'VALORANT'}{event.region ? ' / ' + event.region : ''}</span>
              <span className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-ink-muted">{humanDate(event.startsAt)}</span>
                <span className="a-chip !px-1.5 !py-0.5" data-tone={event.status === 'live' ? 'live' : 'neutral'}>
                  {statusLabel(event.status)}
                </span>
              </span>
            </span>
          </button>)}
        </div>
        <div className="border-t border-line px-4 py-3 text-[11px] text-ink-muted">
          {list.rows.length} official event{list.rows.length === 1 ? '' : 's'} from the website
        </div>
      </aside>

      <div className="min-w-0 space-y-5">
        {!selected && <div className="a-empty">
          <h2 className="font-display text-[18px] font-semibold text-ink">No event selected</h2>
          <p className="mt-2">Choose a competition from the list to inspect its bracket and official results.</p>
        </div>}
        {selected && detail.status === 'loading' && <div role="status" className="a-panel p-8 text-[12px] text-ink-muted">Loading official tournament and bracket…</div>}
        {selected && detail.status === 'error' && <div role="alert" className="a-empty">
          <p className="font-semibold text-ink">Bracket couldn't be verified</p>
          <p className="mt-2">The website is offline or sent an unexpected response. This app won't display estimated matchups.</p>
          <button type="button" onClick={() => setRevision(n => n + 1)} className="a-button mt-4">Retry</button>
        </div>}
        {detail.status === 'ready' && detail.value && tournament && <>
          <div className="a-hero px-5 py-6 sm:px-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0">
                <span className="a-chip" data-tone={tournament.status === 'live' ? 'live' : 'accent'}>
                  <span className="a-status-dot"/>{statusLabel(tournament.status)} · {tournament.game || 'VALORANT'}
                </span>
                <h2 className="mt-4 max-w-[680px] font-display text-[26px] font-semibold leading-tight tracking-[-.04em] text-ink">
                  {tournament.name}
                </h2>
                <p className="mt-2 max-w-[620px] text-[12px] leading-6 text-ink-muted">
                  {tournament.summary || 'Official matches, pairings and scores from Aventas.'}
                </p>
              </div>
              <button type="button" onClick={() => void openEvent(tournament.slug)}
                className="a-button a-button-primary shrink-0">Open event website <span aria-hidden="true">↗</span></button>
            </div>
            {openError && <p role="alert" className="mt-3 break-all text-[11px] text-amber-300">{openError}</p>}
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-4 text-[12px]">
              <span><strong className="a-number mr-2 text-[18px] text-ink">{detail.value.teams.length}</strong><span className="text-ink-muted">approved teams</span></span>
              <span><strong className="a-number mr-2 text-[18px] text-ink">{detail.value.matches.length}</strong><span className="text-ink-muted">matches</span></span>
              <span><strong className="a-number mr-2 text-[18px] text-ink">{tournament.maxTeams || '—'}</strong><span className="text-ink-muted">team capacity</span></span>
              {tournament.champion && <span><strong className="text-ink">Champion: </strong><span className="text-emerald-400">{tournament.champion}</span></span>}
            </div>
          </div>
          <BracketBoard bracket={detail.value}/>
        </>}
      </div>
    </div>
    <p className="flex items-center gap-2 text-[11px] leading-5 text-ink-muted">
      <MatchesIcon width={15} height={15} aria-hidden="true"/>
      Website results refresh every 60 seconds. Only the organizer can approve final scores or change official brackets.
    </p>
  </section>;
}
