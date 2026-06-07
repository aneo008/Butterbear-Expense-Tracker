// Embed docs/ROADMAP.md into a bundled TS string so the in-app dev "Roadmap"
// reader can show it (Metro can't import .md at runtime). Idempotent.
// Run: node scripts/gen-roadmap.mjs  (also run in CI before the web export).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const md = readFileSync(join(root, '..', 'docs', 'ROADMAP.md'), 'utf8');

const out =
  '// AUTO-GENERATED from docs/ROADMAP.md by scripts/gen-roadmap.mjs — do not edit by hand.\n' +
  '// Regenerate after editing the roadmap: node scripts/gen-roadmap.mjs\n' +
  `export const ROADMAP_TEXT = ${JSON.stringify(md)};\n`;

writeFileSync(join(root, 'src', 'constants', 'roadmapText.ts'), out);
console.log('✓ src/constants/roadmapText.ts regenerated from docs/ROADMAP.md');
