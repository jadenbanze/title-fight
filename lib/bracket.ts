import type { BoutId, CatalogTrack, TournamentPicks } from "./types";

export const BRACKET_SIZE = 8;

export const QF_PAIRINGS: ReadonlyArray<readonly [number, number]> = [
  [1, 8],
  [4, 5],
  [2, 7],
  [3, 6],
];

export const BOUT_ORDER: BoutId[] = [
  "qf-1",
  "qf-2",
  "qf-3",
  "qf-4",
  "sf-1",
  "sf-2",
  "f",
];

export const BOUT_FEEDS: Record<BoutId, { left?: BoutId; right?: BoutId }> = {
  "qf-1": {},
  "qf-2": {},
  "qf-3": {},
  "qf-4": {},
  "sf-1": { left: "qf-1", right: "qf-2" },
  "sf-2": { left: "qf-3", right: "qf-4" },
  f: { left: "sf-1", right: "sf-2" },
};

export const BOUT_LABEL: Record<BoutId, string> = {
  "qf-1": "Quarterfinal 1",
  "qf-2": "Quarterfinal 2",
  "qf-3": "Quarterfinal 3",
  "qf-4": "Quarterfinal 4",
  "sf-1": "Semifinal 1",
  "sf-2": "Semifinal 2",
  f: "Final",
};

export const ROUND_LABEL: Record<BoutId, string> = {
  "qf-1": "Quarterfinals",
  "qf-2": "Quarterfinals",
  "qf-3": "Quarterfinals",
  "qf-4": "Quarterfinals",
  "sf-1": "Semifinals",
  "sf-2": "Semifinals",
  f: "Final",
};

export function seedTracks(tracks: CatalogTrack[]): CatalogTrack[] {
  return [...tracks].sort((a, b) => b.rank - a.rank).slice(0, BRACKET_SIZE);
}

export function pairIdFor(slug: string, a: number, b: number): string {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  return `${slug}:${lo}-${hi}`;
}

export function tracksForBout(
  seeds: CatalogTrack[],
  boutId: BoutId,
  picks: TournamentPicks,
): [CatalogTrack, CatalogTrack] | null {
  const qfIndex = Number(boutId.startsWith("qf-") ? boutId.slice(3) : 0);
  if (qfIndex >= 1 && qfIndex <= 4) {
    const pairing = QF_PAIRINGS[qfIndex - 1];
    const a = seeds[pairing[0] - 1];
    const b = seeds[pairing[1] - 1];
    if (!a || !b) return null;
    return [a, b];
  }

  const feed = BOUT_FEEDS[boutId];
  if (!feed.left || !feed.right) return null;
  const leftId = picks[feed.left];
  const rightId = picks[feed.right];
  if (!leftId || !rightId) return null;
  const left = seeds.find((track) => track.id === leftId);
  const right = seeds.find((track) => track.id === rightId);
  if (!left || !right) return null;
  return [left, right];
}

export function currentBout(picks: TournamentPicks): BoutId | "champion" {
  for (const boutId of BOUT_ORDER) {
    if (picks[boutId] == null) return boutId;
  }
  return "champion";
}

export function championId(picks: TournamentPicks): number | null {
  return picks.f ?? null;
}

export function pickCount(picks: TournamentPicks): number {
  return BOUT_ORDER.reduce((count, id) => count + (picks[id] == null ? 0 : 1), 0);
}
