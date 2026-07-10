import { Snapshot } from '../db/queries';

export const BACKUP_VERSION = 1;

export type Backup = {
  version: number;
  exportedAt: string;
  expenses: Snapshot['expenses'];
  categories: Snapshot['categories'];
  game_state: Snapshot['game_state'];
  budget: Snapshot['budget'];
  allocations: Snapshot['allocations'];
  allocation_groups: Snapshot['allocation_groups'];
};

/** Serialize a full app snapshot into a versioned JSON backup string. */
export function serializeBackup(snap: Snapshot): string {
  const backup: Backup = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    expenses: snap.expenses,
    categories: snap.categories,
    game_state: snap.game_state,
    budget: snap.budget,
    allocations: snap.allocations,
    allocation_groups: snap.allocation_groups,
  };
  return JSON.stringify(backup, null, 2);
}

/**
 * Parse and validate a JSON backup string into a Snapshot. Throws a
 * human-readable Error if the file is malformed or an unsupported version.
 */
export function parseBackup(text: string): Snapshot {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON.");
  }

  if (typeof data !== 'object' || data === null) {
    throw new Error("This doesn't look like a Butter backup.");
  }

  const b = data as Partial<Backup>;

  if (typeof b.version !== 'number') {
    throw new Error("This doesn't look like a Butter backup (missing version).");
  }
  if (b.version > BACKUP_VERSION) {
    throw new Error(`This backup was made by a newer version of Butter (v${b.version}). Please update the app.`);
  }
  if (!Array.isArray(b.expenses) || !Array.isArray(b.categories)) {
    throw new Error('This backup is missing its expenses or categories.');
  }

  return {
    expenses: b.expenses,
    categories: b.categories,
    game_state: b.game_state as Snapshot['game_state'],
    budget: (b.budget as Snapshot['budget']) ?? { monthly_budget: null, currency: 'SGD' },
    allocations: Array.isArray(b.allocations) ? b.allocations : [], // absent in pre-Phase-5 backups
    allocation_groups: Array.isArray(b.allocation_groups) ? b.allocation_groups : [], // absent pre-5b
  };
}
