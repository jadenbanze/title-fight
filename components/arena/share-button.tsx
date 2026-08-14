"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({
  url,
  label = "Copy link",
  variant = "outline",
}: {
  url: string;
  label?: string;
  variant?: "outline" | "default" | "ghost";
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    toast.success("Link copied", { description: "They get the same eight songs." });
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Button type="button" variant={variant} onClick={copy}>
      {copied ? <Check /> : <Link2 />}
      {copied ? "Copied" : label}
    </Button>
  );
}
