import { prisma } from "../lib/prisma";
import { deleteStoredImage, storeImage } from "../lib/storage";
import { ApiError } from "../utils/ApiError";
import { buildPagination, parsePagination } from "../utils/paginate";
import { logActivity } from "./activity.service";

export interface UploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export async function uploadMedia(file: UploadFile | undefined, userId: number, altText?: string, ip?: string | null) {
  if (!file) throw ApiError.badRequest("No image file provided");

  const stored = await storeImage(file.buffer, file.mimetype);

  const media = await prisma.media.create({
    data: {
      publicId: stored.publicId,
      url: stored.url,
      secureUrl: stored.secureUrl,
      fileName: file.originalname,
      width: stored.width,
      height: stored.height,
      format: stored.format,
      size: file.size ?? stored.size,
      altText: altText ?? null,
      createdById: userId,
    },
  });

  await logActivity({ userId, action: "MEDIA_UPLOADED", entity: "Media", entityId: media.id, meta: { fileName: file.originalname }, ip });
  return media;
}

export async function listMedia(pageRaw?: unknown, pageSizeRaw?: unknown, q?: string) {
  const pagination = parsePagination(pageRaw, pageSizeRaw, 60);
  const where = q?.trim()
    ? { OR: [{ fileName: { contains: q.trim() } }, { altText: { contains: q.trim() } }] }
    : {};

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: { createdBy: { select: { id: true, name: true } } },
    }),
    prisma.media.count({ where }),
  ]);
  return buildPagination(items, total, pagination);
}

export async function deleteMedia(id: number, userId: number, ip?: string | null) {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw ApiError.notFound("Media not found");

  await deleteStoredImage(media.publicId, media.url);
  await prisma.media.delete({ where: { id } });
  await logActivity({ userId, action: "MEDIA_DELETED", entity: "Media", entityId: id, meta: { fileName: media.fileName }, ip });
}
