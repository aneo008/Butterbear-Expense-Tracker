// Inject home-screen / PWA <head> tags into the exported web build, and write a
// small version.json the running app fetches (cache-busted) on startup to detect
// a stale cached bundle before it can touch localStorage — see src/lib/staleness.web.ts.
// Expo's `output: single` ignores app/+html.tsx, so we post-process dist/index.html
// after `expo export -p web`. Idempotent. Run before copying index.html → 404.html.
//
// Run: node scripts/inject-web-head.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const BASE = '/Butterbear-Expense-Tracker';
const file = 'dist/index.html';

if (!existsSync(file)) {
  console.error(`${file} not found — run "expo export -p web" first.`);
  process.exit(1);
}

const appConfig = JSON.parse(readFileSync('app.json', 'utf8')).expo;
const buildNumber =
  appConfig.ios?.buildNumber ??
  (appConfig.android?.versionCode != null ? String(appConfig.android.versionCode) : '0');
writeFileSync('dist/version.json', JSON.stringify({ build: buildNumber }));
console.log('Wrote dist/version.json — build', buildNumber);

const head = `
    <link rel="apple-touch-icon" href="${BASE}/apple-touch-icon.png" />
    <link rel="manifest" href="${BASE}/manifest.webmanifest" />
    <meta name="theme-color" content="#F5C45E" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Butter" />
  `;

let html = readFileSync(file, 'utf8');
if (html.includes('manifest.webmanifest')) {
  console.log('Head tags already present; skipping.');
} else {
  html = html.replace('</head>', head + '</head>');
  writeFileSync(file, html);
  console.log('Injected home-screen head tags into', file);
}
