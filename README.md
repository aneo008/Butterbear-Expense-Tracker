# 🧈🐻 Butterbear Expense Tracker

A cute, calm daily expense tracker for iOS (and soon the web), built around an
original buttery-cream bear mascot named **Butter**. The goal: make logging
money take under five seconds and feel comforting rather than stressful — Butter
is never judgmental about spending.

> The app itself is called **Butter**; this repository is the whole project
> (app + design assets + spec).

## Status

Phase 1 (the functional tracker) is complete, plus several enhancements and a
lean slice of Phase 3 (data portability):

- ✅ 4-tab layout (Home · Insights · Shop · Settings), no center button
- ✅ Fast add-expense sheet — big keypad, category chips, date + weekday, note
- ✅ Edit & delete (tap any entry), backdating with a calendar + Today/Yesterday
- ✅ Custom categories (emoji + colour), most-used-first ordering (last 30 days)
- ✅ Home: today's total, recent entries, **View all** full history (by month)
- ✅ Insights: month strip, category **donut chart**, drill into a category
- ✅ Coins & streaks tracked under the hood (gamification surfaces in Phase 4)
- ✅ Data portability (lean): CSV export, JSON backup & restore (merge/replace)
- 🔜 Web build for GitHub Pages · Phase 2 mascot + theme · Phase 4 gamification

See [`docs/SPEC.md`](docs/SPEC.md) for the full product spec and
[`docs/story-panels.md`](docs/story-panels.md) for the story-unlock script.

## Tech stack

Expo (SDK 54) · React Native 0.81 · TypeScript · expo-router (file-based) ·
expo-sqlite · Zustand · react-native-svg.

## Getting started

> **Node 20.19+ is required** (Expo SDK 54 / Metro use APIs missing in Node 18).
> Node 22 LTS is recommended.

```bash
cd butter
npm install
npx expo start
```

Then open the project in **Expo Go** (SDK 54) on your iPhone or Android phone by
scanning the QR code. Both phones must be on the same Wi-Fi; use
`npx expo start --tunnel` if they can't connect.

## Project structure

```
.
├── butter/            # the Expo app
│   ├── app/           # expo-router screens (tabs + stack routes)
│   └── src/
│       ├── db/        # SQLite schema + queries
│       ├── store/     # Zustand store
│       ├── components/# shared UI (add sheet, donut chart, …)
│       ├── lib/       # date, colour, csv, backup, file I/O helpers
│       └── constants/ # categories, palettes
├── design/            # mascot + outfit SVGs (used from Phase 2)
└── docs/              # product spec & story panels
```

## Data & privacy

Local-first: everything lives in on-device SQLite. There is no account and no
bank linking — manual entry only. You own your data via CSV export and JSON
backup/restore (Settings tab), which also covers moving to a new phone.

## License

MIT — see [LICENSE](LICENSE). The Butter character and artwork in `design/` are
original to this project.
