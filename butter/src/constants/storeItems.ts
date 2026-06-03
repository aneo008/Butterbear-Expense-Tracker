// Butter's cosmetics catalog (Phase 4). Each item is a small SVG fragment
// positioned on v2 Butter's coordinates (viewBox 240x264). Items compose as
// overlay layers in getLayers — see mascotLayers.ts.
//
// Locked art principles (from Pass A iteration):
//  1. Body garments are full TORSO width (x60..180) so a raised arm reveals no
//     bare-fur gap.
//  2. Arms render IN FRONT of the body garment (paws poke out over clothes).
//  3. Garments sit on the visible torso BELOW the neck — never up under the head.

export type Slot = 'head' | 'face' | 'neck' | 'body' | 'held';
export type Tier = 'starter' | 'mid' | 'premium';

export type StoreItem = {
  id: string;
  name: string;
  slot: Slot;
  price: number;
  tier: Tier;
  front: string;       // SVG fragment (front view)
  back?: string;       // SVG fragment (back view); defaults handled in getLayers
};

// palette (mirror of mascotLayers)
const FUR = '#EBD2A8', LIGHT = '#F7E9CF', PAD = '#E8CBA0', CHEEK = '#F4A6A0';

// ---------------- HEAD ----------------

const BOW = `
  <path d="M120,28 Q98,14 92,30 Q88,42 120,40 Z" fill="#F4A6A0"/>
  <path d="M120,28 Q142,14 148,30 Q152,42 120,40 Z" fill="#F4A6A0"/>
  <path d="M120,28 Q98,18 94,29 Q104,30 120,36 Z" fill="#E88A86"/>
  <path d="M120,28 Q142,18 146,29 Q136,30 120,36 Z" fill="#E88A86"/>
  <ellipse cx="120" cy="33" rx="7" ry="8" fill="#EC8D88"/>`;

const PARTY_HAT = `
  <polygon points="120,2 138,44 102,44" fill="#A8D8C8"/>
  <polygon points="120,2 130,24 110,24" fill="#F5C45E" opacity="0.9"/>
  <polygon points="113,32 127,32 120,44" fill="#F4A6A0"/>
  <circle cx="120" cy="4" r="6" fill="#F5C45E"/>
  <ellipse cx="120" cy="45" rx="20" ry="5" fill="#9CCBBA"/>`;

const CROWN = `
  <path d="M88,42 L94,18 L108,34 L120,14 L132,34 L146,18 L152,42 Z" fill="#F5C45E"/>
  <rect x="88" y="40" width="64" height="8" rx="3" fill="#ECB13F"/>
  <circle cx="120" cy="22" r="3.5" fill="#F4A6A0"/>
  <circle cx="95" cy="24" r="3" fill="#A8D8C8"/>
  <circle cx="145" cy="24" r="3" fill="#A8D8C8"/>`;

const TIARA = `
  <path d="M90,42 Q95,20 104,34 Q112,14 120,32 Q128,14 136,34 Q145,20 150,42 Z" fill="#F3D98A" stroke="#E2B85E" stroke-width="1.5"/>
  <circle cx="120" cy="24" r="3.6" fill="#FBF3E0" stroke="#E6D6BA" stroke-width="0.6"/>
  <circle cx="104" cy="29" r="2.6" fill="#FBF3E0"/><circle cx="136" cy="29" r="2.6" fill="#FBF3E0"/>
  <rect x="90" y="40" width="60" height="6" rx="3" fill="#E2B85E"/>`;

const TOQUE = `
  <ellipse cx="120" cy="14" rx="22" ry="16" fill="#FFFFFF"/>
  <ellipse cx="96" cy="22" rx="18" ry="16" fill="#FFFFFF"/>
  <ellipse cx="144" cy="22" rx="18" ry="16" fill="#FFFFFF"/>
  <ellipse cx="120" cy="30" rx="34" ry="18" fill="#FFFFFF"/>
  <rect x="88" y="36" width="64" height="12" rx="4" fill="#FAFAF5"/>
  <rect x="88" y="44" width="64" height="6" rx="3" fill="#EFE3CC"/>`;

// ---------------- FACE (front only) ----------------

const GLASSES = `<g fill="none" stroke="#7A5C3A" stroke-width="3">
  <circle cx="96" cy="96" r="14"/>
  <circle cx="144" cy="96" r="14"/>
  <path d="M110,94 Q120,90 130,94"/>
  <path d="M82,93 L70,88"/>
  <path d="M158,93 L170,88"/>
</g>`;

