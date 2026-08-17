import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { logActivity } from "./activity.service";

const ACTIVE_POSITIONS = [
  "header",
  "sidebar",
  "inline",
  "footer",
  "homepage-top",
  "homepage-middle",
  "homepage-bottom",
  "article-top",
  "article-middle",
  "article-bottom",
  "category-top",
  "category-bottom",
] as const;
export type AdPosition = (typeof ACTIVE_POSITIONS)[number];

const DEVICES = ["all", "desktop", "tablet", "mobile"] as const;
type AdDevice = (typeof DEVICES)[number];

/**
 * Resolve the device bucket from a user-agent so banners can target
 * desktop / tablet / mobile without trusting the client.
 */
export function deviceFromUserAgent(ua: string): AdDevice {
  const u = ua.toLowerCase();
  if (/(ipad|tablet)/.test(u)) return "tablet";
  if (/mobile|android|iphone|ipod/.test(u)) return "mobile";
  return "desktop";
}

/**
 * Active banners for a slot: must be enabled, inside its schedule window,
 * and match the requesting device (device "all" matches everything).
 * Higher priority wins; ties fall back to newest first.
 */
export async function getByPosition(position: string, device?: string, limit = 2) {
  const now = new Date();
  const bucket = DEVICES.includes(device as AdDevice) ? (device as AdDevice) : undefined;
  const ads = await prisma.advertisement.findMany({
    where: {
      position,
      isActive: true,
      ...(bucket && bucket !== "all" ? { OR: [{ device: "all" }, { device: bucket }] } : {}),
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      title: true,
      image: true,
      link: true,
      target: true,
      position: true,
      device: true,
      priority: true,
    },
  });
  return ads;
}

export async function listAdmin() {
  return prisma.advertisement.findMany({ orderBy: { createdAt: "desc" } });
}

export interface AdInput {
  name?: string;
  title?: string | null;
  image?: string;
  link?: string | null;
  target?: string;
  position?: string;
  device?: string;
  priority?: number;
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
  if (input.device && !DEVICES.includes(input.device as AdDevice)) {
    throw ApiError.badRequest(`Device must be one of: ${DEVICES.join(", ")}`);
  }

  const ad = await prisma.advertisement.create({
    data: {
      name: input.name.trim(),
      title: input.title ?? null,
      image: input.image,
      link: input.link ?? null,
      target: input.target === "_self" ? "_self" : "_blank",
      position: input.position ?? "sidebar",
      device: input.device ?? "all",
      priority: input.priority ?? 0,
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
  if (input.title !== undefined) data.title = input.title || null;
  if (input.image !== undefined) data.image = input.image;
  if (input.link !== undefined) data.link = input.link || null;
  if (input.target !== undefined) data.target = input.target === "_self" ? "_self" : "_blank";
  if (input.position !== undefined) {
    if (!ACTIVE_POSITIONS.includes(input.position as AdPosition)) {
      throw ApiError.badRequest(`Position must be one of: ${ACTIVE_POSITIONS.join(", ")}`);
    }
    data.position = input.position;
  }
  if (input.device !== undefined) {
    if (!DEVICES.includes(input.device as AdDevice)) {
      throw ApiError.badRequest(`Device must be one of: ${DEVICES.join(", ")}`);
    }
    data.device = input.device;
  }
  if (input.priority !== undefined) data.priority = input.priority;
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
