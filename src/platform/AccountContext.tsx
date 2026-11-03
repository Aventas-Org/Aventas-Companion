import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface AventasAccount {
  id: string;
  name: string;
  email: string;
  role?: string;
  discordHandle?: string;
}
type AccountPhase = 'checking' | 'signed-out' | 'signed-in';
interface AccountContextValue {
  phase: AccountPhase;
  account: AventasAccount | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Context = createContext<AccountContextValue | null>(null);

function validAccount(value: unknown): value is AventasAccount {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return typeof data.id === 'string' && typeof data.name === 'string' &&
    typeof data.email === 'string';
}

/** The website bearer token never leaves the native Rust process.
 * Reloads require reauthentication: we deliberately do not write tokens to
 * localStorage, cookies, config files or a plaintext disk cache.
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<AccountPhase>('checking');
  const [account, setAccount] = useState<AventasAccount | null>(null);
  // A boot-time /api/me response must never overwrite a later login/logout.
  const revision = useRef(0);

  const refresh = useCallback(async () => {
    const operation = ++revision.current;
    try {
      const response = await invoke<unknown>('desktop_account');
      if (!validAccount(response)) throw new Error('Account response invalid');
      if (revision.current !== operation) return;
      setAccount(response);
      setPhase('signed-in');
    } catch {
      if (revision.current !== operation) return;
      setAccount(null);
      setPhase('signed-out');
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const operation = ++revision.current;
    const response = await invoke<unknown>('desktop_login', { email, password });
    if (!validAccount(response)) throw new Error('The website did not confirm the account.');
    if (revision.current !== operation) return;
    setAccount(response);
    setPhase('signed-in');
  }, []);

  const logout = useCallback(async () => {
    ++revision.current;
    // Hide private profile data immediately. Server revocation is attempted
    // even when the website is offline; Rust clears the native token first.
    setAccount(null);
    setPhase('signed-out');
    try { await invoke('desktop_logout'); } catch { /* local sign-out still wins */ }
  }, []);

  const value = useMemo<AccountContextValue>(() => ({
    phase, account, login, logout, refresh,
  }), [phase, account, login, logout, refresh]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAventasAccount(): AccountContextValue {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('Missing AccountProvider');
  return ctx;
}
