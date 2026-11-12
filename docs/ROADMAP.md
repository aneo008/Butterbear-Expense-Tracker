# Butter — Roadmap

What is next, in what order, and why. Everything that has already shipped lives in
[`CHANGELOG.md`](CHANGELOG.md); the original product brief is [`SPEC.md`](SPEC.md).

**Current:** `v1.7.3` (build 30), released 2026-08-30. Phases 1–3 and 5–7 are complete.
Phase 4 is complete except the story panels (Pass F).

Repo: `github.com/aneo008/Butterbear-Expense-Tracker` · Live (web): `aneo008.github.io/Butterbear-Expense-Tracker`

---

## Direction — web-first (decided 2026-11-12)

Butter stays a **web app** (an installable PWA on GitHub Pages) for the coming months. The
native iOS/Android build is **parked, not cancelled**.

Why this replaces the earlier "ship native next" priority:

- "Ship native" led this file from July 2026, but every release since (`v1.5.0`–`v1.7.3`) was a
  web release, and the native code path has never been run on a device.
- All three real data-loss incidents (`v1.5.10`, `v1.6.1`, `v1.6.4`) came from how the web build
  stores and loads its data. If web is the product, that storage is the thing to make solid,
  not to work around until native arrives.

What changes as a result:

- **The stale-bundle guard (`v1.6.4`) is permanent.** Earlier notes that scheduled
  `staleness.ts` / `staleness.web.ts`, the `version.json` step and the `_layout.tsx` call for
  deletion "the day native ships" no longer apply.
- **Moving off the single `localStorage` key** is promoted from "queued" to the main structural
  item (see Next).
- **Phone notifications stay parked.** GitHub Pages serves this app with no service worker and
  no backend, so real push would need new infrastructure. The in-app launch reminder (`v1.7.0`)
  remains the web answer for due dates.
- **The native data layer needs a decision** (see Next, item 7) — it is maintained by hand for
  every feature and has never run.

---

## Status at a glance

- ✅ **Phase 1** — MVP expense tracker
- ✅ **Phase 2** — Mascot, theme & animation
- ✅ **Phase 3** — Data portability (export / import)
- ◑ **Phase 4** — Gamification: Passes A–E and G shipped; **Pass F (story panels) not built**; G3 sound optional
- ✅ **Phase 5** — Budget & Money (`v1.5.0`–`v1.5.10`)
- ✅ **Phase 6** — Analytics & income UX (`v1.6.0`–`v1.6.5`)
- ✅ **Phase 7** — Due-date visibility, onboarding & interactive rewards (`v1.7.0`–`v1.7.3`)
- ⬜ **Phase 8 (proposed)** — Trust & durability, web-first — the **Now** and **Next** lists below
- ⏸ **Parked** — native build, phone notifications, content & economy backlog

---

## Now — trust *(proposed Phase 8, `v1.8`)*

Small items, each shippable on its own. Goal: the app never loses data silently, and a broken
build is caught before it deploys.

1. ⬜ **Warn when a save fails.** `persist()` in `src/db/queries.web.ts` catches and ignores
   `localStorage` write errors (storage full or unavailable). The app keeps running from memory,
   so everything since the last good save is lost on reload with no message. Surface it: a clear
   warning plus a prompt to export a backup.
2. ⬜ **Never overwrite unreadable data.** If the stored data fails to parse, `initWebStore()`
   replaces it with a fresh empty database and saves that — destroying whatever could have been
   recovered. Keep the unreadable text under a separate key (and offer it as a download) before
   starting fresh.
3. ⬜ **Tests + a CI gate.** There are no tests in the repo; the verification harnesses the
   changelog mentions (`v1.6.2`, `v1.6.5`) were never committed, and the deploy workflow only
   builds and deploys. The pure logic is ideal test material: `streak.ts`, `date.ts`,
   `backup.ts`, `allocationMath.ts`, `incomeMath.ts`, `yearMath.ts`, the calculator's `applyOp`,
   and `compareVersions` in `lib/changelog.ts`. Add a runner, then run the tests and
   `tsc --noEmit` in the workflow before the web export.
4. ⬜ **Fix the one type error** — `app/closet.tsx:445` (`userSelect` inside a `Pressable` style
   array). Found 2026-11-12; nothing catches it today because CI does not type-check.
