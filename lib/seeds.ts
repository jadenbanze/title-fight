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

export function randomSeed(exclude: string[] = []): string {
  const blocked = new Set(exclude.map((item) => item.toLowerCase()));
  const pool = TITLE_SEEDS.filter((seed) => !blocked.has(seed.toLowerCase()));
  const source = pool.length > 0 ? pool : TITLE_SEEDS;
  return source[Math.floor(Math.random() * source.length)];
}
