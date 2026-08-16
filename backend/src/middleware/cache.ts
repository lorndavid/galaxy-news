import type { NextFunction, Request, Response } from "express";

/**
 * Tiny in-memory TTL cache for public GET endpoints.
 * Absorbs burst traffic on the homepage/article feeds without adding
 * a Redis dependency. Data is short-lived, so staleness is negligible.
 */

interface CacheEntry {
  body: string;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

const DEFAULT_TTL_MS = 30_000;
const MAX_ENTRIES = 200;

/**
 * Drop every cached entry. Called after admin mutations so edits,
 * publishes and deletions show up on the public site immediately.
 */
export function clearPublicCache() {
  store.clear();
}

export function ttlCache(ttlMs = DEFAULT_TTL_MS) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();

    const now = Date.now();

    // Opportunistic cleanup — keep the map small.
    if (store.size > MAX_ENTRIES) {
      for (const [key, entry] of store) {
        if (entry.expiresAt <= now) store.delete(key);
      }
    }

    const key = `${req.originalUrl}`;
    const hit = store.get(key);
    if (hit && hit.expiresAt > now) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.send(hit.body);
    }

    const originalSend = res.send.bind(res);
    res.send = ((body: unknown) => {
      if (res.statusCode < 400 && typeof body === "string") {
        store.set(key, { body, expiresAt: Date.now() + ttlMs });
        res.setHeader("X-Cache", "MISS");
      }
      return originalSend(body);
    }) as typeof res.send;

    next();
  };
}
