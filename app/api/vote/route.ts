import { NextResponse } from "next/server";
import { getOrCreateVoterId } from "@/lib/cookies";
import { clientIp, voteAllowed } from "@/lib/rate-limit";
import { bumpHotTitle, getVotes, incrVote, markSeen } from "@/lib/redis";
import { verifyVoteToken } from "@/lib/vote-token";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2_000;

export async function POST(request: Request) {
  const voterId = await getOrCreateVoterId();

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  let body: { token?: unknown; winnerId?: unknown };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad JSON." }, { status: 400 });
  }

  /* The token is HMAC-signed server-side and names the only two track ids that
     may be voted for, so the client can't invent a pairing or a winner. */
  const payload = typeof body.token === "string" ? verifyVoteToken(body.token) : null;
  if (!payload) {
    return NextResponse.json({ error: "That fight expired. Reload." }, { status: 400 });
  }

  const winnerId = Number(body.winnerId);
  const side = winnerId === payload.a ? "a" : winnerId === payload.b ? "b" : null;
  if (!side) {
    return NextResponse.json({ error: "Winner must be one of the two tracks." }, { status: 400 });
  }

  const allowed = await voteAllowed(clientIp(request.headers));
  if (!allowed.ok) {
    return NextResponse.json(
      { error: "Easy, champ. Come back in an hour." },
      { status: 429, headers: { "Retry-After": String(allowed.retryAfter) } },
    );
  }

  try {
    /* One tally per voter per pairing; repeat votes just read the current split. */
    const first = await markSeen(`voted:${voterId}:${payload.pairId}`, 180 * 24 * 60 * 60);
    const crowd = first ? await incrVote(payload.pairId, side) : await getVotes(payload.pairId);
    if (first) await bumpHotTitle(payload.slug);

    return NextResponse.json({ pairId: payload.pairId, you: side, first, crowd });
  } catch (error) {
    console.error("[api/vote] store failed", error);
    return NextResponse.json({ error: "Couldn’t record that vote." }, { status: 502 });
  }
}
