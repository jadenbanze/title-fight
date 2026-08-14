/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Routes that must bypass the cache entirely, ordered ahead of `defaultCache`
 * because the first matching route wins.
 *
 * `defaultCache` ends with a catch-all plus a `!sameOrigin` NetworkFirst rule,
 * so without these it would happily cache Deezer artwork, preview audio and our
 * own API payloads. All three are wrong to store:
 *
 * - Deezer preview URLs are signed and expire. A cached response becomes a 403
 *   the next time it's served, and range requests through a caching strategy
 *   break seeking on audio besides.
 * - /api/title and /api/matchup embed those expiring URLs, so a stale payload
 *   hands the player dead links.
 * - Votes must never be replayed from a cache.
 */
const networkOnlyRoutes: RuntimeCaching[] = [
  {
    matcher: ({ url }) => url.hostname === "dzcdn.net" || url.hostname.endsWith(".dzcdn.net"),
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...networkOnlyRoutes, ...defaultCache],
});

serwist.addEventListeners();
