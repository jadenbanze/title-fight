"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Flame, Info, Swords, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Fight", icon: Swords, match: (p: string) => p === "/" || p.startsWith("/t/") },
  { href: "/hot", label: "Titles", icon: Flame, match: (p: string) => p.startsWith("/hot") },
  { href: "/you", label: "You", icon: User, match: (p: string) => p.startsWith("/you") },
  { href: "/about", label: "About", icon: Info, match: (p: string) => p.startsWith("/about") },
];

/**
 * Floating command dock. Not a full-width bar — a compact pill that sits above
 * the safe area, with a single ink "puck" that slides between items via a
 * shared layoutId (transform-only, so it stays smooth on cheap phones).
 */
export function Dock() {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4"
      style={{ paddingBottom: "calc(var(--safe-bottom) + var(--dock-gap))" }}
    >
      <motion.nav
        initial={reduce ? false : { y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="pointer-events-auto flex h-[var(--dock-h)] items-center gap-1 rounded-full border border-rule/80 bg-paper-2/80 px-1.5 shadow-[0_10px_30px_-12px_rgba(30,20,10,0.35)] backdrop-blur-xl"
      >
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-10 cursor-pointer items-center gap-2 rounded-full px-3.5 transition-colors duration-200 sm:px-4",
                active ? "text-paper" : "text-ink-soft hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId="dock-puck"
                  className="absolute inset-0 -z-10 rounded-full bg-ink"
                  transition={
                    reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34, mass: 0.7 }
                  }
                />
              )}
              <Icon size={16} strokeWidth={active ? 2.4 : 1.9} className="shrink-0" />
              <AnimatePresence initial={false}>
                {active && (
                  <motion.span
                    key="label"
                    initial={reduce ? false : { width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="overflow-hidden whitespace-nowrap text-[13px] font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}
