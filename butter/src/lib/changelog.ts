import { RELEASES, Release } from '../constants/changelog';

// Helpers for the "What's New" popup. Releases live in constants/changelog.ts
// (newest first); these pick the ones a user hasn't seen yet.

// Compare two SemVer MAJOR.MINOR.PATCH strings. Returns <0 if a<b, 0 if equal,
// >0 if a>b. Missing/garbage parts are treated as 0 so it never throws.
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(n => parseInt(n, 10) || 0);
  const pb = b.split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

// Releases strictly newer than `floor`, preserving newest-first order. Pass the
// user's last-seen version for normal catch-up, or a phase floor for the one-time
// backfill.
export function releasesSince(floor: string): Release[] {
  return RELEASES.filter(r => compareVersions(r.version, floor) > 0);
}
