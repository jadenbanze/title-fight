import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Masthead } from "@/components/site/masthead";

export const metadata: Metadata = { title: "About" };

const RULES = [
  {
    n: "01",
    title: "Eight songs, one name",
    body: "Deezer’s search finds the most popular tracks sharing a title. The eight biggest get seeded 1 through 8.",
  },
  {
    n: "02",
    title: "Seven bouts",
    body: "1 plays 8, 4 plays 5, 2 plays 7, 3 plays 6. Winners advance through the semis to a final. No byes, no ties.",
  },
  {
    n: "03",
    title: "Fifteen seconds each",
    body: "Previews stream straight from Deezer. Hear both sides once — after that a song is yours to judge on memory.",
  },
  {
    n: "04",
    title: "Then argue",
    body: "Your link carries the title, not your picks. Friends get the same eight songs and their own opinions.",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto flex h-full w-full max-w-2xl flex-col px-5">
      <Masthead>
        <span className="eyebrow">How it works</span>
      </Masthead>

      <div className="shrink-0 border-t border-rule pt-3">
        <h1 className="text-balance-display font-serif-display text-[clamp(1.75rem,min(8vw,6vh),3rem)] leading-[0.95]">
          A bracket for songs that stole each other’s names
        </h1>
      </div>

      <div className="scroll-region mt-3">
        <ol className="border-t border-rule">
          {RULES.map((rule) => (
            <li key={rule.n} className="flex gap-4 border-b border-rule py-4">
              <span className="shrink-0 font-mono text-[11px] text-ink-faint">{rule.n}</span>
              <div>
                <h2 className="font-serif-display text-lg">{rule.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{rule.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          Previews and artwork belong to Deezer and stream from their CDN — nothing is stored here. Votes are
          anonymous counters, there are no accounts, and your streak lives in this browser only.
        </p>
      </div>

      <div className="shrink-0 border-t border-rule pt-3">
        <Button asChild>
          <Link href="/">Start a fight</Link>
        </Button>
      </div>
    </main>
  );
}
