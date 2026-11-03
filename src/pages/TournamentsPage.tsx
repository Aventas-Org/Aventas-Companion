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
const websiteLink=(slug:string)=>'https://aventasgaming.com/tournaments/'+encodeURIComponent(slug);
const timeline=(start?:number)=>start ? formatStamp(start) : 'Date to be announced';
const teamCount=(t:Tournament)=>t.registeredTeams ?? t.teamCount;

function MatchCard({ match, round }: {match:Match;round:number}) {
  const finished=match.status==='completed';
  const winner=finished&&match.scoreA!==match.scoreB?(match.scoreA>match.scoreB?0:1):null;
  const sides:[string,number][]=[[match.teamA,match.scoreA],[match.teamB,match.scoreB]];
  return <article className="workspace-match" data-state={match.status}
    aria-label={'Round '+round+' match '+(match.slot+1)+': '+(match.teamA||'TBD')+' versus '+(match.teamB||'TBD')}>
    <div className="flex items-center justify-between border-b border-line/55 px-3 py-2">
      <span className="font-mono text-[10px] text-ink-muted">R{round} · M{match.slot+1}</span>
      <span className={'flex items-center gap-1.5 text-[10px] font-semibold uppercase '+
        (match.status==='live'?'text-emerald-400':'text-ink-muted')}>
        {match.status==='live'&&<span className="a-status-dot animate-pulse" aria-hidden="true"/>}
        {match.status==='live'?'Live':finished?'Final':'Scheduled'}
      </span>
    </div>
    {sides.map(([name,score],index)=><div key={index} className={'workspace-team '+
      (winner===index?'bg-emerald-400/[.05]':'')}>
      <div className="flex min-w-0 items-center gap-2">
        <span className={'size-1.5 shrink-0 rounded-full '+(winner===index?'bg-emerald-400':'bg-line')}/>
        <span className={'truncate '+(winner===index?'font-semibold text-ink':'text-ink-muted')}>
          {name||'To be decided'}
        </span>
      </div>
      <span className={'a-number text-[14px] '+(winner===index?'text-emerald-400':'text-ink')}>
        {finished?score:'—'}
      </span>
    </div>)}
  </article>;
}

function OfficialBracket({ event }: {event:Bracket}) {
  if(!event.matches.length) return <EmptyWorkspace kicker="Official bracket" title="Pairings have not been released."
    detail="The event organizer has not built an official bracket yet. As soon as the website publishes its matchups, the next sync will display them here."/>;
  const rounds=[...new Set(event.matches.map(m=>m.round))].sort((a,b)=>a-b);
  const final=rounds[rounds.length-1];
  const title=(round:number)=>round===final?'Grand final':
    round===final-1?'Semifinals':round===final-2?'Quarterfinals':'Round '+round;

  return <div className="workspace-panel">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <p className="font-display text-[16px] font-semibold text-ink">Official single-elimination bracket</p>
        <p className="mt-1 text-[11px] text-ink-muted">All teams advance according to the website’s approved results. Horizontal scroll for full bracket.</p>
      </div>
      <Signal tone="live">Source: Aventas website</Signal>
    </div>
    <div className="overflow-x-auto px-6 py-8" role="region" aria-label="Tournament bracket; scroll horizontally to view rounds" tabIndex={0}>
      <div className="workspace-bracket-lines">
        {rounds.map(round=>{
          const matches=event.matches.filter(m=>m.round===round).sort((a,b)=>a.slot-b.slot);
          return <section className="workspace-round" key={round} aria-label={title(round)}>
            <div className="mb-7 border-b border-line pb-3">
              <p className="page-kicker uppercase">Stage {String(round).padStart(2,'0')}</p>
              <h3 className="mt-1 font-display text-[16px] font-semibold text-ink">{title(round)}</h3>
              <p className="mt-1 text-[10px] text-ink-muted">{matches.length} matchup{matches.length===1?'':'s'}</p>
            </div>
            <div className="flex flex-1 flex-col justify-around gap-5">
              {matches.map(m=><div className="workspace-branch" key={m.id}>
                <MatchCard match={m} round={round}/>
              </div>)}
            </div>
          </section>;
        })}
      </div>
    </div>
    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 text-[11px] text-ink-muted">
      <span>Results are read-only here. Organizers update the website.</span>
      <span className="font-mono">SINGLE ELIMINATION</span>
    </div>
  </div>;
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
            <a className="a-button a-button-primary w-fit" href={websiteLink(selected)}
              target="_blank" rel="noopener noreferrer">Registration & event details ↗</a>
          </div>}
      </div>
    </div>}
    {selected&&detail.phase==='ready'&&detail.data&&
      <div className="space-y-3">
        <SectionHeading title="Match progression" detail="Brackets and results update from the website, never generated by the desktop app."
          trailing={<span className="text-[11px] text-ink-muted">60 second auto-refresh</span>}/>
        <OfficialBracket event={detail.data}/>
      </div>}
    <p className="text-[11px] leading-6 text-ink-muted">
      Tournament registration and staff announcements are managed on the Aventas website.
      The Discord bot publishes the official bracket only when an organizer chooses “Announce bracket”.
    </p>
  </div>;
}
