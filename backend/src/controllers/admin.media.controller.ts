import { Request, Response } from "express";
import * as mediaService from "../services/media.service";
import { asyncHandler } from "../utils/asyncHandler";
import { created, noContent, ok } from "../utils/respond";

function str(body: unknown, key: string): string | undefined {
  const v = (body as Record<string, unknown> | undefined)?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export const upload = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  const media = await mediaService.uploadMedia(
    file
      ? { buffer: file.buffer, mimetype: file.mimetype, originalname: file.originalname, size: file.size }
      : undefined,
    req.user!.id,
    str(req.body, "altText"),
    str(req.body, "folder"),
    str(req.body, "caption"),
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
      typeof q.q === "string" ? q.q : undefined,
      typeof q.folder === "string" ? q.folder : undefined
    )
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await mediaService.deleteMedia(Number(req.params.id), req.user!.id, req.ip);
  noContent(res);
});

export const bulk = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: { ids: number[]; action: "delete" } };
  const result = await mediaService.bulkDeleteMedia(body.ids, req.user!.id, req.ip);
  ok(res, result, `Bulk delete applied to ${result.count} item(s)`);
});
