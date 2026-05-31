# 🧈🐻 "Butter" — Cute Expense Tracker (iOS) — Build Spec for Claude Code

A daily expense tracker designed to make logging money feel calm, cute, and a little addictive.
Theme: an original buttery cream-colored bear mascot named **Butter**. Soft, comforting, "heart-healing" — Butter is *never* judgmental about spending.

> **How to use this doc:** Paste the whole thing into Claude Code as your project brief, or save it as `SPEC.md` in your repo so Claude Code can read it. A ready-to-paste kickoff prompt is at the bottom (Section 11).

---

## 1. Goal & design principles

- **Lower the barrier to start tracking.** Logging an expense must take <5 seconds.
- **Make it engaging, not stressful.** The mascot reacts, rewards, and encourages — never shames. (This is the core of the "comfort character" reference apps like Kanahei's account book and the Butterbear mascot.)
- **Curiosity as the retention engine.** Consistent logging unlocks story panels, outfits, and decorations. People keep logging to "see what happens next" — not because of guilt.
- **The user owns their data.** First-class CSV + JSON export/import so the data is portable for analytics and survives a phone change. This is a hard requirement, not a nice-to-have.
- **Keep it simple.** 4 tabs maximum. No bank linking. Manual entry only.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Expo (React Native)** | You already know React/JS; Expo Go runs it on your iPhone instantly with no Mac/Xcode needed for dev. |
| Language | TypeScript | Type-safe data model, fewer bugs. |
| Local DB | **expo-sqlite** | Structured, queryable expense data (better than AsyncStorage for analytics/filtering). |
| State | Zustand (or React Context) | Lightweight, simple. |
| Navigation | expo-router (file-based) | Clean tab + stack routing. |
| Animation | react-native-reanimated + **Moti** | Spring bounces for the tappable bear & micro-interactions. |
| Rich character anim (optional) | lottie-react-native | If you want a fancier animated bear later. |
| Haptics | expo-haptics | Satisfying tap feedback on the bear and on logging. |
| Charts | react-native-gifted-charts (or victory-native) | Pie + bar charts for the insights screen. |
| File I/O | expo-file-system + expo-sharing + expo-document-picker | Export CSV/JSON, share via AirDrop/email, import backups. |
| Fonts | expo-font + Google Fonts (Baloo 2 / Quicksand / Nunito) | Rounded, friendly typography. |

> If you'd prefer **native SwiftUI** instead (better App Store path, smoother animations, requires a Mac + Xcode), this whole spec maps over — swap SQLite→SwiftData/CoreData, Reanimated→SwiftUI animations, expo file APIs→FileManager + ShareLink.

---

## 3. Design system

### Color palette (warm "butter" theme)
```
--bg-cream      #FFFBF2   app background
--bg-card       #FFFFFF   cards (with a warm soft shadow)
--butter        #F5C45E   primary / butter yellow (CTA buttons, highlights)
--butter-deep   #ECB13F   pressed states
--bear-body     #E3C49A   the bear's fur
--bear-shadow   #C9A06E   bear shading
--cheek-pink    #F4A6A0   blush / playful accents
--mint          #A8D8C8   secondary accent (savings / positive)
--text-brown    #5A4632   primary text
--text-soft     #9C8772   secondary text
--warn-soft     #E8A87C   gentle "over budget" tone (warm peach, NOT red)
```
Rule: never use harsh red for overspending. Use `--warn-soft`. Butter stays kind.

### Typography
- Display / numbers: **Baloo 2** (rounded, chunky) — great for the big amount display.
- Body / UI: **Quicksand** or **Nunito** (rounded sans).
- Generous sizes, soft letter spacing.

### Shape & motion language
- Big rounded corners (radius 20–28), pill buttons, soft drop shadows.
- Everything springs. Buttons scale to 0.96 on press. The bear bounces.
- Confetti / sparkle bursts on positive moments (logging, unlocks).
- Light haptic on tap, medium haptic on a successful log or unlock.

### The mascot — **Butter** (original character, do not copy Nong Noey/Butterbear art)
- A small, round, cream/butter-colored bear. Tiny rounded ears, big dot eyes, pink blush cheeks, often holding a doughnut or cookie (nods to the bakery vibe).
- Has **mood states** (see §7) expressed through pose + face: `happy`, `content`, `sleepy`, `excited`, `worried` (gentle), `celebrating`.
- Build it as a layered component (body, face, accessory, held item) so outfits/items can be swapped, OR use a set of Lottie/PNG/SVG states. Start with simple SVG/emoji-style poses; upgrade art later.

---

## 4. App structure (4 even tabs — no center button)

```
┌─────────────────────────────────────┐
│              [screen]                │
│         (Butter lives here)          │
├──────────────────────────────────────┤
│   🏠 Home    📊 Insights   🛍️ Shop   ⚙︎ │
└──────────────────────────────────────┘
```
There is **no floating "+" button.** Butter on the Home screen *is* the add control: **double-tap Butter to log an expense.** This makes the most frequent action feel like interacting with a companion rather than pressing a utility button.

- **🏠 Home** — interactive Butter (wearing equipped outfit) standing center stage, idle-animating. Today's total, current streak, and coin balance around it; Butter's speech bubble; recent entries below. **Double-tap Butter = add expense; single-tap or hold = play.** (See §8.)
- **📊 Insights** — month picker, pie chart by category, totals, entry list/calendar.
- **🛍️ Shop** — the reward hub, with two tabs: **Store** (spend coins to buy outfits/items/backgrounds) and **Closet** (equip what you own → Butter changes outfit). Story panels + streak calendar also live here.
- **⚙︎ Settings** — export/import/backup, categories, budget, currency.

> **Two entry points, one add sheet.** Home is the primary place to log — you double-tap Butter. For when you're elsewhere, **Insights and Shop have a small "+" in the header (top-right)** that opens the *exact same* add sheet (one shared component, one code path — no drift). Settings has none. A header icon is used rather than a floating button so it never covers charts or store items and keeps the "no big button" feel.

---

## 5. Data model (SQLite)

```sql
-- expenses
id           TEXT PRIMARY KEY      -- uuid
amount       REAL NOT NULL
category_id  TEXT NOT NULL
note         TEXT
spent_at     TEXT NOT NULL         -- ISO date (the day of the expense)
created_at   TEXT NOT NULL         -- ISO timestamp (when logged)

-- categories
id     TEXT PRIMARY KEY
name   TEXT NOT NULL
icon   TEXT NOT NULL               -- emoji or icon key
color  TEXT NOT NULL
is_custom INTEGER DEFAULT 0
sort_order INTEGER

-- game_state  (single row)
streak_count        INTEGER DEFAULT 0
last_log_date       TEXT
longest_streak      INTEGER DEFAULT 0
total_entries       INTEGER DEFAULT 0
coins               INTEGER DEFAULT 0  -- earned per logged expense, spent in the Store
coins_earned_today  INTEGER DEFAULT 0  -- to apply a daily earning cap (anti-spam)
owned_items         TEXT               -- JSON array of purchased item ids
equipped_items      TEXT               -- JSON object {slot: itemId} e.g. {"head":"party_hat","neck":"red_scarf"}
story_progress      INTEGER DEFAULT 0  -- index of last unlocked story panel

-- store_items  (catalog — can be a static JSON file in code instead of a table)
id        TEXT PRIMARY KEY
name      TEXT NOT NULL
slot      TEXT NOT NULL    -- head | face | neck | body | held | background
price     INTEGER NOT NULL -- coin cost
asset     TEXT NOT NULL    -- svg/asset key for the overlay
tier      TEXT             -- starter | mid | premium | seasonal

-- budget (optional, single row or per-category)
monthly_budget      REAL
currency            TEXT DEFAULT 'SGD'
```

Default categories (each gets a cute icon + color): 🍜 Food, ☕ Drinks, 🚇 Transport, 🛍️ Shopping, 🎮 Fun, 🏠 Home, 💊 Health, 🎁 Gifts, 📦 Other. User can add/edit/delete custom ones.

---

## 6. Core logging flow (must be FAST)

1. **Open the add sheet.** On Home: **double-tap Butter** — it must appear **instantly**, no mascot animation on double-tap, nothing that delays the keypad. From Insights/Shop: tap the header **"+"**. Both open the *same* add-sheet component.
2. Number keypad appears immediately with a large amount display in Baloo 2.
3. Pick a category from a horizontal row of cute icon chips (one tap).
4. Date defaults to **today** (tap to change). Optional one-line note.
5. Tap **Save** → medium haptic + **coins fly into your balance** + streak updates. **Celebration depends on context:** if opened from Home, dismiss back to a quick Butter cheer (happy/celebrating pose + sparkles); if opened from another screen (Butter not visible), play a lightweight in-sheet confirmation instead — coins-earned tick-up + a checkmark — so logging feels complete from anywhere.

Keep it to one screen. No multi-step wizard. Reopen-to-edit and swipe-to-delete on the entry list.

---

## 7. Gamification system (the engagement layer)

Synthesized from what makes the reference apps sticky: cute characters reduce dread, and there's always a reason to come back. Two parallel reward tracks — a **coin economy** (you earn coins by logging, spend them in a store, and dress up Butter) and a **story unlock** (curiosity-driven, milestone-based). Together they cover both short-term ("buy that hat today") and long-term ("see what happens next") motivation.

### a) Streaks
- A streak = consecutive days with ≥1 logged expense.
- Show a flame/honey-jar counter on Home. Track `longest_streak`.
- Missing a day resets to 0 **gently** — Butter says something kind ("That's okay, let's start fresh 🧈"), never punishing.
- Optional: a 1-day "streak freeze" reward earned occasionally so a single miss doesn't sting.

### b) Butter's mood (reflects behavior, kindly)
- Logged today → `happy`/`content`. Long streak → `excited`.
- Haven't logged today → `sleepy` (gently waiting), with a soft message.
- Near/over monthly budget → `worried` but **supportive** ("We went a little over on snacks — want to slow down together?"). Warm peach tone, never red, never shaming.
- Mood drives which mascot pose is shown on Home (see the mascot asset set: `happy`, `content`, `sleepy`, `excited`, `worried`, `celebrating`).

### c) Coins — the daily earning loop
Logging an expense earns coins. This is the heartbeat of the app: every entry pays out.
- **+5 coins** per expense logged.
- **+10 bonus** for the first log of the day.
- **Streak bonus:** +5 × (streak ÷ 7), so longer streaks pay more.
- **Milestone payouts:** lump-sum coins at 7-day streak, first full month, etc. (separate from story unlocks).
- **Daily earning cap** (`coins_earned_today`, e.g. 60/day) so logging ten ₵0.10 entries doesn't farm coins. Cap resets at midnight. Keep this gentle — the point is to reward real use, not police it.
- Coin balance shows on Home and in the Store. Saving a log animates coins flying into the balance.

### d) The Store (spend coins on cosmetics)
A shop screen where Butter's wardrobe and world are for sale. This replaces pure milestone unlocks — you choose what to buy.
- Grid of items, each with a preview, price, and state (buyable / owned / can't-afford-yet).
- **Slots:** `head` (hats, chef toque, party hat), `face` (glasses, sunglasses), `neck` (scarves, bows, bandana), `body` (apron, sweater, raincoat), `held` (doughnut, coffee, balloon), `background` (room/scene themes).
- **Price tiers** give near-term and stretch goals: starter ~50, mid ~150, premium ~400, seasonal/limited ~600.
- Buy → confirm → deduct coins → item added to `owned_items`. A happy purchase animation (Butter tries it on).
- Optional: a small rotating "featured" or seasonal shelf to keep it fresh.

### e) Closet / equip → Butter changes outfit
- The Closet shows everything you own, grouped by slot.
- Tap an item to **equip/unequip** it (one item per slot). `equipped_items` updates.
- **Butter on the Home screen reflects the equipped set live** — the mascot is rendered as the base body + a stack of equipped overlay layers (head, face, neck, body, held, background). See the mascot asset notes for how overlays line up.
- Mix-and-match; let the user express themselves. This is the payoff for all that logging.

### f) Story panels (milestone unlocks — the curiosity engine)
- A short, wholesome ongoing comic about Butter, revealed one panel at a time as you keep logging — free, unlocked by milestones (not bought with coins). This is the "see what happens next" hook.
- See the companion file **`butter-story-panels.md`** for the full 14-panel script, unlock triggers, and a drop-in JSON catalog.
- A subtle "new panel!" badge on the Shop tab when one unlocks; panels viewable in a little story shelf.

### g) Monthly wrap-up
- At month end, Butter presents a cute summary: total spent, top category, biggest day, how the month compared to last, and a kind takeaway. Pie chart included. Shareable as an image (optional).

### h) Celebration micro-interactions
- Confetti/sparkles + happy/celebrating Butter on: first log of the day, coins earned, purchases, streak milestones, story unlocks, hitting a savings/budget goal.

---

## 8. Interactive Home screen (Butter is the centerpiece)

Butter stands center stage in a small scene (room/background changes with equipped backgrounds), rendered as the layered SVG (base body + equipped mood/outfit overlays) and animated with code — **not a GIF** — so it always reflects the live mood and outfit. Around it: **today's total** (big), **streak counter**, **coin balance**, and a speech bubble. There is no separate Add button on Home — Butter *is* the add control.

### Gesture model (the important part)
Three gestures, kept independent so the add stays instant:

- **Double-tap → add expense.** Fires the moment the second tap lands and opens the add sheet immediately. **No animation, no delay** — it never waits on anything. Highest priority.
- **Single-tap → quick play (one-shot).** A random one-shot reaction from a pool: bounce + squish, hearts float up, a wave, a giggle, holds up a doughnut, or a cute speech-bubble line. Light haptic. Because single-tap must not be mistaken for the first half of a double-tap, it resolves *after* the double-tap window (~250–300ms) **and is cancelled if a double-tap completes** — so you never see a half-started reaction flash before the calculator opens.
- **Hold (long-press) → sustained petting (different from single-tap).** While held, Butter leans into it, shifts to a `content` pose, and hearts/sparkles keep floating until release. A continuous "aww" moment, distinct from the quick single-tap reaction.

> Implementation note: use a gesture detector where the double-tap and long-press recognizers can **fail/cancel the single-tap** (e.g. RNGH `Gesture.Exclusive(doubleTap, longPress, singleTap)` with the tap requiring the double-tap to fail). Verify on a real device that double-tap → keypad has no perceptible lag.

### Idle animation (no GIF)
When untouched, a gentle code-driven idle loop: slow breathing (subtle scale), periodic blink, and an occasional small flourish (wave, look around, or — if `sleepy` — a yawn with the Zzz). Reanimated shared values + Moti springs; a small state machine maps **mood → idle variant** (§7b) and **gesture → reaction**.

### Speech bubble
Rotates contextual lines: streak status, gentle budget note, encouragement, story nudge ("new panel unlocked!"), or a random cute remark. Always warm, never nagging.

### First-run hint (discoverability)
Because a first-timer won't know the bear is tappable:
- A one-time **coachmark** near Butter on first launch: *"Double-tap me to add an expense! 🧈"* with a **"Don't show again"** action that writes a flag to settings so it never returns.
- Plus a **faint persistent cue for the first few sessions** — a small, low-opacity "double-tap to add" label under Butter (and/or a soft pulsing ring) that fades away after the user has logged a handful of times (e.g. hide once `total_entries >= 3` or after N launches). This catches the case where the one-time tip is dismissed and forgotten.

---

## 9. Import / Export / Backup / Device transfer (hard requirement)

This is the feature the reference apps are missing — make it excellent.

### Export
- **CSV export** (for analytics in Excel/Sheets): columns `date, amount, category, note, created_at`. One tap → writes file via expo-file-system → opens iOS share sheet (expo-sharing) → AirDrop/email/save to Files/iCloud Drive.
- **JSON full backup** (for restore & device transfer): includes expenses + categories + game_state + budget/settings. This is the complete app state.
- Let the user pick date range for CSV (this month / this year / all time).

### Import
- **expo-document-picker** to select a `.csv` or `.json`.
- CSV import → parse rows into expenses (map/confirm categories), with a preview + duplicate check.
- JSON import → full restore (offer "merge" vs "replace" options).

### Device transfer (v1, no server)
1. On old phone: **Settings → Backup → Export JSON**.
2. Send the file to yourself (AirDrop / email / iCloud Drive / Files).
3. On new phone: install app → **Settings → Restore → Import JSON** → done.

Add a gentle reminder to back up monthly, and show "last backup" date in Settings.

### Cloud sync (optional v2 — flagged, not built yet)
- Later, add Firebase/Supabase (or iCloud/CloudKit if you go native SwiftUI) for automatic cross-device sync. Keep v1 fully offline and local-first; layer sync on top without changing the data model. (Matches your usual "local-first now, cloud later" approach.)

---

## 10. Build phases (build incrementally — don't do it all at once)

**Phase 1 — MVP (functional tracker)**
Project scaffold, SQLite schema, tabs/navigation, add-expense flow, entry list, basic category set, today's total. Plain styling first.

**Phase 2 — Theme & mascot**
Apply the butter design system + fonts; drop in the Butter mascot (layered SVG) on Home; wire the gesture model (double-tap → add sheet instant, single-tap → one-shot reaction, hold → sustained petting); first-run coachmark + faint persistent cue; haptics; mood states tied to "logged today / not yet."

**Phase 3 — Data portability**
CSV export, JSON backup/restore, document-picker import, Settings screen. (Get this solid early — it's a core requirement.)

**Phase 4 — Gamification**
Streaks, the coin economy (earning rules + daily cap), the Store (buy with coins), the Closet (equip → mascot overlays swap live on Home), story-panel unlock system, celebration micro-interactions, monthly wrap-up.

**Phase 5 — Polish**
Refined idle animation loop, charts on Insights, budget + gentle warnings, sound, app icon, splash screen.

> Tell Claude Code to build and let you run/verify each phase in Expo Go before moving on.

---

## 11. ✅ Kickoff prompt to paste into Claude Code

> I want to build an iOS expense-tracking app called **Butter** using **Expo (React Native) + TypeScript**. I'll run it on my iPhone via Expo Go. Use this spec (paste Sections 1–10 above, or point Claude Code at `SPEC.md`).
>
> **Start with Phase 1 only.** Scaffold a fresh Expo project with expo-router (TypeScript), set up an expo-sqlite database with the schema in Section 5, seed the default categories, and build: (a) a **4-tab layout (Home, Insights, Shop, Settings) with no center button**, (b) a fast, reusable add-expense sheet component (big number keypad, category icon row, date defaulting to today, optional note) that's opened from **two entry points** — a placeholder tappable area on Home (we'll make this the mascot in Phase 2) and a header **"+"** on Insights and Shop — both rendering the same sheet, and (c) a Home screen showing today's total and a recent-entries list with swipe-to-delete.
>
> Keep styling minimal for now — we'll apply the butter theme and the real mascot in Phase 2. Use Zustand for state. After scaffolding, give me the exact commands to run it in Expo Go on my iPhone, and confirm the data model is wired end-to-end (add an expense → it persists in SQLite → shows in the list → survives an app restart). Then stop and let me test before Phase 2.

Then proceed phase by phase, pasting the relevant section each time.

---

## 12. Notes

- **IP / character art:** "Butterbear" (Nong Noey) is a trademarked character owned by the Coffee Bean by Dao group. This spec deliberately defines an **original** bear so you can freely generate/commission art and never have a distribution problem. Keep the *aesthetic* (soft, buttery, comforting), not the specific character.
- **Tone guardrail for the whole app:** Butter is a comfort character. Every message — even about overspending — should feel warm and supportive. No red alarms, no guilt.
- **Integrity check (your habit):** after each phase, run your usual end-to-end trace — e.g., "add an expense, confirm it flows from the keypad → SQLite row → list → CSV export → JSON backup → restore, and flag any reference or schema mismatch introduced this session."
