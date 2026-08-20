<template>
  <div class="search-area">
    <div class="container">
      <div class="row">
        <div class="col-lg-8">
          <nav class="g-breadcrumb" aria-label="Breadcrumb">
            <RouterLink to="/">{{ t.nav.home }}</RouterLink>
            <span aria-hidden="true">/</span>
            <span>{{ t.common.search }}</span>
          </nav>
          <SectionTitle :title="t.search.resultsFor" />

          <form class="search-form mb-4" @submit.prevent="runSearch">
            <input v-model="q" type="text" :placeholder="t.search.placeholder" @input="onInput" />
            <button type="submit" :aria-label="t.common.search"><i class="fas fa-search"></i></button>
          </form>

          <p v-if="searched && !loading && !error" class="search-count">
            {{ t.search.resultsFor }} "{{ originalQuery }}" — {{ total }}
          </p>

          <div v-if="loading" class="mt-3">
            <div v-for="i in 4" :key="i" class="mb-3"><SkeletonCard /></div>
          </div>

          <div v-else-if="error" class="mt-3"><ErrorState :message="error" @retry="runSearch" /></div>

          <template v-else-if="items.length">
            <NewsRowCard v-for="a in items" :key="a.id" :article="a" />
            <div v-if="!loadingMore && hasMore" class="text-center mt-4">
              <button class="btn boxed-btn" @click="loadMore">{{ t.common.readMore }}</button>
            </div>
            <div v-if="loadingMore" class="text-center mt-4">
              <span class="g-loading-spinner" role="status" :aria-label="t.common.loading"></span>
            </div>
            <p v-if="!hasMore && items.length" class="text-center mt-3" style="color: var(--color-muted)">{{ t.common.noResults }}</p>
            <Pagination v-if="totalPages > 3" :page="page" :total-pages="totalPages" @change="goToPage" />
          </template>

          <EmptyState v-else-if="searched" :message="t.search.empty" />
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
import { useRoute, useRouter } from "vue-router";
import { useSeo } from "@/composables/useSeo";
import { articleService } from "@/services/article.service";
import type { Article } from "@/types";
import SectionTitle from "@/components/common/SectionTitle.vue";
import SkeletonCard from "@/components/common/SkeletonCard.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import Pagination from "@/components/common/Pagination.vue";
import NewsRowCard from "@/components/article/NewsRowCard.vue";
import SidebarPopular from "@/components/article/SidebarPopular.vue";
import NavatraPoster from "@/components/article/NavatraPoster.vue";
import { useLocalized } from "@/composables/useLocalized";

const { t } = useLocalized();
useSeo({ title: `${t.search.resultsFor} | Galaxy TV V4K` });

const route = useRoute();
const router = useRouter();

const q = ref(String(route.query.q ?? ""));
const originalQuery = ref(q.value);
const items = ref<Article[]>([]);
const popular = ref<Article[]>([]);
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const loading = ref(false);
const loadingMore = ref(false);
const searched = ref(false);
const error = ref("");

const hasMore = computed(() => page.value < totalPages.value);

let debounceTimer: number | undefined;

function onInput() {
  if (debounceTimer) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    router.replace({ query: { q: q.value.trim() } });
    runSearch();
  }, 400);
}

async function runSearch() {
  const query = q.value.trim();
  if (!query) {
    items.value = [];
    searched.value = false;
    return;
  }
  originalQuery.value = query;
  loading.value = true;
  error.value = "";
  try {
    const data = await articleService.list({ q: query, page: page.value, pageSize: 10 });
    items.value = data.items;
    total.value = data.total;
    page.value = data.page;
    totalPages.value = data.totalPages;
    searched.value = true;
  } catch (e) {
    error.value = e instanceof Error ? e.message : t.error.message;
  } finally {
    loading.value = false;
  }
}

async function goToPage(p: number) {
  page.value = p;
  await runSearch();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return;
  loadingMore.value = true;
  try {
    const next = page.value + 1;
    const data = await articleService.list({ q: originalQuery.value, page: next, pageSize: 10 });
    items.value = [...items.value, ...data.items];
    page.value = data.page;
    totalPages.value = data.totalPages;
  } catch {
    /* keep current results */
  } finally {
    loadingMore.value = false;
  }
}

onMounted(async () => {
  popular.value = await articleService.popular(5).catch(() => []);
  if (q.value.trim()) runSearch();
});
</script>

<style scoped>
.search-area {
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
.search-form {
  display: flex;
  gap: 10px;
}
.search-form input {
  flex: 1;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-button);
  padding: 12px 16px;
  font-size: 15px;
  font-family: var(--font-body);
  color: var(--color-text);
  background: var(--color-surface);
  outline: none;
  transition: border-color 0.2s ease;
}
.search-form input:focus {
  border-color: var(--color-accent);
}
.search-form button {
  border: none;
  background: var(--color-accent);
  color: #fff;
  border-radius: var(--radius-button);
  padding: 0 22px;
  cursor: pointer;
  transition: filter 0.2s ease;
}
.search-form button:hover {
  filter: brightness(1.1);
}
.search-count {
  color: var(--color-muted);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