const SUNGLASSES = `
  <circle cx="96" cy="96" r="15" fill="#3A3A4A"/>
  <circle cx="144" cy="96" r="15" fill="#3A3A4A"/>
  <ellipse cx="91" cy="91" rx="4" ry="3" fill="#5A5A6A"/>
  <ellipse cx="139" cy="91" rx="4" ry="3" fill="#5A5A6A"/>
  <path d="M111,94 Q120,90 129,94" stroke="#3A3A4A" stroke-width="3" fill="none"/>
  <path d="M81,93 L70,88" stroke="#3A3A4A" stroke-width="3"/>
  <path d="M159,93 L170,88" stroke="#3A3A4A" stroke-width="3"/>`;

// ---------------- NECK ----------------

const SCARF = `
  <path d="M86,150 Q120,168 154,150 Q150,162 120,166 Q90,162 86,150 Z" fill="#E8736A"/>
  <path d="M138,158 Q150,180 146,200 L132,198 Q134,176 130,160 Z" fill="#E8736A"/>
  <path d="M132,198 L146,200 L144,208 L130,206 Z" fill="#D85A51"/>`;
const SCARF_BACK = `<path d="M86,150 Q120,166 154,150 Q150,160 120,164 Q90,160 86,150 Z" fill="#D85A51"/>`;

const BOWTIE = `
  <path d="M120,156 L104,148 L104,166 Z" fill="#A8546A"/>
  <path d="M120,156 L136,148 L136,166 Z" fill="#A8546A"/>
  <rect x="116" y="151" width="8" height="10" rx="2" fill="#8A4456"/>`;

const PEARLS = Array.from({ length: 13 }).map((_, i) => {
  const t = i / 12;
  const x = (78 + t * 84).toFixed(0);
  const y = (150 + Math.sin(Math.PI * t) * 16).toFixed(0);
  return `<circle cx="${x}" cy="${y}" r="3.6" fill="#FBF3E0" stroke="#E6D6BA" stroke-width="0.7"/>`;
}).join('');

// ---------------- BODY (torso-width, sit below neck) ----------------

const APRON = `
  <path d="M62,184 Q120,198 178,184 L182,234 Q120,248 58,234 Z" fill="#FFFFFF"/>
  <path d="M58,232 q12.2,8 24.4,0 q12.2,8 24.4,0 q12.2,8 24.4,0 q12.2,8 24.4,0 q12.2,8 24.4,0" fill="#FFFFFF"/>
  <path d="M58,232 q12.2,8 24.4,0 q12.2,8 24.4,0 q12.2,8 24.4,0 q12.2,8 24.4,0 q12.2,8 24.4,0" fill="none" stroke="#EFE3CC" stroke-width="2.2"/>
  <rect x="62" y="178" width="116" height="11" rx="5" fill="${CHEEK}"/>
  <ellipse cx="120" cy="206" rx="15" ry="14" fill="#F7EFE0" stroke="#EFE3CC" stroke-width="1.4"/>`;
const APRON_BACK = `
  <rect x="62" y="178" width="116" height="11" rx="5" fill="${CHEEK}"/>
  <path d="M110,184 Q120,176 130,184 Q126,194 120,190 Q114,194 110,184 Z" fill="#EC8D88"/>`;

const OVERALLS = `
  <path d="M60,182 Q120,196 180,182 L182,244 Q120,252 58,244 Z" fill="#6E9BC4"/>
  <path d="M92,172 Q120,180 148,172 L148,196 Q120,204 92,196 Z" fill="#6E9BC4"/>
  <rect x="102" y="178" width="36" height="14" rx="3" fill="none" stroke="#5784AE" stroke-width="2"/>
  <circle cx="98" cy="176" r="3.2" fill="#E8C06A"/><circle cx="142" cy="176" r="3.2" fill="#E8C06A"/>
  <path d="M94,174 Q86,166 80,170" stroke="#6E9BC4" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M146,174 Q154,166 160,170" stroke="#6E9BC4" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M120,204 L120,244" stroke="#5784AE" stroke-width="1.6"/>
  <path d="M58,242 q62,8 124,0" stroke="#5784AE" stroke-width="2" fill="none"/>`;
const OVERALLS_BACK = `
  <path d="M60,182 Q120,196 180,182 L182,244 Q120,252 58,244 Z" fill="#5C87B0"/>
  <path d="M94,174 Q86,166 80,170" stroke="#5C87B0" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M146,174 Q154,166 160,170" stroke="#5C87B0" stroke-width="8" fill="none" stroke-linecap="round"/>
  <rect x="100" y="196" width="40" height="22" rx="3" fill="none" stroke="#4A739B" stroke-width="1.6"/>`;

