"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Masthead } from "@/components/site/masthead";

type HotTitle = { slug: string; display: string; score: number };

export default function HotPage() {
  const reduce = useReducedMotion();
  const [titles, setTitles] = useState<HotTitle[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hot")
      .then(async (res) => {
        const json = (await res.json()) as { titles?: HotTitle[]; error?: string };
        if (!res.ok) throw new Error(json.error || "Could not load titles.");
        setTitles(json.titles ?? []);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load titles."));
  }, []);

  return (
    <main className="mx-auto flex h-full w-full max-w-2xl flex-col px-5">
      <Masthead>
        <span className="eyebrow">The index</span>
      </Masthead>

      <div className="shrink-0 border-t border-rule pt-3">
        <h1 className="font-serif-display text-[clamp(1.75rem,min(8vw,6vh),3rem)] leading-[0.95]">
          Pick your fight
        </h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Deezer draws the eight most popular songs sharing the name.
        </p>
      </div>

      {error && <p className="mt-3 shrink-0 text-sm text-destructive">{error}</p>}

      <ul className="scroll-region mt-3 border-t border-rule">
        {!titles &&
          Array.from({ length: 10 }).map((_, i) => (
            <li key={i} className="border-b border-rule py-3.5">
              <Skeleton className="h-6 w-40" />
            </li>
          ))}
        {titles?.map((title, i) => (
          <motion.li
            key={title.slug}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.025, 0.25), duration: 0.26 }}
            className="border-b border-rule"
          >
            <Link href={`/t/${title.slug}`} className="group flex cursor-pointer items-baseline gap-4 py-3.5">
              <span className="w-6 shrink-0 font-mono text-[11px] text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif-display text-2xl transition-transform duration-300 group-hover:translate-x-1">
                  {title.display}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                {title.score > 0 ? `${title.score} ${title.score === 1 ? "bout" : "bouts"}` : "new"}
              </span>
              <ArrowUpRight
                size={15}
                className="shrink-0 text-ink-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-ink"
              />
            </Link>
          </motion.li>
        ))}
      </ul>
    </main>
  );
}
