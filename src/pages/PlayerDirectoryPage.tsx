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
const TIERS=['iron','bronze','silver','gold','platinum','diamond','ascendant','immortal','radiant'];
const TIER_COLOR=['#7d8288','#b4805a','#c6ccd2','#e6ae48','#4fb3c4','#b48cf0','#43c27f','#e0566a','#f4e3a1'];
function tierIndex(r?:Rank){return r?TIERS.indexOf(r.tier.toLowerCase()):-1;}
/** Comparable rank score: tier, then division, then RR. */
function rankScore(r?:Rank){return r?tierIndex(r)*1000+r.division*100+r.rr:-1;}
type SortKey='rank'|'name'|'level';
// Leaderboard layout adapted from the 21st.dev "Leaderboard Table" component:
// medal badges for the top three, sortable headers, avatar + handle cell.
const MEDAL=['', 'medal-gold', 'medal-silver', 'medal-bronze'];
function RankCell({value}:{value?:Rank}){
  if(!value)return <span className="text-ink-muted">Unranked</span>;
  const c=TIER_COLOR[Math.max(tierIndex(value),0)];
  return <span className="flex items-center gap-2.5">
    <svg width="20" height="22" viewBox="0 0 22 24" aria-hidden="true"><path d="M11 1 21 7v10l-10 6L1 17V7z" fill={c} fillOpacity=".16" stroke={c} strokeWidth="1.5"/><path d="M11 7 16 10v4l-5 3-5-3v-4z" fill={c}/></svg>
    <span className="leading-tight"><span className="block text-[12px] text-ink">{value.tier} {value.division}</span>
    <span className="block font-display text-[13px] font-semibold text-ink">{value.rr} <span className="text-[10px] font-normal text-ink-muted">RR</span></span></span>
  </span>;
}
function rank(value?:Rank){return value?value.tier+' '+value.division+' · '+value.rr+' RR':'Not available';}

