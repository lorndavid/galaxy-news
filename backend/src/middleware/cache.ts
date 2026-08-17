import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { cacheClear, cacheClearPrefix, cacheClearWhere, cacheGet, cacheSet } from "../lib/redis";

/**
 * Redis-backed TTL cache for public GET endpoints.
 *
 * Strategy:
 *   - Cache HIT  → respond from Redis (X-Cache: HIT)
 *   - Cache MISS → run the handler, store the body in Redis (X-Cache: MISS)
 *   - Redis down → transparently falls back to an in-memory store; the
 *     app keeps serving from SQLite so Redis is never a point of failure.
 *
 * Admin mutations call invalidateAdminMutation() which clears only the
 * feeds the mutation can actually affect (breaking / featured / category /
 * article detail / settings / nav / ...) so edits, publishes and deletions
 * appear on the public site immediately without flushing unrelated caches.
 */

const DEFAULT_TTL_SECONDS = 30;
// In-flight dedup: while a MISS is being generated, concurrent requests
// for the same key wait on the same promise instead of hitting the DB.
const inflight = new Map<string, Promise<string>>();

// Public feed key prefixes (relative to the `navatra:` PREFIX in redis.ts).
const FEED = {
  articles: "pub/api/v1/articles",
  breaking: "pub/api/v1/articles/breaking",
  featured: "pub/api/v1/articles/featured",
  latest: "pub/api/v1/articles/latest",
  popular: "pub/api/v1/articles/popular",
  categories: "pub/api/v1/categories",
  tags: "pub/api/v1/tags",
  settings: "pub/api/v1/settings",
  homepage: "pub/api/v1/homepage/sections",
  navigation: "pub/api/v1/navigation",
  ads: "pub/api/v1/ads",
  comments: "pub/api/v1/comments",
  ticker: "pub/api/v1/ticker",
  sitemap: "pub/api/v1/sitemap.xml",
  articleDetail: (slug: string) => `pub/api/v1/articles/${slug}`,
  articleRelated: (slug: string) => `pub/api/v1/articles/${slug}/related`,
  categoryFeed: (slug: string) => `pub/api/v1/categories/${slug}/articles`,
};

/** Drop every cached entry (safety net / manual flush). */
export function clearPublicCache(): Promise<void> {
  inflight.clear();
  return cacheClear();
}

/** Drop only the matching feed keys, e.g. clearPublicCachePrefix("/articles/breaking"). */
export function clearPublicCachePrefix(prefix: string): Promise<void> {
  return cacheClearPrefix(prefix);
}

/**
 * Targeted cache invalidation for an admin mutation.
 *
 * Inspects the admin request (path + body) and clears only the public feeds
 * that mutation can affect — instead of flushing the whole cache on every
 * change. Pre-mutation rows are read from the DB so a rename/unpublish
 * correctly clears the article's old detail page and category feed.
 */
