import { defineStore } from "pinia";
import { ref } from "vue";
import { contentService } from "@/services/content.service";
import type { Category } from "@/types";

export const useCategoryStore = defineStore("categories", () => {
  const categories = ref<Category[]>([]);
  const loaded = ref(false);
  const loading = ref(false);

  async function load(force = false) {
    if (loaded.value && !force) return;
    loading.value = true;
    try {
      categories.value = await contentService.categories();
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }

  return { categories, loaded, loading, load };
});
