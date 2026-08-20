<template>
  <div class="ed-fc">
    <div class="ed-fc-grid">
      <article v-if="feature" class="ed-fc-feature">
        <RouterLink :to="`/article/${feature.slug}`" class="ed-fc-feature-img">
          <ArticleThumb :src="feature.featuredImage" :alt="titleFn(feature)" :width="640" />
        </RouterLink>
        <div class="ed-fc-feature-body">
          <span class="ed-cat-chip" :style="{ background: catColor(feature) }">{{ catNameFn(feature) }}</span>
          <h3><RouterLink :to="`/article/${feature.slug}`">{{ titleFn(feature) }}</RouterLink></h3>
          <p v-if="excerptFn(feature)" class="ed-fc-feature-excerpt">{{ excerptFn(feature) }}</p>
        </div>
      </article>
      <div class="ed-fc-list">
        <article v-for="a in sideArticles" :key="a.id" class="ed-fc-list-card">
          <RouterLink :to="`/article/${a.slug}`" class="ed-fc-list-img">
            <ArticleThumb :src="a.featuredImage" :alt="titleFn(a)" :width="160" />
          </RouterLink>
          <div class="ed-fc-list-body">
            <h4><RouterLink :to="`/article/${a.slug}`">{{ titleFn(a) }}</RouterLink></h4>
            <span v-if="a.publishedAt" class="ed-meta">{{ formatDate(a.publishedAt) }}</span>
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
const { title: titleFn, excerpt: excerptFn, catName: catNameFn, formatDate } = useLocalized();

const feature = computed(() => props.articles[0] ?? null);
const sideArticles = computed(() => props.articles.slice(1, 5));

const CAT_COLORS = ["var(--cat-national)", "var(--cat-political)", "var(--cat-international)", "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)", "var(--cat-entertainment)"];
function catColor(a: Article) { return CAT_COLORS[a.categoryId % CAT_COLORS.length]; }
</script>

<style scoped>
.ed-fc-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
@media (max-width: 768px) { .ed-fc-grid { grid-template-columns: 1fr; } }

.ed-fc-feature { overflow: hidden; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); }
.ed-fc-feature-img { display: block; aspect-ratio: 16 / 9; overflow: hidden; }
.ed-fc-feature-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.ed-fc-feature:hover .ed-fc-feature-img :deep(img) { transform: scale(1.04); }
.ed-fc-feature-body { padding: 14px 16px 16px; }
.ed-fc-feature-body h3 { margin: 8px 0 0; font-size: 18px; line-height: 1.45; }
.ed-fc-feature-body h3 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-fc-feature-body h3 a:hover { color: var(--color-accent, #4f46e5); }
.ed-fc-feature-excerpt { margin: 6px 0 0; font-size: 13px; line-height: 1.6; color: var(--color-muted, #6b7280); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.ed-fc-list { display: flex; flex-direction: column; gap: 12px; }
.ed-fc-list-card { display: flex; gap: 12px; padding: 10px; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); transition: border-color 0.2s ease; }
.ed-fc-list-card:hover { border-color: var(--color-accent, #4f46e5); }
.ed-fc-list-img { flex-shrink: 0; width: 100px; aspect-ratio: 4 / 3; overflow: hidden; border-radius: 4px; }
.ed-fc-list-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
.ed-fc-list-card:hover .ed-fc-list-img :deep(img) { transform: scale(1.05); }
.ed-fc-list-body { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
.ed-fc-list-body h4 { margin: 0; font-size: 14px; line-height: 1.5; font-weight: 600; }
.ed-fc-list-body h4 a { color: var(--color-text, #111827); text-decoration: none; transition: color 0.2s ease; }
.ed-fc-list-body h4 a:hover { color: var(--color-accent, #4f46e5); }

.ed-cat-chip { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; padding: 3px 10px; color: #fff; text-transform: uppercase; margin-bottom: 6px; }
.ed-meta { font-size: 12px; color: var(--color-muted, #6b7280); display: inline-flex; align-items: center; gap: 4px; }
</style>
