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
} satisfies Prisma.ArticleInclude;

type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: typeof articleInclude;
}>;

export function serializeArticle(article: ArticleWithRelations) {
  return {
    ...article,
    tags: article.tags.map((t) => t.tag),
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
