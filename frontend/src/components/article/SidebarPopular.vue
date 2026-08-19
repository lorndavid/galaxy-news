<template>
  <div class="g-popular-sidebar">
    <h3 class="g-popular-title">{{ t.home.popular }}</h3>
    <article v-for="article in articles" :key="article.id" class="g-popular-row">
      <RouterLink :to="`/article/${article.slug}`" class="g-popular-thumb">
        <ArticleThumb :src="article.featuredImage" :alt="title(article)" :width="160" />
      </RouterLink>
      <div class="g-popular-body">
        <h5>
          <RouterLink :to="`/article/${article.slug}`">{{ title(article) }}</RouterLink>
        </h5>
        <span v-if="article.publishedAt" class="g-popular-date">
          <i class="ti-calendar"></i> {{ formatKhmerDate(article.publishedAt) }}
        </span>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { Article } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import { formatKhmerDate } from "@/utils/format";
import { useLocalized } from "@/composables/useLocalized";

defineProps<{ articles: Article[] }>();
const { title, t } = useLocalized();
</script>

<style scoped>
.g-popular-sidebar {
  margin-bottom: 32px;
}

/* Title — single line under it */
.g-popular-title {
  font-family: var(--font-heading, "Noto Sans Khmer", sans-serif);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text, #111827);
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-text, #111827);
}

/* Row — small image left, text right, one black line under each */
.g-popular-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #000;
}
.g-popular-row:last-child {
  border-bottom: none;
}

/* Thumbnail (left) */
.g-popular-thumb {
  position: relative;
  flex-shrink: 0;
  width: 78px;
  aspect-ratio: 16 / 11;
  overflow: hidden;
  display: block;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
}
.g-popular-thumb :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.g-popular-row:hover .g-popular-thumb :deep(img) {
  transform: scale(1.05);
}

/* Text (right) */
.g-popular-body {
  flex: 1;
  min-width: 0;
}
.g-popular-body h5 {
  margin: 0 0 4px;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.45;
}
.g-popular-body h5 a {
  color: var(--color-text, #111827);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}
.g-popular-body h5 a:hover {
  color: var(--color-accent, #4f46e5);
}
.g-popular-date {
  font-size: 12px;
  color: var(--color-muted, #6b7280);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>