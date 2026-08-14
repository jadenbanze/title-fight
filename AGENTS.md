# AGENTS.md

Operational notes for Title Fight. Keep this current when you learn something
that would save the next person (or agent) time.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
- **Live Deezer public API** — no key, no local song catalog
- Upstash Redis over HTTPS for anonymous vote counters (optional in local dev)
- motion (Framer Motion) for animation, sonner for toasts, shadcn/ui primitives
- Serwist PWA (`next build --webpack`; the service worker is disabled in `next dev`)
- Package manager: **pnpm**. Node 22 (`.nvmrc`)

## Commands

```bash
pnpm install
pnpm dev                  # Turbopack
pnpm build                # next build --webpack (required: Serwist needs webpack)
pnpm lint
pnpm test                 # node:test via tsx
pnpm exec tsc --noEmit
pnpm verify:seeds         # audit lib/seeds.ts against live Deezer
pnpm verify:seeds Rain Fever   # check candidates before adding them
```

## Verification checklist

```bash
pnpm test && pnpm lint && pnpm exec tsc --noEmit && pnpm build
```

## Environment gotchas

### 1. Node `fetch` fails behind this network's TLS proxy
Symptom: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` on any outbound HTTPS call. `curl`
works because it uses the system trust store. `lib/http.ts` detects this and
falls back to `curl` (via `execFile`, no shell). If curl is unavailable it
rethrows the original error, so deployed environments are unaffected.

Consequence: **do not use `next/image` for Deezer artwork.** It proxies through
the Node server and dies on the same TLS interception. Covers are plain `<img>`
straight to `cdn-images.dzcdn.net`, which the browser fetches with its own certs.

### 2. This network blocks the PostgreSQL wire protocol
Ports 5432/6543 get a TCP handshake then an immediate reset. Don't introduce a
Postgres client — vote storage is HTTPS-only (Upstash REST). Local dev works with
no Redis at all: `lib/redis.ts` falls back to a process-level `Map`.

### 3. Font CSS variables must be declared on `<html>`
`next/font` defines `--font-*` on whatever element gets its generated class. The
theme in `globals.css` declares `--font-serif: var(--font-instrument), …` on
`:root`, and a custom property can only reference variables visible **at its own
level**. Putting the font classes on `<body>` silently resolves the stack to
invalid and everything falls back to the default sans. They live on `<html>`.

### 4. Instrument Serif ships a single 400 weight
Never set `font-weight: 600/700` on `.font-serif-display` or `.nameplate` — the
browser synthesises faux-bold and smears the thin strokes. Emphasis comes from
size and tracking.

### 5. A service worker fetch is `connect-src`, not `img-src`
Serwist's `defaultCache` ends with a `!sameOrigin` NetworkFirst rule and a
catch-all, so in production the worker intercepts every Deezer request and
re-issues it with `fetch()`. A fetch from inside a worker is governed by
**`connect-src`** regardless of what it returns, so Deezer must be listed there
as well as in `img-src`/`media-src`. Miss it and artwork loads in dev (worker
disabled) and silently fails in production — the one combination local testing
never covers.

`app/sw.ts` also registers `NetworkOnly` routes for `*.dzcdn.net` and `/api/*`
**ahead of** `defaultCache` (first match wins), so signed preview URLs and the
payloads embedding them are never cached.

### 6. next/og can't read woff2
`assets/fonts/InstrumentSerif-Regular.ttf` is vendored so satori can draw the
"TF" monogram and OG cards. It's server-only and force-included in the
deployment trace via `outputFileTracingIncludes` (the `fs.readFile` path isn't
statically analysable).

## Product rules

- **Every word in `lib/seeds.ts` must yield eight different artists on Deezer.**
  Fewer and `/t/<slug>` 404s, so the random picker and /hot hand out dead
  titles. Never add a seed by intuition — run `pnpm verify:seeds <Word>` first.
  A no-argument run audits the whole shipped list and exits non-zero on any
  failure. Note it is a live network check, so it belongs in review, not CI.
- A title is an 8-seed single-elim bracket: 1v8, 4v5, 2v7, 3v6.
- Never persist Deezer preview URLs — they're signed and expire. Store IDs.
- Never proxy or cache the MP3s. The browser streams them from Deezer directly.
- Clip playback at 15.0s even though Deezer's files are ~30s.
- Call Deezer only from the server.
- A song only has to be heard once per tournament (`heard` in localStorage).

## Layout invariants

The whole game fits one viewport — `html, body { overflow: hidden }` and
`.app-shell` is `100dvh` minus the dock. Pages that can overflow use
`.scroll-region` for an inner scroller, never document scroll.

Anything that changes between bouts must have a **fixed height**, or `flex-1`
recalculates and the album art visibly resizes. Specifically: the footer is a
fixed-height 1×1 grid with both states in the same cell, the artist name block
is `h-11`, and the round/rail row is `h-5`. Bout transitions animate `opacity`
and `scale` only — never `y` or layout.

## Security invariants

- `VOTE_SECRET` / `IP_HASH_SALT` throw in production if unset or left at their
  dev fallbacks (`lib/secrets.ts`). Don't add a silent default.
- `/api/matchup` must verify both track IDs are seeds of the requested title
  before issuing a token — that check is what prevents forged pairings.
- Slugs reach Deezer queries and Redis keys, so they go through
  `safeSlug`/`isValidSlug` (`lib/slug.ts`) first. Keep them bounded.
- Upstream error text is logged server-side and replaced with a generic message
  in responses.
