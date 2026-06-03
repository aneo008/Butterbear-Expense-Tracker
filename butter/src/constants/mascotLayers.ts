// Butter v2 — layered mascot art, traced from the design references
// (butter-v2-reference / butter-wave-frames / butter-jump-frames).
//
// HYBRID animation model:
//  - Body/head/feet move via cheap transforms (breathing, lean, hop, spin).
//  - FEET are a separate layer that stays PLANTED (never tilts on a lean) — the
//    body bends above them, instead of the whole thing pivoting like a board.
//  - ARMS use drawn POSE FRAMES (rest / waveHalf / waveUp / up) swapped over
//    time, so a wave never "detaches" — each pose is drawn connected.
//
// Each layer is a full 240x260 SVG with a transparent background.
// Z-order (back -> front): leftArm, rightArm, body, feet, head, decor.

export type Mood = 'happy' | 'content' | 'sleepy' | 'excited' | 'worried' | 'celebrating';
export type Facing = 'front' | 'back';
export type ArmPose = 'rest' | 'waveHalf' | 'waveUp' | 'up';
export type BodyPose = 'stand' | 'air';

export type MascotLayers = {
  leftArm: string;
  rightArm: string;
  body: string;
  feet: string;
  head: string;
  decor: string;
};

// palette
const FUR = '#EBD2A8';
const LIGHT = '#F7E9CF';
const DARK = '#E3C49A';
const PAD = '#E8CBA0';
const CHEEK = '#F4A6A0';
const EYE = '#43321F';
const NOSE = '#6B4A33';

function svg(inner: string): string {
  return `<svg viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

// ---------------- BODY (torso + belly; arms & feet are separate) ----------------

const BODY_FRONT = `
  <ellipse cx="120" cy="196" rx="60" ry="56" fill="${FUR}"/>
  <ellipse cx="120" cy="201" rx="39" ry="41" fill="${LIGHT}"/>`;

const BODY_BACK = `
  <ellipse cx="120" cy="196" rx="60" ry="56" fill="${DARK}"/>
  <ellipse cx="120" cy="220" rx="15" ry="14" fill="${FUR}"/>`;

// ---------------- FEET (planted layer; 'air' pose for mid-jump) ----------------

const FEET_FRONT = `
  <ellipse cx="96" cy="250" rx="24" ry="15" fill="${FUR}"/>
  <ellipse cx="144" cy="250" rx="24" ry="15" fill="${FUR}"/>
  <ellipse cx="96" cy="253" rx="11" ry="6.5" fill="${LIGHT}"/>
  <ellipse cx="144" cy="253" rx="11" ry="6.5" fill="${LIGHT}"/>`;

// Airborne: feet pulled together under the centre, dangling down (rounded).
const FEET_AIR = `
  <ellipse cx="108" cy="248" rx="13" ry="19" fill="${FUR}"/>
  <ellipse cx="132" cy="248" rx="13" ry="19" fill="${FUR}"/>
  <ellipse cx="108" cy="256" rx="7" ry="6" fill="${LIGHT}"/>
  <ellipse cx="132" cy="256" rx="7" ry="6" fill="${LIGHT}"/>`;

const FEET_BACK = `
  <ellipse cx="96" cy="250" rx="24" ry="15" fill="${DARK}"/>
  <ellipse cx="144" cy="250" rx="24" ry="15" fill="${DARK}"/>`;

const FEET_AIR_BACK = `
  <ellipse cx="108" cy="248" rx="13" ry="19" fill="${DARK}"/>
  <ellipse cx="132" cy="248" rx="13" ry="19" fill="${DARK}"/>`;

// ---------------- ARMS (pose frames) ----------------
// Right arm = viewer-right (the waving arm). Left arm = viewer-left.

// Open paw with little pads (shown when the arm is raised). Includes a fur
// "shoulder blend" wedge toward the body so the lifted arm stays connected.
function raisedPaw(cx: number, cy: number): string {
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="11" ry="10.5" fill="${FUR}"/>
    <ellipse cx="${cx}" cy="${cy + 2}" rx="6" ry="5" fill="${PAD}"/>
    <circle cx="${cx - 5}" cy="${cy - 5}" r="2.2" fill="${PAD}"/>
    <circle cx="${cx}" cy="${cy - 7}" r="2.2" fill="${PAD}"/>
    <circle cx="${cx + 5}" cy="${cy - 5}" r="2.2" fill="${PAD}"/>`;
}

