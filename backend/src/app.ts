import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimit";
import { logger } from "./lib/logger";
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

  // Local uploads (fallback storage when Cloudinary is not configured)
  app.use("/uploads", express.static(env.uploadsDir, { maxAge: "7d" }));

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  app.use("/api/v1", apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export function logStartup(port: number) {
  logger.info(
    { port, env: env.nodeEnv, uploads: env.uploadsDir },
    "Navatra 4K TV API listening"
  );
}
