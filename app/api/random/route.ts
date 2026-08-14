import { NextResponse } from "next/server";
import { slugifyTitle } from "@/lib/normalize";
import { randomSeed } from "@/lib/seeds";
import { MAX_SLUG_LENGTH } from "@/lib/slug";

export const dynamic = "force-dynamic";

const MAX_EXCLUDE = 60;

export async function GET(request: Request) {
  const exclude = (new URL(request.url).searchParams.get("exclude") ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0 && item.length <= MAX_SLUG_LENGTH)
    .slice(0, MAX_EXCLUDE);
  const seed = randomSeed(exclude);
  return NextResponse.json({ slug: slugifyTitle(seed), display: seed });
}
