import { Client as MinioClient } from "minio";
import { env, minioConfigured } from "../config/env";
import { logger } from "./logger";

// ============================================================
// MinIO object storage client.
//   - Configured via MINIO_* env vars (see backend/.env).
//   - Bucket: news-media (auto-created on boot).
//   - Objects are namespaced by folder: articles/, categories/,
//     authors/, ads/, gallery/, site/.
// The rest of the app never talks to MinIO directly — it goes
// through lib/storage.ts which also handles the local fallback.
// ============================================================

export const MINIO_BUCKET = env.minio.bucket;

let client: MinioClient | null = null;

if (minioConfigured()) {
  client = new MinioClient({
    endPoint: env.minio.endpoint,
    port: env.minio.port,
    useSSL: env.minio.useSSL,
    accessKey: env.minio.accessKey,
    secretKey: env.minio.secretKey,
  });
}

export function getMinioClient(): MinioClient | null {
  return client;
}

/** Public URL for an object key. Uses MINIO_PUBLIC_URL when set (e.g. a
 *  CDN / reverse-proxy prefix), otherwise constructs the canonical URL
 *  from the configured endpoint. */
export function objectUrl(objectKey: string): string {
  if (env.minio.publicUrl) {
    return `${env.minio.publicUrl.replace(/\/$/, "")}/${objectKey}`;
  }
  const scheme = env.minio.useSSL ? "https" : "http";
  const host = `${scheme}://${env.minio.endpoint}`;
  const port = env.minio.useSSL ? (env.minio.port === 443 ? "" : `:${env.minio.port}`) : env.minio.port === 80 ? "" : `:${env.minio.port}`;
  return `${host}${port}/${MINIO_BUCKET}/${objectKey}`;
}

/** Ensure the configured bucket exists (idempotent, safe to call on boot). */
export async function ensureBucket(): Promise<void> {
  if (!client) return;
  try {
    const exists = await client.bucketExists(MINIO_BUCKET);
    if (!exists) {
      await client.makeBucket(MINIO_BUCKET);
      logger.info({ bucket: MINIO_BUCKET }, "Created MinIO bucket");
    }
  } catch (error) {
    // Don't crash the app — uploads will fall back to local disk.
    logger.error({ error, bucket: MINIO_BUCKET }, "MinIO bucket bootstrap failed");
  }
}

/** Quick connectivity probe for the health endpoint. */
export async function checkMinio(): Promise<boolean> {
  if (!client) return false;
  try {
    return await client.bucketExists(MINIO_BUCKET);
  } catch {
    return false;
  }
}

export async function removeObject(objectKey: string): Promise<void> {
  if (!client) return;
  try {
    await client.removeObject(MINIO_BUCKET, objectKey);
  } catch (error) {
    logger.error({ error, objectKey }, "MinIO remove failed");
  }
}
