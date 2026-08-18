import { watchEffect } from "vue";
import { useSettingsStore } from "@/stores/settings";
import type { SiteSettings } from "@/types";

/**
 * Applies admin-configured theme tokens as CSS variables on :root.
 * Font sizes scale down slightly on small screens via CSS media queries
 * defined in app.css (the variables themselves are the desktop values).
 *
 * Runs once per app mount; the settings store caches the payload so it
 * doesn't refetch on every route.
 */

const RADIUS = {
  sharp: { card: "0px", button: "0px" },
  minimal: { card: "4px", button: "6px" },
  medium: { card: "10px", button: "10px" },
  rounded: { card: "16px", button: "999px" },
} as const;

const SHADOW = {
  none: "none",
  subtle: "0 2px 8px rgba(11, 28, 57, 0.06), 0 1px 2px rgba(11, 28, 57, 0.04)",
  medium: "0 6px 20px rgba(11, 28, 57, 0.10), 0 2px 6px rgba(11, 28, 57, 0.06)",
  strong: "0 12px 32px rgba(11, 28, 57, 0.16), 0 4px 10px rgba(11, 28, 57, 0.10)",
} as const;

const DEFAULTS: SiteSettings = {
  siteName: "Navatra 4K TV",
  siteNameEn: null,
  logo: null,
  favicon: null,
  description: null,
  descriptionEn: null,
  defaultLanguage: "kh",
  facebook: null,
  telegram: null,
  youtube: null,
  tiktok: null,
  instagram: null,
  twitter: null,
  contactEmail: null,
  contactPhone: null,
  address: null,
  tickerEnabled: false,
  tickerTitle: "LIVE NEWS",
  tickerSpeed: "medium",
  tickerDirection: "left",
  tickerCount: 10,
  tickerRefresh: 30,
  tickerBgColor: "#0b1c39",
  tickerTextColor: "#ffffff",
  tickerAccentColor: "#fc3f00",
  primaryColor: "#0d3fa9",
  secondaryColor: "#0b1c39",
  accentColor: "#fc3f00",
  surfaceColor: "#ffffff",
  textColor: "#0b1c39",
  mutedTextColor: "#667085",
  borderColor: "#e5e7eb",
  bodyBgColor: "#f8f7f4",
  headerBgColor: "#ffffff",
  headerTextColor: "#0b1c39",
  footerBgColor: "#0b1c39",
  footerTextColor: "#ffffff",
  layoutStyle: "boxed",
  shareFacebook: "https://www.facebook.com/sharer/sharer.php?u={url}",
  shareTikTok: "https://www.tiktok.com/share?url={url}",
  shareTelegram: "https://t.me/share/url?url={url}&text={title}",
  shareWhatsapp: "https://wa.me/?text={title} {url}",
  fontHeading: "Noto Sans Khmer",
  fontBody: "Noto Sans Khmer",
  fontArticle: "Noto Sans Khmer",
  fontSizeHero: 36,
  fontSizeSection: 24,
  fontSizeCard: 18,
  fontSizeBody: 16,
  radiusPreset: "sharp",
  shadowPreset: "none",
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** WCAG-style relative luminance (0 = black, 1 = white). */
function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const chan = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(rgb.r) + 0.7152 * chan(rgb.g) + 0.0722 * chan(rgb.b);
}

export function applyTheme(s: Partial<SiteSettings> | null | undefined) {
  const t = { ...DEFAULTS, ...(s ?? {}) };
  const radius = RADIUS[t.radiusPreset ?? "sharp"] ?? RADIUS.sharp;
  const shadow = SHADOW[t.shadowPreset ?? "none"] ?? SHADOW.none;
  const root = document.documentElement;

  // Brand + surfaces
  root.style.setProperty("--color-primary", t.primaryColor);
  root.style.setProperty("--color-primary-contrast", luminance(t.primaryColor) < 0.5 ? "#ffffff" : "#0b1c39");
  root.style.setProperty("--color-secondary", t.secondaryColor);
  root.style.setProperty("--color-accent", t.accentColor);
  root.style.setProperty("--color-surface", t.surfaceColor);
  root.style.setProperty("--color-text", t.textColor);
  root.style.setProperty("--color-muted", t.mutedTextColor);
  root.style.setProperty("--color-border", t.borderColor);

  // Page background
  root.style.setProperty("--color-bg", t.bodyBgColor);

  // Navbar zone
  root.style.setProperty("--color-header-bg", t.headerBgColor);
  root.style.setProperty("--color-header-text", t.headerTextColor);
  root.style.setProperty("--color-header-muted", headerMuted(t.headerTextColor, t.headerBgColor));

  // Footer zone
  root.style.setProperty("--color-footer-bg", t.footerBgColor);
  root.style.setProperty("--color-footer-text", t.footerTextColor);
  root.style.setProperty("--color-footer-muted", mix(t.footerTextColor, t.footerBgColor, 0.62));
  root.style.setProperty("--color-footer-border", mix(t.footerTextColor, t.footerBgColor, 0.16));

  // Typography
  root.style.setProperty("--font-heading", t.fontHeading);
  root.style.setProperty("--font-body", t.fontBody);
  root.style.setProperty("--font-article", t.fontArticle);
  root.style.setProperty("--size-hero", `${t.fontSizeHero}px`);
  root.style.setProperty("--size-section", `${t.fontSizeSection}px`);
  root.style.setProperty("--size-card", `${t.fontSizeCard}px`);
  root.style.setProperty("--size-body", `${t.fontSizeBody}px`);

  // Corners / shadows
  root.style.setProperty("--radius-card", radius.card);
  root.style.setProperty("--radius-button", radius.button);
  root.style.setProperty("--radius-badge", radius.card === "0px" ? "0px" : "4px");
  root.style.setProperty("--shadow-card", shadow);
  root.style.setProperty("--shadow-elevated", shadow);
  root.style.setProperty("--shadow-header", shadow);

  // Layout grid (container width)
  root.dataset.layout = t.layoutStyle;

  // Flat design: zero radius + no shadows everywhere.
  root.dataset.flat = radius.card === "0px" && shadow === "none" ? "true" : "false";
}

/** Muted text on the header — blends header text toward the header bg. */
function headerMuted(text: string, bg: string): string {
  return mix(text, bg, 0.82);
}

/** Linear RGB blend of two hex colors, returning #rrggbb. */
function mix(a: string, b: string, aWeight: number): string {
  const ca = hexToRgb(a) ?? { r: 0, g: 0, b: 0 };
  const cb = hexToRgb(b) ?? { r: 0, g: 0, b: 0 };
  const blend = (x: number, y: number) =>
    Math.round(x * aWeight + y * (1 - aWeight));
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(blend(ca.r, cb.r))}${toHex(blend(ca.g, cb.g))}${toHex(blend(ca.b, cb.b))}`;
}

export function useTheme() {
  const settingsStore = useSettingsStore();
  watchEffect(() => {
    applyTheme(settingsStore.settings);
  });
  return { applyTheme };
}