import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("shimmer rounded-lg border border-rule/60 bg-ink/[0.04]", className)}
      {...props}
    />
  );
}

export { Skeleton };
