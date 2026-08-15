import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RESUME_WINDOW_MS, resumableTournament, type SavedTournament } from "../lib/local-stats";
import { titleScale } from "../lib/typography";

const NOW = 1_700_000_000_000;

function tournament(slug: string, over: Partial<SavedTournament> = {}): SavedTournament {
  return { slug, picks: {}, heard: [], updatedAt: NOW, ...over };
}

describe("resuming a bracket", () => {
  it("ignores a title that was only listened to", () => {
    /* markTrackHeard writes a record on the first preview, so 'has an entry'
       would pin the player to a title they sampled once and abandoned. */
    const all = { baby: tournament("baby", { heard: [1, 2] }) };
    assert.equal(resumableTournament(all, { now: NOW }), null);
  });

  it("resumes a bracket with real progress", () => {
    const all = { baby: tournament("baby", { picks: { "qf-1": 11 } }) };
    assert.equal(resumableTournament(all, { now: NOW })?.slug, "baby");
  });

  it("ignores a finished bracket", () => {
    const done = tournament("baby", {
      picks: { "qf-1": 1, "qf-2": 2, "qf-3": 3, "qf-4": 4, "sf-1": 1, "sf-2": 3, f: 1 },
    });
    assert.equal(resumableTournament({ baby: done }, { now: NOW }), null);
  });

  it("ignores a stale bracket", () => {
    const all = {
      baby: tournament("baby", { picks: { "qf-1": 11 }, updatedAt: NOW - RESUME_WINDOW_MS - 1 }),
    };
    assert.equal(resumableTournament(all, { now: NOW }), null);
  });

  it("prefers the most recently touched", () => {
    const all = {
      baby: tournament("baby", { picks: { "qf-1": 1 }, updatedAt: NOW - 5_000 }),
      stay: tournament("stay", { picks: { "qf-1": 2 }, updatedAt: NOW - 1_000 }),
    };
    assert.equal(resumableTournament(all, { now: NOW })?.slug, "stay");
  });

  it("honours the exclude list so 'skip title' moves on", () => {
    const all = { baby: tournament("baby", { picks: { "qf-1": 11 } }) };
    assert.equal(resumableTournament(all, { now: NOW, exclude: ["baby"] }), null);
  });
});

describe("title sizing", () => {
  it("shrinks as titles get longer", () => {
    const short = titleScale("Baby");
    const medium = titleScale("Moonlight");
    const long = titleScale("First Day Out");
    assert.equal(short, 1);
    assert.ok(medium < short, "9 characters should scale down from 4");
    assert.ok(long < medium, "13 characters should scale down from 9");
  });

  it("never returns a scale that would hide the title", () => {
    for (const title of ["", "A", "Baby", "First Day Out", "A".repeat(60)]) {
      const scale = titleScale(title);
      assert.ok(scale > 0.3 && scale <= 1, `${title.length} chars produced ${scale}`);
    }
  });

  it("is monotonic — a longer title never renders larger", () => {
    let previous = Infinity;
    for (const length of [1, 7, 8, 10, 11, 14, 15, 20, 21, 40]) {
      const scale = titleScale("x".repeat(length));
      assert.ok(scale <= previous, `length ${length} scaled up to ${scale}`);
      previous = scale;
    }
  });
});
