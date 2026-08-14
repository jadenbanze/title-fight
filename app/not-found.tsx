import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex h-full max-w-2xl flex-col justify-center px-5">
      <p className="eyebrow">No contest</p>
      <h1 className="mt-2 font-serif-display text-[clamp(2rem,min(9vw,8vh),3.75rem)] leading-[0.95]">
        Not enough songs by that name
      </h1>
      <p className="mt-3 max-w-md text-[15px] text-ink-soft">
        A bracket needs eight. Deezer came up short — try another title.
      </p>
      <Button asChild className="mt-6 self-start">
        <Link href="/">Pick another</Link>
      </Button>
    </main>
  );
}
