import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BOUT_ORDER,
  championId,
  currentBout,
  pairIdFor,
  seedTracks,
  tracksForBout,
} from "../lib/bracket";
import type { CatalogTrack } from "../lib/types";

function track(id: number, rank: number, artist = `A${id}`): CatalogTrack {
  return { id, artist, artistId: id, rank, cover: "" };
}

describe("seedTracks", () => {
  it("keeps the top 8 by rank", () => {
    const tracks = [9, 1, 8, 2, 7, 3, 6, 4, 5, 10].map((rank) => track(rank, rank));
    const seeded = seedTracks(tracks);
    assert.equal(seeded.length, 8);
    assert.deepEqual(
      seeded.map((item) => item.rank),
      [10, 9, 8, 7, 6, 5, 4, 3],
    );
  });
});

describe("bracket flow", () => {
  const seeds = [800, 700, 600, 500, 400, 300, 200, 100].map((rank, i) =>
    track(i + 1, rank, `Seed${i + 1}`),
  );

  it("opens on QF 1v8", () => {
    const bout = tracksForBout(seeds, "qf-1", {});
    assert.ok(bout);
    assert.equal(bout[0].id, 1);
    assert.equal(bout[1].id, 8);
  });

  it("pairs 4v5, 2v7, 3v6", () => {
    assert.deepEqual(
      tracksForBout(seeds, "qf-2", {})?.map((t) => t.id),
      [4, 5],
    );
    assert.deepEqual(
      tracksForBout(seeds, "qf-3", {})?.map((t) => t.id),
      [2, 7],
    );
    assert.deepEqual(
      tracksForBout(seeds, "qf-4", {})?.map((t) => t.id),
      [3, 6],
    );
  });

  it("advances winners into the final and names a champion", () => {
    const picks = { "qf-1": 1, "qf-2": 4, "qf-3": 2, "qf-4": 3, "sf-1": 1, "sf-2": 2, f: 1 };
    assert.equal(currentBout({ "qf-1": 1 }), "qf-2");
    assert.equal(currentBout({ "qf-1": 1, "qf-2": 4, "qf-3": 2, "qf-4": 3 }), "sf-1");
    assert.deepEqual(
      tracksForBout(seeds, "sf-1", picks)?.map((t) => t.id),
      [1, 4],
    );
    assert.deepEqual(
      tracksForBout(seeds, "f", picks)?.map((t) => t.id),
      [1, 2],
    );
    assert.equal(currentBout(picks), "champion");
    assert.equal(championId(picks), 1);
    assert.equal(BOUT_ORDER.length, 7);
  });

  it("builds a stable pair id", () => {
    assert.equal(pairIdFor("baby", 9, 2), "baby:2-9");
    assert.equal(pairIdFor("baby", 2, 9), "baby:2-9");
  });
});
