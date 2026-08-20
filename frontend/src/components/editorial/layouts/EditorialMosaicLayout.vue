<template>
  <div class="ed-mosaic">
    <div class="ed-mosaic-grid">
      <!-- Feature spans 2 cols, top row -->
      <article v-if="feature" class="ed-mosaic-feature">
        <RouterLink :to="`/article/${feature.slug}`" class="ed-mosaic-feature-img">
          <ArticleThumb :src="feature.featuredImage" :alt="titleFn(feature)" :width="640" />
        </RouterLink>
        <div class="ed-mosaic-feature-body">
          <span class="ed-cat-chip" :style="{ background: catColor(feature) }">{{ catNameFn(feature) }}</span>
          <h3><RouterLink :to="`/article/${feature.slug}`">{{ titleFn(feature) }}</RouterLink></h3>
        </div>
      </article>
      <!-- Supporting cards -->
      <article v-for="a in supportingArticles" :key="a.id" class="ed-mosaic-card">
        <RouterLink :to="`/article/${a.slug}`" class="ed-mosaic-card-img">
          <ArticleThumb :src="a.featuredImage" :alt="titleFn(a)" :width="320" />
        </RouterLink>
        <div class="ed-mosaic-card-body">
          <span class="ed-cat-chip ed-cat-chip--xs" :style="{ background: catColor(a) }">{{ catNameFn(a) }}</span>
          <h4><RouterLink :to="`/article/${a.slug}`">{{ titleFn(a) }}</RouterLink></h4>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Article } from "@/types";
import { useLocalized } from "@/composables/useLocalized";
import ArticleThumb from "@/components/common/ArticleThumb.vue";

const props = defineProps<{ articles: Article[] }>();
const { title: titleFn, catName: catNameFn } = useLocalized();

const feature = computed(() => props.articles[0] ?? null);
const supportingArticles = computed(() => props.articles.slice(1, 5));

const CAT_COLORS = ["var(--cat-national)", "var(--cat-political)", "var(--cat-international)", "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)", "var(--cat-entertainment)"];
function catColor(a: Article) { return CAT_COLORS[a.categoryId % CAT_COLORS.length]; }
</script>

<style scoped>
.ed-mosaic-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 16px;
}
.ed-mosaic-feature { grid-column: 1; grid-row: 1 / 3; }
.ed-mosaic-card { display: flex; flex-direction: column; }

@media (max-width: 991px) {
  .ed-mosaic-grid { grid-template-columns: 1fr 1fr; }
  .ed-mosaic-feature { grid-column: 1 / 3; grid-row: auto; }
}
@media (max-width: 640px) {
  .ed-mosaic-grid { grid-template-columns: 1fr; }
  .ed-mosaic-feature { grid-column: 1; }
}

.ed-mosaic-feature { overflow: hidden; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); }
.ed-mosaic-feature-img { display: block; aspect-ratio: 16 / 9; overflow: hidden; }
.ed-mosaic-feature-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.ed-mosaic-feature:hover .ed-mosaic-feature-img :deep(img) { transform: scale(1.04); }
.ed-mosaic-feature-body { padding: 14px 16px 16px; }
.ed-mosaic-feature-body h3 { margin: 8px 0 0; font-size: 18px; line-height: 1.45; }
.ed-mosaic-feature-body h3 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-mosaic-feature-body h3 a:hover { color: var(--color-accent, #4f46e5); }

.ed-mosaic-card { overflow: hidden; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); transition: border-color 0.2s ease; }
.ed-mosaic-card:hover { border-color: var(--color-accent, #4f46e5); }
.ed-mosaic-card-img { display: block; aspect-ratio: 16 / 9; overflow: hidden; }
.ed-mosaic-card-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
.ed-mosaic-card:hover .ed-mosaic-card-img :deep(img) { transform: scale(1.05); }
.ed-mosaic-card-body { padding: 12px 14px 14px; }
.ed-mosaic-card-body h4 { margin: 0; font-size: 14px; line-height: 1.5; font-weight: 600; }
.ed-mosaic-card-body h4 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-mosaic-card-body h4 a:hover { color: var(--color-accent, #4f46e5); }

.ed-cat-chip { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; padding: 3px 10px; color: #fff; text-transform: uppercase; }
.ed-cat-chip--xs { font-size: 9.5px; padding: 2px 8px; margin-bottom: 4px; }
</style>
