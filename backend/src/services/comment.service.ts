import { CommentStatus } from "../constants";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { buildPagination, parsePagination } from "../utils/paginate";
import { logActivity } from "./activity.service";

export interface CommentInput {
  articleId: number;
  name: string;
  email: string;
  content: string;
}

export async function submitComment(input: CommentInput, ip?: string | null) {
  const article = await prisma.article.findUnique({ where: { id: input.articleId } });
  if (!article) throw ApiError.notFound("Article not found");

  const comment = await prisma.comment.create({
    data: {
      articleId: input.articleId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      content: input.content.trim(),
      status: CommentStatus.PENDING,
    },
  });
  await logActivity({ action: "COMMENT_SUBMITTED", entity: "Comment", entityId: comment.id, ip });
  return comment;
}

export async function listApprovedByArticle(articleId: number) {
  const comments = await prisma.comment.findMany({
    where: { articleId, status: CommentStatus.APPROVED },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, content: true, createdAt: true },
  });
  return comments;
}

export async function listAdmin(pageRaw?: unknown, pageSizeRaw?: unknown, status?: CommentStatus, articleId?: string) {
  const pagination = parsePagination(pageRaw, pageSizeRaw, 50);
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (articleId) where.articleId = Number(articleId) || undefined;

  const [items, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: { article: { select: { id: true, title: true, slug: true } } },
    }),
    prisma.comment.count({ where }),
  ]);
  return buildPagination(items, total, pagination);
}

export async function setCommentStatus(id: number, status: CommentStatus, userId: number, ip?: string | null) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw ApiError.notFound("Comment not found");
  const updated = await prisma.comment.update({ where: { id }, data: { status } });
  await logActivity({ userId, action: "COMMENT_MODERATED", entity: "Comment", entityId: id, meta: { status }, ip });
  return updated;
}

export async function deleteComment(id: number, userId: number, ip?: string | null) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw ApiError.notFound("Comment not found");
  await prisma.comment.delete({ where: { id } });
  await logActivity({ userId, action: "COMMENT_DELETED", entity: "Comment", entityId: id, ip });
}
