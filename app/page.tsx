"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { loadTournaments, resumableTournament, seenTitleSlugs } from "@/lib/local-stats";

const WORDS = ["Baby", "Stay", "Halo", "Ghost", "Paradise", "Toxic"];

function Splash({ error }: { error: string | null }) {
  return (
    <main className="mx-auto flex h-full max-w-2xl flex-col justify-center px-5">
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="eyebrow"
      >
        Title Fight
      </motion.p>
      <h1 className="text-balance-display mt-2 font-serif-display text-[clamp(2.25rem,min(11vw,10vh),5rem)] leading-[0.9]">
        Same name.
        <br />
        <span className="italic text-ink-soft">Different song.</span>
      </h1>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {WORDS.map((word, i) => (
          <motion.span
            key={word}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.05, duration: 0.3 }}
            className="rounded-full border border-rule px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint"
          >
            {word}
          </motion.span>
        ))}
      </div>
      <p className="mt-6 text-[15px] text-ink-soft">{error ?? "Drawing your bracket…"}</p>
    </main>
  );
}

function HomeRedirect() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const extra = (search.get("exclude") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    /* Only a bracket with real progress is worth resuming; otherwise every
       visit should hand out a title they haven't played. */
    const unfinished = resumableTournament(loadTournaments(), { exclude: extra });
    if (unfinished) {
      router.replace(`/t/${unfinished.slug}`);
      return;
    }

    const exclude = [...new Set([...seenTitleSlugs(), ...extra])];
    const qs = exclude.length ? `?exclude=${exclude.join(",")}` : "";
    fetch(`/api/random${qs}`)
      .then(async (res) => {
        const json = (await res.json()) as { slug?: string; error?: string };
        if (!res.ok || !json.slug) throw new Error(json.error || "No titles ready yet.");
        router.replace(`/t/${json.slug}`);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Couldn’t pick a title."));
  }, [router, search]);

  return <Splash error={error} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<Splash error={null} />}>
      <HomeRedirect />
    </Suspense>
  );
}
