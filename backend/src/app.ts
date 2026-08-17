import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimit";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { checkMinio, getMinioClient, MINIO_BUCKET } from "./lib/minio";
import { checkRedis } from "./lib/redis";
import { apiRouter } from "./routes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    helmet({
      // Images are served cross-origin to the public site and admin.
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    })
  );

  app.use(
    cors({
      origin: [env.cors.frontendUrl, env.cors.adminUrl, /^http:\/\/localhost:\d+$/],
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());

  // Local uploads (fallback storage when MinIO is not configured)
  app.use("/uploads", express.static(env.uploadsDir, { maxAge: "7d" }));

  // MinIO objects — proxied through the API so the public site and admin
  // can always load images via /minio/... regardless of MinIO's host/port.
  // (Only applies when MinIO is configured; otherwise 404.)
  app.use("/minio", async (req, res, next) => {
    const client = getMinioClient();
    if (!client) return next();
    try {
      const key = decodeURIComponent(req.path.replace(/^\//, ""));
      const meta = await client.statObject(MINIO_BUCKET, key);
      const object = await client.getObject(MINIO_BUCKET, key);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Content-Type", meta.metaData?.["content-type"] ?? "application/octet-stream");
      object.pipe(res);
    } catch (error) {
      // Object not found (or MinIO hiccup) — fall through to 404.
      const code = (error as { code?: string } | undefined)?.code;
      if (code === "NoSuchKey" || code === "NotFound") return next();
      next(error);
    }
  });

  // Health — reports the API plus each dependency independently so a
  // degraded stack is obvious (Redis/MinIO down ≠ backend down).
  app.get("/health", async (_req, res) => {
    const [db, redis, minio] = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      checkRedis(),
      checkMinio(),
    ]);
    const healthy = {
      status: "ok",
      dependencies: {
        database: db.status === "fulfilled" ? "ok" : "down",
        redis: redis.status === "fulfilled" && redis.value ? "ok" : "down",
        minio: minio.status === "fulfilled" && minio.value ? "ok" : "down",
      },
    };
    const degraded = healthy.dependencies.database !== "ok";
    res.status(degraded ? 503 : 200).json({ success: true, data: healthy });
  });

  app.use("/api/v1", apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export function logStartup(port: number) {
  logger.info(
    { port, env: env.nodeEnv, uploads: env.uploadsDir, minio: env.minio.bucket, redis: env.redis.url },
    "Navatra 4K TV API listening"
  );
}
