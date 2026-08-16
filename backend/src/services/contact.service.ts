import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { buildPagination, parsePagination } from "../utils/paginate";

export interface ContactInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export async function submitMessage(input: ContactInput) {
  return prisma.contactMessage.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      subject: input.subject?.trim() || null,
      message: input.message.trim(),
    },
  });
}

export async function listMessages(pageRaw?: unknown, pageSizeRaw?: unknown) {
  const pagination = parsePagination(pageRaw, pageSizeRaw, 50);
  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.contactMessage.count(),
  ]);
  return buildPagination(items, total, pagination);
}

export async function deleteMessage(id: number) {
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) throw ApiError.notFound("Message not found");
  await prisma.contactMessage.delete({ where: { id } });
}
