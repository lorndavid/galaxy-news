import { Request, Response } from "express";
import * as categoryService from "../services/category.service";
import * as tagService from "../services/tag.service";
import * as adService from "../services/ad.service";
import { asyncHandler } from "../utils/asyncHandler";
import { created, noContent, ok } from "../utils/respond";

// ---------- Categories ----------

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await categoryService.listAdmin());
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: categoryService.CategoryInput };
  created(res, await categoryService.createCategory(body, req.user!.id, req.ip), "Category created");
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: categoryService.CategoryInput };
  ok(res, await categoryService.updateCategory(Number(req.params.id), body, req.user!.id, req.ip), "Category updated");
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.deleteCategory(Number(req.params.id), req.user!.id, req.ip);
  noContent(res);
});

export const reorderCategories = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: { items: { id: number; sortOrder: number }[] } };
  await categoryService.reorderCategories(body.items, req.user!.id, req.ip);
  ok(res, null, "Categories reordered");
});

// ---------- Tags ----------

export const listTags = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await tagService.listAll());
});

export const createTag = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: tagService.TagInput };
  created(res, await tagService.createTag(body, req.user!.id, req.ip), "Tag created");
});

export const updateTag = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: tagService.TagInput };
  ok(res, await tagService.updateTag(Number(req.params.id), body, req.user!.id, req.ip), "Tag updated");
});

export const deleteTag = asyncHandler(async (req: Request, res: Response) => {
  await tagService.deleteTag(Number(req.params.id), req.user!.id, req.ip);
  noContent(res);
});

// ---------- Advertisements ----------

export const listAds = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await adService.listAdmin());
});

export const createAd = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: adService.AdInput };
  created(res, await adService.createAd(body, req.user!.id, req.ip), "Advertisement created");
});

export const updateAd = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: adService.AdInput };
  ok(res, await adService.updateAd(Number(req.params.id), body, req.user!.id, req.ip), "Advertisement updated");
});

export const deleteAd = asyncHandler(async (req: Request, res: Response) => {
  await adService.deleteAd(Number(req.params.id), req.user!.id, req.ip);
  noContent(res);
});
