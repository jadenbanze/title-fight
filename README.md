# Title Fight

**Same name. Different song. Who does it better?**

Two songs called *Baby* have nothing in common except the word. Title Fight takes the eight
most popular tracks sharing a title, seeds them 1–8, and runs a single-elimination bracket.
You get 15 seconds of each, pick a winner, and crown a champion in about four minutes.

Then you send the link — your friends get the same eight songs and their own opinions.

```
Quarterfinals    1 v 8    4 v 5    2 v 7    3 v 6
Semifinals         winners advance
Final              one champion
```

No accounts, no database of users, no music library. Everything is drawn live from Deezer's
public API the moment you open a title.

---

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

That's it — no API keys, no configuration. Votes are stored in memory and reset when the
server restarts, so crowd percentages will look thin until you connect Redis (below).

Requires Node 22 (see `.nvmrc`) and pnpm.

## How it works

```
Browser ──── /t/baby ───────► Next.js ──── search ────► Deezer public API
   │                             │                      (no key required)
   │  album art + 15s preview    │
   ├──────── direct ─────────────┼───────────────────►  Deezer CDN
   │                             │
   └──── POST /api/vote ────────►│ ──── HINCRBY ─────►  Upstash Redis
                                                        (anonymous counters)
```

**A title is resolved server-side.** Opening `/t/baby` searches Deezer, filters to exact
title matches, dedupes by artist, and keeps the top eight by popularity. The field ships
inside the HTML — no client round trip, and a title with fewer than eight versions returns
a real 404.

**Matching is deliberately strict** (`lib/normalize.ts`). `Baby (feat. Ludacris)` counts as
*Baby*; `Baby (Acoustic Version)`, remixes, live cuts and `Baby Blue` do not. Otherwise a
bracket fills with eight versions of the same recording.

**Previews are never stored.** Deezer's URLs are signed and expire, so only track IDs are
kept and the URLs are re-resolved per request (cached 20 minutes). Audio streams straight
from Deezer's CDN to the browser — this app never proxies or caches it, and never plays
more than 15 seconds.

**A song is only new once.** Heard track IDs are remembered per tournament, so the semifinal
doesn't make you re-listen to something you judged in the quarters.

### Project layout

```
app/
  t/[slug]/          the tournament (server-resolves the field, generates the OG card)
  api/title          resolve the eight seeds for a title
  api/matchup        the current pair + a signed vote token
  api/vote           record a vote, return the crowd split
  api/hot            leaderboard of most-played titles
  api/random         pick a title to start
components/arena/    the game: cards, waveform, bracket rail, champion reveal
components/ui/       shadcn primitives (button, card, badge, skeleton)
lib/
  live-title.ts      Deezer search → eight seeds
  bracket.ts         seeding and bout progression (pure, unit-tested)
  normalize.ts       title matching rules (pure, unit-tested)
  audio.ts           single audio element, 15s clip, cross-fade
  redis.ts           vote counters, with an in-memory fallback
  vote-token.ts      HMAC signing of matchups
```

## Deployment

Deploys to Vercel's free tier as-is. Add a free
[Upstash Redis](https://console.upstash.com) database for global vote counts, then set:

| Variable | Required | Purpose |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | prod | Vote counters over HTTPS |
| `UPSTASH_REDIS_REST_TOKEN` | prod | ↳ |
| `VOTE_SECRET` | **prod** | HMAC key for vote tokens — build fails without it |
| `IP_HASH_SALT` | **prod** | Salts hashed IPs for rate limiting |
| `NEXT_PUBLIC_SITE_URL` | prod | Share links and OG images |

See `.env.example`. Generate secrets with `openssl rand -base64 32`.

A full bracket costs roughly 30 Redis commands, so Upstash's 10k/day free tier covers about
300 brackets a day.

### Vote storage

Three keys, no schema, no migrations:

| Key | Type | Purpose |
|---|---|---|
| `votes:{slug}:{loId}-{hiId}` | hash `{a, b}` | The tallies |
| `voted:{voterId}:{pairId}` | string, 180d TTL | One vote per person per pairing |
| `hot:titles` | sorted set | `/hot` leaderboard |

Pair IDs are ID-sorted, so *Bieber vs Prospa* is the same key regardless of which side it
rendered on — votes accumulate globally across everyone who plays that matchup.

## Security

- **Votes are signed.** `/api/matchup` issues an HMAC token naming the only two track IDs
  that may be voted for, and verifies both IDs are real seeds of that title. A crafted
  request can't invent a pairing or vote for a track that isn't in the bracket.
- **Production refuses weak secrets.** `VOTE_SECRET` and `IP_HASH_SALT` have development
  fallbacks for zero-config local runs; because those fallbacks are public (they're in this
  repo), the app throws on startup if they're used in production.
- **Rate limited.** 80 votes/hour and 30 title lookups/minute per hashed IP, so nobody can
  stuff the ballot or burn the Deezer and Redis quotas.
- **Inputs are bounded.** Title slugs must match `^[a-z0-9]+(?:-[a-z0-9]+)*$` and be ≤40
  characters before they reach a Deezer query or a Redis key.
- **No PII.** An anonymous `tf_vid` cookie (httpOnly, SameSite=Lax) and a salted IP hash.
  No accounts, no emails, no tracking. Streaks and brackets live in `localStorage`.
- **Security headers** in `next.config.ts`: an **enforced** Content-Security-Policy, HSTS,
  `nosniff`, `X-Frame-Options: DENY`, and a restrictive `Permissions-Policy`. The browser
  only ever talks to this origin plus Deezer's CDNs — everything server-side is proxied
  through our own routes. `'unsafe-eval'` and websocket origins are development-only.

One honest limitation: clearing cookies lets you vote on a pairing again. This is a toy, not
an election — the tallies are directional, not authoritative.

## Development

```bash
pnpm dev                  # Turbopack, service worker disabled
pnpm test                 # node:test — bracket, matching, tokens, slugs
pnpm lint
pnpm exec tsc --noEmit
pnpm build                # next build --webpack (emits public/sw.js)
```

The production build must run under webpack because Serwist's plugin hooks that pipeline;
`pnpm build` already does this. See `AGENTS.md` for environment gotchas (notably: Node's
`fetch` fails behind TLS-inspecting corporate proxies, so `lib/http.ts` falls back to curl).

## License

Source code is [MIT](./LICENSE).

Song metadata, artwork and audio previews come from the
[Deezer API](https://developers.deezer.com), belong to their rights holders, and are **not**
covered by that license — nothing is stored, and every card links back to the track on
Deezer. Title Fight is a fan project, not affiliated with Deezer.

Typeset in [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif), Inter and
JetBrains Mono, all under the SIL Open Font License. Full attribution in
[NOTICE.md](./NOTICE.md).
