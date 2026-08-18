import { computed } from "vue";
import { useSettingsStore } from "@/stores/settings";

export interface ShareLink {
  key: "facebook" | "tiktok" | "telegram" | "whatsapp";
  label: string;
  icon: string;
  color: string;
  href: string;
}

const PLATFORMS: Record<ShareLink["key"], { label: string; icon: string; color: string }> = {
  facebook: { label: "Facebook", icon: "fab fa-facebook-f", color: "#1877f2" },
  tiktok: { label: "TikTok", icon: "fab fa-tiktok", color: "#010101" },
  telegram: { label: "Telegram", icon: "fab fa-telegram-plane", color: "#229ed9" },
  whatsapp: { label: "WhatsApp", icon: "fab fa-whatsapp", color: "#25d366" },
};

/**
 * Resolves the admin-configured share templates ({url} / {title} placeholders,
 * editable in Admin → Settings → General → ប៊ូតុងចែករំលែកអត្ថបទ).
 * Accepts getter functions so live values (current URL, article title) are
 * read reactively on every evaluation.
 */
export function useShareLinks(getUrl: () => string, getTitle: () => string) {
  const settings = useSettingsStore();

  const links = computed<ShareLink[]>(() => {
    const s = settings.settings;
    const url = getUrl();
    const title = getTitle();
    const templates: Record<ShareLink["key"], string | undefined> = {
      facebook: s?.shareFacebook,
      tiktok: s?.shareTikTok,
      telegram: s?.shareTelegram,
      whatsapp: s?.shareWhatsapp,
    };
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    return (["facebook", "tiktok", "telegram", "whatsapp"] as const)
      .map((key) => {
        const tmpl = templates[key]?.trim();
        if (!tmpl) return null;
        return {
          key,
          label: PLATFORMS[key].label,
          icon: PLATFORMS[key].icon,
          color: PLATFORMS[key].color,
          href: tmpl.replace(/\{url\}/g, encodedUrl).replace(/\{title\}/g, encodedTitle),
        };
      })
      .filter((l): l is ShareLink => l !== null);
  });

  return { links };
}