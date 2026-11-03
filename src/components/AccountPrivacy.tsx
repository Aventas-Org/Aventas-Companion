import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAventasAccount } from '../platform/AccountContext';
import { Signal } from './WorkspaceUI';

type State={phase:'idle'|'loading'|'ready'|'error';isPublic:boolean|null};
function readVisibility(value:unknown):boolean {
  if(!value||typeof value!=='object')throw Error('Missing player profile');
  const meta=(value as Record<string,unknown>).meta;
  if(!meta||typeof meta!=='object')throw Error('Missing profile privacy state');
  const state=(meta as Record<string,unknown>).isPublic;
  if(typeof state!=='boolean')throw Error('Invalid public visibility state');
  return state;
}

/** Public player directory visibility is a website-owned consent setting. */
export function AccountPrivacy() {
  const {phase,account}=useAventasAccount();
  const [state,setState]=useState<State>({phase:'idle',isPublic:null});
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  useEffect(()=>{
    if(phase!=='signed-in'||!account){
      setState({phase:'idle',isPublic:null});setMessage('');return;
    }
    let cancelled=false;
    setState({phase:'loading',isPublic:null});
    void invoke<unknown>('desktop_companion_data',{endpoint:'profile'})
      .then(profile=>{if(!cancelled)setState({phase:'ready',isPublic:readVisibility(profile)});})
      .catch(()=>{if(!cancelled)setState({phase:'error',isPublic:null});});
    return()=>{cancelled=true;};
  },[phase,account?.id]);

  async function toggle(next:boolean){
    if(busy||state.phase!=='ready')return;
    if(next&&!window.confirm('Make your Riot name, region, rank and competitive aggregate statistics publicly searchable on Aventas? Your email and individual matches stay private. You can turn this off later.'))return;
    setBusy(true);setMessage('');
    try{
      const confirmed=await invoke<boolean>('desktop_set_profile_visibility',{isPublic:next});
      if(confirmed!==next)throw Error('Website confirmation mismatch');
      setState({phase:'ready',isPublic:confirmed});
      setMessage(next?'Your public directory listing is now enabled.':'Your profile has been hidden from public search.');
    }catch{
      setMessage('Privacy settings could not be updated. Your previous visibility state has not been changed here.');
    }finally{setBusy(false);}
  }

  return <section className="workspace-panel p-6 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="page-kicker uppercase">Connected account / Privacy</p>
        <h3 className="mt-2 font-display text-[19px] font-semibold text-ink">Player directory visibility</h3>
        <p className="mt-2 max-w-[600px] text-[12px] leading-6 text-ink-muted">
          Decide whether other Aventas users can find your Riot name, rank, region and aggregate performance.
          Your account email, Riot PUUID, private matches and individual round details are never public.
        </p>
      </div>
      <Signal tone={state.phase==='ready'&&state.isPublic?'live':'neutral'}>
        {state.phase==='loading'?'Checking privacy…':state.phase==='ready'?(state.isPublic?'Public':'Private'):'Not connected'}
      </Signal>
    </div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
      <div>
        <p className="text-[12px] font-semibold text-ink">{phase==='signed-in'?account?.name:'Sign in to manage visibility'}</p>
        <p className="mt-1 text-[11px] text-ink-muted">
          {state.phase==='ready'?(state.isPublic?'Opted in to public search':'Not listed in the public directory'):
            state.phase==='loading'?'Retrieving current website preference…':
            'Privacy changes require a connected website session.'}
        </p>
      </div>
      <button type="button" role="switch" aria-checked={state.isPublic===true}
        aria-label="Show my profile in Aventas public player search"
        disabled={phase!=='signed-in'||state.phase!=='ready'||busy}
        onClick={()=>void toggle(!state.isPublic)}
        className={'relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40 '+
          (state.isPublic?'border-emerald-400/50 bg-emerald-400/30':'border-line bg-line/60')}>
        <span className={'absolute top-[3px] size-5 rounded-full bg-ink shadow-sm transition-transform '+
          (state.isPublic?'left-[24px]':'left-[3px]')} aria-hidden="true"/>
      </button>
    </div>
    {state.phase==='error'&&<p role="alert" className="mt-4 text-[11px] text-amber-300">Could not read the privacy status from the website. Try opening this page again while online.</p>}
    {message&&<p role="status" className="mt-4 text-[11px] text-ink-muted">{message}</p>}
  </section>;
}
