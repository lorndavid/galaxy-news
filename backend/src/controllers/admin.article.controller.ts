import { Request, Response } from "express";
import { ArticleStatus } from "../constants";
import * as articleService from "../services/article.service";
import { asyncHandler } from "../utils/asyncHandler";
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
