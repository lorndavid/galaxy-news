<template>
  <div class="ed-mag">
    <div class="ed-mag-grid">
      <article v-if="feature" class="ed-mag-feature">
        <RouterLink :to="`/article/${feature.slug}`" class="ed-mag-feature-img">
          <ArticleThumb :src="feature.featuredImage" :alt="titleFn(feature)" :width="640" />
        </RouterLink>
        <div class="ed-mag-feature-body">
          <span class="ed-cat-chip" :style="{ background: catColor(feature) }">{{ catNameFn(feature) }}</span>
          <h3><RouterLink :to="`/article/${feature.slug}`">{{ titleFn(feature) }}</RouterLink></h3>
        </div>
      </article>
      <article v-for="a in rightArticles" :key="a.id" class="ed-mag-card">
        <RouterLink :to="`/article/${a.slug}`" class="ed-mag-card-img">
          <ArticleThumb :src="a.featuredImage" :alt="titleFn(a)" :width="320" />
        </RouterLink>
        <div class="ed-mag-card-body">
          <h4><RouterLink :to="`/article/${a.slug}`">{{ titleFn(a) }}</RouterLink></h4>
        </div>
      </article>
    </div>
    <div v-if="bottomArticles.length" class="ed-mag-bottom">
      <article v-for="a in bottomArticles" :key="a.id" class="ed-mag-bottom-card">
        <RouterLink :to="`/article/${a.slug}`" class="ed-mag-bottom-img">
          <ArticleThumb :src="a.featuredImage" :alt="titleFn(a)" :width="320" />
        </RouterLink>
        <div class="ed-mag-bottom-body">
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
const rightArticles = computed(() => props.articles.slice(1, 3));
const bottomArticles = computed(() => props.articles.slice(3, 5));

const CAT_COLORS = ["var(--cat-national)", "var(--cat-political)", "var(--cat-international)", "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)", "var(--cat-entertainment)"];
function catColor(a: Article) { return CAT_COLORS[a.categoryId % CAT_COLORS.length]; }
</script>

<style scoped>
.ed-mag-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.ed-mag-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }

@media (max-width: 768px) {
  .ed-mag-grid { grid-template-columns: 1fr; }
  .ed-mag-bottom { grid-template-columns: 1fr; }
}

.ed-mag-feature { overflow: hidden; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); }
.ed-mag-feature-img { display: block; aspect-ratio: 16 / 9; overflow: hidden; }
.ed-mag-feature-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.ed-mag-feature:hover .ed-mag-feature-img :deep(img) { transform: scale(1.04); }
.ed-mag-feature-body { padding: 14px 16px 16px; }
.ed-mag-feature-body h3 { margin: 8px 0 0; font-size: 17px; line-height: 1.45; }
.ed-mag-feature-body h3 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-mag-feature-body h3 a:hover { color: var(--color-accent, #4f46e5); }

.ed-mag-card { display: flex; gap: 12px; padding: 12px; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); transition: border-color 0.2s ease; }
.ed-mag-card:hover { border-color: var(--color-accent, #4f46e5); }
.ed-mag-card-img { flex-shrink: 0; width: 100px; aspect-ratio: 4 / 3; overflow: hidden; border-radius: 4px; }
.ed-mag-card-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
.ed-mag-card:hover .ed-mag-card-img :deep(img) { transform: scale(1.05); }
.ed-mag-card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.ed-mag-card-body h4 { margin: 0; font-size: 14px; line-height: 1.5; font-weight: 600; }
.ed-mag-card-body h4 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-mag-card-body h4 a:hover { color: var(--color-accent, #4f46e5); }

.ed-mag-bottom-card { overflow: hidden; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); transition: border-color 0.2s ease; }
.ed-mag-bottom-card:hover { border-color: var(--color-accent, #4f46e5); }
.ed-mag-bottom-img { display: block; aspect-ratio: 16 / 9; overflow: hidden; }
.ed-mag-bottom-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
.ed-mag-bottom-card:hover .ed-mag-bottom-img :deep(img) { transform: scale(1.05); }
.ed-mag-bottom-body { padding: 10px 12px 12px; }
.ed-mag-bottom-body h4 { margin: 0; font-size: 14px; line-height: 1.5; font-weight: 600; }
.ed-mag-bottom-body h4 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-mag-bottom-body h4 a:hover { color: var(--color-accent, #4f46e5); }

.ed-cat-chip { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; padding: 3px 10px; color: #fff; text-transform: uppercase; margin-bottom: 4px; }
.ed-cat-chip--xs { font-size: 9.5px; padding: 2px 8px; margin-bottom: 4px; }
</style>
