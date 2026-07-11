import * as SQLite from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { WELCOME_GRANT } from '../lib/streak';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('butter.db');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = getDb();

  database.execSync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id          TEXT PRIMARY KEY,
      amount      REAL NOT NULL,
      category_id TEXT NOT NULL,
      note        TEXT,
      spent_at    TEXT NOT NULL,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      icon       TEXT NOT NULL,
      color      TEXT NOT NULL,
      is_custom  INTEGER DEFAULT 0,
      sort_order INTEGER
    );

    CREATE TABLE IF NOT EXISTS game_state (
      id                 INTEGER PRIMARY KEY DEFAULT 1,
      streak_count       INTEGER DEFAULT 0,
      last_log_date      TEXT,
      longest_streak     INTEGER DEFAULT 0,
      total_entries      INTEGER DEFAULT 0,
      coins              INTEGER DEFAULT 0,
      coins_earned_today INTEGER DEFAULT 0,
      owned_items        TEXT DEFAULT '[]',
      equipped_items     TEXT DEFAULT '{}',
      story_progress     INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS budget (
      id             INTEGER PRIMARY KEY DEFAULT 1,
      monthly_budget REAL,
      currency       TEXT DEFAULT 'SGD'
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS allocations (
      id     TEXT PRIMARY KEY,
      label  TEXT NOT NULL,
      amount REAL NOT NULL,
      note   TEXT,
      kind   TEXT NOT NULL,
      month  TEXT
    );

    CREATE TABLE IF NOT EXISTS allocation_groups (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      icon       TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );
  `);

  // Phase 5b additive columns on allocations (recurring-payment fields). The table
  // already exists on 5a installs, so CREATE TABLE IF NOT EXISTS can't add them —
  // ALTER each one and swallow the "duplicate column" error on later launches.
  for (const col of ['group_id TEXT', 'cycle TEXT', 'due_day INTEGER', 'due_month INTEGER', 'info_only INTEGER']) {
    try {
      database.execSync(`ALTER TABLE allocations ADD COLUMN ${col};`);
    } catch {
      // Column already exists — expected on every launch after the first.
    }
  }

  // Phase 5f: milestone chests are once-ever — the claim ledger lives on game_state.
  try {
    database.execSync("ALTER TABLE game_state ADD COLUMN claimed_chests TEXT DEFAULT '[]';");
  } catch {
    // Column already exists.
  }

  // Seed default categories if empty
  const count = database.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM categories');
  if ((count?.c ?? 0) === 0) {
    const insert = database.prepareSync(
      'INSERT OR IGNORE INTO categories (id, name, icon, color, is_custom, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const cat of DEFAULT_CATEGORIES) {
      insert.executeSync([cat.id, cat.name, cat.icon, cat.color, cat.is_custom, cat.sort_order]);
    }
    insert.finalizeSync();
  }

  // Seed game_state row if empty (new players start with a welcome coin grant)
  const gs = database.getFirstSync<{ id: number }>('SELECT id FROM game_state WHERE id = 1');
  if (!gs) {
    database.runSync(
      'INSERT INTO game_state (id, coins) VALUES (1, ?)',
      [WELCOME_GRANT]
    );
  }

  // Seed budget row if empty
  const budget = database.getFirstSync<{ id: number }>('SELECT id FROM budget WHERE id = 1');
  if (!budget) {
    database.runSync("INSERT INTO budget (id, currency) VALUES (1, 'SGD')");
  }
}
