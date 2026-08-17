import { prisma } from "../lib/prisma";
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

const DEFAULT_SETTINGS = { siteName: "Navatra 4K TV" };

export async function getPublic() {
  const settings = await prisma.siteSettings.findFirst();
  if (!settings) return DEFAULT_SETTINGS;
  const out: Record<string, unknown> = {};
  for (const field of PUBLIC_FIELDS) out[field] = settings[field];
  for (const field of THEME_FIELDS) out[field] = settings[field];
  return out;
}

export async function getAdmin() {
  const settings = await prisma.siteSettings.findFirst();
  if (settings) return settings;
  return prisma.siteSettings.create({ data: {} });
}

export async function updateSettings(input: Record<string, unknown>, userId: number, ip?: string | null) {
  const current = await prisma.siteSettings.findFirst();
  const data: Record<string, unknown> = {};
  // The ticker config rides on the same settings row; persist it with the
  // same update path so one endpoint drives theme + languages + ticker.
  for (const field of [...PUBLIC_FIELDS, ...THEME_FIELDS]) {
    if (input[field] !== undefined) data[field] = input[field];
  }

  const settings = current
    ? await prisma.siteSettings.update({ where: { id: current.id }, data })
    : await prisma.siteSettings.create({ data: data as never });

  await logActivity({ userId, action: "SETTINGS_UPDATED", ip });
  return settings;
}
