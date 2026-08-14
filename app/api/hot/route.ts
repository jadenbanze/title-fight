import { NextResponse } from "next/server";
import { slugifyTitle, unslugify } from "@/lib/normalize";
import { topTitles } from "@/lib/redis";
import { TITLE_SEEDS } from "@/lib/seeds";
import { isValidSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET() {
  const ranked = await topTitles(16);
  /* Slugs come back out of Redis — re-validate before echoing them as links. */
  const fromVotes = ranked
    .filter((row) => isValidSlug(row.slug))
    .map((row) => ({
      slug: row.slug,
      display: unslugify(row.slug),
      score: row.score,
    }));
  const extras = TITLE_SEEDS.filter(
    (seed) => !fromVotes.some((row) => row.slug === slugifyTitle(seed)),
  )
    .slice(0, Math.max(0, 16 - fromVotes.length))
    .map((seed) => ({ slug: slugifyTitle(seed), display: seed, score: 0 }));
  return NextResponse.json({ titles: [...fromVotes, ...extras] });
}
