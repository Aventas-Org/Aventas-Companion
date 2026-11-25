import { useEffect, useRef, useState } from 'react';
import { useAventasAccount } from '../platform/AccountContext';
import { NAV_ITEMS, type NavId } from './nav';
import {
  OverviewIcon, CrosshairIcon, TrophyIcon, UserIcon, GamepadIcon, BenchmarkIcon, SettingsIcon,
} from './icons';

const tabs: { id: NavId; label: string; Icon: typeof OverviewIcon }[] = [
  { id: 'overview', label: 'Home', Icon: OverviewIcon },
  { id: 'live', label: 'Live tracker', Icon: CrosshairIcon },
  { id: 'tournaments', label: 'Tournaments', Icon: TrophyIcon },
  { id: 'directory', label: 'Players', Icon: UserIcon },
  { id: 'utilities', label: 'Device', Icon: GamepadIcon },
];
export const LAB_IDS: NavId[] = ['performance', 'benchmark', 'insights', 'matches', 'profile', 'statistics'];
const labelOf = (id: NavId) => NAV_ITEMS.find(item => item.id === id)!.label.replace('Demo: ', '');

interface TopNavProps { active: NavId; onNavigate: (id: NavId) => void; onSearch: () => void }

/** Launcher-style chrome: a title bar with status, then one row of section tabs. */
export function TopNav({ active, onNavigate, onSearch }: TopNavProps) {
  const { phase, account } = useAventasAccount();
  const [labOpen, setLabOpen] = useState(false);
  const labRef = useRef<HTMLDivElement>(null);
  const inLab = LAB_IDS.includes(active);

  useEffect(() => {
    if (!labOpen) return;
    const close = (event: MouseEvent) => {
      if (!labRef.current?.contains(event.target as Node)) setLabOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [labOpen]);

  const connected = phase === 'signed-in';
  return <header className="top-chrome shrink-0">
    <div className="title-bar">
      <div className="flex min-w-0 items-center gap-2.5">
        <svg width="20" height="20" viewBox="0 0 29 28" fill="none" aria-hidden="true">
          <path d="M4 23L14 4L24 23H19.5L14 12.2L8.5 23H4Z" fill="currentColor" className="text-ink"/>
          <path d="M12.3 19.3H23.4" stroke="currentColor" className="text-accent" strokeWidth="3"/>
        </svg>
        <span className="font-display text-[13px] font-semibold tracking-[.01em] text-ink">Aventas Companion</span>
        <span className="hidden text-[11px] text-ink-muted sm:inline">Preview 0.1</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="mr-3 hidden items-center gap-2 text-[11px] text-ink-muted md:flex">
          <span className={'a-status-dot ' + (connected ? 'text-emerald-400' : phase === 'checking' ? 'text-amber-300' : 'text-ink-muted')}/>
          {connected ? (account?.name || 'Account connected') : phase === 'checking' ? 'Connecting' : 'Not signed in'}
        </span>
        <button type="button" className="chrome-icon" onClick={onSearch} title="Find a page (Ctrl+K)" aria-label="Find a page">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 5 5"/></svg>
        </button>
        <button type="button" className="chrome-icon" data-active={active === 'settings'} onClick={() => onNavigate('settings')}
          title="Settings" aria-label="Settings" aria-current={active === 'settings' ? 'page' : undefined}>
          <SettingsIcon width={16} height={16}/>
        </button>
      </div>
    </div>

    <nav className="tab-bar" aria-label="Companion sections">
      {tabs.map(({ id, label, Icon }) => <button key={id} type="button" className="tab-item"
        aria-current={active === id ? 'page' : undefined} onClick={() => onNavigate(id)}>
        <Icon width={15} height={15} className="shrink-0"/>
        {label}
        {id === 'live' && <span className="tab-badge">Beta</span>}
      </button>)}
      <div className="relative" ref={labRef}>
        <button type="button" className="tab-item" aria-current={inLab ? 'page' : undefined}
          aria-expanded={labOpen} aria-haspopup="menu" onClick={() => setLabOpen(open => !open)}>
          <BenchmarkIcon width={15} height={15} className="shrink-0"/>
          Practice lab{inLab ? ': ' + labelOf(active) : ''}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        {labOpen && <div role="menu" className="lab-menu">
          <p className="px-3 pb-1.5 pt-1 text-[11px] text-ink-muted">Sample data for trying the tools</p>
          {LAB_IDS.map(id => <button key={id} role="menuitem" type="button" className="lab-menu-item"
            data-active={active === id} onClick={() => { onNavigate(id); setLabOpen(false); }}>
            {labelOf(id)}
          </button>)}
        </div>}
      </div>
    </nav>
  </header>;
}
