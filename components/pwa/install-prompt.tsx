"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Menu, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt: () => Promise<void>;
}

const DISMISS_KEY = "tf:install-dismissed";
const DISMISS_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;
const MOBILE_QUERY = "(max-width: 767.98px)";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function wasRecentlyDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return Number.isFinite(ts) && Date.now() - ts < DISMISS_WINDOW_MS;
  } catch {
    return false;
  }
}

function rememberDismissal(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* private mode */
  }
}

function isInstallableIOSSafari(): boolean {
  const ua = window.navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;
  return !/CriOS|FxiOS|EdgiOS/.test(ua);
}

const IOS_STEPS = [
  { icon: Menu, title: "Open the menu", detail: "Tap Share, or the ••• button next to the address bar." },
  { icon: Share, title: "Tap Share", detail: "Open the share sheet." },
  { icon: SquarePlus, title: "Add to Home Screen", detail: "Swipe the actions and tap Add to Home Screen." },
  { icon: Check, title: "Tap Add", detail: "Confirm. Title Fight now lives on your home screen." },
];

export function InstallPrompt() {
  const [mode, setMode] = useState<"native" | "ios" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia(MOBILE_QUERY).matches) return;
    if (isStandalone()) return;
    if (wasRecentlyDismissed()) return;

    const iosTimer = window.setTimeout(() => {
      if (isInstallableIOSSafari()) setMode("ios");
    }, 0);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredRef.current = event as BeforeInstallPromptEvent;
      setMode("native");
    };
    const onInstalled = () => {
      rememberDismissal();
      deferredRef.current = null;
      setMode(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.clearTimeout(iosTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    rememberDismissal();
    setMode(null);
  };

  const install = async () => {
    const deferred = deferredRef.current;
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    deferredRef.current = null;
    rememberDismissal();
    setMode(null);
  };

  if (!mode) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Title Fight"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--nav-h)+var(--safe-bottom))] z-[60] flex justify-center px-3 pb-3"
    >
      <Card className="pointer-events-auto w-full max-w-md py-3 shadow-md">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0 px-4 py-0">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={mode === "ios" ? () => setExpanded((value) => !value) : undefined}
              className="w-full text-left"
            >
              <CardTitle className="flex items-center gap-1 text-sm">
                Install Title Fight
                {mode === "ios" && (
                  <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {mode === "native"
                  ? "Add it to your home screen."
                  : expanded
                    ? "Follow these steps in Safari:"
                    : "Add it to your home screen. Tap for steps."}
              </CardDescription>
            </button>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={dismiss} aria-label="Dismiss">
            <X />
          </Button>
        </CardHeader>
        {mode === "native" && (
          <CardContent className="flex gap-2 px-4">
            <Button type="button" onClick={install} className="flex-1">
              Install
            </Button>
            <Button type="button" variant="outline" onClick={dismiss}>
              Not now
            </Button>
          </CardContent>
        )}
        {mode === "ios" && expanded && (
          <CardContent className="space-y-2 px-4">
            {IOS_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-6 place-items-center rounded-full bg-secondary text-xs font-medium">
                    {i + 1}
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <Icon className="h-3.5 w-3.5" />
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
