"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Advances on its own after a beat so a seven-round bracket isn't seven extra
 * clicks. The fill is the countdown, so the jump is never a surprise, and
 * clicking (or any key) takes you there immediately.
 */
export function NextBoutButton({
  onNext,
  label,
  delayMs = 2900,
}: {
  onNext: () => void;
  label: string;
  delayMs?: number;
}) {
  const reduce = useReducedMotion();
  const fillRef = useRef<HTMLSpanElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const go = () => {
      if (fired.current) return;
      fired.current = true;
      onNext();
    };

    const timer = window.setTimeout(go, reduce ? delayMs * 1.5 : delayMs);
    const controls = fillRef.current
      ? animate(0, 1, {
          duration: (reduce ? delayMs * 1.5 : delayMs) / 1000,
          ease: "linear",
          onUpdate: (v) => {
            if (fillRef.current) fillRef.current.style.transform = `scaleX(${v})`;
          },
        })
      : null;

    return () => {
      window.clearTimeout(timer);
      controls?.stop();
    };
  }, [onNext, delayMs, reduce]);

  return (
    <button
      type="button"
      onClick={onNext}
      className={cn(
        "relative inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-full",
        "bg-ink px-4 text-[13px] font-medium text-paper transition-transform active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
      )}
    >
      <span
        ref={fillRef}
        aria-hidden
        className="absolute inset-0 origin-left bg-paper/20"
        style={{ transform: "scaleX(0)" }}
      />
      <span className="relative">{label}</span>
      <ArrowRight className="relative size-3.5" />
    </button>
  );
}
