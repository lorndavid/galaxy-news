import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { cacheClearPrefix } from "../lib/redis";
import { ApiError } from "../utils/ApiError";
import { buildPagination, parsePagination } from "../utils/paginate";
import { logActivity } from "./activity.service";

// ─── Cache keys ───
const CACHE_PREFIX = "live-stream";
const CACHE_KEYS = {
  active: `${CACHE_PREFIX}:active`,
  homepage: `${CACHE_PREFIX}:homepage`,
  upcoming: `${CACHE_PREFIX}:upcoming`,
  recent: `${CACHE_PREFIX}:recent`,
  all: `${CACHE_PREFIX}:all`,
};

const CACHE_TTL = 30; // seconds

// ─── Facebook URL normalization ───
function normalizeFacebookUrl(url: string): string {
  let normalized = url.trim();
  // Convert mobile URLs to desktop
  normalized = normalized.replace(
    /^https?:\/\/(m\.|web\.|touch\.)facebook\.com/,
    "https://www.facebook.com"
  );
  // Remove query params (fbclid etc) but keep video/watch params
  try {
    const u = new URL(normalized);
    if (u.searchParams.has("v")) {
      // Keep ?v= for video URLs
      const v = u.searchParams.get("v");
      u.search = v ? `?v=${v}` : "";
    } else {
      u.search = "";
    }
    normalized = u.toString();
  } catch {
    // If URL parsing fails, return as-is (validation already passed)
  }
  return normalized;
}

// ─── Helpers ───

function serialize(stream: any) {
  return {
    id: stream.id,
    titleKh: stream.titleKh,
    titleEn: stream.titleEn,
    descriptionKh: stream.descriptionKh,
    descriptionEn: stream.descriptionEn,
    facebookUrl: stream.facebookUrl,
    thumbnailUrl: stream.thumbnailUrl,
    status: stream.status,
    visibility: stream.visibility,
    isHomepage: stream.isHomepage,
    isFeatured: stream.isFeatured,
    displayOrder: stream.displayOrder,
    startAt: stream.startAt?.toISOString() ?? null,
    endAt: stream.endAt?.toISOString() ?? null,
    createdAt: stream.createdAt.toISOString(),
    updatedAt: stream.updatedAt.toISOString(),
  };
}

/** Calculate the effective public status based on time + stored status */
function effectiveStatus(stream: {
  status: string;
  startAt: Date | null;
  endAt: Date | null;
}): string {
  if (stream.status === "DISABLED" || stream.status === "ENDED") {
    return stream.status;
  }
  if (stream.status === "DRAFT") return "DRAFT";

  const now = new Date();
  if (stream.startAt && now < stream.startAt) return "SCHEDULED";
  if (stream.endAt && now > stream.endAt) return "ENDED";
  if (stream.status === "LIVE") return "LIVE";
  if (stream.status === "SCHEDULED" && stream.startAt && now >= stream.startAt) {
    return "LIVE";
  }
  return stream.status;
}

async function invalidateLiveStreamCache(): Promise<void> {
  await Promise.all([
    cacheClearPrefix(CACHE_KEYS.active),
    cacheClearPrefix(CACHE_KEYS.homepage),
    cacheClearPrefix(CACHE_KEYS.upcoming),
    cacheClearPrefix(CACHE_KEYS.recent),
    cacheClearPrefix(CACHE_KEYS.all),
  ]);
}

// ─── Admin CRUD ───

export interface LiveStreamInput {
  titleKh?: string;
  titleEn?: string | null;
  descriptionKh?: string | null;
  descriptionEn?: string | null;
  facebookUrl?: string;
  thumbnailUrl?: string | null;
  status?: string;
  visibility?: string;
  isHomepage?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  startAt?: string | null;
  endAt?: string | null;
}

export async function listAdmin(params: {
  page?: unknown;
  pageSize?: unknown;
  status?: string;
  q?: string;
}) {
  const pagination = parsePagination(params.page, params.pageSize, 50);
  const where: Prisma.LiveStreamWhereInput = {};

  if (params.status) where.status = params.status;
  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [
      { titleKh: { contains: q } },
      { titleEn: { contains: q } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.liveStream.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.liveStream.count({ where }),
  ]);

  return buildPagination(items.map(serialize), total, pagination);
}

export async function getAdmin(id: number) {
  const stream = await prisma.liveStream.findUnique({ where: { id } });
  if (!stream) throw ApiError.notFound("Live Stream not found");
  return serialize(stream);
}

export async function create(
  input: LiveStreamInput,
  userId: number,
  ip?: string | null
) {
  if (!input.titleKh) throw ApiError.badRequest("Khmer title is required");
  if (!input.facebookUrl) throw ApiError.badRequest("Facebook URL is required");

  const data: Prisma.LiveStreamUncheckedCreateInput = {
    titleKh: input.titleKh.trim(),
    titleEn: input.titleEn?.trim() || null,
    descriptionKh: input.descriptionKh?.trim() || null,
    descriptionEn: input.descriptionEn?.trim() || null,
    facebookUrl: normalizeFacebookUrl(input.facebookUrl),
    thumbnailUrl: input.thumbnailUrl || null,
    status: input.status ?? "DRAFT",
    visibility: input.visibility ?? "HOMEPAGE",
    isHomepage: input.isHomepage ?? false,
    isFeatured: input.isFeatured ?? false,
    displayOrder: input.displayOrder ?? 0,
    startAt: input.startAt ? new Date(input.startAt) : null,
    endAt: input.endAt ? new Date(input.endAt) : null,
  };

  const stream = await prisma.liveStream.create({ data });

  await logActivity({
    userId,
    action: "LIVE_STREAM_CREATED",
    entity: "LiveStream",
    entityId: stream.id,
    meta: { title: stream.titleKh, status: stream.status },
    ip,
  });

  await invalidateLiveStreamCache();
  return serialize(stream);
}

