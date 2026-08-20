<template>
  <div class="ed-list">
    <article v-for="a in visibleArticles" :key="a.id" class="ed-list-card">
      <RouterLink :to="`/article/${a.slug}`" class="ed-list-img">
        <ArticleThumb :src="a.featuredImage" :alt="titleFn(a)" :width="320" />
      </RouterLink>
      <div class="ed-list-body">
        <span class="ed-cat-chip" :style="{ background: catColor(a) }">{{ catNameFn(a) }}</span>
        <h4><RouterLink :to="`/article/${a.slug}`">{{ titleFn(a) }}</RouterLink></h4>
        <div class="ed-list-meta">
          <span v-if="a.publishedAt"><i class="ti-calendar"></i> {{ formatDate(a.publishedAt) }}</span>
          <span v-if="a.author?.name"><i class="ti-user"></i> {{ a.author.name }}</span>
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
const visibleArticles = computed(() => props.articles.slice(0, 8));

const CAT_COLORS = ["var(--cat-national)", "var(--cat-political)", "var(--cat-international)", "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)", "var(--cat-entertainment)"];
function catColor(a: Article) { return CAT_COLORS[a.categoryId % CAT_COLORS.length]; }
</script>

<style scoped>
.ed-list { display: flex; flex-direction: column; }
.ed-list-card { display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--color-border, #e5e7eb); transition: background 0.15s ease; }
.ed-list-card:last-child { border-bottom: none; }
.ed-list-img { flex-shrink: 0; width: 180px; aspect-ratio: 16 / 10; overflow: hidden; border-radius: 6px; }
.ed-list-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
.ed-list-card:hover .ed-list-img :deep(img) { transform: scale(1.05); }
.ed-list-body { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.ed-list-body h4 { margin: 4px 0 0; font-size: 16px; line-height: 1.5; font-weight: 600; }
.ed-list-body h4 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-list-body h4 a:hover { color: var(--color-accent, #4f46e5); }
.ed-list-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; font-size: 12px; color: var(--color-muted, #6b7280); }
.ed-list-meta span { display: inline-flex; align-items: center; gap: 4px; }

@media (max-width: 640px) {
  .ed-list-img { width: 110px; border-radius: 4px; }
  .ed-list-body h4 { font-size: 14.5px; }
}
.ed-cat-chip { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; padding: 2px 8px; color: #fff; text-transform: uppercase; align-self: flex-start; }
</style>
