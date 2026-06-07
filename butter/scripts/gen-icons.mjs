// Rasterize the Butter icon SVGs into every PNG the app needs.
// Run: node scripts/gen-icons.mjs   (requires the `sharp` dev dependency)
//
// Source of truth: assets/icon.svg (full-bleed square) + assets/icon-foreground.svg
// (transparent head for the Android adaptive foreground). Re-run after editing those.

import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const square = readFileSync(join(root, 'assets/icon.svg'));
const foreground = readFileSync(join(root, 'assets/icon-foreground.svg'));

// [svg, outPath, size]
const targets = [
  [square, 'assets/icon.png', 1024],                    // native app icon (iOS masks corners)
  [square, 'assets/favicon.png', 256],                  // Expo turns this into favicon.ico
  [square, 'assets/splash-icon.png', 512],              // splash logo on the cream background
  [square, 'public/apple-touch-icon.png', 180],         // iOS "Add to Home Screen"
  [square, 'public/icon-192.png', 192],                 // PWA manifest (maskable, full-bleed)
  [square, 'public/icon-512.png', 512],                 // PWA manifest (maskable, full-bleed)
  [foreground, 'assets/android-icon-foreground.png', 1024], // Android adaptive foreground
];

for (const [svg, out, size] of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(root, out));
  console.log(`✓ ${out} (${size}×${size})`);
}

console.log('Done. Icons regenerated from assets/icon.svg + assets/icon-foreground.svg.');
