<template>
  <div class="news-list-area">
    <div class="container">
      <div class="row">
        <div class="col-lg-8">
          <nav class="g-breadcrumb" aria-label="Breadcrumb">
            <RouterLink to="/">{{ t.nav.home }}</RouterLink>
            <span aria-hidden="true">/</span>
            <span>{{ title }}</span>
          </nav>
          <SectionTitle :title="title" />

          <div v-if="loading" class="mt-3">
            <div v-for="i in 4" :key="i" class="mb-3"><SkeletonCard /></div>
          </div>
          <div v-else-if="error" class="mt-3"><ErrorState :message="error" @retry="load" /></div>

          <template v-else-if="items.length">
            <!-- Grid layout (from admin nav item config) -->
            <div v-if="pageLayout === 'grid'" class="g-page-grid" :style="{ '--cols': pageColumns }">
              <ArticleCard v-for="a in items" :key="a.id" :article="a" />
            </div>
            <!-- List layout: image left, text right -->
            <template v-else>
              <NewsRowCard v-for="a in items" :key="a.id" :article="a" />
            </template>
            <!-- Load more + pagination fallback -->
            <div v-if="!loadingMore && hasMore" class="text-center mt-4">
              <button class="btn boxed-btn" @click="loadMore">{{ t.common.readMore }}</button>
            </div>
            <div v-if="loadingMore" class="text-center mt-4">
              <span class="g-loading-spinner" role="status" :aria-label="t.common.loading"></span>
            </div>
            <p v-if="!hasMore && items.length" class="text-center mt-3" style="color: var(--color-muted)">{{ t.common.noResults }}</p>
            <Pagination v-if="totalPages > 3" :page="page" :total-pages="totalPages" @change="goToPage" />
          </template>
          <EmptyState v-else :message="t.common.noResults" />
        </div>
        <div class="col-lg-4">
          <SidebarPopular :articles="popular" />
          <NavatraPoster />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useSeo } from "@/composables/useSeo";
import { articleService } from "@/services/article.service";
import type { Article } from "@/types";
import SectionTitle from "@/components/common/SectionTitle.vue";
import SkeletonCard from "@/components/common/SkeletonCard.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import Pagination from "@/components/common/Pagination.vue";
import ArticleCard from "@/components/article/ArticleCard.vue";
import NewsRowCard from "@/components/article/NewsRowCard.vue";
import SidebarPopular from "@/components/article/SidebarPopular.vue";
import NavatraPoster from "@/components/article/NavatraPoster.vue";
import { contentService } from "@/services/content.service";
import { useLocalized } from "@/composables/useLocalized";

const route = useRoute();
const items = ref<Article[]>([]);
const popular = ref<Article[]>([]);
const page = ref(1);
const totalPages = ref(1);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref("");
const pageLayout = ref<"grid" | "list">("list");
const pageColumns = ref(3);

const hasMore = computed(() => page.value < totalPages.value);

const { t } = useLocalized();
const isLatest = computed(() => route.name === "latest");
const title = computed(() => (isLatest.value ? t.home.latest : t.nav.news));

/** Pull the layout/grid config the admin set for this page's nav item. */
async function loadPageLayout() {
  try {
    const nav = await contentService.navigation();
    const wanted = isLatest.value ? "latest" : "news";
    const navItem = nav.find((n) => n.type === "page" && n.value === wanted);
    if (navItem?.config) {
      pageLayout.value = navItem.config.layout ?? "list";
      pageColumns.value = navItem.config.columns ?? 3;
    }
  } catch {
    /* keep defaults */
  }
}

useSeo(
  computed(() => ({
    title: `${title.value} | Galaxy TV V4K`,
    description: `បញ្ជីអត្ថបទព័ត៌មានទាំងអស់`,
  }))
);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const data = isLatest.value
      ? await articleService.list({ page: page.value, pageSize: 10, sort: "latest" })
      : await articleService.list({ page: page.value, pageSize: 10 });
    items.value = data.items;
    page.value = data.page;
    totalPages.value = data.totalPages;
  } catch (e) {
    error.value = e instanceof Error ? e.message : t.error.message;
  } finally {
    loading.value = false;
  }
}

async function goToPage(p: number) {
  page.value = p;
  await load();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return;
  loadingMore.value = true;
  try {
    const next = page.value + 1;
    const data = isLatest.value
      ? await articleService.list({ page: next, pageSize: 10, sort: "latest" })
      : await articleService.list({ page: next, pageSize: 10 });
    items.value = [...items.value, ...data.items];
    page.value = data.page;
    totalPages.value = data.totalPages;
  } catch {
    /* keep current list on error; the pagination fallback remains available */
  } finally {
    loadingMore.value = false;
  }
}

onMounted(async () => {
  popular.value = await articleService.popular(5).catch(() => []);
  await loadPageLayout();
  load();
});
</script>

<style scoped>
.news-list-area {
  padding-top: 30px;
}
/* Breadcrumb */
.g-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0 0;
  font-size: 13px;
  color: var(--color-muted);
}
.g-breadcrumb a {
  color: var(--color-muted);
  text-decoration: none;
  transition: color 0.2s ease;
}
.g-breadcrumb a:hover {
  color: var(--color-accent);
}
.g-breadcrumb span:last-child {
  color: var(--color-text);
  font-weight: 600;
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
.g-loading-spinner {
  display: inline-block;
  width: 22px;
  height: 22px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
