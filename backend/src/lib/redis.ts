import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logger";

// ============================================================
// Redis client for API caching.
//   - Used for homepage/feed/article caching and rate limiting.
//   - Redis is an optimization, NOT a single point of failure:
//     if it is unavailable, every call site falls back to
//     SQLite (via the cache middleware) and logs the problem.
//   - The in-memory fallback below keeps cache semantics working
//     for short bursts when Redis is down.
// ============================================================

interface MemoryEntry {
  body: string;
  expiresAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();
const MEMORY_MAX = 500;

let client: Redis | null = null;
let failed = false;

export function getRedis(): Redis | null {
  if (client) return client;
  if (failed) return null;

  try {
    client = new Redis(env.redis.url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2_000,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1_000)),
      enableOfflineQueue: false,
    });

    client.on("error", (error) => {
      // Log once, then keep serving from the fallback cache.
      if (!failed) {
        failed = true;
        logger.error({ error }, "Redis unavailable — using in-memory cache fallback");
      }
      client = null;
    });

    client.on("ready", () => {
      failed = false;
      logger.info("Redis connected");
    });

    // Connect eagerly so cache hits work from the first request.
    client.connect().catch(() => {
      /* handled by the error handler */
    });
  } catch (error) {
    failed = true;
    logger.error({ error }, "Redis init failed — using in-memory cache fallback");
  }
  return client;
}

// ------------------------------------------------------------------
// Cache API (works with or without Redis)
// ------------------------------------------------------------------

const PREFIX = "navatra:";

export async function cacheGet(key: string): Promise<string | null> {
  const full = `${PREFIX}${key}`;
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      return await redis.get(full);
    } catch (error) {
      logger.warn({ error, key }, "Redis GET failed");
    }
  }
  const entry = memoryStore.get(full);
  if (entry && entry.expiresAt > Date.now()) return entry.body;
  memoryStore.delete(full);
  return null;
}

export async function cacheSet(key: string, body: string, ttlSeconds: number): Promise<void> {
  const full = `${PREFIX}${key}`;
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      await redis.set(full, body, "EX", ttlSeconds);
      return;
    } catch (error) {
      logger.warn({ error, key }, "Redis SET failed");
    }
  }
  // In-memory fallback with opportunistic cleanup.
  if (memoryStore.size > MEMORY_MAX) {
    const now = Date.now();
    for (const [k, v] of memoryStore) {
      if (v.expiresAt <= now) memoryStore.delete(k);
    }
  }
  memoryStore.set(full, { body, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/** Drop every cached entry (called after admin mutations). */
export async function cacheClear(): Promise<void> {
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      const keys = await redis.keys(`${PREFIX}*`);
      if (keys.length) await redis.del(...keys);
    } catch (error) {
      logger.warn({ error }, "Redis cache clear failed");
    }
  }
  memoryStore.clear();
}

/** Drop entries for a specific feed (used for targeted invalidation). */
export async function cacheClearPrefix(prefix: string): Promise<void> {
  const full = `${PREFIX}${prefix}`;
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      const keys = await redis.keys(`${full}*`);
      if (keys.length) await redis.del(...keys);
    } catch (error) {
      logger.warn({ error, prefix }, "Redis prefix clear failed");
    }
  }
  for (const k of [...memoryStore.keys()]) {
    if (k.startsWith(full)) memoryStore.delete(k);
  }
}

/**
 * Delete only the cached entries whose key starts with `prefix` AND whose
 * remainder satisfies `keep`. Use this to clear one feed without nuking
 * sibling routes that share a prefix — e.g. clear the general article list
 * (`/articles?page=...`) without touching `/articles/breaking`.
 */
export async function cacheClearWhere(
  prefix: string,
  keep: (rest: string) => boolean
): Promise<void> {
  const full = `${PREFIX}${prefix}`;
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      const keys = await redis.keys(`${full}*`);
      const toDelete = keys.filter((k) => keep(k.slice(full.length)));
      if (toDelete.length) await redis.del(...toDelete);
    } catch (error) {
      logger.warn({ error, prefix }, "Redis filtered clear failed");
    }
  }
  for (const k of [...memoryStore.keys()]) {
    if (k.startsWith(full) && keep(k.slice(full.length))) memoryStore.delete(k);
  }
}

export async function checkRedis(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    const pong = await redis.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}
