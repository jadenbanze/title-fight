"use client";

import { useState } from "react";
import { Check, ImageDown, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  slug: string;
  display: string;
  winnerId: number;
  championArtist: string;
  /** Absolute URL of this title's arena, e.g. https://host/t/money */
  titleUrl: string;
};

/**
 * Shares the result.
 *
 * Two separate actions on purpose. Passing `files` and `url` to navigator.share
 * together is not portable: some desktop implementations concatenate the URL,
 * the temporary file path and the text into one blob, which pastes as a dead
 * link. So the primary action shares a real page and nothing else, and saving
 * the image is its own button.
 */
export function ShareResult({ slug, display, winnerId, championArtist, titleUrl }: Props) {
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const resultUrl = `${titleUrl}/r/${winnerId}`;
  const text = `I crowned ${championArtist} the best song called “${display}”. What would you pick?`;

  const shareLink = async () => {
    // url only — the page carries its own preview image when it unfurls.
    if (navigator.share) {
      try {
        await navigator.share({ title: "Title Fight", text, url: resultUrl });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Fall through to the clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      toast.success("Link copied", { description: "It shows the result when pasted." });
    } catch {
      toast.error("Couldn’t copy", { description: resultUrl });
    }
  };

  const saveImage = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/share-card?slug=${encodeURIComponent(slug)}&w=${winnerId}`);
      if (!res.ok) throw new Error("card unavailable");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `title-fight-${slug}.png`;
      link.click();
      URL.revokeObjectURL(objectUrl);
      toast.success("Image saved");
    } catch {
      toast.error("Couldn’t build the image", { description: "The share link still works." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button type="button" onClick={shareLink}>
        {copied ? <Check /> : <Share2 />}
        {copied ? "Copied" : "Share result"}
      </Button>
      <Button type="button" variant="outline" onClick={saveImage} disabled={saving}>
        {saving ? <Loader2 className="animate-spin" /> : <ImageDown />}
        Save image
      </Button>
    </>
  );
}
