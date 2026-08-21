import { Router, Request, Response } from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET } from "../lib/r2";
import { imageCacheGet, imageCacheSet, imageCacheDelete } from "../lib/redis";
import { logger } from "../lib/logger";
import crypto from "crypto";

// ============================================================
// /media proxy — serves R2 images through the backend domain.
//
// Caching strategy (3 tiers):
//   1. Browser cache (Cache-Control: immutable, max-age=30d)
//   2. Redis / in-memory binary cache (TTL 24h, skip >5MB)
//   3. R2 origin (fetched only on cache miss)
//
// Conditional requests:
//   - ETag-based (If-None-Match → 304 Not Modified)
//   - Browser sends this automatically on re-visits
//
// Cache invalidation:
//   - DELETE /media/cache/:key — invalidate specific image
//   - DELETE /media/cache — clear all image cache
// ============================================================

const router = Router();

// Browser cache: 30 days for immutable images
const BROWSER_CACHE_MAX_AGE = 30 * 24 * 60 * 60;

// ─── Resolve object key from request path ───
function resolveObjectKey(reqPath: string): string {
  let key = reqPath;
  if (reqPath.startsWith("http")) {
    try {
      key = new URL(reqPath).pathname.replace(/^\//, "");
    } catch {
      /* use as-is */
    }
  }
  if (key.startsWith(`${R2_BUCKET}/`)) {
    key = key.slice(R2_BUCKET.length + 1);
  }
  return key;
}

// ─── Validate object key ───
function isValidKey(key: string): boolean {
  return (
    key.length > 0 &&
    !key.includes("..") &&
    !key.startsWith("/") &&
    !key.includes("\\")
  );
}

// ─── Main image proxy handler ───
router.get("/media/*", async (req: Request, res: Response) => {
  const client = getR2Client();

  if (!client) {
    res.status(404).json({ success: false, message: "Storage not configured" });
    return;
  }

  const reqPath = (req.params as Record<string, string>)[0] ?? "";
  const objectKey = resolveObjectKey(reqPath);

  if (!isValidKey(objectKey)) {
    res.status(400).json({ success: false, message: "Invalid image path" });
    return;
  }

  try {
    // ──── TIER 1: Check Redis / in-memory cache ────
    const cached = await imageCacheGet(objectKey);

    if (cached) {
      // Generate ETag from cached content hash
      const etag = `"${cached.etag}"`;

      // Check If-None-Match (browser conditional request)
      const ifNoneMatch = req.headers["if-none-match"];
      if (ifNoneMatch && ifNoneMatch === etag) {
        res.status(304).end(); // Not Modified — no body
        return;
      }

      res.set({
        "Content-Type": cached.contentType,
        "Content-Length": String(cached.size),
        ETag: etag,
        "Cache-Control": `public, max-age=${BROWSER_CACHE_MAX_AGE}, immutable`,
        "Access-Control-Allow-Origin": "*",
        "X-Cache": "HIT", // Debug header: HIT = served from Redis
      });

      res.send(cached.body);
      return;
    }

    // ──── TIER 2: Fetch from R2 origin ────
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
    });

    const response = await client.send(command);

    if (!response.Body) {
      res.status(404).json({ success: false, message: "Image not found" });
      return;
    }

    // Convert stream to buffer
    const stream = response.Body as unknown as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });

    const body = Buffer.concat(chunks);
    const contentType = response.ContentType ?? "image/jpeg";

    // Use R2 ETag if available, otherwise compute our own
    const etag = response.ETag
      ? response.ETag.replace(/"/g, "")
      : crypto.createHash("md5").update(body).digest("hex");

    // ──── TIER 2b: Store in cache for next time ────
    await imageCacheSet(objectKey, body, contentType, etag);

    // Check If-None-Match (even for first fetch)
    const ifNoneMatch = req.headers["if-none-match"];
    if (ifNoneMatch && ifNoneMatch === `"${etag}"`) {
      res.status(304).end();
      return;
    }

    res.set({
      "Content-Type": contentType,
      "Content-Length": String(body.length),
      ETag: `"${etag}"`,
      "Cache-Control": `public, max-age=${BROWSER_CACHE_MAX_AGE}, immutable`,
      "Access-Control-Allow-Origin": "*",
      "X-Cache": "MISS", // Debug header: MISS = served from R2
    });

    res.send(body);
  } catch (error: unknown) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.$metadata?.httpStatusCode === 404 || err.name === "NoSuchKey") {
      res.status(404).json({ success: false, message: "Image not found" });
    } else {
      logger.error({ error, objectKey }, "Media proxy: fetch failed");
      res.status(500).json({ success: false, message: "Failed to fetch image" });
    }
  }
});

// ─── Cache invalidation: clear a specific image ───
router.delete("/media/cache/*", async (req: Request, res: Response) => {
  const reqPath = (req.params as Record<string, string>)[0] ?? "";
  const objectKey = resolveObjectKey(reqPath);
  await imageCacheDelete(objectKey);
  logger.info({ objectKey }, "Media cache invalidated");
  res.json({ success: true, message: `Cache cleared for ${objectKey}` });
});

// ─── Cache invalidation: clear ALL image cache ───
router.delete("/media/cache", async (_req: Request, res: Response) => {
  const { imageCacheClearAll } = await import("../lib/redis");
  await imageCacheClearAll();
  logger.info("All media cache cleared");
  res.json({ success: true, message: "All image cache cleared" });
});

export { router as mediaProxyRouter };
