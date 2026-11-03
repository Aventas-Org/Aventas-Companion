import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { validTournament, validBracket } from '../services/tournamentContract.mjs';
import type { Tournament, Match, Bracket } from '../services/tournamentContract.mjs';
import {
  PageHeader, SectionHeading, Signal, EmptyWorkspace, LoadingWorkspace,
  ErrorWorkspace, WorkspaceTabs, formatStamp,
} from '../components/WorkspaceUI';

type Filter = 'all'|'live'|'upcoming'|'completed';
type ListState = { phase:'loading'|'ready'|'error'; rows:Tournament[] };
type DetailState = { phase:'loading'|'ready'|'error'; data:Bracket|null };
const FILTERS: {id:Filter;name:string}[] = [
  {id:'all',name:'All events'},{id:'live',name:'Live'},
  {id:'upcoming',name:'Upcoming'},{id:'completed',name:'Completed'},
];
const timeline=(start?:number)=>start ? formatStamp(start) : 'Date to be announced';
const teamCount=(t:Tournament)=>t.registeredTeams ?? t.teamCount;

const humanDate=(date?:number)=>typeof date==='number'&&date>0&&Number.isFinite(date)
  ? new Date(date).toLocaleString(undefined,{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})
  : 'Schedule to be announced';
const stage=(round:number,finalRound:number)=>round===finalRound?'Grand final':round===finalRound-1?'Semifinals':round===finalRound-2?'Quarterfinals':'Round '+round;
const statusLabel=(value:string)=>value==='live'?'Live':value==='completed'?'Finished':'Upcoming';

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
function OfficialBracket({ bracket }: { bracket: Bracket }) {
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

function EventRow({ event, selected, onSelect }: { event:Tournament;selected:boolean;onSelect:()=>void }) {
  const count=teamCount(event);
  return <button type="button" onClick={onSelect} aria-pressed={selected}
    className={'a-pressable group flex w-full items-center gap-4 border-b border-line/60 px-4 py-4 text-left last:border-0 '+
      (selected?'bg-accent/[.075]':'')}>
    <span className={'workspace-avatar !size-[45px] '+(selected?'!border-accent/40':'')}>A</span>
    <span className="min-w-0 flex-1">
      <span className="block truncate font-display text-[15px] font-semibold text-ink">{event.name}</span>
      <span className="mt-1 block truncate text-[11px] text-ink-muted">
        {event.game||'VALORANT'} · {event.region||'Region not specified'} · {timeline(event.startsAt)}
      </span>
    </span>
    <span className="hidden min-w-[62px] text-right sm:block">
      <span className="block font-mono text-[12px] font-semibold text-ink">{typeof count==='number'?count:'—'}</span>
      <span className="text-[10px] text-ink-muted">Teams</span>
    </span>
    <span className={'rounded-[5px] border px-2 py-1 text-[10px] font-semibold uppercase tracking-[.03em] '+
      (event.status==='live'?'border-emerald-400/30 bg-emerald-400/5 text-emerald-400':
        event.status==='completed'?'border-line text-ink-muted':'border-accent/25 bg-accent/5 text-accent')}>
      {event.status}
    </span>
    <span className="text-[18px] text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true">›</span>
  </button>;
}

export function TournamentsPage() {
  const [listing,setListing]=useState<ListState>({phase:'loading',rows:[]});
  const [filter,setFilter]=useState<Filter>('all');
  const [selected,setSelected]=useState<string|null>(null);
  const [detail,setDetail]=useState<DetailState>({phase:'loading',data:null});
  const [lastSync,setLastSync]=useState<number|null>(null);
  const [revision,setRevision]=useState(0);
  const listRequest=useRef(0);
  const filtered=listing.rows.filter(e=>filter==='all'||e.status===filter);
  const current=detail.data?.tournament;
  const [openError,setOpenError]=useState(false);
  async function openOfficial(slug:string){
    setOpenError(false);
    try { await invoke('open_official_tournament',{slug}); }
    catch { setOpenError(true); }
  }

  const refreshList=useCallback(async()=>{
    const id=++listRequest.current;
    try{
      const data=await invoke<{tournaments:unknown[]}>('fetch_public_tournaments');
      if(!Array.isArray(data?.tournaments))throw Error('Unexpected website response');
      if(listRequest.current!==id)return;
      const rows=data.tournaments.filter(validTournament).sort((a,b)=>(b.startsAt||0)-(a.startsAt||0));
      setListing({phase:'ready',rows});
      setLastSync(Date.now());
      setSelected(old=>old&&!rows.some(e=>e.slug===old)?null:old);
    }catch{
      if(listRequest.current===id)setListing(previous=>({phase:'error',rows:previous.rows}));
    }
  },[]);

  useEffect(()=>{
    void refreshList();
    const timer=window.setInterval(()=>void refreshList(),60000);
    return ()=>{++listRequest.current;window.clearInterval(timer);};
  },[refreshList,revision]);

  useEffect(()=>{
    if(!selected){setDetail({phase:'loading',data:null});return;}
    const slug=selected;let cancelled=false;let epoch=0;
    setDetail({phase:'loading',data:null});
    async function load(){
      const id=++epoch;
      try{
        const response=await invoke<unknown>('fetch_public_tournament_detail',{slug});
        if(!validBracket(response,slug))throw Error('Invalid official bracket');
        if(!cancelled&&epoch===id)setDetail({phase:'ready',data:response});
      }catch{
        if(!cancelled&&epoch===id)setDetail({phase:'error',data:null});
      }
    }
    void load();
    const timer=window.setInterval(()=>void load(),60000);
    return()=>{cancelled=true;window.clearInterval(timer);};
  },[selected,revision]);

  return <div className="page-stage space-y-7">
    <PageHeader eyebrow="Aventas / Competition" title="Tournament control."
      description="Explore the official event calendar, inspect full brackets, and follow results published by Aventas."
      action={<button type="button" onClick={()=>setRevision(v=>v+1)} className="a-button">↻ Refresh events</button>}/>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <WorkspaceTabs items={FILTERS} value={filter} onChange={setFilter} label="Tournament event status"/>
      <span className="text-[11px] text-ink-muted">
        {lastSync?'Last website check · '+new Date(lastSync).toLocaleTimeString():'Connecting to Aventas website'}
      </span>
    </div>
    {listing.phase==='loading'&&<LoadingWorkspace label="Loading official Aventas tournaments…"/>}
    {listing.phase==='error'&&<ErrorWorkspace detail="The website did not respond. Previously loaded events may be out of date."
      onRetry={()=>setRevision(v=>v+1)}/>}
    {listing.phase==='ready'&&!listing.rows.length&&
      <EmptyWorkspace kicker="Event calendar" title="No published tournaments yet."
        detail="When organizers publish an event on the Aventas website it will appear here automatically. All brackets and results remain website-owned."/>}
    {listing.rows.length>0&&<div className="grid gap-5 xl:grid-cols-[minmax(315px,.9fr)_minmax(0,1.1fr)]">
      <section className="workspace-panel self-start">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <p className="font-display text-[16px] font-semibold text-ink">Event index</p>
          <span className="a-chip">{filtered.length} events</span>
        </div>
        {filtered.length?filtered.map(event=><EventRow key={event.slug} event={event}
          selected={selected===event.slug} onSelect={()=>setSelected(event.slug)}/>):
          <p className="px-5 py-9 text-center text-[12px] leading-6 text-ink-muted">No events in this category.</p>}
      </section>
      <div className="a-panel-soft flex min-h-[220px] flex-col justify-center p-6">
        {!selected?<div>
          <p className="page-kicker uppercase">Event details</p>
          <h2 className="mt-4 font-display text-[24px] font-semibold text-ink">Select a tournament.</h2>
          <p className="mt-3 max-w-[380px] text-[12px] leading-6 text-ink-muted">
            View the official match tree and any approved scores. Registration stays on the website.
          </p>
        </div>:detail.phase==='loading'?<LoadingWorkspace label="Fetching the official bracket…"/>:
          detail.phase==='error'?<ErrorWorkspace detail="Unable to verify this tournament snapshot. Try refreshing to fetch the newest version."
          onRetry={()=>setRevision(v=>v+1)}/>:
          <div className="space-y-4">
            <Signal tone={current?.status==='live'?'live':'neutral'}>{current?.status==='live'?'Tournament live':'Official tournament'}</Signal>
            <h2 className="font-display text-[27px] font-semibold leading-[1.12] tracking-[-.035em] text-ink">{current?.name}</h2>
            <p className="text-[12px] text-ink-muted">{current?.region||'Region pending'} · {timeline(current?.startsAt)}</p>
            <div className="grid grid-cols-2 gap-3 border-y border-line py-4 text-[12px]">
              <div><p className="text-ink-muted">Approved teams</p>
                <p className="a-number mt-2 text-[24px] text-ink">{detail.data?.teams.length??0}</p></div>
              <div><p className="text-ink-muted">Matchups</p>
                <p className="a-number mt-2 text-[24px] text-ink">{detail.data?.matches.length??0}</p></div>
            </div>
            {current?.champion&&<p className="text-[12px] font-semibold text-emerald-400">Champion · {current.champion}</p>}
            <button type="button" className="a-button a-button-primary w-fit"
              onClick={()=>void openOfficial(selected)}>Registration & event details ↗</button>
            {openError&&<p role="alert" className="text-[11px] text-amber-300">
              The system browser could not be opened. Visit aventasgaming.com to register.
            </p>}
          </div>}
      </div>
    </div>}
    {selected&&detail.phase==='ready'&&detail.data&&
      <div className="space-y-3">
        <SectionHeading title="Match progression" detail="Brackets and results update from the website, never generated by the desktop app."
          trailing={<span className="text-[11px] text-ink-muted">60 second auto-refresh</span>}/>
        <OfficialBracket bracket={detail.data}/>
      </div>}
    <p className="text-[11px] leading-6 text-ink-muted">
      Tournament registration and staff announcements are managed on the Aventas website.
      The Discord bot publishes the official bracket only when an organizer chooses “Announce bracket”.
    </p>
  </div>;
}
