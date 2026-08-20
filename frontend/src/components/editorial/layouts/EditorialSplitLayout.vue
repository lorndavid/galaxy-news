<template>
  <div class="ed-split">
    <div class="ed-split-grid">
      <div class="ed-split-left">
        <article v-if="leftFeature" class="ed-split-feature">
          <RouterLink :to="`/article/${leftFeature.slug}`" class="ed-split-feature-img">
            <ArticleThumb :src="leftFeature.featuredImage" :alt="titleFn(leftFeature)" :width="640" />
          </RouterLink>
          <div class="ed-split-feature-body">
            <span class="ed-cat-chip" :style="{ background: catColor(leftFeature) }">{{ catNameFn(leftFeature) }}</span>
            <h3><RouterLink :to="`/article/${leftFeature.slug}`">{{ titleFn(leftFeature) }}</RouterLink></h3>
            <span v-if="leftFeature.publishedAt" class="ed-meta"><i class="ti-calendar"></i> {{ formatDate(leftFeature.publishedAt) }}</span>
          </div>
        </article>
      </div>
      <div class="ed-split-right">
        <article v-for="a in rightArticles" :key="a.id" class="ed-split-card">
          <RouterLink :to="`/article/${a.slug}`" class="ed-split-card-img">
            <ArticleThumb :src="a.featuredImage" :alt="titleFn(a)" :width="320" />
          </RouterLink>
          <div class="ed-split-card-body">
            <span class="ed-cat-chip ed-cat-chip--xs" :style="{ background: catColor(a) }">{{ catNameFn(a) }}</span>
            <h4><RouterLink :to="`/article/${a.slug}`">{{ titleFn(a) }}</RouterLink></h4>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Article } from "@/types";
import { useLocalized } from "@/composables/useLocalized";
import ArticleThumb from "@/components/common/ArticleThumb.vue";

const props = defineProps<{ articles: Article[] }>();
const { title: titleFn, catName: catNameFn, formatDate } = useLocalized();

const leftFeature = computed(() => props.articles[0] ?? null);
const rightArticles = computed(() => props.articles.slice(1, 4));

const CAT_COLORS = ["var(--cat-national)", "var(--cat-political)", "var(--cat-international)", "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)", "var(--cat-entertainment)"];
function catColor(a: Article) { return CAT_COLORS[a.categoryId % CAT_COLORS.length]; }
</script>

<style scoped>
.ed-split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
@media (max-width: 768px) { .ed-split-grid { grid-template-columns: 1fr; } }

.ed-split-feature { overflow: hidden; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); }
.ed-split-feature-img { display: block; aspect-ratio: 16 / 9; overflow: hidden; }
.ed-split-feature-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.ed-split-feature:hover .ed-split-feature-img :deep(img) { transform: scale(1.04); }
.ed-split-feature-body { padding: 14px 16px 16px; }
.ed-split-feature-body h3 { margin: 8px 0 0; font-size: 18px; line-height: 1.45; }
.ed-split-feature-body h3 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-split-feature-body h3 a:hover { color: var(--color-accent, #4f46e5); }

.ed-split-right { display: flex; flex-direction: column; gap: 16px; }
.ed-split-card { display: flex; gap: 14px; align-items: flex-start; padding: 12px; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); transition: border-color 0.2s ease; }
.ed-split-card:hover { border-color: var(--color-accent, #4f46e5); }
.ed-split-card-img { flex-shrink: 0; width: 140px; aspect-ratio: 16 / 10; overflow: hidden; }
.ed-split-card-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
.ed-split-card:hover .ed-split-card-img :deep(img) { transform: scale(1.05); }
.ed-split-card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.ed-split-card-body h4 { margin: 0; font-size: 15px; line-height: 1.5; font-weight: 600; }
.ed-split-card-body h4 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-split-card-body h4 a:hover { color: var(--color-accent, #4f46e5); }

@media (max-width: 768px) {
  .ed-split-card-img { width: 110px; }
}
.ed-breaking { position: absolute; top: 10px; left: 10px; background: var(--color-live, #dc2626); color: #fff; font-size: 10.5px; font-weight: 700; padding: 3px 10px; z-index: 2; }
.ed-cat-chip { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; padding: 3px 10px; color: #fff; text-transform: uppercase; }
.ed-cat-chip--xs { font-size: 9.5px; padding: 2px 8px; margin-bottom: 4px; }
.ed-meta { font-size: 12px; color: var(--color-muted, #6b7280); display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; }
</style>
