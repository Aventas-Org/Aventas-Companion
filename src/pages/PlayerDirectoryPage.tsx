import { useEffect, useRef, useState, type FormEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  PageHeader, SectionHeading, Signal, MetricGrid, EmptyWorkspace,
  ErrorWorkspace, LoadingWorkspace, formatMetric, formatStamp,
} from '../components/WorkspaceUI';

interface Rank { tier:string;division:number;rr:number }
interface PublicPlayer {
  handle:string;riotId:string;tagline:string;region:string;accountLevel:number;
  currentRank?:Rank;peakRank?:Rank;lastUpdated?:number;
  statistics?:{games:number;wins:number;losses:number;winRate:number;kd:number;acs:number;adr:number;headshotPercent:number}|null;
  topAgents?:Array<{agent:string;games:number;winRate:number}>;
  topMaps?:Array<{map:string;games:number;winRate:number}>;
}
type Status='idle'|'loading'|'ready'|'error';
function isPlayer(value:unknown):value is PublicPlayer{
  if(!value||typeof value!=='object')return false;
  const p=value as Record<string,unknown>;
  return typeof p.handle==='string'&&/^[0-9a-f]{18}$/.test(p.handle) &&
    typeof p.riotId==='string'&&typeof p.tagline==='string';
}
function rank(value?:Rank){return value?value.tier+' '+value.division+' · '+value.rr+' RR':'Not available';}

