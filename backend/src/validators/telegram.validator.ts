import { z } from "zod";

// Token format: <bot_id>:<alphanumeric secret> (rough check — the real
// validation happens via Telegram's getMe before anything is saved).
const botToken = z
  .string()
  .trim()
  .min(10, "Bot token is required")
  .max(200, "Bot token is too long")
  .refine((v) => /^\d{6,12}:[A-Za-z0-9_-]{20,}$/.test(v), "Bot token format is invalid");

const chatId = z
  .string()
  .trim()
  .min(3, "Chat ID is required")
  .max(100, "Chat ID is too long");

const destinationType = z.enum(["private", "group", "supergroup", "channel"]);

const destination = z.object({
  id: z.string().min(1).max(100).optional(),
  chatId,
  type: destinationType.optional(),
  label: z.string().trim().max(200).optional(),
  enabled: z.boolean().optional(),
});

const destinations = z.array(destination).min(1, "At least one chat destination is required").max(50);

const languageMode = z.enum(["both", "kh", "en"]);
const buttonText = z
  .string()
  .trim()
  .min(1)
  .max(40)
  // Neutralize any HTML the admin could inject into the Telegram caption
  // (buttons are escaped by the Telegram client on render, but stay safe).
  .transform((v) => v.replace(/[<>]/g, ""));

const siteUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => /^https?:\/\//i.test(v), "Site URL must start with http:// or https://")
  .optional();

export const telegramSettingsUpdateSchema = z.object({
  body: z.object({
    botToken: botToken.optional(),
    destinations: destinations.optional(),
    siteUrl: siteUrl.optional(),
    enabled: z.boolean().optional(),
    languageMode: languageMode.optional(),
    buttonKh: buttonText.optional(),
    buttonEn: buttonText.optional(),
  }),
});

export const telegramTestSchema = z.object({
  body: z.object({
    botToken: botToken.optional(),
    destinations: destinations.optional(),
  }),
});

export const telegramSendSchema = z.object({
  body: z.object({
    force: z.boolean().optional(),
  }),
});

export const telegramDiscoverSchema = z.object({
  body: z.object({}),
});
