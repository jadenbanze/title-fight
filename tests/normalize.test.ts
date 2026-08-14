import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isExactTitleMatch, looksLikeVariant, normalizeTitle, slugifyTitle } from "../lib/normalize";

describe("normalizeTitle", () => {
  it("treats feat credits as the same title", () => {
    assert.equal(normalizeTitle("Baby (feat. Ludacris)"), "baby");
    assert.equal(normalizeTitle("Baby"), "baby");
  });

  it("is case-insensitive and punctuation-insensitive", () => {
    assert.equal(normalizeTitle("STAY"), "stay");
    assert.equal(normalizeTitle("stay."), "stay");
    assert.equal(normalizeTitle("Hold On"), "hold on");
  });
});

describe("isExactTitleMatch", () => {
  it("accepts exact and feat variants", () => {
    assert.equal(isExactTitleMatch("Baby", "Baby"), true);
    assert.equal(isExactTitleMatch("Baby (feat. Ludacris)", "Baby"), true);
    assert.equal(isExactTitleMatch("STAY", "Stay"), true);
  });

  it("drops remixed / acoustic / live versions", () => {
    assert.equal(isExactTitleMatch("Stay (Acoustic Version)", "Stay"), false);
    assert.equal(isExactTitleMatch("Baby (Remix)", "Baby"), false);
    assert.equal(isExactTitleMatch("Hello (Live)", "Hello"), false);
    assert.equal(looksLikeVariant("Stay (Radio Edit)"), true);
  });

  it("does not treat longer titles as a match", () => {
    assert.equal(isExactTitleMatch("Baby Blue", "Baby"), false);
    assert.equal(isExactTitleMatch("Stay (If You Wanna Dance)", "Stay"), false);
  });
});

describe("slugifyTitle", () => {
  it("slugifies multi-word seeds", () => {
    assert.equal(slugifyTitle("Hold On"), "hold-on");
    assert.equal(slugifyTitle("Sweater Weather"), "sweater-weather");
  });
});
