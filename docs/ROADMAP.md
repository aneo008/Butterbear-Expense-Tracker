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

**Current:** `v1.6.3` — a small polish fix shipped after Phase 6 closed (Money screen's salary
history list was unbounded; capped it, same pattern used for bonuses/one-offs). **Phase 6
(Analytics & income UX) is COMPLETE** (`v1.6.0`–`v1.6.2`). Phase 5 is COMPLETE (`v1.5.0`–
`v1.5.9`, Money model refined through real phone usage) **+ two data-safety fixes**
(`v1.5.10`: stale-session field-erasure; `v1.6.1`: two-open-tabs clobbering — see Hardening
below, both found via real user reports, neither part of the original Phase 5/6 scope). Phase 6
shipped: month-aware Money screen (`v1.6.0`), the two-tab data-safety fix (`v1.6.1`), and a
yearly analytics dashboard on Insights — Month ⇄ Year toggle, year budget card, income/spending
trends, category donut, Highlights, and a "Compared to last year" card (`v1.6.2`). Next: **ship
native** (strategic priority — unblocks the daily-logging reminder AND payment due-date
reminders), Pass F (story), rest of the hardening backlog.

Repo: `github.com/aneo008/Butterbear-Expense-Tracker` · Live (web): `aneo008.github.io/Butterbear-Expense-Tracker`

---

## Status at a glance

| Phase | Theme | State |
|-------|-------|-------|
| 1 | MVP expense tracker | ✅ done |
| 2 | Mascot, theme & animation | ✅ done |
| 3 | Data portability (export/import) | ✅ done |
| **4** | **Gamification (Closet, coins, streaks)** | ◑ **in progress — Passes A–E + G1 + calculator done; Pass F (story) remains, G3 sfx optional** |
| — | **Hardening & trust** (from the v1.4.9 review + since) | ◑ **in progress** — streak, dev data-loss, chests, backup validation, stale-session data loss fixed; IndexedDB / computeLogUpdate / tests queued |
| **5** | **Budget, charts & ship polish** | ✅ **done (`v1.5.0`–`v1.5.9`)** — Money screen, info-only flag, trend chart, polish & protection, per-month income + override, percentage set-asides, history pages |
| **6** | **Analytics & income UX** | ✅ **done (`v1.6.0`–`v1.6.2`)** — month-aware Money screen, two-tab data-safety fix, yearly analytics dashboard, **+ `v1.6.3` fix** (unbounded salary-history list) |
| 7+ | Content & economy backlog (consumables, invest/honey-jar, collections, seasonal, room decor) | ⬜ backlog — draw from, not sequenced |
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

### `v1.5.3` — Polish & protection *(closes Phase 5)*
- ✨ **Splash screen:** proper launch splash (mascot logo on the cream background) via the
  existing `assets/splash-icon.png` from `gen-icons.mjs` — it was generated all along, just
  never wired into `app.json`.
- 🔧 **Backup restore is guarded:** `parseBackup` now shape-checks **every row** (expenses,
  categories, set-asides, groups, game state) before the destructive Replace — corrupted files
  are rejected with a readable "entry N" message and nothing is touched.
- 🐛 **Milestone chests once-ever:** claims recorded in `game_state.claimed_chests`; cycling a
  streak can no longer re-farm chests. Celebration/coin popup only announce a chest actually paid.
- 🔧 **Cleanup:** Phase-4 What's-New backfill removed (as scheduled); orphaned `app/history.tsx`
  + dead `App.tsx`/`index.ts` deleted; `insights`/`settings` migrated to theme tokens; donut has
  a screen-reader summary; trend-bar labels bumped for contrast.

### `v1.5.10` — Data-safety: stop stale sessions from erasing new fields
- 🐛 **Root cause of a real data-loss incident (2026-07-13):** `initWebStore()` rebuilt its
  in-memory store as an explicit field list on every load. If a browser tab/PWA process is kept
  alive across many app updates without a full close+reopen (very plausible — the manifest sets
  `display: "standalone"`, and standalone PWAs on Android keep their JS process alive across
  app-switches, only fetching fresh code on a true relaunch), that stale code's `initWebStore()`
  simply doesn't know newer top-level fields (e.g. `allocations`) exist — so it never copies
  them into memory. The **next mutation of any kind** (adding an expense, tapping Butter —
  anything that calls `persist()`) then writes that incomplete object straight back over
  localStorage, silently and permanently erasing every field the stale code didn't recognize.
  Confirmed via a user's export: its shape was a byte-for-byte match for `serializeBackup()`
  from *before Phase 5a ever shipped* (missing `allocations`/`allocation_groups`/`salary_history`/
  `income_events`/`income_overrides`/`allocation_history` entirely), while `game_state`'s
  `claimed_chests` (a *later* field) survived — because `game_state` merges via a nested spread,
  proving newer code HAD run against that same storage at some point before reverting to stale.
