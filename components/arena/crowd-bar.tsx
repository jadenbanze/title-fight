"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import type { CrowdSplit } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Ticks a percentage up from 0 by writing textContent — no React re-renders. */
function Percent({ value, reduce }: { value: number; reduce: boolean | null }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) {
      node.textContent = `${value}%`;
      return;
    }
    const controls = animate(0, value, {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = `${Math.round(latest)}%`;
      },
    });
    return () => controls.stop();
  }, [value, reduce]);

  return <span ref={ref} className="tabular font-mono text-xs" />;
}

/**
 * The crowd split, and optionally the action that follows it.
 *
 * `action` is rendered as a sibling of the bars rather than of the whole
 * component on purpose: the artist labels sit on their own line above, so
 * centering a button against the full block would align it with the labels and
 * leave it floating above the meter. Sharing the bar's row is what keeps them on
 * the same horizontal line.
 */
export function CrowdBar({
  crowd,
  you,
  labelA,
  labelB,
  action,
}: {
  crowd: CrowdSplit;
  you?: "a" | "b";
  labelA: string;
  labelB: string;
  action?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const total = crowd.a + crowd.b;

  return (
    <div className="flex w-full flex-col justify-center gap-1.5">
      <div className="collapse-short flex items-baseline justify-between gap-3">
        <p className={cn("min-w-0 truncate text-xs", you === "a" ? "font-medium text-ink" : "text-ink-soft")}>
          {labelA}
          {you === "a" && " · your pick"}
        </p>
        <p className="eyebrow shrink-0">
          {total} {total === 1 ? "vote" : "votes"}
        </p>
        <p
          className={cn(
            "min-w-0 truncate text-right text-xs",
            you === "b" ? "font-medium text-ink" : "text-ink-soft",
          )}
        >
          {you === "b" && "your pick · "}
          {labelB}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-7 min-w-0 flex-1 items-stretch gap-1">
          <motion.div
            className="flex items-center justify-start overflow-hidden rounded-md bg-side-a/90 px-2.5 text-paper"
            initial={reduce ? false : { flexGrow: 1 }}
            animate={{ flexGrow: Math.max(crowd.aPct, 6) }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
          >
            <Percent value={crowd.aPct} reduce={reduce} />
          </motion.div>
          <motion.div
            className="flex items-center justify-end overflow-hidden rounded-md bg-side-b/90 px-2.5 text-paper"
            initial={reduce ? false : { flexGrow: 1 }}
            animate={{ flexGrow: Math.max(crowd.bPct, 6) }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
          >
            <Percent value={crowd.bPct} reduce={reduce} />
          </motion.div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
