import { prisma } from "../lib/prisma";
import { logActivity } from "./activity.service";

export const NAV_TYPES = ["home", "category", "page", "link"] as const;

/** Public: active items, ordered. */
export async function getPublicNav() {
  return prisma.navigationItem.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listNav() {
  return prisma.navigationItem.findMany({ orderBy: { sortOrder: "asc" } });
}

export interface NavInput {
  label: string;
  labelEn?: string | null;
  type: (typeof NAV_TYPES)[number];
  value?: string | null;
  isActive?: boolean;
}

export async function createNavItem(input: NavInput, userId: number, ip?: string | null) {
  const max = await prisma.navigationItem.aggregate({ _max: { sortOrder: true } });
  const item = await prisma.navigationItem.create({
    data: {
      label: input.label,
      labelEn: input.labelEn ?? null,
      type: input.type,
      value: input.value || null,
      isActive: input.isActive ?? true,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  await logActivity({ userId, action: "NAV_CREATED", entity: "NavigationItem", entityId: item.id, ip });
  return item;
}

export async function updateNavItem(id: number, input: Partial<NavInput>, userId: number, ip?: string | null) {
  const item = await prisma.navigationItem.update({
    where: { id },
    data: {
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.labelEn !== undefined ? { labelEn: input.labelEn || null } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.value !== undefined ? { value: input.value || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
  await logActivity({ userId, action: "NAV_UPDATED", entity: "NavigationItem", entityId: id, ip });
  return item;
}

export async function reorderNav(order: { id: number; sortOrder: number }[], userId: number, ip?: string | null) {
  if (order.length) {
    await prisma.$transaction(
      order.map((o) =>
        prisma.navigationItem.update({ where: { id: o.id }, data: { sortOrder: Math.max(0, o.sortOrder) } })
      )
    );
  }
  await logActivity({ userId, action: "NAV_REORDERED", entity: "NavigationItem", ip });
  return prisma.navigationItem.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function deleteNavItem(id: number, userId: number, ip?: string | null) {
  await prisma.navigationItem.delete({ where: { id } });
  await logActivity({ userId, action: "NAV_DELETED", entity: "NavigationItem", entityId: id, ip });
}
