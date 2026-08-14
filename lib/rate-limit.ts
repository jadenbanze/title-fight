import { createHash } from "node:crypto";
import { incrRate } from "./redis";
import { requireSecret } from "./secrets";

const HOUR = 60 * 60;
const MINUTE = 60;
const VOTES_PER_HOUR = 80;
const SEARCHES_PER_MINUTE = 30;

/**
 * Best-effort client identity. On Vercel `x-forwarded-for` is set by the edge
 * and can't be spoofed by the client; behind a different proxy it could be, so
 * this is a speed bump for abuse, not an authentication boundary.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") || "unknown";
}

/** IPs are never stored raw — only a salted, truncated hash used as a counter key. */
export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${requireSecret("IP_HASH_SALT")}:${ip}`)
    .digest("hex")
    .slice(0, 24);
}

export type RateResult = { ok: true } | { ok: false; retryAfter: number };

export async function voteAllowed(ip: string): Promise<RateResult> {
  const count = await incrRate(`rl:vote:${hashIp(ip)}`, HOUR);
  if (count > VOTES_PER_HOUR) return { ok: false, retryAfter: HOUR };
  return { ok: true };
}

/**
 * Guards the endpoints that can trigger an upstream Deezer search, so a scripted
 * client can't burn the Deezer rate limit or the Redis free-tier quota.
 */
export async function searchAllowed(ip: string): Promise<RateResult> {
  const count = await incrRate(`rl:search:${hashIp(ip)}`, MINUTE);
  if (count > SEARCHES_PER_MINUTE) return { ok: false, retryAfter: MINUTE };
  return { ok: true };
}
