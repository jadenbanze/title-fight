import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_HEARD,
  EMPTY_PICKS,
  EMPTY_STATS,
  loadHeardTracks,
  loadStats,
  loadTournament,
} from "../lib/local-stats";

/**
 * These run without a `window`, i.e. exactly the way they run during server
 * render and during React's hydration pass. Each loader must hand back the same
 * reference used as the useSyncExternalStore server snapshot — that identity is
 * what keeps the hydrated markup identical to the HTML and stops the store from
 * re-rendering forever.
 */
describe("server snapshots", () => {
  it("has no window in this environment", () => {
    assert.equal(typeof globalThis.window, "undefined");
  });

  it("returns the exact empty references, not fresh objects", () => {
    assert.equal(loadTournament("baby"), EMPTY_PICKS);
    assert.equal(loadHeardTracks("baby"), EMPTY_HEARD);
    assert.equal(loadStats(), EMPTY_STATS);
  });

  it("is stable across repeated reads", () => {
    assert.equal(loadTournament("baby"), loadTournament("baby"));
    assert.equal(loadHeardTracks("stay"), loadHeardTracks("stay"));
    assert.equal(loadStats(), loadStats());
  });

  it("reports nothing heard and no picks, so the server renders the empty board", () => {
    assert.deepEqual(loadHeardTracks("baby"), []);
    assert.deepEqual(loadTournament("baby"), {});
    assert.equal(loadStats().fights, 0);
  });
});
