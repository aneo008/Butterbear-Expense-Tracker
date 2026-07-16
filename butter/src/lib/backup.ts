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
  salary_history: Snapshot['salary_history'];
  income_events: Snapshot['income_events'];
  income_overrides: Snapshot['income_overrides'];
  allocation_history: Snapshot['allocation_history'];
  allocation_amount_history: Snapshot['allocation_amount_history'];
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
    salary_history: snap.salary_history,
    income_events: snap.income_events,
    income_overrides: snap.income_overrides,
    allocation_history: snap.allocation_history,
    allocation_amount_history: snap.allocation_amount_history,
  };
  return JSON.stringify(backup, null, 2);
}

// ---- per-row validation ----------------------------------------------------
// Replace does DELETE + INSERT on native, so a malformed-but-array file could
// wipe real data and load garbage. Every row is shape-checked BEFORE anything
// destructive runs; a bad row rejects the whole file with a readable error.

const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStrOrNull = (v: unknown) => v === null || v === undefined || isStr(v);

function checkRows(rows: unknown[], section: string, check: (r: Record<string, unknown>) => boolean): void {
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (typeof r !== 'object' || r === null || !check(r as Record<string, unknown>)) {
      throw new Error(
        `This backup's ${section} look corrupted (entry ${i + 1}). Nothing was restored.`
      );
    }
  }
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

  checkRows(b.expenses, 'expenses', r =>
    isStr(r.id) && isNum(r.amount) && isStr(r.category_id) && isStr(r.spent_at) &&
    isStr(r.created_at) && isStrOrNull(r.note)
  );
  checkRows(b.categories, 'categories', r =>
    isStr(r.id) && isStr(r.name) && isStr(r.icon) && isStr(r.color)
  );

  const allocations = Array.isArray(b.allocations) ? b.allocations : []; // absent pre-Phase-5
  checkRows(allocations, 'set-asides', r =>
    isStr(r.id) && isStr(r.label) && isNum(r.amount) &&
    (r.kind === 'recurring' || r.kind === 'oneoff')
  );
  const allocationGroups = Array.isArray(b.allocation_groups) ? b.allocation_groups : []; // absent pre-5b
  checkRows(allocationGroups, 'payment groups', r =>
    isStr(r.id) && isStr(r.name) && isStr(r.icon)
  );

  const salaryHistory = Array.isArray(b.salary_history) ? b.salary_history : []; // absent pre-1.5.4
  checkRows(salaryHistory, 'salary history', r =>
    isStr(r.id) && isStr(r.from_month) && isNum(r.amount)
  );
  const incomeEvents = Array.isArray(b.income_events) ? b.income_events : []; // absent pre-1.5.4
  checkRows(incomeEvents, 'income entries', r =>
    isStr(r.id) && isStr(r.label) && isNum(r.amount) && isStr(r.month)
  );
  const incomeOverrides = Array.isArray(b.income_overrides) ? b.income_overrides : []; // absent pre-1.5.6
  checkRows(incomeOverrides, 'monthly income', r =>
    isStr(r.id) && isStr(r.month) && isNum(r.amount)
  );
  const allocationHistory = Array.isArray(b.allocation_history) ? b.allocation_history : []; // absent pre-1.5.9
  checkRows(allocationHistory, 'set-aside history', r =>
    isStr(r.id) && isStr(r.allocation_id) && isStr(r.month) && isNum(r.amount)
  );
  const allocationAmountHistory = Array.isArray(b.allocation_amount_history) ? b.allocation_amount_history : []; // absent pre-1.6.5
  // Lenient: at least one of amount/percent must be a number; a row with both is
  // fine (each resolver only reads its own field — a stray value sits harmlessly).
  checkRows(allocationAmountHistory, 'set-aside amount changes', r =>
    isStr(r.id) && isStr(r.allocation_id) && isStr(r.from_month) && (isNum(r.amount) || isNum(r.percent))
  );

  if (b.game_state !== undefined) {
    checkRows([b.game_state], 'progress (game state)', r =>
      isNum(r.streak_count) && isNum(r.longest_streak) && isNum(r.total_entries) &&
      isNum(r.coins) && isNum(r.coins_earned_today) && isStrOrNull(r.last_log_date)
    );
  }

  return {
    expenses: b.expenses,
    categories: b.categories,
    game_state: b.game_state as Snapshot['game_state'],
    budget: (b.budget as Snapshot['budget']) ?? { monthly_budget: null, currency: 'SGD' },
    allocations,
    allocation_groups: allocationGroups,
    salary_history: salaryHistory,
    income_events: incomeEvents,
    income_overrides: incomeOverrides,
    allocation_history: allocationHistory,
    allocation_amount_history: allocationAmountHistory,
  };
}