const DRESS = `
  <path d="M86,172 Q120,184 154,172 L160,202 Q120,212 80,202 Z" fill="#FFFFFF"/>
  <path d="M76,198 Q120,212 164,198 L172,228 Q120,238 68,228 Z" fill="#FFFFFF"/>
  <path d="M62,224 Q120,242 178,224 L184,248 Q120,258 56,248 Z" fill="#FFFFFF"/>
  <path d="M56,246 q12.3,8 24.6,0 q12.3,8 24.6,0 q12.3,8 24.6,0 q12.3,8 24.6,0 q12.3,8 24.6,0" fill="#FFFFFF"/>
  <path d="M76,198 q44,11 88,0" stroke="#EFE3CC" stroke-width="2" fill="none"/>
  <path d="M62,224 q58,13 116,0" stroke="#EFE3CC" stroke-width="2" fill="none"/>
  <path d="M120,176 l-7,-5 0,10 z" fill="${CHEEK}"/><path d="M120,176 l7,-5 0,10 z" fill="${CHEEK}"/>
  <circle cx="120" cy="177" r="2.8" fill="#EC8D88"/>`;
const DRESS_BACK = `
  <path d="M86,172 Q120,184 154,172 L160,202 Q120,212 80,202 Z" fill="#F4EEE2"/>
  <path d="M76,198 Q120,212 164,198 L172,228 Q120,238 68,228 Z" fill="#F4EEE2"/>
  <path d="M62,224 Q120,242 178,224 L184,248 Q120,258 56,248 Z" fill="#F4EEE2"/>
  <path d="M56,246 q12.3,8 24.6,0 q12.3,8 24.6,0 q12.3,8 24.6,0 q12.3,8 24.6,0 q12.3,8 24.6,0" fill="#F4EEE2"/>
  <path d="M110,178 Q120,170 130,178 Q126,188 120,184 Q114,188 110,178 Z" fill="#E8DFCE"/>`;

// ---------------- HELD (near the right paw) ----------------

const DOUGHNUT = `<g transform="translate(174,214)">
  <circle r="15" fill="#E8A87C"/>
  <circle r="6" fill="${LIGHT}"/>
  <path d="M-12,-6 Q-6,-12 0,-10" stroke="#fff" stroke-width="2" fill="none"/>
  <circle cx="-6" cy="6" r="1.6" fill="${CHEEK}"/><circle cx="7" cy="-5" r="1.6" fill="#A8D8C8"/>
  <circle cx="9" cy="6" r="1.6" fill="#F5C45E"/><circle cx="-9" cy="-3" r="1.6" fill="#A8D8C8"/>
</g>`;

export const STORE_ITEMS: StoreItem[] = [
  { id: 'bow', name: 'Pink Bow', slot: 'head', price: 50, tier: 'starter', front: BOW, back: BOW },
  { id: 'party_hat', name: 'Party Hat', slot: 'head', price: 120, tier: 'mid', front: PARTY_HAT, back: PARTY_HAT },
  { id: 'toque', name: 'Chef Toque', slot: 'head', price: 150, tier: 'mid', front: TOQUE, back: TOQUE },
  { id: 'tiara', name: 'Tiara', slot: 'head', price: 200, tier: 'premium', front: TIARA, back: TIARA },
  { id: 'crown', name: 'Gold Crown', slot: 'head', price: 350, tier: 'premium', front: CROWN, back: CROWN },
  { id: 'glasses', name: 'Round Glasses', slot: 'face', price: 50, tier: 'starter', front: GLASSES },
  { id: 'sunglasses', name: 'Sunglasses', slot: 'face', price: 150, tier: 'mid', front: SUNGLASSES },
  { id: 'scarf', name: 'Red Scarf', slot: 'neck', price: 50, tier: 'starter', front: SCARF, back: SCARF_BACK },
  { id: 'bowtie', name: 'Bow Tie', slot: 'neck', price: 120, tier: 'mid', front: BOWTIE, back: '' },
  { id: 'pearls', name: 'Pearl Necklace', slot: 'neck', price: 250, tier: 'premium', front: PEARLS, back: '' },
  { id: 'apron', name: 'Baker Apron', slot: 'body', price: 80, tier: 'starter', front: APRON, back: APRON_BACK },
  { id: 'overalls', name: 'Denim Overalls', slot: 'body', price: 250, tier: 'premium', front: OVERALLS, back: OVERALLS_BACK },
  { id: 'dress', name: 'Frilled Dress', slot: 'body', price: 450, tier: 'premium', front: DRESS, back: DRESS_BACK },
  { id: 'doughnut', name: 'Doughnut', slot: 'held', price: 150, tier: 'mid', front: DOUGHNUT },
];

export const ITEMS_BY_ID: Record<string, StoreItem> = Object.fromEntries(
  STORE_ITEMS.map(i => [i.id, i])
);

export type EquippedMap = Partial<Record<Slot, string>>;

// Resolve the SVG fragment for a slot's equipped item, for the given facing.
export function itemFragment(equipped: EquippedMap, slot: Slot, facing: 'front' | 'back'): string {
  const id = equipped[slot];
  if (!id) return '';
  const item = ITEMS_BY_ID[id];
  if (!item) return '';
  if (facing === 'back') return item.back ?? '';
  return item.front;
}
