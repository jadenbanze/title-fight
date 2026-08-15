import { Redis } from "@upstash/redis";
import type { CrowdSplit } from "./types";

type MemoryStore = {
  hashes: Map<string, Record<string, number>>;
  kv: Map<string, { value: string; exp?: number }>;
  zsets: Map<string, Map<string, number>>;
};

const g = globalThis as typeof globalThis & { __tfMemory?: MemoryStore };

function memory(): MemoryStore {
  if (!g.__tfMemory) {
    g.__tfMemory = { hashes: new Map(), kv: new Map(), zsets: new Map() };
  }
  return g.__tfMemory;
}

function hasUpstash(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function redis(): Redis | null {
  if (!hasUpstash()) return null;
  return Redis.fromEnv();
}

const warned = new Set<string>();

/**
 * Runs an operation against Upstash, falling back to the in-process store if
 * the call fails.
 *
 * Redis here holds crowd counters and a search cache — both optional. Letting a
 * rejection escape would mean an Upstash outage, an exhausted free-tier quota,
 * or a single network blip takes down the whole game: `cacheGet` feeds
 * `loadLiveTitle`, so every title page would 502 over votes nobody can see.
 * Degrading to memory keeps the bracket playable; the tallies are the only
 * thing that suffers.
 */
async function withFallback<T>(
  operation: string,
  remote: (client: Redis) => Promise<T>,
  local: () => T,
): Promise<T> {
  const client = redis();
  if (client) {
    try {
      return await remote(client);
    } catch (error) {
      if (!warned.has(operation)) {
        warned.add(operation);
        console.error(`[redis] ${operation} failed, using in-memory fallback`, error);
      }
    }
  }
  return local();
}

function expired(exp?: number): boolean {
  return exp != null && Date.now() > exp;
}

export async function cacheGet(key: string): Promise<string | null> {
  return withFallback(
    "cacheGet",
    (client) => client.get<string>(key),
    () => {
      const hit = memory().kv.get(key);
      if (!hit || expired(hit.exp)) {
        if (hit) memory().kv.delete(key);
        return null;
      }
      return hit.value;
    },
  );
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  return withFallback(
    "cacheSet",
    async (client) => {
      await client.set(key, value, { ex: ttlSeconds });
    },
    () => {
      memory().kv.set(key, { value, exp: Date.now() + ttlSeconds * 1000 });
    },
  );
}

export async function markSeen(key: string, ttlSeconds: number): Promise<boolean> {
  return withFallback(
    "markSeen",
    async (client) => (await client.set(key, "1", { nx: true, ex: ttlSeconds })) === "OK",
    () => {
      if (memory().kv.has(key) && !expired(memory().kv.get(key)?.exp)) return false;
      memory().kv.set(key, { value: "1", exp: Date.now() + ttlSeconds * 1000 });
      return true;
    },
  );
}

export async function incrVote(pairId: string, side: "a" | "b"): Promise<CrowdSplit> {
  const key = `votes:${pairId}`;
  return withFallback(
    "incrVote",
    async (client) => {
      const count = await client.hincrby(key, side, 1);
      const other = Number((await client.hget<number | string>(key, side === "a" ? "b" : "a")) ?? 0);
      return split(side === "a" ? count : other, side === "b" ? count : other);
    },
    () => {
      const current = memory().hashes.get(key) ?? { a: 0, b: 0 };
      current[side] = (current[side] ?? 0) + 1;
      memory().hashes.set(key, current);
      return split(current.a ?? 0, current.b ?? 0);
    },
  );
}

export async function getVotes(pairId: string): Promise<CrowdSplit> {
  const key = `votes:${pairId}`;
  return withFallback(
    "getVotes",
    async (client) => {
      const data = await client.hgetall<Record<string, number | string>>(key);
      return split(Number(data?.a ?? 0), Number(data?.b ?? 0));
    },
    () => {
      const current = memory().hashes.get(key) ?? { a: 0, b: 0 };
      return split(current.a ?? 0, current.b ?? 0);
    },
  );
}

export async function bumpHotTitle(slug: string): Promise<void> {
  return withFallback(
    "bumpHotTitle",
    async (client) => {
      await client.zincrby("hot:titles", 1, slug);
    },
    () => {
      const z = memory().zsets.get("hot:titles") ?? new Map();
      z.set(slug, (z.get(slug) ?? 0) + 1);
      memory().zsets.set("hot:titles", z);
    },
  );
}

export async function topTitles(limit = 20): Promise<{ slug: string; score: number }[]> {
  return withFallback(
    "topTitles",
    async (client) => {
      const rows = await client.zrange<string[]>("hot:titles", 0, limit - 1, {
        rev: true,
        withScores: true,
      });
      const out: { slug: string; score: number }[] = [];
      for (let i = 0; i < rows.length; i += 2) {
        out.push({ slug: String(rows[i]), score: Number(rows[i + 1]) });
      }
      return out;
    },
    () => {
      const z = memory().zsets.get("hot:titles") ?? new Map();
      return [...z.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([slug, score]) => ({ slug, score }));
    },
  );
}

export async function incrRate(key: string, windowSeconds: number): Promise<number> {
  return withFallback(
    "incrRate",
    async (client) => {
      const count = await client.incr(key);
      if (count === 1) await client.expire(key, windowSeconds);
      return count;
    },
    () => {
      const hit = memory().kv.get(key);
      if (!hit || expired(hit.exp)) {
        memory().kv.set(key, { value: "1", exp: Date.now() + windowSeconds * 1000 });
        return 1;
      }
      const next = Number(hit.value) + 1;
      hit.value = String(next);
      return next;
    },
  );
}

function split(a: number, b: number): CrowdSplit {
  const total = a + b;
  if (total === 0) return { a, b, aPct: 50, bPct: 50 };
  return {
    a,
    b,
    aPct: Math.round((a / total) * 100),
    bPct: 100 - Math.round((a / total) * 100),
  };
}
