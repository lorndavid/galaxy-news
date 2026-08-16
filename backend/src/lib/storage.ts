import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { cloudinaryConfigured, env } from "../config/env";
import { logger } from "./logger";

// ============================================================
// Media storage abstraction.
//   - When Cloudinary credentials are configured, images are
//     uploaded to Cloudinary and metadata lives in SQLite.
//   - Otherwise images are stored on local disk under
//     backend/uploads and served at /uploads/*.
// The rest of the app only ever sees { url, publicId, secureUrl }.
// ============================================================

export interface StoredFile {
  url: string;
  publicId: string | null;
  secureUrl: string | null;
  width: number | null;
  height: number | null;
  format: string | null;
  size: number | null;
}

if (cloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

function ensureUploadsDir(): void {
  fs.mkdirSync(env.uploadsDir, { recursive: true });
}

function extFor(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  return map[mime] ?? "bin";
}

function uploadToCloudinary(buffer: Buffer, mime: string): Promise<StoredFile> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "navatra",
        resource_type: "image",
        format: extFor(mime),
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          secureUrl: result.secure_url,
          width: result.width ?? null,
          height: result.height ?? null,
          format: result.format ?? null,
          size: result.bytes ?? null,
        });
      }
    );
    stream.end(buffer);
  });
}

function uploadToDisk(buffer: Buffer, mime: string): StoredFile {
  ensureUploadsDir();
  const ext = extFor(mime);
  const fileName = `${randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(env.uploadsDir, fileName), buffer);
  return {
    url: `/uploads/${fileName}`,
    publicId: null,
    secureUrl: null,
    width: null,
    height: null,
    format: ext,
    size: buffer.length,
  };
}

export async function storeImage(
  buffer: Buffer,
  mime: string
): Promise<StoredFile> {
  if (cloudinaryConfigured()) {
    try {
      return await uploadToCloudinary(buffer, mime);
    } catch (error) {
      logger.error({ error }, "Cloudinary upload failed, falling back to local");
      return uploadToDisk(buffer, mime);
    }
  }
  return uploadToDisk(buffer, mime);
}

export async function deleteStoredImage(publicId: string | null, url: string | null): Promise<void> {
  if (publicId && cloudinaryConfigured()) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      logger.error({ error, publicId }, "Cloudinary delete failed");
    }
    return;
  }
  if (url && url.startsWith("/uploads/")) {
    const file = path.join(env.uploadsDir, path.basename(url));
    try {
      fs.unlinkSync(file);
    } catch {
      /* file already gone */
    }
  }
}
