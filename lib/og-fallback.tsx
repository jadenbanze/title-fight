import { ImageResponse } from "next/og";
import { unslugify } from "./normalize";
import { DISPLAY_FONT, displayFont } from "./og-font";
import { CARD_LANDSCAPE } from "./share-card";
import { getSiteHost } from "./site";

/**
 * Plain card for when a verdict can't be resolved — an unfurling crawler should
 * get the brand rather than a broken image.
 */
export async function fallbackCard(slug: string) {
  const display = slug ? unslugify(slug) : "Title Fight";

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
          padding: 56,
          fontFamily: DISPLAY_FONT,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 38, lineHeight: 1.1 }}>Title Fight</span>
          <span style={{ marginTop: 4, fontSize: 20, color: "#6F6558", letterSpacing: 1 }}>
            {getSiteHost()}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 96, lineHeight: 1 }}>{display}</span>
          <span style={{ marginTop: 24, fontSize: 30, color: "#6F6558" }}>
            Eight songs, one name. Who does it better?
          </span>
        </div>
      </div>
    ),
    {
      ...CARD_LANDSCAPE,
      fonts: [{ name: DISPLAY_FONT, data: await displayFont(), weight: 400, style: "normal" }],
    },
  );
}
