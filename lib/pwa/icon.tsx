import { ImageResponse } from "next/og";
import { DISPLAY_FONT, displayFont } from "@/lib/og-font";

/**
 * The "TF" monogram in Instrument Serif. One renderer for the favicon, the
 * Apple touch icon, and every PWA manifest size.
 */
export async function renderPwaIcon(size: number, opts: { maskable?: boolean } = {}) {
  const maskable = opts.maskable ?? false;
  // Maskable icons get clipped to a circle, so keep the mark inside the safe zone.
  const inner = Math.round(size * (maskable ? 0.66 : 0.94));
  // Generous cap height — the favicon has to survive being 16px in a tab strip.
  const fontSize = Math.round(inner * (maskable ? 0.56 : 0.64));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1F1A14",
        }}
      >
        <span
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize,
            color: "#F7F4ED",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          TF
        </span>
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: DISPLAY_FONT, data: await displayFont(), weight: 400, style: "normal" }],
    },
  );
}