- 🔧 **Fix:** `initWebStore()` now spreads `parsed` as the base of the reconstructed store
  *before* applying the explicit per-field defaults/normalization — so any field the running
  code doesn't recognize (past OR future) rides through untouched instead of being dropped.
  Old code still can't *use* a field it doesn't know about, but it can no longer *destroy* it.
  **This class of bug can recur for any future top-level field** unless every new field is added
  the same way (spread-first, not a hand-written literal) — keep this pattern.
- ⚠️ **This fix is forward-only** — it doesn't recover data already erased by a stale session
  before the device updates. If it happens again: ask for an earlier JSON export if one exists;
  otherwise the data likely needs re-entering. Advise users with the app "Added to Home Screen"
  to fully close (not just background) and relaunch periodically so they don't run stale code
  for extended stretches.

### `v1.5.9` — Recorded history for set-asides
- ✨ A recurring set-aside (e.g. Tithe) can now keep a **per-month recorded history** — log
  what you actually gave in a past month, browsable/deletable from the payment's edit sheet
  ("Recorded history" section, shown once the payment exists).
- 🔧 **Deliberately record-only**: `allocation_history {id, allocation_id, month, amount}` does
  **not** feed `monthCommitment`/`budgetSummary`/Insights — today's amount or percentage still
  drives Spendable for every month, past or present. This is a scoped, conscious exception to
  "allocations are config, not records" (see scope fences below) — it's a stored fact, not a
  computed input, by explicit user decision (exact historical accuracy wasn't worth the
  complexity of teaching the budget math to prefer locked-in past values over live config).
  Cascade-deletes with its parent allocation (no orphaned history with nothing to attach to).
  Merge matches by **(allocation_id, month)** — requires the allocation to already exist
  locally (matches by real ID, not label — consistent with everywhere else merge is id-based).

### `v1.5.8` — Past income & one-offs page
- 🔧 Bonuses and one-off set-asides accumulate, so the Money page now lists only **this month +
  upcoming**; past ones (month < current) move to a dedicated **`app/money-history.tsx`** pushed
  page reached via **"View past (N) ›"** links. Tap any there to edit/delete via the same sheets.
  Recurring payments stay on Money (they're config, don't pile up).

