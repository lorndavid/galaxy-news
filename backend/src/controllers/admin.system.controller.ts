import { Request, Response } from "express";
import * as settingsService from "../services/settings.service";
import * as statsService from "../services/stats.service";
import * as activityService from "../services/activity.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/respond";

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await statsService.getDashboardStats());
});

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await settingsService.getAdmin());
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: Record<string, unknown> };
  ok(res, await settingsService.updateSettings(body, req.user!.id, req.ip), "Settings saved");
});

export const activityLogs = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as Record<string, unknown>;
  ok(res, await activityService.listActivity(q.page, q.pageSize));
});
