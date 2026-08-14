import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { slugifyTitle, unslugify } from "../lib/normalize";
import { TITLE_SEEDS, randomSeed } from "../lib/seeds";

describe("live title slugs", () => {
  it("round-trips seed words through slugify", () => {
    for (const seed of TITLE_SEEDS) {
      assert.equal(unslugify(slugifyTitle(seed)).toLowerCase(), seed.toLowerCase());
    }
  });

  it("never returns an excluded seed", () => {
    const exclude = TITLE_SEEDS.slice(0, 10).map((seed) => slugifyTitle(seed));
    const picked = randomSeed(exclude);
    assert.equal(exclude.includes(slugifyTitle(picked)), false);
  });
});
