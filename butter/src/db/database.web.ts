// Web stand-in for the native SQLite database module. There is no real DB on
// web — initDatabase() just primes the localStorage-backed store in queries.web.
import { initWebStore } from './queries.web';

export function getDb(): never {
  throw new Error('getDb() is not available on web — use the query functions directly.');
}

export async function initDatabase(): Promise<void> {
  initWebStore();
}
