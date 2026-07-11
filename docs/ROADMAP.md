# Butter — Roadmap & Changelog

The single source of truth for what's been built, what's next, and the version
behind each release. Pass G of Phase 4 will add an in-app **"What's New"** popup;
the **Changelog** sections below are written to feed it (user-facing wording +
`✨ New` / `🐛 Fix` / `🔧 Change` tags).

---

## Versioning

`MAJOR.MINOR.PATCH` (SemVer) + a build number:

| Part | Meaning | Example |
|------|---------|---------|
| **MAJOR** | Product generation | `1` (→ `2` on a big rewrite) |
| **MINOR** | Phase | Phase 4 → `4` |
| **PATCH** | Each shipped user-facing update within the phase (so the What's-New popup can announce it) | Pass E → `5`, G1 popup → `6`, calculator → `7` |
| **build** | Monotonic native build counter | `6` |

> Note: PATCH started out as "one per pass" but now increments per shipped release, since several
> updates can land inside one pass (e.g. Pass G shipped `1.4.6` then `1.4.7`).

Source of truth: `butter/app.json` (`version` + `ios.buildNumber` / `android.versionCode`),
shown in **Settings → version footer** (`src/lib/version.ts`).

**Current:** `v1.5.0` — Phase 5 (Budget & Money) shipped its core: income + set-asides + **structured recurring payments** (groups · due dates · monthly/yearly cycles) on a new **Money screen**, and the **Insights budget card** (Income · Set aside · Spendable · Spent · Remaining + savings rate). Remaining in Phase 5: charts depth + ship polish. Also queued: the hardening backlog, Pass F (story). Playroom/changing-room backgrounds → the content backlog (furniture); two gestures (sheet swipe-down, Insights month swipe) deferred to the native build.

Repo: `github.com/aneo008/Butterbear-Expense-Tracker` · Live (web): `aneo008.github.io/Butterbear-Expense-Tracker`

---

## Status at a glance

| Phase | Theme | State |
|-------|-------|-------|
| 1 | MVP expense tracker | ✅ done |
| 2 | Mascot, theme & animation | ✅ done |
| 3 | Data portability (export/import) | ✅ done |
| **4** | **Gamification (Closet, coins, streaks)** | ◑ **in progress — Passes A–E + G1 + calculator done; Pass F (story) remains, G3 sfx optional** |
| — | **Hardening & trust** (from the v1.4.9 review) | ◑ **in progress** — streak + dev data-loss fixed; storage/chests/tests queued |
| **5** | **Budget, charts & ship polish** | ◑ **in progress — budget & Money screen shipped (`v1.5.0`); charts + ship polish remain** |
| 6+ | Content & economy backlog (consumables, invest/honey-jar, collections, seasonal, room decor) | ⬜ backlog — draw from, not sequenced |
| — | **Ship native (iOS/Android)** | ⬜ strategic priority (pull forward — unblocks gestures, haptics, reminders) |

---

# Changelog (shipped)

## Phase 1 — MVP expense tracker · `v1.1`
Core <5-second expense logging.
- ✨ Tap-Butter-to-add expense flow; shared add/edit sheet with keypad, category picker, date selection (Today/Yesterday/calendar), notes.
- ✨ Edit & delete entries; dynamic category order (most-used first); add custom categories (emoji + colour).
- ✨ Home: today total + recent list. **Insights:** month strip + category donut chart + legend. **History:** all expenses grouped by month. **Category drill-down** screen.
- ✨ SQLite (native) data layer; game-state scaffold (streak/coins/entries).

## Phase 2 — Mascot, theme & animation · `v1.2`
Butter comes to life.
- ✨ Butter v2 — layered/jointed SVG mascot (grounded feet, paw pads), **hybrid animation** (body via transforms, arms via drawn pose frames).
- ✨ Moods derived from activity (sleepy / happy / excited); idle flourishes (drowsy tip, hops, wave-giggle, turn-around); tiered celebrations (coin-fly, confetti, milestone jump) + speech bubbles.
- ✨ Warm "butter" theme, Baloo 2 + Nunito fonts, first-run coachmark.

## Phase 3 — Data portability · `v1.3`
Your data, yours to keep.
- ✨ Export **CSV** (this month / year / all) and full **JSON backup**.
- ✨ **Restore** from JSON — merge (add new) or replace (wipe & load).
- 🔧 Web build (react-native-web + localStorage) deployed to GitHub Pages.

## Phase 4 — Gamification · `v1.4` *(in progress)*
Dress up Butter, earn coins, build streaks.

### Pass A — Outfit engine + art · `v1.4.1`
- ✨ Outfit overlay rendering (head / face / neck / body / held) composited on Butter, front & back.
- ✨ 14-item cosmetic catalog (bows, hats, crowns, glasses, scarves, aprons, overalls, dress, doughnut…).

### Pass B — Buy/equip + Shop · `v1.4.2`
- ✨ Buy / equip / unequip data layer (coins deducted, persisted).
- ✨ **Shop** tab landing (coin balance + Wardrobe / Consumables / Invest cards); 🧥 hanger on Home → Wardrobe.

### Pass C — Changing room · `v1.4.3`
- ✨ Three-state Changing Room: play · room (panel closed) · dress-up (item panel).
- ✨ Try-before-buy (preview unowned items); Save Look persists the outfit.
- 🔧 **Revisions:** half-body baker apron (upper fur shows); held items follow the paw on a wave; tap-anywhere opens/closes the item panel (no more Wardrobe button); bigger Butter; "Turn" rotate; red "Reset"; **Save only items you own**; "Fitting Room" / "Leave" labels.

### Pass D — Play gestures · `v1.4.4`
- ✨ In the play room: **tap Butter** to react (mood-appropriate gesture), **hold to pet** (cosy rock + happy face).

### Pass E — Streak economy + popups · `v1.4.5` ✅
- ✨ **E1 — Coin multiplier economy:** streak multiplier ×1.0 → ×3.0 (at 3/7/14/30/100 days); daily coin **cap scales** with it (60 → 180); one-time **milestone chests**; new players get a **50-coin welcome grant**.
- ✨ **E2 — Shop overhaul:** re-priced 4-tier ladder (50 → 2,200); **rarity** tiles & badges — Basic (white) · Rare (blue) · Premium (purple) · Prestige (gold); item pictures on the cards; long names gently scroll (marquee).
- ✨ **Sell:** sell owned items for 50% back; **buy/sell confirmation** popup with the item picture + rarity.
- ✨ **E3 — Streak popup:** tap the 🔥 chip to see your streak, multiplier, the full tier ladder + chests, and a "streak safe" nudge.
- ✨ **E4 — Developer mode:** tap the version 7× to unlock a sandboxed dev panel (edit coins/streak/wardrobe, triggers, inspector); changes are discarded on exit. App versioning (v1.4.5).
- 🐛 **Fixes:** mascot no longer gets stuck on the celebrating face after a mood change; dev coins quick-add accumulates; Back works after a web refresh on any pushed screen; long-press to pet no longer selects text.
- ✨ **E5 — Coin popup:** tap the 🪙 chip for "Coins today" — a progress bar (today's earnings vs the daily limit, mint → gold), what each entry earns, and why the limit grows with your multiplier (`60 × ×mult`). Auto-opens (maxed state) when a log hits the cap.

### Fixes since `v1.4.5`
- 🐛 Number pad no longer selects the digit text when you tap quickly (web).
- 🐛 **Dev mode:** "Earned today" is now directly editable in the dev panel (it's a stored counter, not recomputed when you change the streak); exiting the dev sandbox via the banner now leaves the dev page, and dev edits can no longer touch real data once the sandbox is off.

### Pass G — Polish · `v1.4.6`–`v1.4.7` *(in progress)*
- ✨ **G1 — "What's New" popup:** a recap pops up after every update, showing what changed since you last opened the app (stacked per-version sections with ✨ New / 🐛 Fix / 🔧 Change tags). Handles missing several updates at once. Gated off `whatsnew_seen_version` in `app_meta`, keyed to the app version; new installs are seeded silently (the coachmark covers them).
  - In-app content lives in `src/constants/changelog.ts` (hand-authored mirror of this file — keep in sync); logic in `src/lib/changelog.ts`; UI in `src/components/WhatsNewSheet.tsx`; mounted on Home. Dev panel: "Show What's New" + "Reset What's-New seen".
  - **⚠️ ONE-TIME Phase 4 backfill — remove at end of Phase 5:** existing pre-popup users (no `whatsnew_seen_version` yet) get a recap of all of Phase 4 (floored at `1.4.0`). Marked in `WhatsNewSheet.tsx` with a `PHASE 4 BACKFILL` comment. **Cleanup at end of Phase 5:** delete the backfill branch (null flag then falls through to silent-seed), drop the "Welcome back" intro copy, and optionally prune old 1.4.x entries from `changelog.ts`.
- ✨ **App icon & Add-to-Home (web PWA):** Butter has its own app icon (the bear's face on a butter tile, built from the in-app mascot SVG) + a web manifest, so it can be added to a phone's home screen. Icons generated by `scripts/gen-icons.mjs` (sharp) from `assets/icon.svg`/`icon-foreground.svg`; web head tags injected by `scripts/inject-web-head.mjs` (since `output:single` ignores `app/+html.tsx`).
- 🔧 **Dev:** in-app **Roadmap reader** (Developer → Docs) showing `docs/ROADMAP.md`, embedded at build time via `scripts/gen-roadmap.mjs` → `src/constants/roadmapText.ts`. *(Dev-only — not in the user-facing changelog popup.)*

#### `v1.4.7`
- ✨ **Calculator keypad:** the amount keypad does `+ − × ÷ =` (and `C`) — left-to-right, so you can work out a value (e.g. split a bill) before saving. Save auto-applies a pending op.
- 🐛 **Restore fix (web):** importing a JSON backup no longer silently fails after you pick the file — the old focus-based cancel detector raced the file read and could drop the selection. Now uses the input `change`/`cancel` events (`src/lib/fileio.ts`).
- 🔧 **Restore clarity:** the import dialog now explains Merge vs Replace, and Merge has its own confirm — Merge brings in **expense logs & categories only** (coins/streak/wardrobe unchanged); **Replace** restores everything. (No logic bug: `mergeData` intentionally skips `game_state`; `replaceAllData` already carries the full progress.) Forward note: Phase 9 furniture must live in `game_state` and be added to native `replaceAllData`'s explicit UPDATE so it restores too.

#### `v1.4.8`
- 🔧 **Home transactions sheet:** the Recent list is now a 2-state "notification-shade" panel — swipe/drag up to expand into all transactions (grouped by month, with subtotals), drag the handle down to bring Butter back. Removes the "View all" button (the `/history` route is now orphaned). Built on gesture-handler pan + built-in Animated (`src/components/TransactionsSheet.tsx`); top bar + tab bar stay pinned.
- 🔧 **Insights month strip:** ordered latest-first (newest on the left).

#### `v1.4.9`
- 🔧 **Collapsible months in transactions:** the transactions list groups by month with collapsible sections — only the current month is open by default (subtotals stay visible when collapsed); tap a month header to toggle.

#### `v1.4.10` — Hardening (from the v1.4.9 project review)
- 🐛 **Streak now tells the truth:** a broken streak used to keep showing its old count and multiplier until your next log silently reset it. Now the 🔥 chip, streak popup, coin popup and Butter's mood all reflect the *real* streak (0 once a day is missed), with a kind "your N-day streak paused — begin a new one today" note. New `effectiveStreak()` in `src/lib/streak.ts` drives all displays; the reward logic was already correct.
- 🐛 **Data-loss fix (dev mode):** "Wipe all data & re-seed" inside the dev sandbox used to delete the sandbox's own restore point (`dev_backup` in `app_meta`), so Exit restored nothing and real expenses were lost. `devResetAll` now preserves the sandbox key.

- ⬜ **G2 — Backgrounds:** DEFERRED to Phase 9 (furniture shop).
- ⬜ **G3 — Transitions & sfx** (optional).

## Phase 5 — Budget & Money · `v1.5` *(in progress)*
Give the expense numbers context: how much came in, how much is already spoken for, and
what's left to actually spend.

### `v1.5.0` — Money screen: income, set-asides & recurring payments
- ✨ **Money screen** (Settings → Money, or tap the Insights budget card): monthly income
  (inline edit) + everything already spoken for, in one place.
- ✨ **Structured recurring payments:** user-created **groups** (Insurance, Subscriptions,
  Credit-card fees…) with an icon; each payment has an amount, a **billing cycle**
  (monthly / yearly) and a **due date** — "due 15th" or "due 3 Nov" — plus an optional note.
  A **Due soon** list shows the next payments across all groups. Groups can be renamed or
  deleted (payments survive, just ungrouped); new groups can be created inline while adding
  a payment.
- ✨ **One-off set-asides:** tag a big-ticket amount to a single month (new phone, a trip) so
  it never distorts other months.
- ✨ **Insights budget card** (per selected month): **Income · Set aside · Spendable**, a
  progress bar of Spent vs Spendable, **Remaining** (red when over) and a **savings-rate %**.
  Unset income shows a gentle "set your income" nudge instead.
- 🔧 **Cash-flow-true math:** `spendable = income − set-asides`; monthly recurring counts every
  month, **yearly counts only in its due month**, one-offs only in their tagged month. Yearly
  rows display a ≈/mo equivalent for context (display only). Set-asides shouldn't ALSO be
  logged as expenses (the screen says so) — that would double-count.
- 🔧 Under the hood: `allocations` gains group/cycle/due fields (additive, no migration; old
  backups load fine), new `allocation_groups` table, both in JSON backup/restore (Replace
  restores them; Merge leaves them untouched); pure math in `src/lib/allocationMath.ts`.

### `v1.5.2` — Spending trend
- ✨ **12-month trend chart on Insights:** a bar chart of your last 12 months sits above the
  donut — see the trajectory at a glance; **tap a bar** to jump the whole screen (donut,
  breakdown, budget card) to that month. Appears once there's a second month of data.
- 🔧 Built as plain pressable Views (`src/components/TrendBars.tsx`), not SVG — react-native-web
  SVG hit-testing is unreliable; new `getMonthlyTotals()` query (native + web).

### `v1.5.1` — Info-only payments
- ✨ **"Info only" payments:** a recurring payment can now be marked **Info only** (Budget
  section of the payment editor) — it keeps its group, amount and due date (still appears in
  Due soon), but no longer reduces Spendable. Use it for payments you *also* log as expenses
  (e.g. a subscription charged to a card you track), so nothing is counted twice. Rows show a
  grey `info only` badge. Default for every payment stays "Deducts".
- 🔧 Under the hood: additive `allocations.info_only` column (old data/backups unaffected);
  the skip lives in `monthCommitment()` so the Money summary and Insights card both honour it.

---

# Roadmap (upcoming)

## Phase 4 — remaining
- **Pass G — Polish** *(in progress)*: G1 What's-New popup ✅ shipped (`v1.4.6`); **calculator keypad** (`v1.4.7`) ✅; **G3 transitions/sfx** optional.
  - **Playroom / changing-room backgrounds: DEFERRED to Phase 9** (the furniture shop) — too much art effort for the ROI as standalone scenery; will be planned together with buyable decor.
  - Minor pending bug: Butter's legs render behind the changing-room podium (small paint-order fix; do whenever the closet is next touched).
  - **Deferred to the native (iOS/Android) build — left out of web:** (a) swipe **down** at the top of the expanded transactions sheet to collapse it; (b) swipe **left/right between months** in Insights. Both need a pan gesture nested inside a scroll view, which react-native-gesture-handler does not handle reliably on react-native-web (the pan never engages through the RN/RNGH ScrollView). Revisit when building for native, where RNGH nested gestures work. Until then: collapse via the sheet handle; change months via the Insights month chips.
- **Pass F — Story panels** — narrative/onboarding panels (was the original Pass E, pushed back). *Sequenced after Pass G.*

## Hardening & trust — from the v1.4.9 Fable review *(near-term; do before Pass F)*
The retention engine had cracks in trust/durability. Triage from the review:
- ✅ **Streak correctness** — displays now use `effectiveStreak` + a gentle broken-streak note (`v1.4.10`).
- ✅ **Dev data-loss** — `devResetAll` preserves the sandbox restore point (`v1.4.10`).
- ◑ **Web storage durability** — ✅ quick win done: `navigator.storage.persist()` at web init (`database.web.ts`, best-effort) + a web-specific **7-day** backup nudge with the reason spelled out (`settings.tsx`). ⬜ still: move off the single `localStorage` key to **IndexedDB** (or OPFS + SQLite-WASM) with a localStorage fallback mirror, to remove the eviction/quota cliff entirely.
- ⬜ **One-time chests are re-earnable** — `MILESTONE_CHESTS` claims aren't recorded, so cycling short streaks re-collects them. Add a `claimed_chests` field to `game_state` (+ native `replaceAllData` UPDATE list + backup).
- ⬜ **`parseBackup` validates shape, not rows** — a malformed-but-array file can wipe real data inside native `replaceAllData`'s delete+insert. Add a per-row shape check before the destructive replace.
- ⬜ **`app_meta` isn't in the backup format** — so dev-sandbox meta edits (e.g. the What's-New flag) actually leak on Exit; fix the code *or* correct the dev-panel/memory note that claims they revert.
- ⬜ **Extract the duplicated log-reward transaction** — `updateGameStateAfterLog` is copy-pasted in `queries.ts` and `queries.web.ts`; pull a pure `computeLogUpdate(prev, today)` into `src/lib/` so both layers persist one source of truth (kills the drift class of bug for chests/consumables/decor). Same for the wardrobe buy/sell/equip JSON juggling.
- ⬜ **Tests + a CI gate** — none today. The pure logic (`streak.ts`, `date.ts`, `backup.ts`, the calculator reducer, `changelog.ts` compareVersions) is ideal unit-test material; add a runner + a lint/type gate to CI.
- ⬜ **Polish nits** — `CoinFly` uses hardcoded screen coords (measure the chip instead); `insights.tsx`/`settings.tsx` bypass the theme tokens with raw hex; a11y gaps (rarity by colour only, donut has no non-visual alt, small-text contrast); delete orphaned `app/history.tsx` + dead `App.tsx`; consider generating `constants/changelog.ts` from ROADMAP in `gen-roadmap.mjs` to kill a hand-sync surface.

## Strategic priorities — from the review *(bigger bets)*
- **Ship native (TestFlight / EAS) — pull forward from Phase 5.** The whole thesis (haptic logging, gestures, a daily companion, later reminders) only exists on a phone; the web deploy has done its job as a proving ground. This also unblocks the two deferred gestures (sheet swipe-down, Insights month swipe).
- **Local daily reminder notification (native, gentle opt-in, streak-aware)** — the single biggest missing retention lever for a daily-habit app; currently nowhere on the roadmap.
- **Payment due-date reminders (native) — ⚠️ build when we go native.** Local notifications for the Money screen's recurring payments ("Term life · SGD 120 · due tomorrow"): `nextDueISO()` in `src/lib/allocationMath.ts` already computes every due date, so this is scheduling + opt-in UI only. Sequenced together with the daily logging reminder above (one notifications permission ask, two payoffs). *This is the deliberate other half of the "no reminders in-app" scope fence below — the due dates users are already entering become actionable here.*

## Phase 5 — remaining · `v1.5.x` *(scoped 2026-07-11)*
Budget & Money core shipped in `v1.5.0`; the info-only flag in `v1.5.1`. Still in this phase:
- ✅ **5e — Charts: monthly trend bars** — shipped `v1.5.2` (see changelog). *Scoped down from
  "charts depth": spendable-line overlay + category drill-down trend went to the backlog.*
- **5f — Data-safety hardening** (ships in `v1.5.3`) — `parseBackup` per-row validation (guards
  the destructive Replace) + `claimed_chests` (milestone chests once-ever). Pulled from the
  Hardening list below; the rest of that list stays queued.
- **5g — Ship polish** (`v1.5.3`, closes Phase 5) — splash screen, empty-state audit, delete
  orphaned `history.tsx`/`App.tsx`, theme-token migration in insights/settings, a11y quick wins
  (donut alt text, contrast). **⚠️ End-of-phase cleanup:** remove the What's-New **Phase 4
  backfill** (`PHASE 4 BACKFILL` comment in `WhatsNewSheet.tsx`).

**Scope fences (decided during 5b, hold the line):**
- *Not* full income tracking (no multiple income sources / income entries) — cuts against the
  <5-second logging ethos.
- *Not* per-cycle paid-tracking ("mark as paid", payment history) or bill reminders in-app —
  the registry stays static; **payment due-date reminders ship with the native build** (see
  Strategic priorities above) — that's how due dates become actionable.
- ✅ Double-count escape hatch shipped (`v1.5.1`): the per-payment **"Info only"** flag. If
  double-counting still bites, tune that — don't invent anything bigger.

## Content & economy backlog — draw from, don't sequence · `v1.6+`
Per the v1.4.9 review, phases 6–9 were four consecutive "meta-game supply" phases for a
14-item, pre-native, pre-notification app. Keep them as a **backlog to pull from once there's
a retained audience**, not a fixed sequence — ship whatever best serves the current player.

- **Consumables** — streak-freeze, double-coin day (cap-bypass / streak-protection coin sinks).
- **Invest → the "honey jar":** deposit coins into a jar on the Home shelf; interest drips **only on days you log** — a visible, on-theme second daily-return hook (replaces the abstract "Invest" card; keeps the ×3 economy meaningful as a coin faucet).
- **Collections** — set items & set effects: themed sets grant a bonus (economy and/or a cosmetic flourish). Data model → effect engine → set UI.
- **Live / seasonal content** — limited-time drops with a green **"✦ Seasonal"** tag (layered on rarity, *not* a 5th tier — premium took purple, green is free); rotating/featured shop.
- **Home & room decor (buyable props)** — extend the shop from outfits to the *rooms* (rugs, plants, windows, wall art, furniture) with owned/equipped state rendered behind Butter. **Absorbs the deferred playroom/changing-room backgrounds:** build a `variant`-driven `SceneBackground`, then make it composable from purchasable props. **Restore requirement:** decor/furniture state must live in `game_state` AND be added to native `replaceAllData`'s explicit `UPDATE` list (web auto-spreads) so it restores.

## Fresh ideas (from the review — unbuilt candidates for the backlog)
- **Streak repair by backfill** — dating a *yesterday* expense the morning after a miss heals the streak (once/week); kinder than a freeze consumable, reuses the existing date picker.
- **Category-aware mascot reactions** — Butter sips a kopi on a Drinks log, sways on Transport, hugs a box on Gifts; moves variable-reward delight *into* the logging action itself (~10 tiny SVG fragments).
- **The monthly postcard** — a drawn month wrap-up themed by top category, exportable as an image (revives the SPEC's wrap-up; the only organic sharing loop).
- **"The usual?"** — after a note repeats a few times, a one-tap chip (`kopi · $2.20 · Drinks`) makes the habitual ~60% of logs a 2-second action.
- **Butter's daily request** — once you own a few items, an occasional wish that rewards equipping a matching item, so the wardrobe stays a daily touchpoint.
- **PWA → phone handoff via QR** — the web export becomes the native-onboarding migration funnel ("your bear moves house with you").
- **Whisper-quiet self-analytics (dev-only)** — a local `days_opened` / `days_logged` ledger charted in the dev panel, to study retention before betting on the backlog.

---

*Keep this file updated as each pass ships — it's both the reference and the source for the in-app changelog popup (Phase 4 Pass G).*