export function PlayerDirectoryPage(){
  const [query,setQuery]=useState(''),[status,setStatus]=useState<Status>('idle');
  const [players,setPlayers]=useState<PublicPlayer[]>([]);
  const [active,setActive]=useState<PublicPlayer|null>(null);
  const [profileStatus,setProfileStatus]=useState<Status>('idle');
  const searchEpoch=useRef(0),profileEpoch=useRef(0);
  useEffect(()=>()=>{++searchEpoch.current;++profileEpoch.current;},[]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const term=query.trim();
    if(term.length<2||term.length>32){setStatus('error');return;}
    const epoch=++searchEpoch.current;
    ++profileEpoch.current;setActive(null);setProfileStatus('idle');setStatus('loading');
    try{
      const response=await invoke<{players:unknown[]}>('search_public_players',{query:term});
      if(!Array.isArray(response.players))throw Error('Invalid public directory');
      if(epoch!==searchEpoch.current)return;
      setPlayers(response.players.filter(isPlayer));setStatus('ready');
    }catch{
      if(epoch===searchEpoch.current){setPlayers([]);setStatus('error');}
    }
  }
  async function select(player:PublicPlayer){
    const epoch=++profileEpoch.current;setProfileStatus('loading');setActive(null);
    try{
      const response=await invoke<{player:unknown}>('fetch_public_player',{handle:player.handle});
      if(!isPlayer(response.player))throw Error('Unverified public profile');
      if(epoch!==profileEpoch.current)return;
      setActive(response.player);setProfileStatus('ready');
    }catch{if(epoch===profileEpoch.current)setProfileStatus('error');}
  }

  return <div className="page-stage space-y-7">
    <PageHeader eyebrow="Aventas / Community" title="Player directory."
      description="Find public competitive profiles from the Aventas network. Only players who opted in on the website appear here."/>
    <section className="a-hero flex flex-col gap-6 p-7 lg:flex-row lg:items-end lg:justify-between lg:p-9">
      <div className="max-w-[480px]">
        <Signal tone="accent">Privacy by default</Signal>
        <h2 className="mt-5 font-display text-[26px] font-semibold leading-[1.15] tracking-[-.035em] text-ink">
          Discover the competition.<br/>Respect the player.
        </h2>
        <p className="mt-3 text-[12px] leading-6 text-ink-muted">
          Search by a Riot name. The public directory excludes email, account identifiers,
          private match lists and anyone who has not enabled visibility.
        </p>
      </div>
      <form onSubmit={event=>void submit(event)} className="flex w-full max-w-[510px] flex-wrap gap-2">
        <label className="sr-only" htmlFor="directory-search">Search public Riot name</label>
        <input id="directory-search" className="a-input min-w-[180px] flex-1"
          type="search" placeholder="Search Riot ID, e.g. PlayerName"
          autoComplete="off" minLength={2} maxLength={32}
          value={query} onChange={event=>setQuery(event.target.value)}/>
        <button type="submit" disabled={status==='loading'} className="a-button a-button-primary !px-6">
          {status==='loading'?'Searching…':'Find players'}
        </button>
      </form>
    </section>
    <div className="grid gap-6 xl:grid-cols-[minmax(300px,.82fr)_minmax(0,1.18fr)]">
      <section className="workspace-panel self-start">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-[17px] font-semibold text-ink">Public profiles</h2>
            <p className="mt-1 text-[11px] text-ink-muted">Opted-in results only</p>
          </div>
          {status==='ready'&&<span className="a-chip">{players.length} found</span>}
        </div>
        {status==='idle'&&<div className="p-6"><EmptyWorkspace title="Ready when you are."
          detail="Enter at least two characters of a player’s Riot name to search the opted-in directory."/></div>}
        {status==='loading'&&<div className="p-4"><LoadingWorkspace label="Searching the website directory…"/></div>}
        {status==='error'&&<div className="p-4"><ErrorWorkspace detail="This search could not be completed. Try a shorter Riot name or check your connection."/></div>}
        {status==='ready'&&players.length===0&&
          <p className="px-6 py-9 text-[12px] leading-6 text-ink-muted">No opted-in players matched. Hidden accounts will never appear in public search.</p>}
        {status==='ready'&&players.map(p=><button key={p.handle} type="button"
          onClick={()=>void select(p)} aria-pressed={active?.handle===p.handle}
          className={'workspace-row group w-full text-left '+(active?.handle===p.handle?'bg-accent/[.07]':'')}>
          <span className="workspace-avatar">{p.riotId.slice(0,1).toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-[14px] font-semibold text-ink">{p.riotId}<span className="text-ink-muted">#{p.tagline}</span></span>
            <span className="mt-1 block text-[11px] text-ink-muted">{p.region||'Region unavailable'} · {rank(p.currentRank)}</span>
          </span>
          <span className="text-[17px] text-ink-muted group-hover:text-accent" aria-hidden="true">›</span>
        </button>)}
      </section>
      <section className="min-w-0 space-y-4">
        {profileStatus==='idle'&&<EmptyWorkspace kicker="Player report" title="Select a public profile."
          detail="A player’s full opted-in aggregate report appears here. We never reveal private match data, account IDs or personal contact details."/>}
        {profileStatus==='loading'&&<LoadingWorkspace label="Fetching this player’s opted-in report…"/>}
        {profileStatus==='error'&&<ErrorWorkspace detail="This profile is no longer public or the website could not load it. Public consent may have changed."/>}
        {profileStatus==='ready'&&active&&<>
          <div className="a-panel space-y-5 p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="workspace-avatar !size-14 !text-[24px]">{active.riotId.slice(0,1).toUpperCase()}</span>
                <div>
                  <p className="page-kicker uppercase">Verified public listing</p>
                  <h2 className="mt-1 font-display text-[23px] font-semibold tracking-[-.035em] text-ink">{active.riotId}<span className="text-ink-muted">#{active.tagline}</span></h2>
                  <p className="mt-1 text-[11px] text-ink-muted">{active.region||'Region unknown'} · Account level {formatMetric(active.accountLevel)}</p>
                </div>
              </div>
              <Signal tone="live">Visibility enabled</Signal>
            </div>
            <div className="grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
              <div><p className="a-eyebrow">CURRENT RANK</p><p className="mt-2 font-display text-[18px] font-semibold text-ink">{rank(active.currentRank)}</p></div>
              <div><p className="a-eyebrow">PEAK RANK</p><p className="mt-2 font-display text-[18px] font-semibold text-ink">{rank(active.peakRank)}</p></div>
            </div>
          </div>
          {active.statistics&&active.statistics.games>0?<MetricGrid values={[
            {label:'MATCHES',value:formatMetric(active.statistics.games),hint:'Public aggregate'},
            {label:'WIN RATE',value:formatMetric(active.statistics.winRate,1,'%'),hint:'Competitive',tone:'positive'},
            {label:'K/D RATIO',value:formatMetric(active.statistics.kd,2),hint:'Competitive'},
            {label:'AVERAGE ACS',value:formatMetric(active.statistics.acs),hint:'Recorded data'},
          ]}/>:<EmptyWorkspace kicker="Player performance" title="No public match aggregates yet."
            detail="This player chose to be listed, but no public competitive history has been synchronized. We do not display placeholder wins or ranks."/>}
          {!!active.topAgents?.length&&<div className="workspace-panel">
            <div className="border-b border-line px-5 py-4"><SectionHeading title="Most-played agents" detail="Consented competitive aggregate."/></div>
            {active.topAgents.map((agent,i)=><div key={agent.agent||i} className="workspace-row">
              <span className="a-number w-7 text-[13px] text-ink-muted">{String(i+1).padStart(2,'0')}</span>
              <span className="flex-1 text-[12px] font-semibold text-ink">{agent.agent}</span>
              <span className="text-[11px] text-ink-muted">{formatMetric(agent.games)} games</span>
              <span className="a-number min-w-14 text-right text-[13px]">{formatMetric(agent.winRate,1,'%')}</span>
            </div>)}
          </div>}
          <p className="text-[11px] leading-5 text-ink-muted">Website aggregate last updated {formatStamp(active.lastUpdated)}. Visibility and consent are controlled by the account owner on the website.</p>
        </>}
      </section>
    </div>
  </div>;
}
