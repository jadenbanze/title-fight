import { createHmac, timingSafeEqual } from "node:crypto";
import { requireSecret } from "./secrets";

export type VoteTokenPayload = {
  pairId: string;
  a: number;
  b: number;
  slug: string;
  boutId: string;
  exp: number;
};

function sign(body: string): string {
  return createHmac("sha256", requireSecret("VOTE_SECRET")).update(body).digest("base64url");
}

export function issueVoteToken(payload: Omit<VoteTokenPayload, "exp">, ttlMs = 2 * 60 * 60 * 1000): string {
  const full: VoteTokenPayload = { ...payload, exp: Date.now() + ttlMs };
  const body = Buffer.from(JSON.stringify(full), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyVoteToken(token: string): VoteTokenPayload | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as VoteTokenPayload;
    if (!payload.pairId || !payload.a || !payload.b || !payload.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
