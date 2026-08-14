import {DEFAULT_ADMINS, DEFAULT_AUDIT, STORAGE_KEYS} from '../config/app';
import type {LiveCache, PersistedSession} from '../domain/types';

export class BrowserStorage {
  loadSession(startingBalance: number): PersistedSession {
    return this.read(STORAGE_KEYS.session, {
      balance: startingBalance,
      openPredictions: [],
      admins: structuredClone(DEFAULT_ADMINS),
      audit: structuredClone(DEFAULT_AUDIT),
      suspendedEventIds: []
    });
  }

  saveSession(session: PersistedSession): void {
    this.write(STORAGE_KEYS.session, session);
  }

  loadLiveCache(): LiveCache | null {
    return this.read<LiveCache | null>(STORAGE_KEYS.liveCache, null);
  }

  saveLiveCache(cache: LiveCache): void {
    this.write(STORAGE_KEYS.liveCache, cache);
  }

  private read<T>(key: string, fallback: T): T {
    try {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) as T : fallback;
    } catch {
      return fallback;
    }
  }

  private write(key: string, value: unknown): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be unavailable in private browsing or restricted contexts.
    }
  }
}
