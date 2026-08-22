import { z } from "zod";

// Facebook URL validation — accept common Facebook live/video URL patterns
const FACEBOOK_URL_RE =
  /^https?:\/\/(www\.|m\.|web\.)?(facebook\.com|fb\.watch)\/.+/i;

export const facebookUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => FACEBOOK_URL_RE.test(v), {
    message: "Please enter a valid Facebook Live URL",
  });

export const liveStreamCreateSchema = z.object({
  body: z.object({
    titleKh: z.string().trim().min(1, "Khmer title is required").max(200),
    titleEn: z.string().trim().max(200).nullable().optional(),
    descriptionKh: z.string().trim().max(2000).nullable().optional(),
    descriptionEn: z.string().trim().max(2000).nullable().optional(),
    facebookUrl: facebookUrlSchema,
    thumbnailUrl: z.string().trim().max(500).nullable().optional(),
    status: z
      .enum(["DRAFT", "SCHEDULED", "LIVE", "ENDED", "DISABLED"])
      .optional(),
    visibility: z
      .enum(["HOMEPAGE", "PAGE_ONLY", "HIDDEN"])
      .optional(),
    isHomepage: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    displayOrder: z.number().int().min(0).optional(),
    startAt: z.string().nullable().optional(),
    endAt: z.string().nullable().optional(),
  }),
});

export const liveStreamUpdateSchema = z.object({
  body: liveStreamCreateSchema.shape.body.partial(),
});

export const liveStreamStatusSchema = z.object({
  body: z.object({
    status: z.enum(["DRAFT", "SCHEDULED", "LIVE", "ENDED", "DISABLED"]),
  }),
});

export const liveStreamHomepageSchema = z.object({
  body: z.object({
    isHomepage: z.boolean(),
  }),
});

export const idParamsSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const liveStreamListQuery = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    status: z
      .enum(["DRAFT", "SCHEDULED", "LIVE", "ENDED", "DISABLED"])
      .optional(),
    q: z.string().trim().optional(),
  }),
});
