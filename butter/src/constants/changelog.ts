// User-facing changelog that feeds the "What's New" popup (WhatsNewSheet).
// Hand-authored mirror of docs/ROADMAP.md's Changelog — keep the two in sync as
// each pass ships. Entries are ordered NEWEST FIRST; `version` must be SemVer
// MAJOR.MINOR.PATCH (= product.phase.pass) so releasesSince() can compare them.

export type ChangeTag = 'new' | 'fix' | 'change';

export type ChangeItem = { tag: ChangeTag; text: string };

export type Release = {
  version: string; // e.g. "1.4.5"
  pass: string;    // e.g. "Pass E"
  title: string;   // short headline for the section
  date?: string;   // optional ISO date
  items: ChangeItem[];
};

export const RELEASES: Release[] = [
  {
    version: '1.4.8',
    pass: 'Pass G',
    title: 'Home & Insights polish',
    date: '2026-06-08',
    items: [
      { tag: 'change', text: 'Home: swipe the Recent panel up to see all your transactions, swipe down to bring Butter back — the "View all" button is gone.' },
      { tag: 'change', text: 'Insights: the month strip now starts with the latest month on the left.' },
    ],
  },
  {
    version: '1.4.7',
    pass: 'Pass G',
    title: 'Calculator keypad',
    date: '2026-06-07',
    items: [
      { tag: 'new', text: 'The amount keypad is now a calculator — use +, −, ×, ÷ and = to work out a value (e.g. split a bill) before saving.' },
      { tag: 'fix', text: 'Restoring a JSON backup on the web app no longer silently fails after you pick the file.' },
      { tag: 'change', text: 'Restore now spells out that Merge brings in expense logs only — choose Replace to restore coins, streak and wardrobe too.' },
    ],
  },
  {
    version: '1.4.6',
    pass: 'Pass G',
    title: 'Update notes',
    date: '2026-06-07',
    items: [
      { tag: 'new', text: "What's New — a recap like this pops up after each update, so you never miss a change." },
      { tag: 'new', text: 'Butter now has its own app icon — add it to your phone’s home screen.' },
    ],
  },
  {
    version: '1.4.5',
    pass: 'Pass E',
    title: 'Streak economy & popups',
    items: [
      { tag: 'new', text: 'Coin multiplier — build a streak to earn ×1 → ×3 coins, with a daily limit that grows too.' },
      { tag: 'new', text: 'Milestone chests at 3/7/14/30/100-day streaks, plus a 50-coin welcome gift for new players.' },
      { tag: 'new', text: 'Shop overhaul — new price ladder, rarity tiers (Basic/Rare/Premium/Prestige) and item pictures.' },
      { tag: 'new', text: 'Sell items back for 50%, with a buy/sell confirmation that previews the item.' },
      { tag: 'new', text: 'Tap the 🔥 streak chip for your streak, multiplier and tier ladder.' },
      { tag: 'new', text: "Tap the 🪙 coin chip for today's coins vs your daily limit." },
      { tag: 'new', text: 'Developer mode (tap the version 7×) for a sandboxed testing panel.' },
      { tag: 'fix', text: 'Number pad no longer selects the digit text when you tap quickly.' },
      { tag: 'fix', text: 'Mascot no longer gets stuck mid-celebration; Back works after a web refresh.' },
    ],
  },
  {
    version: '1.4.4',
    pass: 'Pass D',
    title: 'Play with Butter',
    items: [
      { tag: 'new', text: 'In the play room: tap Butter to react, or hold to pet for a cosy rock.' },
    ],
  },
  {
    version: '1.4.3',
    pass: 'Pass C',
    title: 'Changing room',
    items: [
      { tag: 'new', text: 'Three-state changing room — play, dress up, and save your look.' },
      { tag: 'new', text: 'Try items on before you buy them.' },
    ],
  },
  {
    version: '1.4.2',
    pass: 'Pass B',
    title: 'Shop & wardrobe',
    items: [
      { tag: 'new', text: 'Buy, equip and unequip cosmetics; spend your coins.' },
      { tag: 'new', text: 'New Shop tab with your coin balance.' },
    ],
  },
  {
    version: '1.4.1',
    pass: 'Pass A',
    title: 'Dress up Butter',
    items: [
      { tag: 'new', text: 'Dress Butter up — 14 cosmetic items (bows, hats, crowns, glasses, scarves and more).' },
    ],
  },
];
