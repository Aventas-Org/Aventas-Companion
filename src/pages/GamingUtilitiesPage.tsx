import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useValorantStatus } from '../hooks/useValorantStatus';
import { OverlayControl } from '../components/OverlayControl';
import { PageHeader, SectionHeading, Signal } from '../components/WorkspaceUI';

interface Metrics { cpuPercent:number|null;memoryPercent:number;totalMemoryBytes:number;usedMemoryBytes:number }
const percentage=(n:number|null|undefined)=>typeof n==='number'&&Number.isFinite(n)?n.toFixed(1)+'%':'—';
const gib=(n:number|null|undefined)=>typeof n==='number'&&Number.isFinite(n)?(n/1073741824).toFixed(1)+' GiB':'—';
const elapsed=(total:number)=>[Math.floor(total/3600),Math.floor(total%3600/60),total%60].map(x=>String(x).padStart(2,'0')).join(':');

function Gauge({ title, value, detail, meter }: {title:string;value:string;detail:string;meter?:number|null}) {
  return <div className="workspace-panel p-6">
    <div className="flex items-center justify-between">
      <p className="a-eyebrow uppercase">{title}</p>
      <span className="size-1.5 rounded-full bg-accent/70" aria-hidden="true"/>
    </div>
    <p className="a-number mt-5 text-[42px] leading-none text-ink">{value}</p>
    <div className="workspace-progress mt-5">
      <span style={{width:Math.min(100,Math.max(0,meter??0))+'%'}}/>
    </div>
    <p className="mt-4 text-[11px] leading-5 text-ink-muted">{detail}</p>
  </div>;
}

