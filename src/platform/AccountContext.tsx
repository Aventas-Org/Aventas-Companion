import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
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

  const refresh = useCallback(async () => {
    try {
      const response = await invoke<unknown>('desktop_account');
      if (!validAccount(response)) throw new Error('Account response invalid');
      setAccount(response);
      setPhase('signed-in');
    } catch {
      setAccount(null);
      setPhase('signed-out');
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await invoke<unknown>('desktop_login', { email, password });
    if (!validAccount(response)) throw new Error('The website did not confirm the account.');
    setAccount(response);
    setPhase('signed-in');
  }, []);

  const logout = useCallback(async () => {
    try { await invoke('desktop_logout'); }
    finally {
      setAccount(null);
      setPhase('signed-out');
    }
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
