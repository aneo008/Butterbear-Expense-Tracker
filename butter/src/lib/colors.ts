// Color utilities for the Insights donut. Categories keep their own colors, but
// when two slices in the same month share a color (or sit too close), we nudge
// the later one to a distinct shade so the ring never looks merged.

type HSL = { h: number; s: number; l: number };

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function hexToHsl(hex: string): HSL {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn: h = ((gn - bn) / d) % 6; break;
      case gn: h = (bn - rn) / d + 2; break;
      default: h = (rn - gn) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToHex({ h, s, l }: HSL): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/** Perceptual-ish distance in RGB space (0 = identical). */
function distance(a: string, b: string): number {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return Math.sqrt((ca.r - cb.r) ** 2 + (ca.g - cb.g) ** 2 + (ca.b - cb.b) ** 2);
}

const MIN_DISTANCE = 55;

function isDistinct(color: string, used: string[]): boolean {
  return used.every(u => distance(color, u) >= MIN_DISTANCE);
}

// Variant offsets tried in order when a color collides: shift lightness then hue.
const VARIANTS: Array<Partial<HSL>> = [
  { l: 0.12 }, { l: -0.12 }, { h: 28 }, { h: -28 },
  { l: 0.2, h: 22 }, { l: -0.2, h: -22 }, { h: 55 }, { h: -55 },
];

function applyVariant(base: HSL, v: Partial<HSL>): HSL {
  let h = (base.h + (v.h ?? 0)) % 360;
  if (h < 0) h += 360;
  const l = Math.max(0.25, Math.min(0.75, base.l + (v.l ?? 0)));
  return { h, s: base.s, l };
}

/**
 * Given the categories' own colors (in slice order), return a list of the same
 * length where every color is visually distinct from the others.
 */
export function dedupeColors(colors: string[]): string[] {
  const used: string[] = [];
  return colors.map(color => {
    if (isDistinct(color, used)) {
      used.push(color);
      return color;
    }
    const base = hexToHsl(color);
    for (const v of VARIANTS) {
      const candidate = hslToHex(applyVariant(base, v));
      if (isDistinct(candidate, used)) {
        used.push(candidate);
        return candidate;
      }
    }
    // Crowded family — accept the closest variant we generated.
    const fallback = hslToHex(applyVariant(base, { l: 0.24 }));
    used.push(fallback);
    return fallback;
  });
}
