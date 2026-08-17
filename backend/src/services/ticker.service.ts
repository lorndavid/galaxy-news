import { prisma } from "../lib/prisma";
import { articleInclude, serializeArticle } from "../utils/serialize";

/**
 * Live news ticker — real published articles, driven by admin ticker
 * settings stored on SiteSettings. The response is cached by the route's
 * publicCache (and invalidated when articles are published/unpublished via
 * the targeted cache middleware).
 */
export async function getTickerData() {
  const settings = await prisma.siteSettings.findFirst();
  const count = Math.min(Math.max(settings?.tickerCount ?? 10, 1), 30);

  const items = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    include: articleInclude,
    orderBy: { publishedAt: "desc" },
    take: count,
  });

  return {
    enabled: settings?.tickerEnabled ?? false,
    title: settings?.tickerTitle ?? "LIVE NEWS",
    speed: settings?.tickerSpeed ?? "medium",
    direction: settings?.tickerDirection ?? "left",
    refresh: Math.max(settings?.tickerRefresh ?? 30, 10),
    backgroundColor: settings?.tickerBgColor ?? "#0b1c39",
    textColor: settings?.tickerTextColor ?? "#ffffff",
    accentColor: settings?.tickerAccentColor ?? "#fc3f00",
    items: items.map(serializeArticle),
  };
}
