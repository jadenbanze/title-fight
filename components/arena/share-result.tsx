"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  slug: string;
  display: string;
  winnerId: number;
  championArtist: string;
  shareUrl: string;
};

/**
 * Shares the result as an image.
 *
 * The card is rendered server-side (see /api/share-card) rather than screenshot
 * in the browser: no canvas rasterising of live DOM, no tainted-canvas problem
 * from the cross-origin album art, and the output is identical on every device.
 *
 * Where the Web Share API can carry files — essentially all mobile — this hands
 * the PNG straight to the share sheet. Desktop browsers mostly can't, so it
 * falls back to downloading the image and copying the link.
 */
export function ShareResult({ slug, display, winnerId, championArtist, shareUrl }: Props) {
  const [busy, setBusy] = useState(false);

  const text = `${championArtist} won my “${display}” bracket. Who would you pick?`;

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/share-card?slug=${encodeURIComponent(slug)}&w=${winnerId}`);
      if (!res.ok) throw new Error("card unavailable");
      const blob = await res.blob();
      const file = new File([blob], `title-fight-${slug}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, url: shareUrl });
        return;
      }

      // No file sharing here — save the image and put the link on the clipboard.
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(objectUrl);

      await navigator.clipboard.writeText(`${text} ${shareUrl}`).catch(() => undefined);
      toast.success("Image saved", { description: "Caption and link copied too." });
    } catch (error) {
      // A cancelled share sheet is a normal outcome, not a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Couldn’t build the image", { description: "The link still works." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" onClick={share} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <Share2 />}
      Share result
    </Button>
  );
}
