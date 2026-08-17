import { ArticleStatus, CommentStatus, Role } from "../constants";
import { prisma } from "../lib/prisma";
import { getViewsStats } from "./article.service";
import { countActiveSubscribers } from "./newsletter.service";

const TREND_DAYS = 14;

/**
 * Views per calendar day for the last TREND_DAYS days (oldest → newest),
 * zero-filled so the dashboard chart always has a complete series.
 */
export async function getViewsByDay(days = TREND_DAYS) {
  // Prisma stores SQLite DateTime as epoch milliseconds (INTEGER), so SQLite's
  // strftime() needs /1000 + 'unixepoch' to interpret it as a timestamp.
  const today = new Date();
  const since = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (days - 1))
  );

  // Aggregate raw view events into per-day counts (UTC calendar days).
  const rows = await prisma.$queryRaw<
    { day: string; count: bigint }[]
  >`SELECT strftime('%Y-%m-%d', viewedAt / 1000, 'unixepoch') AS day, COUNT(*) AS count
    FROM ViewLog
    WHERE viewedAt >= ${since}
    GROUP BY day`;

  const byDay = new Map(rows.map((r) => [r.day, Number(r.count)]));

  const series: { date: string; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const key = new Date(since.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    series.push({ date: key, count: byDay.get(key) ?? 0 });
  }
  return series;
}

export async function getDashboardStats() {
  const [totalArticles, published, drafts, scheduled, archived, categories, tags, users, authors, commentsPending, adsActive, newsletter, totalViews, recentActivity, recentArticles, topArticles, categoryBreakdown] =
    await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: ArticleStatus.PUBLISHED } }),
      prisma.article.count({ where: { status: ArticleStatus.DRAFT } }),
      prisma.article.count({ where: { status: ArticleStatus.SCHEDULED } }),
      prisma.article.count({ where: { status: ArticleStatus.ARCHIVED } }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.AUTHOR } }),
      prisma.comment.count({ where: { status: CommentStatus.PENDING } }),
      prisma.advertisement.count({ where: { isActive: true } }),
      countActiveSubscribers(),
      prisma.article.aggregate({ _sum: { views: true } }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.article.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, updatedAt: true, author: { select: { name: true } } },
      }),
      getViewsStats(8),
      getCategoryBreakdown(),
    ]);

  return {
    counts: {
      totalArticles,
      published,
      drafts,
      scheduled,
      archived,
      categories,
      tags,
      users,
      authors,
      commentsPending,
      adsActive,
      newsletter,
      totalViews: totalViews._sum.views ?? 0,
    },
    recentActivity,
    recentArticles,
    topArticles,
    categoryBreakdown,
    viewsByDay: await getViewsByDay(),
  };
}

/**
 * Article counts per category (published articles), sorted by count desc.
 * Used by the dashboard analysis card — shows where content is concentrated.
 */
async function getCategoryBreakdown(limit = 8) {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      nameEn: true,
      slug: true,
      color: true,
      _count: { select: { articles: { where: { status: ArticleStatus.PUBLISHED } } } },
    },
    orderBy: { articles: { _count: "desc" } },
    take: limit,
  });
  const total = rows.reduce((sum, r) => sum + r._count.articles, 0);
  return {
    total,
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      nameEn: r.nameEn,
      slug: r.slug,
      color: r.color,
      count: r._count.articles,
    })),
  };
}
