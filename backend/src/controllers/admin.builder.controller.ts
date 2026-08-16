import { Request, Response } from "express";
import * as homepageService from "../services/homepage.service";
import * as navigationService from "../services/navigation.service";
import { asyncHandler } from "../utils/asyncHandler";
import { created, noContent, ok } from "../utils/respond";

// ---------- Homepage builder ----------

export const listSections = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await homepageService.listSections());
});

export const updateSections = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: { sections: homepageService.SectionUpdate[] } };
  ok(res, await homepageService.updateSections(body.sections, req.user!.id, req.ip), "Homepage sections saved");
});

export const reorderSections = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: { order: homepageService.SectionOrder[] } };
  ok(res, await homepageService.reorderSections(body.order, req.user!.id, req.ip), "Section order saved");
});

// ---------- Navigation builder ----------

export const listNav = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await navigationService.listNav());
});

export const createNav = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: navigationService.NavInput };
  const item = await navigationService.createNavItem(body, req.user!.id, req.ip);
  created(res, item, "Menu item created");
});

export const updateNav = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: Partial<navigationService.NavInput> };
  ok(res, await navigationService.updateNavItem(Number(req.params.id), body, req.user!.id, req.ip), "Menu item updated");
});

export const reorderNav = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: { order: { id: number; sortOrder: number }[] } };
  ok(res, await navigationService.reorderNav(body.order, req.user!.id, req.ip), "Menu order saved");
});

export const deleteNav = asyncHandler(async (req: Request, res: Response) => {
  await navigationService.deleteNavItem(Number(req.params.id), req.user!.id, req.ip);
  noContent(res);
});
