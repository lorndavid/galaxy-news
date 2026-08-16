import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a 6-digit hex value like #0d3fa9");

// Controlled font list — never allow arbitrary values into CSS.
export const FONT_CHOICES = [
  "Noto Sans Khmer",
  "Kantumruy",
  "Roboto",
  "Inter",
  "Source Sans 3",
  "Lato",
  "Merriweather",
  "Playfair Display",
  "DM Sans",
  "Plus Jakarta Sans",
] as const;

// Strip any HTML before storing — settings text is rendered in <title>/
// meta tags and as plain text; raw markup is never legitimate here.
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) =>
      v
        // remove whole script/style blocks (content included)
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
        // remove any remaining tags
        .replace(/<[^>]*>/g, "")
        // neutralise event handlers / dangerous schemes
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .replace(/<\s*\/?\s*\w/g, "")
        .trim()
    );

const nullableText = (max: number) => text(max).nullable().optional();

const cleanUrl = (max: number) =>
  z
    .string()
    .url("Must be a valid URL")
    .max(max)
    .refine((v) => !/^javascript:/i.test(v), "Unsafe URL scheme")
    .nullable()
    .optional();

export const settingsUpdateSchema = z.object({
  body: z.object({
    siteName: text(120).optional(),
    logo: cleanUrl(500),
    favicon: cleanUrl(500),
    description: nullableText(1000),
    facebook: cleanUrl(500),
    telegram: cleanUrl(500),
    youtube: cleanUrl(500),
    tiktok: cleanUrl(500),
    instagram: cleanUrl(500),
    twitter: cleanUrl(500),
    contactEmail: z.string().trim().email().nullable().optional(),
    contactPhone: nullableText(40),
    address: nullableText(300),

    // --- Theme tokens (validated ranges; no arbitrary CSS) ---
    primaryColor: hexColor.optional(),
    secondaryColor: hexColor.optional(),
    accentColor: hexColor.optional(),
    surfaceColor: hexColor.optional(),
    textColor: hexColor.optional(),
    mutedTextColor: hexColor.optional(),
    borderColor: hexColor.optional(),

    fontHeading: z.enum(FONT_CHOICES).optional(),
    fontBody: z.enum(FONT_CHOICES).optional(),
    fontArticle: z.enum(FONT_CHOICES).optional(),

    fontSizeHero: z.number().int().min(20).max(64).optional(),
    fontSizeSection: z.number().int().min(16).max(40).optional(),
    fontSizeCard: z.number().int().min(14).max(28).optional(),
    fontSizeBody: z.number().int().min(14).max(22).optional(),

    radiusPreset: z.enum(["sharp", "minimal", "medium", "rounded"]).optional(),
    shadowPreset: z.enum(["none", "subtle", "medium", "strong"]).optional(),
  }),
});
