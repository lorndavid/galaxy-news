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

// Per-section layout/grid options (stored as JSON in HomepageSection.config).
// `columns` drives the card grid width, `sidebar` toggles the right rail,
// `left` toggles the left rail on the hero.
export const sectionConfigSchema = z
  .object({
    columns: z.number().int().min(2).max(6).optional(),
    sidebar: z.boolean().optional(),
    left: z.boolean().optional(),
  })
  .strict()
  .optional();

export const homepageSectionsUpdateSchema = z.object({
  body: z.object({
    sections: z
      .array(
        z.object({
          key: z.enum(sectionKeys),
          enabled: z.boolean().optional(),
          label: z.string().trim().min(1).max(80).optional(),
          config: sectionConfigSchema,
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

// Per-nav-item layout config (JSON on NavigationItem.config).
// `layout` picks the listing style, `columns` the card grid width.
export const navConfigSchema = z
  .object({
    layout: z.enum(["grid", "list"]).optional(),
    columns: z.number().int().min(2).max(4).optional(),
  })
  .strict()
  .optional();

export const navCreateSchema = z.object({
  body: z.object({
    label: z.string().trim().min(1).max(80),
    labelEn: z.string().trim().max(80).nullable().optional(),
    labelZh: z.string().trim().max(80).nullable().optional(),
    type: z.enum(["home", "category", "page", "link"]),
    value: z.string().trim().max(200).nullable().optional(),
    isActive: z.boolean().optional(),
    config: navConfigSchema.nullable(),
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
