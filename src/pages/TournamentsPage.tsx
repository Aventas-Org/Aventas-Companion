import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

/** Public, server-authoritative tournament snapshot from Aventas website.
 * Private registration and check-in actions require future shared login.
 */
interface Tournament {
  slug: string;
  name: string;
  game?: string;
  status: 'upcoming' | 'live' | 'completed';
  region?: string;
  teamCount?: number;
  prizePool?: string;
  startsAt?: number;
  registrationOpen?: boolean;
}

type State = { phase: 'loading' } | { phase: 'error'; message: string } | { phase: 'ready'; tournaments: Tournament[] };

function isTournament(value: unknown): value is Tournament {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.slug === 'string' && /^[a-z0-9][a-z0-9-]{1,59}$/.test(v.slug) &&
    typeof v.name === 'string' && ['upcoming', 'live', 'completed'].includes(String(v.status));
}

export function TournamentsPage() {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const refresh = useCallback(async () => {
    try {
      const payload = await invoke<{ tournaments: unknown[] }>('fetch_public_tournaments');
      if (!Array.isArray(payload?.tournaments)) throw new Error('Invalid server response');
      setState({ phase: 'ready', tournaments: payload.tournaments.filter(isTournament) });
    } catch {
      setState({ phase: 'error', message: 'Could not reach the Aventas website. Check your connection and try again.' });
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const tournaments = state.phase === 'ready' ? state.tournaments : [];
  return (
    <section className="flex flex-col gap-5 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ink">Aventas Tournaments</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Live official listings from the Aventas website. No generated brackets or demo events.
          </p>
        </div>
        <button type="button" onClick={() => void refresh()}
          className="rounded-lg border border-line px-4 py-2 text-sm text-ink hover:bg-line">
          Refresh
        </button>
      </header>
      {state.phase === 'loading' && <p className="text-sm text-ink-muted" role="status">Loading official tournaments…</p>}
      {state.phase === 'error' && <p className="rounded-lg border border-red-500/40 bg-panel p-4 text-sm text-ink" role="alert">{state.message}</p>}
      {state.phase === 'ready' && !tournaments.length && (
        <p className="rounded-lg border border-line bg-panel p-6 text-sm text-ink-muted">
          No tournaments are currently published on the website.
        </p>
      )}
      {state.phase === 'ready' && tournaments.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {tournaments.map((t) => (
            <article key={t.slug} className="rounded-xl border border-line bg-panel p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-ink">{t.name}</h3>
                <span className="rounded-full border border-line px-2.5 py-1 text-xs capitalize text-ink-muted">{t.status}</span>
              </div>
              <p className="mt-3 text-sm text-ink-muted">
                {t.game || 'Valorant'} · {t.region || 'Region unspecified'}
                {typeof t.teamCount === 'number' ? ` · ${t.teamCount} approved teams` : ''}
              </p>
              {typeof t.startsAt === 'number' && t.startsAt > 0 && (
                <p className="mt-2 text-xs text-ink-muted">
                  Starts {new Date(t.startsAt).toLocaleString()}
                </p>
              )}
              <a href={`https://aventasgaming.com/tournaments/${encodeURIComponent(t.slug)}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-semibold text-accent underline underline-offset-4">
                View official bracket and registration
              </a>
            </article>
          ))}
        </div>
      )}
      <p className="text-xs text-ink-muted">
        Website listings sync every 60 seconds. Account-linked sign-in, team check-ins and private stats will be enabled after secure desktop authentication is implemented.
      </p>
    </section>
  );
}
