// Web stand-in for the native SQLite database module. There is no real DB on
// web — initDatabase() just primes the localStorage-backed store in queries.web.
import { initWebStore } from './queries.web';

export function getDb(): never {
  throw new Error('getDb() is not available on web — use the query functions directly.');
}

export async function initDatabase(): Promise<void> {
  initWebStore();
  // Ask the browser to keep our data: Safari's ITP evicts script-writable storage
  // after ~7 days of non-use for non-installed sites, and localStorage can be cleared
  // under storage pressure. persist() is a best-effort hint (granted on engagement),
  // not a guarantee — pair it with the backup nudge in Settings.
  try {
    const storage = (typeof navigator !== 'undefined' ? navigator.storage : undefined) as
      | (StorageManager & { persist?: () => Promise<boolean> })
      | undefined;
    if (storage?.persist) await storage.persist();
  } catch {
    // persistence is advisory; ignore failures.
  }
}
