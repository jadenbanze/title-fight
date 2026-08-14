import type { BoutId, TournamentPicks } from "./types";

export const STATS_KEY = "tf:you";
export const TOURNAMENTS_KEY = "tf:tournaments";

export type RecentTitle = {
  slug: string;
  display: string;
  championArtist: string;
  agreed: boolean;
  at: number;
};

export type LocalStats = {
  fights: number;
  titlesCrowned: number;
  streak: number;
  bestStreak: number;
  crowdAgrees: number;
  recents: RecentTitle[];
};

export type SavedTournament = {
  slug: string;
  picks: TournamentPicks;
  /** Track ids already previewed in this tournament — a song is only "new" once. */
  heard?: number[];
  updatedAt: number;
};

export const EMPTY_STATS: LocalStats = {
  fights: 0,
  titlesCrowned: 0,
  streak: 0,
  bestStreak: 0,
  crowdAgrees: 0,
  recents: [],
};

const jsonCache = new Map<string, { raw: string; value: unknown }>();

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const hit = jsonCache.get(key);
    if (hit && hit.raw === raw) return hit.value as T;
    const value = JSON.parse(raw) as T;
    jsonCache.set(key, { raw, value });
    return value;
  } catch {
    return fallback;
  }
}

let statsRaw: string | null = null;
let statsSnapshot: LocalStats = EMPTY_STATS;

export function loadStats(): LocalStats {
  if (typeof window === "undefined") return EMPTY_STATS;
  const raw = window.localStorage.getItem(STATS_KEY);
  if (!raw) {
    statsRaw = null;
    statsSnapshot = EMPTY_STATS;
    return EMPTY_STATS;
  }
  if (raw === statsRaw) return statsSnapshot;
  try {
    statsRaw = raw;
    statsSnapshot = { ...EMPTY_STATS, ...(JSON.parse(raw) as LocalStats) };
    return statsSnapshot;
  } catch {
    return EMPTY_STATS;
  }
}

export function saveStats(stats: LocalStats): void {
  const raw = JSON.stringify(stats);
  window.localStorage.setItem(STATS_KEY, raw);
  jsonCache.set(STATS_KEY, { raw, value: stats });
  statsRaw = raw;
  statsSnapshot = stats;
}

function cloneStats(): LocalStats {
  const stats = loadStats();
  return { ...stats, recents: [...stats.recents] };
}

export function recordBout(agreed: boolean): LocalStats {
  const stats = cloneStats();
  stats.fights += 1;
  stats.streak += 1;
  stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
  if (agreed) stats.crowdAgrees += 1;
  saveStats(stats);
  return stats;
}

export function recordChampion(recent: RecentTitle): LocalStats {
  const stats = cloneStats();
  stats.titlesCrowned += 1;
  stats.recents = [recent, ...stats.recents.filter((item) => item.slug !== recent.slug)].slice(0, 12);
  saveStats(stats);
  return stats;
}

export function resetStreak(): LocalStats {
  const stats = cloneStats();
  stats.streak = 0;
  saveStats(stats);
  return stats;
}

export function loadTournaments(): Record<string, SavedTournament> {
  return readJson<Record<string, SavedTournament>>(TOURNAMENTS_KEY, {});
}

const EMPTY_PICKS: TournamentPicks = {};

export function loadTournament(slug: string): TournamentPicks {
  if (typeof window === "undefined") return EMPTY_PICKS;
  return loadTournaments()[slug]?.picks ?? EMPTY_PICKS;
}

export function subscribeLocal(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function writeTournaments(all: Record<string, SavedTournament>): void {
  const raw = JSON.stringify(all);
  window.localStorage.setItem(TOURNAMENTS_KEY, raw);
  jsonCache.set(TOURNAMENTS_KEY, { raw, value: all });
}

export function saveTournamentPick(slug: string, boutId: BoutId, winnerId: number): TournamentPicks {
  const all = loadTournaments();
  const existing = all[slug];
  const picks = { ...(existing?.picks ?? {}), [boutId]: winnerId };
  all[slug] = { slug, picks, heard: existing?.heard ?? [], updatedAt: Date.now() };
  writeTournaments(all);
  return picks;
}

const EMPTY_HEARD: number[] = [];

export function loadHeardTracks(slug: string): number[] {
  if (typeof window === "undefined") return EMPTY_HEARD;
  return loadTournaments()[slug]?.heard ?? EMPTY_HEARD;
}

export function markTrackHeard(slug: string, trackId: number): number[] {
  const all = loadTournaments();
  const existing = all[slug];
  const heard = existing?.heard ?? [];
  if (heard.includes(trackId)) return heard;
  const next = [...heard, trackId];
  all[slug] = {
    slug,
    picks: existing?.picks ?? {},
    heard: next,
    updatedAt: Date.now(),
  };
  writeTournaments(all);
  return next;
}

export function clearTournament(slug: string): void {
  const all = loadTournaments();
  delete all[slug];
  writeTournaments(all);
}

export function seenTitleSlugs(): string[] {
  return Object.keys(loadTournaments());
}
