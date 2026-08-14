import { cn } from "@/lib/utils";

const BAR_COUNT = 28;

function barsFor(seed: number): number[] {
  const out: number[] = [];
  let x = seed || 1;
  for (let i = 0; i < BAR_COUNT; i += 1) {
    x = (x * 1664525 + 1013904223) >>> 0;
    out.push(0.24 + (x % 76) / 100);
  }
  return out;
}

/**
 * Deterministic bar waveform. Bars left of the playhead stay lit; the whole set
 * dances only while audio is playing (scaleY — compositor only).
 */
export function Waveform({
  seed,
  active,
  progress,
  className,
}: {
  seed: number;
  active: boolean;
  progress: number;
  className?: string;
}) {
  const bars = barsFor(seed);
  const played = Math.min(1, Math.max(0, progress));

  return (
    <div className={cn("flex h-full w-full items-end gap-[2px]", className)} aria-hidden>
      {bars.map((height, i) => {
        const lit = i / BAR_COUNT <= played;
        return (
          <span
            key={i}
            className={cn(
              "inline-block min-w-px flex-1 rounded-full bg-current transition-opacity duration-300",
              active && "eq-bar",
              lit ? "opacity-95" : active ? "opacity-45" : "opacity-25",
            )}
            style={{
              height: `${height * 100}%`,
              animationDelay: `${(i % 9) * 65}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