### `v1.5.7` — Percentage set-asides
- ✨ A recurring set-aside can be a **percentage of income** (tithe, giving to parents) instead
  of a fixed amount — per set-aside you pick **% of total income (incl. bonuses)** or **% of
  salary only**, and the deducted amount recomputes each month (so a bonus month tithes more,
  but salary-only deductions don't). Rows show "10% · ≈ SGD X this month".
- 🔧 Additive `allocations.percent` + `percent_incl_bonus`; `monthCommitment`/`budgetSummary`
  now take the month's income split; pure `allocationAmountForMonth` resolves a row's cost.

### `v1.5.6` — Per-month income override
- ✨ **Key in any single month's income** ("This month only") without touching later months —
  the missing primitive over v1.5.4's effective-from salary (which always carried forward). The
  income editor is now a proper sheet: amount + which-month + scope (**This month only** →
  override · **From this month on** → salary change · **Always** → base). Overrides show in the
  income card's history list, deletable.
- 🔧 New `income_overrides` table (additive; upsert one per month; in backup/restore, merges by
  month). Income precedence: **override > salary(from) > base**, + bonuses. Pure math
  `baseIncomeForMonth`/`incomeForMonth` in `src/lib/incomeMath.ts`.

### `v1.5.4` — Per-month income (salary history + bonuses)
- ✨ **Income is per-month now.** Salary changes are **effective-from** ("6000 from Aug '26"):
  past months keep the salary that was true then, so historical Spendable and savings rates
  stay honest. The Money card shows this month's income with its salary+bonus breakdown and a
  small salary-history list; the Insights budget card follows the selected month.
- ✨ **Bonuses & extra income:** month-tagged entries (bonus, 13th month, freelance) counted
  only in their month.
- 🔧 **Merge now includes income history** — bonuses merge by id, salary changes by
  effective-month (one salary per from_month, so two sources can't contradict) — the intended
  path for importing past income from another app (convert its export into a Butter backup
  JSON, then Merge). Coins/streak/wardrobe/set-asides still untouched by Merge.
- 🔧 Under the hood: new `salary_history` + `income_events` tables (additive; old backups load
  fine, BACKUP_VERSION still 1); `budget.monthly_budget` lives on as the "since forever" base
  salary that history rows override; pure math in `src/lib/incomeMath.ts` (`incomeForMonth`).

### `v1.5.5` — Fix: editors on phone-sized screens
- 🐛 The payment/income/group editor sheets were unusable on real phones: content overflowed
  below the card (no clipping) and couldn't scroll, so bottom fields and buttons were
  unreachable. Cause: the ScrollView sat inside an unbounded `KeyboardAvoidingView` wrapper,
  so the card's `maxHeight` never constrained it. Fix: WhatsNewSheet pattern — pinned title,
  ScrollView as a direct flex child (`flexShrink`), **Save/Delete/Cancel pinned below the
  scroll area** (always reachable), `overflow: hidden` on the card, KAV moved to the overlay
  level (iOS-only behavior). *Lesson: verify sheets at a phone-sized viewport, not just desktop.*

### `v1.5.1` — Info-only payments
- ✨ **"Info only" payments:** a recurring payment can now be marked **Info only** (Budget
  section of the payment editor) — it keeps its group, amount and due date (still appears in
  Due soon), but no longer reduces Spendable. Use it for payments you *also* log as expenses
  (e.g. a subscription charged to a card you track), so nothing is counted twice. Rows show a
  grey `info only` badge. Default for every payment stays "Deducts".
- 🔧 Under the hood: additive `allocations.info_only` column (old data/backups unaffected);
  the skip lives in `monthCommitment()` so the Money summary and Insights card both honour it.

## Phase 6 — Analytics & income UX · `v1.6` *(✅ COMPLETE)*
Two things surfaced from real daily phone usage: the Money screen couldn't show a past month
(tapping March's Insights budget card silently opened today's Money instead), and there was no
way to see spending/income patterns across a whole year. Analytics is read-side — it needs zero
schema change and serves the "go-to finance app" goal without reopening the Money data model.

**Scope fence:** `allocation_history` (the `v1.5.9` record-only ledger) stays OUT of all
analytics computation, per the standing fence — year set-aside totals are computed live via
`monthCommitment`, same as everywhere else.

### `v1.6.3` — Fix: unbounded salary-history list *(shipped after Phase 6 closed)*
- 🐛 A user who imported a real 24-entry `salary_history` (spanning two years of raises) found
  the Money screen's Income card rendering **every single row inline**, unbounded — the card
  stretched to 24+ lines, each with a delete icon, pushing the rest of the page far below the
  fold. `salaryHistory.map(...)` had no cap, unlike the sibling "Bonuses & extra income" and
  "One-off set-asides" sections on the same screen, which already solved this exact problem
  (`v1.5.8`) with a "View past (N) ›" link to `app/money-history.tsx`.
- 🔧 **Fix:** the Income card now shows only the salary entry actually **in effect right now**
  (derived the same way the card's own "Base SGD X" figure is — the most recent entry whose
  `from_month` has arrived, not just the last array index, so a future-scheduled raise can't be
  mistaken for "current"), plus a "View past (N) ›" link for everything else. `money-history.tsx`
  gained a third section, "Past salary changes," styled consistently with its existing two
  sections; salary rows there are delete-only (no edit sheet exists for `salary_history` rows —
  only add/delete, unchanged from before). Verified live with the user's real 24-row shape,
  the 0/1-row edge case (link correctly absent), and a future-dated row (correctly excluded
  from "active" without vanishing).

### `v1.6.2` — Yearly analytics dashboard
- ✨ **Month ⇄ Year toggle on Insights.** Year mode reuses the same visual language as month
  mode: a **year budget card** (Income · Set aside · Spendable / Spent / Remaining / savings
  rate, with a "Jan–Jul 2026 so far" footnote for the current year), **income-by-month** and
  **spending-by-month** trend charts (tap a bar to jump straight to that month in Month mode),
  a **category donut** for the whole year with each legend row showing an avg SGD/mo line
  (legend rows are display-only in year mode — the category drill-down screen stays a
  month-mode feature), a **Highlights card** (biggest/lightest month, top category, single
  biggest expense, bonuses, one-offs, recurring/yearly/one-off set-aside split), and a
  **"Compared to last year" card** (which categories moved up/down as a % of spend,
  overspent-months count, committed-vs-free trend from the year's first to latest month, bonus
  dependency %) — hidden when the prior year has no actual recorded data.
- 🔧 **Elapsed-months rule:** the current year's totals only aggregate January through the
  current month — no projecting unset future income/set-asides. Past years always use all 12.
  Trend *charts* still show the full Jan–Dec axis (future months simply read 0), matching the
  existing 12-month spending trend's visual language.
- 🔧 New pure lib `src/lib/yearMath.ts` (`yearSummary`, no RN imports, unit-tested via a
  headless harness covering the elapsed-months rule, income precedence, percentage set-asides
  reacting to a bonus month, the commitment split summing to `setAside`, and an empty year
  producing zeros without a divide-by-zero). New queries `getYearBreakdown(year)` and
  `getTopExpense(start, end)` (native + web, mirroring the existing month-query patterns).
- 🔧 Year chips (newest first) span from the earliest **recorded** year — expenses, salary
  changes, overrides, bonuses, or one-offs — through the current year. The "Compared to last
  year" card deliberately gates on that same recorded-year list rather than "does prior-year
  income exist" alone, since a base salary set with "Always" scope applies retroactively
  forever and would otherwise make every prior year look like it has data.

### `v1.6.1` — Data-safety: stop two open tabs from clobbering each other
- 🐛 **Root cause of a real data-loss report (2026-07-13):** a July income entry (and,
  separately and earlier, a set of recurring payments) went missing after being added — not
  because of stale cached code (the `v1.5.10` bug), but because **two instances of the app were
  open at once** (a home-screen PWA + a separate browser tab, or multiple tabs), each holding
  its own in-memory copy of the data from whenever it last loaded. Every mutation blindly wrote
  its *entire* in-memory copy back over `localStorage` — so if instance A added an entry, then
  instance B (never reloaded, still holding an older snapshot) saved *anything* afterward, even
  something unrelated, B's stale copy silently overwrote A's newer one, erasing the addition.
- 🔧 **Fix:** every data-changing function in the web data layer now re-reads the latest saved
  state from `localStorage` immediately before applying its change (`resync()` in
  `queries.web.ts`), so a change always builds on the freshest known state instead of a
  possibly-stale in-memory copy. Verified with two real browser tabs: tab A adds a bonus, tab B
  (loaded before A's write, never reloaded) then adds an unrelated one-off — both survive.
- ⚠️ **Practical takeaway:** avoid keeping the app open in two places at once when possible
  (e.g. close the browser tab once the home-screen app is set up) — this fix closes the silent
  data-loss risk, but the underlying "last save wins" model still means truly simultaneous edits
  in two places can overwrite each other's *other* fields (e.g. two coin-earning taps at the
  exact same instant). Additive lists (expenses, income, recurring payments) are now safe;
  scalar counters (coins, streak) are not specifically hardened here.

### `v1.6.0` — Month-aware Money screen
- 🐛 **Fixed:** tapping an old month's card on Insights (budget card, or the "set your income"
  empty state) now opens **that month** on Money, not always today's. `insights.tsx` passes
  `?month=` on both navigation calls; `money.tsx` reads it via `useLocalSearchParams`.
- ✨ **Viewing a past month:** a **"Viewing ⟨Month⟩"** banner appears with a **"Back to this
  month ›"** link. The income card shows that month's figure and base+bonus breakdown; bonuses
  and one-offs are scoped to exactly that month (no "View past" links — you're already looking
  at the past); **Due soon is hidden** (due dates are forward-looking from today, meaningless
  when looking backward). Recurring payments (config, not per-month records) always show.
- 🔧 Adding a bonus or one-off while viewing a past month now **presets that month** in the
  add sheet instead of defaulting to today (`presetMonth` added to `IncomeEventSheet` and
  `AllocationEditSheet`, mirroring the existing `presetKind`/`presetGroupId` pattern). Viewing
  the current month is unchanged from pre-`v1.6.0` behavior.

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
- ✅ **One-time chests are re-earnable** — fixed in `v1.5.3`: `claimed_chests` ledger on `game_state`, chests once-ever.
- ✅ **`parseBackup` validates shape, not rows** — fixed in `v1.5.3`: per-row shape checks before the destructive replace.
- ✅ **Stale-session data loss** — fixed in `v1.5.10`: `initWebStore()` now spread-preserves unknown top-level fields instead of silently dropping them (see the `v1.5.10` changelog entry for the full incident writeup). New class of issue found via a real user report, not from the original review list.
- ✅ **Two-open-tabs data loss** — fixed in `v1.6.1`: every web mutator now re-syncs from `localStorage` immediately before writing (`resync()`), so a second stale tab/PWA instance can no longer overwrite a fresher one's addition (see the `v1.6.1` changelog entry). A distinct class from `v1.5.10` — same symptom (things vanish after being added), different mechanism (two *current* copies racing, not old code dropping unknown fields).
- ⬜ **`app_meta` isn't in the backup format** — so dev-sandbox meta edits (e.g. the What's-New flag) actually leak on Exit; fix the code *or* correct the dev-panel/memory note that claims they revert.
- ⬜ **Extract the duplicated log-reward transaction** — `updateGameStateAfterLog` is copy-pasted in `queries.ts` and `queries.web.ts`; pull a pure `computeLogUpdate(prev, today)` into `src/lib/` so both layers persist one source of truth (kills the drift class of bug for chests/consumables/decor). Same for the wardrobe buy/sell/equip JSON juggling.
- ⬜ **Tests + a CI gate** — none today. The pure logic (`streak.ts`, `date.ts`, `backup.ts`, the calculator reducer, `changelog.ts` compareVersions) is ideal unit-test material; add a runner + a lint/type gate to CI.
- ◑ **Polish nits** — done in `v1.5.3`: theme-token migration (insights/settings), donut non-visual alt, trend-label contrast, orphaned `history.tsx`/`App.tsx`/`index.ts` deleted; rarity was already labelled with text (not colour-only). Still open: `CoinFly` hardcoded screen coords (measure the chip); consider generating `constants/changelog.ts` from ROADMAP in `gen-roadmap.mjs`; a broader small-text contrast audit (textSoft on white is ~3:1).