export async function update(
  id: number,
  input: LiveStreamInput,
  userId: number,
  ip?: string | null
) {
  const existing = await prisma.liveStream.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Live Stream not found");

  const data: Prisma.LiveStreamUncheckedUpdateInput = {};
  if (input.titleKh !== undefined) data.titleKh = input.titleKh.trim();
  if (input.titleEn !== undefined) data.titleEn = input.titleEn?.trim() || null;
  if (input.descriptionKh !== undefined)
    data.descriptionKh = input.descriptionKh?.trim() || null;
  if (input.descriptionEn !== undefined)
    data.descriptionEn = input.descriptionEn?.trim() || null;
  if (input.facebookUrl !== undefined)
    data.facebookUrl = normalizeFacebookUrl(input.facebookUrl);
  if (input.thumbnailUrl !== undefined)
    data.thumbnailUrl = input.thumbnailUrl || null;
  if (input.status !== undefined) data.status = input.status;
  if (input.visibility !== undefined) data.visibility = input.visibility;
  if (input.isHomepage !== undefined) data.isHomepage = input.isHomepage;
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  if (input.displayOrder !== undefined)
    data.displayOrder = input.displayOrder;
  if (input.startAt !== undefined)
    data.startAt = input.startAt ? new Date(input.startAt) : null;
  if (input.endAt !== undefined)
    data.endAt = input.endAt ? new Date(input.endAt) : null;

  const stream = await prisma.liveStream.update({ where: { id }, data });

  await logActivity({
    userId,
    action: "LIVE_STREAM_UPDATED",
    entity: "LiveStream",
    entityId: stream.id,
    meta: { title: stream.titleKh, status: stream.status },
    ip,
  });

  await invalidateLiveStreamCache();
  return serialize(stream);
}

export async function remove(id: number, userId: number, ip?: string | null) {
  const existing = await prisma.liveStream.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Live Stream not found");

  await prisma.liveStream.delete({ where: { id } });

  await logActivity({
    userId,
    action: "LIVE_STREAM_DELETED",
    entity: "LiveStream",
    entityId: id,
    meta: { title: existing.titleKh },
    ip,
  });

  await invalidateLiveStreamCache();
}

export async function updateStatus(
  id: number,
  status: string,
  userId: number,
  ip?: string | null
) {
  const stream = await prisma.liveStream.findUnique({ where: { id } });
  if (!stream) throw ApiError.notFound("Live Stream not found");

  const updated = await prisma.liveStream.update({
    where: { id },
    data: { status },
  });

  await logActivity({
    userId,
    action: "LIVE_STREAM_STATUS_CHANGED",
    entity: "LiveStream",
    entityId: id,
    meta: { title: stream.titleKh, from: stream.status, to: status },
    ip,
  });

  await invalidateLiveStreamCache();
  return serialize(updated);
}

export async function updateHomepage(
  id: number,
  isHomepage: boolean,
  userId: number,
  ip?: string | null
) {
  const stream = await prisma.liveStream.findUnique({ where: { id } });
  if (!stream) throw ApiError.notFound("Live Stream not found");

  const updated = await prisma.liveStream.update({
    where: { id },
    data: { isHomepage },
  });

  await logActivity({
    userId,
    action: "LIVE_STREAM_HOMEPAGE_CHANGED",
    entity: "LiveStream",
    entityId: id,
    meta: { title: stream.titleKh, isHomepage },
    ip,
  });

  await invalidateLiveStreamCache();
  return serialize(updated);
}

// ─── Public ───

export async function getActiveStream() {
  const streams = await prisma.liveStream.findMany({
    where: {
      status: { in: ["LIVE", "SCHEDULED"] },
      visibility: { not: "HIDDEN" },
    },
    orderBy: [{ displayOrder: "asc" }, { startAt: "asc" }],
    take: 5,
  });

  // Calculate effective status for each
  return streams
    .map((s) => ({
      ...serialize(s),
      effectiveStatus: effectiveStatus(s),
    }))
    .filter((s) => s.effectiveStatus === "LIVE" || s.effectiveStatus === "SCHEDULED");
}

export async function getHomepageStream() {
  const streams = await prisma.liveStream.findMany({
    where: {
      isHomepage: true,
      status: { in: ["LIVE", "SCHEDULED"] },
      visibility: "HOMEPAGE",
    },
    orderBy: [{ displayOrder: "asc" }, { startAt: "asc" }],
    take: 1,
  });

  if (!streams.length) return null;

  const stream = streams[0];
  const effStatus = effectiveStatus(stream);
  return {
    ...serialize(stream),
    effectiveStatus: effStatus,
  };
}

export async function getPublicStreams() {
  const streams = await prisma.liveStream.findMany({
    where: {
      status: { notIn: ["DRAFT", "DISABLED"] },
      visibility: { not: "HIDDEN" },
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    take: 20,
  });

  return streams.map((s) => ({
    ...serialize(s),
    effectiveStatus: effectiveStatus(s),
  }));
}
