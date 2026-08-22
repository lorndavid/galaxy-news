import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { slugify } from "../utils/slugify";
import { logActivity } from "./activity.service";

export async function listPublic() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { articles: { where: { status: "PUBLISHED" } } } } },
  });
  return categories;
}

export async function listAdmin() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { articles: true } } },
  });
  return categories;
}

export interface CategoryInput {
  name?: string;
  nameEn?: string | null;
  nameZh?: string | null;
  slug?: string;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionZh?: string | null;
  image?: string | null;
  color?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export async function createCategory(input: CategoryInput, userId: number, ip?: string | null) {
  if (!input.name?.trim()) throw ApiError.badRequest("Category name is required");
  const name = input.name.trim();
  const baseSlug = slugify(input.slug ?? name, "category");

  let slug = baseSlug;
  let i = 2;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i}`;
    i += 1;
  }

  const category = await prisma.category.create({
    data: {
      name,
      nameEn: input.nameEn ?? null,
      nameZh: input.nameZh ?? null,
      slug,
      description: input.description ?? null,
      descriptionEn: input.descriptionEn ?? null,
      descriptionZh: input.descriptionZh ?? null,
      image: input.image ?? null,
      color: input.color ?? "#0b1c39",
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    },
  });
  await logActivity({ userId, action: "CATEGORY_CREATED", entity: "Category", entityId: category.id, meta: { name }, ip });
  return category;
}

export async function updateCategory(id: number, input: CategoryInput, userId: number, ip?: string | null) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Category not found");

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    data.name = name;
    if (name !== existing.name && !input.slug) {
      data.slug = slugify(name) || existing.slug;
    }
  }
  if (input.slug !== undefined) {
    const slug = slugify(input.slug);
    if (slug && slug !== existing.slug) {
      const clash = await prisma.category.findUnique({ where: { slug } });
      if (clash) throw ApiError.conflict("A category with this slug already exists");
      data.slug = slug;
    }
  }
  if (input.nameEn !== undefined) data.nameEn = input.nameEn || null;
  if (input.nameZh !== undefined) data.nameZh = input.nameZh || null;
  if (input.description !== undefined) data.description = input.description || null;
  if (input.descriptionEn !== undefined) data.descriptionEn = input.descriptionEn || null;
  if (input.descriptionZh !== undefined) data.descriptionZh = input.descriptionZh || null;
  if (input.image !== undefined) data.image = input.image || null;
  if (input.color !== undefined) data.color = input.color || "#0b1c39";
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

  const category = await prisma.category.update({ where: { id }, data });
  await logActivity({ userId, action: "CATEGORY_UPDATED", entity: "Category", entityId: id, meta: { name: category.name }, ip });
  return category;
}

export async function deleteCategory(id: number, userId: number, ip?: string | null) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Category not found");
  const articleCount = await prisma.article.count({ where: { categoryId: id } });
  if (articleCount > 0) {
    throw ApiError.conflict(
      `Category "${existing.name}" still has ${articleCount} article(s). Archive or move them first.`
    );
  }
  await prisma.category.delete({ where: { id } });
  await logActivity({ userId, action: "CATEGORY_DELETED", entity: "Category", entityId: id, meta: { name: existing.name }, ip });
}

export async function reorderCategories(items: { id: number; sortOrder: number }[], userId: number, ip?: string | null) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.category.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );
  await logActivity({ userId, action: "CATEGORIES_REORDERED", ip });
}
