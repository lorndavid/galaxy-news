<template>
  <article class="g-news-card">
    <RouterLink :to="`/article/${article.slug}`" class="g-news-card-img">
      <ArticleThumb :src="article.featuredImage" :alt="title(article)" :width="640" />
      <span v-if="article.isBreaking" class="g-breaking">{{ t.common.breaking }}</span>
    </RouterLink>
    <div class="g-news-card-body">
      <span class="g-cat-chip" :style="catStyle">{{ catName(article) }}</span>
      <h4 class="g-news-card-title">
        <RouterLink :to="`/article/${article.slug}`">{{ title(article) }}</RouterLink>
      </h4>
      <div class="g-news-card-meta">
        <span v-if="article.publishedAt"><i class="ti-calendar"></i> {{ formatKhmerDate(article.publishedAt) }}</span>
        <span v-if="article.views >= 0"><i class="ti-eye"></i> {{ formatViews(article.views) }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Article } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import { formatKhmerDate, formatViews } from "@/utils/format";
import { useLocalized } from "@/composables/useLocalized";

const props = defineProps<{ article: Article; variant?: "default" | "compact" }>();
const { title, catName, t } = useLocalized();

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
.g-news-card {
  border-radius: var(--radius-card, 8px);
  overflow: hidden;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.g-news-card:hover {
  box-shadow: var(--shadow-elevated, 0 4px 16px rgba(0,0,0,0.08));
  transform: translateY(-2px);
}
.g-news-card-img {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}
.g-news-card-img :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.g-news-card:hover .g-news-card-img :deep(img) {
  transform: scale(1.04);
}
.g-breaking {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--color-live, #dc2626);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-badge, 4px);
  z-index: 2;
}
.g-news-card-body {
  padding: 14px 16px 16px;
}
.g-cat-chip {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding: 3px 10px;
  border-radius: var(--radius-badge, 4px);
  color: #fff;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.g-news-card-title {
  margin: 4px 0 0;
  font-size: 17px;
  line-height: 1.45;
  font-family: var(--font-heading, "Kantumruy Pro", "Noto Sans Khmer", sans-serif);
}
.g-news-card-title a {
  color: var(--color-text, #111827);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}
.g-news-card-title a:hover {
  color: var(--color-accent, #4f46e5);
}
.g-news-card-meta {
  display: flex;
  gap: 14px;
  margin-top: 8px;
  font-size: 12.5px;
  color: var(--color-muted, #6b7280);
}
.g-news-card-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
