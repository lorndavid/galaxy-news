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

// ------------------------------------------------------------------
// Binary image cache (for /media proxy)
// Stores raw image bytes as base64 to avoid re-fetching from R2.
// Max 5 MB per image; TTL 24 hours.
// ------------------------------------------------------------------

const IMAGE_PREFIX = `${PREFIX}img:`;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const IMAGE_TTL = 24 * 60 * 60; // 24 hours

interface ImageCacheEntry {
  data: string; // base64-encoded body
  contentType: string;
  etag: string;
  size: number;
  expiresAt: number;
}

const imageMemoryStore = new Map<string, ImageCacheEntry>();
const IMAGE_MEMORY_MAX = 100;

export interface CachedImage {
  body: Buffer;
  contentType: string;
  etag: string;
  size: number;
}

export async function imageCacheGet(key: string): Promise<CachedImage | null> {
  const full = `${IMAGE_PREFIX}${key}`;
  const redis = getRedis();

  // Try Redis first
  if (redis && redis.status === "ready") {
    try {
      const raw = await redis.getBuffer(full);
      if (raw) {
        const parsed = JSON.parse(raw.toString()) as ImageCacheEntry;
        return {
          body: Buffer.from(parsed.data, "base64"),
          contentType: parsed.contentType,
          etag: parsed.etag,
          size: parsed.size,
        };
      }
    } catch (error) {
      logger.warn({ error, key }, "Redis image GET failed");
    }
  }

  // Fallback: in-memory
  const entry = imageMemoryStore.get(full);
  if (entry && entry.expiresAt > Date.now()) {
    return {
      body: Buffer.from(entry.data, "base64"),
      contentType: entry.contentType,
      etag: entry.etag,
      size: entry.size,
    };
  }
  imageMemoryStore.delete(full);
  return null;
}

export async function imageCacheSet(
  key: string,
  body: Buffer,
  contentType: string,
  etag: string
): Promise<void> {
  if (body.length > IMAGE_MAX_BYTES) return; // skip large images

  const full = `${IMAGE_PREFIX}${key}`;
  const entry: ImageCacheEntry = {
    data: body.toString("base64"),
    contentType,
    etag,
    size: body.length,
    expiresAt: Date.now() + IMAGE_TTL * 1000,
  };
  const payload = JSON.stringify(entry);

  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      await redis.set(full, payload, "EX", IMAGE_TTL);
      return;
    } catch (error) {
      logger.warn({ error, key }, "Redis image SET failed");
    }
  }

  // In-memory fallback
  if (imageMemoryStore.size > IMAGE_MEMORY_MAX) {
    const now = Date.now();
    for (const [k, v] of imageMemoryStore) {
      if (v.expiresAt <= now) imageMemoryStore.delete(k);
    }
  }
  imageMemoryStore.set(full, entry);
}

/** Clear cached image (called when an image is deleted or replaced). */
export async function imageCacheDelete(key: string): Promise<void> {
  const full = `${IMAGE_PREFIX}${key}`;
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      await redis.del(full);
    } catch {
      /* best-effort */
    }
  }
  imageMemoryStore.delete(full);
}

/** Clear all cached images (e.g. after storage migration). */
export async function imageCacheClearAll(): Promise<void> {
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      const keys = await redis.keys(`${IMAGE_PREFIX}*`);
      if (keys.length) await redis.del(...keys);
    } catch {
      /* best-effort */
    }
  }
  imageMemoryStore.clear();
}
