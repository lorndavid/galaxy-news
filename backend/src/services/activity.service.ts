import { prisma } from "../lib/prisma";
import { buildPagination, parsePagination } from "../utils/paginate";

export interface ActivityInput {
  userId?: number | null;
  action: string;
  entity?: string | null;
  entityId?: number | null;
  meta?: unknown;
  ip?: string | null;
}

export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        meta: input.meta === undefined ? null : JSON.stringify(input.meta),
        ip: input.ip ?? null,
      },
    });
  } catch (error) {
    // Logging must never break the main request.
    console.error("Failed to write activity log", error);
  }
}

export async function listActivity(pageRaw?: unknown, pageSizeRaw?: unknown) {
  const pagination = parsePagination(pageRaw, pageSizeRaw, 100);
  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.activityLog.count(),
  ]);
  return buildPagination(items, total, pagination);
}
