import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Instrument Serif as raw TTF, for next/og (satori) — it can't read woff2 and
 * has no access to the CSS font stack, so the mark has to be drawn from a real
 * font file. Server-only: this never ships to the browser.
 */
let cached: Promise<ArrayBuffer> | null = null;

export const DISPLAY_FONT = "Instrument Serif";

export function displayFont(): Promise<ArrayBuffer> {
  if (!cached) {
    cached = readFile(join(process.cwd(), "assets/fonts/InstrumentSerif-Regular.ttf")).then((buf) =>
      // Copy out of the Buffer's pool so satori gets an exact-length view.
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    );
  }
  return cached;
}
