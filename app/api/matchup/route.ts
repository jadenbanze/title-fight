import { NextResponse } from "next/server";
import { BOUT_ORDER, pairIdFor, seedTracks } from "@/lib/bracket";
import { getOrCreateVoterId } from "@/lib/cookies";
import { liveTracks, loadLiveTitle } from "@/lib/live-title";
import { clientIp, searchAllowed } from "@/lib/rate-limit";
import { safeSlug } from "@/lib/slug";
import type { BoutId } from "@/lib/types";
import { issueVoteToken } from "@/lib/vote-token";

export const dynamic = "force-dynamic";

function safeBout(raw: string | null): BoutId | null {
  return BOUT_ORDER.includes(raw as BoutId) ? (raw as BoutId) : null;
}

function safeTrackId(raw: string | null): number | null {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = safeSlug(url.searchParams.get("slug"));
  const boutId = safeBout(url.searchParams.get("bout"));
  const a = safeTrackId(url.searchParams.get("a"));
  const b = safeTrackId(url.searchParams.get("b"));

  if (!slug || !boutId || !a || !b || a === b) {
    return NextResponse.json({ error: "Invalid matchup request." }, { status: 400 });
  }

  const allowed = await searchAllowed(clientIp(request.headers));
  if (!allowed.ok) {
    return NextResponse.json(
      { error: "Slow down a moment." },
      { status: 429, headers: { "Retry-After": String(allowed.retryAfter) } },
    );
  }

  await getOrCreateVoterId();

  try {
    const title = await loadLiveTitle(slug);
    if (!title) {
      return NextResponse.json({ error: "Deezer doesn’t have eight versions of that title." }, { status: 404 });
    }

    /* Both ids must be seeds of this title — that's what stops a crafted request
       from minting a vote token for an arbitrary pair of tracks. */
    const seeds = seedTracks(title.tracks);
    if (!seeds.some((t) => t.id === a) || !seeds.some((t) => t.id === b)) {
      return NextResponse.json({ error: "Those tracks are not in this bracket." }, { status: 400 });
    }

    const hydrated = liveTracks(title, a, b);
    if (!hydrated) {
      return NextResponse.json({ error: "A preview is missing. Skip this title." }, { status: 502 });
    }

    const pairId = pairIdFor(title.slug, a, b);
    const token = issueVoteToken({ pairId, a, b, slug: title.slug, boutId });

    return NextResponse.json({
      pairId,
      boutId,
      title: { slug: title.slug, display: title.display, tracks: title.tracks },
      token,
      tracks: hydrated,
    });
  } catch (error) {
    console.error("[api/matchup] lookup failed", error);
    return NextResponse.json({ error: "Couldn’t reach Deezer. Try again." }, { status: 502 });
  }
}
