import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, r2Configured } from "../config/env";
import { logger } from "./logger";

// ============================================================
// Cloudflare R2 object storage client.
//   - R2 is S3-compatible, so we use the AWS SDK.
//   - Configured via R2_* env vars (see .env).
//   - Bucket: news-media (must be created manually in Cloudflare).
//   - Objects are namespaced by folder: articles/, categories/,
//     authors/, ads/, gallery/, site/.
// The rest of the app never talks to R2 directly — it goes
// through lib/storage.ts which also handles the local fallback.
// ============================================================

export const R2_BUCKET = env.r2.bucket;

let client: S3Client | null = null;

if (r2Configured()) {
  client = new S3Client({
    region: "auto",
    endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.r2.accessKey,
      secretAccessKey: env.r2.secretKey,
    },
  });
}

export function getR2Client(): S3Client | null {
  return client;
}

/** Public URL for an object key. Uses R2 public domain or the configured custom domain. */
export function objectUrl(objectKey: string): string {
  if (env.r2.publicUrl) {
    return `${env.r2.publicUrl.replace(/\/$/, "")}/${objectKey}`;
  }
  // Default R2.dev public URL (fallback)
  return `https://${env.r2.bucket}.${env.r2.accountId}.r2.dev/${objectKey}`;
}

/** Ensure the configured bucket exists (idempotent, safe to call on boot). */
export async function ensureBucket(): Promise<void> {
  if (!client) return;
  try {
    await client.send(new HeadBucketCommand({ Bucket: R2_BUCKET }));
  } catch (error) {
    const statusCode = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    if (statusCode === 404) {
      logger.warn(
        { bucket: R2_BUCKET },
        "R2 bucket does not exist — create it in the Cloudflare dashboard (R2 → Buckets)"
      );
    } else {
      logger.error({ error, bucket: R2_BUCKET }, "R2 bucket check failed");
    }
  }
}

/** Quick connectivity probe for the health endpoint. */
export async function checkR2(): Promise<boolean> {
  if (!client) return false;
  try {
    await client.send(new HeadBucketCommand({ Bucket: R2_BUCKET }));
    return true;
  } catch {
    return false;
  }
}

export async function removeObject(objectKey: string): Promise<void> {
  if (!client) return;
  try {
    await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: objectKey }));
  } catch (error) {
    logger.error({ error, objectKey }, "R2 remove failed");
  }
}

/** Upload an object to R2. */
export async function putObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  if (!client) throw new Error("R2 not configured");
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

/** Generate a presigned upload URL for direct browser-to-R2 uploads (optional). */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  if (!client) throw new Error("R2 not configured");
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn });
}
