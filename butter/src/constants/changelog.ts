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
    version: '1.5.8',
    pass: 'Phase 5',
    title: 'Tidier Money page',
    date: '2026-07-12',
    items: [
      { tag: 'change', text: 'The Money page now shows only this month and upcoming bonuses & one-offs. Past ones move to a “Past income & one-offs” page (tap “View past ›”), so the page stays tidy as they add up — and you can still edit or delete them there.' },
    ],
  },
  {
    version: '1.5.7',
    pass: 'Phase 5',
    title: 'Percentage set-asides',
    date: '2026-07-12',
    items: [
      { tag: 'new', text: 'Set aside a percentage of your income — perfect for tithe or giving to parents. Choose whether it’s a % of your total income (bonuses included) or your salary only; the amount recalculates each month.' },
    ],
  },
  {
    version: '1.5.6',
    pass: 'Phase 5',
    title: 'Key in any month',
    date: '2026-07-12',
    items: [
      { tag: 'new', text: 'Set the income for any single month exactly — tap income, pick the month, choose “This month only”. Other months are untouched (your salary/default still fills them). Great for an irregular month.' },
    ],
  },
  {
    version: '1.5.5',
    pass: 'Phase 5',
    title: 'Phone-sized fix',
    date: '2026-07-12',
    items: [
      { tag: 'fix', text: 'The payment and income editors now scroll properly on phone-sized screens — no more cut-off fields, and Save/Delete/Cancel always stay in reach at the bottom.' },
    ],
  },
  {
    version: '1.5.4',
    pass: 'Phase 5',
    title: 'Every month, your true income',
    date: '2026-07-12',
    items: [
      { tag: 'new', text: 'Income is now tracked per month. Change your salary from any month (“6000 from Aug”) — past months keep their old salary, so history stays honest.' },
      { tag: 'new', text: 'Bonuses & extra income — tag a bonus, 13th month or freelance payment to its month; that month’s budget and savings rate include it, other months don’t.' },
      { tag: 'change', text: 'Merge (restore) now also brings in income history — bonuses and salary changes you don’t already have — so past income from another app can be imported safely.' },
    ],
  },
  {
    version: '1.5.3',
    pass: 'Phase 5',
    title: 'Polish & protection',
    date: '2026-07-11',
    items: [
      { tag: 'new', text: 'Butter now has a proper splash screen while the app loads.' },
      { tag: 'change', text: 'Restoring a backup is safer — corrupted files are rejected with a clear message before anything is touched.' },
      { tag: 'fix', text: 'Milestone streak chests are now once-ever — rebuilding a streak no longer re-pays chests you already opened.' },
    ],
  },
  {
    version: '1.5.2',
    pass: 'Phase 5',
    title: 'Spending trend',
    date: '2026-07-11',
    items: [
      { tag: 'new', text: 'Insights now shows your last 12 months as a bar chart — see your trajectory at a glance, and tap any bar to jump straight to that month.' },
    ],
  },
  {
    version: '1.5.1',
    pass: 'Phase 5',
    title: 'Info-only payments',
    date: '2026-07-11',
    items: [
      { tag: 'new', text: 'Mark a recurring payment as “Info only” — it keeps its due date and stays in Due soon, but doesn’t reduce Spendable. For payments you also log as expenses, so nothing is counted twice.' },
    ],
  },
  {
    version: '1.5.0',
    pass: 'Phase 5',
    title: 'Money — income & recurring payments',
    date: '2026-07-11',
    items: [
      { tag: 'new', text: 'New Money screen (Settings → Money) — set your monthly income and everything that’s already spoken for.' },
      { tag: 'new', text: 'Recurring payments in groups you create (Insurance, Subscriptions…) with the amount and due date — monthly (“due 15th”) or yearly (“due 3 Nov”), plus a Due-soon list.' },
      { tag: 'new', text: 'One-off set-asides — carve a big-ticket month (new phone, a trip) out of your spending so it doesn’t distort your months.' },
      { tag: 'new', text: 'Insights now opens with your month’s budget: Income · Set aside · Spendable, how much you’ve spent, what’s left, and your savings rate.' },
      { tag: 'change', text: 'Yearly payments only count against the month they’re due — other months stay honest.' },
    ],
  },
  {
    version: '1.4.10',
    pass: 'Pass G',
    title: 'Truthful streaks',
    date: '2026-07-06',
    items: [
      { tag: 'fix', text: 'Your streak now tells the truth — if a day gets missed it reads 0 straight away (with a kind “let’s start fresh” note), instead of showing the old number until your next log quietly resets it.' },
    ],
  },
  {
    version: '1.4.9',
    pass: 'Pass G',
    title: 'Tidier transactions',
    date: '2026-06-12',
    items: [
      { tag: 'change', text: 'Transactions group by month and months collapse — only the current month is open by default, so it’s easier to scan. Tap a month header to open or close it.' },
    ],
  },
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
