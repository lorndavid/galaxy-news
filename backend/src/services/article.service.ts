import { Prisma } from "@prisma/client";
import { ArticleStatus, Role } from "../constants";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { buildPagination, Pagination, parsePagination } from "../utils/paginate";
import { articleInclude, articleListSelect, serializeArticle, serializeArticleListItem } from "../utils/serialize";
import { slugify } from "../utils/slugify";
import { sanitizeContent } from "../utils/sanitize";
import { logActivity } from "./activity.service";
import { maybeAutoPublish } from "./telegram.service";

// ---------- Shared helpers ----------

function wherePublished() {
  return {
    status: "PUBLISHED" as const,
    publishedAt: { lte: new Date() },
  };
}

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  const candidate = slugify(base, "article");
  let slug = candidate;
  let i = 2;
  while (
    await prisma.article.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    })
  ) {
    slug = `${candidate}-${i}`;
    i += 1;
  }
  return slug;
}

// ---------- Public ----------

export interface PublicListParams {
  page?: unknown;
  pageSize?: unknown;
  category?: string;
  tag?: string;
  q?: string;
  featured?: string;
  breaking?: string;
  sort?: "latest" | "popular";
  authorId?: string;
}

export async function listPublic(params: PublicListParams) {
  const pagination = parsePagination(params.page, params.pageSize, 24);

  const where: Prisma.ArticleWhereInput = { ...wherePublished() };

  if (params.category) {
    where.category = { slug: params.category };
  }
  if (params.tag) {
    where.tags = { some: { tag: { slug: params.tag } } };
  }
  if (params.featured === "1" || params.featured === "true") {
    where.isFeatured = true;
  }
  if (params.breaking === "1" || params.breaking === "true") {
    where.isBreaking = true;
  }
  if (params.authorId) {
    where.authorId = Number(params.authorId) || undefined;
  }
  if (params.q && params.q.trim()) {
    const q = params.q.trim();
    where.OR = [
      { title: { contains: q } },
      { excerpt: { contains: q } },
      { content: { contains: q } },
    ];
  }

  const orderBy: Prisma.ArticleOrderByWithRelationInput[] =
    params.sort === "popular"
      ? [{ views: "desc" }, { publishedAt: "desc" }]
      : [{ publishedAt: "desc" }];

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: articleListSelect,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.article.count({ where }),
  ]);

  return buildPagination(items.map(serializeArticleListItem), total, pagination);
}

export async function getBySlug(slug: string, userAgent?: string | null) {
  const article = await prisma.article.findFirst({
    where: { slug, ...wherePublished() },
    include: articleInclude,
  });
  if (!article) throw ApiError.notFound("Article not found");

  // Track views (skip bots) — the counter is the source of truth for
  // totals; the ViewLog row adds the time dimension for the dashboard's
  // views-over-time chart.
  const ua = (userAgent ?? "").toLowerCase();
  if (!ua.includes("bot") && !ua.includes("crawler") && !ua.includes("spider")) {
    await Promise.all([
      prisma.article.update({
        where: { id: article.id },
        data: { views: { increment: 1 } },
      }),
      prisma.viewLog.create({ data: { articleId: article.id } }),
    ]);
    article.views += 1;
  }
  return serializeArticle(article);
}

