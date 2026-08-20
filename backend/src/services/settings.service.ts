import { prisma } from "../lib/prisma";
import { maskSecret } from "../lib/telegram";
import { logActivity } from "./activity.service";

const PUBLIC_FIELDS = [
  "siteName",
  "siteNameEn",
  "logo",
  "favicon",
  "description",
  "descriptionEn",
  "defaultLanguage",
  "facebook",
  "telegram",
  "youtube",
  "tiktok",
  "instagram",
  "twitter",
  "contactEmail",
  "contactPhone",
  "address",
  // Live news ticker
  "tickerEnabled",
  "tickerTitle",
  "tickerSpeed",
  "tickerDirection",
  "tickerCount",
  "tickerRefresh",
  "tickerBgColor",
  "tickerTextColor",
  "tickerAccentColor",
  "tickerLayout",
] as const;

// Theme tokens are safe, validated values — exposing them publicly lets the
// frontend build its CSS variables from one cached settings payload.
const THEME_FIELDS = [
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "surfaceColor",
  "textColor",
  "mutedTextColor",
  "borderColor",
  // Layout/zone colors
  "bodyBgColor",
  "headerBgColor",
  "headerTextColor",
  "footerBgColor",
  "footerTextColor",
  // Layout style
  "layoutStyle",
  "fontHeading",
  "fontBody",
  "fontArticle",
  "fontSizeHero",
  "fontSizeSection",
  "fontSizeCard",
  "fontSizeBody",
  "radiusPreset",
  "shadowPreset",
] as const;

// Social share link templates for the article share rail / row.
const SHARE_FIELDS = [
  "shareFacebook",
  "shareTikTok",
  "shareTelegram",
  "shareWhatsapp",
] as const;

const DEFAULT_SETTINGS = { siteName: "Galaxy TV V4K" };

export async function getPublic() {
  const settings = await prisma.siteSettings.findFirst();
  if (!settings) return DEFAULT_SETTINGS;
  const out: Record<string, unknown> = {};
  for (const field of PUBLIC_FIELDS) out[field] = settings[field];
  for (const field of THEME_FIELDS) out[field] = settings[field];
  for (const field of SHARE_FIELDS) out[field] = settings[field];
  return out;
}

export async function getAdmin() {
  const settings = await prisma.siteSettings.findFirst();
  if (settings) {
    // The Telegram bot token is a secret — even admin responses only see a
    // masked form (the dedicated /admin/settings/telegram endpoints handle
    // the real credentials).
    return {
      ...settings,
      telegramBotToken: settings.telegramBotToken ? maskSecret(settings.telegramBotToken) : null,
      telegramChatId: settings.telegramChatId ? maskSecret(settings.telegramChatId) : null,
    };
  }
  return prisma.siteSettings.create({ data: {} });
}

export async function updateSettings(input: Record<string, unknown>, userId: number, ip?: string | null) {
  const current = await prisma.siteSettings.findFirst();
  const data: Record<string, unknown> = {};
  // The ticker config rides on the same settings row; persist it with the
  // same update path so one endpoint drives theme + languages + ticker.
  for (const field of [...PUBLIC_FIELDS, ...THEME_FIELDS, ...SHARE_FIELDS]) {
    if (input[field] !== undefined) data[field] = input[field];
  }

  const settings = current
    ? await prisma.siteSettings.update({ where: { id: current.id }, data })
    : await prisma.siteSettings.create({ data: data as never });

  await logActivity({ userId, action: "SETTINGS_UPDATED", ip });
  return settings;
}
