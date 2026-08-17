import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { kh, type KhMessages } from "@/locales/kh";
import { en } from "@/locales/en";
import { useSettingsStore } from "@/stores/settings";

export type Locale = "kh" | "en";

/** Structural message type — every leaf is a string, so both locales satisfy it
 *  without the literal-type intersection collapsing to `never`. */
type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };
export type Messages = DeepString<KhMessages>;

const STORAGE_KEY = "navatra_locale";
const messages: Record<Locale, Messages> = { kh, en } as Record<Locale, Messages>;

function resolveDefault(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "kh" || saved === "en") return saved;
  return "kh";
}

export const useLocaleStore = defineStore("locale", () => {
  const locale = ref<Locale>(resolveDefault());

  const isEn = computed(() => locale.value === "en");
  const t = computed(() => messages[locale.value]);

  function setLocale(next: Locale) {
    locale.value = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private mode — in-memory only
    }
    document.documentElement.lang = next === "en" ? "en" : "km";
  }

  /** Pick the localized value with a fallback to the primary language. */
  function pick(primary: string | null | undefined, secondary: string | null | undefined): string {
    if (isEn.value && secondary) return secondary;
    return primary || secondary || "";
  }

  /** Translate a nested key, e.g. tKey("common.search") */
  function tKey(path: string): string {
    let node: unknown = messages[locale.value];
    for (const part of path.split(".")) {
      if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
        node = (node as Record<string, unknown>)[part];
      } else {
        return path;
      }
    }
    return typeof node === "string" ? node : path;
  }

  /** Sync the default language from site settings once loaded. */
  function syncWithSettings() {
    const settings = useSettingsStore().settings;
    if (settings?.defaultLanguage === "en") {
      setLocale("en");
    }
  }

  return { locale, isEn, t, setLocale, pick, tKey, syncWithSettings };
});
