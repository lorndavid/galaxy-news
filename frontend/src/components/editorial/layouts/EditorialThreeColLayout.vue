<template>
  <div class="ed-3col">
    <article v-for="a in visibleArticles" :key="a.id" class="ed-3col-card">
      <RouterLink :to="`/article/${a.slug}`" class="ed-3col-img">
        <ArticleThumb :src="a.featuredImage" :alt="titleFn(a)" :width="480" />
      </RouterLink>
      <div class="ed-3col-body">
        <span class="ed-cat-chip" :style="{ background: catColor(a) }">{{ catNameFn(a) }}</span>
        <h4><RouterLink :to="`/article/${a.slug}`">{{ titleFn(a) }}</RouterLink></h4>
        <div class="ed-3col-meta">
          <span v-if="a.publishedAt"><i class="ti-calendar"></i> {{ formatDate(a.publishedAt) }}</span>
        </div>
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
const { title: titleFn, catName: catNameFn, formatDate } = useLocalized();
const visibleArticles = computed(() => props.articles.slice(0, 6));

const CAT_COLORS = ["var(--cat-national)", "var(--cat-political)", "var(--cat-international)", "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)", "var(--cat-entertainment)"];
function catColor(a: Article) { return CAT_COLORS[a.categoryId % CAT_COLORS.length]; }
</script>

<style scoped>
.ed-3col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
@media (max-width: 768px) { .ed-3col { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .ed-3col { grid-template-columns: 1fr; } }

.ed-3col-card { overflow: hidden; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); transition: border-color 0.25s ease, transform 0.25s ease; }
.ed-3col-card:hover { border-color: var(--color-accent, #4f46e5); transform: translateY(-2px); }
.ed-3col-img { display: block; aspect-ratio: 16 / 9; overflow: hidden; }
.ed-3col-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.ed-3col-card:hover .ed-3col-img :deep(img) { transform: scale(1.05); }
.ed-3col-body { padding: 14px 16px 16px; }
.ed-3col-body h4 { margin: 6px 0 0; font-size: 15px; line-height: 1.5; font-weight: 600; }
.ed-3col-body h4 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-3col-body h4 a:hover { color: var(--color-accent, #4f46e5); }
.ed-3col-meta { display: flex; gap: 10px; margin-top: 8px; font-size: 12px; color: var(--color-muted, #6b7280); }
.ed-3col-meta span { display: inline-flex; align-items: center; gap: 4px; }
.ed-cat-chip { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; padding: 3px 10px; color: #fff; text-transform: uppercase; margin-bottom: 6px; }
</style>