export async function invalidateAdminMutation(req: Request): Promise<void> {
  inflight.clear();
  const path = req.path;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const prefixes = new Set<string>();

  try {
    if (path.startsWith("/articles")) {
      // Affected article ids: single :id route or bulk ids in the body.
      const ids: number[] = [];
      const single = path.match(/^\/articles\/(\d+)$/);
      if (single) ids.push(Number(single[1]));
      else if (Array.isArray(body.ids)) {
        ids.push(
          ...body.ids.filter((n): n is number => typeof n === "number" && Number.isInteger(n))
        );
      }

      const affected = ids.length
        ? await prisma.article.findMany({
            where: { id: { in: ids } },
            select: { slug: true, categoryId: true, isBreaking: true, isFeatured: true },
          })
        : [];

      // The general list, latest and popular reorder on any article change.
      prefixes.add(FEED.latest);
      prefixes.add(FEED.popular);
      // Breaking/featured only when that content actually changed.
      if (affected.some((a) => a.isBreaking) || body.isBreaking === true) {
        prefixes.add(FEED.breaking);
      }
      if (affected.some((a) => a.isFeatured) || body.isFeatured === true) {
        prefixes.add(FEED.featured);
      }

      // Detail + related pages for the affected articles (old slugs).
      for (const a of affected) {
        prefixes.add(FEED.articleDetail(a.slug));
        prefixes.add(FEED.articleRelated(a.slug));
      }

      // Category feeds: old category + new category from the body.
      const categoryIds = new Set<number>(affected.map((a) => a.categoryId));
      if (typeof body.categoryId === "number") categoryIds.add(body.categoryId);
      if (categoryIds.size) {
        const cats = await prisma.category.findMany({
          where: { id: { in: [...categoryIds] } },
          select: { slug: true },
        });
        for (const c of cats) prefixes.add(FEED.categoryFeed(c.slug));
      }

      prefixes.add(FEED.sitemap); // sitemap lists article URLs
      prefixes.add(FEED.ticker); // ticker shows real published articles
    } else if (path.startsWith("/categories")) {
      prefixes.add(FEED.categories);
      const slugs = new Set<string>();
      if (typeof body.slug === "string" && body.slug) slugs.add(body.slug);
      const single = path.match(/^\/categories\/(\d+)$/);
      if (single) {
        const cat = await prisma.category.findUnique({
          where: { id: Number(single[1]) },
          select: { slug: true },
        });
        if (cat) slugs.add(cat.slug);
      }
      for (const s of slugs) prefixes.add(FEED.categoryFeed(s));
      // Category metadata is embedded in every serialized article payload.
      prefixes.add(FEED.articles);
      prefixes.add(FEED.sitemap);
    } else if (path.startsWith("/tags")) {
      prefixes.add(FEED.tags);
      // Tag metadata is embedded in serialized article payloads.
      prefixes.add(FEED.articles);
    } else if (path.startsWith("/settings")) {
      prefixes.add(FEED.settings);
      // Ticker settings (enable/title/speed/colors) ride on settings.
      prefixes.add(FEED.ticker);
    } else if (path.startsWith("/homepage")) {
      prefixes.add(FEED.homepage);
    } else if (path.startsWith("/navigation")) {
      prefixes.add(FEED.navigation);
    } else if (path.startsWith("/ads")) {
      prefixes.add(FEED.ads);
    } else if (path.startsWith("/comments")) {
      prefixes.add(FEED.comments);
    } else if (path.startsWith("/users")) {
      // Author name is embedded in serialized article payloads.
      prefixes.add(FEED.articles);
    }
    // /media, /messages, /newsletter: no public cached feed is affected
    // (media images stream through the /minio proxy with browser caching).
  } catch (error) {
    // Lookup failed — clear everything rather than risk stale content.
    logger.error({ error }, "Targeted invalidation failed — clearing all public cache");
    await cacheClear();
    return;
  }

  await Promise.all([...prefixes].map((p) => cacheClearPrefix(p)));

  // The general article list (every ?query variant) changes on any article
  // mutation — clear just the list keys, not the /articles/* sub-feeds.
  if (path.startsWith("/articles")) {
    await cacheClearWhere(FEED.articles, (rest) => rest === "" || rest.startsWith("?"));
  }
}

export function ttlCache(ttlSeconds = DEFAULT_TTL_SECONDS) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();

    const key = `pub${req.originalUrl}`;

    void (async () => {
      try {
        const hit = await cacheGet(key);
        if (hit !== null) {
          res.setHeader("X-Cache", "HIT");
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          return res.send(hit);
        }

        // Wait for an in-flight miss on the same key, if any.
        const existing = inflight.get(key);
        if (existing) {
          const body = await existing;
          res.setHeader("X-Cache", "HIT");
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          return res.send(body);
        }

        // Generate the response once; the wrapped send caches + resolves,
        // then the underlying send delivers the response body.
        const generated = new Promise<string>((resolve) => {
          const originalSend = res.send.bind(res);
          res.send = ((body: unknown) => {
            const text = typeof body === "string" ? body : "";
            if (res.statusCode < 400 && text) {
              void cacheSet(key, text, ttlSeconds);
              res.setHeader("X-Cache", "MISS");
            }
            resolve(text);
            return originalSend(body);
          }) as typeof res.send;

          next();
        });

        inflight.set(key, generated);
        await generated;
        inflight.delete(key);
      } catch {
        // Never break the request on a cache problem.
        inflight.delete(key);
        return next();
      }
    })();
  };
}
