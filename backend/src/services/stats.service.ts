import { ArticleStatus, CommentStatus, Role } from "../constants";
import { prisma } from "../lib/prisma";
import { getViewsStats } from "./article.service";
import { countActiveSubscribers } from "./newsletter.service";

export async function getDashboardStats() {
  const [totalArticles, published, drafts, scheduled, archived, categories, tags, users, authors, commentsPending, adsActive, newsletter, totalViews, recentActivity, recentArticles, topArticles] =
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
  };
}
