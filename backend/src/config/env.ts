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
  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? "localhost",
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: (process.env.MINIO_USE_SSL ?? "false") === "true",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "",
    secretKey: process.env.MINIO_SECRET_KEY ?? "",
    bucket: process.env.MINIO_BUCKET ?? "news-media",
    // Public URL prefix used when generating object URLs. When serving
    // through the backend proxy this can be relative (e.g. /minio/news-media).
    publicUrl: process.env.MINIO_PUBLIC_URL ?? "",
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
    adminUrl: process.env.ADMIN_URL ?? "http://localhost:5174",
  },
  uploadsDir: path.resolve(process.cwd(), "uploads"),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 8),
};

export function redisConfigured(): boolean {
  return Boolean(env.redis.url);
}

export function minioConfigured(): boolean {
  return Boolean(env.minio.accessKey && env.minio.secretKey && env.minio.endpoint);
}