// Style A: arms are soft rounded nubs whose roots tuck BEHIND the body, so the
// body's edge becomes the shoulder line (no pop-out notch). Body spans x≈60–180.
// Pad markings drawn ON TOP of the paw end of a one-piece raised arm.
function padMarks(cx: number, cy: number): string {
  return `
    <ellipse cx="${cx}" cy="${cy + 1}" rx="5.5" ry="4.5" fill="${PAD}"/>
    <circle cx="${cx - 5}" cy="${cy - 5}" r="2.1" fill="${PAD}"/>
    <circle cx="${cx}" cy="${cy - 7}" r="2.1" fill="${PAD}"/>
    <circle cx="${cx + 5}" cy="${cy - 5}" r="2.1" fill="${PAD}"/>`;
}

// Style A: arm roots tuck BEHIND the body so the body edge is the shoulder line.
// Raised poses are ONE continuous tapered limb (shoulder -> rounded paw), no gap.
const R_ARM: Record<ArmPose, string> = {
  rest: `<ellipse cx="170" cy="196" rx="14" ry="24" fill="${FUR}"/>
         <ellipse cx="174" cy="214" rx="8" ry="6" fill="${LIGHT}"/>`,
  // arm angled outward at ~45°, paw at the end
  waveHalf: `<path d="M152,182 Q160,170 176,162 Q190,156 196,166 Q200,176 192,184 Q178,192 166,196 Q156,198 152,192 Z" fill="${FUR}"/>
             ${padMarks(192, 164)}`,
  // arm raised high beside the head, paw up top
  waveUp: `<path d="M154,186 Q158,168 168,150 Q176,136 188,140 Q198,146 194,158 Q188,176 180,190 Q172,200 162,198 Q154,196 154,186 Z" fill="${FUR}"/>
           ${padMarks(186, 144)}`,
  // celebratory arm straight up
  up: `<path d="M156,188 Q160,166 170,146 Q178,132 190,136 Q200,142 196,156 Q190,176 182,192 Q174,200 164,198 Q156,196 156,188 Z" fill="${FUR}"/>
       ${padMarks(188, 140)}`,
};

const L_ARM: Record<'rest' | 'up', string> = {
  rest: `<ellipse cx="70" cy="196" rx="14" ry="24" fill="${FUR}"/>
         <ellipse cx="66" cy="214" rx="8" ry="6" fill="${LIGHT}"/>`,
  // mirror of R up
  up: `<path d="M84,188 Q80,166 70,146 Q62,132 50,136 Q40,142 44,156 Q50,176 58,192 Q66,200 76,198 Q84,196 84,188 Z" fill="${FUR}"/>
       ${padMarks(52, 140)}`,
};

const R_ARM_BACK = `<ellipse cx="170" cy="196" rx="14" ry="24" fill="${DARK}"/>`;
const L_ARM_BACK = `<ellipse cx="70" cy="196" rx="14" ry="24" fill="${DARK}"/>`;

export function getArm(side: 'left' | 'right', pose: ArmPose, facing: Facing): string {
  if (facing === 'back') return svg(side === 'left' ? L_ARM_BACK : R_ARM_BACK);
  if (side === 'left') return svg(L_ARM[pose === 'up' ? 'up' : 'rest']);
  return svg(R_ARM[pose]);
}

// ---------------- HEAD (ears + dome + muzzle); face appended ----------------

const HEAD_BASE_FRONT = `
  <circle cx="72" cy="50" r="27" fill="${FUR}"/>
  <circle cx="168" cy="50" r="27" fill="${FUR}"/>
  <ellipse cx="72" cy="54" rx="13" ry="13" fill="${LIGHT}"/>
  <ellipse cx="168" cy="54" rx="13" ry="13" fill="${LIGHT}"/>
  <ellipse cx="120" cy="92" rx="72" ry="68" fill="${FUR}"/>
  <ellipse cx="120" cy="118" rx="30" ry="23" fill="${LIGHT}"/>`;

