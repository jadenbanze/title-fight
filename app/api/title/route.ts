import { NextResponse } from "next/server";
import { loadLiveTitle } from "@/lib/live-title";
import { clientIp, searchAllowed } from "@/lib/rate-limit";
import { safeSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const slug = safeSlug(new URL(request.url).searchParams.get("slug"));
  if (!slug) return NextResponse.json({ error: "Invalid title." }, { status: 400 });

  const allowed = await searchAllowed(clientIp(request.headers));
  if (!allowed.ok) {
    return NextResponse.json(
      { error: "Slow down a moment." },
      { status: 429, headers: { "Retry-After": String(allowed.retryAfter) } },
    );
  }

  try {
    const title = await loadLiveTitle(slug);
    if (!title) {
      return NextResponse.json({ error: "Deezer doesn’t have eight versions of that title." }, { status: 404 });
    }
    return NextResponse.json(title);
  } catch (error) {
    console.error("[api/title] lookup failed", error);
    return NextResponse.json({ error: "Couldn’t reach Deezer. Try again." }, { status: 502 });
  }
}
