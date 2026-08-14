"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { EMPTY_STATS, loadStats, subscribeLocal, type LocalStats } from "@/lib/local-stats";
import { Masthead } from "@/components/site/masthead";

function getStats(): LocalStats {
  return loadStats();
}

export default function YouPage() {
  const reduce = useReducedMotion();
  const stats = useSyncExternalStore(subscribeLocal, getStats, () => EMPTY_STATS);
  const agree = stats.fights === 0 ? 0 : Math.round((stats.crowdAgrees / stats.fights) * 100);

  return (
    <main className="mx-auto flex h-full w-full max-w-2xl flex-col px-5">
      <Masthead>
        <span className="eyebrow">Your record</span>
      </Masthead>

      <div className="shrink-0 border-t border-rule pt-3">
        <h1 className="font-serif-display text-[clamp(1.75rem,min(8vw,6vh),3rem)] leading-[0.95]">
          {stats.titlesCrowned === 0 ? "No crowns yet" : `${stats.titlesCrowned} crowned`}
        </h1>
      </div>

      <dl className="mt-4 grid shrink-0 grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-4 sm:grid-cols-4">
        {[
          { label: "Bouts judged", value: stats.fights },
          { label: "Streak", value: stats.streak },
          { label: "Best streak", value: stats.bestStreak },
          { label: "With the crowd", value: `${agree}%` },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.28 }}
          >
            <dt className="eyebrow">{stat.label}</dt>
            <dd className="tabular mt-0.5 font-serif-display text-[clamp(1.75rem,5vh,2.5rem)]">{stat.value}</dd>
          </motion.div>
        ))}
      </dl>

      <h2 className="eyebrow mt-5 shrink-0">Recent champions</h2>
      {stats.recents.length === 0 ? (
        <p className="mt-2 shrink-0 text-sm text-ink-soft">
          Finish a bracket and the winner gets written down here.
        </p>
      ) : (
        <ul className="scroll-region mt-2 border-t border-rule">
          {stats.recents.map((recent, i) => (
            <motion.li
              key={`${recent.slug}-${recent.at}`}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.25) }}
              className="border-b border-rule"
            >
              <Link
                href={`/t/${recent.slug}`}
                className="group flex cursor-pointer items-baseline justify-between gap-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate font-serif-display text-xl transition-transform duration-300 group-hover:translate-x-1">
                    {recent.display}
                  </span>
                  <span className="block truncate text-[13px] text-ink-soft">{recent.championArtist}</span>
                </span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                  {recent.agreed ? "with crowd" : "upset"}
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </main>
  );
}
