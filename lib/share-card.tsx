import { ImageResponse } from "next/og";
import { fetchImageDataUri } from "./http";
import { DISPLAY_FONT, displayFont } from "./og-font";
import { getShareLabel, getSiteHost } from "./site";
import type { Verdict } from "./verdict";

export const CARD_LANDSCAPE = { width: 1200, height: 630 };
export const CARD_PORTRAIT = { width: 1080, height: 1350 };

/**
 * The result card, used both as the link-preview image for a shared verdict and
 * as the PNG a player can save. Landscape is what chat apps and social crops
 * expect; portrait suits stories.
 */
export async function renderShareCard(
  verdict: Verdict,
  size: { width: number; height: number } = CARD_LANDSCAPE,
) {
  const portrait = size.height > size.width;
  const [font, cover] = await Promise.all([
    displayFont(),
    verdict.champion.cover ? fetchImageDataUri(verdict.champion.cover) : Promise.resolve(null),
  ]);

  const art = portrait ? 520 : 340;
  const nameSize = verdict.champion.artist.length > 18 ? (portrait ? 72 : 60) : portrait ? 104 : 82;
  const host = getSiteHost();
  const playUrl = getShareLabel(`/t/${verdict.slug}`);

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
          padding: portrait ? 72 : 56,
          fontFamily: DISPLAY_FONT,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: portrait ? 44 : 38, lineHeight: 1.1 }}>Title Fight</span>
            <span
              style={{
                marginTop: 4,
                fontSize: portrait ? 24 : 20,
                color: "#6F6558",
                letterSpacing: 1,
              }}
            >
              {host}
            </span>
          </div>
          <span style={{ fontSize: portrait ? 26 : 22, color: "#6F6558" }}>
            {verdict.seed ? `No. ${verdict.seed} seed` : "Champion"}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: portrait ? "column" : "row",
            alignItems: "center",
            gap: portrait ? 0 : 48,
          }}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              width={art}
              height={art}
              style={{ borderRadius: 24, objectFit: "cover" }}
            />
          ) : null}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: portrait ? "center" : "flex-start",
              marginTop: portrait ? 44 : 0,
              maxWidth: portrait ? "100%" : 700,
            }}
          >
            <span style={{ fontSize: portrait ? 30 : 26, color: "#6F6558", letterSpacing: 2 }}>
              BEST SONG CALLED “{verdict.display.toUpperCase()}”
            </span>
            <span
              style={{
                marginTop: 10,
                fontSize: nameSize,
                lineHeight: 1.1,
                textAlign: portrait ? "center" : "left",
              }}
            >
              {verdict.champion.artist}
            </span>
            <span style={{ marginTop: 16, fontSize: portrait ? 30 : 26, color: "#6F6558" }}>
              Beat {verdict.fieldSize - 1} other songs with the same name.
            </span>
          </div>
        </div>

        {/* The card outlives the link that carried it — someone screenshotting
            this needs the full address to find their way back. */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderTop: "2px solid #DDD6C8",
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: portrait ? 28 : 24, color: "#6F6558" }}>
            Settle it yourself at
          </span>
          <span style={{ fontSize: portrait ? 30 : 26 }}>{playUrl}</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: DISPLAY_FONT, data: font, weight: 400, style: "normal" }],
    },
  );
}
