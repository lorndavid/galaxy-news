import { Request, Response } from "express";
import * as mediaService from "../services/media.service";
import { asyncHandler } from "../utils/asyncHandler";
import { created, noContent, ok } from "../utils/respond";

export const upload = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  const altText =
    typeof req.body?.altText === "string" && req.body.altText.trim()
      ? req.body.altText.trim()
      : undefined;
  const media = await mediaService.uploadMedia(
    file
      ? { buffer: file.buffer, mimetype: file.mimetype, originalname: file.originalname, size: file.size }
      : undefined,
    req.user!.id,
    altText,
    req.ip
  );
  created(res, media, "Image uploaded");
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as Record<string, unknown>;
  ok(
    res,
    await mediaService.listMedia(
      q.page,
      q.pageSize,
      typeof q.q === "string" ? q.q : undefined
    )
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await mediaService.deleteMedia(Number(req.params.id), req.user!.id, req.ip);
  noContent(res);
});
