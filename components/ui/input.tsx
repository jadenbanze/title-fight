import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-full border border-rule bg-transparent px-4 py-1 text-base",
        "transition-colors outline-none placeholder:text-ink-faint",
        "focus-visible:border-ink/40 focus-visible:ring-2 focus-visible:ring-ink/10",
        "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
