import { ImageResponse } from "next/og";
import { unslugify } from "@/lib/normalize";
import { DISPLAY_FONT, displayFont } from "@/lib/og-font";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const display = unslugify(slug);
  const font = await displayFont();

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
        }}
      >
        <div style={{ display: "flex", fontFamily: DISPLAY_FONT, fontSize: 44 }}>Title Fight</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: display.length > 14 ? 104 : 148,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {display}
          </div>
          <div style={{ marginTop: 28, fontFamily: DISPLAY_FONT, fontSize: 38, color: "#6F6558" }}>
            Eight songs, one name. Who does it better?
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: DISPLAY_FONT, data: font, weight: 400, style: "normal" }],
    },
  );
}
