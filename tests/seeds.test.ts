import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { slugifyTitle, unslugify } from "../lib/normalize";
import { TITLE_SEEDS, randomSeed, seedPool } from "../lib/seeds";
import { isValidSlug } from "../lib/slug";

/**
 * These are structural checks only — whether a word actually has eight artists
 * on Deezer is a live question, answered by `pnpm verify:seeds`.
 */
describe("title seeds", () => {
  it("has a healthy pool", () => {
    assert.ok(TITLE_SEEDS.length >= 80, `expected 80+ seeds, got ${TITLE_SEEDS.length}`);
  });

  it("contains no duplicates, case-insensitively", () => {
    const seen = new Map<string, string>();
    for (const seed of TITLE_SEEDS) {
      const key = seed.toLowerCase();
      assert.equal(seen.has(key), false, `"${seed}" duplicates "${seen.get(key)}"`);
      seen.set(key, seed);
    }
  });

  it("every seed survives the slug round trip and is routable", () => {
    for (const seed of TITLE_SEEDS) {
      const slug = slugifyTitle(seed);
      assert.equal(isValidSlug(slug), true, `"${seed}" -> "${slug}" is not a routable slug`);
      assert.equal(unslugify(slug).toLowerCase(), seed.toLowerCase(), `"${seed}" does not round trip`);
    }
  });

  it("stays sorted so duplicates stay easy to spot", () => {
    const sorted = [...TITLE_SEEDS].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    assert.deepEqual(TITLE_SEEDS, sorted);
  });

  it("never returns an excluded seed while any remain", () => {
    const exclude = TITLE_SEEDS.slice(0, TITLE_SEEDS.length - 1).map(slugifyTitle);
    const picked = randomSeed(exclude);
    assert.equal(picked, TITLE_SEEDS[TITLE_SEEDS.length - 1]);
  });

  it("excludes every seed by its own slug", () => {
    /* Comparing a lowercased seed against a slug silently fails the moment a
       title contains a space, and the picker starts repeating that title.
       Asserting on the pool rather than a draw keeps this deterministic. */
    for (const seed of TITLE_SEEDS) {
      const pool = seedPool([slugifyTitle(seed)]);
      assert.equal(pool.includes(seed), false, `"${seed}" survived its own exclusion`);
      assert.equal(pool.length, TITLE_SEEDS.length - 1);
    }
  });

  it("covers the multi-word case that single words can't", () => {
    const multiWord = TITLE_SEEDS.filter((seed) => seed.includes(" "));
    assert.ok(multiWord.length > 0, "expected at least one multi-word seed to exercise slugging");
  });

  it("falls back to the full pool once everything is excluded", () => {
    const picked = randomSeed(TITLE_SEEDS.map(slugifyTitle));
    assert.ok(TITLE_SEEDS.includes(picked));
  });
});