const HEAD_BACK = `
  <circle cx="72" cy="50" r="27" fill="${DARK}"/>
  <circle cx="168" cy="50" r="27" fill="${DARK}"/>
  <ellipse cx="72" cy="54" rx="11" ry="11" fill="#D8B488"/>
  <ellipse cx="168" cy="54" rx="11" ry="11" fill="#D8B488"/>
  <ellipse cx="120" cy="92" rx="72" ry="68" fill="${DARK}"/>`;

const NOSE_MOUTH = `
  <ellipse cx="120" cy="108" rx="6" ry="4.6" fill="${NOSE}"/>
  <path d="M120,112 L120,117" stroke="${EYE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M120,117 Q112,124 106,117" stroke="${EYE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M120,117 Q128,124 134,117" stroke="${EYE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;

const CHEEKS = `
  <ellipse cx="80" cy="120" rx="13" ry="8.5" fill="${CHEEK}" opacity="0.75"/>
  <ellipse cx="160" cy="120" rx="13" ry="8.5" fill="${CHEEK}" opacity="0.75"/>`;

const FACE_HAPPY = `${CHEEKS}
  <circle cx="96" cy="96" r="8" fill="${EYE}"/><circle cx="144" cy="96" r="8" fill="${EYE}"/>
  <circle cx="93" cy="91" r="2.6" fill="#FFFFFF"/><circle cx="141" cy="91" r="2.6" fill="#FFFFFF"/>
  ${NOSE_MOUTH}`;

const FACE_CONTENT = `${CHEEKS}
  <path d="M88,96 Q96,89 104,96" stroke="${EYE}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
  <path d="M136,96 Q144,89 152,96" stroke="${EYE}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
  ${NOSE_MOUTH}`;

const FACE_SLEEPY = `${CHEEKS}
  <path d="M88,97 Q96,102 104,97" stroke="${EYE}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M136,97 Q144,102 152,97" stroke="${EYE}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="120" cy="108" rx="6" ry="4.6" fill="${NOSE}"/>
  <path d="M114,118 Q120,122 126,118" stroke="${EYE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;

const FACE_EXCITED = `${CHEEKS}
  <circle cx="96" cy="95" r="10.5" fill="${EYE}"/><circle cx="144" cy="95" r="10.5" fill="${EYE}"/>
  <circle cx="92" cy="90" r="4" fill="#FFFFFF"/><circle cx="140" cy="90" r="4" fill="#FFFFFF"/>
  <circle cx="99" cy="98" r="1.8" fill="#FFFFFF"/><circle cx="147" cy="98" r="1.8" fill="#FFFFFF"/>
  <ellipse cx="120" cy="109" rx="6" ry="4.6" fill="${NOSE}"/>
  <path d="M106,116 Q120,130 134,116 Q120,122 106,116 Z" fill="#7A4F37"/>`;

