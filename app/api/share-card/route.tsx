import { CARD_PORTRAIT, renderShareCard } from "@/lib/share-card";
import { clientIp, searchAllowed } from "@/lib/rate-limit";
import { safeSlug } from "@/lib/slug";
import { resolveVerdict } from "@/lib/verdict";

export const dynamic = "force-dynamic";

/**
 * The saveable version of the result card, in a 4:5 crop for stories. Link
 * previews use the landscape one at /t/[slug]/r/[trackId]/opengraph-image.
 *
 * The winner is resolved and validated server-side, so this can't be used to
 * caption an arbitrary track as the winner of an arbitrary title.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = safeSlug(url.searchParams.get("slug"));
  const winnerId = Number(url.searchParams.get("w"));

  if (!slug || !Number.isSafeInteger(winnerId) || winnerId <= 0) {
    return new Response("Bad request", { status: 400 });
  }

  const allowed = await searchAllowed(clientIp(request.headers));
  if (!allowed.ok) return new Response("Slow down", { status: 429 });

  const verdict = await resolveVerdict(slug, winnerId);
  if (!verdict) return new Response("Not found", { status: 404 });

  return renderShareCard(verdict, CARD_PORTRAIT);
}
