import { useEffect, useMemo, useRef, useState } from 'react';
import { NAV_ITEMS, type NavId } from './nav';

interface CommandPaletteProps {
  open: boolean;
  active: NavId;
  onClose: () => void;
  onNavigate: (page: NavId) => void;
}

export function CommandPalette({ open, active, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return NAV_ITEMS.filter(item => item.enabled && (
      !needle || item.label.toLowerCase().includes(needle) ||
      (needle.includes('riot') && item.id === 'live') ||
      (needle.includes('event') && item.id === 'tournaments') ||
      (needle.includes('hardware') && item.id === 'utilities')
    ));
  }, [query]);

  useEffect(() => {
    if (!open) { setQuery(''); setHighlighted(0); return; }
    ref.current?.focus();
  }, [open]);

  useEffect(() => { setHighlighted(0); }, [query]);

  if (!open) return null;

  function submit(index: number) {
    const item = results[index];
    if (!item) return;
    onNavigate(item.id);
    onClose();
  }

  return <div className="fixed inset-0 z-50 flex justify-center bg-[#020508]/75 px-4 pt-[12vh] backdrop-blur-[7px]"
    onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="command-title"
      className="h-fit w-full max-w-[560px] overflow-hidden rounded-xl border border-line bg-panel shadow-[0_30px_100px_rgba(0,0,0,.62)]">
      <div className="flex items-center gap-3 border-b border-line px-4 py-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="shrink-0 text-ink-muted" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="7" /><path d="m16 16 5 5" />
        </svg>
        <label htmlFor="command-input" id="command-title" className="sr-only">Find a Companion page</label>
        <input id="command-input" ref={ref} value={query} onChange={event => setQuery(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'ArrowDown') { event.preventDefault(); setHighlighted(n => (n + 1) % Math.max(1, results.length)); }
            if (event.key === 'ArrowUp') { event.preventDefault(); setHighlighted(n => (n - 1 + Math.max(1, results.length)) % Math.max(1, results.length)); }
            if (event.key === 'Enter') { event.preventDefault(); submit(highlighted); }
            if (event.key === 'Escape') { event.preventDefault(); onClose(); }
            if (event.key === 'Tab') {
              // Keep keyboard focus inside this single-input command dialog.
              event.preventDefault();
              ref.current?.focus();
            }
          }}
          role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls="command-results"
          aria-activedescendant={results[highlighted] ? 'command-' + results[highlighted].id : undefined}
          placeholder="Search pages, competitions, tools…" autoComplete="off"
          className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-muted"/>
        <kbd className="rounded border border-line px-1.5 py-1 font-mono text-[10px] text-ink-muted">ESC</kbd>
      </div>
      <p className="px-4 pb-2 pt-4 text-[11px] text-ink-muted">Navigate to</p>
      <div id="command-results" role="listbox" aria-label="Companion pages" className="max-h-[360px] overflow-y-auto px-2 pb-2">
        {results.length === 0 && <p className="px-3 py-8 text-center text-xs text-ink-muted">No matching page. Try “tracker” or “tournaments”.</p>}
        {results.map((item, index) => <button
          id={'command-' + item.id} key={item.id} role="option"
          aria-selected={highlighted === index} type="button"
          onMouseEnter={() => setHighlighted(index)}
          onClick={() => submit(index)}
          className={'flex w-full items-center justify-between rounded-[7px] px-3 py-3 text-left text-[13px] ' +
            (highlighted === index ? 'bg-line text-ink' : 'text-ink-muted hover:text-ink')}>
          <span>{item.label}</span>
          <span className="flex items-center gap-2 text-[11px] text-ink-muted">
            {item.id === active && 'Current'}
            {item.label.startsWith('Demo:') && <span className="rounded border border-line px-1.5 py-0.5">Sample</span>}
          </span>
        </button>)}
      </div>
      <div className="flex gap-4 border-t border-line bg-app/50 px-4 py-3 text-[10px] text-ink-muted">
        <span>↑ ↓ Navigate</span><span>Enter to open</span><span>Esc to close</span>
      </div>
    </section>
  </div>;
}
