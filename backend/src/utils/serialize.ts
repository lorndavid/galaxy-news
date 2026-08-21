import { Article, Prisma } from "@prisma/client";

export const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  isActive: true,
} satisfies Prisma.UserSelect;

export const articleInclude = {
  author: { select: safeUserSelect },
  category: true,
  tags: { include: { tag: true } },
  images: { include: { media: true }, orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ArticleInclude;

type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: typeof articleInclude;
}>;

export function serializeArticle(article: ArticleWithRelations) {
  return {
    ...article,
    tags: article.tags.map((t) => t.tag),
    images: article.images.map((img) => ({
      id: img.id,
      mediaId: img.mediaId,
      url: img.media.url,
      altText: img.altText ?? img.media.altText,
      caption: img.caption ?? img.media.caption,
      title: img.title ?? null,
      description: img.description ?? null,
      cropPosition: img.cropPosition ?? "center",
      width: img.media.width,
      height: img.media.height,
      sortOrder: img.sortOrder,
    })),
    author: {
      id: article.author.id,
      name: article.author.name,
      avatar: article.author.avatar,
      role: article.author.role,
    },
  };
}

export function isPublished(a: Pick<Article, "status">): boolean {
  return a.status === "PUBLISHED";
}

// ------------------------------------------------------------------
// Lightweight list serializer — skips the full HTML body, gallery
// images, and tag details. Used by listing endpoints (latest,
// breaking, popular, category feed, search) where the response can
// be 3-5× smaller without the rich article body.
// ------------------------------------------------------------------

export const articleListSelect = {
  id: true,
  title: true,
  titleEn: true,
  titleZh: true,
  slug: true,
  excerpt: true,
  excerptEn: true,
  excerptZh: true,
  featuredImage: true,
  authorId: true,
  categoryId: true,
  status: true,
  isFeatured: true,
  isBreaking: true,
  views: true,
  galleryColumns: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, avatar: true, role: true } },
  category: true,
  tags: { include: { tag: { select: { id: true, name: true, nameEn: true, slug: true } } } },
  images: false,
} satisfies Prisma.ArticleSelect;

type ArticleListRow = Prisma.ArticleGetPayload<{
  select: typeof articleListSelect;
}>;

/**
 * Serialize a lightweight article row for listing endpoints.
 * 3-5× smaller than the full serializer because it omits content
 * and gallery images.
 */
export function serializeArticleListItem(article: ArticleListRow) {
  return {
    ...article,
    // content is NOT included — callers don't need the full HTML body
    tags: article.tags.map((t) => t.tag),
    // images omitted — listings use featuredImage only
  };
}
