"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SkipForward } from "lucide-react";
import { toast } from "sonner";
import { CLIP_SECONDS, createAudioEngine } from "@/lib/audio";
import { ROUND_LABEL, championId, currentBout, seedTracks, tracksForBout } from "@/lib/bracket";
import {
  EMPTY_HEARD,
  EMPTY_PICKS,
  EMPTY_STATS,
  clearTournament,
  loadHeardTracks,
  loadStats,
  loadTournament,
  markTrackHeard,
  subscribeLocal,
  recordBout,
  recordChampion,
  resetStreak,
  saveTournamentPick,
  seenTitleSlugs,
} from "@/lib/local-stats";
import { unslugify } from "@/lib/normalize";
import type { BoutId, CatalogTitle, CrowdSplit, HydratedTrack } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Masthead } from "@/components/site/masthead";
import { BracketRail } from "./bracket-rail";
import { Champion } from "./champion";
import { ChampionReveal } from "./champion-reveal";
import { CrowdBar } from "./crowd-bar";
import { NextBoutButton } from "./next-bout-button";
import { ShareButton } from "./share-button";
import { TrackCard } from "./track-card";

type MatchupPayload = {
  pairId: string;
  token: string;
  tracks: HydratedTrack[];
  title?: CatalogTitle;
};

