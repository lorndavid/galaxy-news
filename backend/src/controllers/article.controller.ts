import { Request, Response } from "express";
import * as articleService from "../services/article.service";
import { asyncHandler } from "../utils/asyncHandler";
import { qs } from "../utils/paginate";
import { ok } from "../utils/respond";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as Record<string, unknown>;
  const data = await articleService.listPublic({
    page: q.page,
    pageSize: q.pageSize,
    category: qs(q.category),
    tag: qs(q.tag),
    q: qs(q.q),
    featured: qs(q.featured),
    breaking: qs(q.breaking),
    sort: (qs(q.sort) as "latest" | "popular" | undefined) ?? "latest",
    authorId: qs(q.authorId),
  });
  ok(res, data);
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const article = await articleService.getBySlug(
    req.params.slug,
    req.headers["user-agent"] ?? null
  );
  ok(res, article);
});

export const getRelated = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const article = await articleService.getBySlug(slug, "bot"); // no view increment
  const related = await articleService.getRelated(article.id, article.categoryId);
  ok(res, related);
});

export const breaking = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await articleService.getBreaking());
});

export const featured = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await articleService.getFeatured(6));
});

export const latest = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await articleService.getLatest(12));
});

export const popular = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await articleService.getPopular(5));
});

export const byCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = await articleService.listByCategory(req.params.slug, req.query.page);
  ok(res, data);
});

export const byAuthor = asyncHandler(async (req: Request, res: Response) => {
  const data = await articleService.listPublic({
    page: req.query.page,
    pageSize: req.query.pageSize,
    authorId: req.params.id,
  });
  ok(res, data);
});
