export type CatalogTrack = {
  id: number;
  artist: string;
  artistId: number;
  rank: number;
  cover: string;
  preview?: string;
  deezerUrl?: string;
};

export type CatalogTitle = {
  slug: string;
  display: string;
  tracks: CatalogTrack[];
};

export type HydratedTrack = CatalogTrack & {
  preview: string;
  deezerUrl: string;
};

export type BoutId = "qf-1" | "qf-2" | "qf-3" | "qf-4" | "sf-1" | "sf-2" | "f";

export type TournamentPicks = Partial<Record<BoutId, number>>;

export type CrowdSplit = {
  a: number;
  b: number;
  aPct: number;
  bPct: number;
};
