<template>
  <div class="g-trending-card">
    <RouterLink :to="`/article/${article.slug}`" class="g-trending-img">
      <ArticleThumb :src="article.featuredImage" :alt="title(article)" />
    </RouterLink>
    <div class="g-trending-body">
      <span class="g-cat-chip g-cat-chip--xs" :style="catStyle">{{ catName(article) }}</span>
      <h4>
        <RouterLink :to="`/article/${article.slug}`">{{ title(article) }}</RouterLink>
      </h4>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Article } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import { useLocalized } from "@/composables/useLocalized";

const props = defineProps<{ article: Article }>();
const { title, catName } = useLocalized();

const CAT_COLORS = [
  "var(--cat-national)", "var(--cat-political)", "var(--cat-international)",
  "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)",
  "var(--cat-entertainment)",
];
const catStyle = computed(() => ({
  background: CAT_COLORS[props.article.categoryId % CAT_COLORS.length],
}));
</script>

<style scoped>
.g-trending-card {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 18px;
}
.g-trending-img {
  flex-shrink: 0;
  width: 100px;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-card, 8px);
  overflow: hidden;
}
.g-trending-img :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}
.g-trending-card:hover .g-trending-img :deep(img) {
  transform: scale(1.05);
}
.g-trending-body {
  flex: 1;
  min-width: 0;
}
.g-cat-chip--xs {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding: 2px 8px;
  border-radius: var(--radius-badge, 4px);
  color: #fff;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.g-trending-body h4 {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  font-family: var(--font-heading, "Kantumruy Pro", "Noto Sans Khmer", sans-serif);
}
.g-trending-body h4 a {
  color: var(--color-text, #111827);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}
.g-trending-body h4 a:hover {
  color: var(--color-accent, #4f46e5);
}
</style>
