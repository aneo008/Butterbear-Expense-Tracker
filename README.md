# 🧈🐻 Butterbear Expense Tracker

A cute, calm daily expense tracker built around an original buttery-cream bear mascot named
**Butter**. The goal: make logging money take under five seconds and feel comforting rather
than stressful — Butter is never judgmental about spending.

> The app itself is called **Butter**; this repository is the whole project
> (app + design assets + docs).

**Live:** <https://aneo008.github.io/Butterbear-Expense-Tracker> — a web app you can add to your
phone's home screen.

## Status

**`v1.7.3`** (released 2026-08-30). Butter is **web-first**: the web build is the product, and
the native iOS/Android build is parked and has never been run on a device. See
[`docs/ROADMAP.md`](docs/ROADMAP.md) for what's next and
[`docs/CHANGELOG.md`](docs/CHANGELOG.md) for everything shipped.

What it does today:

- **Fast logging** — tap Butter to open the add sheet: calculator keypad, category chips, date
  (Today / Yesterday / calendar), optional note. Edit or delete any entry; add custom categories.
- **Home** — today's total, Butter (in whatever outfit is equipped), and a pull-up sheet of all
  transactions grouped by month.
- **Insights** — month and year views: category donut, 12-month spending trend, a budget card
  (income · set aside · spendable · remaining), yearly highlights and year-on-year comparison.
- **Money** — per-month income (salary history, bonuses, single-month overrides), recurring
  payments in groups with due dates, one-off and percentage set-asides, a due-date calendar and
  a launch reminder for payments due within 3 days.
- **Gamification** — coins and a streak multiplier, claimable milestone gifts, a 14-item shop
  and a changing room to dress Butter up.
- **Your data** — CSV export, full JSON backup, and restore (merge or replace).
- **Onboarding** — a guided tour for new users and a "What's New" popup after each update.

Not built yet: the story panels described in [`docs/story-panels.md`](docs/story-panels.md).

## Tech stack

Expo (SDK 54) · React Native 0.81 · react-native-web · TypeScript · expo-router (file-based) ·
Zustand · react-native-svg. The web build stores data in the browser's `localStorage`; an
`expo-sqlite` data layer exists for native but is untested.

## Getting started

> **Node 20.19+ is required** (Expo SDK 54 / Metro use APIs missing in Node 18).
> Node 22 LTS is recommended.

```bash
cd butter
npm install
npx expo start --web
```

To produce the static build that gets deployed:

```bash
cd butter
node scripts/gen-roadmap.mjs      # embeds docs/ROADMAP.md for the in-app dev reader
npx expo export -p web            # writes butter/dist
node scripts/inject-web-head.mjs  # home-screen tags + version.json
```

Pushing to `main` runs these steps and deploys to GitHub Pages
(`.github/workflows/deploy.yml`).

## Project structure

```
.
├── butter/            # the Expo app
│   ├── app/           # expo-router screens (tabs + stack routes)
│   ├── scripts/       # build helpers (icons, roadmap embed, web head tags)
│   └── src/
│       ├── db/        # data layer: queries.web.ts (web, localStorage) + queries.ts (native, SQLite)
│       ├── store/     # Zustand store
│       ├── components/# shared UI (sheets, charts, mascot)
│       ├── lib/       # pure logic: dates, streak, income & set-aside maths, backup, CSV
│       └── constants/ # categories, shop items, theme, in-app changelog
├── design/            # mascot + outfit artwork
└── docs/              # ROADMAP, CHANGELOG, product spec, story panels
```

## Data & privacy

Local-first: there is no account, no server and no bank linking — manual entry only. On the web
build everything lives in this browser's storage on this device, and a browser can clear that
storage, so **export a JSON backup regularly** (Settings → Back up & export). The same backup
file is how you move to another browser or phone.

## License

MIT — see [LICENSE](LICENSE). The Butter character and artwork in `design/` are
original to this project.
