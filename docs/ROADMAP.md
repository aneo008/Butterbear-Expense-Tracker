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
| **PATCH** | Pass within the phase | Pass E (5th) → `5` |
| **build** | Part of a pass | E4 → build `4` |

Source of truth: `butter/app.json` (`version` + `ios.buildNumber` / `android.versionCode`),
shown in **Settings → version footer** (`src/lib/version.ts`).

**Current:** `v1.4.5` — Phase 4, **Pass E complete**; next is Pass G (What's-New popup, then backgrounds).

Repo: `github.com/aneo008/Butterbear-Expense-Tracker` · Live (web): `aneo008.github.io/Butterbear-Expense-Tracker`

---

## Status at a glance

| Phase | Theme | State |
|-------|-------|-------|
| 1 | MVP expense tracker | ✅ done |
| 2 | Mascot, theme & animation | ✅ done |
| 3 | Data portability (export/import) | ✅ done |
| **4** | **Gamification (Closet, coins, streaks)** | ◑ **in progress — Passes A–E done; G next** |
| 5 | Budget, charts & ship polish | ⬜ planned |
| 6 | Consumables & Invest | ⬜ planned |
| 7 | Collections (sets & set effects) | ⬜ planned |
| 8 | Live content (seasonal) | ⬜ planned |

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

---

# Roadmap (upcoming)

## Phase 4 — remaining
- **Pass G — Polish** *(next — priority: the **"What's New" update popup** driven by this changelog, wanted ASAP)*: also playroom & changing-room **backgrounds**, transitions, sfx.
- **Pass F — Story panels** — narrative/onboarding panels (was the original Pass E, pushed back). *Sequenced after G's What's-New popup ships.*

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

---

*Keep this file updated as each pass ships — it's both the reference and the source for the in-app changelog popup (Phase 4 Pass G).*
