import { Request, Response } from "express";
import { ArticleStatus } from "../constants";
import { prisma } from "../lib/prisma";
import * as articleService from "../services/article.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { created, noContent, ok } from "../utils/respond";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.validated as {
    query: { page?: number; pageSize?: number; q?: string; status?: string; categoryId?: number; authorId?: number };
  };
  const data = await articleService.listAdmin(
    {
      page: String(query.page ?? ""),
      pageSize: String(query.pageSize ?? ""),
      q: query.q,
      status: query.status as ArticleStatus | undefined,
      categoryId: query.categoryId !== undefined ? String(query.categoryId) : undefined,
      authorId: query.authorId !== undefined ? String(query.authorId) : undefined,
    },
    req.user!.role,
    req.user!.id
  );
  ok(res, data);
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await articleService.getAdmin(Number(req.params.id)));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: articleService.ArticleInput };
  const article = await articleService.createArticle(body, req.user!.id, req.user!.role, req.ip);
  created(res, article, "Article created");
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: articleService.ArticleInput };
  const article = await articleService.updateArticle(
    Number(req.params.id),
    body,
    req.user!.id,
    req.user!.role,
    req.ip
  );
  ok(res, article, "Article updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await articleService.deleteArticle(Number(req.params.id), req.user!.id, req.user!.role, req.ip);
  noContent(res);
});

export const bulk = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: { ids: number[]; action: "publish" | "unpublish" | "delete" } };
  const result = await articleService.bulkArticles(
    body.ids,
    body.action,
    req.user!.id,
    req.user!.role,
    req.ip
  );
  ok(res, result, `Bulk ${body.action} applied to ${result.count} article(s)`);
});

// ---- Gallery Images ----

export const getImages = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validated.params as { id: string };
  const images = await prisma.articleImage.findMany({
    where: { articleId: Number(id) },
    include: { media: true },
    orderBy: { sortOrder: "asc" },
  });
  ok(res, images.map((img) => ({
    id: img.id,
    mediaId: img.mediaId,
    url: img.media.url,
    altText: img.altText ?? img.media.altText,
    caption: img.caption ?? img.media.caption,
    width: img.media.width,
    height: img.media.height,
    sortOrder: img.sortOrder,
  })));
});

export const addImage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validated.params as { id: string };
  const body = req.body as { mediaId: number; altText?: string; caption?: string; sortOrder?: number };
  const articleId = Number(id);

  // Verify article exists
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new ApiError(404, "Article not found");

  // Verify media exists
  const media = await prisma.media.findUnique({ where: { id: body.mediaId } });
  if (!media) throw new ApiError(404, "Media not found");

  // Check duplicate
  const existing = await prisma.articleImage.findUnique({
    where: { articleId_mediaId: { articleId, mediaId: body.mediaId } },
  });
  if (existing) throw new ApiError(409, "Image already added to this article");

  const image = await prisma.articleImage.create({
    data: {
      articleId,
      mediaId: body.mediaId,
      altText: body.altText,
      caption: body.caption,
      sortOrder: body.sortOrder ?? 0,
    },
    include: { media: true },
  });

  created(res, {
    id: image.id,
    mediaId: image.mediaId,
    url: image.media.url,
    altText: image.altText ?? image.media.altText,
    caption: image.caption ?? image.media.caption,
    sortOrder: image.sortOrder,
  });
});

export const updateImage = asyncHandler(async (req: Request, res: Response) => {
  const { articleId, imageId } = req.params;
  const body = req.body as { altText?: string; caption?: string; sortOrder?: number };

  const image = await prisma.articleImage.findFirst({
    where: { id: Number(imageId), articleId: Number(articleId) },
  });
  if (!image) throw new ApiError(404, "Image not found");

  const updated = await prisma.articleImage.update({
    where: { id: image.id },
    data: {
      ...(body.altText !== undefined && { altText: body.altText }),
      ...(body.caption !== undefined && { caption: body.caption }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
    include: { media: true },
  });

  ok(res, {
    id: updated.id,
    mediaId: updated.mediaId,
    url: updated.media.url,
    altText: updated.altText ?? updated.media.altText,
    caption: updated.caption ?? updated.media.caption,
    sortOrder: updated.sortOrder,
  });
});

export const removeImage = asyncHandler(async (req: Request, res: Response) => {
  const { articleId, imageId } = req.params;

  const image = await prisma.articleImage.findFirst({
    where: { id: Number(imageId), articleId: Number(articleId) },
  });
  if (!image) throw new ApiError(404, "Image not found");

  await prisma.articleImage.delete({ where: { id: image.id } });
  noContent(res);
});
