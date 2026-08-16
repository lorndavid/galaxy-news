import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { logActivity } from "./activity.service";

const ACTIVE_POSITIONS = ["header", "sidebar", "inline", "footer"] as const;
export type AdPosition = (typeof ACTIVE_POSITIONS)[number];

export async function getByPosition(position: string, limit = 2) {
  const now = new Date();
  const ads = await prisma.advertisement.findMany({
    where: {
      position,
      isActive: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, name: true, image: true, link: true, position: true },
  });
  return ads;
}

export async function listAdmin() {
  return prisma.advertisement.findMany({ orderBy: { createdAt: "desc" } });
}

export interface AdInput {
  name?: string;
  image?: string;
  link?: string | null;
  position?: string;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export async function createAd(input: AdInput, userId: number, ip?: string | null) {
  if (!input.name?.trim()) throw ApiError.badRequest("Ad name is required");
  if (!input.image) throw ApiError.badRequest("Ad image is required");
  if (input.position && !ACTIVE_POSITIONS.includes(input.position as AdPosition)) {
    throw ApiError.badRequest(`Position must be one of: ${ACTIVE_POSITIONS.join(", ")}`);
  }

  const ad = await prisma.advertisement.create({
    data: {
      name: input.name.trim(),
      image: input.image,
      link: input.link ?? null,
      position: input.position ?? "sidebar",
      isActive: input.isActive ?? true,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
    },
  });
  await logActivity({ userId, action: "AD_CREATED", entity: "Advertisement", entityId: ad.id, meta: { name: ad.name }, ip });
  return ad;
}

export async function updateAd(id: number, input: AdInput, userId: number, ip?: string | null) {
  const existing = await prisma.advertisement.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Advertisement not found");

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.image !== undefined) data.image = input.image;
  if (input.link !== undefined) data.link = input.link || null;
  if (input.position !== undefined) {
    if (!ACTIVE_POSITIONS.includes(input.position as AdPosition)) {
      throw ApiError.badRequest(`Position must be one of: ${ACTIVE_POSITIONS.join(", ")}`);
    }
    data.position = input.position;
  }
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.startDate !== undefined) data.startDate = input.startDate ? new Date(input.startDate) : null;
  if (input.endDate !== undefined) data.endDate = input.endDate ? new Date(input.endDate) : null;

  const ad = await prisma.advertisement.update({ where: { id }, data });
  await logActivity({ userId, action: "AD_UPDATED", entity: "Advertisement", entityId: id, meta: { name: ad.name }, ip });
  return ad;
}

export async function deleteAd(id: number, userId: number, ip?: string | null) {
  const existing = await prisma.advertisement.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Advertisement not found");
  await prisma.advertisement.delete({ where: { id } });
  await logActivity({ userId, action: "AD_DELETED", entity: "Advertisement", entityId: id, meta: { name: existing.name }, ip });
}
