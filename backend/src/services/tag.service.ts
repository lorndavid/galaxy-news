import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { slugify } from "../utils/slugify";
import { logActivity } from "./activity.service";

export async function listAll() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });
  return tags;
}

export interface TagInput {
  name?: string;
  slug?: string;
}

export async function createTag(input: TagInput, userId: number, ip?: string | null) {
  if (!input.name?.trim()) throw ApiError.badRequest("Tag name is required");
  const name = input.name.trim();
  const slug = slugify(input.slug ?? name, "tag");
  const clash = await prisma.tag.findUnique({ where: { slug } });
  if (clash) throw ApiError.conflict("A tag with this slug already exists");

  const tag = await prisma.tag.create({ data: { name, slug } });
  await logActivity({ userId, action: "TAG_CREATED", entity: "Tag", entityId: tag.id, meta: { name }, ip });
  return tag;
}

export async function updateTag(id: number, input: TagInput, userId: number, ip?: string | null) {
  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Tag not found");

  const data: Record<string, string> = {};
  if (input.name !== undefined) {
    data.name = input.name.trim();
    if (!input.slug) data.slug = slugify(data.name) || existing.slug;
  }
  if (input.slug !== undefined && input.slug.trim()) {
    const slug = slugify(input.slug);
    if (slug && slug !== existing.slug) {
      const clash = await prisma.tag.findUnique({ where: { slug } });
      if (clash) throw ApiError.conflict("A tag with this slug already exists");
      data.slug = slug;
    }
  }

  const tag = await prisma.tag.update({ where: { id }, data });
  await logActivity({ userId, action: "TAG_UPDATED", entity: "Tag", entityId: id, meta: { name: tag.name }, ip });
  return tag;
}

export async function deleteTag(id: number, userId: number, ip?: string | null) {
  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Tag not found");
  await prisma.tag.delete({ where: { id } });
  await logActivity({ userId, action: "TAG_DELETED", entity: "Tag", entityId: id, meta: { name: existing.name }, ip });
}
