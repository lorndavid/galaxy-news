import { z } from "zod";

export const settingsUpdateSchema = z.object({
  body: z.object({
    siteName: z.string().trim().min(1).max(120).optional(),
    logo: z.string().url().nullable().optional(),
    favicon: z.string().url().nullable().optional(),
    description: z.string().max(1000).nullable().optional(),
    facebook: z.string().url().nullable().optional(),
    telegram: z.string().url().nullable().optional(),
    youtube: z.string().url().nullable().optional(),
    tiktok: z.string().url().nullable().optional(),
    instagram: z.string().url().nullable().optional(),
    twitter: z.string().url().nullable().optional(),
    contactEmail: z.string().email().nullable().optional(),
    contactPhone: z.string().max(40).nullable().optional(),
    address: z.string().max(300).nullable().optional(),
  }),
});
