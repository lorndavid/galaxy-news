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
  fontHeading: "Noto Sans Khmer",
  fontBody: "Noto Sans Khmer",
  fontArticle: "Noto Sans Khmer",
  fontSizeHero: 36,
  fontSizeSection: 24,
  fontSizeCard: 18,
  fontSizeBody: 16,
  radiusPreset: "medium",
  shadowPreset: "subtle",
};

export function applyTheme(s: Partial<SiteSettings> | null | undefined) {
  const t = { ...DEFAULTS, ...(s ?? {}) };
  const radius = RADIUS[t.radiusPreset] ?? RADIUS.medium;
  const shadow = SHADOW[t.shadowPreset] ?? SHADOW.subtle;
  const root = document.documentElement;
  root.style.setProperty("--color-primary", t.primaryColor);
  root.style.setProperty("--color-secondary", t.secondaryColor);
  root.style.setProperty("--color-accent", t.accentColor);
  root.style.setProperty("--color-surface", t.surfaceColor);
  root.style.setProperty("--color-text", t.textColor);
  root.style.setProperty("--color-muted", t.mutedTextColor);
  root.style.setProperty("--color-border", t.borderColor);
  root.style.setProperty("--font-heading", t.fontHeading);
  root.style.setProperty("--font-body", t.fontBody);
  root.style.setProperty("--font-article", t.fontArticle);
  root.style.setProperty("--size-hero", `${t.fontSizeHero}px`);
  root.style.setProperty("--size-section", `${t.fontSizeSection}px`);
  root.style.setProperty("--size-card", `${t.fontSizeCard}px`);
  root.style.setProperty("--size-body", `${t.fontSizeBody}px`);
  root.style.setProperty("--radius-card", radius.card);
  root.style.setProperty("--radius-button", radius.button);
  root.style.setProperty("--shadow-card", shadow);
}

export function useTheme() {
  const settingsStore = useSettingsStore();
  watchEffect(() => {
    applyTheme(settingsStore.settings);
  });
  return { applyTheme };
}
