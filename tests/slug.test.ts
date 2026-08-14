import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_SLUG_LENGTH, isValidSlug, safeSlug } from "../lib/slug";

describe("slug validation", () => {
  it("accepts ordinary title slugs", () => {
    assert.equal(isValidSlug("baby"), true);
    assert.equal(isValidSlug("sweater-weather"), true);
    assert.equal(isValidSlug("no-lie"), true);
  });

  it("rejects anything that isn't a bare lowercase slug", () => {
    for (const bad of [
      "",
      "-baby",
      "baby-",
      "baby--blue",
      "Baby",
      "baby blue",
      "baby/../etc",
      "baby?q=1",
      "../../secret",
      "b".repeat(MAX_SLUG_LENGTH + 1),
    ]) {
      assert.equal(isValidSlug(bad), false, `expected ${JSON.stringify(bad)} to be rejected`);
    }
  });

  it("normalises case and whitespace, or returns null", () => {
    assert.equal(safeSlug("  Baby  "), "baby");
    assert.equal(safeSlug("hold-on"), "hold-on");
    assert.equal(safeSlug(null), null);
    assert.equal(safeSlug("bad slug"), null);
  });
});
