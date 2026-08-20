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
        <span v-if="article.publishedAt"><i class="ti-calendar"></i> {{ formatDate(article.publishedAt) }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Article } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import { useLocalized } from "@/composables/useLocalized";

const props = defineProps<{ article: Article; variant?: "default" | "compact" }>();
const { title, catName, t, formatDate } = useLocalized();

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
  border-radius: var(--radius-card, 10px);
  overflow: hidden;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
  display: flex;
  flex-direction: column;
}
.g-news-card:hover {
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.10);
  transform: translateY(-3px);
  border-color: var(--color-accent, #fc3f00);
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
  transition: transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.g-news-card:hover .g-news-card-img :deep(img) {
  transform: scale(1.06);
}
.g-breaking {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--color-live, #dc2626);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: var(--radius-badge, 4px);
  z-index: 2;
}
.g-news-card-body {
  padding: 14px 16px 18px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.g-cat-chip {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 3px 10px;
  border-radius: var(--radius-badge, 4px);
  color: #fff;
  text-transform: uppercase;
  margin-bottom: 8px;
  align-self: flex-start;
}
.g-news-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
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
  color: var(--color-accent, #fc3f00);
}
.g-news-card-meta {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 10px;
  font-size: 12px;
  color: var(--color-muted, #6b7280);
  border-top: 1px solid var(--color-border, #f1f5f9);
}
.g-news-card-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
