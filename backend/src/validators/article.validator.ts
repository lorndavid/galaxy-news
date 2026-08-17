import { z } from "zod";

export const articleStatusEnum = z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]);

// Image fields may be absolute URLs (legacy/local) or relative object
// paths served through the API proxy (/minio/..., /uploads/...).
const imageField = z
  .string()
  .refine((v) => /^https?:\/\//.test(v) || v.startsWith("/minio/") || v.startsWith("/uploads/"), {
    message: "Image must be a valid URL or /minio or /uploads path",
  })
  .nullable()
  .optional();

const articleFields = {
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(300, "Title is too long"),
  titleEn: z.string().trim().max(300, "English title is too long").nullable().optional(),
  excerpt: z.string().max(600, "Excerpt is too long").nullable().optional(),
  excerptEn: z.string().max(600, "English excerpt is too long").nullable().optional(),
  content: z.string().default(""),
  contentEn: z.string().nullable().optional(),
  featuredImage: imageField,
  categoryId: z.number().int().positive("Category is required"),
  status: articleStatusEnum.optional(),
  isFeatured: z.boolean().optional(),
  isBreaking: z.boolean().optional(),
  publishedAt: z.string().nullable().optional(),
  tagIds: z.array(z.number().int().positive()).max(20).optional(),
  authorId: z.number().int().positive().optional(),
};

export const articleCreateSchema = z.object({
  body: z.object(articleFields),
});

export const articleUpdateSchema = z.object({
  body: z.object(articleFields).partial(),
});

export const articleParamsSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const publicArticleListQuery = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional(),
    category: z.string().trim().optional(),
    tag: z.string().trim().optional(),
    q: z.string().trim().optional(),
    featured: z.enum(["1", "true"]).optional(),
    breaking: z.enum(["1", "true"]).optional(),
    sort: z.enum(["latest", "popular"]).optional(),
    authorId: z.coerce.number().int().positive().optional(),
  }),
});

export const adminArticleListQuery = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional(),
    q: z.string().trim().optional(),
    status: articleStatusEnum.optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    authorId: z.coerce.number().int().positive().optional(),
  }),
});

export const articleBulkSchema = z.object({
  body: z.object({
    ids: z.array(z.number().int().positive()).min(1, "Select at least one article").max(200, "Too many articles selected"),
    action: z.enum(["publish", "unpublish", "delete"]),
  }),
});
