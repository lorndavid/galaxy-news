import { Request, Response } from "express";
import * as telegramService from "../services/telegram.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/respond";

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await telegramService.getTelegramSettings());
});

export const saveSettings = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as {
    body: {
      botToken?: string;
      destinations?: telegramService.TelegramDestinationInput[];
      siteUrl?: string;
      enabled?: boolean;
      languageMode?: "both" | "kh" | "en";
      buttonKh?: string;
      buttonEn?: string;
    };
  };
  const result = await telegramService.saveTelegramSettings(body, req.user!.id, req.ip);
  ok(res, result, "Telegram settings saved and connection verified");
});

export const testConnection = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as {
    body: { botToken?: string; destinations?: telegramService.TelegramDestinationInput[] };
  };
  ok(res, await telegramService.testTelegramConnection(body), "Connection tested");
});

export const discover = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await telegramService.discoverChats(), "Chats discovered");
});

export const getPublication = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await telegramService.getPublication(Number(req.params.id)));
});

export const send = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: { force?: boolean } };
  const records = await telegramService.sendToTelegram(Number(req.params.id), {
    force: body.force,
    userId: req.user!.id,
    ip: req.ip,
  });
  ok(res, records, "Telegram publication queued");
});

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await telegramService.telegramStats());
});