export function GamingUtilitiesPage() {
  const game=useValorantStatus();
  const running=game.phase==='ready'&&game.response.status==='running';
  const [start,setStart]=useState<number|null>(null);
  const [seconds,setSeconds]=useState(0);
  const [metrics,setMetrics]=useState<Metrics|null>(null);
  const [error,setError]=useState(false);
  const [checked,setChecked]=useState<number|null>(null);
  useEffect(()=>{
    let stopped=false;
    async function sample(){
      try {
        const response=await invoke<Metrics>('read_system_metrics');
        if(!stopped){setMetrics(response);setError(false);setChecked(Date.now());}
      } catch { if(!stopped){setMetrics(null);setError(true);} }
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

  const headline=game.phase==='loading'?'Scanning for VALORANT…':
    game.phase==='error'?'Windows game monitor unavailable':
    running?'VALORANT is running':'VALORANT is not running';
  return <div className="page-stage space-y-7">
    <PageHeader eyebrow="Aventas / Device" title="Your system, in view."
      description="Lightweight Windows performance readings and safe game-session tools. No process injection, no opponent scanning."/>
    <section className="a-hero grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(240px,.85fr)]">
      <div className="flex flex-col justify-between p-7 sm:p-9">
        <div>
          <Signal tone={running?'live':game.phase==='error'?'warning':'neutral'}>
            {running?'Game process detected':game.phase==='error'?'Detector unavailable':'On standby'}
          </Signal>
          <h2 className="mt-7 font-display text-[32px] font-semibold leading-[1.12] tracking-[-.035em] text-ink sm:text-[39px]">
            {headline}
          </h2>
          <p className="mt-3 text-[12px] leading-6 text-ink-muted">
            {running?'Read-only Windows process detection confirms the game executable is active.':
              'The Companion checks the Windows process list every five seconds. It does not inspect in-game state.'}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-6 border-t border-line pt-5">
          <div><p className="a-eyebrow">PROCESS</p><p className="mt-1 font-mono text-[12px] text-ink">{game.phase==='ready'?game.response.processName||'Not detected':'—'}</p></div>
          <div><p className="a-eyebrow">SAMPLING</p><p className="mt-1 font-mono text-[12px] text-ink">5 second intervals</p></div>
          <div><p className="a-eyebrow">METHOD</p><p className="mt-1 font-mono text-[12px] text-ink">Windows ToolHelp</p></div>
        </div>
      </div>
      <div className="flex items-center justify-center border-t border-line p-6 lg:border-l lg:border-t-0">
        <div className="relative flex size-[205px] items-center justify-center" aria-hidden="true">
          <div className={'absolute inset-0 rounded-full border border-dashed '+(running?'border-emerald-400/50':'border-accent/30')}/>
          <div className={'absolute inset-[21px] rounded-full border '+(running?'border-emerald-400/35 bg-emerald-400/5':'border-line bg-app/50')}/>
          <svg className={running?'relative text-emerald-400':'relative text-accent'} width="78" height="78" fill="none" viewBox="0 0 80 80" stroke="currentColor" strokeWidth="1.6">
            <circle cx="40" cy="40" r="23"/><circle cx="40" cy="40" r="9"/>
            <path d="M40 2v15M40 63v15M2 40h15M63 40h15M17 17l9 9M54 54l9 9M17 63l9-9M54 26l9-9"/>
          </svg>
          <span className="absolute bottom-[-12px] font-mono text-[10px] text-ink-muted">LOCAL TELEMETRY</span>
        </div>
      </div>
    </section>
    <section className="space-y-3">
      <SectionHeading title="Machine health" detail="Read-only system-wide OS statistics, not VALORANT-specific FPS or GPU diagnostics."
        trailing={<span className="text-[11px] text-ink-muted">{checked?'Checked '+new Date(checked).toLocaleTimeString():'Waiting for Windows sample'}</span>}/>
      <div className="grid gap-4 md:grid-cols-3">
        <Gauge title="Total CPU load" value={error?'Unavailable':percentage(metrics?.cpuPercent)} meter={metrics?.cpuPercent}
          detail="Windows kernel and user time measured between system samples."/>
        <Gauge title="Physical memory" value={error?'Unavailable':percentage(metrics?.memoryPercent)} meter={metrics?.memoryPercent}
          detail={metrics?gib(metrics.usedMemoryBytes)+' used / '+gib(metrics.totalMemoryBytes)+' installed':'Waiting for RAM totals from Windows.'}/>
        <div className="workspace-panel p-6">
          <p className="a-eyebrow uppercase">Observed game runtime</p>
          <p className="a-number mt-5 text-[40px] leading-none text-ink">{elapsed(running?seconds:0)}</p>
          <p className="mt-5 text-[11px] leading-6 text-ink-muted">
            This counter starts when the game is detected while this screen is open. It resets on close;
            it is not your lifetime or full-session gameplay record.
          </p>
          <div className="mt-5 border-t border-line pt-3">
            <Signal tone={running?'live':'neutral'}>{running?'Currently observing':'Observation idle'}</Signal>
          </div>
        </div>
      </div>
    </section>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
      <section className="workspace-panel p-6">
        <SectionHeading title="Desktop overlay" detail="Historical personal data only; no real-time enemy intel."/>
        <div className="mt-5"><OverlayControl/></div>
      </section>
      <section className="workspace-panel p-6">
        <SectionHeading title="Compatibility notes" detail="The boundaries that keep this Companion safe and predictable."/>
        <div className="mt-5 space-y-4">
          {[
            ['Read-only','No process memory reading, DLL injection, or input automation.'],
            ['Privacy','No telemetry upload to Aventas; hardware metrics remain on-device.'],
            ['Not supported','GPU temperatures and true in-game FPS need a separate, approved provider.'],
          ].map(([title,detail],i)=><div key={title} className="flex gap-3 border-b border-line/70 pb-4 last:border-0 last:pb-0">
            <span className="a-number w-6 text-[12px] text-accent">{String(i+1).padStart(2,'0')}</span>
            <div><p className="text-[12px] font-semibold text-ink">{title}</p><p className="mt-1 text-[11px] leading-5 text-ink-muted">{detail}</p></div>
          </div>)}
        </div>
      </section>
    </div>
  </div>;
}
