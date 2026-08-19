<template>
  <section class="g-more-news">
    <div class="container">
      <!-- Section header -->
      <div class="g-section-header">
        <div class="g-section-accent" style="background: var(--color-secondary)"></div>
        <h2><i class="ti-layout-list-post g-section-icon" aria-hidden="true"></i> {{ t.home.moreNews }}</h2>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading && !articles.length" class="g-more-grid">
        <div v-for="i in 6" :key="i" class="g-more-card g-more-skeleton">
          <div class="g-more-img skeleton"></div>
          <div class="g-more-body">
            <div class="skeleton skeleton-text-sm" style="width: 40%"></div>
            <div class="skeleton skeleton-text" style="width: 90%"></div>
            <div class="skeleton skeleton-text" style="width: 70%"></div>
            <div class="skeleton skeleton-text-sm" style="width: 30%"></div>
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="g-more-empty">
        <p>{{ t.home.loadFailed }}</p>
        <button class="boxed-btn" @click="loadMore">{{ t.common.retry }}</button>
      </div>

      <!-- Articles grid -->
      <div v-else class="g-more-grid">
        <article v-for="a in articles" :key="a.id" class="g-more-card">
          <RouterLink :to="`/article/${a.slug}`" class="g-more-img">
            <ArticleThumb :src="a.featuredImage" :alt="title(a)" :width="480" />
          </RouterLink>
          <div class="g-more-body">
            <span v-if="a.category" class="g-cat-chip g-cat-chip--xs" :style="catStyle(a)">{{ catName(a) }}</span>
            <h3 class="g-more-title">
              <RouterLink :to="`/article/${a.slug}`">{{ title(a) }}</RouterLink>
            </h3>
            <p v-if="excerpt(a)" class="g-more-excerpt">{{ excerpt(a) }}</p>
            <div class="g-more-meta">
              <span v-if="a.publishedAt"><i class="ti-calendar"></i> {{ localeDate(a.publishedAt) }}</span>
              <span><i class="ti-eye"></i> {{ formatViews(a.views) }}</span>
            </div>
          </div>
        </article>
      </div>

      <!-- Loading more indicator -->
      <div v-if="loading && articles.length" class="g-more-loading">
        <span class="g-more-spinner"></span>
        <span>{{ t.common.loading }}</span>
      </div>

      <!-- Empty state -->
      <div v-if="!loading && !error && !articles.length" class="g-more-empty">
        <p>{{ t.home.noMoreStories }}</p>
      </div>

      <!-- End of content -->
      <div v-if="!loading && !hasMore && articles.length && !error" class="g-more-end">
        <span></span>
        <span class="g-more-end-text">{{ t.home.noMoreStories }}</span>
        <span></span>
      </div>

      <!-- Infinite scroll trigger -->
      <div ref="sentinel" class="g-more-sentinel"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { articleService } from "@/services/article.service";
import { useLocalized } from "@/composables/useLocalized";
import { formatKhmerDate, formatEnglishDate, formatViews } from "@/utils/format";
import type { Article } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";

const props = defineProps<{
  /** Article IDs already shown in the hero/primary grid — these will be excluded. */
  excludeIds: number[];
}>();

const { isEn, title, excerpt, catName, t } = useLocalized();

function localeDate(date: string | Date | null): string {
  return isEn ? formatEnglishDate(date) : formatKhmerDate(date);
}

const articles = ref<Article[]>([]);
const page = ref(1);
const hasMore = ref(true);
const loading = ref(false);
const error = ref(false);
const sentinel = ref<HTMLElement | null>(null);
const PAGE_SIZE = 6;

// Category color helper
const CAT_COLORS: Record<number, string> = {};
function catStyle(a: Article) {
  const id = a.categoryId;
  if (!CAT_COLORS[id]) {
    const palette = [
      "var(--cat-national)", "var(--cat-political)", "var(--cat-international)",
      "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)",
      "var(--cat-entertainment)",
    ];
    CAT_COLORS[id] = palette[id % palette.length];
  }
  return { background: CAT_COLORS[id] };
}

// Exclude set for deduplication
const excludeSet = computed(() => new Set(props.excludeIds));

