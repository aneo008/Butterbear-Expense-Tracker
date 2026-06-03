// Layered mascot art. Each layer is a full 240x260 SVG string with a transparent
// background; stacking them in the same box reproduces the original bear exactly,
// but lets us animate body / arms / head independently (joints).
//
// Z-order (back -> front): body, leftArm, rightArm, head (ears+head+face), decor.
// The back view swaps body/head/arms art and adds a tail; used for the excited
// turn-around and (Phase 4) outfit rotation.

export type Mood = 'happy' | 'content' | 'sleepy' | 'excited' | 'worried' | 'celebrating';
export type Facing = 'front' | 'back';

export type MascotLayers = {
  body: string;
  leftArm: string;
  rightArm: string;
  head: string;
  decor: string;
};

function svg(inner: string): string {
  return `<svg viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

// ---------------- shared pieces ----------------

const BODY_FRONT = `
  <ellipse cx="120" cy="184" rx="66" ry="60" fill="#EBD2A8"/>
  <ellipse cx="86" cy="233" rx="25" ry="15" fill="#EBD2A8"/>
  <ellipse cx="154" cy="233" rx="25" ry="15" fill="#EBD2A8"/>
  <ellipse cx="86" cy="235" rx="12" ry="7" fill="#F7E9CF"/>
  <ellipse cx="154" cy="235" rx="12" ry="7" fill="#F7E9CF"/>
  <ellipse cx="120" cy="194" rx="42" ry="42" fill="#F7E9CF"/>`;

const BODY_BACK = `
  <ellipse cx="120" cy="184" rx="66" ry="60" fill="#E3C49A"/>
  <ellipse cx="86" cy="233" rx="25" ry="15" fill="#E3C49A"/>
  <ellipse cx="154" cy="233" rx="25" ry="15" fill="#E3C49A"/>
  <ellipse cx="120" cy="214" rx="15" ry="13" fill="#F0DCBC"/>`;

const ARM_LEFT_DOWN = `<ellipse cx="70" cy="200" rx="16" ry="22" fill="#EBD2A8" transform="rotate(22 70 200)"/>`;
const ARM_RIGHT_DOWN = `<ellipse cx="170" cy="200" rx="16" ry="22" fill="#EBD2A8" transform="rotate(-22 170 200)"/>`;
const ARM_LEFT_UP = `<ellipse cx="58" cy="150" rx="15" ry="27" fill="#EBD2A8" transform="rotate(-32 58 150)"/>`;
const ARM_RIGHT_UP = `<ellipse cx="182" cy="150" rx="15" ry="27" fill="#EBD2A8" transform="rotate(32 182 150)"/>`;
const ARM_LEFT_BACK = `<ellipse cx="70" cy="200" rx="16" ry="22" fill="#E3C49A" transform="rotate(22 70 200)"/>`;
const ARM_RIGHT_BACK = `<ellipse cx="170" cy="200" rx="16" ry="22" fill="#E3C49A" transform="rotate(-22 170 200)"/>`;

// Ears + head dome (shared); face is appended per mood.
const HEAD_BASE_FRONT = `
  <circle cx="78" cy="58" r="26" fill="#EBD2A8"/>
  <circle cx="162" cy="58" r="26" fill="#EBD2A8"/>
  <circle cx="78" cy="61" r="14" fill="#F7E9CF"/>
  <circle cx="162" cy="61" r="14" fill="#F7E9CF"/>
  <circle cx="120" cy="94" r="66" fill="#EBD2A8"/>
  <ellipse cx="120" cy="116" rx="31" ry="24" fill="#F7E9CF"/>
  <ellipse cx="80" cy="118" rx="13" ry="8" fill="#F4A6A0" opacity="0.7"/>
  <ellipse cx="160" cy="118" rx="13" ry="8" fill="#F4A6A0" opacity="0.7"/>
  <ellipse cx="120" cy="106" rx="8.5" ry="6.5" fill="#6B4A33"/>`;

const HEAD_BACK = `
  <circle cx="78" cy="58" r="26" fill="#E3C49A"/>
  <circle cx="162" cy="58" r="26" fill="#E3C49A"/>
  <circle cx="78" cy="61" r="13" fill="#D8B488"/>
  <circle cx="162" cy="61" r="13" fill="#D8B488"/>
  <circle cx="120" cy="94" r="66" fill="#E3C49A"/>
  <path d="M120,40 Q138,80 120,150 Q102,80 120,40 Z" fill="#DBBC90" opacity="0.5"/>`;

const FACE_HAPPY = `
  <circle cx="96" cy="92" r="8" fill="#43321F"/><circle cx="144" cy="92" r="8" fill="#43321F"/>
  <circle cx="93" cy="86" r="2.6" fill="#FFFFFF"/><circle cx="141" cy="86" r="2.6" fill="#FFFFFF"/>
  <path d="M104,118 Q120,135 136,118 Q120,126 104,118 Z" fill="#7A4F37"/>
  <ellipse cx="120" cy="125" rx="7" ry="3.4" fill="#F4A6A0"/>`;

const FACE_CONTENT = `
  <path d="M86,90 Q96,99 106,90" stroke="#43321F" stroke-width="3.6" fill="none" stroke-linecap="round"/>
  <path d="M134,90 Q144,99 154,90" stroke="#43321F" stroke-width="3.6" fill="none" stroke-linecap="round"/>
  <path d="M108,119 Q120,129 132,119" stroke="#43321F" stroke-width="3" fill="none" stroke-linecap="round"/>`;

const FACE_SLEEPY = `
  <path d="M87,93 Q96,98 105,93" stroke="#43321F" stroke-width="3.2" fill="none" stroke-linecap="round"/>
  <path d="M135,93 Q144,98 153,93" stroke="#43321F" stroke-width="3.2" fill="none" stroke-linecap="round"/>
  <path d="M114,120 Q120,124 126,120" stroke="#43321F" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;

const FACE_EXCITED = `
  <circle cx="94" cy="90" r="10.5" fill="#43321F"/><circle cx="146" cy="90" r="10.5" fill="#43321F"/>
  <circle cx="90" cy="86" r="4.2" fill="#FFFFFF"/><circle cx="142" cy="86" r="4.2" fill="#FFFFFF"/>
  <circle cx="97" cy="93" r="1.8" fill="#FFFFFF"/><circle cx="149" cy="93" r="1.8" fill="#FFFFFF"/>
  <path d="M100,114 Q120,141 140,114 Q120,124 100,114 Z" fill="#7A4F37"/>
  <ellipse cx="120" cy="127" rx="8" ry="4" fill="#F4A6A0"/>`;

const FACE_WORRIED = `
  <circle cx="96" cy="95" r="6.2" fill="#43321F"/><circle cx="144" cy="95" r="6.2" fill="#43321F"/>
  <circle cx="96" cy="92" r="2" fill="#FFFFFF"/><circle cx="144" cy="92" r="2" fill="#FFFFFF"/>
  <path d="M84,84 L104,78" stroke="#5A4632" stroke-width="3" stroke-linecap="round"/>
  <path d="M156,84 L136,78" stroke="#5A4632" stroke-width="3" stroke-linecap="round"/>
  <path d="M110,123 Q116,118 120,123 Q124,128 130,123" stroke="#43321F" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;

const FACES: Record<Mood, string> = {
  happy: FACE_HAPPY,
  content: FACE_CONTENT,
  sleepy: FACE_SLEEPY,
  excited: FACE_EXCITED,
  worried: FACE_WORRIED,
  celebrating: FACE_HAPPY,
};

// Decorations live in a non-deforming top layer.
const DECOR_SLEEPY = `
  <text x="176" y="74" font-family="Comic Sans MS, cursive" font-weight="700" font-size="16" fill="#5A4632">z</text>
  <text x="192" y="56" font-family="Comic Sans MS, cursive" font-weight="700" font-size="21" fill="#5A4632">z</text>
  <text x="210" y="34" font-family="Comic Sans MS, cursive" font-weight="700" font-size="27" fill="#5A4632">z</text>`;

const DECOR_EXCITED = `
  <polygon points="40.0,63.0 37.9,67.9 33.0,70.0 37.9,72.1 40.0,77.0 42.1,72.1 47.0,70.0 42.1,67.9" fill="#F5C45E"/>
  <polygon points="205.0,68.0 202.6,73.6 197.0,76.0 202.6,78.4 205.0,84.0 207.4,78.4 213.0,76.0 207.4,73.6" fill="#A8D8C8"/>
  <polygon points="150.0,20.0 148.2,24.2 144.0,26.0 148.2,27.8 150.0,32.0 151.8,27.8 156.0,26.0 151.8,24.2" fill="#F5C45E"/>
  <polygon points="58.0,23.0 56.5,26.5 53.0,28.0 56.5,29.5 58.0,33.0 59.5,29.5 63.0,28.0 59.5,26.5" fill="#A8D8C8"/>`;

const DECOR_CELEBRATING = `
  <polygon points="46.0,57.0 43.9,61.9 39.0,64.0 43.9,66.1 46.0,71.0 48.1,66.1 53.0,64.0 48.1,61.9" fill="#F5C45E"/>
  <polygon points="198.0,63.0 195.9,67.9 191.0,70.0 195.9,72.1 198.0,77.0 200.1,72.1 205.0,70.0 200.1,67.9" fill="#A8D8C8"/>
  <circle cx="102" cy="54" r="4" fill="#E8A87C"/>
  <rect x="38" y="226" width="9" height="6" rx="2" fill="#E8736A" transform="rotate(74 38 226)"/>
  <rect x="34" y="145" width="9" height="6" rx="2" fill="#A8D8C8" transform="rotate(55 34 145)"/>
  <rect x="127" y="33" width="9" height="6" rx="2" fill="#A8D8C8" transform="rotate(54 127 33)"/>
  <circle cx="181" cy="176" r="4" fill="#E8736A"/>
  <rect x="167" y="165" width="9" height="6" rx="2" fill="#E8A87C" transform="rotate(28 167 165)"/>
  <rect x="31" y="158" width="9" height="6" rx="2" fill="#A8D8C8" transform="rotate(18 31 158)"/>
  <circle cx="46" cy="164" r="4" fill="#E8736A"/>
  <circle cx="115" cy="40" r="4" fill="#E8736A"/>`;

const DECOR: Partial<Record<Mood, string>> = {
  sleepy: DECOR_SLEEPY,
  excited: DECOR_EXCITED,
  celebrating: DECOR_CELEBRATING,
};

const ARMS_UP_MOODS: Mood[] = ['excited', 'celebrating'];

export function getLayers(mood: Mood, facing: Facing): MascotLayers {
  if (facing === 'back') {
    return {
      body: svg(BODY_BACK),
      leftArm: svg(ARM_LEFT_BACK),
      rightArm: svg(ARM_RIGHT_BACK),
      head: svg(HEAD_BACK),
      decor: svg(DECOR[mood] ?? ''),
    };
  }
  const up = ARMS_UP_MOODS.includes(mood);
  return {
    body: svg(BODY_FRONT),
    leftArm: svg(up ? ARM_LEFT_UP : ARM_LEFT_DOWN),
    rightArm: svg(up ? ARM_RIGHT_UP : ARM_RIGHT_DOWN),
    head: svg(HEAD_BASE_FRONT + FACES[mood]),
    decor: svg(DECOR[mood] ?? ''),
  };
}

// Joint pivots in viewBox (240x260) coordinates.
export const PIVOTS = {
  feet: { x: 120, y: 244 },
  neck: { x: 120, y: 152 },
  leftShoulder: { x: 74, y: 184 },
  rightShoulder: { x: 166, y: 184 },
} as const;

export const VIEWBOX = { w: 240, h: 260 };
