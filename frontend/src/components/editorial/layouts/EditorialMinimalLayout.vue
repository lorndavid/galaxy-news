<template>
  <div class="ed-minimal">
    <!-- Single article: full-width horizontal card -->
    <article v-if="articles.length === 1 && articles[0]" class="ed-minimal-single">
      <RouterLink :to="`/article/${articles[0].slug}`" class="ed-minimal-single-img">
        <ArticleThumb :src="articles[0].featuredImage" :alt="titleFn(articles[0])" :width="960" />
      </RouterLink>
      <div class="ed-minimal-single-body">
        <span class="ed-cat-chip" :style="{ background: catColor(articles[0]) }">{{ catNameFn(articles[0]) }}</span>
        <h3><RouterLink :to="`/article/${articles[0].slug}`">{{ titleFn(articles[0]) }}</RouterLink></h3>
        <p v-if="excerptFn(articles[0])" class="ed-minimal-excerpt">{{ excerptFn(articles[0]) }}</p>
        <div class="ed-minimal-meta">
          <span v-if="articles[0].publishedAt"><i class="ti-calendar"></i> {{ formatDate(articles[0].publishedAt) }}</span>
          <span v-if="articles[0].author?.name"><i class="ti-user"></i> {{ articles[0].author.name }}</span>
        </div>
      </div>
    </article>

    <!-- 2 articles: side-by-side -->
    <div v-else class="ed-minimal-two">
      <article v-for="a in articles.slice(0, 2)" :key="a.id" class="ed-minimal-card">
        <RouterLink :to="`/article/${a.slug}`" class="ed-minimal-card-img">
          <ArticleThumb :src="a.featuredImage" :alt="titleFn(a)" :width="480" />
        </RouterLink>
        <div class="ed-minimal-card-body">
          <span class="ed-cat-chip" :style="{ background: catColor(a) }">{{ catNameFn(a) }}</span>
          <h4><RouterLink :to="`/article/${a.slug}`">{{ titleFn(a) }}</RouterLink></h4>
          <span v-if="a.publishedAt" class="ed-meta">{{ formatDate(a.publishedAt) }}</span>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Article } from "@/types";
import { useLocalized } from "@/composables/useLocalized";
import ArticleThumb from "@/components/common/ArticleThumb.vue";

defineProps<{ articles: Article[] }>();
const { title: titleFn, excerpt: excerptFn, catName: catNameFn, formatDate } = useLocalized();

const CAT_COLORS = ["var(--cat-national)", "var(--cat-political)", "var(--cat-international)", "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)", "var(--cat-entertainment)"];
function catColor(a: Article) { return CAT_COLORS[a.categoryId % CAT_COLORS.length]; }
</script>

<style scoped>
.ed-minimal-single { display: flex; gap: 24px; align-items: center; padding: 16px; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); }
.ed-minimal-single-img { flex-shrink: 0; width: 40%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 6px; }
.ed-minimal-single-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.ed-minimal-single:hover .ed-minimal-single-img :deep(img) { transform: scale(1.04); }
.ed-minimal-single-body { flex: 1; min-width: 0; }
.ed-minimal-single-body h3 { margin: 8px 0 0; font-size: 20px; line-height: 1.4; }
.ed-minimal-single-body h3 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-minimal-single-body h3 a:hover { color: var(--color-accent, #4f46e5); }
.ed-minimal-excerpt { margin: 8px 0 0; font-size: 14px; line-height: 1.65; color: var(--color-muted, #6b7280); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ed-minimal-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; font-size: 12px; color: var(--color-muted, #6b7280); }
.ed-minimal-meta span { display: inline-flex; align-items: center; gap: 4px; }

@media (max-width: 768px) {
  .ed-minimal-single { flex-direction: column; gap: 14px; }
  .ed-minimal-single-img { width: 100%; }
}

.ed-minimal-two { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 640px) { .ed-minimal-two { grid-template-columns: 1fr; } }

.ed-minimal-card { overflow: hidden; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); transition: border-color 0.2s ease; }
.ed-minimal-card:hover { border-color: var(--color-accent, #4f46e5); }
.ed-minimal-card-img { display: block; aspect-ratio: 16 / 9; overflow: hidden; }
.ed-minimal-card-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
.ed-minimal-card:hover .ed-minimal-card-img :deep(img) { transform: scale(1.05); }
.ed-minimal-card-body { padding: 12px 14px 14px; }
.ed-minimal-card-body h4 { margin: 4px 0 0; font-size: 15px; line-height: 1.5; font-weight: 600; }
.ed-minimal-card-body h4 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-minimal-card-body h4 a:hover { color: var(--color-accent, #4f46e5); }

.ed-cat-chip { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; padding: 3px 10px; color: #fff; text-transform: uppercase; margin-bottom: 6px; }
.ed-meta { font-size: 12px; color: var(--color-muted, #6b7280); display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; }
</style>
