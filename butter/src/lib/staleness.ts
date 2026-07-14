// Native has no stale-cached-bundle problem (app store updates replace the
// installed binary wholesale) — this is a web-only concern. See staleness.web.ts.
export async function reloadIfStale(): Promise<boolean> {
  return false;
}
