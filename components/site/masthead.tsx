import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("nameplate cursor-pointer transition-opacity hover:opacity-70", className)}
    >
      Title&nbsp;Fight
    </Link>
  );
}

export function Masthead({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("flex h-12 shrink-0 items-center justify-between gap-4", className)}>
      <Wordmark />
      <div className="flex items-center gap-3">{children}</div>
    </header>
  );
}
