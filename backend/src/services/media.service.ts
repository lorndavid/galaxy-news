import { prisma } from "../lib/prisma";
import { deleteStoredImage, storeImage } from "../lib/storage";
import { imageCacheDelete } from "../lib/redis";
import { ApiError } from "../utils/ApiError";
import { buildPagination, parsePagination } from "../utils/paginate";
import { logActivity } from "./activity.service";

export interface UploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export async function uploadMedia(
  file: UploadFile | undefined,
  userId: number,
  altText?: string,
  folder?: string,
  caption?: string,
  ip?: string | null
) {
  if (!file) throw ApiError.badRequest("No image file provided");

  const stored = await storeImage(file.buffer, file.mimetype, file.originalname, folder);

  const media = await prisma.media.create({
    data: {
      publicId: stored.publicId,
      objectKey: stored.objectKey,
      url: stored.url,
      secureUrl: stored.secureUrl,
      fileName: file.originalname,
      width: stored.width,
      height: stored.height,
      format: stored.format,
      size: file.size ?? stored.size,
      altText: altText ?? null,
      caption: caption ?? null,
      folder: stored.objectKey ? stored.objectKey.split("/")[0] : (folder ?? "articles"),
      createdById: userId,
    },
  });

  await logActivity({ userId, action: "MEDIA_UPLOADED", entity: "Media", entityId: media.id, meta: { fileName: file.originalname }, ip });
  return media;
}

export async function listMedia(pageRaw?: unknown, pageSizeRaw?: unknown, q?: string, folder?: string) {
  const pagination = parsePagination(pageRaw, pageSizeRaw, 60);
  const where: Record<string, unknown> = q?.trim()
    ? { OR: [{ fileName: { contains: q.trim() } }, { altText: { contains: q.trim() } }] }
    : {};

  if (folder && folder !== "all") where.folder = folder;

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

  await deleteStoredImage(media.objectKey, media.publicId, media.url);
  await prisma.media.delete({ where: { id } });
  // Invalidate cached image in Redis
  if (media.objectKey) await imageCacheDelete(media.objectKey);
  await logActivity({ userId, action: "MEDIA_DELETED", entity: "Media", entityId: id, meta: { fileName: media.fileName }, ip });
}

/**
 * Delete multiple media items: removes each object (and its generated
 * variants) from storage, then deletes the rows. Returns the number of
 * items deleted.
 */
export async function bulkDeleteMedia(
  ids: number[],
  userId: number,
  ip?: string | null
): Promise<{ count: number }> {
  const uniqueIds = [...new Set(ids)];
  const items = await prisma.media.findMany({
    where: { id: { in: uniqueIds } },
  });
  if (items.length === 0) {
    throw ApiError.notFound("No matching media found");
  }

  // Best-effort storage cleanup: a missing object (e.g. MinIO down) must
  // not block the database delete.
  await Promise.allSettled(
    items.map((m) => deleteStoredImage(m.objectKey, m.publicId, m.url))
  );

  // Invalidate cached images in Redis
  await Promise.allSettled(
    items.filter((m) => m.objectKey).map((m) => imageCacheDelete(m.objectKey!))
  );

  await prisma.media.deleteMany({ where: { id: { in: items.map((m) => m.id) } } });
  await Promise.all(
    items.map((m) =>
      logActivity({
        userId,
        action: "MEDIA_DELETED",
        entity: "Media",
        entityId: m.id,
        meta: { fileName: m.fileName, bulk: true },
        ip,
      })
    )
  );
  return { count: items.length };
}