export async function getRelated(articleId: number, categoryId: number, limit = 6) {
  const items = await prisma.article.findMany({
    where: {
      ...wherePublished(),
      id: { not: articleId },
      OR: [
        { categoryId },
        {
          tags: {
            some: {
              tag: {
                articles: { some: { articleId: { not: articleId } } },
              },
            },
          },
        },
      ],
    },
    select: articleListSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return items.map(serializeArticleListItem);
}

export async function getBreaking(limit = 10) {
  const items = await prisma.article.findMany({
    where: { ...wherePublished(), isBreaking: true },
    select: articleListSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return items.map(serializeArticleListItem);
}

export async function getFeatured(limit = 5) {
  const items = await prisma.article.findMany({
    where: { ...wherePublished(), isFeatured: true },
    select: articleListSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return items.map(serializeArticleListItem);
}

export async function getLatest(limit = 8) {
  const items = await prisma.article.findMany({
    where: wherePublished(),
    select: articleListSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return items.map(serializeArticleListItem);
}

export async function getPopular(limit = 5) {
  const items = await prisma.article.findMany({
    where: wherePublished(),
    select: articleListSelect,
    orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });
  return items.map(serializeArticleListItem);
}

export async function listByCategory(categorySlug: string, pageRaw?: unknown) {
  const pagination = parsePagination(pageRaw, undefined, 24);
  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) throw ApiError.notFound("Category not found");

  const where: Prisma.ArticleWhereInput = {
    ...wherePublished(),
    categoryId: category.id,
  };
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: articleListSelect,
      orderBy: { publishedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    category,
    ...buildPagination(items.map(serializeArticleListItem), total, pagination),
  };
}

// ---------- Admin ----------

export interface AdminListParams {
  page?: unknown;
  pageSize?: unknown;
  q?: string;
  status?: ArticleStatus;
  categoryId?: string;
  authorId?: string;
}

export async function listAdmin(params: AdminListParams, userRole: Role, userId: number) {
  const pagination = parsePagination(params.page, params.pageSize, 50);
  const where: Prisma.ArticleWhereInput = {};

  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [{ title: { contains: q } }, { excerpt: { contains: q } }];
  }
  if (params.status) where.status = params.status;
  if (params.categoryId) where.categoryId = Number(params.categoryId) || undefined;
  if (params.authorId) where.authorId = Number(params.authorId) || undefined;
  // Authors only manage their own articles.
  if (userRole === Role.AUTHOR) where.authorId = userId;

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: { updatedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.article.count({ where }),
  ]);

  return buildPagination(items.map(serializeArticle), total, pagination);
}

export async function getAdmin(id: number) {
  const article = await prisma.article.findUnique({
    where: { id },
    include: articleInclude,
  });
  if (!article) throw ApiError.notFound("Article not found");
  const telegramPublications = await prisma.telegramPublication.findMany({
    where: { articleId: id },
    orderBy: { id: "asc" },
  });
  return { ...serializeArticle(article), telegramPublications };
}

export interface ArticleInput {
  title?: string;
  titleEn?: string | null;
  titleZh?: string | null;
  excerpt?: string | null;
  excerptEn?: string | null;
  excerptZh?: string | null;
  content?: string;
  contentEn?: string | null;
  contentZh?: string | null;
  featuredImage?: string | null;
  authorId?: number;
  categoryId?: number;
  status?: ArticleStatus;
  isFeatured?: boolean;
  isBreaking?: boolean;
  galleryColumns?: number;
  publishedAt?: string | null;
  tagIds?: number[];
}

export async function createArticle(input: ArticleInput, userId: number, role: Role, ip?: string | null) {
  if (!input.title) throw ApiError.badRequest("Title is required");
  if (!input.categoryId) throw ApiError.badRequest("Category is required");

  const title = input.title.trim();
  const slug = await uniqueSlug(title);
  const publishedAt =
    input.publishedAt && input.publishedAt !== ""
      ? new Date(input.publishedAt)
      : null;

  const data: Prisma.ArticleUncheckedCreateInput = {
    title,
    titleEn: input.titleEn?.trim() || null,
    titleZh: input.titleZh?.trim() || null,
    slug,
    excerpt: input.excerpt?.trim() ?? null,
    excerptEn: input.excerptEn?.trim() || null,
    excerptZh: input.excerptZh?.trim() || null,
    content: sanitizeContent(input.content ?? ""),
    contentEn: input.contentEn ? sanitizeContent(input.contentEn) : null,
    contentZh: input.contentZh ? sanitizeContent(input.contentZh) : null,
    featuredImage: input.featuredImage ?? null,
    authorId: role === Role.AUTHOR ? userId : input.authorId ?? userId,
    categoryId: input.categoryId,
    status: input.status ?? ArticleStatus.DRAFT,
    isFeatured: input.isFeatured ?? false,
    isBreaking: input.isBreaking ?? false,
    publishedAt:
      input.status === ArticleStatus.PUBLISHED && !publishedAt ? new Date() : publishedAt,
    tags: input.tagIds?.length
      ? { create: input.tagIds.map((tagId) => ({ tagId })) }
      : undefined,
  };

  const article = await prisma.article.create({
    data,
    include: articleInclude,
  });

  await logActivity({
    userId,
    action: "ARTICLE_CREATED",
    entity: "Article",
    entityId: article.id,
    meta: { title, status: article.status },
    ip,
  });
  // Auto-publish to Telegram (async, never blocks or breaks article save).
  if (article.status === ArticleStatus.PUBLISHED) await maybeAutoPublish(article.id);
  return serializeArticle(article);
}

export async function updateArticle(
  id: number,
  input: ArticleInput,
  userId: number,
  role: Role,
  ip?: string | null
) {
  const existing = await prisma.article.findUnique({
    where: { id },
    include: { tags: true },
  });
  if (!existing) throw ApiError.notFound("Article not found");
  if (role === Role.AUTHOR && existing.authorId !== userId) {
    throw ApiError.forbidden("You can only edit your own articles");
  }

  const data: Prisma.ArticleUncheckedUpdateInput = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    data.title = title;
    if (title !== existing.title) {
      data.slug = await uniqueSlug(title, id);
    }
  }
  if (input.titleEn !== undefined) data.titleEn = input.titleEn?.trim() || null;
  if (input.titleZh !== undefined) data.titleZh = input.titleZh?.trim() || null;
  if (input.excerpt !== undefined) data.excerpt = input.excerpt?.trim() || null;
  if (input.excerptEn !== undefined) data.excerptEn = input.excerptEn?.trim() || null;
  if (input.excerptZh !== undefined) data.excerptZh = input.excerptZh?.trim() || null;
  if (input.content !== undefined) data.content = sanitizeContent(input.content);
  if (input.contentEn !== undefined) data.contentEn = input.contentEn ? sanitizeContent(input.contentEn) : null;
  if (input.contentZh !== undefined) data.contentZh = input.contentZh ? sanitizeContent(input.contentZh) : null;
  if (input.featuredImage !== undefined) data.featuredImage = input.featuredImage || null;
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  if (input.isBreaking !== undefined) data.isBreaking = input.isBreaking;
  if (input.galleryColumns !== undefined) data.galleryColumns = input.galleryColumns;

  if (input.status !== undefined) {
    data.status = input.status;
    if (input.status === ArticleStatus.PUBLISHED && !existing.publishedAt) {
      data.publishedAt = new Date();
    }
    if (input.status === ArticleStatus.DRAFT) {
      data.publishedAt = null;
    }
  }

  if (input.tagIds !== undefined) {
    data.tags = {
      deleteMany: {},
      create: input.tagIds.map((tagId) => ({ tagId })),
    };
  }

  const article = await prisma.article.update({
    where: { id },
    data,
    include: articleInclude,
  });

  await logActivity({
    userId,
    action: "ARTICLE_UPDATED",
    entity: "Article",
    entityId: article.id,
    meta: { title: article.title, status: article.status },
    ip,
  });
  // Auto-publish to Telegram (async, never blocks or breaks article save).
  if (article.status === ArticleStatus.PUBLISHED) await maybeAutoPublish(article.id);
  return serializeArticle(article);
}

export async function deleteArticle(id: number, userId: number, role: Role, ip?: string | null) {
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Article not found");
  if (role === Role.AUTHOR && existing.authorId !== userId) {
    throw ApiError.forbidden("You can only delete your own articles");
  }
  await prisma.article.delete({ where: { id } });
  await logActivity({
    userId,
    action: "ARTICLE_DELETED",
    entity: "Article",
    entityId: id,
    meta: { title: existing.title },
    ip,
  });
}

export type ArticleBulkAction = "publish" | "unpublish" | "delete";

/**
 * Apply a bulk action (publish / unpublish / delete) to multiple articles.
 * Authors are restricted to their own articles. Returns the number of
 * articles affected.
 */
export async function bulkArticles(
  ids: number[],
  action: ArticleBulkAction,
  userId: number,
  role: Role,
  ip?: string | null
): Promise<{ count: number }> {
  const uniqueIds = [...new Set(ids)];
  const existing = await prisma.article.findMany({
    where: {
      id: { in: uniqueIds },
      ...(role === Role.AUTHOR ? { authorId: userId } : {}),
    },
  });
  if (existing.length === 0) {
    throw ApiError.notFound("No matching articles found");
  }

  if (action === "delete") {
    await prisma.article.deleteMany({ where: { id: { in: existing.map((a) => a.id) } } });
    await Promise.all(
      existing.map((a) =>
        logActivity({
          userId,
          action: "ARTICLE_DELETED",
          entity: "Article",
          entityId: a.id,
          meta: { title: a.title },
          ip,
        })
      )
    );
    return { count: existing.length };
  }

  const data: Prisma.ArticleUpdateManyMutationInput =
    action === "publish"
      ? { status: ArticleStatus.PUBLISHED, publishedAt: new Date() }
      : { status: ArticleStatus.DRAFT, publishedAt: null };

  await prisma.article.updateMany({
    where: { id: { in: existing.map((a) => a.id) } },
    data,
  });
  await Promise.all(
    existing.map((a) =>
      logActivity({
        userId,
        action: "ARTICLE_UPDATED",
        entity: "Article",
        entityId: a.id,
        meta: { title: a.title, status: data.status, bulk: action },
        ip,
      })
    )
  );
  // Auto-publish freshly published articles to Telegram (async).
  if (action === "publish") {
    await Promise.all(existing.map((a) => maybeAutoPublish(a.id)));
  }
  return { count: existing.length };
}

export async function getViewsStats(limit = 8) {
  const items = await prisma.article.findMany({
    where: wherePublished(),
    orderBy: { views: "desc" },
    take: limit,
    select: { id: true, title: true, views: true },
  });
  return items;
}
