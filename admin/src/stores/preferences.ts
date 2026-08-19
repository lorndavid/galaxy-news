import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { adminMessages, type AdminLocale } from "@/i18n";

export type AppTheme = "light" | "dark" | "system";

const STORAGE_KEY = "navatra_admin_prefs";

interface PersistedPrefs {
  theme?: AppTheme;
  adminLang?: AdminLocale;
}

function readPrefs(): PersistedPrefs {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as PersistedPrefs;
  } catch {
    return {};
  }
}

function systemIsDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Admin UI preferences: theme (light/dark/system) and interface language.
 * Both persist in localStorage and apply instantly — the no-flash inline
 * script in index.html applies the saved theme before Vue mounts.
 */
export const usePreferencesStore = defineStore("preferences", () => {
  const saved = readPrefs();
  const theme = ref<AppTheme>(saved.theme ?? "light");
  const adminLang = ref<AdminLocale>(saved.adminLang ?? "km");

  const resolvedTheme = computed<"light" | "dark">(() =>
    theme.value === "system" ? (systemIsDark() ? "dark" : "light") : theme.value
  );

  function applyTheme() {
    const dark = resolvedTheme.value === "dark";
    document.documentElement.classList.toggle("dark", dark);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#0b1c39" : "#ffffff");
  }

  function applyLang() {
    document.documentElement.lang = adminLang.value;
  }

  function persist() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme: theme.value, adminLang: adminLang.value })
    );
  }

  function setTheme(next: AppTheme) {
    theme.value = next;
    applyTheme();
    persist();
  }

  function toggleTheme() {
    setTheme(resolvedTheme.value === "dark" ? "light" : "dark");
  }

  function setAdminLang(next: AdminLocale) {
    adminLang.value = next;
    applyLang();
    persist();
  }

  function t(key: string): string {
    return adminMessages[adminLang.value][key] ?? adminMessages.km[key] ?? key;
  }

  // Watch OS preference so "system" mode follows live changes.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (theme.value === "system") applyTheme();
  };
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", onSystemChange);
  }

  // Apply on store creation (covers SSR-less SPA boot after the inline script).
  applyTheme();
  applyLang();

  return {
    theme,
    adminLang,
    resolvedTheme,
    setTheme,
    toggleTheme,
    setAdminLang,
    t,
  };
});