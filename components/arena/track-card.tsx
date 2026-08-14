"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check, Pause, Play } from "lucide-react";
import { CLIP_SECONDS } from "@/lib/audio";
import type { HydratedTrack } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Waveform } from "./waveform";

type Side = "a" | "b";

export function TrackCard({
  track,
  side,
  seed,
  playing,
  heard,
  progress,
  locked,
  outcome,
  onPlay,
  onPick,
  canPick,
}: {
  track: HydratedTrack;
  side: Side;
  seed?: number;
  playing: boolean;
  heard: boolean;
  progress: number;
  locked?: boolean;
  outcome?: "won" | "lost";
  onPlay: () => void;
  onPick: () => void;
  canPick: boolean;
}) {
  const reduce = useReducedMotion();
  const pct = Math.min(1, progress / CLIP_SECONDS);
  const ring = side === "a" ? "ring-side-a" : "ring-side-b";

  return (
    /* Opacity only — scaling this box would drag the artist name with it. */
    <motion.div
      animate={{ opacity: outcome === "lost" ? 0.4 : 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="flex min-h-0 min-w-0 flex-col gap-2"
    >
      {/* Art sizes off the leftover height, stays square, stays centered. */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <button
          type="button"
          onClick={onPlay}
          disabled={locked}
          aria-label={`${playing ? "Pause" : "Play"} ${track.artist}`}
          className={cn(
            "group relative aspect-square h-full max-h-full w-full max-w-full cursor-pointer overflow-hidden rounded-xl border border-rule bg-secondary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
            ring,
            (playing || outcome === "won") && "ring-2",
            locked && "cursor-default",
          )}
        >
          {track.cover ? (
            // Native img — next/image can't reach Deezer's CDN through this network's TLS proxy.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={track.cover}
              alt=""
              width={500}
              height={500}
              decoding="async"
              fetchPriority="high"
              className={cn(
                "h-full w-full object-cover transition-all duration-500",
                outcome === "lost" && "saturate-50",
                !playing && !locked && "sm:group-hover:scale-[1.03]",
              )}
            />
          ) : null}

          <span className="absolute left-2 top-2 rounded-full bg-paper/85 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-ink backdrop-blur-sm">
            {seed != null ? `#${seed}` : side.toUpperCase()}
          </span>
          {heard && !playing && (
            <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-paper/85 text-ink backdrop-blur-sm">
              <Check size={11} strokeWidth={3} />
            </span>
          )}

          <span className="absolute inset-0 grid place-items-center">
            <motion.span
              animate={reduce ? undefined : { scale: playing ? 0.88 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="grid size-12 place-items-center rounded-full bg-paper/92 text-ink shadow-[0_6px_18px_-6px_rgba(20,14,8,0.5)] backdrop-blur-sm transition-transform duration-200 sm:group-hover:scale-105"
            >
              {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
            </motion.span>
          </span>

          <span
            className={cn(
              "absolute inset-x-0 bottom-0 flex h-14 items-end bg-gradient-to-t from-black/55 to-transparent px-2 pb-2 text-paper transition-opacity duration-300",
              playing || heard ? "opacity-100" : "opacity-0",
            )}
          >
            <Waveform seed={track.id} active={playing} progress={pct} className="h-8" />
          </span>

          <span className="absolute inset-x-0 bottom-0 h-[3px] bg-paper/25">
            <motion.span
              className={cn("block h-full origin-left", side === "a" ? "bg-side-a" : "bg-side-b")}
              style={{ scaleX: pct }}
            />
          </span>
        </button>
      </div>

      {/* Fixed height: the name and link block never changes size between bouts. */}
      <div className="flex h-11 min-w-0 shrink-0 flex-col justify-center">
        <p className="truncate font-serif-display text-[clamp(1rem,3.2vw,1.4rem)] leading-tight">
          {track.artist}
        </p>
        <a
          href={track.deezerUrl}
          target="_blank"
          rel="noreferrer"
          className="collapse-short w-fit cursor-pointer font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-ink"
        >
          Deezer ↗
        </a>
      </div>

      <button
        type="button"
        onClick={onPick}
        disabled={!canPick}
        className={cn(
          "h-10 w-full shrink-0 cursor-pointer truncate rounded-full px-2 text-[13px] font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-default sm:text-sm",
          canPick
            ? side === "a"
              ? "bg-side-a text-paper hover:brightness-110"
              : "bg-side-b text-paper hover:brightness-110"
            : "border border-rule text-ink-faint",
          outcome === "won" && "bg-ink text-paper",
        )}
      >
        {outcome === "won"
          ? "Advanced"
          : outcome === "lost"
            ? "Out"
            : canPick
              ? "This one"
              : heard
                ? "Heard ✓"
                : "Listen first"}
      </button>
    </motion.div>
  );
}
