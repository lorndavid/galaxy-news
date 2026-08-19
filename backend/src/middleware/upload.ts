import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

// SVG is intentionally excluded: it can carry inline scripts (stored XSS)
// when served directly. Only raster formats are accepted for media.
const allowedMimes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Verify the file *content* matches its declared MIME type (magic bytes),
 * so a renamed .exe (or any disguised payload) is rejected even when the
 * client lies about the Content-Type.
 */
function sniffImage(buffer: Buffer, mime: string): boolean {
  if (buffer.length < 12) return false;
  if (mime === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mime === "image/png") {
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mime === "image/gif") {
    const head = buffer.subarray(0, 6).toString("ascii");
    return head === "GIF87a" || head === "GIF89a";
  }
  if (mime === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadMb * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      cb(new Error("Only JPG, PNG, WEBP or GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
});

/** Wrap multer so validation errors become clean 4xx API errors. */
export function upload(field: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    multerUpload.single(field)(req, res, (err: unknown) => {
      if (!err) {
        const file = req.file;
        if (file && !sniffImage(file.buffer, file.mimetype)) {
          return next(
            ApiError.badRequest("File content does not match its declared image type")
          );
        }
        return next();
      }
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(ApiError.badRequest(`File too large (max ${env.maxUploadMb}MB)`));
        }
        return next(ApiError.badRequest(`Upload error: ${err.message}`));
      }
      const message = err instanceof Error ? err.message : "Invalid upload";
      return next(ApiError.badRequest(message));
    });
  };
}