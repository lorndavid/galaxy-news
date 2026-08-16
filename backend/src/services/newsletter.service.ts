import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { buildPagination, parsePagination } from "../utils/paginate";

export interface NewsletterInput {
  email: string;
}

/**
 * Subscribe an email to the newsletter.
 * Dedupes by email: re-subscribing simply re-activates the existing row.
 */
export async function subscribe(input: NewsletterInput) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing) {
    if (!existing.isActive) {
      await prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }
    return existing;
  }
  return prisma.newsletterSubscriber.create({ data: { email } });
}

export async function listSubscribers(pageRaw?: unknown, pageSizeRaw?: unknown) {
  const pagination = parsePagination(pageRaw, pageSizeRaw, 50);
  const [items, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.newsletterSubscriber.count(),
  ]);
  return buildPagination(items, total, pagination);
}

export async function countActiveSubscribers() {
  return prisma.newsletterSubscriber.count({ where: { isActive: true } });
}

export async function deleteSubscriber(id: number) {
  const sub = await prisma.newsletterSubscriber.findUnique({ where: { id } });
  if (!sub) throw ApiError.notFound("Subscriber not found");
  await prisma.newsletterSubscriber.delete({ where: { id } });
}