export function PlayerDirectoryPage(){
  const [query,setQuery]=useState(''),[status,setStatus]=useState<Status>('idle');
  const [players,setPlayers]=useState<PublicPlayer[]>([]);
  const [active,setActive]=useState<PublicPlayer|null>(null);
  const [profileStatus,setProfileStatus]=useState<Status>('idle');
  const [sort,setSort]=useState<{key:SortKey;dir:1|-1}>({key:'rank',dir:-1});
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

  const placed=[...players].sort((x,y)=>rankScore(y.currentRank)-rankScore(x.currentRank))
    .map((p,i)=>({p,place:p.currentRank?i+1:0}));
  const sorted=[...placed].sort((x,y)=>{
    const v=sort.key==='name'?x.p.riotId.localeCompare(y.p.riotId):
      sort.key==='level'?(x.p.accountLevel||0)-(y.p.accountLevel||0):
      rankScore(x.p.currentRank)-rankScore(y.p.currentRank);
    return v*sort.dir;
  });
  const header=(key:SortKey,label:string,num=false)=><th scope="col" className={num?'num':''}
    aria-sort={sort.key===key?(sort.dir===1?'ascending':'descending'):'none'}>
    <button type="button" className="sort-head" onClick={()=>setSort(s=>({key,dir:s.key===key?(s.dir===1?-1:1):(key==='name'?1:-1)}))}>
      {label}{sort.key===key&&<span aria-hidden="true">{sort.dir===1?'▲':'▼'}</span>}
    </button>
  </th>;

  return <div className="page-stage space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <PageHeader eyebrow="Community" title="Players"
        description="Search public profiles. Only players who turned on visibility on the Aventas website appear here."/>
      <form onSubmit={event=>void submit(event)} className="flex w-full max-w-[460px] gap-2">
        <label className="sr-only" htmlFor="directory-search">Search by Riot name</label>
        <input id="directory-search" className="a-input min-w-[160px] flex-1"
          type="search" placeholder="Riot name, e.g. PlayerName"
          autoComplete="off" minLength={2} maxLength={32}
          value={query} onChange={event=>setQuery(event.target.value)}/>
        <button type="submit" disabled={status==='loading'} className="a-button a-button-primary !px-5">
          {status==='loading'?'Searching…':'Search'}
        </button>
      </form>
    </div>
    <div className={'grid gap-5 '+(profileStatus!=='idle'?'xl:grid-cols-[minmax(0,1fr)_440px]':'')}>
      <section className="a-panel self-start overflow-hidden" aria-label="Search results">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="section-title">Results</h2>
          {status==='ready'&&<span className="text-[12px] text-ink-muted">{players.length} {players.length===1?'player':'players'}</span>}
        </div>
        {status==='idle'&&<p className="px-4 py-10 text-center text-[12px] text-ink-muted">Type at least two letters of a Riot name to search.</p>}
        {status==='loading'&&<div className="p-4"><LoadingWorkspace label="Searching public profiles…"/></div>}
        {status==='error'&&<div className="p-4"><ErrorWorkspace detail="Search didn’t complete. Check your connection, or try a name between 2 and 32 characters."/></div>}
        {status==='ready'&&players.length===0&&
          <p className="px-4 py-10 text-center text-[12px] text-ink-muted">No public players match that name. Private accounts never show up in search.</p>}
        {status==='ready'&&players.length>0&&<div className="overflow-x-auto"><table className="roster-table leaderboard">
          <thead><tr>
            <th scope="col" className="w-14 !text-center">#</th>
            {header('name','Player')}{header('rank','Rank')}{header('level','Level',true)}
            <th scope="col"><span className="sr-only">Open</span></th>
          </tr></thead>
          <tbody>{sorted.map(({p,place})=><tr key={p.handle} aria-selected={active?.handle===p.handle}
            className="cursor-pointer" onClick={()=>void select(p)}>
            <td className="!text-center">{place>0&&place<=3?<span className={'medal '+MEDAL[place]}>{place}</span>:
              <span className="tabular-nums text-ink-muted">{place||'—'}</span>}</td>
            <td><span className="flex items-center gap-3">
              <span className="workspace-avatar !size-8 !rounded-full !text-[13px]">{p.riotId.slice(0,1).toUpperCase()}</span>
              <span className="min-w-0"><span className="block truncate font-semibold text-ink">{p.riotId}<span className="font-normal text-ink-muted">#{p.tagline}</span></span>
              <span className="block text-[11px] text-ink-muted">{p.region||'Region unknown'}</span></span>
            </span></td>
            <td><RankCell value={p.currentRank}/></td>
            <td className="num text-ink">{formatMetric(p.accountLevel)}</td>
            <td className="!pr-4 text-right"><button type="button" className="workspace-link" onClick={e=>{e.stopPropagation();void select(p);}}>View profile</button></td>
          </tr>)}</tbody>
        </table></div>}
      </section>
      <section className="player-detail min-w-0 space-y-4">
                {profileStatus==='loading'&&<LoadingWorkspace label="Fetching this player’s opted-in report…"/>}
        {profileStatus==='error'&&<ErrorWorkspace detail="This profile is no longer public or the website could not load it. Public consent may have changed."/>}
        {profileStatus==='ready'&&active&&<>
          <div className="a-panel space-y-5 p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="workspace-avatar !size-14 !text-[24px]">{active.riotId.slice(0,1).toUpperCase()}</span>
                <div>
                                    <h2 className="mt-1 font-display text-[23px] font-semibold tracking-[-.035em] text-ink">{active.riotId}<span className="text-ink-muted">#{active.tagline}</span></h2>
                  <p className="mt-1 text-[11px] text-ink-muted">{active.region||'Region unknown'} · Account level {formatMetric(active.accountLevel)}</p>
                </div>
              </div>
              <Signal tone="live">Visibility enabled</Signal>
            </div>
            <div className="grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
              <div><p className="a-eyebrow">Current rank</p><p className="mt-2 font-display text-[18px] font-semibold text-ink">{rank(active.currentRank)}</p></div>
              <div><p className="a-eyebrow">Peak rank</p><p className="mt-2 font-display text-[18px] font-semibold text-ink">{rank(active.peakRank)}</p></div>
            </div>
          </div>
          {active.statistics&&active.statistics.games>0?<MetricGrid values={[
            {label:'Matches',value:formatMetric(active.statistics.games),hint:'Public aggregate'},
            {label:'Win rate',value:formatMetric(active.statistics.winRate,1,'%'),hint:'Competitive',tone:'positive'},
            {label:'K/D',value:formatMetric(active.statistics.kd,2),hint:'Competitive'},
            {label:'Average combat score',value:formatMetric(active.statistics.acs),hint:'Recorded data'},
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
