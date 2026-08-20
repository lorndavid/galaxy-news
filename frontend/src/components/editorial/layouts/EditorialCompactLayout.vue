<template>
  <div class="ed-compact">
    <article v-for="a in visibleArticles" :key="a.id" class="ed-compact-card">
      <RouterLink :to="`/article/${a.slug}`" class="ed-compact-img">
        <ArticleThumb :src="a.featuredImage" :alt="titleFn(a)" :width="320" />
      </RouterLink>
      <div class="ed-compact-body">
        <span class="ed-cat-chip" :style="{ background: catColor(a) }">{{ catNameFn(a) }}</span>
        <h4><RouterLink :to="`/article/${a.slug}`">{{ titleFn(a) }}</RouterLink></h4>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Article } from "@/types";
import { useLocalized } from "@/composables/useLocalized";
import ArticleThumb from "@/components/common/ArticleThumb.vue";

const props = defineProps<{ articles: Article[] }>();
const { title: titleFn, catName: catNameFn } = useLocalized();
const visibleArticles = computed(() => props.articles.slice(0, 8));

const CAT_COLORS = ["var(--cat-national)", "var(--cat-political)", "var(--cat-international)", "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)", "var(--cat-entertainment)"];
function catColor(a: Article) { return CAT_COLORS[a.categoryId % CAT_COLORS.length]; }
</script>

<style scoped>
.ed-compact { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 991px) { .ed-compact { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px) { .ed-compact { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .ed-compact { grid-template-columns: 1fr 1fr; gap: 12px; } }

.ed-compact-card { overflow: hidden; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); transition: border-color 0.2s ease, transform 0.2s ease; }
.ed-compact-card:hover { border-color: var(--color-accent, #4f46e5); transform: translateY(-1px); }
.ed-compact-img { display: block; aspect-ratio: 16 / 9; overflow: hidden; }
.ed-compact-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
.ed-compact-card:hover .ed-compact-img :deep(img) { transform: scale(1.05); }
.ed-compact-body { padding: 10px 12px 12px; }
.ed-compact-body h4 { margin: 0; font-size: 13.5px; line-height: 1.45; font-weight: 600; }
.ed-compact-body h4 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-compact-body h4 a:hover { color: var(--color-accent, #4f46e5); }
.ed-cat-chip { display: inline-block; font-size: 9.5px; font-weight: 700; letter-spacing: 0.04em; padding: 2px 8px; color: #fff; text-transform: uppercase; margin-bottom: 4px; }
</style>
