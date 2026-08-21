import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimit";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { checkR2 } from "./lib/r2";
import { checkRedis } from "./lib/redis";
import { apiRouter } from "./routes";
import { mediaProxyRouter } from "./routes/media.proxy";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    helmet({
      // Images are served cross-origin to the public site and admin.
      crossOriginResourcePolicy: { policy: "cross-origin" },
      // CSP stays disabled: Google Fonts, inline styles and the admin
      // editor's inline styles need it, and a blind policy would break the
      // apps. Revisit with a data-driven policy when the bundles are stable.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    })
  );

  // Permissions-Policy — deny camera/mic/geolocation/payments etc., while
  // keeping fullscreen for the site's video embeds.
  app.use((_req, res, next) => {
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), battery=(), publickey-credentials-get=(), fullscreen=(self)"
    );
    next();
  });

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

  // Media proxy — serves R2 images through the backend domain.
  // This eliminates all cross-origin issues for <img> tags on the frontend.
  app.use(mediaProxyRouter);

  // Health — reports the API plus each dependency independently so a
  // degraded stack is obvious (Redis/MinIO down ≠ backend down).
  app.get("/health", async (_req, res) => {
    const [db, redis, r2] = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      checkRedis(),
      checkR2(),
    ]);
    const healthy = {
      status: "ok",
      dependencies: {
        database: db.status === "fulfilled" ? "ok" : "down",
        redis: redis.status === "fulfilled" && redis.value ? "ok" : "down",
        r2: r2.status === "fulfilled" && r2.value ? "ok" : "down",
      },
    };
    const degraded = healthy.dependencies.database !== "ok";
    res.status(degraded ? 503 : 200).json({ success: true, data: healthy });
  });

  // API routes
  app.use("/api/v1", apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export function logStartup(port: number) {
  logger.info(
    { port, env: env.nodeEnv, uploads: env.uploadsDir, r2: env.r2.bucket, redis: env.redis.url },
    "Galaxy TV V4K API listening"
  );
}
