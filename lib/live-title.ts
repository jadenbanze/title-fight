import { BRACKET_SIZE } from "./bracket";
import { coverUrl, searchTracks, type DeezerSearchTrack } from "./deezer";
import { isExactTitleMatch, slugifyTitle, unslugify } from "./normalize";
import { cacheGet, cacheSet } from "./redis";
import { isValidSlug } from "./slug";
import type { CatalogTitle, CatalogTrack, HydratedTrack } from "./types";

const FIELD_TTL = 20 * 60;

function toTrack(hit: DeezerSearchTrack): CatalogTrack | null {
  if (!hit.id || !hit.artist?.id || !hit.preview) return null;
  return {
    id: hit.id,
    artist: hit.artist.name,
    artistId: hit.artist.id,
    rank: hit.rank ?? 0,
    cover: coverUrl(hit),
    preview: hit.preview,
    deezerUrl: hit.link || `https://www.deezer.com/track/${hit.id}`,
  };
}

function hydrate(track: CatalogTrack): HydratedTrack | null {
  if (!track.preview) return null;
  return {
    ...track,
    preview: track.preview,
    deezerUrl: track.deezerUrl || `https://www.deezer.com/track/${track.id}`,
  };
}

async function searchField(query: string): Promise<CatalogTrack[]> {
  const { data } = await searchTracks(query, { limit: 50, index: 0 });
  const byArtist = new Map<number, CatalogTrack>();
  for (const hit of data) {
    const raw = hit.title_short || hit.title;
    if (!isExactTitleMatch(raw, query) && !isExactTitleMatch(hit.title, query)) continue;
    const track = toTrack(hit);
    if (!track) continue;
    const existing = byArtist.get(track.artistId);
    if (!existing || track.rank > existing.rank) byArtist.set(track.artistId, track);
  }
  return [...byArtist.values()].sort((a, b) => b.rank - a.rank).slice(0, BRACKET_SIZE);
}

export async function loadLiveTitle(slug: string): Promise<CatalogTitle | null> {
  if (!isValidSlug(slug)) return null;
  const query = unslugify(slug);
  if (!query) return null;
  const cacheKey = `field:${slugifyTitle(query)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as CatalogTitle;
    } catch {
      /* ignore */
    }
  }

  const tracks = await searchField(query);
  if (tracks.length < BRACKET_SIZE) return null;
  const title: CatalogTitle = {
    slug: slugifyTitle(query),
    display: query,
    tracks,
  };
  await cacheSet(cacheKey, JSON.stringify(title), FIELD_TTL);
  return title;
}

export function liveTracks(title: CatalogTitle, a: number, b: number): HydratedTrack[] | null {
  const left = title.tracks.find((track) => track.id === a);
  const right = title.tracks.find((track) => track.id === b);
  if (!left || !right) return null;
  const hydrated = [hydrate(left), hydrate(right)];
  if (hydrated.some((track) => !track)) return null;
  return hydrated as HydratedTrack[];
}
