import { NextResponse } from "next/server";
import { slugifyTitle, unslugify } from "@/lib/normalize";
import { topTitles } from "@/lib/redis";
import { TITLE_SEEDS } from "@/lib/seeds";
import { isValidSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

/* Anyone can vote on a hand-typed slug, so the played set is unbounded in a way
   the seed list isn't. Cap the ranked portion; the catalogue below is always
   returned in full. */
const MAX_RANKED = 100;

export async function GET() {
  const ranked = await topTitles(MAX_RANKED);

  /* Slugs come back out of Redis — re-validate before echoing them as links. */
  const fromVotes = ranked
    .filter((row) => isValidSlug(row.slug))
    .map((row) => ({
      slug: row.slug,
      display: unslugify(row.slug),
      score: row.score,
    }));

  /* Every seed appears, so this page is the full index rather than a preview.
     Played titles lead, ranked by bouts; the rest follow in catalogue order. */
  const played = new Set(fromVotes.map((row) => row.slug));
  const rest = TITLE_SEEDS.map((seed) => ({
    slug: slugifyTitle(seed),
    display: seed,
    score: 0,
  })).filter((row) => !played.has(row.slug));

  return NextResponse.json({ titles: [...fromVotes, ...rest] });
}
