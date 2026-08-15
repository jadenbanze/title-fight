import { ImageResponse } from "next/og";
import { BOUT_ORDER, seedTracks } from "@/lib/bracket";
import { fetchImageDataUri } from "@/lib/http";
import { loadLiveTitle } from "@/lib/live-title";
import { DISPLAY_FONT, displayFont } from "@/lib/og-font";
import { clientIp, searchAllowed } from "@/lib/rate-limit";
import { safeSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

const WIDTH = 1080;
const HEIGHT = 1350; // 4:5 — the tallest crop Instagram and most feeds keep whole

/**
 * The image a player shares after crowning a champion.
 *
 * Everything on the card is derived server-side from the slug plus the winning
 * track id, and the winner is checked against the real seeds for that title.
 * Nothing renders text supplied by the caller, so this can't be used to put
 * arbitrary words on an image hosted under our domain.
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

  const title = await loadLiveTitle(slug).catch(() => null);
  if (!title) return new Response("Not found", { status: 404 });

  const seeds = seedTracks(title.tracks);
  const champion = seeds.find((track) => track.id === winnerId);
  if (!champion) return new Response("Not a seed of this title", { status: 400 });

  const [font, cover] = await Promise.all([
    displayFont(),
    champion.cover ? fetchImageDataUri(champion.cover) : Promise.resolve(null),
  ]);

  const seed = seeds.findIndex((track) => track.id === champion.id) + 1;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#F7F4ED",
          color: "#1F1A14",
          padding: 72,
          fontFamily: DISPLAY_FONT,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 40 }}>Title Fight</span>
          <span style={{ fontSize: 26, color: "#6F6558" }}>{BOUT_ORDER.length} bouts</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              width={520}
              height={520}
              style={{ borderRadius: 28, objectFit: "cover" }}
            />
          ) : null}
          <span style={{ marginTop: 44, fontSize: 30, color: "#6F6558", letterSpacing: 2 }}>
            MY CHAMPION OF “{title.display.toUpperCase()}”
          </span>
          <span
            style={{
              marginTop: 10,
              fontSize: champion.artist.length > 18 ? 76 : 104,
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            {champion.artist}
          </span>
          <span style={{ marginTop: 18, fontSize: 30, color: "#6F6558" }}>
            No. {seed} seed · beat {seeds.length - 1} other songs with the same name
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderTop: "2px solid #DDD6C8",
            paddingTop: 28,
          }}
        >
          <span style={{ fontSize: 28, color: "#6F6558" }}>Who would you pick?</span>
          <span style={{ fontSize: 28 }}>{`/t/${slug}`}</span>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [{ name: DISPLAY_FONT, data: font, weight: 400, style: "normal" }],
      headers: { "Cache-Control": "public, max-age=3600" },
    },
  );
}
