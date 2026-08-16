import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

const allowedMimes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadMb * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      cb(new Error("Only JPG, PNG, WEBP, GIF or SVG images are allowed"));
      return;
    }
    cb(null, true);
  },
});

/** Wrap multer so validation errors become clean 4xx API errors. */
export function upload(field: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    multerUpload.single(field)(req, res, (err: unknown) => {
      if (!err) return next();
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
