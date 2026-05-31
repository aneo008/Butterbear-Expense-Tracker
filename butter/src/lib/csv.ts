import { Expense } from '../db/queries';
import { Category } from '../constants/categories';

/** Quote a CSV field when it contains a comma, quote, or newline. */
function escapeField(value: string | number | null): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Encode expenses to CSV with columns: date, amount, category, note, created_at.
 * `category` is the human-readable name (resolved from the category list).
 */
export function expensesToCSV(expenses: Expense[], categories: Category[]): string {
  const nameById = new Map(categories.map(c => [c.id, c.name]));
  const header = ['date', 'amount', 'category', 'note', 'created_at'];
  const lines = [header.join(',')];

  for (const e of expenses) {
    lines.push([
      escapeField(e.spent_at),
      escapeField(e.amount.toFixed(2)),
      escapeField(nameById.get(e.category_id) ?? e.category_id),
      escapeField(e.note),
      escapeField(e.created_at),
    ].join(','));
  }

  return lines.join('\n');
}
