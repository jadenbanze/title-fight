"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { CatalogTrack } from "@/lib/types";

const BEAT_MS = 700;
const STEPS = ["And the champion", "of all eight", "is…"];

/**
 * The gap between the final vote and the champion page. One line at a time on a
 * fixed beat, then hands off — the winning preview starts as this mounts, so the
 * champion page lands with the song already playing.
 */
export function ChampionReveal({
  display,
  champion,
  onStart,
  onDone,
}: {
  display: string;
  champion: CatalogTrack;
  onStart: () => void;
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const started = useRef(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    onStart();
  }, [onStart]);

  useEffect(() => {
    if (reduce) {
      const short = window.setTimeout(onDone, 350);
      return () => window.clearTimeout(short);
    }
    const timers = STEPS.slice(1).map((_, i) =>
      window.setTimeout(() => setStep(i + 1), (i + 1) * BEAT_MS),
    );
    const finish = window.setTimeout(onDone, STEPS.length * BEAT_MS + 450);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(finish);
    };
  }, [onDone, reduce]);

  return (
    <main className="flex h-full flex-col items-center justify-center px-5 text-center">
      <p className="eyebrow">{display}</p>

      <div className="relative mt-4 flex h-[clamp(3.5rem,14vh,7rem)] w-full max-w-xl items-center justify-center">
        <AnimatePresence initial={false}>
          <motion.p
            key={step}
            initial={reduce ? false : { opacity: 0, y: 16, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? undefined : { opacity: 0, y: -16, filter: "blur(5px)" }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="absolute font-serif-display text-[clamp(1.75rem,min(7vw,9vh),3.25rem)] leading-[1.05]"
          >
            {STEPS[step]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Beat markers so the pause reads as suspense, not a stall. */}
      <div className="mt-1 flex items-center gap-2" aria-hidden>
        {STEPS.map((label, i) => (
          <motion.span
            key={label}
            animate={{
              scale: i === step ? 1 : 0.55,
              opacity: i <= step ? 1 : 0.25,
            }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 24 }}
            className="size-1.5 rounded-full bg-ink"
          />
        ))}
      </div>

      <span className="sr-only" role="status">
        Champion: {champion.artist}
      </span>
    </main>
  );
}
