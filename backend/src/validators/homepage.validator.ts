import { z } from "zod";

export const sectionKeys = [
  "breaking",
  "hero",
  "weekly",
  "whats-new",
  "latest",
  "video",
  "recent",
] as const;

export const homepageSectionsUpdateSchema = z.object({
  body: z.object({
    sections: z
      .array(
        z.object({
          key: z.enum(sectionKeys),
          enabled: z.boolean().optional(),
          label: z.string().trim().min(1).max(80).optional(),
        })
      )
      .min(1),
  }),
});

export const homepageReorderSchema = z.object({
  body: z.object({
    order: z
      .array(
        z.object({
          key: z.enum(sectionKeys),
          sortOrder: z.number().int().min(0).max(100),
        })
      )
      .min(1),
  }),
});

export const navCreateSchema = z.object({
  body: z.object({
    label: z.string().trim().min(1).max(80),
    labelEn: z.string().trim().max(80).nullable().optional(),
    type: z.enum(["home", "category", "page", "link"]),
    value: z.string().trim().max(200).nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const navUpdateSchema = z.object({
  body: navCreateSchema.shape.body.partial(),
});

export const navReorderSchema = z.object({
  body: z.object({
    order: z.array(z.object({ id: z.number().int().positive(), sortOrder: z.number().int().min(0).max(100) })).min(1),
  }),
});