5. ⬜ **Dev-sandbox meta leak.** `app_meta` isn't in the backup format, so dev-sandbox meta edits
   (e.g. the What's-New flag) leak on Exit. Fix the code *or* correct the dev-panel note that
   claims they revert.
6. ⬜ **Check the build number was bumped.** The stale-bundle guard only fires when
   `ios.buildNumber` in `app.json` goes up, and nothing enforces that on release. Add a check so
   a version change without a build bump fails CI.

## Next — durability

7. ⬜ **Decide the native data layer's fate.** `src/db/queries.ts` (917 lines) and
   `src/db/database.ts` mirror every web feature by hand under "keep in lockstep" comments, and
   have never run. They can't simply be left alone: TypeScript resolves the store's imports
   against `queries.ts`, so type-checking depends on it. The choice is **keep mirroring** or
   **remove it and make the web layer the only one**. Decide before item 8, because a storage
   rewrite is the moment to settle on one data layer.
   - If it stays: **extract the duplicated log-reward transaction.** `updateGameStateAfterLog` is
     copy-pasted in `queries.ts` and `queries.web.ts`; pull a pure `computeLogUpdate(prev, today)`
     into `src/lib/` so both layers persist one source of truth (kills the drift class of bug
     for chests / consumables / decor). Same for the wardrobe buy / sell / equip JSON juggling.
8. ⬜ **Move storage off the single `localStorage` key** to **IndexedDB** (or OPFS + SQLite-WASM)
   with a `localStorage` fallback mirror, to remove the eviction / quota cliff entirely. Already
   done as a quick win: `navigator.storage.persist()` at web init and the 7-day backup nudge in
   Settings. Worth knowing when designing this: today the whole database is re-read and
   re-written on every change (`resync()` + `persist()`), and while the dev sandbox is active it
   stores a full second copy of all data inside the same key.
9. ⬜ **Evaluate offline support and controlled updates (a service worker).** There is none
   today: updates rely on the best-effort stale-bundle guard, and an offline cold start relies
   on whatever the browser happened to cache. This is an evaluation, not a commitment — a
   service worker brings its own caching failure modes. Decide after item 8.

## Later — product

10. ⬜ **Kind over-budget tone.** The Insights budget card shows "over" in red (`#C0392B` text,
    `#E8837C` bar in `app/(tabs)/insights.tsx`); SPEC §3 says never red — use the warm peach
    `warnSoft`. Alongside it, wire the **`worried` mood**: the art exists, but `mascotMood.ts`
    never selects it (its comment still says "wired in Phase 5").
11. ⬜ **Category edit & delete.** Only "add" exists today; SPEC §5 expects add / edit / delete.
12. ⬜ **CSV import.** Settings shows "Import CSV — Coming soon". SPEC §9: parse rows into
    expenses with a preview and a duplicate check.
13. ⬜ **Currency setting.** `budget.currency` is stored, but there is no UI and "SGD" is
    hard-coded in the screens.
14. ⬜ **Pass F — Story panels.** The SPEC's main curiosity hook; the 14-panel script and unlock
    triggers are already written in [`story-panels.md`](story-panels.md), and
    `game_state.story_progress` exists unused.
15. ⬜ **Small open bugs & polish** *(carried over; not re-verified on 2026-11-12)*:
    - Butter's legs render behind the changing-room podium (small paint-order fix; do whenever
      the closet is next touched).
    - `CoinFly` uses hardcoded screen coordinates (measure the chip instead).
    - A broader small-text contrast audit (`textSoft` on white is ~3:1).
    - Consider generating `constants/changelog.ts` from `CHANGELOG.md` instead of hand-mirroring.
16. ⬜ **Analytics leftovers** (deliberately left out of Phase 5): a spendable-line overlay on
    the trend chart, a category drill-down trend, and a performance pass (nothing felt slow at
    current data sizes).

---

## Parked — not scheduled

### Native build (iOS / Android)
Parked by the 2026-11-12 direction decision. Notes kept for if it is picked up again:

- It would unblock the things that only exist on a phone: real haptics, gestures, and local
  notifications.
- **Local daily reminder notification** (gentle opt-in, streak-aware) — the biggest missing
  retention lever for a daily-habit app.
- **Payment due-date reminders** — local notifications for the Money screen's recurring payments
  ("Term life · SGD 120 · due tomorrow"). `nextDueISO()` and `duePaymentsWithin()` in
  `src/lib/allocationMath.ts` already compute the dates, so it is scheduling + opt-in UI only.
  Sequence it with the daily reminder (one permission ask, two payoffs).
- **Two gestures deferred to native:** (a) swipe **down** at the top of the expanded
  transactions sheet to collapse it; (b) swipe **left / right between months** in Insights. Both
  need a pan gesture nested inside a scroll view, which react-native-gesture-handler does not
  handle reliably on react-native-web. Until then: collapse via the sheet handle; change months
  via the Insights month chips.
- The native data layer has never been run on a device — budget for a full test pass first.
- Before any public store release, revisit the "Butterbear" name in the repo and live URL —
  SPEC §12 notes it is someone else's trademarked character. (The app itself is "Butter".)

### G3 — transitions & sound effects
Optional polish left over from Phase 4, Pass G.

### Content & economy backlog — draw from, don't sequence
Per the v1.4.9 review, these were four consecutive "meta-game supply" phases for a 14-item app.
Keep them as a **backlog to pull from once there's a retained audience**, not a fixed sequence —
ship whatever best serves the current player.

