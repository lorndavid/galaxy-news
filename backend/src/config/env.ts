import dotenv from "dotenv";
import path from "path";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return fallback ?? "";
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL", "file:./dev.db"),
  jwt: {
    secret: required("JWT_SECRET", "dev-only-insecure-secret-change-me"),
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS ?? 7),
  },
  redis: {
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
    // Short TTL for feeds — long enough to absorb bursts, short enough
    // that cache invalidation misses are acceptable.
    ttlSeconds: Number(process.env.REDIS_TTL_SECONDS ?? 30),
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? "",
    accessKey: process.env.R2_ACCESS_KEY_ID ?? "",
    secretKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.R2_BUCKET_NAME ?? "news-media",
    // Public URL for serving images. Options:
    //   1. Custom domain: https://media.galaxytv4k.online
    //   2. R2.dev public: https://<bucket>.<accountId>.r2.dev
    //   3. Backend proxy: /media (leave empty to auto-generate R2.dev URL)
    publicUrl: process.env.R2_PUBLIC_URL ?? "",
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
    adminUrl: process.env.ADMIN_URL ?? "http://localhost:5174",
  },
  uploadsDir: path.resolve(process.cwd(), "uploads"),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 8),
  telegram: {
    // Overridable so tests can point at a mock Telegram API. NEVER put the
    // bot token here — it is stored through the protected admin settings.
    apiBase: process.env.TELEGRAM_API_BASE ?? "https://api.telegram.org",
  },
  publicSiteUrl: (process.env.PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
};

export function redisConfigured(): boolean {
  return Boolean(env.redis.url);
}

export function r2Configured(): boolean {
  return Boolean(env.r2.accountId && env.r2.accessKey && env.r2.secretKey);
}
