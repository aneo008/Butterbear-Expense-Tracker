# 🧈🐻 Butter — Story Panels (unlock system)

A short, wholesome comic that reveals **one panel at a time as the user keeps logging**. It's free (not bought with coins) — this is the curiosity hook that builds the daily habit. The arc mirrors the user's own journey: Butter learns that tracking little amounts adds up to something sweet.

**Arc — "Butter's Little Bakery":** Butter dreams of baking the perfect honey cake and opening a cozy bakery, but keeps running short. By tracking and saving alongside *you*, the dream slowly comes true.

**Tone rules (keep these for every panel):**
- Warm, gentle, encouraging. Butter is a comfort character — never preachy, never guilt-trippy.
- Saving is framed as *making room for the treats that matter*, not deprivation.
- Each caption ≤ ~20 words. Butter's line is short and in-character.
- Art direction reuses the mascot mood poses (`happy / content / sleepy / excited / worried / celebrating`) + simple props so panels are cheap to illustrate later.

---

## Panel script

| # | Unlock trigger | Scene / art direction | Caption (narration) | Butter says |
|---|---|---|---|---|
| 1 | First expense logged | `happy` Butter waving at a tiny, empty bakery counter | You logged your very first expense. | "Hi, I'm Butter! We're in this together now 🧈" |
| 2 | 3 entries | `content` Butter writing in a little notebook, pencil in paw | Every coin has a story. | "Let's keep track of ours, one bit at a time." |
| 3 | 3-day streak | `content` Butter watering a small sprout shaped like a honey drop | Little by little, things grow. | "Three days already! Look at us go." |
| 4 | 10 entries | `happy` Butter dropping a coin into a glass savings jar (¼ full) | Our first little savings jar is filling up. | "Clink! That sound is my favorite." |
| 5 | 7-day streak | `celebrating` Butter mid-dance, confetti | A whole week of tracking! | "You're basically a pro now 🎉" |
| 6 | 20 entries | `worried` Butter holding a honey-cake recipe, eyeing a pricey jar of golden honey | I want to bake the perfect honey cake… but good honey is pricey. | "Hmm. Worth saving up for, I think." |
| 7 | 1 full month logged | `content` Butter studying a pie chart on the wall | So *that's* where the butter went last month. | "No judgement — now we just know." |
| 8 | 35 entries | `content` Butter walking past a doughnut shop, one doughnut in paw instead of an armful | I almost bought ALL the doughnuts. | "I saved the rest for the jar. Future me says thanks." |
| 9 | 60 entries | `excited` Butter holding up the golden honey jar, savings jar now empty-but-proud | We did it — the golden honey! | "Saved up, paid in full. Tastes even sweeter." |
| 10 | 14-day streak | `content` Butter baking in a warm, cozy kitchen, oven glowing | Two weeks straight. The bakery smells amazing today. | "Mixing, measuring, tracking. All the same skill, really." |
| 11 | 90 entries | `happy` Butter sharing slices of honey cake with two little friends (a bird & a bunny) | Tracking made room for treats that matter. | "Cake's better when it's shared, don't you think?" |
| 12 | 2 full months logged | `excited` Butter hanging an "OPEN" sign on the little bakery | Our bakery is officially open! | "Couldn't have built it without you. Truly." |
| 13 | 30-day streak | `celebrating` Butter wearing a tiny ribbon/medal, beaming | Thirty days. You turned a chore into a habit. | "I'm so proud of us. Pinch me — actually, don't, I'm baking." |
| 14 | 150 entries | `content` Butter gazing out a window toward a sunrise, notebook under arm | So… what should we save for next? | "The adventure continues. Onward, partner 🧈✨" |

---

## Drop-in JSON catalog

Use this as `storyPanels.json`. The app keeps `story_progress` (index of the last unlocked panel) in `game_state`; after each log, evaluate triggers in order and unlock any newly satisfied panel (show a "new panel!" badge on the Shop tab).

```json
[
  { "id": 1,  "trigger": { "type": "first_log" },               "pose": "happy",       "caption": "You logged your very first expense.",                          "line": "Hi, I'm Butter! We're in this together now." },
  { "id": 2,  "trigger": { "type": "entries", "value": 3 },      "pose": "content",     "caption": "Every coin has a story.",                                      "line": "Let's keep track of ours, one bit at a time." },
  { "id": 3,  "trigger": { "type": "streak", "value": 3 },       "pose": "content",     "caption": "Little by little, things grow.",                               "line": "Three days already! Look at us go." },
  { "id": 4,  "trigger": { "type": "entries", "value": 10 },     "pose": "happy",       "caption": "Our first little savings jar is filling up.",                  "line": "Clink! That sound is my favorite." },
  { "id": 5,  "trigger": { "type": "streak", "value": 7 },       "pose": "celebrating", "caption": "A whole week of tracking!",                                    "line": "You're basically a pro now." },
  { "id": 6,  "trigger": { "type": "entries", "value": 20 },     "pose": "worried",     "caption": "I want to bake the perfect honey cake... but good honey is pricey.", "line": "Hmm. Worth saving up for, I think." },
  { "id": 7,  "trigger": { "type": "months", "value": 1 },       "pose": "content",     "caption": "So that's where the butter went last month.",                  "line": "No judgement -- now we just know." },
  { "id": 8,  "trigger": { "type": "entries", "value": 35 },     "pose": "content",     "caption": "I almost bought ALL the doughnuts.",                           "line": "I saved the rest for the jar. Future me says thanks." },
  { "id": 9,  "trigger": { "type": "entries", "value": 60 },     "pose": "excited",     "caption": "We did it -- the golden honey!",                               "line": "Saved up, paid in full. Tastes even sweeter." },
  { "id": 10, "trigger": { "type": "streak", "value": 14 },      "pose": "content",     "caption": "Two weeks straight. The bakery smells amazing today.",         "line": "Mixing, measuring, tracking. All the same skill, really." },
  { "id": 11, "trigger": { "type": "entries", "value": 90 },     "pose": "happy",       "caption": "Tracking made room for treats that matter.",                   "line": "Cake's better when it's shared, don't you think?" },
  { "id": 12, "trigger": { "type": "months", "value": 2 },       "pose": "excited",     "caption": "Our bakery is officially open!",                               "line": "Couldn't have built it without you. Truly." },
  { "id": 13, "trigger": { "type": "streak", "value": 30 },      "pose": "celebrating", "caption": "Thirty days. You turned a chore into a habit.",                "line": "I'm so proud of us." },
  { "id": 14, "trigger": { "type": "entries", "value": 150 },    "pose": "content",     "caption": "So... what should we save for next?",                          "line": "The adventure continues. Onward, partner." }
]
```

**Unlock check (pseudo-logic):**
```
on expense saved:
  ctx = { firstLog: total_entries >= 1, entries: total_entries, streak: streak_count, months: full_months_logged }
  for panel in storyPanels where panel.id > story_progress:
     if triggerSatisfied(panel.trigger, ctx):
        story_progress = panel.id
        queue "new panel" celebration + Shop-tab badge
        break   # one new panel per session feels special; loop if you prefer batch unlocks
```

> Want more later? The arc is open-ended on purpose (panel 14 = "to be continued"). Add a Season 2 — saving for a festival stall, a trip, a friend's birthday — using the same structure.
