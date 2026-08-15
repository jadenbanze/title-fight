import { CARD_LANDSCAPE, renderShareCard } from "@/lib/share-card";
import { safeSlug } from "@/lib/slug";
import { resolveVerdict } from "@/lib/verdict";
import { fallbackCard } from "@/lib/og-fallback";

export const size = CARD_LANDSCAPE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; trackId: string }>;
}) {
  const { slug: rawSlug, trackId } = await params;
  const slug = safeSlug(rawSlug);
  const verdict = slug ? await resolveVerdict(slug, Number(trackId)) : null;

  // A preview crawler should never get an error page in place of an image.
  if (!verdict) return fallbackCard(slug ?? "");
  return renderShareCard(verdict, CARD_LANDSCAPE);
}
