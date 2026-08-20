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
