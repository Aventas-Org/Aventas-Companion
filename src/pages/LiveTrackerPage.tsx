import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAventasAccount } from '../platform/AccountContext';
import {
  PageHeader, SectionHeading, Signal, EmptyWorkspace, ErrorWorkspace,
  LoadingWorkspace, MetricGrid, WorkspaceTabs, formatMetric, formatStamp, asRecord, asArray,
} from '../components/WorkspaceUI';

type Tab = 'dashboard' | 'matches' | 'agents' | 'maps' | 'progress' | 'insights';
type Outcome = 'all' | 'win' | 'loss';
const TABS: { id: Tab; name: string }[] = [
  { id:'dashboard',name:'Summary' },{ id:'matches',name:'Match history' },
  { id:'agents',name:'Agents' },{ id:'maps',name:'Maps' },
  { id:'progress',name:'Progress' },{ id:'insights',name:'Insights' },
];
type Data = Record<string,unknown>;
interface Game {
  id: string; map?: string; agent?: string; queue?: string; result?: string;
  playedAt?: number; kills?: number; deaths?: number; assists?: number;
  acs?: number; adr?: number; headshotPercent?: number; score?: string;
}
interface Ranked { agent?: string; map?: string; games?: number; winRate?: number; kd?: number; acs?: number; headshotPercent?: number }
type View = { phase: 'loading'|'ready'|'error'; data: Data|null; message: string };

function AccountLogin() {
  const { login } = useAventasAccount();
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try { await login(email,password); }
    catch { setError('We could not verify those credentials with the Aventas website. Check your email, password and connection.'); }
    finally { setBusy(false); setPassword(''); }
  }
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
    <div className="a-hero flex flex-col justify-between p-8 sm:p-10">
      <div>
        <Signal tone="accent">Website account required</Signal>
        <h2 className="mt-8 max-w-[530px] font-display text-[35px] font-semibold leading-[1.08] tracking-[-.045em] text-ink sm:text-[46px]">
          Your game.<br/><span className="text-accent">Your numbers.</span>
        </h2>
        <p className="mt-5 max-w-[460px] text-[13px] leading-7 text-ink-muted">
          One Aventas identity for your tracker and tournaments. The app only displays official
          account records the website has actually synchronized.
        </p>
      </div>
      <div className="mt-12 grid gap-5 border-t border-line pt-6 sm:grid-cols-3">
        {[['01','Secure sign-in'],['02','Website sync'],['03','Riot approval']].map(([number,label])=>
          <div key={number}>
            <p className="a-number text-[24px] text-accent/75">{number}</p>
            <p className="mt-1 text-[11px] font-semibold text-ink-muted">{label}</p>
          </div>)}
      </div>
    </div>
    <div className="a-panel flex flex-col justify-center p-7 sm:p-9">
      <p className="page-kicker uppercase tracking-[.13em]">Existing members</p>
      <h2 className="mt-3 font-display text-[25px] font-semibold tracking-[-.03em] text-ink">Welcome back.</h2>
      <p className="mt-2 text-[12px] leading-6 text-ink-muted">Use your Aventas website email and password. Discord-only account sign-in requires a later authorization flow.</p>
      <form className="mt-7 space-y-5" onSubmit={event => void submit(event)}>
        <label className="block text-[11px] font-semibold text-ink-muted">EMAIL ADDRESS
          <input className="a-input mt-2" required type="email" autoComplete="email" placeholder="you@example.com"
            value={email} onChange={event=>setEmail(event.target.value)}/>
        </label>
        <label className="block text-[11px] font-semibold text-ink-muted">PASSWORD
          <input className="a-input mt-2" required type="password" autoComplete="current-password" placeholder="Your account password"
            value={password} onChange={event=>setPassword(event.target.value)}/>
        </label>
        {error && <p role="alert" className="rounded-[7px] border border-amber-500/30 bg-amber-500/5 p-3 text-[12px] leading-5 text-amber-300">{error}</p>}
        <button className="a-button a-button-primary w-full !py-3" type="submit" disabled={busy}>
          {busy ? 'Checking account…' : 'Connect Aventas account'}
        </button>
      </form>
      <div className="mt-7 flex gap-3 border-t border-line pt-5">
        <span className="a-status-dot mt-1 text-emerald-400"/>
        <p className="text-[11px] leading-6 text-ink-muted">Session token stays in native app memory and is cleared on sign-out. No game credentials are stored here.</p>
      </div>
    </div>
  </div>;
}

