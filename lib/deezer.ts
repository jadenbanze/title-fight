import { fetchJson } from "./http";

const DEEZER = "https://api.deezer.com";

export type DeezerSearchTrack = {
  id: number;
  title: string;
  title_short: string;
  preview: string;
  rank: number;
  artist: { id: number; name: string };
  album: { cover_medium?: string; cover_xl?: string; title?: string };
  link?: string;
};

export type DeezerTrack = DeezerSearchTrack & {
  duration: number;
  explicit_lyrics: boolean;
  link: string;
  readable?: boolean;
};

type SearchResponse = {
  data?: DeezerSearchTrack[];
  total?: number;
  error?: { type?: string; message?: string; code?: number };
};

export async function searchTracks(
  query: string,
  opts: { limit?: number; index?: number } = {},
): Promise<{ data: DeezerSearchTrack[]; total: number }> {
  const params = new URLSearchParams({
    q: query,
    limit: String(opts.limit ?? 25),
    index: String(opts.index ?? 0),
  });
  const body = await fetchJson<SearchResponse>(`${DEEZER}/search/track?${params}`);
  if (body.error) throw new Error(body.error.message || "Deezer search error");
  return { data: body.data ?? [], total: body.total ?? 0 };
}

export async function getTrack(id: number): Promise<DeezerTrack | null> {
  const body = await fetchJson<DeezerTrack & { error?: { message?: string } }>(`${DEEZER}/track/${id}`);
  if (!body || body.error || !body.id) return null;
  return body;
}

export function coverUrl(track: {
  album?: { cover_xl?: string; cover_medium?: string };
}): string {
  return track.album?.cover_xl || track.album?.cover_medium || "";
}