const FACE_WORRIED = `
  <ellipse cx="80" cy="122" rx="12" ry="8" fill="${CHEEK}" opacity="0.6"/>
  <ellipse cx="160" cy="122" rx="12" ry="8" fill="${CHEEK}" opacity="0.6"/>
  <circle cx="96" cy="98" r="6.4" fill="${EYE}"/><circle cx="144" cy="98" r="6.4" fill="${EYE}"/>
  <circle cx="96" cy="95" r="2" fill="#FFFFFF"/><circle cx="144" cy="95" r="2" fill="#FFFFFF"/>
  <path d="M84,88 L104,82" stroke="#5A4632" stroke-width="3" stroke-linecap="round"/>
  <path d="M156,88 L136,82" stroke="#5A4632" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="120" cy="110" rx="6" ry="4.6" fill="${NOSE}"/>
  <path d="M110,122 Q116,117 120,122 Q124,127 130,122" stroke="${EYE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;

const FACES: Record<Mood, string> = {
  happy: FACE_HAPPY,
  content: FACE_CONTENT,
  sleepy: FACE_SLEEPY,
  excited: FACE_EXCITED,
  worried: FACE_WORRIED,
  celebrating: FACE_HAPPY,
};

// ---------------- decorations (non-deforming top layer) ----------------

const DECOR_SLEEPY = `
  <text x="180" y="70" font-family="Comic Sans MS, cursive" font-weight="700" font-size="16" fill="#5A4632">z</text>
  <text x="196" y="52" font-family="Comic Sans MS, cursive" font-weight="700" font-size="21" fill="#5A4632">z</text>
  <text x="214" y="30" font-family="Comic Sans MS, cursive" font-weight="700" font-size="27" fill="#5A4632">z</text>`;

const DECOR_EXCITED = `
  <polygon points="34,60 31.9,64.9 27,67 31.9,69.1 34,74 36.1,69.1 41,67 36.1,64.9" fill="#F5C45E"/>
  <polygon points="210,66 207.6,71.6 202,74 207.6,76.4 210,82 212.4,76.4 218,74 212.4,71.6" fill="#A8D8C8"/>
  <polygon points="150,18 148.2,22.2 144,24 148.2,25.8 150,30 151.8,25.8 156,24 151.8,22.2" fill="#F5C45E"/>
  <polygon points="56,20 54.5,23.5 51,25 54.5,26.5 56,30 57.5,26.5 61,25 57.5,23.5" fill="#A8D8C8"/>`;

const DECOR_CELEBRATING = `
  <polygon points="40,54 37.9,58.9 33,61 37.9,63.1 40,68 42.1,63.1 47,61 42.1,58.9" fill="#F5C45E"/>
  <polygon points="204,60 201.9,64.9 197,67 201.9,69.1 204,74 206.1,69.1 211,67 206.1,64.9" fill="#A8D8C8"/>
  <circle cx="100" cy="48" r="4" fill="#E8A87C"/>
  <rect x="34" y="150" width="9" height="6" rx="2" fill="#E8736A" transform="rotate(55 34 150)"/>
  <rect x="127" y="28" width="9" height="6" rx="2" fill="#A8D8C8" transform="rotate(54 127 28)"/>
  <circle cx="188" cy="172" r="4" fill="#E8736A"/>
  <rect x="200" y="150" width="9" height="6" rx="2" fill="#E8A87C" transform="rotate(28 200 150)"/>
  <rect x="28" y="120" width="9" height="6" rx="2" fill="#A8D8C8" transform="rotate(18 28 120)"/>
  <circle cx="44" cy="100" r="4" fill="#E8736A"/>
  <circle cx="196" cy="104" r="4" fill="#E8736A"/>`;

const DECOR: Partial<Record<Mood, string>> = {
  sleepy: DECOR_SLEEPY,
  excited: DECOR_EXCITED,
  celebrating: DECOR_CELEBRATING,
};

// Default arm pose for a mood (gestures may override temporarily).
export function defaultArmPose(mood: Mood): ArmPose {
  return mood === 'excited' || mood === 'celebrating' ? 'up' : 'rest';
}

export function getLayers(mood: Mood, facing: Facing, armPose: ArmPose, bodyPose: BodyPose = 'stand'): MascotLayers {
  const air = bodyPose === 'air';
  if (facing === 'back') {
    return {
      leftArm: getArm('left', armPose, 'back'),
      rightArm: getArm('right', armPose, 'back'),
      body: svg(BODY_BACK),
      feet: svg(air ? FEET_AIR_BACK : FEET_BACK),
      head: svg(HEAD_BACK),
      decor: svg(DECOR[mood] ?? ''),
    };
  }
  return {
    leftArm: getArm('left', armPose, 'front'),
    rightArm: getArm('right', armPose, 'front'),
    body: svg(BODY_FRONT),
    feet: svg(air ? FEET_AIR : FEET_FRONT),
    head: svg(HEAD_BASE_FRONT + FACES[mood]),
    decor: svg(DECOR[mood] ?? ''),
  };
}

// Joint pivots in viewBox (240x260) coordinates.
export const PIVOTS = {
  feet: { x: 120, y: 250 },
  hip: { x: 120, y: 212 },
  neck: { x: 120, y: 150 },
} as const;

export const VIEWBOX = { w: 240, h: 260 };
