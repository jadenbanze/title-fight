"use client";

import { motion, useReducedMotion } from "motion/react";
import { BOUT_ORDER } from "@/lib/bracket";
import type { BoutId, TournamentPicks } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Seven dots in three groups — the whole tournament at a glance. Fixed height
 * and no in-flow text, so advancing a round can't nudge the layout.
 */
export function BracketRail({
  picks,
  current,
}: {
  picks: TournamentPicks;
  current: BoutId | "champion";
}) {
  const reduce = useReducedMotion();
  const done = BOUT_ORDER.filter((b) => picks[b] != null).length;

  return (
    <div className="flex h-5 shrink-0 items-center gap-1.5">
      {BOUT_ORDER.map((bout, i) => {
        const settled = picks[bout] != null;
        const active = current === bout;
        return (
          <div key={bout} className="flex items-center gap-1.5">
            <span className="grid size-2.5 place-items-center">
              <motion.span
                animate={{ scale: active ? 1 : 0.6 }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 26 }}
                className={cn(
                  "block size-2.5 rounded-full",
                  settled || active ? "bg-ink" : "bg-rule",
                )}
              />
            </span>
            {(i === 3 || i === 5) && <span className="h-px w-3 bg-rule" />}
          </div>
        );
      })}
      <span className="tabular ml-1 w-8 shrink-0 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
        {current === "champion" ? "done" : `${done}/7`}
      </span>
    </div>
  );
}
