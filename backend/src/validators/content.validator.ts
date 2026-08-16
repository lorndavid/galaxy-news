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

// ---------- Category ----------

export const categoryCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required").max(80),
    slug: z.string().trim().max(100).optional(),
    description: z.string().max(600).nullable().optional(),
    image: z.string().url().nullable().optional(),
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

// ---------- Advertisement ----------

export const adCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required").max(120),
    image: z.string().url("Image must be a valid URL"),
    link: z.string().url("Link must be a valid URL").nullable().optional(),
    position: z.enum(["header", "sidebar", "inline", "footer"]).optional(),
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