function MatchList({ matches }: { matches: Game[] }) {
  const [search,setSearch] = useState(''), [outcome,setOutcome] = useState<Outcome>('all');
  const filtered = useMemo(() => matches.filter(m=>{
    const term=search.trim().toLowerCase();
    return (outcome==='all'||String(m.result).toLowerCase()===outcome) &&
      (!term||[m.map,m.agent,m.queue].some(text=>String(text||'').toLowerCase().includes(term)));
  }),[matches,search,outcome]);

  if(!matches.length) return <EmptyWorkspace kicker="Match archive" title="Your match record is waiting."
    detail="No verified matches are available on the website yet. Once Riot access and account linking are approved, synced matches will appear here without placeholder results."/>;
  return <section className="workspace-panel">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div><p className="font-display text-[15px] font-semibold text-ink">Match archive</p>
        <p className="mt-1 text-[11px] text-ink-muted">{filtered.length} of {matches.length} recorded matches</p></div>
      <div className="flex flex-wrap gap-2">
        <input className="a-input !min-h-[35px] !w-[190px] !py-1.5" type="search" aria-label="Filter matches by map, agent or queue"
          placeholder="Find map or agent…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className="a-input !min-h-[35px] !w-auto !py-1.5" aria-label="Filter match result"
          value={outcome} onChange={e=>setOutcome(e.target.value as Outcome)}>
          <option value="all">All results</option><option value="win">Wins</option><option value="loss">Losses</option>
        </select>
      </div>
    </div>
    {filtered.length===0 ? <p className="p-7 text-[12px] text-ink-muted">No recorded matches match these filters.</p> :
    <div className="overflow-x-auto">
      <table className="a-table !text-[12px]">
        <thead><tr>{['RESULT','MAP / AGENT','QUEUE','PLAYED','K / D / A','ACS','HS%'].map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map((m,i)=>{
          const result=String(m.result||'').toLowerCase();
          return <tr key={m.id||i}>
            <td><span className={'a-chip '+(result==='win'?'!text-emerald-400':result==='loss'?'!text-accent':'')}>{result==='win'?'VICTORY':result==='loss'?'DEFEAT':'UNRECORDED'}</span></td>
            <td><p className="font-semibold text-ink">{m.map||'Unknown map'}</p><p className="mt-1 text-[11px] text-ink-muted">{m.agent||'Unknown agent'}</p></td>
            <td className="text-ink-muted">{m.queue||'—'}</td>
            <td className="whitespace-nowrap text-ink-muted">{formatStamp(m.playedAt)}</td>
            <td className="whitespace-nowrap a-number text-[14px]">{[m.kills,m.deaths,m.assists].map(v=>formatMetric(v)).join(' / ')}</td>
            <td className="a-number text-[15px]">{formatMetric(m.acs)}</td>
            <td>{formatMetric(m.headshotPercent,1,'%')}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>}
  </section>;
}

function Breakdown({ data, type }: { data: Ranked[]; type:'agent'|'map' }) {
  const sorted=[...data].sort((a,b)=>(b.games||0)-(a.games||0));
  if(!sorted.length)return <EmptyWorkspace kicker="Performance breakdown" title={'No '+type+' records yet.'}
    detail="These performance breakdowns are computed by the Aventas website from verified match history. There is no local substitute for missing data."/>;
  return <div className="workspace-panel">
    <div className="grid grid-cols-[1fr_80px_110px_80px] gap-3 border-b border-line px-5 py-3 text-[10px] font-semibold text-ink-muted sm:grid-cols-[1fr_100px_150px_90px_90px]">
      <span>{type==='agent'?'AGENT':'MAP'}</span><span>GAMES</span><span>WIN RATE</span><span>ACS</span><span className="hidden sm:inline">K/D</span>
    </div>
    {sorted.map((entry,i)=> <div className="grid grid-cols-[1fr_80px_110px_80px] items-center gap-3 border-b border-line/60 px-5 py-4 last:border-0 sm:grid-cols-[1fr_100px_150px_90px_90px]" key={String(entry[type]||i)}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="workspace-avatar !size-9">{String(entry[type]||'?').slice(0,1).toUpperCase()}</span>
        <div className="min-w-0"><p className="truncate text-[12px] font-semibold text-ink">{entry[type]||'Unknown'}</p>
          <p className="text-[10px] text-ink-muted">Recorded history</p></div>
      </div>
      <span className="a-number text-[15px]">{formatMetric(entry.games)}</span>
      <div className="min-w-0"><p className="a-number text-[13px]">{formatMetric(entry.winRate,1,'%')}</p>
        <div className="workspace-progress mt-2"><span style={{width:Math.max(0,Math.min(100,entry.winRate||0))+'%'}}/></div>
      </div>
      <span className="a-number text-[15px]">{formatMetric(entry.acs)}</span>
      <span className="a-number hidden text-[15px] sm:inline">{formatMetric(entry.kd,2)}</span>
    </div>)}
  </div>;
}

function TrackerContent({ tab, data, verified, onTab }: {
  tab:Tab; data:Data; verified:boolean; onTab:(next:Tab)=>void;
}) {
  if(tab==='matches')return <MatchList matches={asArray<Game>(data.matches)}/>;
  if(tab==='agents'||tab==='maps')return <Breakdown data={asArray<Ranked>(data[tab])} type={tab==='agents'?'agent':'map'}/>;
  if(tab==='progress'){
    const compared=asRecord(data.comparison), current=asRecord(compared.current);
    const games=Number(current.games||0);
    return <div className="space-y-5">
      <MetricGrid values={[
        {label:'RECENT GAMES',value:formatMetric(current.games),hint:'Latest comparison window'},
        {label:'WIN RATE',value:games?formatMetric(current.winRate,1,'%'):'—',hint:'Current period'},
        {label:'ACS CHANGE',value:formatMetric(compared.acsDeltaPct,1,'%'),hint:'Versus previous period'},
        {label:'K/D CHANGE',value:formatMetric(compared.kdDelta,2),hint:'Versus previous period'},
      ]}/>
      <EmptyWorkspace kicker="Progress" title="Your improvement, not a guess."
        detail="The website computes comparisons from your own finished matches. Until there are enough samples, comparisons may be unavailable; no synthetic trend line will be shown."/>
    </div>;
  }
  if(tab==='insights') {
    const insights=asArray<Data>(data.insights);
    if(!insights.length)return <EmptyWorkspace kicker="Coaching notes" title="Not enough match evidence."
      detail="Evidence-backed insights will appear after your website has sufficient authorized match and round history. This is not an AI-generated prediction of your performance."/>;
    return <div className="grid gap-4 lg:grid-cols-2">{insights.map((item,i)=><article className="workspace-panel p-6" key={String(item.id||i)}>
      <p className="page-kicker uppercase">{String(item.category||'Performance insight')}</p>
      <h3 className="mt-5 font-display text-[19px] font-semibold text-ink">{String(item.title||'Analysis')}</h3>
      <p className="mt-3 text-[12px] leading-6 text-ink-muted">{String(item.body||'')}</p>
      {item.stat!=null&&<div className="mt-5 border-t border-line pt-4 font-mono text-[13px] text-accent">{String(item.stat)}</div>}
    </article>)}</div>;
  }
  const stats=asRecord(data.statistics),rank=asRecord(asRecord(data.rank).current);
  const games=Number(stats.games||0);
  return <div className="space-y-6">
    <MetricGrid values={[
      {label:'MATCHES RECORDED',value:formatMetric(stats.games),hint:'Website history'},
      {label:'WIN RATE',value:games?formatMetric(stats.winRate,1,'%'):'—',hint:'Recorded matches only',tone:'positive'},
      {label:'K/D RATIO',value:games?formatMetric(stats.kd,2):'—',hint:'Kills per death'},
      {label:'AVERAGE ACS',value:games?formatMetric(stats.acs):'—',hint:'Combat score'},
      {label:'HEADSHOT RATE',value:games?formatMetric(stats.headshotPercent,1,'%'):'—',hint:'Verified results'},
      {label:'AVERAGE ADR',value:games?formatMetric(stats.adr):'—',hint:'Damage per round'},
      {label:'CURRENT RANK',value:verified&&games?String(rank.tier||'—'):'—',hint:verified?'Website-linked Riot data':'Riot link pending',tone:'accent'},
      {label:'RANK RATING',value:verified&&games?formatMetric(rank.rr,0,' RR'):'—',hint:'Official server record'},
    ]}/>
    <div className="space-y-3">
      <SectionHeading title="Latest performances" detail="Recent match records returned by the authenticated website."
        trailing={<button type="button" onClick={()=>onTab('matches')} className="workspace-link">Open full archive ↗</button>}/>
      <MatchList matches={asArray<Game>(data.recentMatches).slice(0,10)}/>
    </div>
  </div>;
}

export function LiveTrackerPage() {
  const {phase, account, logout, refresh}=useAventasAccount();
  const [tab,setTab]=useState<Tab>('dashboard');
  const [revision,setRevision]=useState(0);
  const [view,setView]=useState<View>({phase:'loading',data:null,message:''});
  const [profile,setProfile]=useState<Data|null>(null);
  const [lastSync,setLastSync]=useState<number|null>(null);

  useEffect(()=>{
    if(phase!=='signed-in')return;
    const timer=window.setInterval(()=>setRevision(n=>n+1),60000);
    return ()=>window.clearInterval(timer);
  },[phase]);

  useEffect(()=>{
    if(phase!=='signed-in'||!account){
      setView({phase:'loading',data:null,message:''});setProfile(null);setLastSync(null);return;
    }
    let cancelled=false;
    setView({phase:'loading',data:null,message:''});
    void Promise.all([
      invoke<Data>('desktop_companion_data',{endpoint:tab}),
      invoke<Data>('desktop_companion_data',{endpoint:'profile'}),
    ]).then(([value,person])=>{
      if(!cancelled){setView({phase:'ready',data:value,message:''});setProfile(person);setLastSync(Date.now());}
    }).catch((cause:unknown)=>{
      if(cancelled)return;
      setProfile(null);
      const message=String(cause);
      if(message.includes('Session expired')||message.includes('Sign in to your Aventas')){
        void refresh();return;
      }
      setView({phase:'error',data:null,message:'We could not retrieve this account view. Your records have not been replaced with sample data.'});
    });
    return ()=>{cancelled=true;};
  },[phase,account?.id,tab,revision,refresh]);

  const meta=asRecord(profile?.meta),player=asRecord(profile?.player);
  const verified=meta.hasRiotLink===true && meta.isDemo!==true;
  return <div className="page-stage space-y-7">
    <PageHeader eyebrow="Aventas / Intelligence" title="Player intelligence."
      description="A private view of your competitive history, connected to the same account as Aventas tournaments."
      action={phase==='signed-in'?<div className="flex items-center gap-2">
        <button className="a-button" type="button" onClick={()=>setRevision(n=>n+1)}>↻ Refresh</button>
        <button className="a-button" type="button" onClick={()=>void logout()}>Sign out</button>
      </div>:undefined}/>
    {phase==='checking'&&<LoadingWorkspace label="Verifying the Aventas account session…"/>}
    {phase==='signed-out'&&<AccountLogin/>}
    {phase==='signed-in'&&<>
      <section className="a-hero flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
        <div className="flex items-center gap-5">
          <span className="workspace-avatar !size-[68px] !rounded-[12px] !text-[27px]">{String(player.riotId||account?.name||'A').slice(0,1).toUpperCase()}</span>
          <div>
            <p className="page-kicker uppercase">Your Aventas profile</p>
            <h2 className="mt-1 font-display text-[25px] font-semibold tracking-[-.035em] text-ink">
              {String(player.riotId||account?.name||'Player')}
              {meta.hasRiotLink===true&&<span className="text-ink-muted">#{String(player.tagline||'')}</span>}
            </h2>
            <p className="mt-2 text-[12px] text-ink-muted">{account?.email||'Account connected'}
              {lastSync&&' · Checked '+new Date(lastSync).toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Signal tone={verified?'live':'warning'}>{verified?'Riot identity linked':'Riot access pending'}</Signal>
          <p className="max-w-[270px] text-[11px] leading-5 text-ink-muted sm:text-right">
            {verified?'Stats are loaded from your website account.':'Riot account approval is required for live match ingestion.'}
          </p>
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WorkspaceTabs items={TABS} value={tab} onChange={setTab} label="Tracker sections"/>
        <span className="text-[11px] text-ink-muted">Account-scoped · Automatic 60s sync</span>
      </div>
      {view.phase==='loading'&&<LoadingWorkspace label="Fetching authenticated Aventas records…"/>}
      {view.phase==='error'&&<ErrorWorkspace detail={view.message} onRetry={()=>setRevision(n=>n+1)}/>}
      {view.phase==='ready'&&view.data&&
        <TrackerContent tab={tab} data={view.data} verified={verified} onTab={setTab}/>}
    </>}
  </div>;
}
