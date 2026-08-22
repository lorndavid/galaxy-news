import { z } from "zod";

export const idParamsSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const slugParamsSchema = z.object({
  params: z.object({
    slug: z.string().trim().min(1),
  }),
});

// ---------- Shared image field ----------
// Image fields may be absolute URLs (R2 public/custom domain, legacy)
// or relative object paths (/uploads/...).
const imageField = z
  .string()
  .refine((v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"), {
    message: "Image must be a valid URL or /uploads path",
  })
  .nullable()
  .optional();

// ---------- Category ----------

export const categoryCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required").max(80),
    nameEn: z.string().trim().max(80).nullable().optional(),
    nameZh: z.string().trim().max(80).nullable().optional(),
    slug: z.string().trim().max(100).optional(),
    description: z.string().max(600).nullable().optional(),
    descriptionEn: z.string().max(600).nullable().optional(),
    descriptionZh: z.string().max(600).nullable().optional(),
    image: imageField,
    color: z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "Color must be a hex value").nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

// Nested partial: `.partial()` on the outer object only makes `body`
// optional — every field inside `body` would stay required, breaking
// PATCH updates that touch a single field (e.g. only `description`).
export const categoryUpdateSchema = z.object({
  body: categoryCreateSchema.shape.body.partial(),
});

export const categoryReorderSchema = z.object({
  body: z.object({
    items: z.array(z.object({ id: z.number().int().positive(), sortOrder: z.number().int().min(0) })).min(1),
  }),
});

// ---------- Tag ----------

export const tagCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required").max(60),
    nameEn: z.string().trim().max(60).nullable().optional(),
    nameZh: z.string().trim().max(60).nullable().optional(),
    slug: z.string().trim().max(100).optional(),
  }),
});

export const tagUpdateSchema = z.object({
  body: tagCreateSchema.shape.body.partial(),
});

// ---------- Comment ----------

export const commentCreateSchema = z.object({
  body: z.object({
    articleId: z.number().int().positive(),
    name: z.string().trim().min(1, "Name is required").max(80),
    email: z.string().trim().email("Valid email is required"),
    content: z.string().trim().min(2, "Comment is too short").max(2000),
  }),
});

export const commentStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  }),
});

export const commentListQuery = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    articleId: z.coerce.number().int().positive().optional(),
  }),
});

// ---------- Advertisement / Banner ----------

// Safe link: http(s) or a relative internal route. Never javascript:/data:.
export const BANNER_POSITIONS = [
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

export const BANNER_DEVICES = ["all", "desktop", "tablet", "mobile"] as const;

export const adCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required").max(120),
    title: z.string().trim().max(200).nullable().optional(),
    image: z
      .string()
      .refine((v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"), {
        message: "Image must be a valid URL or /uploads path",
      }),
    link: z
      .string()
      .max(500)
      .refine((v) => /^https?:\/\//i.test(v) || v.startsWith("/"), "Link must be an http(s) URL or an internal route")
      .nullable()
      .optional(),
    target: z.enum(["_blank", "_self"]).optional(),
    position: z.enum(BANNER_POSITIONS).optional(),
    device: z.enum(BANNER_DEVICES).optional(),
    priority: z.number().int().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
  }),
});

// NOTE: must make the fields INSIDE `body` optional — `adCreateSchema.partial()`
// only makes the top-level `body` key optional, so a PATCH like {isActive:false}
// would still demand name+image. This is the correct nested-partial form.
export const adUpdateSchema = z.object({
  body: adCreateSchema.shape.body.partial(),
});

// ---------- Contact ----------

export const contactCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required").max(80),
    email: z.string().trim().email("Valid email is required"),
    subject: z.string().trim().max(200).optional(),
    message: z.string().trim().min(5, "Message is too short").max(4000),
  }),
});

// ---------- Newsletter ----------

export const newsletterCreateSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Valid email is required").max(200),
  }),
});

export const newsletterListQuery = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

// ---------- Media bulk actions ----------

export const mediaBulkSchema = z.object({
  body: z.object({
    ids: z.array(z.number().int().positive()).min(1, "Select at least one item").max(200, "Too many items selected"),
    action: z.enum(["delete"]),
  }),
});
