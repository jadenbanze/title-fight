"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { RotateCcw, Shuffle } from "lucide-react";
import type { CatalogTrack, CrowdSplit } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Masthead } from "@/components/site/masthead";
import { ShareResult } from "./share-result";

export function Champion({
  slug,
  display,
  champion,
  runnerUp,
  seeds,
  shareUrl,
  crowd,
  you,
  onAnother,
  onRematch,
}: {
  slug: string;
  display: string;
  champion: CatalogTrack;
  runnerUp?: CatalogTrack;
  seeds: CatalogTrack[];
  shareUrl: string;
  crowd?: CrowdSplit | null;
  you?: "a" | "b" | null;
  onAnother: () => void;
  onRematch: () => void;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    let cancelled = false;
    const run = async () => {
      const { default: confetti } = await import("canvas-confetti");
      if (cancelled) return;
      confetti({
        particleCount: 70,
        spread: 70,
        startVelocity: 32,
        gravity: 0.9,
        scalar: 0.9,
        origin: { y: 0.4 },
        colors: ["#C2603A", "#3B5A9B", "#1F1A14", "#E8E1D4"],
        disableForReducedMotion: true,
      });
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [reduce]);

  const agreement = crowd && you ? (you === "a" ? crowd.aPct : crowd.bPct) : null;

  return (
    <main className="mx-auto flex h-full w-full max-w-3xl flex-col px-5">
      <Masthead>
        <span className="eyebrow">{display}</span>
      </Masthead>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 border-t border-rule py-4 sm:flex-row sm:gap-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 24 }}
          className="flex min-h-0 flex-1 items-center justify-center sm:flex-none"
        >
          <div className="relative aspect-square h-full max-h-full overflow-hidden rounded-2xl border border-rule shadow-[0_20px_50px_-24px_rgba(30,20,10,0.6)] sm:h-auto sm:w-56">
            {champion.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={champion.cover} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
        </motion.div>

        <div className="flex shrink-0 flex-col items-center text-center sm:items-start sm:text-left">
          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="eyebrow"
          >
            Champion
          </motion.p>
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="text-balance-display mt-1 font-serif-display text-[clamp(1.6rem,min(8vw,6.5vh),3.5rem)] leading-[1.05] [overflow-wrap:anywhere]"
          >
            {champion.artist}
          </motion.h1>
          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 max-w-sm text-[15px] leading-snug text-ink-soft"
          >
            Beat {runnerUp ? runnerUp.artist : "the field"} in the final of {seeds.length} songs called “
            {display}”.
            {agreement != null && ` ${agreement}% of voters agreed with your call.`}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start"
          >
            <ShareResult
              slug={slug}
              display={display}
              winnerId={champion.id}
              championArtist={champion.artist}
              titleUrl={shareUrl}
            />
            <Button variant="ghost" size="sm" onClick={onAnother}>
              <Shuffle />
              New title
            </Button>
            <Button variant="ghost" size="sm" onClick={onRematch}>
              <RotateCcw />
              Run it back
            </Button>
          </motion.div>
        </div>
      </div>

      <motion.ol
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.32 }}
        className="shrink-0 border-t border-rule pt-2.5"
      >
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {seeds.map((track, i) => (
            <li
              key={track.id}
              className={`flex items-baseline gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] ${
                track.id === champion.id ? "text-ink" : "text-ink-faint"
              }`}
            >
              <span>{i + 1}</span>
              <span className="max-w-32 truncate">{track.artist}</span>
            </li>
          ))}
        </div>
      </motion.ol>
    </main>
  );
}
