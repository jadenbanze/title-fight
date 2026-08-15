import { coverUrl, getTrack } from "./deezer";
import { loadLiveTitle } from "./live-title";
import { isExactTitleMatch, unslugify } from "./normalize";
import { isValidSlug } from "./slug";
import type { CatalogTrack } from "./types";

export type Verdict = {
  slug: string;
  display: string;
  champion: CatalogTrack;
  /** 1-8 when the winner is still in the current field, otherwise null. */
  seed: number | null;
  fieldSize: number;
};

/**
 * Resolves a shared result: "this track won the bracket for this title".
 *
 * Deezer re-ranks over time, so a link shared last week may name a track that
 * has since dropped out of the top eight. Rather than 404 someone else's link,
 * fall back to looking the track up directly — but only accept it if its title
 * genuinely matches the slug, otherwise the URL becomes a way to caption any
 * song in the catalogue as the winner of any title.
 */
export async function resolveVerdict(slug: string, trackId: number): Promise<Verdict | null> {
  if (!isValidSlug(slug) || !Number.isSafeInteger(trackId) || trackId <= 0) return null;

  const title = await loadLiveTitle(slug).catch(() => null);
  const display = title?.display ?? unslugify(slug);

  const inField = title?.tracks.findIndex((track) => track.id === trackId) ?? -1;
  if (title && inField >= 0) {
    return {
      slug,
      display,
      champion: title.tracks[inField],
      seed: inField + 1,
      fieldSize: title.tracks.length,
    };
  }

  const track = await getTrack(trackId).catch(() => null);
  if (!track || !isExactTitleMatch(track.title, display)) return null;

  return {
    slug,
    display,
    champion: {
      id: track.id,
      artistId: track.artist.id,
      artist: track.artist.name,
      cover: coverUrl(track),
      rank: track.rank ?? 0,
      preview: track.preview,
      deezerUrl: track.link,
    },
    seed: null,
    fieldSize: title?.tracks.length ?? 8,
  };
}