## Strategic priorities — from the review *(bigger bets)*
- **Ship native (TestFlight / EAS) — pull forward from Phase 5.** The whole thesis (haptic logging, gestures, a daily companion, later reminders) only exists on a phone; the web deploy has done its job as a proving ground. This also unblocks the two deferred gestures (sheet swipe-down, Insights month swipe).
- **Local daily reminder notification (native, gentle opt-in, streak-aware)** — the single biggest missing retention lever for a daily-habit app; currently nowhere on the roadmap.
- **Payment due-date reminders (native) — ⚠️ build when we go native.** Local notifications for the Money screen's recurring payments ("Term life · SGD 120 · due tomorrow"): `nextDueISO()` in `src/lib/allocationMath.ts` already computes every due date, so this is scheduling + opt-in UI only. Sequenced together with the daily logging reminder above (one notifications permission ask, two payoffs). *This is the deliberate other half of the "no reminders in-app" scope fence below — the due dates users are already entering become actionable here.*

## Phase 5 — ✅ COMPLETE (`v1.5.0`–`v1.5.9`)
Budget & Money core (`v1.5.0`) → info-only flag (`v1.5.1`) → 12-month trend chart (`v1.5.2`) →
data-safety + ship polish + Phase-4 backfill removal (`v1.5.3`) → per-month income addendum
(`v1.5.4`) → mobile-sheet fix (`v1.5.5`) → income override (`v1.5.6`) → percentage set-asides
(`v1.5.7`) → past-income history page (`v1.5.8`) → set-aside recorded history (`v1.5.9`) — the
last four all user-requested from real phone usage, locking the money data model before native.
Deliberately left on the backlog: spendable-line overlay on the trend, category drill-down
trend, store-ready perf pass (nothing felt slow at current data sizes).

