import { slugifyTitle } from "./normalize";

/**
 * Prompt words for the random picker — not a song catalog. Each one is searched
 * on Deezer at request time.
 *
 * Every word here must return at least eight *different* artists with that exact
 * title, or `/t/<slug>` 404s and the picker hands out a dead title. Verify before
 * adding: `pnpm verify:seeds <Word> <Word>` (see scripts/verify-seeds.ts).
 *
 * Sorted alphabetically so duplicates are easy to spot; order has no effect on
 * selection.
 */
export const TITLE_SEEDS = [
  "Alone",
  "Angel",
  "Baby",
  "Bad",
  "Blue",
  "Bones",
  "Broken",
  "Burn",
  "Closer",
  "Cold",
  "Control",
  "Crazy",
  "Dance",
  "Dreams",
  "Drive",
  "Enemy",
  "Falling",
  "Fever",
  "Fire",
  "First Day Out",
  "Forever",
  "Ghost",
  "Gold",
  "Halo",
  "Happy",
  "Heaven",
  "Hello",
  "Hero",
  "Home",
  "Human",
  "Hurt",
  "Karma",
  "Kiss",
  "Lights",
  "Lonely",
  "Lost",
  "Love",
  "Low",
  "Magic",
  "Memories",
  "Mercy",
  "Midnight",
  "Miracle",
  "Money",
  "Monster",
  "Moonlight",
  "Night",
  "Numb",
  "Ocean",
  "Paradise",
  "Perfect",
  "Poison",
  "Power",
  "Promise",
  "Rain",
  "Ride",
  "River",
  "Roses",
  "Run",
  "Runaway",
  "Secret",
  "Shallow",
  "Slow",
  "Smile",
  "Sorry",
  "Stars",
  "Stay",
  "Sugar",
  "Summer",
  "Sunflower",
  "Sweet",
  "Talk",
  "Thunder",
  "Time",
  "Toxic",
  "Trouble",
  "Unholy",
  "Water",
  "Waves",
  "Wild",
  "Work",
  "Yesterday",
  "Young",
];

/**
 * The seeds still available to a player, given the slugs they've already seen.
 * Falls back to everything once the list is exhausted.
 *
 * `exclude` holds slugs, so seeds have to be slugified to compare. Lowercasing
 * the seed instead only happens to work for single words — "First Day Out"
 * lowercases to "first day out" but slugs as "first-day-out", so a multi-word
 * title would never be filtered out and could be served again and again.
 *
 * Split out from `randomSeed` so the filtering can be tested without rolling
 * dice: the bug above shows up in only half of random draws.
 */
export function seedPool(exclude: string[] = []): string[] {
  const blocked = new Set(exclude.map((item) => item.trim().toLowerCase()));
  const pool = TITLE_SEEDS.filter((seed) => !blocked.has(slugifyTitle(seed)));
  return pool.length > 0 ? pool : TITLE_SEEDS;
}

export function randomSeed(exclude: string[] = []): string {
  const pool = seedPool(exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}
