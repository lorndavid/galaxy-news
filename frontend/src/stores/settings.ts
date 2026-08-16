import { defineStore } from "pinia";
import { ref } from "vue";
import { contentService } from "@/services/content.service";
import type { SiteSettings } from "@/types";

export const useSettingsStore = defineStore("settings", () => {
  const settings = ref<SiteSettings | null>(null);
  const loaded = ref(false);
  const loading = ref(false);

  async function load(force = false) {
    if (loaded.value && !force) return;
    loading.value = true;
    try {
      settings.value = await contentService.settings();
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }

  return { settings, loaded, loading, load };
});
