<template>
  <div class="category-area">
    <div class="container">
      <div v-if="loading" class="row mt-4">
        <div v-for="i in 6" :key="i" class="col-lg-6 col-md-6 mb-4">
          <SkeletonCard />
        </div>
      </div>

      <div v-else-if="error" class="row mt-4"><div class="col-12"><ErrorState :message="error" @retry="load" /></div></div>

      <template v-else>
        <!-- Featured article -->
        <div v-if="featured" class="row mt-4">
          <div class="col-lg-8">
            <TrendingTopCard :article="featured" />
          </div>
          <div class="col-lg-4">
            <SidebarPopular :articles="popular" />
          </div>
        </div>

        <!-- Grid -->
        <div class="row">
          <div class="col-lg-8">
            <SectionTitle :title="sectionTitle" />
            <div v-if="items.length">
              <!-- Grid layout (from admin nav item config) -->
              <div v-if="pageLayout === 'grid'" class="g-page-grid" :style="{ '--cols': pageColumns }">
                <ArticleCard v-for="a in items" :key="a.id" :article="a" />
              </div>
              <!-- List layout: image left, text right -->
              <template v-else>
                <NewsRowCard v-for="a in items" :key="a.id" :article="a" />
              </template>
            </div>
            <EmptyState v-else :message="t.common.noResults" />
            <div v-if="totalPages > 1" class="mb-2">
              <Pagination :page="page" :total-pages="totalPages" @change="goToPage" />
            </div>
          </div>
          <div class="col-lg-4">
            <SidebarPopular :articles="popular" />
            <NavatraPoster />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useSeo } from "@/composables/useSeo";
import { articleService } from "@/services/article.service";
import { contentService } from "@/services/content.service";
import type { Article, Category } from "@/types";
import SectionTitle from "@/components/common/SectionTitle.vue";
import SkeletonCard from "@/components/common/SkeletonCard.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import Pagination from "@/components/common/Pagination.vue";
import ArticleCard from "@/components/article/ArticleCard.vue";
import NewsRowCard from "@/components/article/NewsRowCard.vue";
import TrendingTopCard from "@/components/article/TrendingTopCard.vue";
import SidebarPopular from "@/components/article/SidebarPopular.vue";
import NavatraPoster from "@/components/article/NavatraPoster.vue";
import { useLocalized } from "@/composables/useLocalized";

const route = useRoute();
const { locale, t } = useLocalized();
const category = ref<Category | null>(null);
const items = ref<Article[]>([]);
const popular = ref<Article[]>([]);
const page = ref(1);
const totalPages = ref(1);
const loading = ref(true);
const error = ref("");
const pageLayout = ref<"grid" | "list">("list");
const pageColumns = ref(3);

/** Pull the layout/grid config the admin set for this category's nav item. */
async function loadPageLayout(slug: string) {
  try {
    const nav = await contentService.navigation();
    const navItem = nav.find((n) => n.type === "category" && n.value === slug);
    if (navItem?.config) {
      pageLayout.value = navItem.config.layout ?? "list";
      pageColumns.value = navItem.config.columns ?? 3;
    }
  } catch {
    /* keep defaults */
  }
}

const catNameOf = (c: Category | null) => (c ? locale.pick(c.name, c.nameEn) : "");
const sectionTitle = computed(() => {
  const name = catNameOf(category.value);
  return name ? `${t.home.whatsNew} — ${name}` : t.home.whatsNew;
});

const featured = computed(() => items.value[0] ?? null);

useSeo(
  computed(() => {
    const c = category.value;
    return {
      title: `${c?.name ?? "ប្រភេទ"} | Navatra 4K TV`,
      description: c?.description ?? `អត្ថបទទាំងអស់ក្នុងប្រភេទ ${c?.name ?? ""}`,
      url: c ? `${window.location.origin}/category/${c.slug}` : undefined,
      type: "website",
      jsonLd: c
        ? [
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: c.name,
              description: c.description ?? undefined,
              url: `${window.location.origin}/category/${c.slug}`,
            },
          ]
        : [],
    };
  })
);

async function load() {
  loading.value = true;
  error.value = "";
  page.value = 1;
  try {
    const slug = String(route.params.slug);
    const data = await articleService.byCategory(slug, 1);
    items.value = data.items;
    page.value = data.page;
    totalPages.value = data.totalPages;
    if (!category.value) {
      const cats = await contentService.categories().catch(() => []);
      category.value = cats.find((c) => c.slug === slug) ?? null;
    }
    popular.value = await articleService.popular(5).catch(() => []);
    await loadPageLayout(slug);
  } catch (e) {
    error.value = e instanceof Error ? e.message : t.error.message;
  } finally {
    loading.value = false;
  }
}

async function goToPage(p: number) {
  page.value = p;
  loading.value = true;
  try {
    const data = await articleService.byCategory(String(route.params.slug), p);
    items.value = data.items;
    totalPages.value = data.totalPages;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.slug, () => { category.value = null; load(); });
</script>

<style scoped>
.category-area {
  padding-top: 26px;
}
/* Admin-driven grid layout (columns from the nav item config) */
.g-page-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols, 3), 1fr);
  gap: 20px;
}
@media (max-width: 767px) {
  .g-page-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 480px) {
  .g-page-grid {
    grid-template-columns: 1fr;
  }
}
</style>
