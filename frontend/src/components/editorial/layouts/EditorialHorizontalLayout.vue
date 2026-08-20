<template>
  <div class="ed-horizontal">
    <article v-for="a in visibleArticles" :key="a.id" class="ed-horizontal-card">
      <RouterLink :to="`/article/${a.slug}`" class="ed-horizontal-img">
        <ArticleThumb :src="a.featuredImage" :alt="titleFn(a)" :width="320" />
      </RouterLink>
      <div class="ed-horizontal-body">
        <span class="ed-cat-chip" :style="{ background: catColor(a) }">{{ catNameFn(a) }}</span>
        <h4><RouterLink :to="`/article/${a.slug}`">{{ titleFn(a) }}</RouterLink></h4>
        <p v-if="excerptFn(a)" class="ed-horizontal-excerpt">{{ excerptFn(a) }}</p>
        <div class="ed-horizontal-meta">
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
const { title: titleFn, excerpt: excerptFn, catName: catNameFn, formatDate } = useLocalized();
const visibleArticles = computed(() => props.articles.slice(0, 6));

const CAT_COLORS = ["var(--cat-national)", "var(--cat-political)", "var(--cat-international)", "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)", "var(--cat-entertainment)"];
function catColor(a: Article) { return CAT_COLORS[a.categoryId % CAT_COLORS.length]; }
</script>

<style scoped>
.ed-horizontal { display: flex; flex-direction: column; gap: 16px; }
.ed-horizontal-card { display: flex; gap: 18px; padding: 14px; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); transition: border-color 0.2s ease; }
.ed-horizontal-card:hover { border-color: var(--color-accent, #4f46e5); }
.ed-horizontal-img { flex-shrink: 0; width: 200px; aspect-ratio: 16 / 10; overflow: hidden; border-radius: 4px; }
.ed-horizontal-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
.ed-horizontal-card:hover .ed-horizontal-img :deep(img) { transform: scale(1.05); }
.ed-horizontal-body { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.ed-horizontal-body h4 { margin: 4px 0 0; font-size: 16px; line-height: 1.5; font-weight: 600; }
.ed-horizontal-body h4 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-horizontal-body h4 a:hover { color: var(--color-accent, #4f46e5); }
.ed-horizontal-excerpt { margin: 4px 0 0; font-size: 13px; line-height: 1.6; color: var(--color-muted, #6b7280); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ed-horizontal-meta { display: flex; gap: 10px; margin-top: 6px; font-size: 12px; color: var(--color-muted, #6b7280); }
.ed-horizontal-meta span { display: inline-flex; align-items: center; gap: 4px; }

@media (max-width: 640px) {
  .ed-horizontal-card { flex-direction: column; gap: 12px; }
  .ed-horizontal-img { width: 100%; aspect-ratio: 16 / 9; }
  .ed-horizontal-excerpt { display: none; }
}
.ed-cat-chip { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; padding: 3px 10px; color: #fff; text-transform: uppercase; align-self: flex-start; }
</style>
