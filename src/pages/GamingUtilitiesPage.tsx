import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useValorantStatus } from '../hooks/useValorantStatus';
import { OverlayControl } from '../components/OverlayControl';

interface Metrics { cpuPercent:number|null;memoryPercent:number;totalMemoryBytes:number;usedMemoryBytes:number }
interface Sample { cpu:number|null;memory:number }
const percentage=(n:number|null|undefined)=>typeof n==='number'&&Number.isFinite(n)?n.toFixed(1)+'%':'—';
const gib=(n:number|null|undefined)=>typeof n==='number'&&Number.isFinite(n)?(n/1073741824).toFixed(1)+' GiB':'—';
const elapsed=(total:number)=>[Math.floor(total/3600),Math.floor(total%3600/60),total%60].map(x=>String(x).padStart(2,'0')).join(':');

function LiveSparkline({samples,kind}: {samples:Sample[];kind:'cpu'|'memory'}) {
  const values=samples.map((s,i)=>({index:i,value:s[kind]}))
    .filter(p=>typeof p.value==='number'&&Number.isFinite(p.value));
  if(values.length<2) return <p className="flex h-[58px] items-center text-[13px] text-ink-muted">Collecting readings…</p>;
  const width=220, height=64, divisor=Math.max(samples.length-1,1);
  const points=values.map(p=>({
    x:width*p.index/divisor, y:Math.max(4,Math.min(60,64-(p.value as number)*0.6)),
  }));
  const stroke=points.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');
  const fill=stroke+' L '+points[points.length-1].x.toFixed(1)+' 64 L '+points[0].x.toFixed(1)+' 64 Z';
  const color='rgb(var(--color-ink) / .8)';
  return <svg role="img" aria-label={kind==='cpu'?'Recent Windows CPU utilization':'Recent Windows RAM utilization'}
    className="h-[58px] w-full" viewBox="0 0 220 64" preserveAspectRatio="none">
    <title>{kind==='cpu'?'CPU':'RAM'} usage sampled every five seconds</title>
    <path d="M0 16H220M0 32H220M0 48H220" stroke="rgb(var(--color-line))" strokeWidth=".5" strokeDasharray="3 5"/>
    <path d={fill} fill='rgb(var(--color-ink) / .06)'/>
    <path d={stroke} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>;
}

/** One readout in the instrument strip: label, big figure, meter, trace. */
function Readout({ title, value, detail, meter, history, kind }: {
  title:string;value:string;detail:string;meter?:number|null;history?:Sample[];kind?:'cpu'|'memory';
}) {
  const level=typeof meter==='number'?meter:null;
  const hot=level!=null&&level>=85;
  return <div className="readout">
    <p className="text-[13px] text-ink-muted">{title}</p>
    <p className={'figure mt-2 text-[52px] font-semibold leading-none '+(hot?'text-[#D9534A]':'text-ink')}>{value}</p>
    {level!=null&&<div className="readout-meter mt-4" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level)} aria-label={title}>
      <span style={{width:Math.min(100,Math.max(0,level))+'%'}} data-hot={hot||undefined}/>
    </div>}
    {history && kind && <div className="mt-3"><LiveSparkline samples={history} kind={kind}/></div>}
    <p className="mt-3 text-[13px] leading-5 text-ink-muted">{detail}</p>
  </div>;
}

export function GamingUtilitiesPage() {
  const game=useValorantStatus();
  const running=game.phase==='ready'&&game.response.status==='running';
  const [start,setStart]=useState<number|null>(null);
  const [seconds,setSeconds]=useState(0);
  const [metrics,setMetrics]=useState<Metrics|null>(null);
  const [history,setHistory]=useState<Sample[]>([]);
  const [error,setError]=useState(false);
  const [checked,setChecked]=useState<number|null>(null);
  useEffect(()=>{
    let stopped=false,fetching=false;
    async function sample(){
      if(fetching)return;
      fetching=true;
      try {
        const response=await invoke<Metrics>('read_system_metrics');
        if(!stopped){
          setMetrics(response);setError(false);setChecked(Date.now());
          setHistory(current=>[...current,{
            cpu:typeof response.cpuPercent==='number'?response.cpuPercent:null,
            memory:response.memoryPercent,
          }].slice(-24));
        }
      } catch { if(!stopped){setMetrics(null);setError(true);} }
      finally{fetching=false;}
    }
    void sample();
    const timer=window.setInterval(()=>void sample(),5000);
    return()=>{stopped=true;window.clearInterval(timer);};
  },[]);
  useEffect(()=>{
    if(!running){setStart(null);setSeconds(0);}
    else setStart(t=>t??Date.now());
  },[running]);
  useEffect(()=>{
    if(!start||!running)return;
    const timer=window.setInterval(()=>setSeconds(Math.floor((Date.now()-start)/1000)),1000);
    return()=>window.clearInterval(timer);
  },[start,running]);

  const headline=game.phase==='loading'?'Looking for VALORANT…':
    game.phase==='error'?'Game detection is unavailable on this machine':
    running?'VALORANT is running':'VALORANT is not running';
  return <div className="page-stage space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="page-heading">Device</h1>
        <p className="mt-3 flex items-center gap-2 text-[15px] text-ink">
          <span className={'size-2 rounded-full '+(running?'bg-[#5BB98C]':game.phase==='error'?'bg-[#D9534A]':'bg-ink-muted')} aria-hidden="true"/>
          {headline}
          {game.phase==='ready'&&game.response.processName&&<span className="text-ink-muted">({game.response.processName})</span>}
        </p>
      </div>
      <p className="text-[13px] text-ink-muted">{checked?'Updated '+new Date(checked).toLocaleTimeString():'Waiting for the first Windows reading'}</p>
    </header>

    <section className="instrument" aria-label="Machine health">
      <Readout title="CPU" value={error?'–':percentage(metrics?.cpuPercent)} meter={error?null:metrics?.cpuPercent}
        history={history} kind="cpu" detail="Whole-system load, sampled every 5 seconds."/>
      <Readout title="Memory" value={error?'–':percentage(metrics?.memoryPercent)} meter={error?null:metrics?.memoryPercent}
        history={history} kind="memory"
        detail={metrics?gib(metrics.usedMemoryBytes)+' of '+gib(metrics.totalMemoryBytes)+' in use':'Waiting for memory totals.'}/>
      <Readout title="Game time" value={elapsed(running?seconds:0)}
        detail={running?'Counting since VALORANT was detected while this screen was open.':'Starts when VALORANT is detected while this screen is open.'}/>
    </section>
    {error&&<p className="-mt-4 text-[13px] text-ink-muted">Windows readings are unavailable here. They work in the installed desktop app.</p>}

    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
      <section className="space-y-4">
        <div>
          <h2 className="text-[18px] font-semibold text-ink">Overlay</h2>
          <p className="mt-1 text-[13px] text-ink-muted">Shows your own past stats on screen. It never shows live information about other players.</p>
        </div>
        <OverlayControl/>
      </section>
      <section>
        <h2 className="text-[18px] font-semibold text-ink">What the Companion touches</h2>
        <ul className="mt-4 space-y-3 text-[14px] leading-6 text-ink-muted">
          <li><span className="text-ink">Reads</span> the Windows process list and system CPU and memory totals.</li>
          <li><span className="text-ink">Never</span> reads game memory, injects code or automates input.</li>
          <li><span className="text-ink">Keeps</span> hardware readings on this PC. Nothing is uploaded.</li>
          <li><span className="text-ink">Can't show</span> GPU temperature or in-game FPS yet. That needs an approved provider.</li>
        </ul>
      </section>
    </div>
  </div>;
}