- **Consumables** — streak-freeze, double-coin day (cap-bypass / streak-protection coin sinks).
- **Invest → the "honey jar":** deposit coins into a jar on the Home shelf; interest drips
  **only on days you log** — a visible, on-theme second daily-return hook (replaces the abstract
  "Invest" card; keeps the ×3 economy meaningful as a coin faucet).
- **Collections** — set items & set effects: themed sets grant a bonus (economy and/or a
  cosmetic flourish). Data model → effect engine → set UI.
- **Live / seasonal content** — limited-time drops with a green **"✦ Seasonal"** tag (layered on
  rarity, *not* a 5th tier — premium took purple, green is free); rotating / featured shop.
- **Home & room decor (buyable props)** — extend the shop from outfits to the *rooms* (rugs,
  plants, windows, wall art, furniture) with owned / equipped state rendered behind Butter.
  **Absorbs the deferred playroom / changing-room backgrounds (old "G2"):** build a
  `variant`-driven `SceneBackground`, then make it composable from purchasable props.
  **Restore requirement:** decor / furniture state must live in `game_state`, and — if the
  native layer is kept — be added to native `replaceAllData`'s explicit `UPDATE` list (web
  auto-spreads) so it restores.

### Fresh ideas (from the v1.4.9 review — unbuilt candidates)
- **Streak repair by backfill** — dating a *yesterday* expense the morning after a miss heals
  the streak (once / week); kinder than a freeze consumable, reuses the existing date picker.
- **Category-aware mascot reactions** — Butter sips a kopi on a Drinks log, sways on Transport,
  hugs a box on Gifts; moves variable-reward delight *into* the logging action itself (~10 tiny
  SVG fragments).
- **The monthly postcard** — a drawn month wrap-up themed by top category, exportable as an
  image (revives the SPEC's wrap-up; the only organic sharing loop).
- **"The usual?"** — after a note repeats a few times, a one-tap chip (`kopi · $2.20 · Drinks`)
  makes the habitual ~60% of logs a 2-second action.
- **Butter's daily request** — once you own a few items, an occasional wish that rewards
  equipping a matching item, so the wardrobe stays a daily touchpoint.
- **PWA → phone handoff via QR** — the web export becomes the native-onboarding migration funnel
  ("your bear moves house with you"). *Depends on the parked native build.*
- **Whisper-quiet self-analytics (dev-only)** — a local `days_opened` / `days_logged` ledger
  charted in the dev panel, to study retention before betting on the backlog.

---

## Scope rules — hold the line

Decided during Phases 5–7. Don't widen any of these without a fresh decision.

- **Income stays a few set-and-forget entries.** Per-month accuracy is IN (`v1.5.4`
  effective-from salary history + bonuses; `v1.5.6` per-month override). Still OUT: per-paycheck
  logging and multi-source income streams — never a second daily-logging burden.
- **Allocations are config, not records.** The one narrow exception is `allocation_history`
  (`v1.5.9`): it stores past actuals per set-aside but is **record-only** — it does NOT feed the
  budget math, Insights, or the year dashboard. Today's config (with its effective-dated amounts,
  `v1.6.5`) always drives Spendable.
- **No per-cycle paid-tracking** ("mark as paid", payment history) and no bill ledger — the
  payment registry stays static. "Past" in the due-date calendar is time-based: the app records
  when a payment recurs, never whether it was paid.
- **Double-counting has one escape hatch:** the per-payment **"Info only"** flag (`v1.5.1`). If
  double-counting still bites, tune that — don't invent anything bigger.
- **No real phone notifications in the web build.** Due dates surface through the in-app
  calendar and launch reminder (`v1.7.0`).
- **New stored fields must be added spread-first** in `initWebStore()` / `applyParsed()`, never
  as a hand-written literal — otherwise an older cached build can erase them (`v1.5.10`). Every
  new web mutator must call `resync()` before writing (`v1.6.1`).
- **Butter is never judgmental.** No red alarms, no guilt (SPEC §12) — see item 10, where the
  app currently breaks this.

---

## Versioning

`MAJOR.MINOR.PATCH` (SemVer) + a build number:

- **MAJOR** — product generation: `1` (→ `2` on a big rewrite).
- **MINOR** — phase: Phase 7 → `7`. The next phase is 8.
- **PATCH** — each shipped user-facing update within the phase, so the What's-New popup can
  announce it.
- **build** — a counter that goes up by one on **every** release. The stale-bundle guard
  compares it, so a release without a build bump will not refresh cached copies of the app.

Source of truth: `butter/app.json` (`version` + `ios.buildNumber` / `android.versionCode`),
shown in **Settings → version footer** (`src/lib/version.ts`).

**When a release ships:**

1. Bump `version` and both build numbers in `butter/app.json`.
2. Add the entry to [`CHANGELOG.md`](CHANGELOG.md) (newest first) and its user-facing mirror in
   `butter/src/constants/changelog.ts`.
3. Update the **Current** line and tick the item in this file.
4. Run `node scripts/gen-roadmap.mjs` from `butter/` (CI also runs it) so the in-app dev
   Roadmap reader shows this file.
