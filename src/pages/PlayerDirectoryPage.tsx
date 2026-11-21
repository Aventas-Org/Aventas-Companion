import { useEffect, useRef, useState, type FormEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ErrorWorkspace, LoadingWorkspace, formatMetric, formatStamp } from '../components/WorkspaceUI';
import { RankEmblem } from '../components/RankEmblem';
import { tierColor } from '../services/rankIcons';

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

  const tierOf=(r?:Rank)=>r?(r.tier==='Radiant'?r.tier:`${r.tier} ${r.division}`):'';
  return <div className="page-stage space-y-8">
    <form onSubmit={event=>void submit(event)} className="space-y-3">
      <label htmlFor="directory-search" className="page-heading block">Find a player</label>
      <div className="flex max-w-[760px] gap-2">
        <input id="directory-search" className="a-input directory-search min-w-0 flex-1"
          type="search" placeholder="Riot ID, like Nova#AVNT"
          autoComplete="off" spellCheck={false} minLength={2} maxLength={32}
          value={query} onChange={event=>setQuery(event.target.value)}/>
        <button type="submit" disabled={status==='loading'} className="a-button a-button-primary !px-7">
          {status==='loading'?'Searching…':'Search'}
        </button>
      </div>
      <p className="max-w-[640px] text-[13px] leading-6 text-ink-muted">
        Only players who turned on a public profile on the Aventas website show up. Email, account IDs and match lists are never shown.
      </p>
    </form>

    <div className="grid gap-8 xl:grid-cols-[minmax(280px,.75fr)_minmax(0,1.25fr)]">
      <section className="self-start" aria-label="Search results">
        {status==='idle'&&<p className="text-[14px] text-ink-muted">Results appear here.</p>}
        {status==='loading'&&<LoadingWorkspace label="Searching the directory…"/>}
        {status==='error'&&<ErrorWorkspace detail="Search needs 2 to 32 characters. If that's fine, check your connection and try again."/>}
        {status==='ready'&&players.length===0&&
          <p className="text-[14px] leading-6 text-ink-muted">No public profile matches “{query.trim()}”. Players with a hidden profile never appear.</p>}
        {status==='ready'&&players.length>0&&<>
          <p className="mb-2 text-[13px] text-ink-muted">{players.length} {players.length===1?'player':'players'}</p>
          <div className="space-y-1">
            {players.map(p=><button key={p.handle} type="button"
              onClick={()=>void select(p)} aria-pressed={active?.handle===p.handle}
              className={'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors '+(active?.handle===p.handle?'bg-line/60':'hover:bg-line/30')}>
              {p.currentRank?<RankEmblem label={tierOf(p.currentRank)} size={36}/>:<span className="size-9 shrink-0 rounded-full bg-line"/>}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-ink">{p.riotId}<span className="font-normal text-ink-muted">#{p.tagline}</span></span>
                <span className="block text-[13px] text-ink-muted">{[p.region, p.currentRank?tierOf(p.currentRank):null].filter(Boolean).join(', ')}</span>
              </span>
            </button>)}
          </div>
        </>}
      </section>

      <section className="min-w-0" aria-label="Player profile">
        {profileStatus==='idle'&&status==='ready'&&players.length>0&&<p className="text-[14px] text-ink-muted">Pick a player to open their profile.</p>}
        {profileStatus==='loading'&&<LoadingWorkspace label="Loading profile…"/>}
        {profileStatus==='error'&&<ErrorWorkspace detail="This profile is no longer public, or the website could not load it."/>}
        {profileStatus==='ready'&&active&&<article className="space-y-6">
          <header className="directory-card" style={{['--rank-color' as string]:active.currentRank?tierColor(active.currentRank.tier):'#8A8A86'}}>
            <div className="flex flex-wrap items-center gap-5">
              {active.currentRank&&<RankEmblem label={tierOf(active.currentRank)} size={84}/>}
              <div className="min-w-0 flex-1">
                <h2 className="figure truncate text-[40px] font-semibold leading-none text-ink">{active.riotId}<span className="text-ink-muted">#{active.tagline}</span></h2>
                <p className="mt-2 text-[14px] text-ink-muted">{[active.region, `Level ${formatMetric(active.accountLevel)}`].filter(Boolean).join(', ')}</p>
              </div>
              <dl className="flex gap-8">
                <div><dt className="text-[13px] text-ink-muted">Rank</dt>
                  <dd className="figure text-[26px] font-semibold" style={{color:'var(--rank-color)'}}>{active.currentRank?tierOf(active.currentRank):'Unranked'}</dd>
                  {active.currentRank&&<dd className="figure text-[14px] text-ink-muted">{active.currentRank.rr} RR</dd>}</div>
                {active.peakRank&&<div><dt className="text-[13px] text-ink-muted">Peak</dt>
                  <dd className="figure text-[26px] font-semibold text-ink">{tierOf(active.peakRank)}</dd></div>}
              </dl>
            </div>
            {active.statistics&&active.statistics.games>0?<dl className="directory-stats">
              {[['Matches',formatMetric(active.statistics.games)],['Win rate',formatMetric(active.statistics.winRate,1,'%')],
                ['K/D',formatMetric(active.statistics.kd,2)],['ACS',formatMetric(active.statistics.acs)],
                ['ADR',formatMetric(active.statistics.adr)],['Headshot',formatMetric(active.statistics.headshotPercent,1,'%')]]
                .map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>:<p className="mt-6 text-[14px] text-ink-muted">No public match stats yet. We don't show placeholder numbers.</p>}
          </header>
          {!!active.topAgents?.length&&<div>
            <h3 className="mb-2 text-[15px] font-semibold text-ink">Most played agents</h3>
            <table className="w-full text-[14px]">
              <thead className="sr-only"><tr><th>Agent</th><th>Games</th><th>Win rate</th></tr></thead>
              <tbody>{active.topAgents.map((agent,i)=><tr key={agent.agent||i} className="border-t border-line/60">
                <td className="py-2.5 font-medium text-ink">{agent.agent}</td>
                <td className="py-2.5 text-ink-muted">{formatMetric(agent.games)} games</td>
                <td className="figure py-2.5 text-right text-[16px] text-ink">{formatMetric(agent.winRate,1,'%')}</td>
              </tr>)}</tbody>
            </table>
          </div>}
          <p className="text-[12px] text-ink-muted">Updated {formatStamp(active.lastUpdated)}. The player controls whether this profile is public.</p>
        </article>}
      </section>
    </div>
  </div>;
}