async function loadMore() {
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  error.value = false;
  try {
    const data = await articleService.list({ page: page.value, pageSize: PAGE_SIZE });
    // Filter out articles already in the primary grid
    const filtered = data.items.filter((a) => !excludeSet.value.has(a.id));
    if (filtered.length) {
      articles.value.push(...filtered);
    }
    // Check if there are more pages
    if (page.value >= data.totalPages) {
      hasMore.value = false;
    }
    page.value++;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

// IntersectionObserver for infinite scroll
let observer: IntersectionObserver | null = null;

function setupObserver() {
  if (!sentinel.value) return;
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && !loading.value && hasMore.value && !error.value) {
        loadMore();
      }
    },
    { rootMargin: "200px" }
  );
  observer.observe(sentinel.value);
}

// Reset when exclude IDs change (e.g. language switch triggers re-fetch)
watch(
  () => props.excludeIds,
  () => {
    articles.value = [];
    page.value = 1;
    hasMore.value = true;
    error.value = false;
    loadMore();
  }
);

onMounted(() => {
  loadMore();
  setupObserver();
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>

<style scoped>
/* ==================================================================
   More News — secondary editorial grid
   Horizontal card layout (image left + text right) for visual variety
=================================================================== */

.g-more-news {
  padding: 40px 0 0;
}

/* ─── Grid ─── */
.g-more-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

/* ─── Card ─── */
.g-more-card {
  display: flex;
  gap: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 16px;
  transition: border-color 0.25s ease, transform 0.25s ease;
}
.g-more-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-1px);
}

/* ─── Image ─── */
.g-more-img {
  flex-shrink: 0;
  width: 200px;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  display: block;
  background: var(--color-surface-alt);
}
.g-more-img :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.g-more-card:hover .g-more-img :deep(img) {
  transform: scale(1.05);
}

/* ─── Body ─── */
.g-more-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

/* ─── Title ─── */
.g-more-title {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}
.g-more-title a {
  color: var(--color-text);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}
.g-more-title a:hover {
  color: var(--color-accent);
}

/* ─── Excerpt ─── */
.g-more-excerpt {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ─── Meta ─── */
.g-more-meta {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-muted);
}
.g-more-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* ─── Loading more indicator ─── */
.g-more-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 0;
  font-size: 13px;
  color: var(--color-muted);
}
.g-more-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Empty / Error ─── */
.g-more-empty {
  text-align: center;
  padding: 48px 16px;
  color: var(--color-muted);
  font-size: 14px;
}
.g-more-empty .boxed-btn {
  margin-top: 16px;
}

/* ─── End of content ─── */
.g-more-end {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 28px 0 0;
}
.g-more-end span:first-child,
.g-more-end span:last-child {
  flex: 1;
  height: 1px;
  background: var(--color-border);
}
.g-more-end-text {
  font-size: 12px;
  color: var(--color-muted);
  white-space: nowrap;
}

/* ─── Sentinel (invisible scroll trigger) ─── */
.g-more-sentinel {
  height: 1px;
}

/* ─── Skeleton ─── */
.g-more-skeleton .g-more-img {
  width: 100%;
  aspect-ratio: 16 / 9;
}
.g-more-skeleton .g-more-body {
  gap: 8px;
  padding-top: 4px;
}

/* ─── Responsive: Tablet ─── */
@media (max-width: 991px) {
  .g-more-grid {
    grid-template-columns: 1fr;
  }
}

/* ─── Responsive: Mobile ─── */
@media (max-width: 640px) {
  .g-more-card {
    flex-direction: column;
    gap: 12px;
    padding: 14px;
  }
  .g-more-img {
    width: 100%;
    aspect-ratio: 16 / 9;
  }
  .g-more-title {
    font-size: 15px;
  }
  .g-more-excerpt {
    -webkit-line-clamp: 3;
  }
}

/* ─── Reduced motion ─── */
@media (prefers-reduced-motion: reduce) {
  .g-more-card,
  .g-more-img :deep(img),
  .g-more-title a {
    transition: none;
  }
  .g-more-spinner {
    animation-duration: 1.4s;
  }
}
</style>