**Scope fences (decided during 5b, revised through v1.5.9, hold the line):**
- ✅ Per-month income accuracy is IN (`v1.5.4` effective-from salary history + bonuses;
  `v1.5.6` per-month override for a single exact month). Still OUT: per-paycheck logging and
  multi-source income streams — income stays a few set-and-forget entries, never a second
  daily-logging burden.
- ✅ Percentage-of-income set-asides shipped (`v1.5.7`) — tithe/giving-to-parents as a live %,
  not just a fixed amount.
- ✅ **Recorded history for set-asides shipped (`v1.5.9`) — but deliberately record-only.**
  `allocation_history` stores past actuals per allocation; it does NOT feed the budget math —
  today's config always drives Spendable, past or present. This is a conscious, narrow
  exception carved into "allocations are config, not records" for bookkeeping only. **Do not
  widen it** (e.g. don't make history feed Insights retroactively) without a fresh decision —
  that was explicitly ruled out as not worth the complexity for closed-book past months.
- *Not* per-cycle paid-tracking ("mark as paid", payment history) or bill reminders in-app —
  the registry stays static; **payment due-date reminders ship with the native build** (see
  Strategic priorities above) — that's how due dates become actionable.
- ✅ Double-count escape hatch shipped (`v1.5.1`): the per-payment **"Info only"** flag. If
  double-counting still bites, tune that — don't invent anything bigger.

## Content & economy backlog — draw from, don't sequence · `v1.7+`
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
