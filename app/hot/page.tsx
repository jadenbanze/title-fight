"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Masthead } from "@/components/site/masthead";
import { slugifyTitle } from "@/lib/normalize";
import { isValidSlug } from "@/lib/slug";

type HotTitle = { slug: string; display: string; score: number };

export default function HotPage() {
  const reduce = useReducedMotion();
  const [titles, setTitles] = useState<HotTitle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/hot")
      .then(async (res) => {
        const json = (await res.json()) as { titles?: HotTitle[]; error?: string };
        if (!res.ok) throw new Error(json.error || "Could not load titles.");
        setTitles(json.titles ?? []);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load titles."));
  }, []);

  const trimmed = query.trim();

  const results = useMemo(() => {
    if (!titles) return null;
    if (!trimmed) return titles;
    const needle = trimmed.toLowerCase();
    return titles
      .filter((title) => title.display.toLowerCase().includes(needle))
      // Names that start with the query are what you meant; substrings follow.
      .sort((a, b) => {
        const aStarts = a.display.toLowerCase().startsWith(needle) ? 0 : 1;
        const bStarts = b.display.toLowerCase().startsWith(needle) ? 0 : 1;
        return aStarts - bStarts;
      });
  }, [titles, trimmed]);

  /* Any title with eight versions works, not just the ones we ship — so an
     unknown search is an invitation rather than a dead end. */
  const customSlug = slugifyTitle(trimmed);
  const canTryCustom =
    trimmed.length > 0 &&
    isValidSlug(customSlug) &&
    !results?.some((title) => title.slug === customSlug);

  return (
    <main className="mx-auto flex h-full w-full max-w-2xl flex-col px-5">
      <Masthead>
        <span className="eyebrow">The index</span>
      </Masthead>

      <div className="shrink-0 border-t border-rule pt-3">
        <h1 className="font-serif-display text-[clamp(1.75rem,min(8vw,6vh),3rem)] leading-[1.05]">
          Pick your fight
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {titles ? `${titles.length} titles.` : "Loading the index."} Deezer draws the eight most
          popular songs sharing each name.
        </p>

        <div className="relative mt-3">
          <Search
            size={15}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a title, or type your own…"
            aria-label="Search titles"
            className="pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {trimmed && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-ink-faint transition-colors hover:text-ink"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-3 shrink-0 text-sm text-destructive">{error}</p>}

      <ul className="scroll-region mt-3 border-t border-rule">
        {!titles &&
          Array.from({ length: 10 }).map((_, i) => (
            <li key={i} className="border-b border-rule py-3.5">
              <Skeleton className="h-6 w-40" />
            </li>
          ))}

        {canTryCustom && (
          <li className="border-b border-rule">
            <Link
              href={`/t/${customSlug}`}
              className="group flex cursor-pointer items-baseline gap-4 py-3.5"
            >
              <span className="w-6 shrink-0 font-mono text-[11px] text-ink-faint">→</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif-display text-2xl leading-tight transition-transform duration-300 group-hover:translate-x-1">
                  {trimmed}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                  Try this title
                </span>
              </span>
              <ArrowUpRight size={15} className="shrink-0 text-ink-faint group-hover:text-ink" />
            </Link>
          </li>
        )}

        {results?.map((title, i) => (
          <motion.li
            key={title.slug}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.2), duration: 0.24 }}
            className="border-b border-rule"
          >
            <Link href={`/t/${title.slug}`} className="group flex cursor-pointer items-baseline gap-4 py-3.5">
              <span className="w-6 shrink-0 font-mono text-[11px] text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif-display text-2xl leading-tight transition-transform duration-300 group-hover:translate-x-1">
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

        {results?.length === 0 && !canTryCustom && (
          <li className="py-6 text-sm text-ink-soft">Nothing matches “{trimmed}”.</li>
        )}
      </ul>
    </main>
  );
}
