import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Masthead } from "@/components/site/masthead";
import { getSiteUrl } from "@/lib/site";
import { safeSlug } from "@/lib/slug";
import { titleScale } from "@/lib/typography";
import { resolveVerdict } from "@/lib/verdict";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; trackId: string }> };

async function load(params: Props["params"]) {
  const { slug: rawSlug, trackId } = await params;
  const slug = safeSlug(rawSlug);
  if (!slug) return null;
  return resolveVerdict(slug, Number(trackId));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const verdict = await load(params);
  if (!verdict) return { title: "Verdict" };

  const title = `${verdict.champion.artist} — best “${verdict.display}”`;
  return {
    title,
    description: `Someone crowned ${verdict.champion.artist} the best song called “${verdict.display}”. What would you pick?`,
    alternates: { canonical: `/t/${verdict.slug}/r/${verdict.champion.id}` },
    openGraph: {
      title,
      description: `Beat ${verdict.fieldSize - 1} other songs with the same name. What would you pick?`,
      url: `${getSiteUrl()}/t/${verdict.slug}/r/${verdict.champion.id}`,
    },
  };
}

export default async function VerdictPage({ params }: Props) {
  const verdict = await load(params);
  if (!verdict) notFound();

  const { champion, display, slug } = verdict;

  return (
    <main className="mx-auto flex h-full w-full max-w-2xl flex-col px-5">
      <Masthead>
        <span className="eyebrow">The verdict</span>
      </Masthead>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 border-t border-rule py-4 text-center sm:flex-row sm:gap-8 sm:text-left">
        {champion.cover ? (
          <div className="flex min-h-0 flex-1 items-center justify-center sm:flex-none">
            {/* Native img — next/image can't reach Deezer's CDN through a TLS proxy. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={champion.cover}
              alt=""
              width={500}
              height={500}
              className="aspect-square h-full max-h-full rounded-2xl border border-rule object-cover shadow-[0_20px_50px_-24px_rgba(30,20,10,0.6)] sm:h-auto sm:w-56"
            />
          </div>
        ) : null}

        <div className="flex shrink-0 flex-col items-center sm:items-start">
          <p className="eyebrow">
            Best song called “{display}”{verdict.seed ? ` · No. ${verdict.seed} seed` : ""}
          </p>
          <h1
            className="title-display font-serif-display mt-1"
            style={{ "--title-scale": titleScale(champion.artist) } as React.CSSProperties}
          >
            {champion.artist}
          </h1>
          <p className="mt-3 max-w-sm text-[15px] leading-snug text-ink-soft">
            A player put {champion.artist} through {verdict.fieldSize - 1} other songs with the same
            name to get here. Think they got it wrong?
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Button asChild>
              <Link href={`/t/${slug}`}>
                Run your own bracket
                <ArrowRight />
              </Link>
            </Button>
            {champion.deezerUrl && (
              <Button asChild variant="ghost" size="sm">
                <a href={champion.deezerUrl} target="_blank" rel="noreferrer">
                  Hear it on Deezer
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-rule pt-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          Eight songs, one name, seven bouts
        </p>
      </div>
    </main>
  );
}
