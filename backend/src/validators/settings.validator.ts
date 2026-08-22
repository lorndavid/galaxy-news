import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a 6-digit hex value like #0d3fa9");

// Controlled font list — never allow arbitrary values into CSS.
export const FONT_CHOICES = [
  "Noto Sans Khmer",
  "Noto Serif Khmer",
  "Noto Sans SC",
  "Noto Serif SC",
  "Kantumruy Pro",
  "Battambang",
  "Bayon",
  "Koulen",
  "Dangrek",
  "Suwannaphum",
  "Google Sans",
  "Huninn",
  "Inter",
  "Roboto",
  "Lato",
  "Merriweather",
  "Playfair Display",
  "Poppins",
  "Source Sans 3",
  "DM Sans",
  "Plus Jakarta Sans",
  "Charis SIL",
  "ZCOOL KuaiLe",
  "ZCOOL QingKe HuangYou",
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

// Accept absolute http(s) URLs or safe relative paths (/assets,
// /uploads) — the DB legitimately stores the seeded logo as a relative path.
const cleanUrl = (max: number) =>
  z
    .string()
    .max(max)
    .refine(
      (v) =>
        /^https?:\/\//i.test(v) ||
        v.startsWith("/assets/") ||
        v.startsWith("/uploads/"),
      "Must be a valid URL or /assets, /uploads path"
    )
    .refine((v) => !/^javascript:/i.test(v), "Unsafe URL scheme")
    .nullable()
    .optional();

export const settingsUpdateSchema = z.object({
  body: z.object({
    siteName: text(120).optional(),
    siteNameEn: text(120).nullable().optional(),
    logo: cleanUrl(500),
    favicon: cleanUrl(500),
    description: nullableText(1000),
    descriptionEn: nullableText(1000),
    defaultLanguage: z.enum(["kh", "en", "zh"]).optional(),
    facebook: cleanUrl(500),
    telegram: cleanUrl(500),
    youtube: cleanUrl(500),
    tiktok: cleanUrl(500),
    instagram: cleanUrl(500),
    twitter: cleanUrl(500),
    contactEmail: z.string().trim().email().nullable().optional(),
    contactPhone: nullableText(40),
    address: nullableText(300),

    // --- Live news ticker (safe, bounded values only) ---
    tickerEnabled: z.boolean().optional(),
    tickerTitle: text(60).optional(),
    tickerSpeed: z.enum(["slow", "medium", "fast"]).optional(),
    tickerDirection: z.enum(["left", "right"]).optional(),
    tickerCount: z.number().int().min(1).max(30).optional(),
    tickerRefresh: z.number().int().min(10).max(300).optional(),
    tickerBgColor: hexColor.optional(),
    tickerTextColor: hexColor.optional(),
    tickerAccentColor: hexColor.optional(),
    tickerLayout: z.enum(["boxed", "wide", "fluid"]).optional(),

    // --- Theme tokens (validated ranges; no arbitrary CSS) ---
    primaryColor: hexColor.optional(),
    secondaryColor: hexColor.optional(),
    accentColor: hexColor.optional(),
    surfaceColor: hexColor.optional(),
    textColor: hexColor.optional(),
    mutedTextColor: hexColor.optional(),
    borderColor: hexColor.optional(),

    // --- Layout/zone colors (navbar, page background, footer) ---
    bodyBgColor: hexColor.optional(),
    headerBgColor: hexColor.optional(),
    headerTextColor: hexColor.optional(),
    footerBgColor: hexColor.optional(),
    footerTextColor: hexColor.optional(),

    // --- Layout style (container width + grid presets) ---
    layoutStyle: z.enum(["boxed", "wide", "fluid"]).optional(),

    // --- Social share link templates ({url}/{title} placeholders) ---
    shareFacebook: z.string().trim().min(1).max(500).optional(),
    shareTikTok: z.string().trim().min(1).max(500).optional(),
    shareTelegram: z.string().trim().min(1).max(500).optional(),
    shareWhatsapp: z.string().trim().min(1).max(500).optional(),

    fontHeading: z.enum(FONT_CHOICES).optional(),
    fontBody: z.enum(FONT_CHOICES).optional(),
    fontArticle: z.enum(FONT_CHOICES).optional(),

    // Per-language font customization
    fontFamilyKh: z.enum(FONT_CHOICES).optional(),
    fontFamilyEn: z.enum(FONT_CHOICES).optional(),
    fontFamilyZh: z.enum(FONT_CHOICES).optional(),
    fontSizeKh: z.number().int().min(10).max(40).optional(),
    fontSizeEn: z.number().int().min(10).max(40).optional(),
    fontSizeZh: z.number().int().min(10).max(40).optional(),
    fontWeightKh: z.number().int().min(100).max(900).optional(),
    fontWeightEn: z.number().int().min(100).max(900).optional(),
    fontWeightZh: z.number().int().min(100).max(900).optional(),

    fontSizeHero: z.number().int().min(20).max(64).optional(),
    fontSizeSection: z.number().int().min(16).max(40).optional(),
    fontSizeCard: z.number().int().min(14).max(28).optional(),
    fontSizeBody: z.number().int().min(14).max(22).optional(),

    radiusPreset: z.enum(["sharp", "minimal", "medium", "rounded"]).optional(),
    shadowPreset: z.enum(["none", "subtle", "medium", "strong"]).optional(),
  }),
});
