import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Arena } from "@/components/arena/arena";
import { loadLiveTitle } from "@/lib/live-title";
import { unslugify } from "@/lib/normalize";
import { getSiteUrl } from "@/lib/site";
import { safeSlug } from "@/lib/slug";
import type { CatalogTitle } from "@/lib/types";

/* The field comes from a live Deezer search, so this can't be prerendered. */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const display = unslugify(slug);
  return {
    title: display,
    description: `Who does “${display}” better? Eight songs from Deezer, one bracket.`,
    alternates: { canonical: `/t/${slug}` },
  };
}

export default async function TitlePage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = safeSlug(rawSlug);
  if (!slug) notFound();

  /* Resolve the eight seeds on the server: one fewer client round trip, the
     title ships inside the HTML, and a name with no bracket 404s properly.
     A thrown error means Deezer was unreachable, not that the title is bad —
     in that case hand off to the client, which retries and shows the error. */
  let initialTitle: CatalogTitle | null = null;
  let unreachable = false;
  try {
    initialTitle = await loadLiveTitle(slug);
  } catch (error) {
    console.error("[t/slug] field lookup failed", error);
    unreachable = true;
  }
  if (!initialTitle && !unreachable) notFound();

  return <Arena slug={slug} shareUrl={`${getSiteUrl()}/t/${slug}`} initialTitle={initialTitle} />;
}
