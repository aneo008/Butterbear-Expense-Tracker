// v1.6.4: GitHub Pages has no cache-control/service-worker layer, so a mobile
// browser can serve an ancient cached index.html (pointing at an equally ancient,
// already-superseded JS bundle) on cold start — confirmed root cause of repeated
// real data loss: an old bundle's initWebStore() doesn't know about fields added
// after it was built, and silently drops them on its next persist(). No fix to
// TODAY's code can patch a bundle that's already downloaded and frozen — the only
// real fix is detecting staleness before that bundle ever touches localStorage.
//
// ⚠️ WEB-ONLY WORKAROUND for GitHub Pages' lack of cache-control — see the ROADMAP
// note next to "ship native". Delete this file (+ staleness.ts + the version.json
// step in inject-web-head.mjs + the call site in app/_layout.tsx) once native ships;
// native has no static-HTML-caching concept, so this problem can't occur there.
import { BUILD_NUMBER, BASE_PATH } from './version';

const RELOAD_FLAG = 'butter.staleReloadAttempted';
const FETCH_TIMEOUT_MS = 3000;

/**
 * Fetches version.json (cache-busted) and compares it to this bundle's own build
 * number. If a newer build is deployed, forces a fresh reload before any data-layer
 * code can run — returns true so the caller skips initDatabase() this session (the
 * page is about to tear down). Best-effort only: any failure (offline, timeout,
 * malformed response) falls through to proceeding with the current bundle, so this
 * can never break the app's existing offline usability.
 */
export async function reloadIfStale(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(`${BASE_PATH}/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) return false;

    const { build } = await res.json();
    const remote = Number(build);
    const local = Number(BUILD_NUMBER);
    if (!Number.isFinite(remote) || remote <= local) return false;

    if (sessionStorage.getItem(RELOAD_FLAG)) {
      console.warn(`Butter: running stale build ${local} (server has ${remote}); already retried once this session, continuing.`);
      return false;
    }
    sessionStorage.setItem(RELOAD_FLAG, '1');
    window.location.replace(`${window.location.pathname}?_v=${Date.now()}`);
    return true;
  } catch {
    return false;
  }
}
