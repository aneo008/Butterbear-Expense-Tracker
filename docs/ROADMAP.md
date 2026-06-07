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

**Current:** `v1.4.7` — Phase 4, **Pass G1 (What's-New popup) + calculator keypad + web-restore fix complete**. Playroom/changing-room backgrounds are deferred to Phase 9 (furniture shop); G3 (transitions/sfx) optional.

Repo: `github.com/aneo008/Butterbear-Expense-Tracker` · Live (web): `aneo008.github.io/Butterbear-Expense-Tracker`

---

## Status at a glance

| Phase | Theme | State |
|-------|-------|-------|
| 1 | MVP expense tracker | ✅ done |
| 2 | Mascot, theme & animation | ✅ done |
| 3 | Data portability (export/import) | ✅ done |
| **4** | **Gamification (Closet, coins, streaks)** | ◑ **in progress — Passes A–E + G1 + calculator done; Pass F (story) remains, G3 sfx optional** |
| 5 | Budget, charts & ship polish | ⬜ planned |
| 6 | Consumables & Invest | ⬜ planned |
| 7 | Collections (sets & set effects) | ⬜ planned |
| 8 | Live content (seasonal) | ⬜ planned |
| 9 | Home & room decor (buyable props) | ⬜ planned (absorbs the deferred playroom/changing-room backgrounds) |

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

- ⬜ **G2 — Backgrounds:** DEFERRED to Phase 9 (furniture shop).
- ⬜ **G3 — Transitions & sfx** (optional).

---

# Roadmap (upcoming)

## Phase 4 — remaining
- **Pass G — Polish** *(in progress)*: G1 What's-New popup ✅ shipped (`v1.4.6`); **calculator keypad** (`v1.4.7`) ✅; **G3 transitions/sfx** optional.
  - **Playroom / changing-room backgrounds: DEFERRED to Phase 9** (the furniture shop) — too much art effort for the ROI as standalone scenery; will be planned together with buyable decor.
  - Minor pending bug: Butter's legs render behind the changing-room podium (small paint-order fix; do whenever the closet is next touched).
- **Pass F — Story panels** — narrative/onboarding panels (was the original Pass E, pushed back). *Sequenced after Pass G.*

## Phase 5 — Budget, charts & ship polish · `v1.5`
- Deeper insights/charts, app icon + splash, empty-state & perf polish, store-ready pass.

### Budget & income (salary + set-asides)
Give the expense numbers context: how much came in, how much is already spoken for, and
what's left to actually spend. Reuses the dormant `budget` table (created/seeded/backed-up
since Phase 1 but never surfaced).

- **Income** — a single monthly income/salary figure (reuse `budget.monthly_income`; add a
  `setIncome()` query for native + web). Set in **Settings**.
- **Set-asides** — a small new `allocations` table: `{ id, label, amount, note, kind, month }`.
  - `kind = 'recurring'` → applies every month (e.g. tithe, giving to parents).
  - `kind = 'oneoff'` → tagged to a single `YYYY-MM` (e.g. a big-ticket purchase you want to
    carve out and *not* track as day-to-day expenditure).
  - Each has a free-text **note**; full CRUD, and editable any time.
  - Included in JSON backup/restore + snapshot (mirror the existing budget plumbing).
- **Analysis (Insights, per selected month):** a top card showing **Income · Set aside
  (Σ recurring + that month's one-offs) · Spendable · Spent · Remaining**, a progress bar, and
  a **savings-rate %**.
  - `spendable = income − recurringTotal − oneoffsForMonth`
  - `remaining = spendable − spentThisMonth`
  - One-offs only subtract in their tagged month, so a big-ticket item never distorts other
    months and never appears in tracked-expenditure totals.
- **Scope note:** deliberately *not* full income tracking (no recurring-income entries / multiple
  sources) — that would cut against the app's <5-second logging ethos. ~6 files: schema + the two
  query files + backup + Settings + Insights.

## Phase 6 — Consumables & Invest · `v1.6`
- **6a Consumables** — streak-freeze, double-coin day (cap-bypass / streak-protection coin sinks).
- **6b Invest** — put coins to work (coins-as-faucet endgame; keeps the ×3 economy meaningful).

## Phase 7 — Collections · `v1.7`
- **Set items & set effects** — group items into themed sets; full sets grant a bonus (economy boost and/or a cosmetic mascot flourish). 7a data model → 7b effect engine → 7c set UI.

## Phase 8 — Live content · `v1.8`
- **Seasonal items** — limited-time drops with a **green "✦ Seasonal"** tag (a tag layered on top of rarity, *not* a 5th rarity tier — premium took purple, so green is free for seasonal); rotating/featured shop; first seasonal set.

## Phase 9 — Home & room decor (buyable props) · `v1.9`
- **Buyable scene decor** — extend the wardrobe/shop economy from Butter's outfits to the *rooms*: players buy props & backgrounds for the **Home screen** (and the play-room / changing-room scenes) — e.g. rugs, plants, windows, wall art, mirrors, furniture. A new shop category with its own owned/equipped state, rendered behind Butter.
- **Includes the deferred backgrounds:** the playroom & changing-room scenery (originally Pass G2) was deferred here because standalone static scenery was low ROI. This phase builds the scene system (a `variant`-driven `SceneBackground`) **and** makes it **composable from purchasable props** (a "decor slot" model paralleling the outfit-slot system), plus Home-screen decoration.
- **Restore requirement:** decor/furniture state must live in `game_state` AND be added to native `replaceAllData`'s explicit `UPDATE` column list (web auto-spreads `game_state`) so it carries over on backup restore.
- Sequencing TBD relative to Collections (7) / Live content (8); decor sets could also feed Phase 7 set-effects and Phase 8 seasonal drops.

---

*Keep this file updated as each pass ships — it's both the reference and the source for the in-app changelog popup (Phase 4 Pass G).*