export function Arena({
  slug,
  shareUrl,
  initialTitle = null,
}: {
  slug: string;
  shareUrl: string;
  initialTitle?: CatalogTitle | null;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const display = unslugify(slug);
  const [title, setTitle] = useState<CatalogTitle | null>(initialTitle);
  const [titleSlug, setTitleSlug] = useState(slug);
  if (titleSlug !== slug) {
    setTitleSlug(slug);
    setTitle(initialTitle);
  }
  const seeds = useMemo(() => (title ? seedTracks(title.tracks) : []), [title]);
  const engine = useRef<ReturnType<typeof createAudioEngine> | null>(null);

  /* Progress, listen history and lifetime stats all live in localStorage and are
     read through the store so hydration matches the server-rendered HTML. */
  const picks = useSyncExternalStore(subscribeLocal, () => loadTournament(slug), () => EMPTY_PICKS);
  const heardIds = useSyncExternalStore(subscribeLocal, () => loadHeardTracks(slug), () => EMPTY_HEARD);
  const stats = useSyncExternalStore(subscribeLocal, loadStats, () => EMPTY_STATS);

  const [matchup, setMatchup] = useState<MatchupPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<"a" | "b" | null>(null);
  const [progress, setProgress] = useState(0);
  const [crowd, setCrowd] = useState<CrowdSplit | null>(null);
  const [you, setYou] = useState<"a" | "b" | null>(null);
  const [revealing, setRevealing] = useState(false);
  /* Voting advances `picks` immediately, but the cards must keep showing the
     bout that was just judged until the crowd split is dismissed — otherwise
     the next pair slides in underneath the result. */
  const [judgedBout, setJudgedBout] = useState<BoutId | null>(null);
  const lastPairKey = useRef<string | null>(null);

  const nextUp = currentBout(picks);
  const isChampion = nextUp === "champion";
  const showingResult = judgedBout !== null;
  const bout: BoutId | null = judgedBout ?? (isChampion ? null : nextUp);
  const pair = title && bout ? tracksForBout(seeds, bout, picks) : null;
  const pairKey = pair && bout ? `${bout}:${pair[0].id}-${pair[1].id}` : String(nextUp);

  /* The field already carries previews and artwork, so a bout can paint the
     instant it's known. /api/matchup is only needed for its signed vote token;
     when it lands we prefer its fresher (re-signed) preview URLs. */
  const tracks = useMemo<[HydratedTrack, HydratedTrack] | null>(() => {
    if (matchup?.tracks?.length === 2 && pair && matchup.tracks[0].id === pair[0].id) {
      return [matchup.tracks[0], matchup.tracks[1]];
    }
    if (!pair) return null;
    const hydrate = (track: (typeof pair)[0]): HydratedTrack | null =>
      track.preview
        ? {
            ...track,
            preview: track.preview,
            deezerUrl: track.deezerUrl ?? `https://www.deezer.com/track/${track.id}`,
          }
        : null;
    const a = hydrate(pair[0]);
    const b = hydrate(pair[1]);
    return a && b ? [a, b] : null;
  }, [matchup, pair]);

  /* A song only has to be heard once per tournament. */
  const heard = {
    a: tracks ? heardIds.includes(tracks[0].id) : false,
    b: tracks ? heardIds.includes(tracks[1].id) : false,
  };

  /* Only needed when the server couldn't reach Deezer — normally the field
     arrives with the HTML and this never fires. */
  useEffect(() => {
    if (initialTitle) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/title?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        const json = (await res.json()) as CatalogTitle & { error?: string };
        if (!res.ok) throw new Error(json.error || "Could not load this title.");
        if (!cancelled) setTitle(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this title.");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, initialTitle]);

  const loadMatchup = useCallback(
    async (boutId: BoutId, a: number, b: number) => {
      setError(null);
      setMatchup(null);
      setPlaying(null);
      setProgress(0);
      void engine.current?.pause();
      try {
        const res = await fetch(`/api/matchup?slug=${slug}&bout=${boutId}&a=${a}&b=${b}`, { cache: "no-store" });
        const json = (await res.json()) as MatchupPayload & { error?: string };
        if (!res.ok) throw new Error(json.error || "Could not load this fight.");
        setMatchup(json);
        if (json.title) setTitle(json.title);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load this fight.");
      }
    },
    [slug],
  );

  useEffect(() => {
    engine.current = createAudioEngine();
    return () => engine.current?.destroy();
  }, []);

  useEffect(() => {
    if (!title || !bout || !pair || showingResult) return;
    if (lastPairKey.current === pairKey) return;
    lastPairKey.current = pairKey;
    void loadMatchup(bout, pair[0].id, pair[1].id);
  }, [title, bout, pair, pairKey, showingResult, loadMatchup]);

  const play = useCallback(
    async (side: "a" | "b") => {
      if (!tracks || !engine.current) return;
      if (playing === side) {
        void engine.current.pause();
        setPlaying(null);
        return;
      }
      const track = tracks[side === "a" ? 0 : 1];
      try {
        setPlaying(side);
        await engine.current.play(
          track.preview,
          (time) => setProgress(Math.min(CLIP_SECONDS, time)),
          () => setPlaying(null),
        );
        markTrackHeard(slug, track.id);
      } catch {
        setPlaying(null);
        toast.error("Tap once more", { description: "Mobile browsers need a direct tap to start audio." });
      }
    },
    [tracks, playing, slug],
  );

  /* Warm both previews as soon as the bout is known — the second listen and the
     A/B switch then start instantly instead of buffering. */
  useEffect(() => {
    if (!tracks || !engine.current) return;
    engine.current.prefetch(tracks[0].preview, tracks[1].preview);
  }, [tracks]);

  const pick = useCallback(
    async (side: "a" | "b") => {
      if (!matchup || !tracks || !bout || showingResult || revealing) return;
      const winnerId = tracks[side === "a" ? 0 : 1].id;
      const isFinal = bout === "f";
      void engine.current?.pause();
      setPlaying(null);

      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: matchup.token, winnerId }),
      });
      const json = (await res.json()) as { crowd?: CrowdSplit; error?: string };
      if (!res.ok || !json.crowd) {
        toast.error(json.error || "Vote didn’t land.");
        return;
      }

      const nextPicks = saveTournamentPick(slug, bout, winnerId);
      const agreed =
        (side === "a" && json.crowd.a >= json.crowd.b) || (side === "b" && json.crowd.b >= json.crowd.a);
      recordBout(agreed);
      setYou(side);
      setCrowd(json.crowd);

      if (isFinal) {
        const champ = seeds.find((track) => track.id === championId(nextPicks));
        if (champ) recordChampion({ slug, display, championArtist: champ.artist, agreed, at: Date.now() });
        setRevealing(true);
        return;
      }

      // Hold the cards on this bout until the crowd split is dismissed.
      setJudgedBout(bout);
    },
    [matchup, tracks, bout, showingResult, revealing, slug, display, seeds],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;
      const key = event.key.toLowerCase();
      if (key === "a" || key === "arrowleft") void play("a");
      if (key === "l" || key === "arrowright") void play("b");
      if (key === "1") void pick("a");
      if (key === "2") void pick("b");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play, pick]);

  const nextBout = () => {
    setJudgedBout(null);
    setCrowd(null);
    setYou(null);
  };

  const skipTitle = () => {
    void engine.current?.pause();
    resetStreak();
    router.push(`/?exclude=${[...seenTitleSlugs(), slug].join(",")}`);
  };

  const rematch = () => {
    // Clearing storage notifies the store, so picks and listen history reset.
    clearTournament(slug);
    lastPairKey.current = null;
    setJudgedBout(null);
    setRevealing(false);
    setCrowd(null);
    setYou(null);
  };

  const champ = championId(picks);
  const champTrack = champ ? seeds.find((track) => track.id === champ) : null;
  /* Voting needs the signed token; everything else can paint without it. */
  const canPick = heard.a && heard.b && !showingResult && !!bout && Boolean(matchup?.token);
  const bothHeard = heard.a && heard.b;

  const playChampion = useCallback(() => {
    const preview =
      title?.tracks.find((t) => t.id === champTrack?.id)?.preview ??
      matchup?.tracks.find((t) => t.id === champTrack?.id)?.preview;
    if (!preview || !engine.current) return;
    void engine.current.play(preview, () => undefined, () => undefined).catch(() => undefined);
  }, [champTrack, title, matchup]);

  /* Final vote → drum roll (song starts here) → champion page. */
  if (revealing && champTrack) {
    return (
      <ChampionReveal
        display={display}
        champion={champTrack}
        onStart={playChampion}
        onDone={() => setRevealing(false)}
      />
    );
  }

  if (isChampion && champTrack) {
    const finalists = tracksForBout(seeds, "f", picks);
    const runnerUp = finalists?.find((t) => t.id !== champTrack.id);
    return (
      <Champion
        display={display}
        champion={champTrack}
        runnerUp={runnerUp}
        seeds={seeds}
        shareUrl={shareUrl}
        crowd={crowd}
        you={you}
        onAnother={skipTitle}
        onRematch={rematch}
      />
    );
  }

  return (
    <main className="mx-auto flex h-full w-full max-w-3xl flex-col px-5">
      <Masthead>
        {stats.streak > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
            {stats.streak} streak
          </span>
        )}
        <ShareButton url={shareUrl} label="Share" variant="ghost" />
      </Masthead>

      {/* Title block — fixed rows so advancing a round can't nudge anything */}
      <section className="shrink-0 border-t border-rule pt-2">
        <div className="flex h-5 items-center justify-between gap-4">
          <p className="eyebrow truncate">{bout ? ROUND_LABEL[bout] : "Champion"}</p>
          <BracketRail picks={picks} current={bout ?? "champion"} />
        </div>
        <h1 className="title-display font-serif-display mt-1 truncate leading-[0.95]">{display}</h1>
      </section>

      {error && (
        <div className="mt-2 shrink-0 rounded-lg border border-destructive/30 bg-destructive/[0.04] px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* The bout — takes whatever height is left */}
      <section className="flex min-h-0 flex-1 items-center py-[var(--arena-gap)]">
        {!tracks ? (
          <div className="grid h-full w-full grid-cols-2 gap-3 sm:gap-5">
            {[0, 1].map((i) => (
              <div key={i} className="flex min-h-0 flex-col gap-2">
                <Skeleton className="min-h-0 flex-1 rounded-xl" />
                <Skeleton className="h-5 w-2/3 shrink-0" />
                <Skeleton className="h-10 w-full shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pairKey}
              initial={reduce ? false : { opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative grid h-full w-full grid-cols-2 gap-3 sm:gap-5"
            >
              <TrackCard
                track={tracks[0]}
                side="a"
                seed={seeds.findIndex((t) => t.id === tracks[0].id) + 1}
                playing={playing === "a"}
                heard={heard.a}
                progress={playing === "a" ? progress : heard.a ? CLIP_SECONDS : 0}
                onPlay={() => void play("a")}
                onPick={() => void pick("a")}
                canPick={canPick}
                locked={showingResult}
                outcome={showingResult ? (you === "a" ? "won" : "lost") : undefined}
              />
              <TrackCard
                track={tracks[1]}
                side="b"
                seed={seeds.findIndex((t) => t.id === tracks[1].id) + 1}
                playing={playing === "b"}
                heard={heard.b}
                progress={playing === "b" ? progress : heard.b ? CLIP_SECONDS : 0}
                onPlay={() => void play("b")}
                onPick={() => void pick("b")}
                canPick={canPick}
                locked={showingResult}
                outcome={showingResult ? (you === "b" ? "won" : "lost") : undefined}
              />

              <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-[calc(50%+2.25rem)]">
                <span className="grid size-10 place-items-center rounded-full border border-rule bg-paper font-serif-display text-[13px] italic text-ink-soft shadow-sm">
                  vs
                </span>
              </span>
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* Footer — one fixed-height grid cell holds both states, so they cross-fade
          in place without reflowing, and the meter and button are real grid
          columns that can't sit on top of each other. */}
      <section
        className="grid shrink-0 grid-cols-1 grid-rows-1 border-t border-rule"
        style={{ height: "var(--footer-h)" }}
      >
        <AnimatePresence initial={false}>
          {showingResult && crowd && you && tracks ? (
            <motion.div
              key="result"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="col-start-1 row-start-1 flex items-center"
            >
              {/* The action lives inside CrowdBar so it shares a row with the
                  bars instead of centring against the labels above them. */}
              <CrowdBar
                crowd={crowd}
                you={you}
                labelA={tracks[0].artist}
                labelB={tracks[1].artist}
                action={
                  <NextBoutButton
                    onNext={nextBout}
                    label={isChampion ? "Crown it" : "Next bout"}
                  />
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key="hint"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="col-start-1 row-start-1 flex items-center justify-between gap-4"
            >
              <p className="collapse-short font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                {bothHeard ? "Pick a winner" : heard.a || heard.b ? "One to go" : "Tap a cover · 15s clips"}
              </p>
              <Button variant="ghost" size="sm" onClick={skipTitle} className="ml-auto">
                <SkipForward />
                Skip title
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
